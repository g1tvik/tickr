require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const rfs = require('rotating-file-stream');
const authRoutes = require('./routes/auth');
const tradingRoutes = require('./routes/trading');
const aiCoachRoutes = require('./routes/ai-coach');
const shopRoutes = require('./routes/shop');
const waitlistRoutes = require('./routes/waitlist');
const inviteRoutes = require('./routes/invites');
const { createStorage } = require('./services/storage');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { validateEnv } = require('./middleware/validateEnv');

// Helper function to get formatted timestamp
const getTimestamp = () => {
  return new Date().toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
};

// Validate environment at boot
const env = validateEnv();
const LOCKDOWN = env.LOCKDOWN === 'true';
const ALPACA_ENV = env.ALPACA_ENV || 'paper';

// Warn if not using paper trading
if (ALPACA_ENV === 'live') {
  console.warn(`[${getTimestamp()}] ⚠️  LIVE TRADING ENABLED - Real money at risk!`);
  }

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // Disable CSP for API server
}));

// CORS configuration.
// Production: only the configured FRONTEND_URL (plus any extra origins in
// CORS_EXTRA_ORIGINS, comma-separated) are allowed.
// Development: any localhost origin is allowed for convenience.
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  ...(process.env.CORS_EXTRA_ORIGINS ? process.env.CORS_EXTRA_ORIGINS.split(',').map((s) => s.trim()) : []),
  ...(isProd ? [] : ['http://localhost:5173', 'http://localhost:3000']),
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // In development only, allow any localhost origin
    if (!isProd && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// Storage: Postgres when DATABASE_URL is set, otherwise file-based (dev/test).
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
let storage = createStorage();

// Setup rotating auth log
const logsDir = process.env.AUTH_LOG_DIR || path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const authLogStream = rfs.createStream('auth.log', {
  interval: '1d',
  size: '10M',
  path: logsDir
});

// Make shared resources available to routes
app.locals.storage = storage;
app.locals.authLogger = authLogStream;
app.locals.lockdown = LOCKDOWN;
app.locals.alpacaEnv = ALPACA_ENV;

// Global rate limiting (basic protection)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

// Request logging — quiet in test, and in production only when DEBUG_HTTP=true
if (process.env.NODE_ENV !== 'test' && (process.env.NODE_ENV !== 'production' || process.env.DEBUG_HTTP === 'true')) {
  app.use((req, res, next) => {
    console.log(`[${getTimestamp()}] ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    port: PORT,
    lockdown: LOCKDOWN,
    alpacaEnv: ALPACA_ENV
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/ai-coach', aiCoachRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/invites', inviteRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server (after storage is initialized: ensures Postgres schema / data files)
let serverInstance = null;
async function start() {
  try {
    await storage.init();
  } catch (err) {
    // In production, a database failure is fatal. In development, fall back to
    // file storage so a missing local Postgres doesn't take the whole app down.
    if (process.env.NODE_ENV === 'production') throw err;
    console.warn(`[${getTimestamp()}] ⚠️  Postgres unavailable (${err.code || err.message}). Falling back to file storage for development.`);
    const { FileStorage } = require('./services/storage');
    storage = new FileStorage(dataDir);
    app.locals.storage = storage;
    module.exports.storage = storage;
    await storage.init();
  }
  // Background order engine: fills resting limit/stop/trailing orders, expires
  // DAY orders at the close, and settles matured T+1 proceeds.
  app.locals.orderEngine = tradingRoutes.startOrderEngine(storage);

  serverInstance = app.listen(PORT, () => {
    console.log(`[${getTimestamp()}] 🚀 Tickr API running on port ${PORT}`);
    console.log(`[${getTimestamp()}] ⚙️  Order engine: processing resting orders every 5s`);
    console.log(`[${getTimestamp()}] 🗄️  Storage backend: ${storage.kind}${storage.kind === 'file' ? ` (${dataDir})` : ''}`);
    console.log(`[${getTimestamp()}] 📄 Auth logs: ${path.join(logsDir, 'auth.log')}`);
    console.log(`[${getTimestamp()}] 🔗 Health check: http://localhost:${PORT}/health`);
    if (LOCKDOWN) {
      console.log(`[${getTimestamp()}] 🔒 LOCKDOWN MODE: Only approved users can access the app`);
    }
    console.log(`[${getTimestamp()}] 📈 Alpaca environment: ${ALPACA_ENV}`);
  });
  return serverInstance;
}

if (require.main === module) {
  start().catch((err) => {
    console.error(`[${getTimestamp()}] ❌ Failed to start server:`, err.message);
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`[${getTimestamp()}] ${signal} received, shutting down...`);
    if (serverInstance) serverInstance.close();
    try { await storage.close(); } catch { /* ignore */ }
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = {
  app,
  start,
  storage
};
