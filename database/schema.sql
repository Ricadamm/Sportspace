-- ============================================================
--  SportSpace  —  Full Database Schema
--  Run this entire file in phpMyAdmin (SQL tab)
-- ============================================================

-- ────────────────────────────────────────────────────────────
--  1.  MAIN PLATFORM DATABASE
-- ────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS sportspace;
USE sportspace;

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  UNIQUE NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    role          ENUM('customer','owner','admin') DEFAULT 'customer',
    phone         VARCHAR(20),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BUSINESS OWNERS
CREATE TABLE IF NOT EXISTS owners (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT          NOT NULL,
    business_name    VARCHAR(150) NOT NULL,
    business_db_name VARCHAR(100) NOT NULL,
    business_address TEXT,
    business_phone   VARCHAR(20),
    verified         BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- COURTS
CREATE TABLE IF NOT EXISTS courts (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    owner_id       INT          NOT NULL,
    name           VARCHAR(150) NOT NULL,
    sport          ENUM('tennis','padel','badminton','soccer','basketball') NOT NULL,
    description    TEXT,
    location       VARCHAR(200) NOT NULL,
    city           VARCHAR(100) NOT NULL,
    price_per_hour DECIMAL(10,2) NOT NULL,
    is_indoor      BOOLEAN DEFAULT FALSE,
    is_active      BOOLEAN DEFAULT TRUE,
    external_url   VARCHAR(255),
    image_url      VARCHAR(255),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
);

-- COURT AMENITIES
CREATE TABLE IF NOT EXISTS court_amenities (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    court_id INT          NOT NULL,
    amenity  VARCHAR(100) NOT NULL,
    FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE
);

-- BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    court_id     INT          NOT NULL,
    user_id      INT          NOT NULL,
    booking_date DATE         NOT NULL,
    start_time   TIME         NOT NULL,
    end_time     TIME         NOT NULL,
    total_price  DECIMAL(10,2) NOT NULL,
    status       ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
    notes        TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    court_id   INT          NOT NULL,
    user_id    INT          NOT NULL,
    rating     DECIMAL(2,1) NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    actor_id   INT,
    type       VARCHAR(50)  NOT NULL,
    title      VARCHAR(160) NOT NULL,
    message    TEXT         NOT NULL,
    link_url   VARCHAR(255),
    metadata   JSON,
    read_at    TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_notifications_user_created (user_id, created_at),
    INDEX idx_notifications_user_read (user_id, read_at)
);

-- ── SEED: Users ─────────────────────────────────────────────
-- Passwords are SHA-256 hashes. Plain text:
--   admin@sportspace.com  -> admin123
--   all others            -> pass123
--
-- LOGIN ACCOUNTS SUMMARY
-- ─────────────────────────────────────────────────────────────
-- ADMIN
--   admin@sportspace.com          / admin123
--
-- BUSINESS OWNERS (role: owner)
--   Business 1  Greenfield Sports Group      | budi@example.com    / pass123
--   Business 2  Padel Arena Indonesia        | rina@example.com    / pass123
--   Business 3  Nusantara Sports Center      | arief@example.com   / pass123
--   Business 4  Bintang Futsal Surabaya      | hendra@example.com  / pass123
--   Business 5  Raja Padel Bandung           | laras@example.com   / pass123
--   Business 6  Elang Badminton Center       | teguh@example.com   / pass123
--   Business 7  Metro Tennis Jakarta         | dewi@example.com    / pass123
--   Business 8  Sunrise Basketball Bali      | eko@example.com     / pass123
--   Business 9  Pro Badminton Malang         | yunita@example.com  / pass123
--   Business 10 Champion Soccer Makassar     | bagas@example.com   / pass123
--
-- CUSTOMERS (role: customer)
--   dani@example.com   / pass123
--   siti@example.com   / pass123
--   fajar@example.com  / pass123
--   maya@example.com   / pass123
--   rizky@example.com  / pass123
-- ─────────────────────────────────────────────────────────────
INSERT INTO users (full_name, email, password_hash, role, phone) VALUES
('Admin SportSpace',  'admin@sportspace.com',  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin',    '081200000000'),
('Budi Santoso',      'budi@example.com',       '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'owner',    '081211111111'),
('Rina Wijaya',       'rina@example.com',       '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'owner',    '081222222222'),
('Arief Nugroho',     'arief@example.com',      '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'owner',    '081233333333'),
('Dani Kusuma',       'dani@example.com',       '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'customer', '081244444444'),
('Siti Rahayu',       'siti@example.com',       '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'customer', '081255555555'),
('Fajar Prasetyo',    'fajar@example.com',      '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'customer', '081266666666'),
('Maya Indah',        'maya@example.com',       '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'customer', '081277777777'),
('Rizky Maulana',     'rizky@example.com',      '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'customer', '081288888888');

-- ── SEED: Owners ────────────────────────────────────────────
INSERT INTO owners (user_id, business_name, business_db_name, business_address, business_phone, verified) VALUES
(2, 'Greenfield Sports Group', 'sportspace_greenfield',  'Jl. Menteng Raya No.10, Jakarta', '02112345678', TRUE),
(3, 'Padel Arena Indonesia',   'sportspace_padel_arena', 'Jl. SCBD Lot 9, Jakarta',          '02198765432', TRUE),
(4, 'Nusantara Sports Center', 'sportspace_nusantara',   'Jl. Raya Kemang No.22, Jakarta',   '02187654321', TRUE);

-- ── SEED: Courts ────────────────────────────────────────────
INSERT INTO courts (owner_id, name, sport, description, location, city, price_per_hour, is_indoor, is_active, external_url) VALUES
(1, 'Greenfield Tennis Club',    'tennis',     'Premium outdoor tennis complex with 6 clay and hard courts.',         'Menteng, Jakarta',    'Jakarta',    120000, FALSE, TRUE, 'https://example.com/greenfield'),
(1, 'Greenfield Badminton Hall', 'badminton',  'Modern indoor badminton facility with 8 BWF-standard courts.',        'Menteng, Jakarta',    'Jakarta',     85000, TRUE,  TRUE, 'https://example.com/greenfield-badminton'),
(1, 'Greenfield Mini Soccer',    'soccer',     '5-a-side and 7-a-side fields with top-grade artificial turf.',        'Menteng, Jakarta',    'Jakarta',    250000, FALSE, TRUE, 'https://example.com/greenfield-soccer'),
(2, 'Padel Arena Jakarta',       'padel',      'Jakarta premier padel destination with 4 indoor glass courts.',       'SCBD, Jakarta',       'Jakarta',    200000, TRUE,  TRUE, 'https://example.com/padel-arena'),
(2, 'UrbanHoop Basketball',      'basketball', 'Full-sized indoor court with hardwood flooring and NBA-grade hoops.', 'Sudirman, Jakarta',   'Jakarta',    250000, TRUE,  TRUE, 'https://example.com/urbanhoop'),
(3, 'Nusantara Badminton Hall',  'badminton',  'Large indoor hall with 10 BWF-standard courts and shuttle sales.',    'Kemang, Jakarta',     'Jakarta',     75000, TRUE,  TRUE, 'https://example.com/nusantara'),
(3, 'Hoopsters Yogyakarta',      'basketball', 'Outdoor basketball facility with 2 full courts and night lighting.', 'Sleman, Yogyakarta',  'Yogyakarta', 180000, FALSE, TRUE, 'https://example.com/hoopsters'),
(3, 'FutureGoal BSD',            'soccer',     'Premium artificial-turf mini soccer fields in BSD City.',             'BSD City, Tangerang', 'Tangerang',  300000, FALSE, TRUE, 'https://example.com/futuregoal');

-- ── SEED: Amenities ─────────────────────────────────────────
INSERT INTO court_amenities (court_id, amenity) VALUES
(1,'Clay Courts'),(1,'Hard Courts'),(1,'Locker Room'),(1,'Cafe'),(1,'Parking'),
(2,'BWF Standard'),(2,'Indoor'),(2,'AC'),(2,'Shuttle Sales'),(2,'Canteen'),
(3,'Artificial Turf'),(3,'Night Lighting'),(3,'Parking'),(3,'Changing Room'),
(4,'Indoor'),(4,'Air Conditioned'),(4,'Glass Walls'),(4,'Racket Rental'),(4,'Valet Parking'),
(5,'Hardwood Floor'),(5,'Indoor'),(5,'Air Conditioned'),(5,'Scoreboard'),
(6,'BWF Standard'),(6,'Indoor'),(6,'Shuttle Sales'),(6,'Canteen'),
(7,'Full Court'),(7,'Night Lighting'),(7,'Bleachers'),(7,'Parking'),
(8,'Artificial Turf'),(8,'Night Lighting'),(8,'Parking'),(8,'Shower Room');

-- ── SEED: Bookings ──────────────────────────────────────────
INSERT INTO bookings (court_id, user_id, booking_date, start_time, end_time, total_price, status, notes) VALUES
(1, 5, '2026-05-01', '08:00:00', '10:00:00', 240000, 'confirmed', 'Morning training session'),
(1, 6, '2026-05-02', '14:00:00', '16:00:00', 240000, 'confirmed', ''),
(1, 7, '2026-05-10', '09:00:00', '10:00:00', 120000, 'pending',   'Solo practice'),
(2, 5, '2026-05-03', '07:00:00', '09:00:00', 170000, 'confirmed', 'Club training'),
(3, 8, '2026-05-04', '18:00:00', '20:00:00', 500000, 'confirmed', 'Company futsal'),
(3, 9, '2026-05-11', '16:00:00', '18:00:00', 500000, 'pending',   ''),
(4, 5, '2026-05-01', '10:00:00', '12:00:00', 400000, 'confirmed', 'Weekend padel'),
(4, 6, '2026-05-05', '15:00:00', '17:00:00', 400000, 'confirmed', ''),
(4, 7, '2026-05-12', '11:00:00', '13:00:00', 400000, 'pending',   ''),
(5, 8, '2026-05-02', '13:00:00', '15:00:00', 500000, 'confirmed', 'Team scrimmage'),
(5, 9, '2026-05-06', '09:00:00', '11:00:00', 500000, 'cancelled', 'Cancelled - rain'),
(6, 5, '2026-05-01', '06:00:00', '08:00:00', 150000, 'confirmed', 'Early morning'),
(6, 7, '2026-05-07', '17:00:00', '19:00:00', 150000, 'confirmed', ''),
(7, 6, '2026-05-03', '08:00:00', '10:00:00', 360000, 'confirmed', '3x3 tournament'),
(8, 9, '2026-05-05', '19:00:00', '21:00:00', 600000, 'confirmed', 'Night game');

-- ── SEED: Reviews ───────────────────────────────────────────
INSERT INTO reviews (court_id, user_id, rating, comment) VALUES
(1, 5, 4.8, 'Great courts, very well maintained!'),
(1, 6, 4.5, 'Nice surface but parking can be tight.'),
(2, 5, 4.6, 'Clean facility and friendly staff.'),
(3, 8, 4.7, 'Best mini soccer field in Jakarta!'),
(4, 5, 4.9, 'Best padel experience in Jakarta.'),
(4, 6, 5.0, 'Absolutely love this place.'),
(4, 7, 4.8, 'Glass walls are top quality.'),
(5, 8, 4.7, 'NBA-grade hoops, great atmosphere.'),
(6, 5, 4.6, 'Good value for money, clean facility.'),
(7, 6, 4.5, 'Outdoor but well lit at night.'),
(8, 9, 4.8, 'Premium turf, worth every rupiah.');


-- ============================================================
--  2.  PER-BUSINESS DATABASES
-- ============================================================

-- ─────────────────────────────────────────────
--  Business 1: Greenfield Sports Group
-- ─────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS sportspace_greenfield;
USE sportspace_greenfield;

CREATE TABLE IF NOT EXISTS products (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    platform_court_id INT,
    name              VARCHAR(150) NOT NULL,
    sport             VARCHAR(50)  NOT NULL,
    description       TEXT,
    price_per_hour    DECIMAL(10,2) NOT NULL,
    location          VARCHAR(200),
    is_indoor         BOOLEAN DEFAULT FALSE,
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    platform_user_id INT,
    full_name        VARCHAR(100) NOT NULL,
    email            VARCHAR(150) NOT NULL,
    phone            VARCHAR(20),
    total_bookings   INT DEFAULT 0,
    total_spent      DECIMAL(12,2) DEFAULT 0,
    first_seen       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    platform_booking_id INT,
    product_id          INT,
    customer_id         INT,
    booking_date        DATE          NOT NULL,
    start_time          TIME          NOT NULL,
    end_time            TIME          NOT NULL,
    duration_hours      INT           NOT NULL,
    total_price         DECIMAL(10,2) NOT NULL,
    status              ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id)  REFERENCES products(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS revenue (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    revenue_date     DATE          NOT NULL UNIQUE,
    total_orders     INT           DEFAULT 0,
    gross_revenue    DECIMAL(12,2) DEFAULT 0,
    cancelled_orders INT           DEFAULT 0,
    net_revenue      DECIMAL(12,2) DEFAULT 0,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO products (platform_court_id, name, sport, description, price_per_hour, location, is_indoor) VALUES
(1, 'Greenfield Tennis Club',    'tennis',    'Premium outdoor tennis complex with 6 clay and hard courts.', 120000, 'Menteng, Jakarta', FALSE),
(2, 'Greenfield Badminton Hall', 'badminton', 'Modern indoor badminton with 8 BWF-standard courts.',         85000,  'Menteng, Jakarta', TRUE),
(3, 'Greenfield Mini Soccer',    'soccer',    '5-a-side and 7-a-side fields with top-grade artificial turf.',250000, 'Menteng, Jakarta', FALSE);

INSERT INTO customers (platform_user_id, full_name, email, phone, total_bookings, total_spent) VALUES
(5, 'Dani Kusuma',    'dani@example.com',  '081244444444', 2, 410000),
(6, 'Siti Rahayu',    'siti@example.com',  '081255555555', 1, 240000),
(7, 'Fajar Prasetyo', 'fajar@example.com', '081266666666', 1, 120000),
(8, 'Maya Indah',     'maya@example.com',  '081277777777', 1, 500000),
(9, 'Rizky Maulana',  'rizky@example.com', '081288888888', 1, 500000);

INSERT INTO orders (platform_booking_id, product_id, customer_id, booking_date, start_time, end_time, duration_hours, total_price, status, notes) VALUES
(1, 1, 1, '2026-05-01', '08:00:00', '10:00:00', 2, 240000, 'confirmed', 'Morning training session'),
(2, 1, 2, '2026-05-02', '14:00:00', '16:00:00', 2, 240000, 'confirmed', ''),
(3, 1, 3, '2026-05-10', '09:00:00', '10:00:00', 1, 120000, 'pending',   'Solo practice'),
(4, 2, 1, '2026-05-03', '07:00:00', '09:00:00', 2, 170000, 'confirmed', 'Club training'),
(5, 3, 4, '2026-05-04', '18:00:00', '20:00:00', 2, 500000, 'confirmed', 'Company futsal'),
(6, 3, 5, '2026-05-11', '16:00:00', '18:00:00', 2, 500000, 'pending',   '');

INSERT INTO revenue (revenue_date, total_orders, gross_revenue, cancelled_orders, net_revenue) VALUES
('2026-05-01', 2, 410000, 0, 410000),
('2026-05-02', 1, 240000, 0, 240000),
('2026-05-03', 1, 170000, 0, 170000),
('2026-05-04', 1, 500000, 0, 500000),
('2026-05-10', 1, 120000, 0, 120000),
('2026-05-11', 1, 500000, 0, 500000);


-- ─────────────────────────────────────────────
--  Business 2: Padel Arena Indonesia
-- ─────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS sportspace_padel_arena;
USE sportspace_padel_arena;

CREATE TABLE IF NOT EXISTS products (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    platform_court_id INT,
    name              VARCHAR(150) NOT NULL,
    sport             VARCHAR(50)  NOT NULL,
    description       TEXT,
    price_per_hour    DECIMAL(10,2) NOT NULL,
    location          VARCHAR(200),
    is_indoor         BOOLEAN DEFAULT FALSE,
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    platform_user_id INT,
    full_name        VARCHAR(100) NOT NULL,
    email            VARCHAR(150) NOT NULL,
    phone            VARCHAR(20),
    total_bookings   INT DEFAULT 0,
    total_spent      DECIMAL(12,2) DEFAULT 0,
    first_seen       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    platform_booking_id INT,
    product_id          INT,
    customer_id         INT,
    booking_date        DATE          NOT NULL,
    start_time          TIME          NOT NULL,
    end_time            TIME          NOT NULL,
    duration_hours      INT           NOT NULL,
    total_price         DECIMAL(10,2) NOT NULL,
    status              ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id)  REFERENCES products(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS revenue (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    revenue_date     DATE          NOT NULL UNIQUE,
    total_orders     INT           DEFAULT 0,
    gross_revenue    DECIMAL(12,2) DEFAULT 0,
    cancelled_orders INT           DEFAULT 0,
    net_revenue      DECIMAL(12,2) DEFAULT 0,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO products (platform_court_id, name, sport, description, price_per_hour, location, is_indoor) VALUES
(4, 'Padel Arena Jakarta',  'padel',      'Jakarta premier padel destination with 4 indoor glass courts.', 200000, 'SCBD, Jakarta',     TRUE),
(5, 'UrbanHoop Basketball', 'basketball', 'Full-sized indoor court with hardwood flooring and NBA hoops.',  250000, 'Sudirman, Jakarta', TRUE);

INSERT INTO customers (platform_user_id, full_name, email, phone, total_bookings, total_spent) VALUES
(5, 'Dani Kusuma',    'dani@example.com',  '081244444444', 2,  800000),
(6, 'Siti Rahayu',    'siti@example.com',  '081255555555', 1,  400000),
(7, 'Fajar Prasetyo', 'fajar@example.com', '081266666666', 1,  400000),
(8, 'Maya Indah',     'maya@example.com',  '081277777777', 2, 1000000),
(9, 'Rizky Maulana',  'rizky@example.com', '081288888888', 1,  500000);

INSERT INTO orders (platform_booking_id, product_id, customer_id, booking_date, start_time, end_time, duration_hours, total_price, status, notes) VALUES
(7,  1, 1, '2026-05-01', '10:00:00', '12:00:00', 2, 400000, 'confirmed', 'Weekend padel'),
(8,  1, 2, '2026-05-05', '15:00:00', '17:00:00', 2, 400000, 'confirmed', ''),
(9,  1, 3, '2026-05-12', '11:00:00', '13:00:00', 2, 400000, 'pending',   ''),
(10, 2, 4, '2026-05-02', '13:00:00', '15:00:00', 2, 500000, 'confirmed', 'Team scrimmage'),
(11, 2, 5, '2026-05-06', '09:00:00', '11:00:00', 2, 500000, 'cancelled', 'Cancelled - rain');

INSERT INTO revenue (revenue_date, total_orders, gross_revenue, cancelled_orders, net_revenue) VALUES
('2026-05-01', 1,  400000, 0, 400000),
('2026-05-02', 1,  500000, 0, 500000),
('2026-05-05', 1,  400000, 0, 400000),
('2026-05-06', 1,  500000, 1,      0),
('2026-05-12', 1,  400000, 0, 400000);


-- ─────────────────────────────────────────────
--  Business 3: Nusantara Sports Center
-- ─────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS sportspace_nusantara;
USE sportspace_nusantara;

CREATE TABLE IF NOT EXISTS products (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    platform_court_id INT,
    name              VARCHAR(150) NOT NULL,
    sport             VARCHAR(50)  NOT NULL,
    description       TEXT,
    price_per_hour    DECIMAL(10,2) NOT NULL,
    location          VARCHAR(200),
    is_indoor         BOOLEAN DEFAULT FALSE,
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    platform_user_id INT,
    full_name        VARCHAR(100) NOT NULL,
    email            VARCHAR(150) NOT NULL,
    phone            VARCHAR(20),
    total_bookings   INT DEFAULT 0,
    total_spent      DECIMAL(12,2) DEFAULT 0,
    first_seen       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    platform_booking_id INT,
    product_id          INT,
    customer_id         INT,
    booking_date        DATE          NOT NULL,
    start_time          TIME          NOT NULL,
    end_time            TIME          NOT NULL,
    duration_hours      INT           NOT NULL,
    total_price         DECIMAL(10,2) NOT NULL,
    status              ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id)  REFERENCES products(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS revenue (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    revenue_date     DATE          NOT NULL UNIQUE,
    total_orders     INT           DEFAULT 0,
    gross_revenue    DECIMAL(12,2) DEFAULT 0,
    cancelled_orders INT           DEFAULT 0,
    net_revenue      DECIMAL(12,2) DEFAULT 0,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO products (platform_court_id, name, sport, description, price_per_hour, location, is_indoor) VALUES
(6, 'Nusantara Badminton Hall', 'badminton',  'Large indoor hall with 10 BWF-standard courts.',        75000, 'Kemang, Jakarta',    TRUE),
(7, 'Hoopsters Yogyakarta',     'basketball', 'Outdoor basketball 2 full courts and night lighting.', 180000, 'Sleman, Yogyakarta', FALSE),
(8, 'FutureGoal BSD',           'soccer',     'Premium artificial-turf mini soccer fields in BSD.',   300000, 'BSD City, Tangerang',FALSE);

INSERT INTO customers (platform_user_id, full_name, email, phone, total_bookings, total_spent) VALUES
(5, 'Dani Kusuma',    'dani@example.com',  '081244444444', 1, 150000),
(6, 'Siti Rahayu',    'siti@example.com',  '081255555555', 2, 510000),
(7, 'Fajar Prasetyo', 'fajar@example.com', '081266666666', 1, 150000),
(9, 'Rizky Maulana',  'rizky@example.com', '081288888888', 1, 600000);

INSERT INTO orders (platform_booking_id, product_id, customer_id, booking_date, start_time, end_time, duration_hours, total_price, status, notes) VALUES
(12, 1, 1, '2026-05-01', '06:00:00', '08:00:00', 2, 150000, 'confirmed', 'Early morning'),
(13, 1, 3, '2026-05-07', '17:00:00', '19:00:00', 2, 150000, 'confirmed', ''),
(14, 2, 2, '2026-05-03', '08:00:00', '10:00:00', 2, 360000, 'confirmed', '3x3 tournament'),
(15, 3, 4, '2026-05-05', '19:00:00', '21:00:00', 2, 600000, 'confirmed', 'Night game');

INSERT INTO revenue (revenue_date, total_orders, gross_revenue, cancelled_orders, net_revenue) VALUES
('2026-05-01', 1, 150000, 0, 150000),
('2026-05-03', 1, 360000, 0, 360000),
('2026-05-05', 1, 600000, 0, 600000),
('2026-05-07', 1, 150000, 0, 150000);


-- ============================================================
--  ADDITIONS: +1 COURT FOR BUSINESS 1 & 2
-- ============================================================

-- ── Add 1 court to Business 1: Greenfield Sports Group ──────
USE sportspace;

INSERT INTO courts (owner_id, name, sport, description, location, city, price_per_hour, is_indoor, is_active, external_url) VALUES
(1, 'Greenfield Basketball Arena', 'basketball', 'Full-size indoor basketball court with professional flooring and lighting.', 'Menteng, Jakarta', 'Jakarta', 200000, TRUE, TRUE, 'https://example.com/greenfield-basketball');

-- amenities for the new court (court_id = 9)
INSERT INTO court_amenities (court_id, amenity) VALUES
(9, 'Indoor'), (9, 'Air Conditioned'), (9, 'Professional Flooring'), (9, 'Scoreboard'), (9, 'Parking');

USE sportspace_greenfield;
INSERT INTO products (platform_court_id, name, sport, description, price_per_hour, location, is_indoor) VALUES
(9, 'Greenfield Basketball Arena', 'basketball', 'Full-size indoor basketball court with professional flooring and lighting.', 200000, 'Menteng, Jakarta', TRUE);

-- ── Add 1 court to Business 2: Padel Arena Indonesia ────────
USE sportspace;

INSERT INTO courts (owner_id, name, sport, description, location, city, price_per_hour, is_indoor, is_active, external_url) VALUES
(2, 'Padel Arena Tennis Club', 'tennis', 'Indoor air-conditioned tennis court with premium hard surface.', 'SCBD, Jakarta', 'Jakarta', 175000, TRUE, TRUE, 'https://example.com/padel-arena-tennis');

-- amenities for the new court (court_id = 10)
INSERT INTO court_amenities (court_id, amenity) VALUES
(10, 'Indoor'), (10, 'Air Conditioned'), (10, 'Hard Surface'), (10, 'Racket Rental'), (10, 'Locker Room');

USE sportspace_padel_arena;
INSERT INTO products (platform_court_id, name, sport, description, price_per_hour, location, is_indoor) VALUES
(10, 'Padel Arena Tennis Club', 'tennis', 'Indoor air-conditioned tennis court with premium hard surface.', 175000, 'SCBD, Jakarta', TRUE);


-- ============================================================
--  NEW BUSINESSES 4–10
-- ============================================================
USE sportspace;

-- ── New owner users ──────────────────────────────────────────
INSERT INTO users (full_name, email, password_hash, role, phone) VALUES
('Hendra Saputra',  'hendra@example.com',  '9b8769a4a742959a2d0298c36fb70623f2a2d34a31750b9b7574e5eda0c42fc8', 'owner', '081299999900'),
('Laras Putri',     'laras@example.com',   '9b8769a4a742959a2d0298c36fb70623f2a2d34a31750b9b7574e5eda0c42fc8', 'owner', '081299999901'),
('Teguh Wibowo',    'teguh@example.com',   '9b8769a4a742959a2d0298c36fb70623f2a2d34a31750b9b7574e5eda0c42fc8', 'owner', '081299999902'),
('Dewi Susanti',    'dewi@example.com',    '9b8769a4a742959a2d0298c36fb70623f2a2d34a31750b9b7574e5eda0c42fc8', 'owner', '081299999903'),
('Eko Prasetya',    'eko@example.com',     '9b8769a4a742959a2d0298c36fb70623f2a2d34a31750b9b7574e5eda0c42fc8', 'owner', '081299999904'),
('Yunita Halim',    'yunita@example.com',  '9b8769a4a742959a2d0298c36fb70623f2a2d34a31750b9b7574e5eda0c42fc8', 'owner', '081299999905'),
('Bagas Firmansyah','bagas@example.com',   '9b8769a4a742959a2d0298c36fb70623f2a2d34a31750b9b7574e5eda0c42fc8', 'owner', '081299999906');

-- ── New owners (user_ids 10–16) ──────────────────────────────
INSERT INTO owners (user_id, business_name, business_db_name, business_address, business_phone, verified) VALUES
(10, 'Bintang Futsal Surabaya',    'sportspace_bintang',     'Jl. Pemuda No.5, Surabaya',         '03112345600', TRUE),
(11, 'Raja Padel Bandung',         'sportspace_raja_padel',  'Jl. Dago No.88, Bandung',            '02287654300', TRUE),
(12, 'Elang Badminton Center',     'sportspace_elang',       'Jl. Gatot Subroto No.30, Semarang',  '02412345700', TRUE),
(13, 'Metro Tennis Jakarta',       'sportspace_metro_tennis','Jl. Sudirman No.45, Jakarta',        '02176543200', TRUE),
(14, 'Sunrise Basketball Bali',    'sportspace_sunrise',     'Jl. Sunset Road No.12, Kuta, Bali',  '03611234500', TRUE),
(15, 'Pro Badminton Malang',       'sportspace_pro_badminton','Jl. Ijen Boulevard No.7, Malang',   '03417654300', FALSE),
(16, 'Champion Soccer Makassar',   'sportspace_champion',    'Jl. A.P. Pettarani No.9, Makassar',  '04111234500', FALSE);

-- ── New courts ───────────────────────────────────────────────
INSERT INTO courts (owner_id, name, sport, description, location, city, price_per_hour, is_indoor, is_active, external_url) VALUES
(4, 'Bintang Futsal Arena',        'soccer',     'Top-tier 5-a-side futsal arena with 3 indoor fields and pro turf.',   'Pemuda, Surabaya',     'Surabaya',  280000, TRUE,  TRUE,  'https://example.com/bintang'),
(4, 'Bintang Mini Soccer Outdoor', 'soccer',     '7-a-side outdoor field with floodlights for evening games.',          'Pemuda, Surabaya',     'Surabaya',  220000, FALSE, TRUE,  'https://example.com/bintang-outdoor'),
(5, 'Raja Padel Club',             'padel',      'Bandung first premium padel club with 3 glass courts.',               'Dago, Bandung',         'Bandung',   190000, TRUE,  TRUE,  'https://example.com/raja-padel'),
(5, 'Raja Tennis Dago',            'tennis',     'Clay court tennis with mountain view in Dago Bandung.',               'Dago, Bandung',         'Bandung',   110000, FALSE, TRUE,  'https://example.com/raja-tennis'),
(6, 'Elang Badminton Semarang',    'badminton',  '8-court BWF-standard indoor badminton in central Semarang.',          'Gatot Subroto, Semarang','Semarang',  70000, TRUE,  TRUE,  'https://example.com/elang'),
(6, 'Elang Basketball Court',      'basketball', 'Outdoor half-courts and one full court with night lighting.',          'Gatot Subroto, Semarang','Semarang', 150000, FALSE, TRUE,  'https://example.com/elang-basket'),
(7, 'Metro Tennis Center',         'tennis',     'Premium hard-court tennis facility near Sudirman Jakarta.',           'Sudirman, Jakarta',     'Jakarta',   150000, TRUE,  TRUE,  'https://example.com/metro-tennis'),
(7, 'Metro Padel Jakarta',         'padel',      'Modern padel courts inside Sudirman business district.',              'Sudirman, Jakarta',     'Jakarta',   210000, TRUE,  TRUE,  'https://example.com/metro-padel'),
(8, 'Sunrise Basketball Bali',     'basketball', 'Beachside basketball court with stunning Bali sunset views.',         'Kuta, Bali',            'Bali',      200000, FALSE, TRUE,  'https://example.com/sunrise'),
(8, 'Sunrise Badminton Bali',      'badminton',  'Air-conditioned indoor badminton in heart of Kuta, Bali.',            'Kuta, Bali',            'Bali',       90000, TRUE,  TRUE,  'https://example.com/sunrise-badminton'),
(9, 'Pro Badminton Malang',        'badminton',  '6-court indoor badminton hall near Ijen Boulevard Malang.',           'Ijen, Malang',          'Malang',     65000, TRUE,  TRUE,  'https://example.com/pro-badminton'),
(9, 'Pro Soccer Malang',           'soccer',     'Mini soccer field with synthetic turf in Malang.',                    'Ijen, Malang',          'Malang',    200000, FALSE, TRUE,  'https://example.com/pro-soccer'),
(10,'Champion Futsal Makassar',    'soccer',     'Premier 5-a-side futsal hall in Makassar with 2 indoor courts.',      'Pettarani, Makassar',   'Makassar',  250000, TRUE,  TRUE,  'https://example.com/champion'),
(10,'Champion Badminton Makassar', 'badminton',  'Indoor badminton with 6 courts and shuttle rental in Makassar.',      'Pettarani, Makassar',   'Makassar',   80000, TRUE,  TRUE,  'https://example.com/champion-badminton');

-- ── Amenities for new courts (court_ids 11–24) ──────────────
INSERT INTO court_amenities (court_id, amenity) VALUES
(11,'Indoor'),(11,'Artificial Turf'),(11,'AC'),(11,'Shower Room'),(11,'Canteen'),
(12,'Artificial Turf'),(12,'Night Lighting'),(12,'Parking'),(12,'Changing Room'),
(13,'Indoor'),(13,'Glass Walls'),(13,'AC'),(13,'Racket Rental'),(13,'Valet Parking'),
(14,'Clay Court'),(14,'Mountain View'),(14,'Parking'),(14,'Locker Room'),
(15,'BWF Standard'),(15,'Indoor'),(15,'AC'),(15,'Shuttle Sales'),(15,'Canteen'),
(16,'Outdoor'),(16,'Night Lighting'),(16,'Parking'),(16,'Bleachers'),
(17,'Indoor'),(17,'Hard Court'),(17,'AC'),(17,'Locker Room'),(17,'Cafe'),
(18,'Indoor'),(18,'Glass Walls'),(18,'AC'),(18,'Racket Rental'),(18,'Parking'),
(19,'Outdoor'),(19,'Beach View'),(19,'Night Lighting'),(19,'Parking'),
(20,'Indoor'),(20,'BWF Standard'),(20,'AC'),(20,'Shuttle Sales'),(20,'Changing Room'),
(21,'BWF Standard'),(21,'Indoor'),(21,'AC'),(21,'Shuttle Sales'),
(22,'Artificial Turf'),(22,'Night Lighting'),(22,'Parking'),(22,'Changing Room'),
(23,'Indoor'),(23,'Artificial Turf'),(23,'AC'),(23,'Shower Room'),(23,'Canteen'),
(24,'Indoor'),(24,'BWF Standard'),(24,'AC'),(24,'Shuttle Sales');

-- ── Sample bookings for new businesses ──────────────────────
INSERT INTO bookings (court_id, user_id, booking_date, start_time, end_time, total_price, status, notes) VALUES
(11, 5, '2026-05-06', '09:00:00', '11:00:00', 560000, 'confirmed', 'Morning futsal'),
(11, 6, '2026-05-07', '18:00:00', '20:00:00', 560000, 'confirmed', 'Evening match'),
(12, 7, '2026-05-06', '16:00:00', '18:00:00', 440000, 'confirmed', 'Outdoor practice'),
(13, 8, '2026-05-08', '10:00:00', '12:00:00', 380000, 'confirmed', 'Weekend padel'),
(14, 5, '2026-05-09', '07:00:00', '09:00:00', 220000, 'confirmed', 'Morning tennis'),
(15, 6, '2026-05-06', '08:00:00', '10:00:00', 140000, 'confirmed', 'Club session'),
(16, 9, '2026-05-07', '15:00:00', '17:00:00', 300000, 'pending',   ''),
(17, 7, '2026-05-08', '09:00:00', '11:00:00', 300000, 'confirmed', 'Tennis practice'),
(18, 8, '2026-05-09', '14:00:00', '16:00:00', 420000, 'confirmed', 'Padel session'),
(19, 5, '2026-05-10', '07:00:00', '09:00:00', 400000, 'confirmed', 'Sunrise game'),
(20, 6, '2026-05-06', '06:30:00', '08:30:00', 180000, 'confirmed', 'Early morning'),
(21, 7, '2026-05-07', '17:00:00', '19:00:00', 130000, 'confirmed', 'Afternoon rally'),
(22, 8, '2026-05-08', '19:00:00', '21:00:00', 400000, 'confirmed', 'Night game'),
(23, 9, '2026-05-09', '20:00:00', '22:00:00', 500000, 'confirmed', 'Night futsal'),
(24, 5, '2026-05-07', '08:00:00', '10:00:00', 160000, 'confirmed', 'Morning badminton');

-- ── Sample reviews for new courts ───────────────────────────
INSERT INTO reviews (court_id, user_id, rating, comment) VALUES
(11, 5, 4.7, 'Great futsal arena, very smooth turf!'),
(12, 7, 4.4, 'Good outdoor field, well lit at night.'),
(13, 8, 4.8, 'Best padel in Bandung, highly recommend.'),
(14, 5, 4.5, 'Nice clay courts with a great mountain view.'),
(15, 6, 4.6, 'Clean and well-managed badminton center.'),
(17, 7, 4.7, 'Premium tennis experience in Jakarta.'),
(18, 8, 4.9, 'Excellent padel courts inside SCBD area.'),
(19, 5, 5.0, 'Playing basketball while watching sunset is magical!'),
(21, 7, 4.6, 'Affordable and clean, great for daily practice.'),
(23, 9, 4.8, 'Top futsal venue in Makassar!');


-- ============================================================
--  PER-BUSINESS DATABASES FOR BUSINESSES 4–10
-- ============================================================

-- helper macro: same table structure repeated for each new business
-- ─────────────────────────────────────────────
--  Business 4: Bintang Futsal Surabaya
-- ─────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS sportspace_bintang;
USE sportspace_bintang;
CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, platform_court_id INT, name VARCHAR(150) NOT NULL, sport VARCHAR(50) NOT NULL, description TEXT, price_per_hour DECIMAL(10,2) NOT NULL, location VARCHAR(200), is_indoor BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS customers (id INT AUTO_INCREMENT PRIMARY KEY, platform_user_id INT, full_name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL, phone VARCHAR(20), total_bookings INT DEFAULT 0, total_spent DECIMAL(12,2) DEFAULT 0, first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders (id INT AUTO_INCREMENT PRIMARY KEY, platform_booking_id INT, product_id INT, customer_id INT, booking_date DATE NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, duration_hours INT NOT NULL, total_price DECIMAL(10,2) NOT NULL, status ENUM('pending','confirmed','cancelled') DEFAULT 'pending', notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products(id), FOREIGN KEY (customer_id) REFERENCES customers(id));
CREATE TABLE IF NOT EXISTS revenue (id INT AUTO_INCREMENT PRIMARY KEY, revenue_date DATE NOT NULL UNIQUE, total_orders INT DEFAULT 0, gross_revenue DECIMAL(12,2) DEFAULT 0, cancelled_orders INT DEFAULT 0, net_revenue DECIMAL(12,2) DEFAULT 0, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
INSERT INTO products (platform_court_id, name, sport, description, price_per_hour, location, is_indoor) VALUES
(11, 'Bintang Futsal Arena',        'soccer', 'Top-tier 5-a-side futsal arena with 3 indoor fields and pro turf.', 280000, 'Pemuda, Surabaya', TRUE),
(12, 'Bintang Mini Soccer Outdoor', 'soccer', '7-a-side outdoor field with floodlights for evening games.',       220000, 'Pemuda, Surabaya', FALSE);
INSERT INTO customers (platform_user_id, full_name, email, phone, total_bookings, total_spent) VALUES
(5, 'Dani Kusuma',    'dani@example.com',  '081244444444', 1, 560000),
(6, 'Siti Rahayu',    'siti@example.com',  '081255555555', 1, 560000),
(7, 'Fajar Prasetyo', 'fajar@example.com', '081266666666', 1, 440000);
INSERT INTO orders (platform_booking_id, product_id, customer_id, booking_date, start_time, end_time, duration_hours, total_price, status, notes) VALUES
(16, 1, 1, '2026-05-06', '09:00:00', '11:00:00', 2, 560000, 'confirmed', 'Morning futsal'),
(17, 1, 2, '2026-05-07', '18:00:00', '20:00:00', 2, 560000, 'confirmed', 'Evening match'),
(18, 2, 3, '2026-05-06', '16:00:00', '18:00:00', 2, 440000, 'confirmed', 'Outdoor practice');
INSERT INTO revenue (revenue_date, total_orders, gross_revenue, cancelled_orders, net_revenue) VALUES
('2026-05-06', 2, 1000000, 0, 1000000),
('2026-05-07', 1,  560000, 0,  560000);

-- ─────────────────────────────────────────────
--  Business 5: Raja Padel Bandung
-- ─────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS sportspace_raja_padel;
USE sportspace_raja_padel;
CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, platform_court_id INT, name VARCHAR(150) NOT NULL, sport VARCHAR(50) NOT NULL, description TEXT, price_per_hour DECIMAL(10,2) NOT NULL, location VARCHAR(200), is_indoor BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS customers (id INT AUTO_INCREMENT PRIMARY KEY, platform_user_id INT, full_name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL, phone VARCHAR(20), total_bookings INT DEFAULT 0, total_spent DECIMAL(12,2) DEFAULT 0, first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders (id INT AUTO_INCREMENT PRIMARY KEY, platform_booking_id INT, product_id INT, customer_id INT, booking_date DATE NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, duration_hours INT NOT NULL, total_price DECIMAL(10,2) NOT NULL, status ENUM('pending','confirmed','cancelled') DEFAULT 'pending', notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products(id), FOREIGN KEY (customer_id) REFERENCES customers(id));
CREATE TABLE IF NOT EXISTS revenue (id INT AUTO_INCREMENT PRIMARY KEY, revenue_date DATE NOT NULL UNIQUE, total_orders INT DEFAULT 0, gross_revenue DECIMAL(12,2) DEFAULT 0, cancelled_orders INT DEFAULT 0, net_revenue DECIMAL(12,2) DEFAULT 0, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
INSERT INTO products (platform_court_id, name, sport, description, price_per_hour, location, is_indoor) VALUES
(13, 'Raja Padel Club',  'padel',  'Bandung first premium padel club with 3 glass courts.', 190000, 'Dago, Bandung', TRUE),
(14, 'Raja Tennis Dago', 'tennis', 'Clay court tennis with mountain view in Dago Bandung.',  110000, 'Dago, Bandung', FALSE);
INSERT INTO customers (platform_user_id, full_name, email, phone, total_bookings, total_spent) VALUES
(8, 'Maya Indah',    'maya@example.com',  '081277777777', 1, 380000),
(5, 'Dani Kusuma',   'dani@example.com',  '081244444444', 1, 220000);
INSERT INTO orders (platform_booking_id, product_id, customer_id, booking_date, start_time, end_time, duration_hours, total_price, status, notes) VALUES
(19, 1, 1, '2026-05-08', '10:00:00', '12:00:00', 2, 380000, 'confirmed', 'Weekend padel'),
(20, 2, 2, '2026-05-09', '07:00:00', '09:00:00', 2, 220000, 'confirmed', 'Morning tennis');
INSERT INTO revenue (revenue_date, total_orders, gross_revenue, cancelled_orders, net_revenue) VALUES
('2026-05-08', 1, 380000, 0, 380000),
('2026-05-09', 1, 220000, 0, 220000);

-- ─────────────────────────────────────────────
--  Business 6: Elang Badminton Center
-- ─────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS sportspace_elang;
USE sportspace_elang;
CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, platform_court_id INT, name VARCHAR(150) NOT NULL, sport VARCHAR(50) NOT NULL, description TEXT, price_per_hour DECIMAL(10,2) NOT NULL, location VARCHAR(200), is_indoor BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS customers (id INT AUTO_INCREMENT PRIMARY KEY, platform_user_id INT, full_name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL, phone VARCHAR(20), total_bookings INT DEFAULT 0, total_spent DECIMAL(12,2) DEFAULT 0, first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders (id INT AUTO_INCREMENT PRIMARY KEY, platform_booking_id INT, product_id INT, customer_id INT, booking_date DATE NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, duration_hours INT NOT NULL, total_price DECIMAL(10,2) NOT NULL, status ENUM('pending','confirmed','cancelled') DEFAULT 'pending', notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products(id), FOREIGN KEY (customer_id) REFERENCES customers(id));
CREATE TABLE IF NOT EXISTS revenue (id INT AUTO_INCREMENT PRIMARY KEY, revenue_date DATE NOT NULL UNIQUE, total_orders INT DEFAULT 0, gross_revenue DECIMAL(12,2) DEFAULT 0, cancelled_orders INT DEFAULT 0, net_revenue DECIMAL(12,2) DEFAULT 0, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
INSERT INTO products (platform_court_id, name, sport, description, price_per_hour, location, is_indoor) VALUES
(15, 'Elang Badminton Semarang', 'badminton',  '8-court BWF-standard indoor badminton in central Semarang.',   70000,  'Gatot Subroto, Semarang', TRUE),
(16, 'Elang Basketball Court',   'basketball', 'Outdoor half-courts and one full court with night lighting.', 150000, 'Gatot Subroto, Semarang', FALSE);
INSERT INTO customers (platform_user_id, full_name, email, phone, total_bookings, total_spent) VALUES
(6, 'Siti Rahayu',   'siti@example.com',  '081255555555', 1, 140000),
(9, 'Rizky Maulana', 'rizky@example.com', '081288888888', 1, 300000);
INSERT INTO orders (platform_booking_id, product_id, customer_id, booking_date, start_time, end_time, duration_hours, total_price, status, notes) VALUES
(21, 1, 1, '2026-05-06', '08:00:00', '10:00:00', 2, 140000, 'confirmed', 'Club session'),
(22, 2, 2, '2026-05-07', '15:00:00', '17:00:00', 2, 300000, 'pending',   '');
INSERT INTO revenue (revenue_date, total_orders, gross_revenue, cancelled_orders, net_revenue) VALUES
('2026-05-06', 1, 140000, 0, 140000),
('2026-05-07', 1, 300000, 0, 300000);

-- ─────────────────────────────────────────────
--  Business 7: Metro Tennis Jakarta
-- ─────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS sportspace_metro_tennis;
USE sportspace_metro_tennis;
CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, platform_court_id INT, name VARCHAR(150) NOT NULL, sport VARCHAR(50) NOT NULL, description TEXT, price_per_hour DECIMAL(10,2) NOT NULL, location VARCHAR(200), is_indoor BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS customers (id INT AUTO_INCREMENT PRIMARY KEY, platform_user_id INT, full_name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL, phone VARCHAR(20), total_bookings INT DEFAULT 0, total_spent DECIMAL(12,2) DEFAULT 0, first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders (id INT AUTO_INCREMENT PRIMARY KEY, platform_booking_id INT, product_id INT, customer_id INT, booking_date DATE NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, duration_hours INT NOT NULL, total_price DECIMAL(10,2) NOT NULL, status ENUM('pending','confirmed','cancelled') DEFAULT 'pending', notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products(id), FOREIGN KEY (customer_id) REFERENCES customers(id));
CREATE TABLE IF NOT EXISTS revenue (id INT AUTO_INCREMENT PRIMARY KEY, revenue_date DATE NOT NULL UNIQUE, total_orders INT DEFAULT 0, gross_revenue DECIMAL(12,2) DEFAULT 0, cancelled_orders INT DEFAULT 0, net_revenue DECIMAL(12,2) DEFAULT 0, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
INSERT INTO products (platform_court_id, name, sport, description, price_per_hour, location, is_indoor) VALUES
(17, 'Metro Tennis Center', 'tennis', 'Premium hard-court tennis facility near Sudirman Jakarta.', 150000, 'Sudirman, Jakarta', TRUE),
(18, 'Metro Padel Jakarta', 'padel',  'Modern padel courts inside Sudirman business district.',    210000, 'Sudirman, Jakarta', TRUE);
INSERT INTO customers (platform_user_id, full_name, email, phone, total_bookings, total_spent) VALUES
(7, 'Fajar Prasetyo', 'fajar@example.com', '081266666666', 1, 300000),
(8, 'Maya Indah',     'maya@example.com',  '081277777777', 1, 420000);
INSERT INTO orders (platform_booking_id, product_id, customer_id, booking_date, start_time, end_time, duration_hours, total_price, status, notes) VALUES
(23, 1, 1, '2026-05-08', '09:00:00', '11:00:00', 2, 300000, 'confirmed', 'Tennis practice'),
(24, 2, 2, '2026-05-09', '14:00:00', '16:00:00', 2, 420000, 'confirmed', 'Padel session');
INSERT INTO revenue (revenue_date, total_orders, gross_revenue, cancelled_orders, net_revenue) VALUES
('2026-05-08', 1, 300000, 0, 300000),
('2026-05-09', 1, 420000, 0, 420000);

-- ─────────────────────────────────────────────
--  Business 8: Sunrise Basketball Bali
-- ─────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS sportspace_sunrise;
USE sportspace_sunrise;
CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, platform_court_id INT, name VARCHAR(150) NOT NULL, sport VARCHAR(50) NOT NULL, description TEXT, price_per_hour DECIMAL(10,2) NOT NULL, location VARCHAR(200), is_indoor BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS customers (id INT AUTO_INCREMENT PRIMARY KEY, platform_user_id INT, full_name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL, phone VARCHAR(20), total_bookings INT DEFAULT 0, total_spent DECIMAL(12,2) DEFAULT 0, first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders (id INT AUTO_INCREMENT PRIMARY KEY, platform_booking_id INT, product_id INT, customer_id INT, booking_date DATE NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, duration_hours INT NOT NULL, total_price DECIMAL(10,2) NOT NULL, status ENUM('pending','confirmed','cancelled') DEFAULT 'pending', notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products(id), FOREIGN KEY (customer_id) REFERENCES customers(id));
CREATE TABLE IF NOT EXISTS revenue (id INT AUTO_INCREMENT PRIMARY KEY, revenue_date DATE NOT NULL UNIQUE, total_orders INT DEFAULT 0, gross_revenue DECIMAL(12,2) DEFAULT 0, cancelled_orders INT DEFAULT 0, net_revenue DECIMAL(12,2) DEFAULT 0, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
INSERT INTO products (platform_court_id, name, sport, description, price_per_hour, location, is_indoor) VALUES
(19, 'Sunrise Basketball Bali',  'basketball', 'Beachside basketball court with stunning Bali sunset views.',   200000, 'Kuta, Bali', FALSE),
(20, 'Sunrise Badminton Bali',   'badminton',  'Air-conditioned indoor badminton in heart of Kuta, Bali.',       90000, 'Kuta, Bali', TRUE);
INSERT INTO customers (platform_user_id, full_name, email, phone, total_bookings, total_spent) VALUES
(5, 'Dani Kusuma',   'dani@example.com',  '081244444444', 1, 400000),
(6, 'Siti Rahayu',   'siti@example.com',  '081255555555', 1, 180000);
INSERT INTO orders (platform_booking_id, product_id, customer_id, booking_date, start_time, end_time, duration_hours, total_price, status, notes) VALUES
(25, 1, 1, '2026-05-10', '07:00:00', '09:00:00', 2, 400000, 'confirmed', 'Sunrise game'),
(26, 2, 2, '2026-05-06', '06:30:00', '08:30:00', 2, 180000, 'confirmed', 'Early morning');
INSERT INTO revenue (revenue_date, total_orders, gross_revenue, cancelled_orders, net_revenue) VALUES
('2026-05-06', 1, 180000, 0, 180000),
('2026-05-10', 1, 400000, 0, 400000);

-- ─────────────────────────────────────────────
--  Business 9: Pro Badminton Malang
-- ─────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS sportspace_pro_badminton;
USE sportspace_pro_badminton;
CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, platform_court_id INT, name VARCHAR(150) NOT NULL, sport VARCHAR(50) NOT NULL, description TEXT, price_per_hour DECIMAL(10,2) NOT NULL, location VARCHAR(200), is_indoor BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS customers (id INT AUTO_INCREMENT PRIMARY KEY, platform_user_id INT, full_name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL, phone VARCHAR(20), total_bookings INT DEFAULT 0, total_spent DECIMAL(12,2) DEFAULT 0, first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders (id INT AUTO_INCREMENT PRIMARY KEY, platform_booking_id INT, product_id INT, customer_id INT, booking_date DATE NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, duration_hours INT NOT NULL, total_price DECIMAL(10,2) NOT NULL, status ENUM('pending','confirmed','cancelled') DEFAULT 'pending', notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products(id), FOREIGN KEY (customer_id) REFERENCES customers(id));
CREATE TABLE IF NOT EXISTS revenue (id INT AUTO_INCREMENT PRIMARY KEY, revenue_date DATE NOT NULL UNIQUE, total_orders INT DEFAULT 0, gross_revenue DECIMAL(12,2) DEFAULT 0, cancelled_orders INT DEFAULT 0, net_revenue DECIMAL(12,2) DEFAULT 0, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
INSERT INTO products (platform_court_id, name, sport, description, price_per_hour, location, is_indoor) VALUES
(21, 'Pro Badminton Malang', 'badminton', '6-court indoor badminton hall near Ijen Boulevard Malang.', 65000,  'Ijen, Malang', TRUE),
(22, 'Pro Soccer Malang',    'soccer',    'Mini soccer field with synthetic turf in Malang.',          200000, 'Ijen, Malang', FALSE);
INSERT INTO customers (platform_user_id, full_name, email, phone, total_bookings, total_spent) VALUES
(7, 'Fajar Prasetyo', 'fajar@example.com', '081266666666', 1, 130000),
(8, 'Maya Indah',     'maya@example.com',  '081277777777', 1, 400000);
INSERT INTO orders (platform_booking_id, product_id, customer_id, booking_date, start_time, end_time, duration_hours, total_price, status, notes) VALUES
(27, 1, 1, '2026-05-07', '17:00:00', '19:00:00', 2, 130000, 'confirmed', 'Afternoon rally'),
(28, 2, 2, '2026-05-08', '19:00:00', '21:00:00', 2, 400000, 'confirmed', 'Night game');
INSERT INTO revenue (revenue_date, total_orders, gross_revenue, cancelled_orders, net_revenue) VALUES
('2026-05-07', 1, 130000, 0, 130000),
('2026-05-08', 1, 400000, 0, 400000);

-- ─────────────────────────────────────────────
--  Business 10: Champion Soccer Makassar
-- ─────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS sportspace_champion;
USE sportspace_champion;
CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, platform_court_id INT, name VARCHAR(150) NOT NULL, sport VARCHAR(50) NOT NULL, description TEXT, price_per_hour DECIMAL(10,2) NOT NULL, location VARCHAR(200), is_indoor BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS customers (id INT AUTO_INCREMENT PRIMARY KEY, platform_user_id INT, full_name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL, phone VARCHAR(20), total_bookings INT DEFAULT 0, total_spent DECIMAL(12,2) DEFAULT 0, first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders (id INT AUTO_INCREMENT PRIMARY KEY, platform_booking_id INT, product_id INT, customer_id INT, booking_date DATE NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, duration_hours INT NOT NULL, total_price DECIMAL(10,2) NOT NULL, status ENUM('pending','confirmed','cancelled') DEFAULT 'pending', notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products(id), FOREIGN KEY (customer_id) REFERENCES customers(id));
CREATE TABLE IF NOT EXISTS revenue (id INT AUTO_INCREMENT PRIMARY KEY, revenue_date DATE NOT NULL UNIQUE, total_orders INT DEFAULT 0, gross_revenue DECIMAL(12,2) DEFAULT 0, cancelled_orders INT DEFAULT 0, net_revenue DECIMAL(12,2) DEFAULT 0, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
INSERT INTO products (platform_court_id, name, sport, description, price_per_hour, location, is_indoor) VALUES
(23, 'Champion Futsal Makassar',    'soccer',    'Premier 5-a-side futsal hall with 2 indoor courts.', 250000, 'Pettarani, Makassar', TRUE),
(24, 'Champion Badminton Makassar', 'badminton', 'Indoor badminton with 6 courts and shuttle rental.',  80000, 'Pettarani, Makassar', TRUE);
INSERT INTO customers (platform_user_id, full_name, email, phone, total_bookings, total_spent) VALUES
(9, 'Rizky Maulana', 'rizky@example.com', '081288888888', 1, 500000),
(5, 'Dani Kusuma',   'dani@example.com',  '081244444444', 1, 160000);
INSERT INTO orders (platform_booking_id, product_id, customer_id, booking_date, start_time, end_time, duration_hours, total_price, status, notes) VALUES
(29, 1, 1, '2026-05-09', '20:00:00', '22:00:00', 2, 500000, 'confirmed', 'Night futsal'),
(30, 2, 2, '2026-05-07', '08:00:00', '10:00:00', 2, 160000, 'confirmed', 'Morning badminton');
INSERT INTO revenue (revenue_date, total_orders, gross_revenue, cancelled_orders, net_revenue) VALUES
('2026-05-07', 1, 160000, 0, 160000),
('2026-05-09', 1, 500000, 0, 500000);




-- ============================================================
--  GOPAY PAYMENT DATABASE  (sportspace_gopay)
--  Handles all GoPay / e-wallet payment transactions
-- ============================================================
CREATE DATABASE IF NOT EXISTS sportspace_gopay;
USE sportspace_gopay;

-- ── GOPAY MERCHANT CONFIG ────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchant_config (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    merchant_id     VARCHAR(100) NOT NULL,
    merchant_name   VARCHAR(150) DEFAULT 'SportSpace',
    environment     ENUM('sandbox','production') DEFAULT 'sandbox',
    callback_url    VARCHAR(255),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO merchant_config (merchant_id, merchant_name, environment, callback_url) VALUES
('G-SPORTSPACE-001', 'SportSpace Indonesia', 'sandbox', 'https://sportspace.id/api/gopay/callback');

-- ── GOPAY TRANSACTIONS ───────────────────────────────────────
-- Every GoPay payment attempt; one row per booking attempt
CREATE TABLE IF NOT EXISTS transactions (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    platform_booking_id INT          NOT NULL,       -- sportspace.bookings.id
    user_id             INT          NOT NULL,        -- sportspace.users.id
    gopay_order_id      VARCHAR(100) NOT NULL UNIQUE, -- merchant-generated order ref
    gopay_txn_id        VARCHAR(100),                 -- Gojek transaction ID (webhook)
    phone_number        VARCHAR(20),                  -- customer GoPay-registered phone
    amount              DECIMAL(15,2) NOT NULL,
    fee                 DECIMAL(10,2) DEFAULT 0,      -- 0.70% of amount
    net_amount          DECIMAL(15,2) NOT NULL,
    status              ENUM('PENDING','SETTLEMENT','EXPIRE','CANCEL','FAILURE') DEFAULT 'PENDING',
    qr_code_url         VARCHAR(500),                 -- QR / deeplink URL
    callback_payload    JSON,                         -- raw Gojek webhook body
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settled_at          TIMESTAMP NULL,
    expired_at          TIMESTAMP NULL
);

-- ── GOPAY REFUNDS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refunds (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id  INT          NOT NULL,
    gopay_refund_id VARCHAR(100),                     -- Gojek refund reference
    amount          DECIMAL(15,2) NOT NULL,
    reason          TEXT,
    status          ENUM('PENDING','PROCESSED','FAILED') DEFAULT 'PENDING',
    processed_by    INT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at    TIMESTAMP NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

-- ── GOPAY DAILY SETTLEMENT ───────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_settlement (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    settlement_date DATE        NOT NULL UNIQUE,
    total_txns      INT DEFAULT 0,
    gross_total     DECIMAL(15,2) DEFAULT 0,
    total_fees      DECIMAL(10,2) DEFAULT 0,
    net_total       DECIMAL(15,2) DEFAULT 0,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── SEED: sample settled GoPay transactions ──────────────────
INSERT INTO transactions
    (platform_booking_id, user_id, gopay_order_id, gopay_txn_id,
     phone_number, amount, fee, net_amount, status, settled_at)
VALUES
(1,  5, 'SS-GP-20260506-001', 'GJ-TXN-7812345', '081244444444', 240000,  1680, 238320,  'SETTLEMENT', '2026-05-06 10:30:00'),
(2,  6, 'SS-GP-20260507-002', 'GJ-TXN-7812346', '081255555555', 510000,  3570, 506430,  'SETTLEMENT', '2026-05-07 20:15:00'),
(3,  7, 'SS-GP-20260506-003', 'GJ-TXN-7812347', '081266666666', 170000,  1190, 168810,  'SETTLEMENT', '2026-05-06 18:00:00');

INSERT INTO daily_settlement (settlement_date, total_txns, gross_total, total_fees, net_total) VALUES
('2026-05-06', 2,  410000, 2870, 407130),
('2026-05-07', 1,  510000, 3570, 506430);


-- ============================================================
--  BCA PAYMENT DATABASE  (sportspace_bca)
--  Handles BCA Virtual Account and BCA Bank Transfer
-- ============================================================
CREATE DATABASE IF NOT EXISTS sportspace_bca;
USE sportspace_bca;

-- ── BCA BANK ACCOUNT CONFIG ──────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_account_config (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    bank_name       VARCHAR(50)  NOT NULL DEFAULT 'BCA',
    account_number  VARCHAR(30)  NOT NULL,
    account_name    VARCHAR(100) NOT NULL,
    branch          VARCHAR(100),
    swift_code      VARCHAR(20),
    is_primary      BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO bank_account_config (bank_name, account_number, account_name, branch, swift_code, is_primary) VALUES
('BCA', '1234567890', 'SportSpace Indonesia', 'KCU Jakarta Sudirman', 'CENAIDJA', TRUE);

-- ── BCA VIRTUAL ACCOUNT TRANSACTIONS ────────────────────────
-- Auto-generated VA number per booking; paid via ATM/m-BCA/KlikBCA
CREATE TABLE IF NOT EXISTS va_transactions (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    platform_booking_id INT          NOT NULL,
    user_id             INT          NOT NULL,
    va_number           VARCHAR(30)  NOT NULL UNIQUE, -- 16-digit BCA VA (company_code + user + booking)
    company_code        VARCHAR(10)  DEFAULT '70012', -- BCA merchant company code
    amount              DECIMAL(15,2) NOT NULL,
    fee                 DECIMAL(10,2) DEFAULT 4000,   -- fixed Rp 4.000 admin fee
    net_amount          DECIMAL(15,2) NOT NULL,
    customer_name       VARCHAR(100),
    status              ENUM('PENDING','PAID','EXPIRED','CANCELLED') DEFAULT 'PENDING',
    payment_ntb         VARCHAR(100),                  -- Nomor Transaksi Bank (BCA callback)
    callback_payload    JSON,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at             TIMESTAMP NULL,
    expired_at          TIMESTAMP NULL
);

-- ── BCA BANK TRANSFER (MANUAL) ───────────────────────────────
-- Customer transfers manually; admin verifies proof of transfer
CREATE TABLE IF NOT EXISTS transfer_payments (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    platform_booking_id INT          NOT NULL,
    user_id             INT          NOT NULL,
    destination_account VARCHAR(20)  DEFAULT '1234567890',
    destination_name    VARCHAR(100) DEFAULT 'SportSpace Indonesia',
    amount              DECIMAL(15,2) NOT NULL,
    fee                 DECIMAL(10,2) DEFAULT 6500,   -- fixed Rp 6.500 inter-bank fee
    net_amount          DECIMAL(15,2) NOT NULL,
    transfer_ref        VARCHAR(100),                  -- customer-provided bukti transfer ref
    proof_image_url     VARCHAR(500),                  -- uploaded struk / screenshot
    verified_by         INT,                           -- admin user_id
    status              ENUM('UNVERIFIED','VERIFIED','REJECTED') DEFAULT 'UNVERIFIED',
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at         TIMESTAMP NULL
);

-- ── BCA REFUNDS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refunds (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    channel             ENUM('VA','TRANSFER') NOT NULL,
    channel_txn_id      INT          NOT NULL,        -- va_transactions.id or transfer_payments.id
    platform_booking_id INT          NOT NULL,
    amount              DECIMAL(15,2) NOT NULL,
    reason              TEXT,
    status              ENUM('PENDING','PROCESSED','FAILED') DEFAULT 'PENDING',
    processed_by        INT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at        TIMESTAMP NULL
);

-- ── BCA DAILY SETTLEMENT ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_settlement (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    settlement_date DATE        NOT NULL,
    channel         ENUM('VA','TRANSFER') NOT NULL,
    total_txns      INT DEFAULT 0,
    gross_total     DECIMAL(15,2) DEFAULT 0,
    total_fees      DECIMAL(10,2) DEFAULT 0,
    net_total       DECIMAL(15,2) DEFAULT 0,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_date_channel (settlement_date, channel)
);

-- ── SEED: sample BCA VA payments ─────────────────────────────
INSERT INTO va_transactions
    (platform_booking_id, user_id, va_number, amount, fee, net_amount,
     customer_name, status, payment_ntb, paid_at)
VALUES
(4,  8, '7001244444444001', 400000, 4000, 396000, 'Maya Indah',  'PAID', 'BCA-NTB-001234', '2026-05-09 11:05:00'),
(5,  5, '7001244444444002', 500000, 4000, 496000, 'Dani Kusuma', 'PAID', 'BCA-NTB-001235', '2026-05-09 07:30:00'),
(6,  6, '7001244444444003', 170000, 4000, 166000, 'Siti Rahayu', 'PAID', 'BCA-NTB-001236', '2026-05-06 09:10:00');

-- ── SEED: sample BCA transfer payments ───────────────────────
INSERT INTO transfer_payments
    (platform_booking_id, user_id, amount, fee, net_amount, transfer_ref, status, verified_at)
VALUES
(7,  7, 360000, 6500, 353500, 'BCA-REF-20260508-09134', 'VERIFIED', '2026-05-08 08:00:00'),
(8,  8, 600000, 6500, 593500, 'BCA-REF-20260509-12045', 'VERIFIED', '2026-05-09 21:00:00');

INSERT INTO daily_settlement (settlement_date, channel, total_txns, gross_total, total_fees, net_total) VALUES
('2026-05-06', 'VA',       1,  170000, 4000,  166000),
('2026-05-08', 'TRANSFER', 1,  360000, 6500,  353500),
('2026-05-09', 'VA',       2,  900000, 8000,  892000),
('2026-05-09', 'TRANSFER', 1,  600000, 6500,  593500);


-- ============================================================
--  SHARED PAYMENTS LEDGER  (sportspace_finance)
--  Unified view across GoPay + BCA + Cash + QRIS
-- ============================================================
CREATE DATABASE IF NOT EXISTS sportspace_finance;
USE sportspace_finance;

-- ── PAYMENT METHODS CATALOGUE ────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_methods (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(30)  NOT NULL UNIQUE,
    name            VARCHAR(80)  NOT NULL,
    category        ENUM('e_wallet','bank_transfer','virtual_account','cash','qris') NOT NULL,
    provider        VARCHAR(50),
    is_active       BOOLEAN DEFAULT TRUE,
    fee_flat        DECIMAL(10,2) DEFAULT 0,
    fee_pct         DECIMAL(5,4)  DEFAULT 0,
    settlement_days TINYINT DEFAULT 1,
    source_db       VARCHAR(50),                      -- 'sportspace_gopay' or 'sportspace_bca'
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO payment_methods
    (code, name, category, provider, fee_flat, fee_pct, settlement_days, source_db) VALUES
('CASH',   'Cash',                 'cash',             NULL,    0,    0,      0, NULL),
('QRIS',   'QRIS (QR Code)',       'qris',             NULL,    0,    0.007,  1, NULL),
('GOPAY',  'GoPay',                'e_wallet',         'GoPay', 0,    0.007,  1, 'sportspace_gopay'),
('BCA_VA', 'BCA Virtual Account',  'virtual_account',  'BCA',   4000, 0,      1, 'sportspace_bca'),
('BCA_TF', 'BCA Bank Transfer',    'bank_transfer',    'BCA',   6500, 0,      2, 'sportspace_bca'),
('CC',     'Credit Card',          'qris',             NULL,    0,    0.02,   3, NULL),
('DC',     'Debit Card',           'qris',             NULL,    0,    0.01,   2, NULL);

-- ── UNIFIED PAYMENTS LEDGER ──────────────────────────────────
-- Every confirmed/settled payment from any channel lands here
CREATE TABLE IF NOT EXISTS payments (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    platform_booking_id INT          NOT NULL,
    user_id             INT          NOT NULL,
    payment_method_code VARCHAR(30)  NOT NULL,
    source_db           VARCHAR(50),                  -- which channel DB holds the raw txn
    channel_txn_id      INT,                          -- id in that channel DB's txn table
    gross_amount        DECIMAL(15,2) NOT NULL,
    fee_amount          DECIMAL(10,2) DEFAULT 0,
    net_amount          DECIMAL(15,2) NOT NULL,
    status              ENUM('PENDING','SETTLED','REFUNDED','FAILED') DEFAULT 'PENDING',
    settlement_date     DATE,
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── REFUNDS LEDGER ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refunds (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    payment_id          INT          NOT NULL,
    platform_booking_id INT          NOT NULL,
    refund_channel      VARCHAR(30)  NOT NULL,
    amount              DECIMAL(15,2) NOT NULL,
    reason              TEXT,
    status              ENUM('PENDING','PROCESSED','FAILED') DEFAULT 'PENDING',
    processed_by        INT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at        TIMESTAMP NULL,
    FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- ── SEED: ledger entries mirroring seeded channel data ───────
INSERT INTO payments
    (platform_booking_id, user_id, payment_method_code, source_db, channel_txn_id,
     gross_amount, fee_amount, net_amount, status, settlement_date)
VALUES
(1, 5, 'GOPAY',  'sportspace_gopay', 1, 240000, 1680, 238320, 'SETTLED', '2026-05-06'),
(2, 6, 'GOPAY',  'sportspace_gopay', 2, 510000, 3570, 506430, 'SETTLED', '2026-05-07'),
(3, 7, 'GOPAY',  'sportspace_gopay', 3, 170000, 1190, 168810, 'SETTLED', '2026-05-06'),
(4, 8, 'BCA_VA', 'sportspace_bca',   1, 400000, 4000, 396000, 'SETTLED', '2026-05-09'),
(5, 5, 'BCA_VA', 'sportspace_bca',   2, 500000, 4000, 496000, 'SETTLED', '2026-05-09'),
(6, 6, 'BCA_VA', 'sportspace_bca',   3, 170000, 4000, 166000, 'SETTLED', '2026-05-06'),
(7, 7, 'BCA_TF', 'sportspace_bca',   1, 360000, 6500, 353500, 'SETTLED', '2026-05-08'),
(8, 8, 'BCA_TF', 'sportspace_bca',   2, 600000, 6500, 593500, 'SETTLED', '2026-05-09');
