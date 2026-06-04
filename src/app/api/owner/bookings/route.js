export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

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

export async function GET() {
  try {
    const user = await getUser();
    if (!user || !['owner', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Owner access required' }, { status: 403 });
    }

    const bookings = await query(
      `SELECT b.*,
              c.name as court_name, c.location, c.city, c.sport,
              u.full_name as customer_name, u.email as customer_email, u.phone as customer_phone
       FROM bookings b
       JOIN courts c ON c.id = b.court_id
       LEFT JOIN owners o ON o.id = c.owner_id
       LEFT JOIN users u ON u.id = b.user_id
       WHERE o.user_id = ?
       ORDER BY b.booking_date DESC, b.start_time DESC`,
      [user.id]
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
    console.error('Owner bookings GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
