export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { createGopayTxn, settleGopayTxn, getGopayTxns } from '@/lib/db-finance';

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
    const transactions = await getGopayTxns(limit);
    return NextResponse.json({ transactions });
  } catch (err) {
    console.error('GoPay GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { booking_id, user_id, phone_number, amount } = await request.json();

    if (!booking_id || !amount) {
      return NextResponse.json({ error: 'booking_id and amount are required' }, { status: 400 });
    }

    const txn = await createGopayTxn(
      booking_id,
      user_id || user.id,
      phone_number,
      amount
    );

    return NextResponse.json({ transaction: txn }, { status: 201 });
  } catch (err) {
    console.error('GoPay POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { gopay_order_id, gopay_txn_id } = await request.json();

    if (!gopay_order_id) {
      return NextResponse.json({ error: 'gopay_order_id is required' }, { status: 400 });
    }

    const txn = await settleGopayTxn(gopay_order_id, gopay_txn_id, {});
    return NextResponse.json({ transaction: txn });
  } catch (err) {
    console.error('GoPay PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
