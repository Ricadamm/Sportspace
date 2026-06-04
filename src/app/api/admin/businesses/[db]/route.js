export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import {
  getBusinessProducts,
  getBusinessOrders,
  getBusinessCustomers,
  getBusinessRevenue,
  getBusinessRevenueSummary,
} from '@/lib/db-business';

async function getUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('ss_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request, { params }) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { db } = params;

    const [products, orders, customers, revenue, summary] = await Promise.all([
      getBusinessProducts(db),
      getBusinessOrders(db),
      getBusinessCustomers(db),
      getBusinessRevenue(db),
      getBusinessRevenueSummary(db),
    ]);

    return NextResponse.json({ products, orders, customers, revenue, summary });
  } catch (err) {
    console.error('Business DB fetch error:', err);
    return NextResponse.json({ error: 'Business database not found or error: ' + err.message }, { status: 500 });
  }
}
