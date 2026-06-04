export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import {
  upsertBusinessCustomer,
  addBusinessOrder,
  upsertRevenueRow,
} from '@/lib/db-business';
import { createNotifications } from '@/lib/notifications';

function fmtTime(t) {
  if (!t) return '';
  if (typeof t === 'string') return t.slice(0, 5);
  const h = String(t.hours ?? 0).padStart(2, '0');
  const m = String(t.minutes ?? 0).padStart(2, '0');
  return `${h}:${m}`;
}

async function getUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('ss_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { court_id, booking_date, start_time, end_time, total_price, notes } = body;

    if (!court_id || !booking_date || !start_time || !end_time || !total_price) {
      return NextResponse.json({ error: 'Missing required booking fields' }, { status: 400 });
    }

    // Conflict check
    const conflicts = await query(
      `SELECT id FROM bookings
       WHERE court_id = ? AND booking_date = ? AND status != 'cancelled'
         AND ((start_time < ? AND end_time > ?) OR (start_time >= ? AND start_time < ?))`,
      [court_id, booking_date, end_time, start_time, start_time, end_time]
    );

    if (conflicts.length > 0) {
      return NextResponse.json({ error: 'Time slot already booked' }, { status: 409 });
    }

    // Calculate duration
    const [sh, sm] = start_time.split(':').map(Number);
    const [eh, em] = end_time.split(':').map(Number);
    const durationHours = (eh * 60 + em - (sh * 60 + sm)) / 60;

    const result = await query(
      `INSERT INTO bookings (court_id, user_id, booking_date, start_time, end_time, total_price, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [
        court_id,
        user.id,
        booking_date,
        start_time,
        end_time,
        total_price,
        notes || null,
      ]
    );

    const bookingId = result.insertId;

    // Mirror to business DB
    try {
      const courts = await query(
        `SELECT c.*, o.business_db_name, o.user_id AS owner_user_id, u.full_name, u.email, u.phone
         FROM courts c
         LEFT JOIN owners o ON o.id = c.owner_id
         LEFT JOIN users u ON u.id = ?
         WHERE c.id = ?`,
        [user.id, court_id]
      );

      if (courts.length > 0) {
        const court = courts[0];
        if (court.business_db_name) {
          try {
            const custId = await upsertBusinessCustomer(
              court.business_db_name,
              user.id,
              court.full_name,
              court.email,
              court.phone,
              1,
              total_price
            );

            await addBusinessOrder(court.business_db_name, {
              platformBookingId: bookingId,
              productId: court_id,
              customerId: custId,
              bookingDate: booking_date,
              startTime: start_time,
              endTime: end_time,
              durationHours,
              totalPrice: total_price,
              status: 'pending',
              notes: notes || null,
            });

            await upsertRevenueRow(court.business_db_name, booking_date, total_price, false);
          } catch (bizErr) {
            console.error('Business DB mirror error (non-fatal):', bizErr);
          }
        }

        await createNotifications([
          {
            userId: user.id,
            actorId: court.owner_user_id,
            type: 'booking_created',
            title: 'Booking request sent',
            message: `${court.name} is waiting for confirmation on ${booking_date} at ${fmtTime(start_time)}.`,
            linkUrl: '/dashboard/customer',
            metadata: { booking_id: bookingId, court_id, status: 'pending' },
          },
          court.owner_user_id && {
            userId: court.owner_user_id,
            actorId: user.id,
            type: 'booking_created',
            title: 'New booking request',
            message: `${court.full_name} requested ${court.name} on ${booking_date} at ${fmtTime(start_time)}.`,
            linkUrl: '/dashboard/owner',
            metadata: { booking_id: bookingId, court_id, status: 'pending' },
          },
        ]);
      }
    } catch (notificationErr) {
      console.error('Booking notification error (non-fatal):', notificationErr);
    }

    return NextResponse.json({ booking_id: bookingId }, { status: 201 });
  } catch (err) {
    console.error('Booking POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || user.id;

    // Only allow seeing own bookings unless admin
    if (String(userId) !== String(user.id) && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const bookings = await query(
      `SELECT b.*,
              c.name as court_name, c.location, c.city, c.sport, c.price_per_hour,
              o.business_name
       FROM bookings b
       LEFT JOIN courts c ON c.id = b.court_id
       LEFT JOIN owners o ON o.id = c.owner_id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC, b.start_time DESC`,
      [userId]
    );

    const formatted = bookings.map((b) => ({
      ...b,
      booking_date: b.booking_date instanceof Date
        ? b.booking_date.toISOString().split('T')[0]
        : b.booking_date,
      start_time: fmtTime(b.start_time),
      end_time: fmtTime(b.end_time),
    }));

    return NextResponse.json({ bookings: formatted });
  } catch (err) {
    console.error('Bookings GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
