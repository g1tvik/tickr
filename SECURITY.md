# Security & deployment hardening

This document summarizes the security posture of tickr and the steps required
before a production deployment.

## ✅ Before you deploy — required

1. **Rotate every secret.** Treat the values currently in `auth-backend/.env` as
   compromised (they were committed to a working tree at some point). Regenerate:
   - `JWT_SECRET` → `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
     (the server refuses to boot in production with a weak/short secret).
   - Alpaca API key/secret, Gemini API key, Gmail app password, Google OAuth client.
2. **Set `DATABASE_URL`** to your Postgres instance (required in production — the
   server will not start on file storage in production).
3. **Set `ADMIN_API_KEY`** (random 24+ bytes) to enable the admin endpoints
   (waitlist export, invite creation). If unset, those endpoints are disabled.
4. **Keep `ALPACA_ENV=paper`** unless you intentionally enable real-money trading,
   which additionally requires `CONFIRM_LIVE_TRADING=true`.
5. **Terminate TLS** in front of the app (load balancer / reverse proxy) and enable
   the HSTS header (commented in `stockbuddy/nginx.conf`).
6. Set `FRONTEND_URL` (and any `CORS_EXTRA_ORIGINS`) so CORS is restricted to your
   real origin in production.

## ✅ What is already hardened

- **Auth:** bcrypt password hashing; password-complexity enforcement; email/username
  validation + normalization; JWTs signed with a validated secret.
- **Authorization:** admin endpoints (waitlist/invites) require `ADMIN_API_KEY`
  (fail-closed); LOCKDOWN/waitlist mode is enforced on the backend (not just the UI)
  via `requireApproved` on gated routes.
- **Data integrity:** all money/inventory mutations (buy/sell/purchase/use, active
  effects) run inside per-user atomic locked transactions — no races, no double-spend.
- **Input validation:** Zod schemas on mutating routes; server-owned fields
  (`coins`, `xp`) can never be set by the client.
- **Injection:** all Postgres access is parameterized; no string-built SQL.
- **Rate limiting:** global limiter plus dedicated limiters on auth, account-mutation,
  trading market data, search, leaderboard, and waitlist endpoints.
- **Secrets/logging:** the Gemini key is sent as a header (never in URLs/logs);
  response bodies are not logged; error details/stack traces are suppressed in
  production responses.
- **DoS:** request body size limit (1 MB); in-memory caches are size-capped; external
  API calls have timeouts; query-length limits on search.
- **Transport/headers:** nginx sets CSP, X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, Permissions-Policy; containers run as a non-root user with healthchecks.

## ⚠️ Known limitations (acceptable for launch, plan to revisit)

- **JWT lifetime & revocation.** Access tokens last 7 days and there is no refresh-token
  rotation or server-side revocation list. Logging out clears the client token but does
  not invalidate it server-side. For higher-assurance deployments, add short-lived access
  tokens + rotating refresh tokens (or a token/`jti` blacklist checked in
  `authenticateToken`). Deleting an account already makes its token largely inert because
  protected handlers reject requests whose user no longer exists.
- **CAPTCHA** on the public waitlist join is a no-op stub unless `CAPTCHA_SECRET` is
  configured; the endpoint is rate-limited regardless.

## Reporting

For a private project, route security reports to the repository owner.
