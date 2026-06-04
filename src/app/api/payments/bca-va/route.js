export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { createBcaVaTxn, confirmBcaVa, getBcaVaTxns } from '@/lib/db-finance';

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
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const transactions = await getBcaVaTxns(status || null, limit);
    return NextResponse.json({ transactions });
  } catch (err) {
    console.error('BCA VA GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { booking_id, user_id, customer_name, amount } = await request.json();

    if (!booking_id || !amount) {
      return NextResponse.json({ error: 'booking_id and amount are required' }, { status: 400 });
    }

    const txn = await createBcaVaTxn(
      booking_id,
      user_id || user.id,
      customer_name || user.full_name,
      amount
    );

    return NextResponse.json({ transaction: txn }, { status: 201 });
  } catch (err) {
    console.error('BCA VA POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { va_number, payment_ntb } = await request.json();

    if (!va_number) {
      return NextResponse.json({ error: 'va_number is required' }, { status: 400 });
    }

    const txn = await confirmBcaVa(va_number, payment_ntb, {});
    return NextResponse.json({ transaction: txn });
  } catch (err) {
    console.error('BCA VA PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
