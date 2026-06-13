const fs = require('fs');
const os = require('os');
const path = require('path');

const tempDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tickr-auth-backend-data-'));
const tempLogDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tickr-auth-backend-logs-'));

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
// Force file storage for the test suite. server.js runs dotenv.config() at
// require time, which would otherwise load a real DATABASE_URL from .env and
// point storage at Postgres (which isn't running in CI/local tests). dotenv
// never overrides an already-defined key, so seeding it empty here wins, and an
// empty string is falsy in the storage selector → FileStorage(DATA_DIR).
process.env.DATABASE_URL = '';
// Likewise force the AI coach into its offline demo path: a real GEMINI_API_KEY
// in .env would make /analyze tests call the live Gemini API (slow, flaky, $).
process.env.GEMINI_API_KEY = '';
process.env.DATA_DIR = tempDataDir;
process.env.AUTH_LOG_DIR = tempLogDir;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'test-google-client-secret';
process.env.ALPACA_API_KEY = process.env.ALPACA_API_KEY || 'test-alpaca-key';
process.env.ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY || 'test-alpaca-secret';
process.env.EMAIL_USER = process.env.EMAIL_USER || 'test@example.com';
process.env.EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'test-password';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

