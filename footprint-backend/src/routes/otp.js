const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { sendOTP, verifyOTP } = require('../controllers/otpController');

const otpLimiter = rateLimit({ windowMs: 15*60*1000, max: 10 });
router.post('/send', otpLimiter, sendOTP);
router.post('/verify', otpLimiter, verifyOTP);
module.exports = router;