export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { getPaymentMethods } = await import('@/lib/db-finance');
    const methods = await getPaymentMethods(true);
    return NextResponse.json({ methods });
  } catch (err) {
    console.error('Payment methods error:', err);
    // Return default methods if finance DB not available
    const defaultMethods = [
      { id: 1, code: 'GOPAY', name: 'GoPay', is_active: 1, sort_order: 1 },
      { id: 2, code: 'BCA_VA', name: 'BCA Virtual Account', is_active: 1, sort_order: 2 },
      { id: 3, code: 'BCA_TF', name: 'BCA Transfer', is_active: 1, sort_order: 3 },
      { id: 4, code: 'CASH', name: 'Cash', is_active: 1, sort_order: 4 },
      { id: 5, code: 'QRIS', name: 'QRIS', is_active: 1, sort_order: 5 },
    ];
    return NextResponse.json({ methods: defaultMethods });
  }
}
