require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  const db = process.env.DB_NAME || 'footprint_db';

  console.log('[migrate] Creating database if not exists...');
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${db}\``);
  console.log(`[migrate] Using database: ${db}`);

  const statements = [
    [`users`, `CREATE TABLE IF NOT EXISTS users (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      email        VARCHAR(320) UNIQUE NOT NULL,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_scan_at DATETIME NULL
    ) ENGINE=InnoDB`],

    [`otp_verifications`, `CREATE TABLE IF NOT EXISTS otp_verifications (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      email      VARCHAR(320) NOT NULL,
      otp_hash   VARCHAR(64)  NOT NULL,
      attempts   TINYINT      DEFAULT 0,
      verified   TINYINT(1)   DEFAULT 0,
      expires_at DATETIME     NOT NULL,
      created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_otp_email   (email),
      INDEX idx_otp_expires (expires_at)
    ) ENGINE=InnoDB`],

    [`scan_sessions`, `CREATE TABLE IF NOT EXISTS scan_sessions (
      id           CHAR(36)     PRIMARY KEY,
      user_id      INT          NULL,
      email        VARCHAR(320) NOT NULL,
      risk_score   TINYINT      NULL,
      risk_level   VARCHAR(10)  NULL,
      risk_summary TEXT         NULL,
      raw_report   JSON         NULL,
      status       VARCHAR(10)  DEFAULT 'pending',
      created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME     NULL,
      INDEX idx_session_email (email),
      INDEX idx_session_user  (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`],

    [`breaches`, `CREATE TABLE IF NOT EXISTS breaches (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      session_id   CHAR(36)     NOT NULL,
      service_name VARCHAR(120) NOT NULL,
      breach_date  VARCHAR(10)  NULL,
      severity     VARCHAR(10)  NULL,
      data_types   JSON         NULL,
      description  TEXT         NULL,
      icon         VARCHAR(10)  NULL,
      created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_breach_session (session_id),
      FOREIGN KEY (session_id) REFERENCES scan_sessions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`],

    [`exposed_data_types`, `CREATE TABLE IF NOT EXISTS exposed_data_types (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      session_id CHAR(36)    NOT NULL,
      data_type  VARCHAR(80) NOT NULL,
      FOREIGN KEY (session_id) REFERENCES scan_sessions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`],

    [`action_items`, `CREATE TABLE IF NOT EXISTS action_items (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      session_id CHAR(36)     NOT NULL,
      sort_order TINYINT      DEFAULT 0,
      title      VARCHAR(200) NOT NULL,
      detail     TEXT         NULL,
      FOREIGN KEY (session_id) REFERENCES scan_sessions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`],

    [`resources`, `CREATE TABLE IF NOT EXISTS resources (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      session_id  CHAR(36)     NOT NULL,
      title       VARCHAR(200) NOT NULL,
      type        VARCHAR(20)  NULL,
      description TEXT         NULL,
      url         TEXT         NULL,
      relevance   TEXT         NULL,
      FOREIGN KEY (session_id) REFERENCES scan_sessions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`],
  ];

  for (const [name, sql] of statements) {
    await conn.query(sql);
    console.log(`[migrate] ✅  Table ready: ${name}`);
  }

  await conn.end();
  console.log('\n[migrate] All tables created. Run: npm run dev\n');
}

migrate().catch(err => {
  console.error('[migrate] Failed:', err.message);
  process.exit(1);
});