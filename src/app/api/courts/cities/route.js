export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query(
      `SELECT DISTINCT city FROM courts WHERE is_active = 1 AND city IS NOT NULL AND city != '' ORDER BY city ASC`
    );
    const cities = rows.map((r) => r.city);
    return NextResponse.json({ cities });
  } catch (err) {
    console.error('Cities error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
