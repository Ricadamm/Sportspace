import mysql from 'mysql2/promise';

async function getConn(dbName) {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    port: parseInt(process.env.DB_PORT || '3306'),
  });
}

export async function runBusinessQuery(dbName, sql, params = []) {
  const conn = await getConn(dbName);
  try {
    const [rows] = await conn.execute(sql, params);
    return rows;
  } finally {
    await conn.end();
  }
}

export async function getBusinessProducts(dbName) {
  return runBusinessQuery(
    dbName,
    `SELECT p.*,
            COALESCE(AVG(r.rating), 0) as avg_rating,
            COUNT(DISTINCT r.id) as review_count
     FROM products p
     LEFT JOIN sportspace.reviews r ON r.court_id = p.platform_court_id
     GROUP BY p.id
     ORDER BY p.created_at DESC`
  );
}

export async function getBusinessOrders(dbName) {
  return runBusinessQuery(
    dbName,
    `SELECT o.*, c.full_name as customer_name, c.email as customer_email,
            p.name as product_name, p.sport, p.location
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     LEFT JOIN products p ON p.id = o.product_id
     ORDER BY o.created_at DESC`
  );
}

export async function getBusinessCustomers(dbName) {
  return runBusinessQuery(
    dbName,
    `SELECT c.*, COUNT(o.id) as total_bookings,
            COALESCE(SUM(o.total_price), 0) as total_spent
     FROM customers c
     LEFT JOIN orders o ON o.customer_id = c.id AND o.status != 'cancelled'
     GROUP BY c.id
     ORDER BY total_spent DESC`
  );
}

export async function getBusinessRevenue(dbName) {
  return runBusinessQuery(
    dbName,
    `SELECT * FROM revenue ORDER BY revenue_date DESC`
  );
}

export async function getBusinessRevenueSummary(dbName) {
  const rows = await runBusinessQuery(
    dbName,
    `SELECT
       COALESCE(SUM(total_price), 0) as total_gross,
       COALESCE(SUM(CASE WHEN status = 'cancelled' THEN total_price ELSE 0 END), 0) as total_cancelled,
       COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_price ELSE 0 END), 0) as total_net,
       COUNT(*) as total_rows
     FROM orders`
  );
  return rows[0] || { total_gross: 0, total_cancelled: 0, total_net: 0, total_rows: 0 };
}

export async function upsertBusinessCustomer(
  dbName,
  platformUserId,
  fullName,
  email,
  phone,
  extraBookings = 0,
  extraSpent = 0
) {
  const conn = await getConn(dbName);
  try {
    const [existing] = await conn.execute(
      `SELECT id FROM customers WHERE platform_user_id = ?`,
      [platformUserId]
    );
    if (existing.length > 0) {
      await conn.execute(
        `UPDATE customers SET full_name = ?, email = ?, phone = ?,
         total_bookings = total_bookings + ?, total_spent = total_spent + ?
         WHERE platform_user_id = ?`,
        [fullName, email, phone, extraBookings, extraSpent, platformUserId]
      );
      return existing[0].id;
    } else {
      const [result] = await conn.execute(
        `INSERT INTO customers (platform_user_id, full_name, email, phone, total_bookings, total_spent)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [platformUserId, fullName, email, phone, extraBookings, extraSpent]
      );
      return result.insertId;
    }
  } finally {
    await conn.end();
  }
}

export async function addBusinessOrder(dbName, {
  platformBookingId,
  productId,
  customerId,
  bookingDate,
  startTime,
  endTime,
  durationHours,
  totalPrice,
  status,
  notes,
}) {
  const conn = await getConn(dbName);
  try {
    const [existing] = await conn.execute(
      `SELECT id FROM orders WHERE platform_booking_id = ?`,
      [platformBookingId]
    );
    if (existing.length > 0) {
      await conn.execute(
        `UPDATE orders SET status = ? WHERE platform_booking_id = ?`,
        [status, platformBookingId]
      );
      return existing[0].id;
    }
    const [result] = await conn.execute(
      `INSERT INTO orders (platform_booking_id, product_id, customer_id, booking_date,
       start_time, end_time, duration_hours, total_price, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        platformBookingId,
        productId,
        customerId,
        bookingDate,
        startTime,
        endTime,
        durationHours,
        totalPrice,
        status,
        notes || null,
      ]
    );
    return result.insertId;
  } finally {
    await conn.end();
  }
}

export async function upsertRevenueRow(dbName, revenueDate, grossDelta, isCancelled = false) {
  const conn = await getConn(dbName);
  try {
    const [existing] = await conn.execute(
      `SELECT id FROM revenue WHERE revenue_date = ?`,
      [revenueDate]
    );
    if (existing.length > 0) {
      if (isCancelled) {
        await conn.execute(
          `UPDATE revenue SET cancelled_revenue = cancelled_revenue + ?,
           net_revenue = gross_revenue - (cancelled_revenue + ?)
           WHERE revenue_date = ?`,
          [grossDelta, grossDelta, revenueDate]
        );
      } else {
        await conn.execute(
          `UPDATE revenue SET gross_revenue = gross_revenue + ?,
           net_revenue = (gross_revenue + ?) - cancelled_revenue
           WHERE revenue_date = ?`,
          [grossDelta, grossDelta, revenueDate]
        );
      }
    } else {
      const gross = isCancelled ? 0 : grossDelta;
      const cancelled = isCancelled ? grossDelta : 0;
      await conn.execute(
        `INSERT INTO revenue (revenue_date, gross_revenue, cancelled_revenue, net_revenue)
         VALUES (?, ?, ?, ?)`,
        [revenueDate, gross, cancelled, gross - cancelled]
      );
    }
  } finally {
    await conn.end();
  }
}
