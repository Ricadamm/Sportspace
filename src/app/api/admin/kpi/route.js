export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

async function getUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('ss_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const [customers, businesses, courts, bookings, revenue] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM users WHERE role = 'customer'`),
      query(`SELECT COUNT(*) as count FROM owners`),
      query(`SELECT COUNT(*) as count FROM courts WHERE is_active = 1`),
      query(`SELECT COUNT(*) as count FROM bookings`),
      query(
        `SELECT COALESCE(SUM(total_price), 0) as total FROM bookings WHERE status = 'confirmed'`
      ),
    ]);

    return NextResponse.json({
      total_customers: customers[0]?.count || 0,
      total_businesses: businesses[0]?.count || 0,
      active_courts: courts[0]?.count || 0,
      total_bookings: bookings[0]?.count || 0,
      platform_revenue: revenue[0]?.total || 0,
    });
  } catch (err) {
    console.error('Admin KPI error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
