const crypto = require('crypto');

function generateOTP() {
  const buf = crypto.randomBytes(4);
  const num = buf.readUInt32BE(0) % 900000 + 100000;
  return String(num);
}

function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function verifyOTPHash(inputOtp, storedHash) {
  const inputHash = hashOTP(inputOtp);
  try {
    return crypto.timingSafeEqual(Buffer.from(inputHash,'hex'), Buffer.from(storedHash,'hex'));
  } catch { return false; }
}

module.exports = { generateOTP, hashOTP, verifyOTPHash };