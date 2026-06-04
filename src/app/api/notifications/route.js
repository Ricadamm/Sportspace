export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { ensureNotificationsTable } from '@/lib/notifications';

async function getUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('ss_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

function parseMetadata(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureNotificationsTable();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const unreadOnly = searchParams.get('unread') === '1';

    const where = unreadOnly ? 'WHERE user_id = ? AND read_at IS NULL' : 'WHERE user_id = ?';
    const notifications = await query(
      `SELECT id, user_id, actor_id, type, title, message, link_url, metadata, read_at, created_at
       FROM notifications
       ${where}
       ORDER BY created_at DESC
       LIMIT ${limit}`,
      [user.id]
    );

    const unreadRows = await query(
      `SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND read_at IS NULL`,
      [user.id]
    );

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        ...n,
        metadata: parseMetadata(n.metadata),
        is_read: Boolean(n.read_at),
      })),
      unread_count: unreadRows[0]?.unread_count || 0,
    });
  } catch (err) {
    console.error('Notifications GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureNotificationsTable();

    const { ids, mark_all_read } = await request.json();

    if (mark_all_read) {
      await query(
        `UPDATE notifications SET read_at = COALESCE(read_at, NOW()) WHERE user_id = ?`,
        [user.id]
      );
      return NextResponse.json({ success: true });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Notification ids are required' }, { status: 400 });
    }

    const cleanIds = ids.map((id) => Number(id)).filter(Number.isInteger);
    if (cleanIds.length === 0) {
      return NextResponse.json({ error: 'Valid notification ids are required' }, { status: 400 });
    }

    await query(
      `UPDATE notifications
       SET read_at = COALESCE(read_at, NOW())
       WHERE user_id = ? AND id IN (${cleanIds.map(() => '?').join(',')})`,
      [user.id, ...cleanIds]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Notifications PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
