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

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { court_id, rating, comment } = await request.json();

    if (!court_id || !rating) {
      return NextResponse.json({ error: 'court_id and rating are required' }, { status: 400 });
    }

    const ratingNum = Number(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Check if review exists (upsert)
    const existing = await query(
      `SELECT id FROM reviews WHERE court_id = ? AND user_id = ? LIMIT 1`,
      [court_id, user.id]
    );

    if (existing.length > 0) {
      await query(
        `UPDATE reviews SET rating = ?, comment = ?, updated_at = NOW() WHERE id = ?`,
        [ratingNum, comment || null, existing[0].id]
      );
      return NextResponse.json({ review_id: existing[0].id, updated: true });
    }

    const result = await query(
      `INSERT INTO reviews (court_id, user_id, rating, comment, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [court_id, user.id, ratingNum, comment || null]
    );

    return NextResponse.json({ review_id: result.insertId, updated: false }, { status: 201 });
  } catch (err) {
    console.error('Review POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
