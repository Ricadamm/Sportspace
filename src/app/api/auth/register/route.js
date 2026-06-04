export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, signToken, validateEmail, validatePhone } from '@/lib/auth';
import { cookies } from 'next/headers';

function toDbSlug(name) {
  return (
    'sportspace_' +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      full_name,
      email,
      password,
      role,
      phone,
      business_name,
      business_address,
      business_phone,
    } = body;

    if (!full_name || !email || !password || !role) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (phone && !validatePhone(phone)) {
      return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const validRoles = ['customer', 'owner', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const existing = await query(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = hashPassword(password);

    const result = await query(
      `INSERT INTO users (full_name, email, password_hash, role, phone, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [full_name.trim(), email.trim().toLowerCase(), passwordHash, role, phone || null]
    );

    const userId = result.insertId;

    if (role === 'owner') {
      if (!business_name) {
        return NextResponse.json({ error: 'Business name is required for owners' }, { status: 400 });
      }
      const businessDbName = toDbSlug(business_name);
      await query(
        `INSERT INTO owners (user_id, business_name, business_address, business_phone, business_db_name, is_verified, created_at)
         VALUES (?, ?, ?, ?, ?, 0, NOW())`,
        [
          userId,
          business_name.trim(),
          business_address || null,
          business_phone || null,
          businessDbName,
        ]
      );
    }

    const users = await query(`SELECT * FROM users WHERE id = ? LIMIT 1`, [userId]);
    const user = users[0];
    const { password_hash: _, ...userWithoutPassword } = user;

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    };

    const token = await signToken(tokenPayload);

    const cookieStore = cookies();
    cookieStore.set('ss_token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
