export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { recordDirectPayment } from '@/lib/db-finance';

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

    const { booking_id, user_id, method_code, amount, notes } = await request.json();

    if (!booking_id || !method_code || !amount) {
      return NextResponse.json({ error: 'booking_id, method_code, and amount are required' }, { status: 400 });
    }

    const result = await recordDirectPayment(
      booking_id,
      user_id || user.id,
      method_code,
      amount,
      notes
    );

    return NextResponse.json({ payment: result }, { status: 201 });
  } catch (err) {
    console.error('Direct payment POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
