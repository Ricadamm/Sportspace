export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport');
    const city = searchParams.get('city');
    const search = searchParams.get('search');
    const maxPrice = searchParams.get('max_price');

    let sql = `
      SELECT c.*,
             COALESCE(AVG(r.rating), 0) as avg_rating,
             COUNT(DISTINCT r.id) as review_count,
             o.business_name
      FROM courts c
      LEFT JOIN reviews r ON r.court_id = c.id
      LEFT JOIN owners o ON o.id = c.owner_id
      WHERE c.is_active = 1
    `;

    const params = [];

    if (sport && sport !== 'all' && sport !== '') {
      sql += ` AND c.sport = ?`;
      params.push(sport);
    }

    if (city && city !== 'all' && city !== '') {
      sql += ` AND c.city = ?`;
      params.push(city);
    }

    if (search && search.trim() !== '') {
      sql += ` AND (c.name LIKE ? OR c.location LIKE ? OR c.city LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      sql += ` AND c.price_per_hour <= ?`;
      params.push(Number(maxPrice));
    }

    sql += ` GROUP BY c.id ORDER BY avg_rating DESC, c.created_at DESC`;

    const courts = await query(sql, params);

    return NextResponse.json({ courts });
  } catch (err) {
    console.error('Courts fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
