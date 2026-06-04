export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const courts = await query(
      `SELECT c.*,
              COALESCE(AVG(r.rating), 0) as avg_rating,
              COUNT(DISTINCT r.id) as review_count,
              o.business_name,
              o.business_address,
              o.business_phone
       FROM courts c
       LEFT JOIN reviews r ON r.court_id = c.id
       LEFT JOIN owners o ON o.id = c.owner_id
       WHERE c.id = ?
       GROUP BY c.id`,
      [id]
    );

    if (!courts || courts.length === 0) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    const court = courts[0];

    const amenities = await query(
      `SELECT id, court_id, amenity AS amenity_name FROM court_amenities WHERE court_id = ? ORDER BY amenity ASC`,
      [id]
    );

    const reviews = await query(
      `SELECT rv.*, u.full_name as user_name
       FROM reviews rv
       LEFT JOIN users u ON u.id = rv.user_id
       WHERE rv.court_id = ?
       ORDER BY rv.created_at DESC
       LIMIT 20`,
      [id]
    );

    return NextResponse.json({ court, amenities, reviews });
  } catch (err) {
    console.error('Court detail error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
