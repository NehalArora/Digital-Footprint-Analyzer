const pool = require('../db/pool');
const { analyzeEmail } = require('../services/scanService');

/**
 * POST /api/scan/start
 */
async function startScan(req, res) {
  const { sessionId, email } = req.body;

  if (!sessionId || !email) {
    return res.status(400).json({ success: false, message: 'sessionId and email are required.' });
  }

  const [rows] = await pool.query(
    `SELECT id, status FROM scan_sessions WHERE id = ? AND email = ?`,
    [sessionId, email.trim().toLowerCase()]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Session not found.' });
  }

  const session = rows[0];

  if (session.status === 'done') {
    return res.json({ success: true, message: 'Scan already completed.', sessionId });
  }
  if (session.status === 'running') {
    return res.json({ success: true, message: 'Scan already in progress.', sessionId });
  }

  await pool.query(`UPDATE scan_sessions SET status = 'running' WHERE id = ?`, [sessionId]);

  // Fire and forget
  runScanAsync(sessionId, email.trim().toLowerCase());

  return res.json({
    success: true,
    message: 'Scan started. Poll /api/scan/result/:sessionId for results.',
    sessionId,
  });
}

async function runScanAsync(sessionId, email) {
  try {
    console.log(`[Scan] Analyzing ${email} (session: ${sessionId})`);
    const report = await analyzeEmail(email);

    await pool.query(
      `UPDATE scan_sessions
       SET risk_score = ?, risk_level = ?, risk_summary = ?,
           raw_report = ?, status = 'done', completed_at = NOW()
       WHERE id = ?`,
      [report.riskScore, report.riskLevel, report.riskSummary, JSON.stringify(report), sessionId]
    );

    await pool.query(
      `UPDATE users SET last_scan_at = NOW() WHERE email = ?`,
      [email]
    );

    for (const b of (report.breaches || [])) {
      await pool.query(
        `INSERT INTO breaches (session_id, service_name, breach_date, severity, data_types, description, icon)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [sessionId, b.name, b.date, b.severity, JSON.stringify(b.dataTypes || []), b.description, b.icon]
      );
    }

    for (const dt of (report.exposedDataTypes || [])) {
      await pool.query(
        `INSERT INTO exposed_data_types (session_id, data_type) VALUES (?, ?)`,
        [sessionId, dt]
      );
    }

    let order = 0;
    for (const a of (report.immediateActions || [])) {
      await pool.query(
        `INSERT INTO action_items (session_id, sort_order, title, detail) VALUES (?, ?, ?, ?)`,
        [sessionId, order++, a.title, a.detail]
      );
    }

    for (const r of (report.resources || [])) {
      await pool.query(
        `INSERT INTO resources (session_id, title, type, description, url, relevance)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sessionId, r.title, r.type, r.description, r.url, r.relevance]
      );
    }

    console.log(`[Scan] ✅ Done for ${email} — ${report.riskLevel} (${report.riskScore})`);
  } catch (err) {
    console.error(`[Scan] ❌ Failed for session ${sessionId}:`, err.message);
    await pool.query(
      `UPDATE scan_sessions SET status = 'failed', completed_at = NOW() WHERE id = ?`,
      [sessionId]
    );
  }
}

/**
 * GET /api/scan/result/:sessionId
 */
async function getScanResult(req, res) {
  const { sessionId } = req.params;

  const [rows] = await pool.query(
    `SELECT id, email, risk_score, risk_level, risk_summary, status, created_at, completed_at
     FROM scan_sessions WHERE id = ?`,
    [sessionId]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Session not found.' });
  }

  const session = rows[0];

  if (session.status === 'pending' || session.status === 'running') {
    return res.json({ success: true, status: session.status, message: 'Scan in progress...' });
  }
  if (session.status === 'failed') {
    return res.json({ success: false, status: 'failed', message: 'Scan failed. Please try again.' });
  }

  const [[breaches], [actions], [resources], [dataTypes]] = await Promise.all([
    pool.query(`SELECT * FROM breaches WHERE session_id = ? ORDER BY id`, [sessionId]),
    pool.query(`SELECT * FROM action_items WHERE session_id = ? ORDER BY sort_order`, [sessionId]),
    pool.query(`SELECT * FROM resources WHERE session_id = ? ORDER BY id`, [sessionId]),
    pool.query(`SELECT data_type FROM exposed_data_types WHERE session_id = ?`, [sessionId]),
  ]);

  // Parse JSON fields stored as strings
  const parsedBreaches = breaches.map(b => ({
    ...b,
    data_types: typeof b.data_types === 'string' ? JSON.parse(b.data_types) : b.data_types,
  }));

  return res.json({
    success: true,
    status: 'done',
    data: {
      sessionId: session.id,
      email: session.email,
      riskScore: session.risk_score,
      riskLevel: session.risk_level,
      riskSummary: session.risk_summary,
      scannedAt: session.completed_at,
      breaches: parsedBreaches,
      immediateActions: actions,
      resources,
      exposedDataTypes: dataTypes.map(r => r.data_type),
    },
  });
}

/**
 * GET /api/scan/history/:email
 */
async function getScanHistory(req, res) {
  const email = req.params.email.trim().toLowerCase();
  const [rows] = await pool.query(
    `SELECT id, risk_score, risk_level, risk_summary, status, created_at, completed_at
     FROM scan_sessions WHERE email = ? ORDER BY created_at DESC LIMIT 20`,
    [email]
  );
  return res.json({ success: true, scans: rows });
}

module.exports = { startScan, getScanResult, getScanHistory };