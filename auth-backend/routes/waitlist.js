/**
 * Waitlist routes for MVP lockdown mode
 * Stores waitlist entries via the async storage layer; idempotent by email.
 */
const express = require('express');
const router = express.Router();
const crypto = require('node:crypto');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const { sendWaitlistConfirmation } = require('../services/emailService');
const { requireAdmin } = require('../middleware/requireAdmin');

const waitlistSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  captcha: z.string().min(10).optional() // TODO: verify with hCaptcha/Turnstile
});

// Limit public waitlist joins to 5 requests per minute per IP to prevent abuse
const waitlistLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      ok: false,
      error: 'Too many requests. Please try again later.'
    });
  }
});

// Limit public status lookups to 10 requests per minute per IP to deter
// email enumeration and resource-exhaustion (DoS) abuse.
const statusLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      ok: false,
      error: 'Too many requests. Please try again later.'
    });
  }
});

// Validate the email query param for the public status endpoint.
const statusQuerySchema = z.object({
  email: z.string().max(254, 'Email too long').email('Invalid email address')
});

/**
 * POST /api/waitlist
 * Add email to waitlist (idempotent - returns success if already exists)
 */
router.post('/', waitlistLimiter, async (req, res) => {
  try {
    const parsed = waitlistSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues[0]?.message || 'Invalid input'
      });
    }

    const { email, name, captcha } = parsed.data;

    // TODO: Verify captcha with hCaptcha/Turnstile using server-side secret.
    // Skip gracefully when no captcha secret is configured so this never crashes.
    if (captcha && process.env.CAPTCHA_SECRET) {
      // const verified = await verifyCaptcha(captcha);
      // if (!verified) return res.status(400).json({ ok: false, error: 'Invalid captcha' });
    }

    const list = await req.app.locals.storage.getWaitlist();

    // Check for existing entry (case-insensitive)
    const existing = list.find(x => x.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      // Idempotent: return success if already on list
      return res.status(200).json({ ok: true, message: 'Already on waitlist' });
    }

    const entry = {
      id: `wl_${crypto.randomUUID()}`,
      email: email.toLowerCase(),
      name: name,
      addedAt: new Date().toISOString(),
      approved: false,
      approvedAt: null,
      inviteToken: null
    };

    list.push(entry);
    await req.app.locals.storage.saveWaitlist(list);

    // Send confirmation email (don't block response)
    sendWaitlistConfirmation(email, name || 'there').catch(err => {
      console.error('Failed to send waitlist confirmation:', err);
    });

    console.log(`[Waitlist] Added: ${email}`);
    res.json({ ok: true, message: 'Added to waitlist' });
  } catch (err) {
    console.error('[Waitlist] Error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/**
 * GET /api/waitlist/status
 * Check if an email is on the waitlist.
 * Rate limited and intentionally does NOT reveal approval status to an
 * unauthenticated caller (prevents enumeration of approved accounts).
 */
router.get('/status', statusLimiter, async (req, res) => {
  try {
    const parsed = statusQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues[0]?.message || 'Invalid input'
      });
    }

    const email = parsed.data.email.toLowerCase();

    const list = await req.app.locals.storage.getWaitlist();
    const entry = list.find(x => x.email === email);

    // Return only whether the email is on the waitlist; do not leak the
    // 'approved' boolean. Approval state is always reported as 'pending'.
    res.json({
      ok: true,
      onWaitlist: !!entry,
      status: 'pending'
    });
  } catch (err) {
    console.error('[Waitlist] Status error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/**
 * GET /api/waitlist (admin)
 * List all waitlist entries (requires admin auth)
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const list = await req.app.locals.storage.getWaitlist();
    res.json({ ok: true, entries: list, count: list.length });
  } catch (err) {
    console.error('[Waitlist] List error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

module.exports = router;
