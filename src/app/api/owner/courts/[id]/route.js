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

export async function PATCH(request, { params }) {
  try {
    const user = await getUser();
    if (!user || !['owner', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Owner/Admin access required' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();

    // Fetch court to verify ownership
    const courts = await query(`SELECT * FROM courts WHERE id = ? LIMIT 1`, [id]);
    if (!courts || courts.length === 0) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    const court = courts[0];
    // Admins can toggle any court; owners can only toggle their own
    if (user.role !== 'admin' && String(court.owner_id) !== String(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = [];
    const values = [];

    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(body.is_active ? 1 : 0);
    }
    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.price_per_hour !== undefined) {
      updates.push('price_per_hour = ?');
      values.push(Number(body.price_per_hour));
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    values.push(id);
    await query(`UPDATE courts SET ${updates.join(', ')} WHERE id = ?`, values);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Court PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
