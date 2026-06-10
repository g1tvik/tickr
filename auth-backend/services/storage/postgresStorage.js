/**
 * Postgres-backed implementation of the tickr Storage interface.
 * See ./index.js for the interface contract that routes rely on.
 *
 * Entity objects are stored verbatim as JSONB so route logic (read object →
 * mutate → save) is unchanged; only the calls become async. The money/inventory
 * critical sections use withUserLock(), which serializes per-user mutations via
 * a Postgres transaction + advisory lock so concurrent buy/sell/purchase can
 * never corrupt balances or positions.
 */
const fs = require('fs');
const path = require('path');
const { getPool, tx, closePool } = require('../../db/pool');

const SCHEMA_SQL = fs.readFileSync(path.join(__dirname, '..', '..', 'db', 'schema.sql'), 'utf8');

class PostgresStorage {
  constructor() {
    this.kind = 'postgres';
  }

  async init() {
    await getPool().query(SCHEMA_SQL);
  }

  async close() {
    await closePool();
  }

  // q() runs against the pool or a provided locked client (inside withUserLock).
  _q(client, text, params) {
    return (client || getPool()).query(text, params);
  }

  // ---- Users -------------------------------------------------------------
  async getUsers(client) {
    const { rows } = await this._q(client, 'SELECT id, data FROM users');
    const out = {};
    for (const r of rows) out[r.id] = r.data;
    return out;
  }

  async saveUsers(users, client) {
    const entries = Object.entries(users || {});
    if (!entries.length) return;
    const run = async (c) => {
      for (const [id, data] of entries) await this.saveUser(data, c);
    };
    return client ? run(client) : tx(run);
  }

  async getUserById(id, client) {
    if (!id) return null;
    const { rows } = await this._q(client, 'SELECT data FROM users WHERE id = $1', [id]);
    return rows[0] ? rows[0].data : null;
  }

  async getUserByEmail(email, client) {
    if (!email) return null;
    const { rows } = await this._q(client, 'SELECT data FROM users WHERE lower(email) = lower($1) LIMIT 1', [email]);
    return rows[0] ? rows[0].data : null;
  }

  async getUserByUsername(username, client) {
    if (!username) return null;
    const { rows } = await this._q(client, 'SELECT data FROM users WHERE lower(username) = lower($1) LIMIT 1', [username]);
    return rows[0] ? rows[0].data : null;
  }

  async saveUser(user, client) {
    if (!user || !user.id) throw new Error('saveUser requires user.id');
    await this._q(
      client,
      `INSERT INTO users (id, email, username, data, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, now())
       ON CONFLICT (id) DO UPDATE
         SET email = EXCLUDED.email, username = EXCLUDED.username,
             data = EXCLUDED.data, updated_at = now()`,
      [user.id, user.email || null, user.username || null, JSON.stringify(user)]
    );
  }

  async deleteUser(id, client) {
    await this._q(client, 'DELETE FROM users WHERE id = $1', [id]);
    await this._q(client, 'DELETE FROM portfolios WHERE user_id = $1', [id]);
    await this._q(client, 'DELETE FROM transactions WHERE user_id = $1', [id]);
    await this._q(client, 'DELETE FROM orders WHERE user_id = $1', [id]);
  }

  // ---- Portfolios --------------------------------------------------------
  async getPortfolios(client) {
    const { rows } = await this._q(client, 'SELECT user_id, data FROM portfolios');
    const out = {};
    for (const r of rows) out[r.user_id] = r.data;
    return out;
  }

  async savePortfolios(portfolios, client) {
    const entries = Object.entries(portfolios || {});
    if (!entries.length) return;
    const run = async (c) => {
      for (const [userId, data] of entries) await this.savePortfolio(userId, data, c);
    };
    return client ? run(client) : tx(run);
  }

  async getPortfolio(userId, client) {
    const { rows } = await this._q(client, 'SELECT data FROM portfolios WHERE user_id = $1', [userId]);
    return rows[0] ? rows[0].data : null;
  }

  async savePortfolio(userId, portfolio, client) {
    await this._q(
      client,
      `INSERT INTO portfolios (user_id, data, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [userId, JSON.stringify(portfolio)]
    );
  }

  // ---- Transactions (one row per txn; array shape preserved at the edges) -
  async getTransactions(client) {
    const { rows } = await this._q(client, 'SELECT user_id, data FROM transactions ORDER BY id');
    const out = {};
    for (const r of rows) (out[r.user_id] = out[r.user_id] || []).push(r.data);
    return out;
  }

  async saveTransactions(transactions, client) {
    // Full replace — rarely used (resets/imports). Done atomically.
    const run = async (c) => {
      await c.query('DELETE FROM transactions');
      for (const [userId, list] of Object.entries(transactions || {})) {
        for (const txn of list || []) await this.addTransaction(userId, txn, c);
      }
    };
    return client ? run(client) : tx(run);
  }

  async getUserTransactions(userId, client) {
    const { rows } = await this._q(client, 'SELECT data FROM transactions WHERE user_id = $1 ORDER BY id', [userId]);
    return rows.map((r) => r.data);
  }

  async addTransaction(userId, txn, client) {
    await this._q(client, 'INSERT INTO transactions (user_id, data) VALUES ($1, $2::jsonb)', [
      userId,
      JSON.stringify(txn),
    ]);
  }

  // ---- Orders ------------------------------------------------------------
  async getUserOrders(userId, client) {
    const { rows } = await this._q(client, 'SELECT data FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return rows.map((r) => r.data);
  }

  async getOrder(userId, orderId, client) {
    const { rows } = await this._q(client, 'SELECT data FROM orders WHERE user_id = $1 AND id = $2', [userId, orderId]);
    return rows[0] ? rows[0].data : null;
  }

  async getOpenOrders(client) {
    const { rows } = await this._q(
      client,
      "SELECT data FROM orders WHERE status IN ('pending','partially_filled') ORDER BY created_at",
    );
    return rows.map((r) => r.data);
  }

  async addOrder(userId, order, client) {
    await this._q(
      client,
      `INSERT INTO orders (id, user_id, status, data)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, data = EXCLUDED.data, updated_at = now()`,
      [order.id, userId, order.status || 'pending', JSON.stringify(order)]
    );
  }

  async updateOrder(userId, orderId, patch, client) {
    const existing = await this.getOrder(userId, orderId, client);
    if (!existing) return null;
    const merged = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    await this._q(
      client,
      'UPDATE orders SET status = $3, data = $4::jsonb, updated_at = now() WHERE user_id = $1 AND id = $2',
      [userId, orderId, merged.status || 'pending', JSON.stringify(merged)]
    );
    return merged;
  }

  // ---- Waitlist ----------------------------------------------------------
  async getWaitlist(client) {
    const { rows } = await this._q(client, 'SELECT data FROM waitlist ORDER BY created_at');
    return rows.map((r) => r.data);
  }

  async saveWaitlist(list, client) {
    const run = async (c) => {
      await c.query('DELETE FROM waitlist');
      for (const entry of list || []) {
        await c.query('INSERT INTO waitlist (id, email, data) VALUES ($1, $2, $3::jsonb)', [
          entry.id || entry.email,
          entry.email || null,
          JSON.stringify(entry),
        ]);
      }
    };
    return client ? run(client) : tx(run);
  }

  // ---- Invites -----------------------------------------------------------
  async getInvites(client) {
    const { rows } = await this._q(client, 'SELECT data FROM invites ORDER BY created_at');
    return rows.map((r) => r.data);
  }

  async saveInvites(list, client) {
    const run = async (c) => {
      await c.query('DELETE FROM invites');
      for (const inv of list || []) {
        await c.query('INSERT INTO invites (token, data) VALUES ($1, $2::jsonb)', [
          inv.token,
          JSON.stringify(inv),
        ]);
      }
    };
    return client ? run(client) : tx(run);
  }

  // ---- Atomic per-user critical section ----------------------------------
  /**
   * Serializes concurrent mutations for `userId`. Runs `fn(txStore)` inside a
   * transaction holding a per-user advisory lock; `txStore` is this same API
   * bound to the locked client. Commit on success, rollback on throw.
   * @template T
   * @param {string} userId
   * @param {(txStore: object) => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async withUserLock(userId, fn) {
    return tx(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [String(userId)]);
      const txStore = bindClient(this, client);
      return fn(txStore);
    });
  }
}

// Bind every storage method to a fixed client so callers inside withUserLock
// don't have to thread `client` through manually.
function bindClient(store, client) {
  const bound = {};
  const proto = Object.getPrototypeOf(store);
  for (const name of Object.getOwnPropertyNames(proto)) {
    if (name === 'constructor' || name === 'withUserLock' || name === 'init' || name === 'close') continue;
    const fn = store[name];
    if (typeof fn !== 'function') continue;
    bound[name] = (...args) => fn.call(store, ...args, client);
  }
  return bound;
}

module.exports = PostgresStorage;
