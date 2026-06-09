/**
 * Postgres connection pool.
 *
 * Reads DATABASE_URL (e.g. postgres://user:pass@host:5432/db). Set DATABASE_SSL=true
 * for managed providers that require TLS. Exposes a singleton pool plus a `tx`
 * helper that runs a callback inside a BEGIN/COMMIT transaction (ROLLBACK on throw).
 */
const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set — cannot create Postgres pool');
  }
  const ssl =
    process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: false }
      : undefined;
  pool = new Pool({
    connectionString,
    ssl,
    max: Number(process.env.DATABASE_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  pool.on('error', (err) => {
    console.error('[db] Unexpected idle client error:', err.message);
  });
  return pool;
}

/**
 * Run `fn(client)` inside a transaction. Commits on success, rolls back on throw.
 * @template T
 * @param {(client: import('pg').PoolClient) => Promise<T>} fn
 * @returns {Promise<T>}
 */
async function tx(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('[db] Rollback failed:', rollbackErr.message);
    }
    throw err;
  } finally {
    client.release();
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, tx, closePool };
