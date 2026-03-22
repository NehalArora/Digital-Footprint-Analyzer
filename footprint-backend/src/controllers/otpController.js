const pool = require('../db/pool');
const { generateOTP, hashOTP, verifyOTPHash } = require('../utils/otp');
const { sendOTPEmail } = require('../services/emailService');

const OTP_EXPIRY_MIN = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
const MAX_ATTEMPTS   = parseInt(process.env.OTP_MAX_ATTEMPTS)   || 5;

/**
 * POST /api/otp/send
 */
async function sendOTP(req, res) {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  const normalised = email.trim().toLowerCase();

  // Rate-limit: max 3 OTPs per email per 10 minutes
  const [recentRows] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM otp_verifications
     WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)`,
    [normalised]
  );
  if (parseInt(recentRows[0].cnt) >= 3) {
    return res.status(429).json({
      success: false,
      message: 'Too many OTP requests. Please wait 10 minutes.',
    });
  }

  // Invalidate previous unverified OTPs
  await pool.query(
    `UPDATE otp_verifications SET verified = 1
     WHERE email = ? AND verified = 0 AND expires_at > NOW()`,
    [normalised]
  );

  const otp      = generateOTP();
  const otpHash  = hashOTP(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000);

  await pool.query(
    `INSERT INTO otp_verifications (email, otp_hash, expires_at) VALUES (?, ?, ?)`,
    [normalised, otpHash, expiresAt]
  );

  try {
    await sendOTPEmail(normalised, otp);
  } catch (err) {
    console.error('[OTP] Email send failed:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to send email. Check your Gmail credentials in .env.',
    });
  }

  console.log(`[OTP] Sent to ${normalised}`);

  return res.json({
    success: true,
    message: `OTP sent to ${normalised}. Expires in ${OTP_EXPIRY_MIN} minutes.`,
    expiresIn: OTP_EXPIRY_MIN * 60,
  });
}

/**
 * POST /api/otp/verify
 */
async function verifyOTP(req, res) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  const normalised = email.trim().toLowerCase();
  const cleanOtp   = String(otp).trim();

  const [rows] = await pool.query(
    `SELECT id, otp_hash, attempts, expires_at, verified
     FROM otp_verifications
     WHERE email = ? AND verified = 0 AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [normalised]
  );

  if (rows.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid OTP found. Please request a new one.',
    });
  }

  const record = rows[0];

  if (record.attempts >= MAX_ATTEMPTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many failed attempts. Please request a new OTP.',
    });
  }

  // Increment attempt count
  await pool.query(
    'UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?',
    [record.id]
  );

  if (!verifyOTPHash(cleanOtp, record.otp_hash)) {
    const remaining = MAX_ATTEMPTS - record.attempts - 1;
    return res.status(401).json({
      success: false,
      message: `Incorrect OTP. ${remaining} attempt(s) remaining.`,
    });
  }

  // Mark verified
  await pool.query('UPDATE otp_verifications SET verified = 1 WHERE id = ?', [record.id]);

  // Upsert user
  await pool.query(
    `INSERT INTO users (email) VALUES (?)
     ON DUPLICATE KEY UPDATE email = email`,
    [normalised]
  );
  const [userRows] = await pool.query('SELECT id FROM users WHERE email = ?', [normalised]);
  const userId = userRows[0].id;

  // Create pending scan session
  const { v4: uuidv4 } = require('uuid');
  const sessionId = uuidv4();
  await pool.query(
    `INSERT INTO scan_sessions (id, email, user_id, status) VALUES (?, ?, ?, 'pending')`,
    [sessionId, normalised, userId]
  );

  console.log(`[OTP] Verified for ${normalised} → session ${sessionId}`);

  return res.json({
    success: true,
    message: 'Email verified successfully.',
    sessionId,
    email: normalised,
  });
}

module.exports = { sendOTP, verifyOTP };