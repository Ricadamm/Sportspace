export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('ss_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const users = await query(`SELECT * FROM users WHERE id = ? LIMIT 1`, [payload.id]);
    if (!users || users.length === 0) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = users[0];
    const { password_hash: _, ...userWithoutPassword } = user;

    // If owner, also get owner info
    if (user.role === 'owner') {
      const owners = await query(
        `SELECT * FROM owners WHERE user_id = ? LIMIT 1`,
        [user.id]
      );
      if (owners.length > 0) {
        userWithoutPassword.owner_info = owners[0];
      }
    }

    return NextResponse.json({ user: userWithoutPassword });
  } catch (err) {
    console.error('Auth me error:', err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
