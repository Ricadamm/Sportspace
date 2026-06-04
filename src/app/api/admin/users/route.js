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
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const users = await query(
      `SELECT id, full_name, email, role, phone, created_at FROM users
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const countResult = await query(`SELECT COUNT(*) as total FROM users`);
    const total = countResult[0]?.total || 0;

    return NextResponse.json({ users, total, page, limit });
  } catch (err) {
    console.error('Admin users GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { id, role } = await request.json();

    if (!id || !role) {
      return NextResponse.json({ error: 'id and role are required' }, { status: 400 });
    }

    const validRoles = ['customer', 'owner', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    await query(`UPDATE users SET role = ? WHERE id = ?`, [role, id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin users PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
