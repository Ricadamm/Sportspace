export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, validateEmail, validatePhone } from '@/lib/auth';
import { query } from '@/lib/db';

async function getUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('ss_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function PATCH(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { full_name, email, phone } = await request.json();

    if (!full_name && !email && !phone) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    if (email && !validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (phone && !validatePhone(phone)) {
      return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 });
    }

    // Check email uniqueness if changing
    if (email) {
      const existing = await query(
        `SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1`,
        [email.trim().toLowerCase(), user.id]
      );
      if (existing.length > 0) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
    }

    const updates = [];
    const params = [];

    if (full_name) { updates.push('full_name = ?'); params.push(full_name.trim()); }
    if (email) { updates.push('email = ?'); params.push(email.trim().toLowerCase()); }
    if (phone) { updates.push('phone = ?'); params.push(phone.trim()); }

    params.push(user.id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const updated = await query(
      `SELECT id, full_name, email, role, phone, created_at FROM users WHERE id = ? LIMIT 1`,
      [user.id]
    );

    return NextResponse.json({ user: updated[0] });
  } catch (err) {
    console.error('Profile PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
