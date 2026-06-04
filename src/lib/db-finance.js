import mysql from 'mysql2/promise';
import {
  createGopayTransaction,
  settleGopayTransaction,
  getGopayTransactions,
  getGopayMerchantConfig,
} from './db-gopay.js';
import {
  createVaTransaction,
  confirmVaPayment,
  getVaTransactions,
  createTransferPayment,
  verifyTransfer,
  getTransferPayments,
  getBankAccount,
  createBcaRefund,
  getBcaRefunds,
} from './db-bca.js';

const FINANCE_DB = 'sportspace_finance';

async function getConn() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: FINANCE_DB,
    port: parseInt(process.env.DB_PORT || '3306'),
  });
}

export async function runFinanceQuery(sql, params = [], fetch = true) {
  const conn = await getConn();
  try {
    const [rows] = await conn.execute(sql, params);
    return fetch ? rows : rows;
  } finally {
    await conn.end();
  }
}

export async function getPaymentMethods(activeOnly = true) {
  const sql = activeOnly
    ? `SELECT * FROM payment_methods WHERE is_active = 1 ORDER BY category, name`
    : `SELECT * FROM payment_methods ORDER BY category, name`;
  return runFinanceQuery(sql);
}

export async function getPaymentMethod(code) {
  const rows = await runFinanceQuery(
    `SELECT * FROM payment_methods WHERE code = ? LIMIT 1`,
    [code]
  );
  return rows[0] || null;
}

async function upsertLedger(conn, {
  platformBookingId,
  userId,
  methodCode,
  channel,
  channelTxnId,
  amount,
  fee,
  netAmount,
  status,
  notes,
}) {
  const [existing] = await conn.execute(
    `SELECT id FROM payments WHERE platform_booking_id = ? AND payment_method_code = ?`,
    [platformBookingId, methodCode]
  );
  if (existing.length > 0) {
    await conn.execute(
      `UPDATE payments SET status = ?, channel_txn_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, channelTxnId || null, existing[0].id]
    );
    return existing[0].id;
  }
  const [result] = await conn.execute(
    `INSERT INTO payments (platform_booking_id, user_id, payment_method_code, source_db, channel_txn_id,
     gross_amount, fee_amount, net_amount, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      platformBookingId,
      userId,
      methodCode,
      channel,
      channelTxnId || null,
      amount,
      fee || 0,
      netAmount || amount,
      status,
      notes || null,
    ]
  );
  return result.insertId;
}

export async function createGopayTxn(platformBookingId, userId, phoneNumber, amount) {
  const txn = await createGopayTransaction(platformBookingId, userId, phoneNumber, amount);
  const conn = await getConn();
  try {
    await upsertLedger(conn, {
      platformBookingId,
      userId,
      methodCode: 'GOPAY',
      channel: 'sportspace_gopay',
      channelTxnId: txn.id,
      amount,
      fee: txn.fee,
      netAmount: txn.net_amount,
      status: 'PENDING',
    });
  } finally {
    await conn.end();
  }
  return txn;
}

export async function settleGopayTxn(gopayOrderId, gopayTxnId, callbackPayload) {
  const txn = await settleGopayTransaction(gopayOrderId, gopayTxnId, callbackPayload);
  if (txn) {
    const conn = await getConn();
    try {
      await conn.execute(
        `UPDATE payments SET status = 'SETTLED', settlement_date = CURDATE(), updated_at = NOW()
         WHERE source_db = 'sportspace_gopay' AND platform_booking_id = ?`,
        [txn.platform_booking_id]
      );
    } finally {
      await conn.end();
    }
  }
  return txn;
}

export async function getGopayTxns(limit = 50) {
  return getGopayTransactions(limit);
}

export async function getGopayMerchantCfg() {
  return getGopayMerchantConfig();
}

export async function createBcaVaTxn(platformBookingId, userId, customerName, amount) {
  const txn = await createVaTransaction(platformBookingId, userId, customerName, amount);
  const conn = await getConn();
  try {
    await upsertLedger(conn, {
      platformBookingId,
      userId,
      methodCode: 'BCA_VA',
      channel: 'sportspace_bca',
      channelTxnId: txn.id,
      amount,
      fee: txn.fee || 4000,
      netAmount: txn.net_amount || (amount - 4000),
      status: 'PENDING',
    });
  } finally {
    await conn.end();
  }
  return txn;
}

export async function confirmBcaVa(vaNumber, paymentNtb, callbackPayload) {
  const txn = await confirmVaPayment(vaNumber, paymentNtb, callbackPayload);
  if (txn) {
    const conn = await getConn();
    try {
      await conn.execute(
        `UPDATE payments SET status = 'SETTLED', settlement_date = CURDATE(), updated_at = NOW()
         WHERE source_db = 'sportspace_bca' AND platform_booking_id = ?`,
        [txn.platform_booking_id]
      );
    } finally {
      await conn.end();
    }
  }
  return txn;
}

export async function getBcaVaTxns(statusFilter = null, limit = 50) {
  return getVaTransactions(statusFilter, limit);
}

export async function createBcaTransferTxn(platformBookingId, userId, amount, transferRef, proofImageUrl) {
  const txn = await createTransferPayment(platformBookingId, userId, amount, transferRef, proofImageUrl);
  const conn = await getConn();
  try {
    await upsertLedger(conn, {
      platformBookingId,
      userId,
      methodCode: 'BCA_TF',
      channel: 'sportspace_bca',
      channelTxnId: txn.id,
      amount,
      fee: txn.fee || 6500,
      netAmount: txn.net_amount || (amount - 6500),
      status: 'PENDING',
    });
  } finally {
    await conn.end();
  }
  return txn;
}

export async function verifyBcaTransfer(transferId, adminUserId, approved, notes) {
  const txn = await verifyTransfer(transferId, adminUserId, approved, notes);
  if (txn) {
    const status = approved ? 'SETTLED' : 'FAILED';
    const conn = await getConn();
    try {
      await conn.execute(
        `UPDATE payments SET status = ?, settlement_date = IF(?, CURDATE(), NULL), updated_at = NOW()
         WHERE source_db = 'sportspace_bca' AND platform_booking_id = ?`,
        [status, approved ? 1 : 0, txn.platform_booking_id]
      );
    } finally {
      await conn.end();
    }
  }
  return txn;
}

export async function getBcaTransferTxns(statusFilter = null, limit = 50) {
  return getTransferPayments(statusFilter, limit);
}

export async function getBankAccountConfig() {
  return getBankAccount();
}

export async function recordDirectPayment(platformBookingId, userId, methodCode, amount, notes) {
  const conn = await getConn();
  try {
    const method = await getPaymentMethod(methodCode);
    const feeFlat = method ? Number(method.fee_flat) : 0;
    const feePct = method ? Number(method.fee_pct) : 0;
    const feeAmount = feeFlat + (amount * feePct);
    const netAmount = amount - feeAmount;

    const ledgerId = await upsertLedger(conn, {
      platformBookingId,
      userId,
      methodCode,
      channel: null,
      channelTxnId: null,
      amount,
      fee: feeAmount,
      netAmount,
      status: 'SETTLED',
      notes,
    });
    // Set settlement date for direct payment
    await conn.execute(
      `UPDATE payments SET settlement_date = CURDATE() WHERE id = ?`,
      [ledgerId]
    );
    return { id: ledgerId, platform_booking_id: platformBookingId, amount, status: 'SETTLED' };
  } finally {
    await conn.end();
  }
}

export async function getPaymentsLedger(limit = 100, statusFilter = null) {
  const sql = statusFilter
    ? `SELECT pl.*, u.full_name as user_name, u.email as user_email
       FROM payments pl
       LEFT JOIN sportspace.users u ON u.id = pl.user_id
       WHERE pl.status = ?
       ORDER BY pl.created_at DESC LIMIT ?`
    : `SELECT pl.*, u.full_name as user_name, u.email as user_email
       FROM payments pl
       LEFT JOIN sportspace.users u ON u.id = pl.user_id
       ORDER BY pl.created_at DESC LIMIT ?`;
  const params = statusFilter ? [statusFilter, limit] : [limit];
  return runFinanceQuery(sql, params);
}

export async function getPaymentForBooking(platformBookingId) {
  const rows = await runFinanceQuery(
    `SELECT * FROM payments WHERE platform_booking_id = ? ORDER BY created_at DESC LIMIT 1`,
    [platformBookingId]
  );
  return rows[0] || null;
}

export async function createRefund(paymentId, platformBookingId, channel, amount, reason, adminUserId) {
  const conn = await getConn();
  try {
    const [result] = await conn.execute(
      `INSERT INTO refunds (payment_id, platform_booking_id, refund_channel, amount, reason, processed_by, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NOW())`,
      [paymentId, platformBookingId, channel, amount, reason, adminUserId]
    );
    // Also create refund in the channel-specific DB
    if (channel === 'gopay' || channel === 'bca_transfer' || channel === 'bca_va') {
      try {
        await createBcaRefund(channel, String(paymentId), platformBookingId, amount, reason, adminUserId);
      } catch (_e) {
        // channel DB may not exist yet; continue
      }
    }
    const [rows] = await conn.execute(`SELECT * FROM refunds WHERE id = ?`, [result.insertId]);
    return rows[0];
  } finally {
    await conn.end();
  }
}

export async function getRefunds(limit = 50) {
  return runFinanceQuery(
    `SELECT * FROM refunds ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
}

export async function getRevenueByMethod(startDate = null, endDate = null) {
  let sql = `
    SELECT payment_method_code AS method_code,
           COUNT(*) as txn_count,
           SUM(gross_amount) as gross_amount,
           SUM(fee_amount) as total_fees,
           SUM(net_amount) as net_amount
    FROM payments
    WHERE status = 'SETTLED'
  `;
  const params = [];
  if (startDate) { sql += ` AND DATE(created_at) >= ?`; params.push(startDate); }
  if (endDate) { sql += ` AND DATE(created_at) <= ?`; params.push(endDate); }
  sql += ` GROUP BY payment_method_code ORDER BY net_amount DESC`;
  return runFinanceQuery(sql, params);
}

export async function getChannelSummaries() {
  const rows = await runFinanceQuery(
    `SELECT
       COUNT(*) as total_txns,
       SUM(CASE WHEN status = 'SETTLED' THEN 1 ELSE 0 END) as settled_count,
       SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
       SUM(CASE WHEN status = 'SETTLED' THEN net_amount ELSE 0 END) as total_net,
       SUM(CASE WHEN status = 'SETTLED' THEN fee_amount ELSE 0 END) as total_fees,
       SUM(CASE WHEN status = 'SETTLED' THEN gross_amount ELSE 0 END) as total_gross
     FROM payments`
  );
  return rows[0];
}
