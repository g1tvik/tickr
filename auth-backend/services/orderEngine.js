/**
 * Order engine — order construction, the fill-decision logic for every order
 * type, and the shared fill path that mutates a portfolio under the per-user
 * lock. Both the placement route and the background processor go through the
 * same `attemptFill`, so a resting order and an immediately-marketable order are
 * accounted for identically.
 *
 * Order types:  market | limit | stop | stop_limit | trailing_stop
 * Intents:      buy | sell | sell_short | buy_to_cover  (all reduce to a
 *               buy/sell share delta; intent is kept for display + validation)
 * Time in force: day | gtc
 *
 * Resting orders are matched against the latest trade price. We synthesize a
 * tiny bid/ask spread around it so marketable fills get realistic slippage
 * (buys lift the ask, sells hit the bid).
 */

const crypto = require('crypto');
const {
  getClock, canFillNow, dayOrderGoodFor, isDayExpired,
} = require('./marketHours');
const pm = require('./portfolioMath');

// Synthetic half-spread used to model slippage on marketable fills (2 bps, min 1¢).
const HALF_SPREAD_BPS = 0.0002;
const ORDER_TYPES = ['market', 'limit', 'stop', 'stop_limit', 'trailing_stop'];
const INTENTS = ['buy', 'sell', 'sell_short', 'buy_to_cover'];
const TIFS = ['day', 'gtc'];
const OPEN_STATUSES = ['pending', 'partially_filled'];

class OrderError extends Error {}

function halfSpread(price) {
  return Math.max(0.01, price * HALF_SPREAD_BPS);
}
function askFrom(price) { return pm.round2(price + halfSpread(price)); }
function bidFrom(price) { return pm.round2(Math.max(0.01, price - halfSpread(price))); }

/** buy/sell share-delta direction implied by an intent. */
function sideOf(intent) {
  return (intent === 'buy' || intent === 'buy_to_cover') ? 'buy' : 'sell';
}

/**
 * Build + validate an order from raw client params. Throws OrderError(message)
 * on any invalid combination. Does not touch storage.
 */
function createOrder(userId, params, clock = getClock()) {
  const symbol = String(params.symbol || '').toUpperCase().trim();
  if (!/^[A-Z]{1,10}$/.test(symbol)) throw new OrderError('Symbol must be 1–10 uppercase letters');

  const intent = params.intent || (params.side === 'sell' ? 'sell' : 'buy');
  if (!INTENTS.includes(intent)) throw new OrderError('Invalid order intent');

  const type = params.type || 'market';
  if (!ORDER_TYPES.includes(type)) throw new OrderError('Invalid order type');

  const qty = Number(params.qty ?? params.shares);
  if (!Number.isFinite(qty) || qty <= 0) throw new OrderError('Quantity must be a positive number');
  if (qty > 100000) throw new OrderError('Maximum 100,000 shares per order');

  const timeInForce = (params.timeInForce || 'day').toLowerCase();
  if (!TIFS.includes(timeInForce)) throw new OrderError('Invalid time-in-force');

  const extendedHours = Boolean(params.extendedHours);
  if (extendedHours && type === 'market') {
    throw new OrderError('Market orders are not allowed in extended hours — use a limit order');
  }

  const order = {
    id: `ord_${crypto.randomUUID()}`,
    userId,
    symbol,
    intent,
    side: sideOf(intent),
    qty,
    filledQty: 0,
    type,
    timeInForce,
    extendedHours,
    status: 'pending',
    avgFillPrice: null,
    limitPrice: null,
    stopPrice: null,
    trailType: null,
    trailValue: null,
    hwm: null, // trailing high/low-water mark
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    filledAt: null,
  };

  // Type-specific required fields.
  if (type === 'limit' || type === 'stop_limit') {
    const lp = Number(params.limitPrice);
    if (!Number.isFinite(lp) || lp <= 0) throw new OrderError('Limit price is required and must be positive');
    order.limitPrice = pm.round2(lp);
  }
  if (type === 'stop' || type === 'stop_limit') {
    const sp = Number(params.stopPrice);
    if (!Number.isFinite(sp) || sp <= 0) throw new OrderError('Stop price is required and must be positive');
    order.stopPrice = pm.round2(sp);
  }
  if (type === 'trailing_stop') {
    const trailType = (params.trailType || 'percent').toLowerCase();
    if (!['percent', 'amount'].includes(trailType)) throw new OrderError('Trail type must be percent or amount');
    const tv = Number(params.trailValue);
    if (!Number.isFinite(tv) || tv <= 0) throw new OrderError('Trail value is required and must be positive');
    if (trailType === 'percent' && tv >= 100) throw new OrderError('Trail percent must be below 100');
    order.trailType = trailType;
    order.trailValue = tv;
  }

  // DAY orders carry the trading day they are good for.
  if (timeInForce === 'day') {
    const goodFor = dayOrderGoodFor(clock, extendedHours);
    order.goodForYmd = goodFor.ymd;
    order.goodForCloseMinute = goodFor.closeMinute;
  }

  order.submittedSession = clock.session;
  return order;
}

/** Initialise / advance the trailing-stop water mark and effective stop price. */
function updateTrailing(order, lastPrice) {
  if (order.type !== 'trailing_stop' || !(lastPrice > 0)) return;
  const offset = order.trailType === 'percent'
    ? lastPrice * (order.trailValue / 100)
    : order.trailValue;

  if (order.side === 'sell') {
    // Protects a long: track the highest price, stop trails below it.
    order.hwm = order.hwm == null ? lastPrice : Math.max(order.hwm, lastPrice);
    const off = order.trailType === 'percent' ? order.hwm * (order.trailValue / 100) : order.trailValue;
    order.stopPrice = pm.round2(order.hwm - off);
  } else {
    // Buy trailing stop (e.g. cover a short): track the lowest price, stop trails above it.
    order.hwm = order.hwm == null ? lastPrice : Math.min(order.hwm, lastPrice);
    const off = order.trailType === 'percent' ? order.hwm * (order.trailValue / 100) : order.trailValue;
    order.stopPrice = pm.round2(order.hwm + off);
  }
  void offset;
}

/**
 * Decide whether an order fills at the current quote. Pure — no side effects.
 * @returns {{ fill: boolean, price?: number }}
 */
function evaluateFill(order, quote) {
  const last = Number(quote?.price);
  if (!(last > 0)) return { fill: false };
  const ask = askFrom(last);
  const bid = bidFrom(last);
  const buying = order.side === 'buy';

  switch (order.type) {
    case 'market':
      return { fill: true, price: buying ? ask : bid };

    case 'limit':
      if (buying && ask <= order.limitPrice) return { fill: true, price: Math.min(ask, order.limitPrice) };
      if (!buying && bid >= order.limitPrice) return { fill: true, price: Math.max(bid, order.limitPrice) };
      return { fill: false };

    case 'stop': {
      const triggered = buying ? last >= order.stopPrice : last <= order.stopPrice;
      if (!triggered) return { fill: false };
      return { fill: true, price: buying ? ask : bid }; // becomes a market order
    }

    case 'stop_limit': {
      const triggered = buying ? last >= order.stopPrice : last <= order.stopPrice;
      if (!triggered) return { fill: false };
      if (buying && ask <= order.limitPrice) return { fill: true, price: Math.min(ask, order.limitPrice) };
      if (!buying && bid >= order.limitPrice) return { fill: true, price: Math.max(bid, order.limitPrice) };
      return { fill: false };
    }

    case 'trailing_stop': {
      if (order.stopPrice == null) return { fill: false }; // not yet armed
      const triggered = buying ? last >= order.stopPrice : last <= order.stopPrice;
      if (!triggered) return { fill: false };
      return { fill: true, price: buying ? ask : bid };
    }

    default:
      return { fill: false };
  }
}

/**
 * Attempt to fill an order against a quote, mutating the portfolio under the
 * per-user lock and persisting the order's new state. Safe to call repeatedly;
 * a no-op when the order can't fill. Returns the (possibly updated) order.
 *
 * @param {{ storage }} deps
 */
async function attemptFill(deps, order, quote, clock = getClock(), now = new Date()) {
  if (!OPEN_STATUSES.includes(order.status)) return order;

  // Keep trailing stops tracking even when we can't fill yet (during sessions).
  if (order.type === 'trailing_stop' && canFillNow(clock, order.extendedHours)) {
    updateTrailing(order, quote?.price);
  }

  if (!canFillNow(clock, order.extendedHours)) return order;

  const decision = evaluateFill(order, quote);
  if (!decision.fill) {
    // Persist any trailing-stop drift so it survives restarts.
    if (order.type === 'trailing_stop') {
      await deps.storage.updateOrder(order.userId, order.id, { stopPrice: order.stopPrice, hwm: order.hwm });
    }
    return order;
  }

  const fillQty = order.qty - (order.filledQty || 0);
  const fillPrice = decision.price;

  const result = await deps.storage.withUserLock(order.userId, async (tx) => {
    let pf = pm.normalizePortfolio(await tx.getPortfolio(order.userId) || pm.freshPortfolio());
    pm.settleMatured(pf, now); // clear any T+1 proceeds that have matured

    const check = pm.validateFill(pf, order.side, order.symbol, fillQty, fillPrice);
    if (!check.ok) return { rejected: check.message };

    const { realized } = pm.applyFill(pf, order.side, order.symbol, fillQty, fillPrice, quote, now);
    await tx.savePortfolio(order.userId, pf);
    await tx.addTransaction(order.userId, {
      id: `tx_${crypto.randomUUID()}`,
      orderId: order.id,
      type: order.intent,
      side: order.side,
      symbol: order.symbol,
      shares: fillQty,
      price: fillPrice,
      total: pm.round2(fillQty * fillPrice),
      realized,
      timestamp: now.toISOString(),
    });
    return { portfolio: pf };
  });

  if (result.rejected) {
    const updated = await deps.storage.updateOrder(order.userId, order.id, {
      status: 'rejected', rejectReason: result.rejected,
    });
    return updated || order;
  }

  const updated = await deps.storage.updateOrder(order.userId, order.id, {
    status: 'filled',
    filledQty: order.qty,
    avgFillPrice: fillPrice,
    stopPrice: order.stopPrice,
    hwm: order.hwm,
    filledAt: now.toISOString(),
  });
  return updated || order;
}

/**
 * One processing tick: expire stale DAY orders, then try to fill every working
 * order against a fresh quote. Quotes are fetched once per distinct symbol.
 * @param {{ storage, getQuote: (symbol)=>Promise<quote> }} deps
 */
async function processOpenOrders(deps, now = new Date()) {
  const clock = getClock(now);
  const open = await deps.storage.getOpenOrders();
  if (!open.length) return { processed: 0, filled: 0, expired: 0 };

  let filled = 0;
  let expired = 0;

  // Expire DAY orders whose session window has passed.
  const live = [];
  for (const order of open) {
    if (order.timeInForce === 'day' && isDayExpired(order.goodForYmd, order.goodForCloseMinute, clock)) {
      await deps.storage.updateOrder(order.userId, order.id, { status: 'expired' });
      expired++;
    } else {
      live.push(order);
    }
  }

  if (!canFillNow(clock, true) && !live.some((o) => o.type === 'trailing_stop')) {
    return { processed: open.length, filled, expired };
  }

  // Fetch each symbol's quote once.
  const symbols = [...new Set(live.map((o) => o.symbol))];
  const quotes = {};
  await Promise.all(symbols.map(async (sym) => {
    try { quotes[sym] = await deps.getQuote(sym); } catch { quotes[sym] = null; }
  }));

  for (const order of live) {
    const quote = quotes[order.symbol];
    if (!quote) continue;
    const before = order.status;
    const after = await attemptFill(deps, order, quote, clock, now);
    if (before !== 'filled' && after.status === 'filled') filled++;
  }

  return { processed: open.length, filled, expired };
}

module.exports = {
  OrderError,
  ORDER_TYPES,
  INTENTS,
  TIFS,
  OPEN_STATUSES,
  sideOf,
  createOrder,
  evaluateFill,
  updateTrailing,
  attemptFill,
  processOpenOrders,
  askFrom,
  bidFrom,
};
