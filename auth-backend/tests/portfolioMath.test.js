/**
 * Unit tests for portfolioMath — the money core. These are pure (no storage, no
 * server), so they pin down the accounting that every trade route depends on:
 * weighted-average cost, realized P&L, long/short flips, cash settlement, and
 * Reg-T buying power. A regression here silently corrupts user portfolios.
 */
const pm = require('../services/portfolioMath');

const PRICED = (price) => ({ price });

describe('portfolioMath — shape & helpers', () => {
  it('freshPortfolio starts as a starting-cash CASH account', () => {
    const pf = pm.freshPortfolio();
    expect(pf.cash).toBe(pm.STARTING_CASH);
    expect(pf.accountType).toBe('cash');
    expect(pf.positions).toEqual([]);
    expect(pf.pendingSettlements).toEqual([]);
    expect(pf.realizedPnl).toBe(0);
  });

  it('normalizePortfolio migrates legacy balance -> cash and avgCost -> avgPrice', () => {
    const pf = pm.normalizePortfolio({
      balance: 5000,
      positions: [{ symbol: 'AAPL', shares: 3, avgCost: 100 }],
    });
    expect(pf.cash).toBe(5000);
    expect(pf.balance).toBeUndefined();
    expect(pf.positions[0].avgPrice).toBe(100);
    expect(pf.positions[0].avgCost).toBeUndefined();
    expect(pf.accountType).toBe('cash');
  });

  it('normalizePortfolio defaults an empty object to a starting-cash cash account', () => {
    const pf = pm.normalizePortfolio({});
    expect(pf.cash).toBe(pm.STARTING_CASH);
    expect(pf.accountType).toBe('cash');
    expect(pf.realizedPnl).toBe(0);
    expect(Array.isArray(pf.positions)).toBe(true);
  });

  it('heals an idle margin account down to cash, but preserves margin in use', () => {
    // No short, no loan → healed to cash.
    expect(pm.normalizePortfolio({ accountType: 'margin', cash: 10000, positions: [] }).accountType).toBe('cash');
    // Holds a short → genuinely using margin, kept.
    expect(pm.normalizePortfolio({ accountType: 'margin', cash: 12000, positions: [{ symbol: 'X', shares: -5, avgPrice: 100 }] }).accountType).toBe('margin');
    // Negative cash (margin loan) → kept.
    expect(pm.normalizePortfolio({ accountType: 'margin', cash: -2000, positions: [{ symbol: 'X', shares: 50, avgPrice: 100 }] }).accountType).toBe('margin');
  });

  it('settledCash is derived as cash minus unsettled proceeds', () => {
    const pf = pm.freshPortfolio();
    pf.cash = 12000;
    pf.pendingSettlements = [{ id: 'a', amount: 2000 }];
    expect(pm.pendingTotal(pf)).toBe(2000);
    expect(pm.settledCash(pf)).toBe(10000);
  });
});

describe('portfolioMath — computeMetrics', () => {
  it('fresh cash account: equity = cash, buying power = settled cash', () => {
    const m = pm.computeMetrics(pm.freshPortfolio());
    expect(m.equity).toBe(10000);
    expect(m.buyingPower).toBe(10000);
    expect(m.longMarketValue).toBe(0);
    expect(m.shortMarketValue).toBe(0);
  });

  it('a margin account still gets 2x buying power', () => {
    const pf = pm.freshPortfolio();
    pf.accountType = 'margin';
    expect(pm.computeMetrics(pf).buyingPower).toBe(20000);
  });

  it('long position marks to market and reports unrealized P&L', () => {
    const pf = pm.freshPortfolio();
    pm.applyFill(pf, 'buy', 'AAPL', 10, 100);
    pm.markToMarket(pf, { AAPL: { price: 120 } });
    const m = pm.computeMetrics(pf);
    // cash 9000 + longMV 1200 = equity 10200; unrealized = (120-100)*10 = 200
    expect(m.longMarketValue).toBe(1200);
    expect(m.unrealizedPnl).toBe(200);
    expect(m.equity).toBe(10200);
  });

  it('cash account buying power is limited to settled cash', () => {
    const pf = pm.freshPortfolio();
    pf.accountType = 'cash';
    const m = pm.computeMetrics(pf);
    expect(m.buyingPower).toBe(10000);
  });
});

describe('portfolioMath — applyFill (longs)', () => {
  it('opens a long, spending cash, with no settlement on a buy', () => {
    const pf = pm.freshPortfolio();
    const { realized, position } = pm.applyFill(pf, 'buy', 'AAPL', 10, 100);
    expect(realized).toBe(0);
    expect(position.shares).toBe(10);
    expect(position.avgPrice).toBe(100);
    expect(pf.cash).toBe(9000);
    expect(pf.pendingSettlements).toHaveLength(0);
  });

  it('weighted-averages the cost basis when adding to a long', () => {
    const pf = pm.freshPortfolio();
    pm.applyFill(pf, 'buy', 'AAPL', 10, 100);
    pm.applyFill(pf, 'buy', 'AAPL', 10, 120);
    const pos = pm.findPosition(pf, 'AAPL');
    expect(pos.shares).toBe(20);
    expect(pos.avgPrice).toBe(110);
  });

  it('closing a long realizes P&L and queues T+1 settlement of the proceeds', () => {
    const pf = pm.freshPortfolio();
    pm.applyFill(pf, 'buy', 'AAPL', 10, 100); // cash 9000
    const { realized, position } = pm.applyFill(pf, 'sell', 'AAPL', 10, 110);
    expect(realized).toBe(100);            // (110-100)*10
    expect(position).toBeNull();           // flat -> position removed
    expect(pf.realizedPnl).toBe(100);
    expect(pf.cash).toBe(10100);           // 9000 + 1100 proceeds
    expect(pm.pendingTotal(pf)).toBe(1100); // unsettled until T+1
    expect(pm.settledCash(pf)).toBe(9000);  // proceeds not yet settled
    expect(pm.findPosition(pf, 'AAPL')).toBeNull();
  });

  it('a partial sell leaves the average price unchanged', () => {
    const pf = pm.freshPortfolio();
    pm.applyFill(pf, 'buy', 'AAPL', 10, 100);
    const { realized } = pm.applyFill(pf, 'sell', 'AAPL', 4, 130);
    const pos = pm.findPosition(pf, 'AAPL');
    expect(realized).toBe(120);     // (130-100)*4
    expect(pos.shares).toBe(6);
    expect(pos.avgPrice).toBe(100); // basis of the remaining shares unchanged
  });
});

describe('portfolioMath — applyFill (shorts & flips)', () => {
  it('opens a short on a sell, increasing cash', () => {
    const pf = pm.freshPortfolio();
    const { position } = pm.applyFill(pf, 'sell', 'TSLA', 10, 100);
    expect(position.shares).toBe(-10);
    expect(position.avgPrice).toBe(100);
    expect(pf.cash).toBe(11000);
    expect(pf.pendingSettlements).toHaveLength(0); // short proceeds aren't T+1 cash
  });

  it('covering a short at a lower price realizes a gain', () => {
    const pf = pm.freshPortfolio();
    pm.applyFill(pf, 'sell', 'TSLA', 10, 100); // open short, cash 11000
    const { realized, position } = pm.applyFill(pf, 'buy', 'TSLA', 10, 90);
    expect(realized).toBe(100);   // (100-90)*10
    expect(position).toBeNull();
    expect(pf.cash).toBe(10100);  // 11000 - 900
    expect(pf.realizedPnl).toBe(100);
  });

  it('a sell larger than the long flips through zero into a short at the fill price', () => {
    const pf = pm.freshPortfolio();
    pm.applyFill(pf, 'buy', 'AAPL', 10, 100); // long 10
    const { realized } = pm.applyFill(pf, 'sell', 'AAPL', 15, 110);
    const pos = pm.findPosition(pf, 'AAPL');
    expect(realized).toBe(100);   // only the 10 closed shares realize
    expect(pos.shares).toBe(-5);
    expect(pos.avgPrice).toBe(110); // remainder opened at the fill price
    // settlement only covers the long portion that was sold (10 shares)
    expect(pm.pendingTotal(pf)).toBe(1100);
  });
});

describe('portfolioMath — validateFill (buying power)', () => {
  it('rejects a buy that exceeds buying power', () => {
    const pf = pm.freshPortfolio(); // cash BP 10000
    const ok = pm.validateFill(pf, 'buy', 'AAPL', 1000, 100); // req 100000 (full notional)
    expect(ok.ok).toBe(false);
    expect(ok.message).toMatch(/buying power/i);
  });

  it('allows a buy within cash buying power', () => {
    const pf = pm.freshPortfolio();
    expect(pm.validateFill(pf, 'buy', 'AAPL', 50, 100).ok).toBe(true); // req 5000 <= 10000
  });

  it('blocks shorting in a cash account (the default)', () => {
    const pf = pm.freshPortfolio();
    const res = pm.validateFill(pf, 'sell', 'TSLA', 10, 100);
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/margin account/i);
  });

  it('rejects non-positive quantity or price', () => {
    const pf = pm.freshPortfolio();
    expect(pm.validateFill(pf, 'buy', 'AAPL', 0, 100).ok).toBe(false);
    expect(pm.validateFill(pf, 'buy', 'AAPL', 10, 0).ok).toBe(false);
  });
});

describe('portfolioMath — settlement maturation', () => {
  it('settleMatured drops matured entries and frees settled cash without changing total cash', () => {
    const pf = pm.freshPortfolio();
    const past = new Date(Date.now() - 86400000).toISOString();
    const future = new Date(Date.now() + 86400000).toISOString();
    pf.pendingSettlements = [
      { id: 'matured', amount: 500, settleDate: past },
      { id: 'pending', amount: 700, settleDate: future },
    ];
    const cashBefore = pf.cash;
    const settled = pm.settleMatured(pf);
    expect(settled).toBe(1);
    expect(pf.cash).toBe(cashBefore);          // total cash unchanged
    expect(pm.pendingTotal(pf)).toBe(700);     // only the future entry remains
  });
});
