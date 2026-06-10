/**
 * Portfolio money math — the single place that owns balances, positions,
 * margin/buying-power, realized P&L and T+1 cash settlement. Routes and the
 * order engine call these pure-ish helpers so the accounting can't drift between
 * code paths. Mirrors how a Reg-T margin account behaves at brokers like
 * Webull / thinkorswim paper.
 *
 * Canonical portfolio shape:
 * {
 *   accountType: 'margin' | 'cash',     // margin enables shorting + 2x buying power
 *   cash: number,                       // total cash (negative => margin loan)
 *   pendingSettlements: [{ id, amount, settleDate, symbol }],  // unsettled sell proceeds
 *   positions: [{ symbol, shares (neg=short), avgPrice, currentPrice, change, changePercent, openedAt }],
 *   realizedPnl: number,                // cumulative realized P&L
 *   createdAt, lastUpdated
 * }
 *
 * settledCash is DERIVED (cash − Σ pending), never stored, so it can never drift.
 */

const { settlementDate } = require('./marketHours');

const STARTING_CASH = 10000;
const INITIAL_MARGIN_RATE = 0.5;       // Reg-T: 50% to open a position
const MAINTENANCE_MARGIN_RATE = 0.25;  // 25% maintenance (long); shorts use 30%
const SHORT_MAINTENANCE_RATE = 0.30;

/** Bring any legacy/partial portfolio up to the canonical shape (non-destructive). */
function normalizePortfolio(pf) {
  const p = pf ? { ...pf } : {};
  // Legacy field migration: balance -> cash
  if (p.cash === undefined) p.cash = p.balance ?? STARTING_CASH;
  delete p.balance;
  if (!['margin', 'cash'].includes(p.accountType)) p.accountType = 'margin';
  if (!Array.isArray(p.pendingSettlements)) p.pendingSettlements = [];
  if (!Array.isArray(p.positions)) p.positions = [];
  if (typeof p.realizedPnl !== 'number') p.realizedPnl = 0;
  p.positions = p.positions.map((pos) => {
    const shares = Number(pos.shares) || 0;
    // Legacy avgCost -> avgPrice
    const avgPrice = pos.avgPrice ?? pos.avgCost ?? 0;
    const { avgCost, ...rest } = pos;
    return { ...rest, shares, avgPrice, currentPrice: pos.currentPrice ?? avgPrice };
  });
  if (!p.createdAt) p.createdAt = new Date().toISOString();
  return p;
}

function freshPortfolio() {
  return {
    accountType: 'margin',
    cash: STARTING_CASH,
    pendingSettlements: [],
    positions: [],
    realizedPnl: 0,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
}

/** Sum of unsettled sell proceeds. */
function pendingTotal(pf) {
  return (pf.pendingSettlements || []).reduce((s, e) => s + (e.amount || 0), 0);
}

/** Settled cash = total cash that has cleared (cash − unsettled proceeds). */
function settledCash(pf) {
  return pf.cash - pendingTotal(pf);
}

/**
 * Apply a quote map { SYMBOL: { price, change, changePercent } } onto positions
 * so market value / P&L reflect the latest prices. Mutates + returns pf.
 */
function markToMarket(pf, quotesBySymbol = {}) {
  for (const pos of pf.positions) {
    const q = quotesBySymbol[pos.symbol];
    if (q && q.price != null) {
      pos.currentPrice = q.price;
      pos.change = q.change ?? pos.change ?? 0;
      pos.changePercent = q.changePercent ?? pos.changePercent ?? '0.00';
    } else if (pos.currentPrice == null) {
      pos.currentPrice = pos.avgPrice;
    }
  }
  return pf;
}

/**
 * Full account metrics derived from cash + positions at current prices.
 * This is what the UI account bar renders and what order validation checks.
 */
function computeMetrics(pf) {
  let longMV = 0;   // market value of long positions
  let shortMV = 0;  // absolute market value of short positions (a liability)
  let unrealizedPnl = 0;

  for (const pos of pf.positions) {
    const price = pos.currentPrice ?? pos.avgPrice ?? 0;
    const mv = pos.shares * price; // negative for shorts
    if (pos.shares >= 0) {
      longMV += mv;
      unrealizedPnl += (price - pos.avgPrice) * pos.shares;
    } else {
      shortMV += Math.abs(mv);
      unrealizedPnl += (pos.avgPrice - price) * Math.abs(pos.shares);
    }
  }

  // Equity = cash + value of longs − liability of shorts.
  const equity = pf.cash + longMV - shortMV;
  const maintenanceMargin = longMV * MAINTENANCE_MARGIN_RATE + shortMV * SHORT_MAINTENANCE_RATE;

  // Buying power.
  //  margin: Reg-T 2x — buyingPower = 2*equity − (longMV + shortMV).
  //  cash:   only settled cash may open new positions.
  let buyingPower;
  if (pf.accountType === 'margin') {
    buyingPower = Math.max(0, 2 * equity - (longMV + shortMV));
  } else {
    buyingPower = Math.max(0, settledCash(pf));
  }

  const positionsValue = longMV - shortMV;        // net long/short market value
  const totalValue = pf.cash + positionsValue;    // == equity
  const marginUsed = (longMV + shortMV) * INITIAL_MARGIN_RATE;
  const marginLoan = Math.max(0, -pf.cash);       // borrowed cash (negative balance)

  return {
    accountType: pf.accountType,
    cash: round2(pf.cash),
    settledCash: round2(settledCash(pf)),
    unsettledCash: round2(pendingTotal(pf)),
    longMarketValue: round2(longMV),
    shortMarketValue: round2(shortMV),
    positionsValue: round2(positionsValue),
    equity: round2(equity),
    totalValue: round2(totalValue),
    buyingPower: round2(buyingPower),
    marginUsed: round2(marginUsed),
    marginLoan: round2(marginLoan),
    maintenanceMargin: round2(maintenanceMargin),
    unrealizedPnl: round2(unrealizedPnl),
    realizedPnl: round2(pf.realizedPnl || 0),
  };
}

/** Estimated initial buying-power cost to open `qty` at `price` (50% on margin). */
function marginRequirement(pf, qty, price) {
  const notional = qty * price;
  return pf.accountType === 'margin' ? notional * INITIAL_MARGIN_RATE : notional;
}

function findPosition(pf, symbol) {
  return pf.positions.find((p) => p.symbol === symbol) || null;
}

/**
 * Validate an intended fill against account rules BEFORE mutating.
 * `side` is 'buy' | 'sell'. Returns { ok: true } or { ok: false, message }.
 *  - buy   increases shares (opens/adds long, or covers a short)
 *  - sell  decreases shares (closes long, or opens/adds short)
 */
function validateFill(pf, side, symbol, qty, price) {
  if (!(qty > 0)) return { ok: false, message: 'Quantity must be positive' };
  if (!(price > 0)) return { ok: false, message: 'No valid price for this symbol' };

  const pos = findPosition(pf, symbol);
  const held = pos ? pos.shares : 0;
  const metrics = computeMetrics(pf);

  if (side === 'sell') {
    const resulting = held - qty;
    const opensOrAddsShort = resulting < 0;
    if (opensOrAddsShort) {
      if (pf.accountType !== 'margin') {
        return { ok: false, message: 'Short selling requires a margin account' };
      }
      // New short exposure being opened (the portion below zero).
      const newShortQty = Math.min(qty, qty - Math.max(0, held));
      const req = marginRequirement(pf, newShortQty, price);
      if (req > metrics.buyingPower + 1e-6) {
        return { ok: false, message: `Not enough buying power to short. Needs ${usd(req)}, have ${usd(metrics.buyingPower)}` };
      }
    }
    return { ok: true };
  }

  // side === 'buy'
  const coversShort = held < 0;
  if (coversShort) {
    // Covering uses cash (buying back). The buy-to-cover portion needs funds;
    // any portion beyond flat opens a new long.
    const coverQty = Math.min(qty, Math.abs(held));
    const newLongQty = qty - coverQty;
    const cost = coverQty * price + marginRequirement(pf, newLongQty, price);
    if (cost > metrics.buyingPower + 1e-6) {
      return { ok: false, message: `Not enough buying power. Needs ${usd(cost)}, have ${usd(metrics.buyingPower)}` };
    }
    return { ok: true };
  }

  // Plain long buy.
  const req = marginRequirement(pf, qty, price);
  if (req > metrics.buyingPower + 1e-6) {
    return { ok: false, message: `Not enough buying power. Needs ${usd(req)}, have ${usd(metrics.buyingPower)}` };
  }
  return { ok: true };
}

/**
 * Apply a fill to the portfolio. Handles weighted-average cost, zero-crossing
 * (long↔short flips), realized P&L, cash movement and T+1 settlement of sell
 * proceeds. Returns { realized, position }.
 *
 * @param {object} pf       canonical portfolio (mutated)
 * @param {'buy'|'sell'} side
 * @param {string} symbol
 * @param {number} qty      positive share count
 * @param {number} price    fill price
 * @param {object} [quote]  latest quote for change fields
 * @param {Date}   [now]    fill time (for settlement date)
 */
function applyFill(pf, side, symbol, qty, price, quote = {}, now = new Date()) {
  const delta = side === 'buy' ? qty : -qty;
  let pos = findPosition(pf, symbol);
  if (!pos) {
    pos = { symbol, shares: 0, avgPrice: 0, currentPrice: price, openedAt: now.toISOString() };
    pf.positions.push(pos);
  }

  const oldShares = pos.shares;
  const newShares = oldShares + delta;
  let realized = 0;

  const reducing = oldShares !== 0 && Math.sign(delta) !== Math.sign(oldShares);
  if (reducing) {
    const closedQty = Math.min(Math.abs(delta), Math.abs(oldShares));
    realized = oldShares > 0
      ? (price - pos.avgPrice) * closedQty   // closing a long
      : (pos.avgPrice - price) * closedQty;  // closing a short
  }

  // New average price.
  if (newShares === 0) {
    pos.avgPrice = 0;
  } else if (oldShares === 0 || Math.sign(newShares) !== Math.sign(oldShares)) {
    // Fresh open, or crossed through zero — remainder is at the fill price.
    pos.avgPrice = price;
    pos.openedAt = now.toISOString();
  } else if (Math.sign(delta) === Math.sign(oldShares)) {
    // Adding to the same side — weighted average.
    const oldAbs = Math.abs(oldShares);
    const addAbs = Math.abs(delta);
    pos.avgPrice = (pos.avgPrice * oldAbs + price * addAbs) / (oldAbs + addAbs);
  }
  // (reducing but same side cannot happen — reducing flips the sign test above)

  pos.shares = newShares;
  pos.currentPrice = price;
  pos.change = quote.change ?? pos.change ?? 0;
  pos.changePercent = quote.changePercent ?? pos.changePercent ?? '0.00';

  // Cash movement: buy spends, sell/cover receives.
  const cashDelta = -delta * price;
  pf.cash = round2(pf.cash + cashDelta);
  pf.realizedPnl = round2((pf.realizedPnl || 0) + realized);

  // Settlement: proceeds from a SELL that reduces a long are unsettled for T+1.
  // (Short-sale proceeds are held as margin collateral, not "settling" cash;
  // covers and buys remove cash immediately.)
  if (side === 'sell' && oldShares > 0) {
    const settledQty = Math.min(qty, oldShares);
    const proceeds = round2(settledQty * price);
    if (proceeds > 0) {
      pf.pendingSettlements.push({
        id: `stl_${symbol}_${now.getTime()}`,
        amount: proceeds,
        symbol,
        settleDate: settlementDate(now, 1),
      });
    }
  }

  if (pos.shares === 0) {
    pf.positions = pf.positions.filter((p) => p !== pos);
  }

  pf.lastUpdated = now.toISOString();
  return { realized: round2(realized), position: pos.shares === 0 ? null : pos };
}

/**
 * Move any matured pending settlements into settled cash. Because settledCash is
 * derived (cash − Σ pending), "settling" just means dropping the matured entries
 * from the pending list — total cash is unchanged. Returns the count settled.
 */
function settleMatured(pf, now = new Date()) {
  const before = pf.pendingSettlements.length;
  pf.pendingSettlements = pf.pendingSettlements.filter(
    (e) => new Date(e.settleDate).getTime() > now.getTime()
  );
  return before - pf.pendingSettlements.length;
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
function usd(n) {
  return `$${round2(n).toFixed(2)}`;
}

module.exports = {
  STARTING_CASH,
  normalizePortfolio,
  freshPortfolio,
  settledCash,
  pendingTotal,
  markToMarket,
  computeMetrics,
  marginRequirement,
  findPosition,
  validateFill,
  applyFill,
  settleMatured,
  round2,
};
