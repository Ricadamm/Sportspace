export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getRevenueByMethod } from '@/lib/db-finance';

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
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const revenue = await getRevenueByMethod(startDate, endDate);
    return NextResponse.json({ revenue });
  } catch (err) {
    console.error('Revenue by method error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
