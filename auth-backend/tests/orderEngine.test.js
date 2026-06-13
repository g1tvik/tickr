/**
 * Unit tests for orderEngine — order construction/validation, the pure
 * fill-decision logic for every order type, trailing-stop tracking, and the
 * shared attemptFill path (against an in-memory fake storage). Clocks and `now`
 * are injected so nothing depends on the wall clock or market being open.
 */
const oe = require('../services/orderEngine');
const pm = require('../services/portfolioMath');

// A clock in the regular session — orders are allowed to fill.
const OPEN_CLOCK = { isOpen: true, isExtended: false, session: 'regular', ymd: '2026-06-15', minutes: 600 };
const CLOSED_CLOCK = { isOpen: false, isExtended: false, session: 'closed', ymd: '2026-06-15', minutes: 0 };
const NOW = new Date('2026-06-15T14:00:00Z');

describe('orderEngine — createOrder validation', () => {
  it('builds a valid market buy with sane defaults', () => {
    const o = oe.createOrder('u1', { symbol: 'aapl', qty: 5 }, OPEN_CLOCK);
    expect(o.symbol).toBe('AAPL');
    expect(o.intent).toBe('buy');
    expect(o.side).toBe('buy');
    expect(o.type).toBe('market');
    expect(o.timeInForce).toBe('day');
    expect(o.status).toBe('pending');
    expect(o.qty).toBe(5);
  });

  it('maps sell_short / buy_to_cover intents to the right share-delta side', () => {
    expect(oe.sideOf('sell_short')).toBe('sell');
    expect(oe.sideOf('buy_to_cover')).toBe('buy');
    expect(oe.sideOf('buy')).toBe('buy');
    expect(oe.sideOf('sell')).toBe('sell');
  });

  it('rejects bad symbols, intents, types, quantities and TIF', () => {
    expect(() => oe.createOrder('u1', { symbol: '123', qty: 1 }, OPEN_CLOCK)).toThrow(oe.OrderError);
    expect(() => oe.createOrder('u1', { symbol: 'AAPL', qty: 1, intent: 'nope' }, OPEN_CLOCK)).toThrow(/intent/i);
    expect(() => oe.createOrder('u1', { symbol: 'AAPL', qty: 1, type: 'iceberg' }, OPEN_CLOCK)).toThrow(/order type/i);
    expect(() => oe.createOrder('u1', { symbol: 'AAPL', qty: 0 }, OPEN_CLOCK)).toThrow(/positive/i);
    expect(() => oe.createOrder('u1', { symbol: 'AAPL', qty: 200000 }, OPEN_CLOCK)).toThrow(/100,000/);
    expect(() => oe.createOrder('u1', { symbol: 'AAPL', qty: 1, timeInForce: 'fok' }, OPEN_CLOCK)).toThrow(/time-in-force/i);
  });

  it('requires a limit price for limit orders and a stop price for stop orders', () => {
    expect(() => oe.createOrder('u1', { symbol: 'AAPL', qty: 1, type: 'limit' }, OPEN_CLOCK)).toThrow(/limit price/i);
    expect(() => oe.createOrder('u1', { symbol: 'AAPL', qty: 1, type: 'stop' }, OPEN_CLOCK)).toThrow(/stop price/i);
    const ok = oe.createOrder('u1', { symbol: 'AAPL', qty: 1, type: 'limit', limitPrice: 99.5 }, OPEN_CLOCK);
    expect(ok.limitPrice).toBe(99.5);
  });

  it('validates trailing-stop parameters', () => {
    expect(() => oe.createOrder('u1', { symbol: 'AAPL', qty: 1, type: 'trailing_stop' }, OPEN_CLOCK)).toThrow(/trail value/i);
    expect(() => oe.createOrder('u1', { symbol: 'AAPL', qty: 1, type: 'trailing_stop', trailValue: 150 }, OPEN_CLOCK)).toThrow(/below 100/i);
    const ok = oe.createOrder('u1', { symbol: 'AAPL', qty: 1, type: 'trailing_stop', trailType: 'amount', trailValue: 2 }, OPEN_CLOCK);
    expect(ok.trailType).toBe('amount');
    expect(ok.trailValue).toBe(2);
  });

  it('forbids market orders flagged for extended hours', () => {
    expect(() => oe.createOrder('u1', { symbol: 'AAPL', qty: 1, type: 'market', extendedHours: true }, OPEN_CLOCK))
      .toThrow(/extended hours/i);
  });
});

describe('orderEngine — evaluateFill', () => {
  it('fills market orders at the ask (buy) / bid (sell) with synthetic slippage', () => {
    const buy = oe.evaluateFill({ type: 'market', side: 'buy' }, { price: 100 });
    const sell = oe.evaluateFill({ type: 'market', side: 'sell' }, { price: 100 });
    expect(buy.fill).toBe(true);
    expect(buy.price).toBe(oe.askFrom(100));   // 100.02
    expect(sell.price).toBe(oe.bidFrom(100));   // 99.98
    expect(buy.price).toBeGreaterThan(sell.price);
  });

  it('does not fill without a valid price', () => {
    expect(oe.evaluateFill({ type: 'market', side: 'buy' }, { price: 0 }).fill).toBe(false);
    expect(oe.evaluateFill({ type: 'market', side: 'buy' }, null).fill).toBe(false);
  });

  it('limit buy fills only when the ask is at/below the limit', () => {
    const marketable = oe.evaluateFill({ type: 'limit', side: 'buy', limitPrice: 101 }, { price: 100 });
    const resting = oe.evaluateFill({ type: 'limit', side: 'buy', limitPrice: 99 }, { price: 100 });
    expect(marketable.fill).toBe(true);
    expect(marketable.price).toBeLessThanOrEqual(101);
    expect(resting.fill).toBe(false);
  });

  it('limit sell fills only when the bid is at/above the limit', () => {
    expect(oe.evaluateFill({ type: 'limit', side: 'sell', limitPrice: 99 }, { price: 100 }).fill).toBe(true);
    expect(oe.evaluateFill({ type: 'limit', side: 'sell', limitPrice: 101 }, { price: 100 }).fill).toBe(false);
  });

  it('stop buy triggers at/above the stop, stop sell at/below', () => {
    expect(oe.evaluateFill({ type: 'stop', side: 'buy', stopPrice: 105 }, { price: 105 }).fill).toBe(true);
    expect(oe.evaluateFill({ type: 'stop', side: 'buy', stopPrice: 105 }, { price: 104 }).fill).toBe(false);
    expect(oe.evaluateFill({ type: 'stop', side: 'sell', stopPrice: 95 }, { price: 95 }).fill).toBe(true);
    expect(oe.evaluateFill({ type: 'stop', side: 'sell', stopPrice: 95 }, { price: 96 }).fill).toBe(false);
  });

  it('stop-limit only fills when triggered AND marketable against the limit', () => {
    const triggeredButThrough = oe.evaluateFill(
      { type: 'stop_limit', side: 'buy', stopPrice: 105, limitPrice: 104 }, { price: 106 });
    const triggeredAndMarketable = oe.evaluateFill(
      { type: 'stop_limit', side: 'buy', stopPrice: 105, limitPrice: 110 }, { price: 106 });
    expect(triggeredButThrough.fill).toBe(false); // ask above limit
    expect(triggeredAndMarketable.fill).toBe(true);
  });

  it('an unarmed trailing stop never fills', () => {
    expect(oe.evaluateFill({ type: 'trailing_stop', side: 'sell', stopPrice: null }, { price: 100 }).fill).toBe(false);
  });
});

describe('orderEngine — updateTrailing', () => {
  it('a sell trailing stop ratchets the stop up as the price rises (percent)', () => {
    const o = { type: 'trailing_stop', side: 'sell', trailType: 'percent', trailValue: 10, hwm: null, stopPrice: null };
    oe.updateTrailing(o, 100);
    expect(o.hwm).toBe(100);
    expect(o.stopPrice).toBe(90);   // 100 - 10%
    oe.updateTrailing(o, 120);
    expect(o.hwm).toBe(120);
    expect(o.stopPrice).toBe(108);  // 120 - 10%
    oe.updateTrailing(o, 110);      // price dips -> stop holds
    expect(o.hwm).toBe(120);
    expect(o.stopPrice).toBe(108);
  });

  it('a buy trailing stop ratchets the stop down as the price falls (amount)', () => {
    const o = { type: 'trailing_stop', side: 'buy', trailType: 'amount', trailValue: 5, hwm: null, stopPrice: null };
    oe.updateTrailing(o, 100);
    expect(o.hwm).toBe(100);
    expect(o.stopPrice).toBe(105);  // 100 + 5
    oe.updateTrailing(o, 90);
    expect(o.hwm).toBe(90);
    expect(o.stopPrice).toBe(95);   // 90 + 5
  });
});

// ── Fake storage for attemptFill (mirrors the withUserLock contract) ──────────
function makeFakeStorage(initialPortfolio) {
  const portfolios = new Map();
  if (initialPortfolio) portfolios.set('u1', initialPortfolio);
  const orders = new Map();
  const transactions = [];

  const tx = {
    getPortfolio: async (uid) => portfolios.get(uid) || null,
    savePortfolio: async (uid, pf) => { portfolios.set(uid, pf); },
    addTransaction: async (uid, t) => { transactions.push({ uid, ...t }); },
  };

  return {
    portfolios,
    orders,
    transactions,
    withUserLock: async (_uid, fn) => fn(tx),
    updateOrder: async (uid, orderId, patch) => {
      const cur = orders.get(orderId) || { id: orderId, userId: uid };
      const next = { ...cur, ...patch };
      orders.set(orderId, next);
      return next;
    },
    getOpenOrders: async () => [...orders.values()].filter((o) => oe.OPEN_STATUSES.includes(o.status)),
  };
}

describe('orderEngine — attemptFill', () => {
  it('fills a marketable buy, moves cash, and records a transaction', async () => {
    const storage = makeFakeStorage(pm.freshPortfolio());
    const order = oe.createOrder('u1', { symbol: 'AAPL', qty: 10 }, OPEN_CLOCK);
    storage.orders.set(order.id, order);

    const updated = await oe.attemptFill({ storage }, order, { price: 100 }, OPEN_CLOCK, NOW);

    expect(updated.status).toBe('filled');
    expect(updated.filledQty).toBe(10);
    const pf = storage.portfolios.get('u1');
    const pos = pm.findPosition(pf, 'AAPL');
    expect(pos.shares).toBe(10);
    expect(pf.cash).toBeLessThan(pm.STARTING_CASH);
    expect(storage.transactions).toHaveLength(1);
    expect(storage.transactions[0].symbol).toBe('AAPL');
  });

  it('does not fill when the market is closed (order stays pending)', async () => {
    const storage = makeFakeStorage(pm.freshPortfolio());
    const order = oe.createOrder('u1', { symbol: 'AAPL', qty: 10 }, OPEN_CLOCK);
    storage.orders.set(order.id, order);

    const updated = await oe.attemptFill({ storage }, order, { price: 100 }, CLOSED_CLOCK, NOW);

    expect(updated.status).toBe('pending');
    expect(storage.transactions).toHaveLength(0);
  });

  it('rejects a fill that fails buying-power validation', async () => {
    const storage = makeFakeStorage(pm.freshPortfolio()); // cash BP 10000
    const order = oe.createOrder('u1', { symbol: 'AAPL', qty: 1000 }, OPEN_CLOCK); // needs 100000
    storage.orders.set(order.id, order);

    const updated = await oe.attemptFill({ storage }, order, { price: 100 }, OPEN_CLOCK, NOW);

    expect(updated.status).toBe('rejected');
    expect(updated.rejectReason).toMatch(/buying power/i);
    expect(storage.transactions).toHaveLength(0);
  });

  it('leaves a non-marketable resting limit order untouched', async () => {
    const storage = makeFakeStorage(pm.freshPortfolio());
    const order = oe.createOrder('u1', { symbol: 'AAPL', qty: 5, type: 'limit', limitPrice: 90 }, OPEN_CLOCK);
    storage.orders.set(order.id, order);

    const updated = await oe.attemptFill({ storage }, order, { price: 100 }, OPEN_CLOCK, NOW);

    expect(updated.status).toBe('pending');
    expect(storage.transactions).toHaveLength(0);
  });
});
