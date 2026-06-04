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

    const businesses = await query(
      `SELECT o.*,
              u.full_name as owner_name,
              u.email as owner_email,
              u.phone as owner_phone,
              COUNT(DISTINCT c.id) as court_count,
              COUNT(DISTINCT b.id) as booking_count
       FROM owners o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN courts c ON c.owner_id = o.user_id
       LEFT JOIN bookings b ON b.court_id = c.id
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    );

    return NextResponse.json({ businesses });
  } catch (err) {
    console.error('Admin businesses error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
