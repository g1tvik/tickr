/**
 * Enforces LOCKDOWN/waitlist access control on the BACKEND (the frontend guard
 * alone is bypassable via direct API calls). When lockdown mode is on, a user
 * must be approved (user.approved === true) to use gated endpoints.
 *
 * Order: mount AFTER authenticateToken so req.user is set.
 * No-op when lockdown is disabled, so it's safe to apply broadly.
 */
async function requireApproved(req, res, next) {
  try {
    if (!req.app.locals.lockdown) return next(); // only enforced in lockdown mode

    const userId = req.user && req.user.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const user = await req.app.locals.storage.getUserById(userId);
    if (!user || user.approved !== true) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval for early access.',
        code: 'NOT_APPROVED',
      });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireApproved };
