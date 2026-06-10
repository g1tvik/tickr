/**
 * Storage factory + interface contract.
 *
 * Backend selection:
 *   - DATABASE_URL set            → PostgresStorage (production)
 *   - otherwise                   → FileStorage (local dev + tests, DATA_DIR)
 *
 * Both backends implement the SAME async interface. Routes must `await` every
 * call and access the instance via `req.app.locals.storage`.
 *
 * ── Interface ────────────────────────────────────────────────────────────────
 *   init(): Promise<void>                       // connect / ensure schema
 *   close(): Promise<void>
 *
 *   getUsers(): Promise<Record<id, User>>       // ALL users (cold paths only)
 *   saveUsers(users): Promise<void>             // upsert all (cold paths only)
 *   getUserById(id): Promise<User|null>
 *   getUserByEmail(email): Promise<User|null>   // case-insensitive
 *   getUserByUsername(name): Promise<User|null> // case-insensitive
 *   saveUser(user): Promise<void>               // upsert one (user.id required)
 *   deleteUser(id): Promise<void>               // cascades portfolio + txns
 *
 *   getPortfolios(): Promise<Record<id, Portfolio>>
 *   savePortfolios(map): Promise<void>
 *   getPortfolio(userId): Promise<Portfolio|null>
 *   savePortfolio(userId, portfolio): Promise<void>
 *
 *   getTransactions(): Promise<Record<id, Txn[]>>
 *   saveTransactions(map): Promise<void>
 *   getUserTransactions(userId): Promise<Txn[]>
 *   addTransaction(userId, txn): Promise<void>
 *
 *   getUserOrders(userId): Promise<Order[]>     // newest first
 *   getOrder(userId, orderId): Promise<Order|null>
 *   getOpenOrders(): Promise<Order[]>           // working orders across ALL users (engine input)
 *   addOrder(userId, order): Promise<void>      // order.id + order.status required
 *   updateOrder(userId, orderId, patch): Promise<Order|null>  // merges patch, bumps updatedAt
 *
 *   getWaitlist(): Promise<Entry[]>             // saveWaitlist(list) replaces
 *   saveWaitlist(list): Promise<void>
 *   getInvites(): Promise<Invite[]>             // saveInvites(list) replaces
 *   saveInvites(list): Promise<void>
 *
 *   // Money / inventory critical sections — ALWAYS use this for buy/sell/purchase:
 *   withUserLock(userId, async (tx) => { ...read, mutate, write via tx... }): Promise<T>
 *     `tx` is the same API, serialized for this user (Postgres: advisory-locked
 *     transaction, auto commit/rollback; File: in-process per-user mutex).
 *     Do NOT perform network calls (e.g. Alpaca quote fetches) inside the lock —
 *     fetch first, then mutate inside withUserLock.
 */
const path = require('path');
const PostgresStorage = require('./postgresStorage');
const FileStorage = require('./fileStorage');

function createStorage() {
  if (process.env.DATABASE_URL) {
    return new PostgresStorage();
  }
  const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
  return new FileStorage(dataDir);
}

module.exports = { createStorage, PostgresStorage, FileStorage };
