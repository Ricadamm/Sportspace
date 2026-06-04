import mysql from 'mysql2/promise';

const BCA_DB = 'sportspace_bca';

async function getConn() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: BCA_DB,
    port: parseInt(process.env.DB_PORT || '3306'),
  });
}

async function runQuery(sql, params = []) {
  const conn = await getConn();
  try {
    const [rows] = await conn.execute(sql, params);
    return rows;
  } finally {
    await conn.end();
  }
}

function generateVaNumber(userId, bookingId) {
  const userPart = String(userId).padStart(5, '0');
  const bookingPart = String(bookingId).padStart(8, '0');
  return `70012${userPart}${bookingPart}`;
}

export async function createVaTransaction(platformBookingId, userId, customerName, amount) {
  const conn = await getConn();
  try {
    const vaNumber = generateVaNumber(userId, platformBookingId);
    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [existing] = await conn.execute(
      `SELECT * FROM va_transactions WHERE va_number = ?`,
      [vaNumber]
    );
    if (existing.length > 0) return existing[0];

    const [result] = await conn.execute(
      `INSERT INTO va_transactions (platform_booking_id, user_id, customer_name, amount, va_number, status, expired_at)
       VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
      [platformBookingId, userId, customerName, amount, vaNumber, expiredAt]
    );
    const [rows] = await conn.execute(`SELECT * FROM va_transactions WHERE id = ?`, [result.insertId]);
    return rows[0];
  } finally {
    await conn.end();
  }
}

export async function confirmVaPayment(vaNumber, paymentNtb, callbackPayload) {
  const conn = await getConn();
  try {
    await conn.execute(
      `UPDATE va_transactions SET status = 'PAID', payment_ntb = ?,
       callback_payload = ?, paid_at = NOW()
       WHERE va_number = ?`,
      [paymentNtb, JSON.stringify(callbackPayload || {}), vaNumber]
    );
    const [rows] = await conn.execute(
      `SELECT * FROM va_transactions WHERE va_number = ?`,
      [vaNumber]
    );
    return rows[0];
  } finally {
    await conn.end();
  }
}

export async function getVaTransactions(statusFilter = null, limit = 50) {
  if (statusFilter) {
    return runQuery(
      `SELECT * FROM va_transactions WHERE status = ? ORDER BY created_at DESC LIMIT ?`,
      [statusFilter.toUpperCase(), limit]
    );
  }
  return runQuery(
    `SELECT * FROM va_transactions ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
}

export async function getVaSummary() {
  const rows = await runQuery(
    `SELECT
       COUNT(*) as total_txns,
       SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) as paid_amount,
       SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END) as pending_amount,
       COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_count,
       COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count
     FROM va_transactions`
  );
  return rows[0];
}

export async function createTransferPayment(platformBookingId, userId, amount, transferRef, proofImageUrl) {
  const conn = await getConn();
  try {
    const [result] = await conn.execute(
      `INSERT INTO transfer_payments (platform_booking_id, user_id, amount, transfer_ref, proof_image_url, status)
       VALUES (?, ?, ?, ?, ?, 'UNVERIFIED')`,
      [platformBookingId, userId, amount, transferRef || null, proofImageUrl || null]
    );
    const [rows] = await conn.execute(`SELECT * FROM transfer_payments WHERE id = ?`, [result.insertId]);
    return rows[0];
  } finally {
    await conn.end();
  }
}

export async function verifyTransfer(transferId, adminUserId, approved, notes) {
  const conn = await getConn();
  try {
    const status = approved ? 'VERIFIED' : 'REJECTED';
    await conn.execute(
      `UPDATE transfer_payments SET status = ?, verified_by = ?,
       notes = ?, verified_at = NOW()
       WHERE id = ?`,
      [status, adminUserId, notes || null, transferId]
    );
    const [rows] = await conn.execute(
      `SELECT * FROM transfer_payments WHERE id = ?`,
      [transferId]
    );
    return rows[0];
  } finally {
    await conn.end();
  }
}

export async function getTransferPayments(statusFilter = null, limit = 50) {
  if (statusFilter) {
    return runQuery(
      `SELECT * FROM transfer_payments WHERE status = ? ORDER BY created_at DESC LIMIT ?`,
      [statusFilter.toUpperCase(), limit]
    );
  }
  return runQuery(
    `SELECT * FROM transfer_payments ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
}

export async function getTransferSummary() {
  const rows = await runQuery(
    `SELECT
       COUNT(*) as total_txns,
       SUM(CASE WHEN status = 'VERIFIED' THEN amount ELSE 0 END) as verified_amount,
       SUM(CASE WHEN status = 'UNVERIFIED' THEN amount ELSE 0 END) as pending_amount,
       COUNT(CASE WHEN status = 'VERIFIED' THEN 1 END) as verified_count,
       COUNT(CASE WHEN status = 'UNVERIFIED' THEN 1 END) as pending_count
     FROM transfer_payments`
  );
  return rows[0];
}

export async function getBankAccount() {
  const rows = await runQuery(`SELECT * FROM bank_account_config LIMIT 1`);
  return rows[0] || null;
}

export async function getBcaRefunds(limit = 50) {
  return runQuery(
    `SELECT * FROM refunds ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
}

export async function createBcaRefund(channel, channelTxnId, platformBookingId, amount, reason, processedBy) {
  const conn = await getConn();
  try {
    const [result] = await conn.execute(
      `INSERT INTO refunds (channel, channel_txn_id, platform_booking_id, amount, reason, processed_by, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NOW())`,
      [channel, channelTxnId, platformBookingId, amount, reason, processedBy]
    );
    const [rows] = await conn.execute(`SELECT * FROM refunds WHERE id = ?`, [result.insertId]);
    return rows[0];
  } finally {
    await conn.end();
  }
}
