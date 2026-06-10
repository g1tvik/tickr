import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import StockSearch from '../components/StockSearch';
import { SuperChart } from '../components/SuperChart';
import { useTrading } from '../hooks/useTrading';
import { marbleDarkGray } from '../marblePalette';
import { fontBody } from '../fontPalette';
import { api } from '../services/api';
import { useNavbarBackground } from '../hooks/useNavbarBackground';
import { useSEO, SEO_CONFIG } from '../lib/seo';
import tk, { label, mono, heading } from '../theme/terminal';
import Icon from '../components/Icon';
import './Trade.css';

const isDev = import.meta.env.DEV;

// A response/quote/chart is "demo" when live market keys are missing.
const isDemoData = (obj) =>
  !!obj && (obj.source === 'demo' || obj.demo === true || obj.isDemo === true);

function DemoPill({ title = 'Live market keys are missing — showing simulated data' }) {
  return (
    <span className="trade-demo-pill" title={title}>Demo data</span>
  );
}

// Currency / number formatters.
const fmtUsd = (n) =>
  `$${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtSigned = (n) => `${n >= 0 ? '+' : '−'}${fmtUsd(Math.abs(Number(n) || 0))}`;
const fmtNum = (n) => (Number(n) || 0).toLocaleString();

const parseChange = (percent) => {
  const num = parseFloat(percent);
  const known = percent !== undefined && percent !== null && percent !== 'N/A' && !Number.isNaN(num);
  return { num, known, up: known && num >= 0 };
};

function ChangePill({ percent, className = '' }) {
  const { num, known, up } = parseChange(percent);
  const state = !known ? 'is-flat' : up ? 'is-up' : 'is-down';
  return (
    <span className={`trade-change ${state} ${className}`}>
      {known ? (<><Icon name={up ? 'tri-up' : 'tri-down'} size={9} />{`${up ? '+' : ''}${num.toFixed(2)}%`}</>) : '—'}
    </span>
  );
}

function ChangeBadge({ change, percent }) {
  const { num, known, up } = parseChange(percent);
  const state = !known ? 'is-flat' : up ? 'is-up' : 'is-down';
  const chg = Number(change);
  const hasAbs = change !== undefined && change !== null && !Number.isNaN(chg);
  return (
    <span className={`trade-change-badge ${state}`}>
      {known && <Icon name={up ? 'tri-up' : 'tri-down'} size={10} />}
      <span>{hasAbs ? `${up ? '+' : ''}${chg.toFixed(2)}` : ''}{known ? ` (${up ? '+' : ''}${num.toFixed(2)}%)` : ' —'}</span>
    </span>
  );
}

const POPULAR_TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'AMD'];

// Order-ticket vocabulary.
const INTENT_META = {
  buy:          { label: 'Buy',   verb: 'Buy',   tone: 'up',   blurb: 'Buy to open' },
  sell:         { label: 'Sell',  verb: 'Sell',  tone: 'down', blurb: 'Sell to close' },
  sell_short:   { label: 'Short', verb: 'Short', tone: 'down', blurb: 'Sell short to open' },
  buy_to_cover: { label: 'Cover', verb: 'Cover', tone: 'up',   blurb: 'Buy to cover short' },
};
const ORDER_KINDS = [
  { v: 'market', label: 'Market' },
  { v: 'limit', label: 'Limit' },
  { v: 'stop', label: 'Stop' },
  { v: 'stop_limit', label: 'Stop-Limit' },
  { v: 'trailing_stop', label: 'Trailing Stop' },
];
const ORDER_KIND_LABEL = Object.fromEntries(ORDER_KINDS.map((k) => [k.v, k.label]));

const ORDER_STATUS_TONE = {
  pending: 'work', partially_filled: 'work',
  filled: 'up', canceled: 'flat', expired: 'flat', rejected: 'down',
};

function Trade() {
  const location = useLocation();
  const { setNavbarBackground } = useNavbarBackground();
  useSEO(SEO_CONFIG.trade);

  const {
    selectedStock, stocks, lastUpdate,
    intent, setIntent, orderKind, setOrderKind, shares, setShares,
    limitPrice, setLimitPrice, stopPrice, setStopPrice,
    trailType, setTrailType, trailValue, setTrailValue,
    timeInForce, setTimeInForce, extendedHours, setExtendedHours,
    portfolio, metrics, openOrders, orderHistory, transactions,
    clock, marketStatus, isLoading, error, isAuthenticated,
    showOrderConfirmation, lastOrderResult,
    handleStockSelect, placeOrder, cancelOrder, clearError,
  } = useTrading();

  // Chart + page-level UI state.
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);
  const timeframe = '1D';
  const [initialLoading, setInitialLoading] = useState(true);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [blotterTab, setBlotterTab] = useState('positions'); // positions | orders | history

  useEffect(() => {
    if (portfolio || (stocks && stocks.length > 0) || metrics) setInitialLoading(false);
  }, [portfolio, stocks, metrics]);

  useEffect(() => {
    const t = setTimeout(() => setInitialLoading(false), 8000);
    return () => clearTimeout(t);
  }, []);

  // Surface a toast when an order is placed/filled.
  useEffect(() => {
    if (!showOrderConfirmation) return;
    setShowSuccessToast(true);
    const t = setTimeout(() => setShowSuccessToast(false), 5000);
    return () => clearTimeout(t);
  }, [showOrderConfirmation]);

  const handleChartReady = useCallback((chart) => { if (isDev) console.log('SuperChart ready:', chart); }, []);
  const handleChartDataUpdate = useCallback((data) => { if (isDev) console.log('Chart data updated:', data); }, []);
  const handleDrawingUpdate = useCallback((drawings) => { if (isDev) console.log('Drawings updated:', drawings); }, []);

  const quoteIsDemo = isDemoData(selectedStock);
  const chartIsDemo = isDemoData(chartData);
  const marketIsDemo = Array.isArray(stocks) && stocks.some(isDemoData);

  // ── Account metrics (with safe fallbacks before /account lands) ──────────────
  const m = metrics || {};

  const enrichedPositions = useMemo(() => (portfolio?.positions ?? []).map((p) => {
    const isShort = p.shares < 0;
    const qty = Math.abs(p.shares);
    const price = p.currentPrice ?? p.avgPrice ?? 0;
    const avg = p.avgPrice ?? 0;
    const marketValue = qty * price;
    const cost = qty * avg;
    const pnl = isShort ? (avg - price) * qty : (price - avg) * qty;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    const dayPnl = p.shares * (Number(p.change) || 0);
    return { ...p, isShort, qty, price, avg, marketValue, cost, pnl, pnlPct, dayPnl };
  }), [portfolio]);

  const dayPnl = enrichedPositions.reduce((s, p) => s + (p.dayPnl || 0), 0);
  const equity = m.equity ?? (portfolio?.totalValue ?? 0);
  const buyingPower = m.buyingPower ?? (portfolio?.balance ?? 0);

  // ── Order-ticket math ────────────────────────────────────────────────────────
  const im = INTENT_META[intent] || INTENT_META.buy;
  const heldPos = enrichedPositions.find((p) => p.symbol === selectedStock?.symbol) || null;
  const heldLong = heldPos && !heldPos.isShort ? heldPos.qty : 0;
  const heldShort = heldPos && heldPos.isShort ? heldPos.qty : 0;
  const canSell = heldLong > 0;
  const canCover = heldShort > 0;

  const qty = parseInt(shares, 10) || 0;
  const lastPrice = selectedStock?.price || 0;
  const refPrice = useMemo(() => {
    if (orderKind === 'limit' || orderKind === 'stop_limit') return parseFloat(limitPrice) || lastPrice;
    if (orderKind === 'stop') return parseFloat(stopPrice) || lastPrice;
    return lastPrice;
  }, [orderKind, limitPrice, stopPrice, lastPrice]);

  const isBuySide = intent === 'buy' || intent === 'buy_to_cover';
  const maxShares = useMemo(() => {
    if (intent === 'sell') return heldLong;
    if (intent === 'buy_to_cover') return heldShort;
    return refPrice > 0 ? Math.floor(buyingPower / refPrice) : 0; // buy / short
  }, [intent, heldLong, heldShort, refPrice, buyingPower]);

  const notional = qty * refPrice;
  const needsLimit = orderKind === 'limit' || orderKind === 'stop_limit';
  const needsStop = orderKind === 'stop' || orderKind === 'stop_limit';
  const needsTrail = orderKind === 'trailing_stop';
  const inputsValid =
    (!needsLimit || parseFloat(limitPrice) > 0) &&
    (!needsStop || parseFloat(stopPrice) > 0) &&
    (!needsTrail || parseFloat(trailValue) > 0);
  const intentValid = (intent !== 'sell' || canSell) && (intent !== 'buy_to_cover' || canCover);
  const withinMax = qty >= 1 && qty <= maxShares;
  const canPlace = !isLoading && lastPrice > 0 && inputsValid && intentValid && withinMax;

  // Whether this order fills now vs rests (for the button label + hint).
  const sessionAllows = clock ? (clock.isOpen || (clock.isExtended && extendedHours)) : false;
  const willRest = orderKind !== 'market' || !sessionAllows;

  const setSharesSafe = (n) => setShares(String(Math.max(1, Math.floor(n) || 1)));
  const applyPct = (pct) => { if (maxShares > 0) setSharesSafe(Math.max(1, Math.floor(maxShares * pct))); };

  // Keep intent valid as holdings change.
  useEffect(() => {
    if (intent === 'sell' && !canSell) setIntent('buy');
    if (intent === 'buy_to_cover' && !canCover) setIntent('buy');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStock?.symbol, canSell, canCover]);

  // Market orders can't be extended-hours.
  useEffect(() => {
    if (orderKind === 'market' && extendedHours) setExtendedHours(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderKind]);

  const quickPicks = Array.isArray(stocks) && stocks.length > 0
    ? stocks.slice(0, 8)
    : POPULAR_TICKERS.map((symbol) => ({ symbol }));

  // ── Chart loading (unchanged behavior) ───────────────────────────────────────
  useEffect(() => {
    if (selectedStock?.symbol) loadChartData(selectedStock.symbol, timeframe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStock?.symbol, timeframe]);

  // Keep the Trade page dark + overscroll-safe (matches the rest of the app).
  useEffect(() => {
    if (location.pathname !== '/trade') return;
    const currentSetNavbarBackground = setNavbarBackground;
    const updateBackground = () => {
      const sel = ['.page-transition', '.main-content', '.app-container'];
      sel.forEach((s) => { const el = document.querySelector(s); if (el) el.style.backgroundColor = 'var(--marbleDarkGray)'; });
      currentSetNavbarBackground('var(--marbleDarkGray)');
      document.body.style.backgroundColor = 'var(--marbleDarkGray)';
      document.documentElement.style.backgroundColor = 'var(--marbleDarkGray)';
      document.body.style.setProperty('--scrollbar-track-bg', 'var(--marbleDarkGray)', 'important');
    };
    updateBackground();
    const onScroll = () => updateBackground();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('touchmove', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('touchmove', onScroll);
    };
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadChartData = async (symbol, tf) => {
    setChartLoading(true);
    setChartError(null);
    try {
      const response = await api.getChartData(symbol, tf, 100);
      if (response.success) {
        setChartData(isDemoData(response) ? { ...response.chartData, demo: true } : response.chartData);
      } else {
        setChartData({ ...generateMockChartData(symbol, tf), demo: true });
      }
    } catch (err) {
      if (isDev) console.error('Error loading chart data:', err);
      setChartData({ ...generateMockChartData(symbol, tf), demo: true });
    } finally {
      setChartLoading(false);
    }
  };

  const generateMockChartData = (symbol, tf) => {
    const basePrice = 100 + Math.random() * 200;
    const candles = [];
    const now = new Date();
    const interval = 24 * 60 * 60 * 1000;
    for (let i = 30; i >= 0; i--) {
      const time = new Date(now.getTime() - i * interval);
      const open = basePrice + (Math.random() - 0.5) * 20;
      const high = open + Math.random() * 10;
      const low = open - Math.random() * 10;
      const close = open + (Math.random() - 0.5) * 8;
      candles.push({ timestamp: Math.floor(time.getTime() / 1000), open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2), volume: Math.floor(Math.random() * 1e6) + 1e5 });
    }
    return { symbol, timeframe: tf, candles, lastUpdated: new Date().toISOString() };
  };

  if (!isAuthenticated) {
    return (
      <div className="page-dark" style={{ minHeight: '100vh', backgroundColor: marbleDarkGray, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: fontBody }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ ...heading, fontSize: '24px', color: 'var(--trade-text, #F4F1E9)', marginBottom: '12px' }}>{error || 'Sign in required'}</div>
          <div style={{ fontSize: '16px', color: 'var(--trade-text-muted, #b8b4a8)' }}>Please sign in to access the trading features.</div>
        </div>
      </div>
    );
  }

  const sessionTone = clock?.isOpen ? 'open' : clock?.isExtended ? 'ext' : 'closed';

  return (
    <div className="page-dark trade-page">
      <div className="trade-grid">
        {/* ════════ Main column ════════ */}
        <div className="trade-col">

          {/* ───── Account command bar ───── */}
          <div className="trade-card trade-account">
            <div className="trade-account__head">
              <div className="trade-account__title">
                <Icon name="trending-up" size={18} color={tk.gold} />
                <span>Paper trading</span>
                <span className="trade-acct-badge">{(m.accountType || 'margin') === 'margin' ? 'Margin' : 'Cash'}</span>
              </div>
              <span className={`trade-session trade-session--${sessionTone}`}>
                <span className="trade-session__dot" />
                {clock?.label || (marketStatus === 'open' ? 'Market open' : 'Market closed')}
              </span>
            </div>

            <div className="trade-account__hero">
              <div className="trade-account__net">
                <div className="trade-stat__label">Net Liquidation</div>
                {initialLoading
                  ? <div className="trade-skeleton trade-skeleton--amount" />
                  : <div className="trade-account__net-val">{fmtUsd(equity)}</div>}
                {!initialLoading && (
                  <div className={`trade-account__day ${dayPnl >= 0 ? 'is-up' : 'is-down'}`}>
                    {fmtSigned(dayPnl)} today
                  </div>
                )}
              </div>
              <div className="trade-account__metrics">
                {[
                  { k: 'Buying Power', v: fmtUsd(buyingPower) },
                  { k: 'Cash', v: fmtUsd(m.cash ?? 0), sub: m.unsettledCash ? `${fmtUsd(m.settledCash ?? 0)} settled` : null },
                  { k: 'Unrealized P&L', v: fmtSigned(m.unrealizedPnl ?? 0), tone: (m.unrealizedPnl ?? 0) >= 0 ? 'up' : 'down' },
                  { k: 'Realized P&L', v: fmtSigned(m.realizedPnl ?? 0), tone: (m.realizedPnl ?? 0) >= 0 ? 'up' : 'down' },
                  { k: 'Margin Used', v: fmtUsd(m.marginUsed ?? 0), sub: m.marginLoan ? `${fmtUsd(m.marginLoan)} loan` : null },
                ].map((s) => (
                  <div className="trade-metric" key={s.k}>
                    <div className="trade-stat__label">{s.k}</div>
                    {initialLoading
                      ? <div className="trade-skeleton trade-skeleton--row" style={{ marginBottom: 0 }} />
                      : <div className={`trade-metric__val ${s.tone ? (s.tone === 'up' ? 'is-up' : 'is-down') : ''}`}>{s.v}</div>}
                    {!initialLoading && s.sub && <div className="trade-metric__sub">{s.sub}</div>}
                  </div>
                ))}
              </div>
            </div>

            {lastOrderResult && (
              <div className="trade-success-chip" aria-live="polite">
                <Icon name="check" size={13} />
                {lastOrderResult.message}
              </div>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="trade-error-banner" role="alert" aria-live="assertive">
              <span className="trade-error-banner__text"><Icon name="alert" size={15} /><span>{error}</span></span>
              <button type="button" className="trade-error-banner__dismiss" onClick={clearError} aria-label="Dismiss error"><Icon name="x" size={16} /></button>
            </div>
          )}

          {/* Search */}
          <div className="trade-card">
            <div className="trade-section-head">
              <h2 className="trade-heading" style={{ ...label, margin: 0 }}>Search stocks</h2>
              <span className="trade-rule" />
            </div>
            <StockSearch onStockSelect={handleStockSelect} placeholder="Search by symbol or company name (e.g., AAPL, Apple, TSLA)..." />
          </div>

          {/* Empty state */}
          {!selectedStock && (
            <div className="trade-card">
              <div className="trade-empty">
                <div className="trade-empty__icon" aria-hidden="true"><Icon name="search" size={18} /></div>
                <h2 className="trade-empty__title">Pick a stock to start trading</h2>
                <p className="trade-empty__subtitle">Search above, or jump into one of today&apos;s most active tickers. Your live chart and order ticket appear here once you choose.</p>
                <div className="trade-quickpicks">
                  {quickPicks.map((stock) => (
                    <button type="button" key={stock.symbol} className="trade-quickpick" onClick={() => handleStockSelect(stock)} disabled={isLoading}>
                      <span className="trade-quickpick__symbol">{stock.symbol}</span>
                      <span style={{ textAlign: 'right' }}>
                        {stock.price != null && <span className="trade-quickpick__price" style={{ display: 'block' }}>{fmtUsd(stock.price)}</span>}
                        {stock.changePercent != null && <ChangePill percent={stock.changePercent} />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chart + order ticket */}
          {selectedStock && (
            <div className="trade-card">
              {(quoteIsDemo || chartIsDemo) && <div style={{ marginBottom: '12px' }}><DemoPill /></div>}
              <div className="trade-chart-grid">
                <div>
                  {chartLoading && (
                    <div className="trade-chart-status" role="status" aria-live="polite">
                      <span className="trade-chart-status__spinner" aria-hidden="true" />Loading chart data…
                    </div>
                  )}
                  {chartError && !chartLoading && (
                    <div className="trade-chart-status trade-chart-status--error" role="alert"><Icon name="alert" size={14} /> {chartError}</div>
                  )}
                  <SuperChart symbol={selectedStock.symbol} initialInterval="1d" theme="dark" realtime={false} height={420}
                    onChartReady={handleChartReady} onDataUpdate={handleChartDataUpdate} onDrawingUpdate={handleDrawingUpdate} />
                </div>

                {/* ───── Order ticket ───── */}
                <div className="trade-ticket trade-order-panel">
                  {/* Quote header */}
                  <div className="trade-ticket__quote">
                    <div style={{ minWidth: 0 }}>
                      <div style={{ ...mono, fontSize: '20px', fontWeight: 600, color: tk.text }}>{selectedStock.symbol}</div>
                      <div className="trade-muted trade-ticket__name">{selectedStock.name}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ ...mono, fontSize: '22px', fontWeight: 500, color: tk.text }}>
                        {selectedStock.price != null ? fmtUsd(selectedStock.price) : 'N/A'}
                      </div>
                      <div style={{ marginTop: '2px' }}><ChangeBadge change={selectedStock.change} percent={selectedStock.changePercent} /></div>
                    </div>
                  </div>
                  {heldPos && (
                    <div className="trade-ticket__held">
                      <span className={`trade-side-badge ${heldPos.isShort ? 'is-short' : 'is-long'}`}>{heldPos.isShort ? 'SHORT' : 'LONG'}</span>
                      <span className="trade-muted" style={{ fontSize: 12 }}>
                        <span style={mono}>{heldPos.qty}</span> sh · avg <span style={mono}>{fmtUsd(heldPos.avg)}</span>
                      </span>
                      <span style={{ ...mono, fontSize: 12, fontWeight: 600, marginLeft: 'auto', color: heldPos.pnl >= 0 ? tk.up : tk.down }}>
                        {fmtSigned(heldPos.pnl)}
                      </span>
                    </div>
                  )}

                  {/* Intent segmented control */}
                  <div className="trade-intent" role="group" aria-label="Order action">
                    {Object.entries(INTENT_META).map(([key, meta]) => {
                      const disabled = (key === 'sell' && !canSell) || (key === 'buy_to_cover' && !canCover);
                      return (
                        <button key={key} type="button" disabled={disabled}
                          className={`trade-intent__btn ${intent === key ? `is-active is-${meta.tone}` : ''}`}
                          aria-pressed={intent === key} title={meta.blurb}
                          onClick={() => setIntent(key)}>
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Order type + TIF */}
                  <div className="trade-field-row">
                    <label className="trade-field">
                      <span style={label}>Order Type</span>
                      <select className="trade-select" value={orderKind} onChange={(e) => setOrderKind(e.target.value)}>
                        {ORDER_KINDS.map((k) => <option key={k.v} value={k.v}>{k.label}</option>)}
                      </select>
                    </label>
                    <label className="trade-field">
                      <span style={label}>Time in Force</span>
                      <select className="trade-select" value={timeInForce} onChange={(e) => setTimeInForce(e.target.value)}>
                        <option value="day">Day</option>
                        <option value="gtc">GTC</option>
                      </select>
                    </label>
                  </div>

                  {/* Conditional price inputs */}
                  {needsStop && (
                    <label className="trade-field" style={{ marginTop: 12 }}>
                      <span style={label}>Stop Price</span>
                      <div className="trade-price-input">
                        <span>$</span>
                        <input type="number" inputMode="decimal" step="0.01" min="0" value={stopPrice}
                          onChange={(e) => setStopPrice(e.target.value)} placeholder={lastPrice ? lastPrice.toFixed(2) : '0.00'} />
                      </div>
                    </label>
                  )}
                  {needsLimit && (
                    <label className="trade-field" style={{ marginTop: 12 }}>
                      <span style={label}>Limit Price</span>
                      <div className="trade-price-input">
                        <span>$</span>
                        <input type="number" inputMode="decimal" step="0.01" min="0" value={limitPrice}
                          onChange={(e) => setLimitPrice(e.target.value)} placeholder={lastPrice ? lastPrice.toFixed(2) : '0.00'} />
                      </div>
                    </label>
                  )}
                  {needsTrail && (
                    <div className="trade-field" style={{ marginTop: 12 }}>
                      <span style={label}>Trailing Stop</span>
                      <div className="trade-trail">
                        <div className="trade-trail__toggle">
                          <button type="button" className={trailType === 'percent' ? 'is-active' : ''} onClick={() => setTrailType('percent')}>%</button>
                          <button type="button" className={trailType === 'amount' ? 'is-active' : ''} onClick={() => setTrailType('amount')}>$</button>
                        </div>
                        <div className="trade-price-input" style={{ flex: 1 }}>
                          <span>{trailType === 'percent' ? '%' : '$'}</span>
                          <input type="number" inputMode="decimal" step="0.01" min="0" value={trailValue}
                            onChange={(e) => setTrailValue(e.target.value)} placeholder={trailType === 'percent' ? '5' : '1.00'} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="trade-field" style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={label}>Quantity</span>
                      <span className="trade-muted" style={{ fontSize: 11 }}>Max <span style={mono}>{fmtNum(maxShares)}</span></span>
                    </div>
                    <div className="trade-stepper">
                      <button type="button" className="trade-stepper__btn" onClick={() => setSharesSafe(qty - 1)} aria-label="Decrease"><Icon name="minus" size={16} /></button>
                      <input className="trade-stepper__input" type="number" value={shares} onChange={(e) => setShares(e.target.value)} min="1" aria-label="Shares" />
                      <button type="button" className="trade-stepper__btn" onClick={() => setSharesSafe(qty + 1)} aria-label="Increase"><Icon name="plus" size={16} /></button>
                    </div>
                    <div className="trade-chips">
                      {[0.25, 0.5, 0.75].map((pct) => (
                        <button type="button" key={pct} className="trade-chip" onClick={() => applyPct(pct)} disabled={maxShares <= 0}>{pct * 100}%</button>
                      ))}
                      <button type="button" className="trade-chip" onClick={() => maxShares > 0 && setSharesSafe(maxShares)} disabled={maxShares <= 0}>Max</button>
                    </div>
                  </div>

                  {/* Extended hours (limit orders only) */}
                  {(orderKind === 'limit' || orderKind === 'stop_limit') && (
                    <label className="trade-ext">
                      <input type="checkbox" checked={extendedHours} onChange={(e) => setExtendedHours(e.target.checked)} />
                      <span>Allow extended-hours execution</span>
                    </label>
                  )}

                  {/* Summary */}
                  <div className="trade-summary">
                    <div className="trade-summary__row"><span className="trade-muted">Order</span><span style={mono}>{im.verb} {fmtNum(qty)} @ {orderKind === 'market' ? 'Mkt' : ORDER_KIND_LABEL[orderKind]}</span></div>
                    <div className="trade-summary__row"><span className="trade-muted">Est. {isBuySide ? 'cost' : 'proceeds'}</span><span style={mono}>{fmtUsd(notional)}</span></div>
                    <div className="trade-summary__row"><span className="trade-muted">Buying power</span><span style={mono}>{fmtUsd(buyingPower)}</span></div>
                  </div>

                  {/* Hints / warnings */}
                  {!intentValid && (
                    <div className="trade-order-warning" role="alert">
                      {intent === 'sell' ? `You have no long ${selectedStock.symbol} shares to sell.` : `You have no short ${selectedStock.symbol} position to cover.`}
                    </div>
                  )}
                  {intentValid && qty > maxShares && (
                    <div className="trade-order-warning" role="alert">
                      {intent === 'sell' || intent === 'buy_to_cover'
                        ? `Only ${fmtNum(maxShares)} ${selectedStock.symbol} available to ${im.verb.toLowerCase()}.`
                        : `Exceeds buying power — max ${fmtNum(maxShares)} shares.`}
                    </div>
                  )}
                  {intentValid && withinMax && willRest && (
                    <div className="trade-order-hint">
                      <Icon name="dot" size={7} />
                      {orderKind === 'market' && !sessionAllows
                        ? 'Market closed — order queues for the next session.'
                        : 'Resting order — fills when your price is reached.'}
                    </div>
                  )}

                  <button type="button" onClick={placeOrder} disabled={!canPlace}
                    className={`trade-place trade-place--${im.tone}`}>
                    {isLoading ? 'Placing…' : willRest ? `Place ${im.verb} Order` : `${im.verb} ${fmtNum(qty)} ${qty === 1 ? 'Share' : 'Shares'}`}
                  </button>
                </div>
              </div>

              {/* ───── Blotter: positions / open orders / history ───── */}
              <div className="trade-blotter">
                <div className="trade-tabs" role="tablist">
                  {[
                    { v: 'positions', label: `Positions${enrichedPositions.length ? ` (${enrichedPositions.length})` : ''}` },
                    { v: 'orders', label: `Open Orders${openOrders.length ? ` (${openOrders.length})` : ''}` },
                    { v: 'history', label: 'History' },
                  ].map((t) => (
                    <button key={t.v} type="button" role="tab" aria-selected={blotterTab === t.v}
                      className={`trade-tab ${blotterTab === t.v ? 'is-active' : ''}`} onClick={() => setBlotterTab(t.v)}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {blotterTab === 'positions' && (
                  <PositionsTable positions={enrichedPositions} onSelect={handleStockSelect} />
                )}
                {blotterTab === 'orders' && (
                  <OpenOrdersTable orders={openOrders} onCancel={cancelOrder} />
                )}
                {blotterTab === 'history' && (
                  <HistoryTable orders={orderHistory} transactions={transactions} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* ════════ Sidebar ════════ */}
        <div className="trade-col">
          <div className="trade-card">
            <div className="trade-section-head" style={{ flexWrap: 'wrap' }}>
              <h3 className="trade-heading" style={{ ...label, margin: 0 }}>Market watch</h3>
              <span className="trade-rule" />
              {marketIsDemo && <DemoPill />}
            </div>
            <div className="trade-muted" style={{ fontSize: '12px', marginBottom: '12px' }}>
              Tap a ticker to load it · Last: <span style={mono}>{lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : new Date().toLocaleTimeString()}</span>
            </div>
            {initialLoading ? (
              <div>{[0, 1, 2, 3, 4].map((i) => <div key={i} className="trade-skeleton trade-skeleton--row" />)}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {stocks.slice(0, 8).map((stock, index) => (
                  <button type="button" key={stock.symbol || index}
                    className={`trade-watch-row ${selectedStock?.symbol === stock.symbol ? 'is-active' : ''}`}
                    onClick={() => handleStockSelect(stock)} aria-label={`Trade ${stock.symbol}`}>
                    <span className="trade-watch-row__left">
                      <span className="trade-watch-row__symbol">{stock.symbol}</span>
                      {stock.name && <span className="trade-watch-row__name" style={{ display: 'block' }}>{stock.name}</span>}
                    </span>
                    <span className="trade-watch-row__right">
                      <span className="trade-watch-row__price" style={{ display: 'block' }}>{stock.price != null ? fmtUsd(stock.price) : 'N/A'}</span>
                      <ChangePill percent={stock.changePercent} />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Compact open-orders peek in the sidebar */}
          {openOrders.length > 0 && (
            <div className="trade-card">
              <div className="trade-section-head"><h3 className="trade-heading" style={{ ...label, margin: 0 }}>Working orders</h3><span className="trade-rule" /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {openOrders.slice(0, 5).map((o) => (
                  <div key={o.id} className="trade-mini-order">
                    <span className={`trade-side-badge ${INTENT_META[o.intent]?.tone === 'up' ? 'is-long' : 'is-short'}`}>{INTENT_META[o.intent]?.label || o.intent}</span>
                    <span style={{ ...mono, fontSize: 13, color: tk.text }}>{o.qty} {o.symbol}</span>
                    <span className="trade-muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{ORDER_KIND_LABEL[o.type]}</span>
                    <button type="button" className="trade-mini-cancel" onClick={() => cancelOrder(o.id)} aria-label="Cancel order"><Icon name="x" size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {showSuccessToast && lastOrderResult && (
        <div className="trade-toast" role="status" aria-live="polite">
          <span className="trade-toast__icon" aria-hidden="true"><Icon name="check" size={13} /></span>
          <span>{lastOrderResult.message}</span>
        </div>
      )}
    </div>
  );
}

// ── Blotter tables ─────────────────────────────────────────────────────────────

function PositionsTable({ positions, onSelect }) {
  if (!positions.length) {
    return <div className="trade-blotter__empty">No open positions. Your holdings appear here once you trade.</div>;
  }
  return (
    <div className="trade-table-wrap">
      <table className="trade-table">
        <thead>
          <tr>
            <th>Symbol</th><th>Side</th><th className="num">Qty</th><th className="num">Avg</th>
            <th className="num">Last</th><th className="num">Mkt Value</th><th className="num">Unreal. P&L</th><th className="num">Day</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.symbol} onClick={() => onSelect(p)} className="is-clickable">
              <td style={{ ...mono, fontWeight: 600, color: tk.text }}>{p.symbol}</td>
              <td><span className={`trade-side-badge ${p.isShort ? 'is-short' : 'is-long'}`}>{p.isShort ? 'SHORT' : 'LONG'}</span></td>
              <td className="num" style={mono}>{fmtNum(p.qty)}</td>
              <td className="num" style={mono}>{fmtUsd(p.avg)}</td>
              <td className="num" style={mono}>{fmtUsd(p.price)}</td>
              <td className="num" style={mono}>{fmtUsd(p.marketValue)}</td>
              <td className={`num ${p.pnl >= 0 ? 'is-up' : 'is-down'}`} style={mono}>{fmtSigned(p.pnl)}<span className="trade-table__pct"> ({p.pnlPct >= 0 ? '+' : ''}{p.pnlPct.toFixed(2)}%)</span></td>
              <td className={`num ${p.dayPnl >= 0 ? 'is-up' : 'is-down'}`} style={mono}>{fmtSigned(p.dayPnl)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OpenOrdersTable({ orders, onCancel }) {
  if (!orders.length) {
    return <div className="trade-blotter__empty">No working orders. Limit, stop &amp; trailing orders rest here until they fill.</div>;
  }
  const fmtCond = (o) => {
    if (o.type === 'limit') return `@ ${fmtUsd(o.limitPrice)}`;
    if (o.type === 'stop') return `stop ${fmtUsd(o.stopPrice)}`;
    if (o.type === 'stop_limit') return `${fmtUsd(o.stopPrice)} / ${fmtUsd(o.limitPrice)}`;
    if (o.type === 'trailing_stop') return `trail ${o.trailType === 'percent' ? `${o.trailValue}%` : fmtUsd(o.trailValue)}${o.stopPrice ? ` → ${fmtUsd(o.stopPrice)}` : ''}`;
    return 'market';
  };
  return (
    <div className="trade-table-wrap">
      <table className="trade-table">
        <thead>
          <tr><th>Action</th><th>Symbol</th><th className="num">Qty</th><th>Type</th><th>Condition</th><th>TIF</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td><span className={`trade-side-badge ${INTENT_META[o.intent]?.tone === 'up' ? 'is-long' : 'is-short'}`}>{INTENT_META[o.intent]?.label || o.intent}</span></td>
              <td style={{ ...mono, fontWeight: 600, color: tk.text }}>{o.symbol}</td>
              <td className="num" style={mono}>{fmtNum(o.qty)}</td>
              <td className="trade-muted">{ORDER_KIND_LABEL[o.type] || o.type}</td>
              <td style={{ ...mono, fontSize: 12 }}>{fmtCond(o)}</td>
              <td className="trade-muted" style={{ textTransform: 'uppercase', fontSize: 11 }}>{o.timeInForce}</td>
              <td><span className={`trade-status trade-status--${ORDER_STATUS_TONE[o.status] || 'flat'}`}>{o.status.replace('_', ' ')}</span></td>
              <td className="num"><button type="button" className="trade-cancel-btn" onClick={() => onCancel(o.id)}>Cancel</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryTable({ orders, transactions }) {
  // Prefer the order log (richer); fall back to raw transactions.
  const rows = (orders && orders.length)
    ? orders.filter((o) => ['filled', 'canceled', 'expired', 'rejected'].includes(o.status))
        .map((o) => ({
          key: o.id, time: o.filledAt || o.updatedAt || o.createdAt, symbol: o.symbol,
          intent: o.intent, qty: o.filledQty || o.qty, type: o.type,
          price: o.avgFillPrice, status: o.status,
        }))
    : (transactions || []).map((t, i) => ({
        key: t.id || i, time: t.timestamp, symbol: t.symbol, intent: t.type || t.side,
        qty: t.shares, type: 'market', price: t.price, status: 'filled',
      }));

  if (!rows.length) {
    return <div className="trade-blotter__empty">No order history yet. Filled and canceled orders show here.</div>;
  }
  return (
    <div className="trade-table-wrap">
      <table className="trade-table">
        <thead>
          <tr><th>Time</th><th>Action</th><th>Symbol</th><th className="num">Qty</th><th>Type</th><th className="num">Price</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((r) => (
            <tr key={r.key}>
              <td className="trade-muted" style={{ fontSize: 12 }}>{r.time ? new Date(r.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
              <td><span className={`trade-side-badge ${INTENT_META[r.intent]?.tone === 'up' ? 'is-long' : 'is-short'}`}>{INTENT_META[r.intent]?.label || r.intent}</span></td>
              <td style={{ ...mono, fontWeight: 600, color: tk.text }}>{r.symbol}</td>
              <td className="num" style={mono}>{fmtNum(r.qty)}</td>
              <td className="trade-muted">{ORDER_KIND_LABEL[r.type] || r.type}</td>
              <td className="num" style={mono}>{r.price != null ? fmtUsd(r.price) : '—'}</td>
              <td><span className={`trade-status trade-status--${ORDER_STATUS_TONE[r.status] || 'flat'}`}>{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Trade;
