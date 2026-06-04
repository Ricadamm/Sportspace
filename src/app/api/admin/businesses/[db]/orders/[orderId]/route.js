export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { runBusinessQuery } from '@/lib/db-business';
import { createNotifications, formatBookingDate, formatBookingTime } from '@/lib/notifications';

async function getUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('ss_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function PATCH(request, { params }) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { db, orderId } = params;
    const { status } = await request.json();

    const validStatuses = ['pending', 'confirmed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update in business DB
    await runBusinessQuery(
      db,
      `UPDATE orders SET status = ? WHERE id = ?`,
      [status, orderId]
    );

    // Get platform_booking_id from business DB
    const bizOrders = await runBusinessQuery(
      db,
      `SELECT platform_booking_id FROM orders WHERE id = ? LIMIT 1`,
      [orderId]
    );

    if (bizOrders.length > 0 && bizOrders[0].platform_booking_id) {
      const platformBookingId = bizOrders[0].platform_booking_id;
      await query(
        `UPDATE bookings SET status = ? WHERE id = ?`,
        [status, platformBookingId]
      );

      const bookings = await query(
        `SELECT b.*, c.name AS court_name, o.user_id AS owner_user_id
         FROM bookings b
         LEFT JOIN courts c ON c.id = b.court_id
         LEFT JOIN owners o ON o.id = c.owner_id
         WHERE b.id = ? LIMIT 1`,
        [platformBookingId]
      );

      if (bookings.length > 0) {
        const booking = bookings[0];
        const bookingDate = formatBookingDate(booking.booking_date);
        const bookingTime = formatBookingTime(booking.start_time);

        await createNotifications([
          {
            userId: booking.user_id,
            actorId: user.id,
            type: 'booking_status',
            title: `Booking ${status}`,
            message: `Admin updated your ${booking.court_name} booking on ${bookingDate} at ${bookingTime} to ${status}.`,
            linkUrl: '/dashboard/customer',
            metadata: { booking_id: Number(platformBookingId), court_id: booking.court_id, status },
          },
          booking.owner_user_id && {
            userId: booking.owner_user_id,
            actorId: user.id,
            type: 'booking_status',
            title: `Booking ${status}`,
            message: `Admin updated a ${booking.court_name} booking on ${bookingDate} at ${bookingTime} to ${status}.`,
            linkUrl: '/dashboard/owner',
            metadata: { booking_id: Number(platformBookingId), court_id: booking.court_id, status },
          },
        ]);
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error('Business order PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
