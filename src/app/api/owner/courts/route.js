export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

async function getUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('ss_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request) {
  try {
    const user = await getUser();
    if (!user || !['owner', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Owner access required' }, { status: 403 });
    }

    const courts = await query(
      `SELECT c.*,
              COALESCE(AVG(r.rating), 0) as avg_rating,
              COUNT(DISTINCT r.id) as review_count
       FROM courts c
       LEFT JOIN reviews r ON r.court_id = c.id
       LEFT JOIN owners o ON o.id = c.owner_id
       WHERE o.user_id = ?
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [user.id]
    );

    return NextResponse.json({ courts });
  } catch (err) {
    console.error('Owner courts GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user || !['owner', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Owner access required' }, { status: 403 });
    }

    // Resolve owner profile ID from owners table
    const ownerRows = await query(
      `SELECT id FROM owners WHERE user_id = ? LIMIT 1`,
      [user.id]
    );
    if (ownerRows.length === 0) {
      return NextResponse.json({ error: 'Owner profile not found' }, { status: 404 });
    }
    const ownerId = ownerRows[0].id;

    const body = await request.json();
    const {
      name,
      sport,
      description,
      location,
      city,
      price_per_hour,
      is_indoor,
      external_url,
      amenities,
    } = body;

    if (!name || !sport || !location || !city || !price_per_hour) {
      return NextResponse.json({ error: 'name, sport, location, city, price_per_hour are required' }, { status: 400 });
    }

    const validSports = ['tennis', 'padel', 'badminton', 'soccer', 'basketball'];
    if (!validSports.includes(sport)) {
      return NextResponse.json({ error: 'Invalid sport' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO courts (owner_id, name, sport, description, location, city, price_per_hour, is_indoor, external_url, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [
        ownerId,
        name.trim(),
        sport,
        description || null,
        location.trim(),
        city.trim(),
        Number(price_per_hour),
        is_indoor ? 1 : 0,
        external_url || null,
      ]
    );

    const courtId = result.insertId;

    // Insert amenities
    if (amenities && Array.isArray(amenities) && amenities.length > 0) {
      for (const amenity of amenities) {
        if (amenity && amenity.trim()) {
          await query(
            `INSERT INTO court_amenities (court_id, amenity) VALUES (?, ?)`,
            [courtId, amenity.trim()]
          );
        }
      }
    }

    return NextResponse.json({ court_id: courtId }, { status: 201 });
  } catch (err) {
    console.error('Owner courts POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
