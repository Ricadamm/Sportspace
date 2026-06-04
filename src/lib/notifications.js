import { query } from '@/lib/db';

let notificationsTableReady = false;

export async function ensureNotificationsTable() {
  if (notificationsTableReady) return;

  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      actor_id INT,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(160) NOT NULL,
      message TEXT NOT NULL,
      link_url VARCHAR(255),
      metadata JSON,
      read_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_notifications_user_created (user_id, created_at),
      INDEX idx_notifications_user_read (user_id, read_at)
    )
  `);

  notificationsTableReady = true;
}

export async function createNotification({
  userId,
  actorId = null,
  type,
  title,
  message,
  linkUrl = null,
  metadata = null,
}) {
  if (!userId || !type || !title || !message) return null;

  await ensureNotificationsTable();

  const result = await query(
    `INSERT INTO notifications
       (user_id, actor_id, type, title, message, link_url, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      userId,
      actorId,
      type,
      title,
      message,
      linkUrl,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );

  return result.insertId;
}

export async function createNotifications(items) {
  const created = [];
  for (const item of items.filter(Boolean)) {
    try {
      created.push(await createNotification(item));
    } catch (err) {
      console.error('Notification create error (non-fatal):', err);
    }
  }
  return created;
}

export function formatBookingDate(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return String(value).slice(0, 10);
}

export function formatBookingTime(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 5);
  const h = String(value.hours ?? 0).padStart(2, '0');
  const m = String(value.minutes ?? 0).padStart(2, '0');
  return `${h}:${m}`;
}
