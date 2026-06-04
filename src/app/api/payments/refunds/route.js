export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getRefunds, createRefund } from '@/lib/db-finance';

async function getUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('ss_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const refunds = await getRefunds(limit);
    return NextResponse.json({ refunds });
  } catch (err) {
    console.error('Refunds GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { payment_id, booking_id, channel, amount, reason, admin_user_id } = await request.json();

    if (!payment_id || !booking_id || !channel || !amount || !reason) {
      return NextResponse.json({ error: 'All refund fields are required' }, { status: 400 });
    }

    const refund = await createRefund(
      payment_id,
      booking_id,
      channel,
      amount,
      reason,
      admin_user_id || user.id
    );

    return NextResponse.json({ refund }, { status: 201 });
  } catch (err) {
    console.error('Refunds POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
