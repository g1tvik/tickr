/**
 * File-backed implementation of the tickr Storage interface (dev + tests).
 * Same async contract as PostgresStorage. Writes are atomic (temp file + rename)
 * and per-user critical sections are serialized with an in-process async mutex,
 * so single-process dev/test runs get the same correctness guarantees.
 *
 * NOTE: file storage is for local development and the test suite only. Production
 * must set DATABASE_URL so the Postgres backend is used (see ./index.js).
 */
const fs = require('fs');
const path = require('path');

class FileStorage {
  constructor(dataDir) {
    this.kind = 'file';
    this.dataDir = dataDir;
    this.files = {
      users: path.join(dataDir, 'users.json'),
      portfolios: path.join(dataDir, 'portfolios.json'),
      transactions: path.join(dataDir, 'transactions.json'),
      orders: path.join(dataDir, 'orders.json'),
      waitlist: path.join(dataDir, 'waitlist.json'),
      invites: path.join(dataDir, 'invites.json'),
    };
    this._locks = new Map(); // userId -> Promise (tail of the per-user queue)
  }

  async init() {
    if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
    for (const [key, file] of Object.entries(this.files)) {
      if (!fs.existsSync(file)) {
        const empty = key === 'waitlist' || key === 'invites' ? [] : {};
        this._write(file, empty);
      }
    }
  }

  async close() {}

  _read(file, fallback) {
    try {
      if (!fs.existsSync(file)) return fallback;
      const raw = fs.readFileSync(file, 'utf8').trim();
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.error(`[storage] read ${file} failed:`, err.message);
      return fallback;
    }
  }

  _write(file, data) {
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file); // atomic on POSIX
  }

  // ---- Users -------------------------------------------------------------
  async getUsers() {
    return this._read(this.files.users, {});
  }
  async saveUsers(users) {
    this._write(this.files.users, users || {});
  }
  async getUserById(id) {
    return id ? (await this.getUsers())[id] || null : null;
  }
  async getUserByEmail(email) {
    if (!email) return null;
    const users = await this.getUsers();
    return Object.values(users).find((u) => (u.email || '').toLowerCase() === email.toLowerCase()) || null;
  }
  async getUserByUsername(username) {
    if (!username) return null;
    const users = await this.getUsers();
    return Object.values(users).find((u) => (u.username || '').toLowerCase() === username.toLowerCase()) || null;
  }
  async saveUser(user) {
    if (!user || !user.id) throw new Error('saveUser requires user.id');
    const users = await this.getUsers();
    users[user.id] = user;
    this._write(this.files.users, users);
  }
  async deleteUser(id) {
    const users = await this.getUsers();
    delete users[id];
    this._write(this.files.users, users);
    const portfolios = await this.getPortfolios();
    delete portfolios[id];
    this._write(this.files.portfolios, portfolios);
    const txns = this._read(this.files.transactions, {});
    delete txns[id];
    this._write(this.files.transactions, txns);
    const orders = this._read(this.files.orders, {});
    delete orders[id];
    this._write(this.files.orders, orders);
  }

  // ---- Portfolios --------------------------------------------------------
  async getPortfolios() {
    return this._read(this.files.portfolios, {});
  }
  async savePortfolios(portfolios) {
    this._write(this.files.portfolios, portfolios || {});
  }
  async getPortfolio(userId) {
    return (await this.getPortfolios())[userId] || null;
  }
  async savePortfolio(userId, portfolio) {
    const portfolios = await this.getPortfolios();
    portfolios[userId] = portfolio;
    this._write(this.files.portfolios, portfolios);
  }

  // ---- Transactions ------------------------------------------------------
  async getTransactions() {
    return this._read(this.files.transactions, {});
  }
  async saveTransactions(transactions) {
    this._write(this.files.transactions, transactions || {});
  }
  async getUserTransactions(userId) {
    return (await this.getTransactions())[userId] || [];
  }
  async addTransaction(userId, txn) {
    const all = await this.getTransactions();
    (all[userId] = all[userId] || []).push(txn);
    this._write(this.files.transactions, all);
  }

  // ---- Orders ------------------------------------------------------------
  async getOrders() {
    return this._read(this.files.orders, {});
  }
  async saveOrders(orders) {
    this._write(this.files.orders, orders || {});
  }
  async getUserOrders(userId) {
    return (await this.getOrders())[userId] || [];
  }
  async getOrder(userId, orderId) {
    return (await this.getUserOrders(userId)).find((o) => o.id === orderId) || null;
  }
  // All orders still working (resting), across every user — the engine's input.
  async getOpenOrders() {
    const all = await this.getOrders();
    const open = [];
    for (const list of Object.values(all)) {
      for (const o of list || []) {
        if (o.status === 'pending' || o.status === 'partially_filled') open.push(o);
      }
    }
    return open;
  }
  async addOrder(userId, order) {
    const all = await this.getOrders();
    (all[userId] = all[userId] || []).push(order);
    this._write(this.files.orders, all);
  }
  async updateOrder(userId, orderId, patch) {
    const all = await this.getOrders();
    const list = all[userId] || [];
    const idx = list.findIndex((o) => o.id === orderId);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    all[userId] = list;
    this._write(this.files.orders, all);
    return list[idx];
  }

  // ---- Waitlist / Invites ------------------------------------------------
  async getWaitlist() {
    return this._read(this.files.waitlist, []);
  }
  async saveWaitlist(list) {
    this._write(this.files.waitlist, list || []);
  }
  async getInvites() {
    return this._read(this.files.invites, []);
  }
  async saveInvites(list) {
    this._write(this.files.invites, list || []);
  }

  // ---- Atomic per-user critical section ----------------------------------
  async withUserLock(userId, fn) {
    const key = String(userId);
    const prev = this._locks.get(key) || Promise.resolve();
    let release;
    const next = new Promise((res) => (release = res));
    this._locks.set(key, prev.then(() => next));
    await prev;
    try {
      return await fn(this); // file backend is single-process; `this` is the bound store
    } finally {
      release();
      if (this._locks.get(key) === next) this._locks.delete(key);
    }
  }
}

module.exports = FileStorage;
