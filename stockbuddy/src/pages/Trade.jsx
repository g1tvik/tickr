import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import StockTicker from '../components/StockTicker';
import StockSearch from '../components/StockSearch';
import { SuperChart } from '../components/SuperChart';
import { useTrading } from '../hooks/useTrading';
import { getPositionValue, calculateOrderTotal } from '../utils/tradeUtils';
import { gray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';
import { api } from '../services/api';
import { useNavbarBackground } from '../hooks/useNavbarBackground';
import { useSEO, SEO_CONFIG } from '../lib/seo';
import './Trade.css';

const isDev = import.meta.env.DEV;

// A response/quote/chart is "demo" when live market keys are missing.
const isDemoData = (obj) =>
  !!obj && (obj.source === 'demo' || obj.demo === true || obj.isDemo === true);

// Small muted-gold pill shown next to demo-sourced data.
function DemoPill({ title = 'Live market keys are missing — showing simulated data' }) {
  return (
    <span className="trade-demo-pill" title={title}>
      Demo data
    </span>
  );
}

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

  const quoteIsDemo = isDemoData(selectedStock);
  const chartIsDemo = isDemoData(chartData);
  // Market data arrives as an array of stocks; flag if any item is demo-sourced.
  const marketIsDemo = Array.isArray(stocks) && stocks.some(isDemoData);

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
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'var(--trade-text, #F4F1E9)',
            marginBottom: '12px',
            fontFamily: fontHeading
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
          {/* Header */}
          <div className="trade-card">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <h1 className="trade-heading" style={{ fontSize: '28px' }}>
                📈 Paper Trading
              </h1>
              <div
                className="trade-muted"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px'
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: marketStatus === 'open' ? '#22c55e' : '#ef4444'
                  }}
                ></span>
                <span>{marketStatus === 'open' ? 'Market Open' : 'Market Closed'}</span>
              </div>
            </div>
            <p className="trade-muted" style={{ fontSize: '14px', margin: 0 }}>
              Practice trading with virtual money. Real-time data powered by Alpaca API.
            </p>
            <div style={{
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              {lastUpdate && (
                <span style={{ fontSize: '12px', opacity: 0.85, color: marbleGold }}>
                  Last updated: {new Date(lastUpdate).toLocaleTimeString()}
                </span>
              )}
              <button
                type="button"
                className="trade-refresh-btn"
                onClick={loadMarketData}
                aria-label="Refresh market data"
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          {/* Surface order/validation errors so failed buys/sells aren't silent */}
          {error && (
            <div className="trade-error-banner" role="alert" aria-live="assertive">
              <span className="trade-error-banner__text">
                <span aria-hidden="true">⚠️</span>
                <span>{error}</span>
              </span>
              <button
                type="button"
                className="trade-error-banner__dismiss"
                onClick={clearError}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {/* Stock Search */}
          <div className="trade-card">
            <h2 className="trade-heading" style={{ fontSize: '20px', marginBottom: '16px' }}>
              Search Stocks
            </h2>
            <StockSearch
              onStockSelect={handleStockSelect}
              placeholder="Search by symbol or company name (e.g., AAPL, Apple, TSLA)..."
            />
          </div>

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
                      <span aria-hidden="true">⚠️</span> {chartError}
                    </div>
                  )}
                  <SuperChart
                    symbol={selectedStock.symbol}
                    initialInterval="1d"
                    theme="dark"
                    realtime={false}
                    height={400}
                    onChartReady={(chart) => {
                      if (isDev) console.log('SuperChart ready:', chart);
                    }}
                    onDataUpdate={(data) => {
                      if (isDev) console.log('Chart data updated:', data);
                    }}
                    onDrawingUpdate={(drawings) => {
                      if (isDev) console.log('Drawings updated:', drawings);
                    }}
                  />
                </div>

                {/* Trading Panel */}
                <div className="trade-card--inset" style={{
                  padding: '16px',
                  height: 'fit-content'
                }}>
                  {/* Stock Info */}
                  <div style={{
                    marginBottom: '20px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--trade-divider)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: 'var(--trade-text)'
                        }}>
                          {selectedStock.symbol}
                        </div>
                        <div className="trade-muted" style={{ fontSize: '12px' }}>
                          {selectedStock.name}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: 'var(--trade-text)'
                        }}>
                          ${selectedStock.price?.toFixed(2) || 'N/A'}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: selectedStock.changePercent && selectedStock.changePercent !== 'N/A' && parseFloat(selectedStock.changePercent) >= 0 ? '#22c55e' : '#ef4444'
                        }}>
                          {selectedStock.changePercent && selectedStock.changePercent !== 'N/A' ?
                            `${parseFloat(selectedStock.changePercent) >= 0 ? '+' : ''}${selectedStock.changePercent}%` :
                            'N/A'
                          }
                        </div>
                      </div>
                    </div>
                    {selectedStock.volume && (
                      <div className="trade-muted" style={{ fontSize: '12px' }}>
                        Volume: {selectedStock.volume.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Order Form */}
                  <div>
                    <div style={{ marginBottom: '16px' }}>
                      <label
                        htmlFor="trade-order-type"
                        style={{
                          display: 'block',
                          marginBottom: '6px',
                          color: 'var(--trade-text)',
                          fontWeight: '500',
                          fontSize: '14px'
                        }}
                      >
                        Order Type
                      </label>
                      <div
                        id="trade-order-type"
                        role="group"
                        aria-label="Order type"
                        style={{ display: 'flex', gap: '6px' }}
                      >
                        <button
                          type="button"
                          onClick={() => setOrderType('buy')}
                          aria-pressed={orderType === 'buy'}
                          style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '6px',
                            border: 'none',
                            color: 'white',
                            fontWeight: '500',
                            cursor: 'pointer',
                            backgroundColor: orderType === 'buy' ? '#22c55e' : gray,
                            transition: 'opacity 0.2s',
                            fontSize: '14px'
                          }}
                        >
                          Buy
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType('sell')}
                          aria-pressed={orderType === 'sell'}
                          style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '6px',
                            border: 'none',
                            color: 'white',
                            fontWeight: '500',
                            cursor: 'pointer',
                            backgroundColor: orderType === 'sell' ? '#ef4444' : gray,
                            transition: 'opacity 0.2s',
                            fontSize: '14px'
                          }}
                        >
                          Sell
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label
                        htmlFor="trade-shares"
                        style={{
                          display: 'block',
                          marginBottom: '6px',
                          color: 'var(--trade-text)',
                          fontWeight: '500',
                          fontSize: '14px'
                        }}
                      >
                        Shares
                      </label>
                      <input
                        id="trade-shares"
                        type="number"
                        value={shares}
                        onChange={(e) => setShares(parseInt(e.target.value) || 1)}
                        min="1"
                        aria-label="Number of shares"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid var(--trade-border)',
                          backgroundColor: 'var(--trade-surface)',
                          color: 'var(--trade-text)',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div style={{
                      padding: '12px',
                      backgroundColor: 'var(--trade-surface)',
                      borderRadius: '6px',
                      marginBottom: '16px',
                      fontSize: '12px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px'
                      }}>
                        <span className="trade-muted">Price per share</span>
                        <span style={{ fontWeight: '500', color: 'var(--trade-text)' }}>${selectedStock.price?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px'
                      }}>
                        <span className="trade-muted">Number of shares</span>
                        <span style={{ fontWeight: '500', color: 'var(--trade-text)' }}>{shares}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderTop: '1px solid var(--trade-divider)',
                        paddingTop: '4px',
                        marginBottom: 0,
                        fontWeight: 'bold'
                      }}>
                        <span style={{ color: 'var(--trade-text)' }}>Total</span>
                        <span style={{ color: 'var(--trade-text)' }}>
                          ${calculateOrderTotal(selectedStock, shares).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOrderSubmit}
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: marbleGold,
                        color: marbleDarkGray,
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.6 : 1,
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {isLoading ? 'Processing...' : `${orderType === 'buy' ? 'Buy' : 'Sell'} ${shares} ${shares === 1 ? 'Share' : 'Shares'}`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="trade-col">
          {/* Account Balance */}
          <div className="trade-card">
            <h3 className="trade-heading" style={{ fontSize: '20px', marginBottom: '16px' }}>
              Account Balance
            </h3>
            {initialLoading ? (
              <>
                <div className="trade-skeleton trade-skeleton--amount" />
                <div className="trade-skeleton trade-skeleton--line is-short" />
              </>
            ) : (
              <>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: 'var(--trade-text)',
                  marginBottom: '8px'
                }}>
                  ${portfolio?.balance?.toFixed(2) || '0.00'}
                </div>
                <div className="trade-muted" style={{ fontSize: '14px' }}>
                  Available for trading
                </div>
                {/* Persistent success indicator after a fill */}
                {lastFill && (
                  <div className="trade-success-chip" aria-live="polite">
                    <span aria-hidden="true">✓</span>
                    Last order filled:&nbsp;
                    {lastFill.type === 'buy' ? 'Bought' : 'Sold'} {lastFill.shares}{' '}
                    {lastFill.shares === 1 ? 'share' : 'shares'}
                    {lastFill.symbol ? ` of ${lastFill.symbol}` : ''} at{' '}
                    {lastFill.at.toLocaleTimeString()}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Portfolio */}
          <div className="trade-card">
            <h3 className="trade-heading" style={{ fontSize: '20px', marginBottom: '16px' }}>
              Portfolio
            </h3>
            {initialLoading ? (
              <div>
                <div className="trade-skeleton trade-skeleton--card" />
                <div className="trade-skeleton trade-skeleton--card" />
              </div>
            ) : !portfolio?.positions || portfolio.positions.length === 0 ? (
              <div className="trade-muted" style={{ textAlign: 'center', padding: '20px' }}>
                No positions yet
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {portfolio.positions.map((position, index) => (
                  <div key={index} className="trade-card--inset" style={{
                    padding: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'var(--trade-text)'
                      }}>
                        {position.symbol}
                      </div>
                      <div className="trade-muted" style={{ fontSize: '14px' }}>
                        {position.shares} shares
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div className="trade-muted" style={{ fontSize: '14px' }}>
                        Avg: ${(position.avgPrice ?? position.avgCost)?.toFixed(2) || '0.00'}
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'var(--trade-text)'
                      }}>
                        ${getPositionValue(position).currentValue?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Market Watch */}
          <div className="trade-card">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '8px'
            }}>
              <h3 className="trade-heading" style={{ fontSize: '20px' }}>
                Market Watch
              </h3>
              {marketIsDemo && <DemoPill />}
            </div>
            <div className="trade-muted" style={{ fontSize: '14px', marginBottom: '16px' }}>
              Last: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : new Date().toLocaleTimeString()}
            </div>
            {initialLoading ? (
              <div>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="trade-skeleton trade-skeleton--row" />
                ))}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {stocks.slice(0, 5).map((stock, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < Math.min(stocks.length, 5) - 1 ? '1px solid var(--trade-divider)' : 'none'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'var(--trade-text)'
                    }}>
                      {stock.symbol}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: 'var(--trade-text)'
                    }}>
                      ${stock.price?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success toast — persists ~6s so a fill is clearly visible */}
      {showSuccessToast && (
        <div className="trade-toast" role="status" aria-live="polite">
          <span className="trade-toast__icon" aria-hidden="true">✓</span>
          <span>
            Order executed successfully
            {lastFill?.symbol ? ` — ${lastFill.type === 'buy' ? 'bought' : 'sold'} ${lastFill.shares} ${lastFill.symbol}` : '!'}
          </span>
        </div>
      )}
    </div>
  );
}

export default Trade; 