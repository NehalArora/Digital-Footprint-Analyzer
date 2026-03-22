require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');

const otpRoutes  = require('./routes/otp');
const scanRoutes = require('./routes/scan');
const { errorHandler } = require('./middleware/errorHandler');
const pool = require('./db/pool');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security headers ────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5500',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// ── Body parsing ────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── Global rate limit (fallback) ────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── Health check ────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// ── API Routes ──────────────────────────────────────────────
app.use('/api/otp',  otpRoutes);
app.use('/api/scan', scanRoutes);

// ── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ─────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   Digital Footprint Analyzer — Backend        ║
║   Running on http://localhost:${PORT}            ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(28)}║
╚═══════════════════════════════════════════════╝
  `);
});

module.exports = app;
