import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import StockSearch from '../components/StockSearch';
import { SuperChart } from '../components/SuperChart';
import { useTrading } from '../hooks/useTrading';
import { getPositionValue, calculateOrderTotal } from '../utils/tradeUtils';
import { marbleDarkGray, marbleGold } from '../marblePalette';
import { fontBody } from '../fontPalette';
import { api } from '../services/api';
import { useNavbarBackground } from '../hooks/useNavbarBackground';
import { useSEO, SEO_CONFIG } from '../lib/seo';
import tk, { label, mono, heading, tag } from '../theme/terminal';
import Icon from '../components/Icon';
import './Trade.css';

const isDev = import.meta.env.DEV;

// A response/quote/chart is "demo" when live market keys are missing.
const isDemoData = (obj) =>
  !!obj && (obj.source === 'demo' || obj.demo === true || obj.isDemo === true);

// Small muted-gold pill shown next to demo-sourced data.
function DemoPill({ title = 'Live market keys are missing — showing simulated data' }) {
  return (
    <span
      style={{ ...tag, display: 'inline-flex', alignItems: 'center', gap: 5 }}
      title={title}
    >
      <Icon name="dot" size={7} /> Demo data
    </span>
  );
}

// Currency formatter with thousands separators and 2 decimals.
const fmtUsd = (n) =>
  `$${(Number(n) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// Parse a possibly-stringy / "N/A" percent into a usable number + direction.
const parseChange = (percent) => {
  const num = parseFloat(percent);
  const known =
    percent !== undefined && percent !== null && percent !== 'N/A' && !Number.isNaN(num);
  return { num, known, up: known && num >= 0 };
};

// Inline ± percentage with up/down/flat coloring and an arrow glyph.
function ChangePill({ percent, className = '' }) {
  const { num, known, up } = parseChange(percent);
  const state = !known ? 'is-flat' : up ? 'is-up' : 'is-down';
  return (
    <span className={`trade-change ${state} ${className}`}>
      {known ? (
        <>
          <Icon name={up ? 'tri-up' : 'tri-down'} size={9} />
          {`${up ? '+' : ''}${num.toFixed(2)}%`}
        </>
      ) : (
        '—'
      )}
    </span>
  );
}

// Boxed change badge (used next to the live quote price).
function ChangeBadge({ change, percent }) {
  const { num, known, up } = parseChange(percent);
  const state = !known ? 'is-flat' : up ? 'is-up' : 'is-down';
  const chg = Number(change);
  const hasAbs = change !== undefined && change !== null && !Number.isNaN(chg);
  return (
    <span className={`trade-change-badge ${state}`}>
      {known && <Icon name={up ? 'tri-up' : 'tri-down'} size={10} />}
      <span>
        {hasAbs ? `${up ? '+' : ''}${chg.toFixed(2)}` : ''}
        {known ? ` (${up ? '+' : ''}${num.toFixed(2)}%)` : ' —'}
      </span>
    </span>
  );
}

// Fallback discovery list when live market data hasn't arrived yet.
const POPULAR_TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'AMD'];

function Trade() {
  const location = useLocation();
  const { setNavbarBackground } = useNavbarBackground();

  // Per-page <title>/meta
  useSEO(SEO_CONFIG.trade);

  const {
    selectedStock,
    orderType,
    shares,
    portfolio,
    stocks,
    showOrderConfirmation,
    isLoading,
    error,
    marketStatus,
    isAuthenticated,
    lastUpdate,
    setOrderType,
    setShares,
    handleStockSelect,
    handleOrderSubmit,
    loadMarketData,
    clearError,
  } = useTrading();

  // Chart data state
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);
  // Timeframe for the demo/source chart-data fetch that powers the "Demo data" pill.
  // The interactive interval selector lives inside <SuperChart>, so this stays fixed.
  const timeframe = '1D';

  // Initial-load skeletons: true until the first portfolio + market fetch lands.
  const [initialLoading, setInitialLoading] = useState(true);

  // Success UX: a toast that stays ~6s, plus a persistent "last filled" indicator.
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastFill, setLastFill] = useState(null); // { type, shares, symbol, at }

  // Once portfolio data (or market data) arrives, drop the skeletons.
  useEffect(() => {
    if (portfolio || (stocks && stocks.length > 0)) {
      setInitialLoading(false);
    }
  }, [portfolio, stocks]);

  // Safety: never let skeletons hang forever if a fetch quietly fails.
  useEffect(() => {
    const t = setTimeout(() => setInitialLoading(false), 8000);
    return () => clearTimeout(t);
  }, []);

  // When the hook confirms an order, surface a longer-lived toast (~6s) and
  // record a persistent success indicator.
  useEffect(() => {
    if (!showOrderConfirmation) return;
    setLastFill({
      type: orderType,
      shares,
      symbol: selectedStock?.symbol,
      at: new Date(),
    });
    setShowSuccessToast(true);
    const t = setTimeout(() => setShowSuccessToast(false), 6000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOrderConfirmation]);

  // Stable callbacks for SuperChart — passing fresh inline functions would put a
  // new reference in SuperChart's init effect deps on every render and tear down
  // / rebuild the chart, leaving the canvas blank.
  const handleChartReady = useCallback((chart) => {
    if (isDev) console.log('SuperChart ready:', chart);
  }, []);
  const handleChartDataUpdate = useCallback((data) => {
    if (isDev) console.log('Chart data updated:', data);
  }, []);
  const handleDrawingUpdate = useCallback((drawings) => {
    if (isDev) console.log('Drawings updated:', drawings);
  }, []);

  const quoteIsDemo = isDemoData(selectedStock);
  const chartIsDemo = isDemoData(chartData);
  // Market data arrives as an array of stocks; flag if any item is demo-sourced.
  const marketIsDemo = Array.isArray(stocks) && stocks.some(isDemoData);

  // ---- Portfolio totals (the engagement loop: value + unrealized P&L) ----
  const positions = portfolio?.positions ?? [];
  const positionsWithValue = positions.map((p) => ({ ...p, ...getPositionValue(p) }));
  const positionsValue = positionsWithValue.reduce((s, p) => s + (p.currentValue || 0), 0);
  const totalPnl = positionsWithValue.reduce((s, p) => s + (p.pnl || 0), 0);
  const totalCostBasis = positionsWithValue.reduce(
    (s, p) => s + p.shares * (p.avgPrice ?? p.avgCost ?? 0),
    0
  );
  const totalPnlPercent = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;
  const buyingPower = portfolio?.balance ?? 0;
  const portfolioValue = buyingPower + positionsValue;
  const pnlUp = totalPnl >= 0;

  // ---- Order-ticket math (buying-power awareness + post-trade preview) ----
  const price = selectedStock?.price || 0;
  const orderTotal = calculateOrderTotal(selectedStock, shares);
  const heldShares =
    positions.find((p) => p.symbol === selectedStock?.symbol)?.shares || 0;
  const maxBuyShares = price > 0 ? Math.floor(buyingPower / price) : 0;
  const maxShares = orderType === 'buy' ? maxBuyShares : heldShares;
  const projectedBalance = orderType === 'buy' ? buyingPower - orderTotal : buyingPower + orderTotal;
  const orderAffordable =
    orderType === 'buy' ? orderTotal <= buyingPower : shares <= heldShares;

  const setSharesSafe = (n) => setShares(Math.max(1, Math.floor(n) || 1));
  const applyPct = (pct) => {
    if (maxShares > 0) setSharesSafe(Math.max(1, Math.floor(maxShares * pct)));
  };

  // Quick-pick tickers for the empty state: prefer live market rows, else fallback.
  const quickPicks =
    Array.isArray(stocks) && stocks.length > 0
      ? stocks.slice(0, 8)
      : POPULAR_TICKERS.map((symbol) => ({ symbol }));

  // Load chart data when stock is selected
  useEffect(() => {
    if (selectedStock?.symbol) {
      loadChartData(selectedStock.symbol, timeframe);
    }
  }, [selectedStock?.symbol, timeframe]);

  // Handle overscroll behavior for Trade page
  useEffect(() => {
    // Only run this effect when on Trade page
    if (location.pathname !== '/trade') {
      return;
    }

    if (isDev) console.log('Trade: Setting up overscroll behavior for dark theme');

    // Get the current setNavbarBackground function
    const currentSetNavbarBackground = setNavbarBackground;

    const updateBackground = () => {
      const pageTransition = document.querySelector('.page-transition');
      const mainContent = document.querySelector('.main-content');
      const appContainer = document.querySelector('.app-container');
      const body = document.body;
      const html = document.documentElement;
      
      const backgroundColor = 'var(--marbleDarkGray)'; // Always dark for Trade page
      const cssVar = 'var(--marbleDarkGray)';
      
      if (pageTransition) {
        pageTransition.style.backgroundColor = backgroundColor;
      }
      if (mainContent) {
        mainContent.style.backgroundColor = cssVar;
      }
      if (appContainer) {
        appContainer.style.backgroundColor = cssVar;
      }
      // Update navbar background using the centralized system
      currentSetNavbarBackground('var(--marbleDarkGray)'); // Use CSS variable for consistency
      if (isDev) console.log('Trade: Navbar set to dark theme (var(--marbleDarkGray))');
      
      if (body) {
        body.style.backgroundColor = backgroundColor;
      }
      if (html) {
        html.style.backgroundColor = backgroundColor;
      }
      // Update scrollbar to match the background
      body.style.setProperty('--scrollbar-track-bg', 'var(--marbleDarkGray)', 'important');
    };
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Check for overscroll at top (negative scroll position)
      const isOverscrollingTop = scrollPosition < 0;
      // Check for overscroll at bottom
      const isOverscrollingBottom = scrollPosition + windowHeight > documentHeight;
      
      // Always maintain dark theme for Trade page
      if (isOverscrollingTop || isOverscrollingBottom) {
        if (isDev) console.log('Trade: Overscroll detected, maintaining dark theme');
        updateBackground();
      }
    };

    // Handle touch events for mobile overscroll
    const handleTouchMove = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Check for overscroll
      const isOverscrollingTop = scrollPosition < 0;
      const isOverscrollingBottom = scrollPosition + windowHeight > documentHeight;

      if (isOverscrollingTop || isOverscrollingBottom) {
        if (isDev) console.log('Trade: Touch overscroll detected, maintaining dark theme');
        updateBackground();
      }
    };

    // Add smooth transition to multiple elements
    const elements = ['.page-transition', '.main-content', '.app-container', '.navbar-color'];
    elements.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.transition = 'background-color 0.5s ease';
      }
    });
    
    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('touchmove', handleTouchMove);
      if (isDev) console.log('Trade: Cleanup - overscroll listeners removed');
    };
  }, [location.pathname]); // Remove setNavbarBackground from dependencies

  const loadChartData = async (symbol, tf) => {
    setChartLoading(true);
    setChartError(null);
    
    try {
      // Try to get data from API first
      const response = await api.getChartData(symbol, tf, 100);
      if (response.success) {
        // Carry any demo/source flag onto the chart data so the UI can label it.
        const flagged = isDemoData(response)
          ? { ...response.chartData, demo: true }
          : response.chartData;
        setChartData(flagged);
      } else {
        // Fallback to mock data (clearly flagged as demo)
        setChartData({ ...generateMockChartData(symbol, tf), demo: true });
      }
    } catch (error) {
      if (isDev) console.error('Error loading chart data:', error);
      // Fallback to mock data (clearly flagged as demo)
      setChartData({ ...generateMockChartData(symbol, tf), demo: true });
    } finally {
      setChartLoading(false);
    }
  };

  const generateMockChartData = (symbol, timeframe) => {
    const basePrice = 100 + Math.random() * 200; // Random base price between 100-300
    const candles = [];
    const now = new Date();
    
    // Generate data points based on timeframe
    let interval;
    switch (timeframe) {
      case '1H':
        interval = 60 * 60 * 1000; // 1 hour
        break;
      case '4H':
        interval = 4 * 60 * 60 * 1000; // 4 hours
        break;
      case '1D':
        interval = 24 * 60 * 60 * 1000; // 1 day
        break;
      case '1W':
        interval = 7 * 24 * 60 * 60 * 1000; // 1 week
        break;
      case '1M':
        interval = 30 * 24 * 60 * 60 * 1000; // 1 month
        break;
      default:
        interval = 24 * 60 * 60 * 1000; // Default to 1 day
    }
    
    for (let i = 30; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * interval));
      const open = basePrice + (Math.random() - 0.5) * 20;
      const high = open + Math.random() * 10;
      const low = open - Math.random() * 10;
      const close = open + (Math.random() - 0.5) * 8;
      const volume = Math.floor(Math.random() * 1000000) + 100000;
      
      candles.push({
        timestamp: Math.floor(time.getTime() / 1000),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: volume
      });
    }
    
    return {
      symbol,
      timeframe,
      candles,
      lastUpdated: new Date().toISOString()
    };
  };

  if (!isAuthenticated) {
    return (
      <div className="page-dark" style={{
        minHeight: '100vh',
        backgroundColor: marbleDarkGray,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: fontBody
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{
            ...heading,
            fontSize: '24px',
            color: 'var(--trade-text, #F4F1E9)',
            marginBottom: '12px'
          }}>
            {error || 'Sign in required'}
          </div>
          <div style={{
            fontSize: '16px',
            color: 'var(--trade-text-muted, #b8b4a8)'
          }}>
            Please sign in to access the trading features.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-dark trade-page">
      <div className="trade-grid">
        {/* Main Trading Area */}
        <div className="trade-col">
          {/* Header — terminal-style bar + account stat strip */}
          <div className="trade-card trade-header">
            <div className="trade-header__top">
              <div className="trade-title-row">
                <h1 className="trade-title">
                  <Icon name="trending-up" size={20} color={tk.gold} />
                  Paper trading
                </h1>
                <span
                  style={{
                    ...tag,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: marketStatus === 'open' ? tk.up : tk.down,
                    borderColor:
                      marketStatus === 'open'
                        ? 'rgba(79,180,119,0.4)'
                        : 'rgba(224,96,90,0.4)',
                  }}
                >
                  <Icon name="dot" size={7} />
                  {marketStatus === 'open' ? 'Market open' : 'Market closed'}
                </span>
              </div>
              <div className="trade-header__meta">
                {lastUpdate && (
                  <span style={{ fontSize: '12px', color: 'var(--trade-text-muted)' }}>
                    Updated{' '}
                    <span style={mono}>{new Date(lastUpdate).toLocaleTimeString()}</span>
                  </span>
                )}
                <button
                  type="button"
                  className="trade-refresh-btn"
                  onClick={loadMarketData}
                  aria-label="Refresh market data"
                >
                  <Icon name="refresh" size={14} /> Refresh
                </button>
              </div>
            </div>

            {/* Account snapshot — value, unrealized P&L, buying power */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={label}>account</span>
              <span style={{ flex: 1, height: 1, background: tk.hair }} />
            </div>
            <div className="trade-stat-strip">
              <div className="trade-stat">
                <div className="trade-stat__label">Portfolio Value</div>
                {initialLoading ? (
                  <div className="trade-skeleton trade-skeleton--amount" style={{ marginBottom: 0 }} />
                ) : (
                  <div className="trade-stat__value">{fmtUsd(portfolioValue)}</div>
                )}
              </div>
              <div className="trade-stat">
                <div className="trade-stat__label">Total P&amp;L</div>
                {initialLoading ? (
                  <div className="trade-skeleton trade-skeleton--amount" style={{ marginBottom: 0 }} />
                ) : (
                  <>
                    <div
                      className="trade-stat__value"
                      style={{ color: pnlUp ? 'var(--trade-up)' : 'var(--trade-down)' }}
                    >
                      {pnlUp ? '+' : '−'}{fmtUsd(Math.abs(totalPnl))}
                    </div>
                    <div className="trade-stat__sub">
                      <ChangePill percent={totalPnlPercent.toFixed(2)} />
                    </div>
                  </>
                )}
              </div>
              <div className="trade-stat">
                <div className="trade-stat__label">Buying Power</div>
                {initialLoading ? (
                  <div className="trade-skeleton trade-skeleton--amount" style={{ marginBottom: 0 }} />
                ) : (
                  <div className="trade-stat__value">{fmtUsd(buyingPower)}</div>
                )}
              </div>
            </div>

            {/* Persistent success indicator after a fill */}
            {lastFill && (
              <div className="trade-success-chip" aria-live="polite">
                <Icon name="check" size={13} />
                Last order filled:&nbsp;
                {lastFill.type === 'buy' ? 'Bought' : 'Sold'}{' '}
                <span style={mono}>{lastFill.shares}</span>{' '}
                {lastFill.shares === 1 ? 'share' : 'shares'}
                {lastFill.symbol ? (
                  <>
                    {' '}
                    of <span style={mono}>{lastFill.symbol}</span>
                  </>
                ) : (
                  ''
                )}{' '}
                at <span style={mono}>{lastFill.at.toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          {/* Surface order/validation errors so failed buys/sells aren't silent */}
          {error && (
            <div className="trade-error-banner" role="alert" aria-live="assertive">
              <span className="trade-error-banner__text">
                <Icon name="alert" size={15} />
                <span>{error}</span>
              </span>
              <button
                type="button"
                className="trade-error-banner__dismiss"
                onClick={clearError}
                aria-label="Dismiss error"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          )}

          {/* Stock Search */}
          <div className="trade-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <h2 className="trade-heading" style={{ ...label, margin: 0 }}>
                Search stocks
              </h2>
              <span style={{ flex: 1, height: 1, background: tk.hair }} />
            </div>
            <StockSearch
              onStockSelect={handleStockSelect}
              placeholder="Search by symbol or company name (e.g., AAPL, Apple, TSLA)..."
            />
          </div>

          {/* Smart empty state — guides the first action when nothing is selected */}
          {!selectedStock && (
            <div className="trade-card">
              <div className="trade-empty">
                <div className="trade-empty__icon" aria-hidden="true">
                  <Icon name="search" size={18} />
                </div>
                <h2 className="trade-empty__title">Pick a stock to start trading</h2>
                <p className="trade-empty__subtitle">
                  Search above, or jump into one of today&apos;s most active tickers.
                  Your live chart and order ticket appear here once you choose.
                </p>
                <div className="trade-quickpicks">
                  {quickPicks.map((stock) => (
                    <button
                      type="button"
                      key={stock.symbol}
                      className="trade-quickpick"
                      onClick={() => handleStockSelect(stock)}
                      disabled={isLoading}
                    >
                      <span className="trade-quickpick__symbol">{stock.symbol}</span>
                      <span style={{ textAlign: 'right' }}>
                        {stock.price != null && (
                          <span className="trade-quickpick__price" style={{ display: 'block' }}>
                            {fmtUsd(stock.price)}
                          </span>
                        )}
                        {stock.changePercent != null && (
                          <ChangePill percent={stock.changePercent} />
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chart and Trading Section */}
          {selectedStock && (
            <div className="trade-card">
              {(quoteIsDemo || chartIsDemo) && (
                <div style={{ marginBottom: '12px' }}>
                  <DemoPill />
                </div>
              )}
              <div className="trade-chart-grid">
                {/* Chart */}
                <div>
                  {chartLoading && (
                    <div className="trade-chart-status" role="status" aria-live="polite">
                      <span className="trade-chart-status__spinner" aria-hidden="true" />
                      Loading chart data…
                    </div>
                  )}
                  {chartError && !chartLoading && (
                    <div className="trade-chart-status trade-chart-status--error" role="alert">
                      <Icon name="alert" size={14} /> {chartError}
                    </div>
                  )}
                  <SuperChart
                    symbol={selectedStock.symbol}
                    initialInterval="1d"
                    theme="dark"
                    realtime={false}
                    height={400}
                    onChartReady={handleChartReady}
                    onDataUpdate={handleChartDataUpdate}
                    onDrawingUpdate={handleDrawingUpdate}
                  />
                </div>

                {/* Trading Panel — sticky on wide screens */}
                <div className="trade-card--inset trade-order-panel" style={{ padding: '16px' }}>
                  {/* Stock Info */}
                  <div style={{
                    marginBottom: '18px',
                    paddingBottom: '14px',
                    borderBottom: '1px solid var(--trade-divider)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px',
                      gap: '8px'
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ ...mono, fontSize: '20px', fontWeight: 600, color: 'var(--trade-text)' }}>
                          {selectedStock.symbol}
                        </div>
                        <div className="trade-muted" style={{
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {selectedStock.name}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ ...mono, fontSize: '24px', fontWeight: 500, color: 'var(--trade-text)' }}>
                          {selectedStock.price != null ? fmtUsd(selectedStock.price) : 'N/A'}
                        </div>
                        <div style={{ marginTop: '2px' }}>
                          <ChangeBadge change={selectedStock.change} percent={selectedStock.changePercent} />
                        </div>
                      </div>
                    </div>
                    {selectedStock.volume && (
                      <div className="trade-muted" style={{ fontSize: '12px' }}>
                        Volume: <span style={mono}>{selectedStock.volume.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Order Form */}
                  <div>
                    {/* Order type */}
                    <div style={{ marginBottom: '16px' }}>
                      <label
                        htmlFor="trade-order-type"
                        style={{ ...label, display: 'block', marginBottom: '8px' }}
                      >
                        Order Type
                      </label>
                      <div id="trade-order-type" role="group" aria-label="Order type" style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setOrderType('buy')}
                          aria-pressed={orderType === 'buy'}
                          style={{ flex: 1, padding: '10px', borderRadius: tk.rSm, border: orderType === 'buy' ? 'none' : `1px solid ${tk.hairStrong}`, color: orderType === 'buy' ? '#1F1F1F' : tk.muted, fontWeight: '700', cursor: 'pointer', backgroundColor: orderType === 'buy' ? tk.up : 'transparent', transition: 'background-color 0.2s ease, color 0.2s ease', fontSize: '14px' }}
                        >
                          Buy
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType('sell')}
                          aria-pressed={orderType === 'sell'}
                          style={{ flex: 1, padding: '10px', borderRadius: tk.rSm, border: orderType === 'sell' ? 'none' : `1px solid ${tk.hairStrong}`, color: orderType === 'sell' ? '#1F1F1F' : tk.muted, fontWeight: '700', cursor: 'pointer', backgroundColor: orderType === 'sell' ? tk.down : 'transparent', transition: 'background-color 0.2s ease, color 0.2s ease', fontSize: '14px' }}
                        >
                          Sell
                        </button>
                      </div>
                    </div>

                    {/* Shares — steppers + quick-amount chips */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                        <label htmlFor="trade-shares" style={{ ...label }}>
                          Shares
                        </label>
                        {orderType === 'sell' && (
                          <span className="trade-muted" style={{ fontSize: '12px' }}>
                            <span style={mono}>{heldShares}</span> held
                          </span>
                        )}
                      </div>
                      <div className="trade-stepper">
                        <button type="button" className="trade-stepper__btn" onClick={() => setSharesSafe(shares - 1)} aria-label="Decrease shares"><Icon name="minus" size={16} /></button>
                        <input
                          id="trade-shares"
                          className="trade-stepper__input"
                          type="number"
                          value={shares}
                          onChange={(e) => setShares(parseInt(e.target.value) || 1)}
                          min="1"
                          aria-label="Number of shares"
                        />
                        <button type="button" className="trade-stepper__btn" onClick={() => setSharesSafe(shares + 1)} aria-label="Increase shares"><Icon name="plus" size={16} /></button>
                      </div>
                      <div className="trade-chips">
                        {[0.25, 0.5, 0.75].map((pct) => (
                          <button
                            type="button"
                            key={pct}
                            className="trade-chip"
                            onClick={() => applyPct(pct)}
                            disabled={maxShares <= 0}
                            title={orderType === 'buy' ? `${pct * 100}% of buying power` : `${pct * 100}% of shares held`}
                          >
                            {pct * 100}%
                          </button>
                        ))}
                        <button
                          type="button"
                          className="trade-chip"
                          onClick={() => maxShares > 0 && setSharesSafe(maxShares)}
                          disabled={maxShares <= 0}
                        >
                          Max
                        </button>
                      </div>
                    </div>

                    {/* Order summary + post-trade preview */}
                    <div style={{ padding: '12px', backgroundColor: 'var(--trade-surface)', borderRadius: '8px', marginBottom: '4px', fontSize: '12px' }}>
                      <div className="trade-buying-power">
                        <span className="trade-muted">Buying power</span>
                        <span style={{ ...mono, fontWeight: '600', color: 'var(--trade-text)' }}>{fmtUsd(buyingPower)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span className="trade-muted">Price per share</span>
                        <span style={{ ...mono, fontWeight: '500', color: 'var(--trade-text)' }}>
                          {selectedStock.price != null ? fmtUsd(selectedStock.price) : 'N/A'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--trade-divider)', paddingTop: '6px', marginTop: '2px', fontWeight: 'bold' }}>
                        <span style={{ color: 'var(--trade-text)' }}>Estimated total</span>
                        <span style={{ ...mono, color: 'var(--trade-text)' }}>{fmtUsd(orderTotal)}</span>
                      </div>
                      <div className="trade-projected">
                        <span className="trade-muted">Balance after</span>
                        <span style={{ ...mono, fontWeight: '600', color: orderAffordable ? 'var(--trade-text)' : 'var(--trade-down)' }}>
                          {fmtUsd(projectedBalance)}
                        </span>
                      </div>
                    </div>

                    {/* Affordability warning */}
                    {!orderAffordable && (
                      <div className="trade-order-warning" role="alert">
                        {orderType === 'buy' ? (
                          'Not enough buying power for this order.'
                        ) : (
                          <>
                            You only hold <span style={mono}>{heldShares}</span>{' '}
                            {heldShares === 1 ? 'share' : 'shares'} of{' '}
                            <span style={mono}>{selectedStock.symbol}</span>.
                          </>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleOrderSubmit}
                      disabled={isLoading || !orderAffordable || !selectedStock.price}
                      style={{
                        width: '100%',
                        padding: '13px',
                        marginTop: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: marbleGold,
                        color: marbleDarkGray,
                        fontSize: '14px',
                        fontWeight: 'bold',
                        letterSpacing: '0.02em',
                        cursor: (isLoading || !orderAffordable) ? 'not-allowed' : 'pointer',
                        opacity: (isLoading || !orderAffordable) ? 0.55 : 1,
                        transition: 'background-color 0.2s ease, opacity 0.2s ease'
                      }}
                    >
                      {isLoading ? 'Processing…' : (
                        <>
                          {orderType === 'buy' ? 'Buy' : 'Sell'}{' '}
                          <span style={mono}>{shares}</span>{' '}
                          {shares === 1 ? 'Share' : 'Shares'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="trade-col">
          {/* Portfolio — holdings summary + per-position P&L */}
          <div className="trade-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <h3 className="trade-heading" style={{ ...label, margin: 0 }}>
                Portfolio
              </h3>
              <span style={{ flex: 1, height: 1, background: tk.hair }} />
            </div>
            {initialLoading ? (
              <div>
                <div className="trade-skeleton trade-skeleton--card" />
                <div className="trade-skeleton trade-skeleton--card" />
              </div>
            ) : positionsWithValue.length === 0 ? (
              <div className="trade-muted" style={{ textAlign: 'center', padding: '20px' }}>
                No positions yet — your holdings will show here.
              </div>
            ) : (
              <>
                {/* Holdings summary */}
                <div className="trade-portfolio-summary">
                  <div>
                    <div className="trade-stat__label">Holdings Value</div>
                    <div style={{ ...mono, fontSize: '20px', fontWeight: 500, color: 'var(--trade-text)' }}>
                      {fmtUsd(positionsValue)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="trade-stat__label">Unrealized</div>
                    <div style={{ ...mono, fontSize: '16px', fontWeight: 500, color: pnlUp ? 'var(--trade-up)' : 'var(--trade-down)' }}>
                      {pnlUp ? '+' : '−'}{fmtUsd(Math.abs(totalPnl))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {positionsWithValue.map((position, index) => {
                    const posUp = (position.pnl || 0) >= 0;
                    const magnitude = Math.min(Math.abs(position.pnlPercent || 0), 100);
                    return (
                      <button
                        type="button"
                        key={position.symbol || index}
                        className="trade-position"
                        onClick={() => handleStockSelect(position)}
                        style={{ display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                        aria-label={`Trade ${position.symbol}`}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ ...mono, fontSize: '15px', fontWeight: 600, color: 'var(--trade-text)' }}>
                            {position.symbol}
                          </span>
                          <ChangePill percent={(position.pnlPercent ?? 0).toFixed(2)} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="trade-muted" style={{ fontSize: '12px' }}>
                            <span style={mono}>{position.shares}</span> sh · avg <span style={mono}>{fmtUsd(position.avgPrice ?? position.avgCost ?? 0)}</span>
                          </span>
                          <span style={{ ...mono, fontSize: '14px', fontWeight: 600, color: 'var(--trade-text)' }}>
                            {fmtUsd(position.currentValue)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                          <span style={{ ...mono, fontSize: '12px', fontWeight: 600, color: posUp ? 'var(--trade-up)' : 'var(--trade-down)' }}>
                            {posUp ? '+' : '−'}{fmtUsd(Math.abs(position.pnl || 0))}
                          </span>
                        </div>
                        <div className="trade-position__bar">
                          <span style={{ width: `${magnitude}%`, background: posUp ? 'var(--trade-up)' : 'var(--trade-down)' }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Market Watch — interactive: tap a ticker to load it */}
          <div className="trade-card">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
              marginBottom: '8px'
            }}>
              <h3 className="trade-heading" style={{ ...label, margin: 0 }}>
                Market watch
              </h3>
              <span style={{ flex: 1, height: 1, background: tk.hair }} />
              {marketIsDemo && <DemoPill />}
            </div>
            <div className="trade-muted" style={{ fontSize: '12px', marginBottom: '12px' }}>
              Tap a ticker to load it · Last:{' '}
              <span style={mono}>{lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : new Date().toLocaleTimeString()}</span>
            </div>
            {initialLoading ? (
              <div>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="trade-skeleton trade-skeleton--row" />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {stocks.slice(0, 6).map((stock, index) => (
                  <button
                    type="button"
                    key={stock.symbol || index}
                    className={`trade-watch-row ${selectedStock?.symbol === stock.symbol ? 'is-active' : ''}`}
                    onClick={() => handleStockSelect(stock)}
                    aria-label={`Trade ${stock.symbol}`}
                  >
                    <span className="trade-watch-row__left">
                      <span className="trade-watch-row__symbol">{stock.symbol}</span>
                      {stock.name && (
                        <span className="trade-watch-row__name" style={{ display: 'block' }}>{stock.name}</span>
                      )}
                    </span>
                    <span className="trade-watch-row__right">
                      <span className="trade-watch-row__price" style={{ display: 'block' }}>
                        {stock.price != null ? fmtUsd(stock.price) : 'N/A'}
                      </span>
                      <ChangePill percent={stock.changePercent} />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success toast — persists ~6s so a fill is clearly visible */}
      {showSuccessToast && (
        <div className="trade-toast" role="status" aria-live="polite">
          <span className="trade-toast__icon" aria-hidden="true">
            <Icon name="check" size={13} />
          </span>
          <span>
            Order executed successfully
            {lastFill?.symbol ? (
              <>
                {' '}— {lastFill.type === 'buy' ? 'bought' : 'sold'}{' '}
                <span style={mono}>{lastFill.shares} {lastFill.symbol}</span>
              </>
            ) : (
              '!'
            )}
          </span>
        </div>
      )}
    </div>
  );
}

export default Trade; 