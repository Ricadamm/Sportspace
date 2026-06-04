export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { addBusinessOrder, upsertRevenueRow } from '@/lib/db-business';

async function getUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('ss_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function PATCH(request, { params }) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { status } = await request.json();

    const validStatuses = ['pending', 'confirmed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Fetch the booking
    const bookings = await query(
      `SELECT b.*, c.owner_id, o.user_id AS owner_user_id, o.business_db_name
       FROM bookings b
       LEFT JOIN courts c ON c.id = b.court_id
       LEFT JOIN owners o ON o.id = c.owner_id
       WHERE b.id = ? LIMIT 1`,
      [id]
    );

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookings[0];

    // Auth check: user can cancel own booking, owner can confirm/cancel their court's bookings, admin can do all
    const isOwner = String(booking.owner_user_id) === String(user.id);
    const isCustomer = String(booking.user_id) === String(user.id);
    const isAdmin = user.role === 'admin';

    if (!isAdmin && !isOwner && !isCustomer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await query(`UPDATE bookings SET status = ? WHERE id = ?`, [status, id]);

    // Mirror to business DB
    if (booking.business_db_name) {
      try {
        await addBusinessOrder(booking.business_db_name, {
          platformBookingId: id,
          productId: booking.court_id,
          customerId: null, // will be looked up
          bookingDate: booking.booking_date,
          startTime: booking.start_time,
          endTime: booking.end_time,
          durationHours: booking.duration_hours,
          totalPrice: booking.total_price,
          status,
          notes: booking.notes,
        });

        if (status === 'cancelled') {
          const bookingDate = booking.booking_date instanceof Date
            ? booking.booking_date.toISOString().split('T')[0]
            : booking.booking_date;
          await upsertRevenueRow(booking.business_db_name, bookingDate, booking.total_price, true);
        }
      } catch (bizErr) {
        console.error('Business DB status sync error (non-fatal):', bizErr);
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error('Booking PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
