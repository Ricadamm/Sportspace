export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { runBusinessQuery } from '@/lib/db-business';

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
      await query(
        `UPDATE bookings SET status = ? WHERE id = ?`,
        [status, bizOrders[0].platform_booking_id]
      );
    }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error('Business order PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
