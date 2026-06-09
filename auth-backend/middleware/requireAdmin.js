/**
 * Admin authentication for sensitive endpoints (waitlist export, invite
 * creation/listing). Fail-closed: if ADMIN_API_KEY is not configured, every
 * admin endpoint is denied. Compares with a constant-time check.
 *
 * Usage:  router.get('/', requireAdmin, handler)
 * Client: send header  x-admin-key: <ADMIN_API_KEY>
 */
const crypto = require('crypto');

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function requireAdmin(req, res, next) {
  const configured = process.env.ADMIN_API_KEY;
  if (!configured) {
    return res.status(503).json({
      ok: false,
      error: 'Admin functionality is not configured on this server.',
      code: 'ADMIN_NOT_CONFIGURED',
    });
  }
  const provided = req.get('x-admin-key') || (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!provided || !safeEqual(provided, configured)) {
    return res.status(403).json({ ok: false, error: 'Admin access required.', code: 'FORBIDDEN' });
  }
  next();
}

module.exports = { requireAdmin };
