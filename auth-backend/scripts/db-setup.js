#!/usr/bin/env node
/**
 * Ensure the Postgres schema exists and (optionally) import existing file-based
 * JSON data into it. Safe to run repeatedly.
 *
 *   node scripts/db-setup.js            # create schema only
 *   node scripts/db-setup.js --import   # also import data/*.json (skips rows that already exist)
 *
 * Requires DATABASE_URL to be set.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. Set it in auth-backend/.env first.');
    process.exit(1);
  }

  const PostgresStorage = require('../services/storage/postgresStorage');
  const storage = new PostgresStorage();
  await storage.init();
  console.log('✅ Schema ensured.');

  if (process.argv.includes('--import')) {
    const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
    const readJson = (name, fallback) => {
      const file = path.join(dataDir, name);
      if (!fs.existsSync(file)) return fallback;
      try {
        const raw = fs.readFileSync(file, 'utf8').trim();
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    };

    const users = readJson('users.json', {});
    const portfolios = readJson('portfolios.json', {});
    const transactions = readJson('transactions.json', {});
    const waitlist = readJson('waitlist.json', []);
    const invites = readJson('invites.json', []);

    let count = 0;
    for (const user of Object.values(users)) {
      if (user && user.id) { await storage.saveUser(user); count++; }
    }
    await storage.savePortfolios(portfolios);
    await storage.saveTransactions(transactions);
    if (Array.isArray(waitlist) && waitlist.length) await storage.saveWaitlist(waitlist);
    if (Array.isArray(invites) && invites.length) await storage.saveInvites(invites);

    console.log(`✅ Imported ${count} users + portfolios/transactions/waitlist/invites from ${dataDir}.`);
  }

  await storage.close();
  console.log('✅ Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ db-setup failed:', err.message);
  process.exit(1);
});
