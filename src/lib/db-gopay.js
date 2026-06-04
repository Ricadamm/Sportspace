import mysql from 'mysql2/promise';

const GOPAY_DB = 'sportspace_gopay';

async function getConn() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: GOPAY_DB,
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

export async function createGopayTransaction(platformBookingId, userId, phoneNumber, amount) {
  const conn = await getConn();
  try {
    const gopayOrderId = `GOPAY-${Date.now()}-${platformBookingId}`;
    const feeRate = 0.02;
    const fee = Math.round(amount * feeRate);
    const netAmount = amount - fee;

    const [result] = await conn.execute(
      `INSERT INTO transactions (platform_booking_id, user_id, phone_number, amount, fee, net_amount, gopay_order_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [platformBookingId, userId, phoneNumber, amount, fee, netAmount, gopayOrderId]
    );
    const [rows] = await conn.execute(`SELECT * FROM transactions WHERE id = ?`, [result.insertId]);
    return rows[0];
  } finally {
    await conn.end();
  }
}

export async function settleGopayTransaction(gopayOrderId, gopayTxnId, callbackPayload) {
  const conn = await getConn();
  try {
    await conn.execute(
      `UPDATE transactions SET status = 'SETTLEMENT', gopay_txn_id = ?,
       callback_payload = ?, settled_at = NOW()
       WHERE gopay_order_id = ?`,
      [gopayTxnId, JSON.stringify(callbackPayload || {}), gopayOrderId]
    );
    const [rows] = await conn.execute(
      `SELECT * FROM transactions WHERE gopay_order_id = ?`,
      [gopayOrderId]
    );
    return rows[0];
  } finally {
    await conn.end();
  }
}

export async function getGopayTransactions(limit = 50) {
  return runQuery(
    `SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
}

export async function getGopayMerchantConfig() {
  const rows = await runQuery(`SELECT * FROM merchant_config LIMIT 1`);
  return rows[0] || null;
}

export async function createGopayRefund(transactionId, amount, reason, processedBy) {
  const conn = await getConn();
  try {
    const [result] = await conn.execute(
      `INSERT INTO refunds (transaction_id, amount, reason, processed_by, status, created_at)
       VALUES (?, ?, ?, ?, 'PENDING', NOW())`,
      [transactionId, amount, reason, processedBy]
    );
    const [rows] = await conn.execute(`SELECT * FROM refunds WHERE id = ?`, [result.insertId]);
    return rows[0];
  } finally {
    await conn.end();
  }
}

export async function getGopayRefunds(limit = 50) {
  return runQuery(
    `SELECT r.*, t.platform_booking_id, t.phone_number
     FROM refunds r
     LEFT JOIN transactions t ON t.id = r.transaction_id
     ORDER BY r.created_at DESC LIMIT ?`,
    [limit]
  );
}

export async function getGopayDailySummary() {
  return runQuery(
    `SELECT DATE(created_at) as txn_date,
            COUNT(*) as total_txns,
            SUM(CASE WHEN status = 'SETTLEMENT' THEN amount ELSE 0 END) as settled_amount,
            SUM(CASE WHEN status = 'SETTLEMENT' THEN net_amount ELSE 0 END) as net_amount,
            SUM(CASE WHEN status = 'SETTLEMENT' THEN fee ELSE 0 END) as total_fees
     FROM transactions
     GROUP BY DATE(created_at)
     ORDER BY txn_date DESC
     LIMIT 30`
  );
}
