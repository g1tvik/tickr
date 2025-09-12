import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import StockTicker from '../components/StockTicker';
import StockSearch from '../components/StockSearch';
import { SuperChart } from '../components/SuperChart';
import { useTrading } from '../hooks/useTrading';
import { getPositionValue, calculateOrderTotal } from '../utils/tradeUtils';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';
import { api } from '../services/api';
import { useNavbarBackground } from '../hooks/useNavbarBackground';

function Trade() {
  const location = useLocation();
  const { setNavbarBackground } = useNavbarBackground();
  
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
  } = useTrading();

  // Chart data state
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);
  const [timeframe, setTimeframe] = useState('1D');

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

    console.log('Trade: Setting up overscroll behavior for dark theme');
    
    // Get the current setNavbarBackground function
    const currentSetNavbarBackground = setNavbarBackground;

    const updateBackground = (useDarkColor) => {
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
      console.log('Trade: Navbar set to dark theme (var(--marbleDarkGray))');
      
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
        console.log('Trade: Overscroll detected, maintaining dark theme');
        updateBackground(true);
      }
    };
    
    // Handle touch events for mobile overscroll
    const handleTouchMove = (e) => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Check for overscroll
      const isOverscrollingTop = scrollPosition < 0;
      const isOverscrollingBottom = scrollPosition + windowHeight > documentHeight;
      
      if (isOverscrollingTop || isOverscrollingBottom) {
        console.log('Trade: Touch overscroll detected, maintaining dark theme');
        updateBackground(true);
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
      console.log('Trade: Cleanup - overscroll listeners removed');
    };
  }, [location.pathname]); // Remove setNavbarBackground from dependencies

  const loadChartData = async (symbol, tf) => {
    setChartLoading(true);
    setChartError(null);
    
    try {
      // Try to get data from API first
      const response = await api.getChartData(symbol, tf, 100);
      if (response.success) {
        setChartData(response.chartData);
      } else {
        // Fallback to mock data
        setChartData(generateMockChartData(symbol, tf));
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
      // Fallback to mock data
      setChartData(generateMockChartData(symbol, tf));
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

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    if (selectedStock?.symbol) {
      loadChartData(selectedStock.symbol, newTimeframe);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: marbleDarkGray,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: marbleDarkGray,
            marginBottom: '12px'
          }}>
            {error}
          </div>
          <div style={{
            fontSize: '16px',
            color: marbleGray
          }}>
            Please sign in to access the trading features.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-dark" style={{
      minHeight: '100vh',
      padding: '16px',
      fontFamily: fontBody
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '16px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Main Trading Area */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: marbleDarkGray,
                margin: 0,
                fontFamily: fontHeading
              }}>
                📈 Paper Trading
              </h1>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: marbleGray
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: marketStatus === 'open' ? '#22c55e' : '#ef4444'
                }}></div>
                <span>{marketStatus === 'open' ? 'Market Open' : 'Market Closed'}</span>
              </div>
            </div>
            <p style={{
              color: marbleGray,
              fontSize: '14px',
              margin: 0
            }}>
              Practice trading with virtual money. Real-time data powered by Alpaca API.
            </p>
            {lastUpdate && (
              <div style={{
                marginLeft: '12px',
                fontSize: '12px',
                opacity: 0.8,
                color: marbleGold
              }}>
                Last updated: {new Date(lastUpdate).toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Stock Search */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '16px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: marbleDarkGray,
              marginBottom: '16px',
              fontFamily: fontHeading
            }}>
              Search Stocks
            </h2>
            <StockSearch 
              onStockSelect={handleStockSelect}
              placeholder="Search by symbol or company name (e.g., AAPL, Apple, TSLA)..."
            />
          </div>

          {/* Chart and Trading Section */}
          {selectedStock && (
            <div style={{
              backgroundColor: marbleLightGray,
              borderRadius: '20px',
              padding: '16px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 280px',
                gap: '16px',
                alignItems: 'start'
              }}>
                {/* Chart */}
                <div>
                  <SuperChart
                    symbol={selectedStock.symbol}
                    initialInterval="1d"
                    theme="dark"
                    realtime={false}
                    height={400}
                    onChartReady={(chart) => {
                      console.log('SuperChart ready:', chart);
                    }}
                    onDataUpdate={(data) => {
                      console.log('Chart data updated:', data);
                    }}
                    onDrawingUpdate={(drawings) => {
                      console.log('Drawings updated:', drawings);
                    }}
                  />
                </div>

                {/* Trading Panel */}
                <div style={{
                  backgroundColor: marbleWhite,
                  borderRadius: '16px',
                  padding: '16px',
                  height: 'fit-content'
                }}>
                  {/* Stock Info */}
                  <div style={{
                    marginBottom: '20px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #e0e0e0'
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
                          color: marbleDarkGray
                        }}>
                          {selectedStock.symbol}
                        </div>
                        <div style={{
                          color: marbleGray,
                          fontSize: '12px'
                        }}>
                          {selectedStock.name}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: marbleDarkGray
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
                      <div style={{
                        color: marbleGray,
                        fontSize: '12px'
                      }}>
                        Volume: {selectedStock.volume.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Order Form */}
                  <div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '6px',
                        color: marbleDarkGray,
                        fontWeight: '500',
                        fontSize: '14px'
                      }}>
                        Order Type
                      </label>
                      <div style={{
                        display: 'flex',
                        gap: '6px'
                      }}>
                        <button
                          onClick={() => setOrderType('buy')}
                          style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '6px',
                            border: 'none',
                            color: 'white',
                            fontWeight: '500',
                            cursor: 'pointer',
                            backgroundColor: orderType === 'buy' ? '#22c55e' : marbleGray,
                            transition: 'opacity 0.2s',
                            fontSize: '14px'
                          }}
                        >
                          Buy
                        </button>
                        <button
                          onClick={() => setOrderType('sell')}
                          style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '6px',
                            border: 'none',
                            color: 'white',
                            fontWeight: '500',
                            cursor: 'pointer',
                            backgroundColor: orderType === 'sell' ? '#ef4444' : marbleGray,
                            transition: 'opacity 0.2s',
                            fontSize: '14px'
                          }}
                        >
                          Sell
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '6px',
                        color: marbleDarkGray,
                        fontWeight: '500',
                        fontSize: '14px'
                      }}>
                        Shares
                      </label>
                      <input
                        type="number"
                        value={shares}
                        onChange={(e) => setShares(parseInt(e.target.value) || 1)}
                        min="1"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '6px',
                          border: '2px solid #e0e0e0',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div style={{
                      padding: '12px',
                      backgroundColor: marbleLightGray,
                      borderRadius: '6px',
                      marginBottom: '16px',
                      fontSize: '12px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px'
                      }}>
                        <span style={{ color: marbleGray }}>Price per share</span>
                        <span style={{ fontWeight: '500' }}>${selectedStock.price?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px'
                      }}>
                        <span style={{ color: marbleGray }}>Number of shares</span>
                        <span style={{ fontWeight: '500' }}>{shares}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderTop: '1px solid #e0e0e0',
                        paddingTop: '4px',
                        marginBottom: 0,
                        fontWeight: 'bold'
                      }}>
                        <span style={{ color: marbleDarkGray }}>Total</span>
                        <span style={{ color: marbleDarkGray }}>
                          ${calculateOrderTotal(selectedStock, shares).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
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
                          e.target.style.transform = 'scale(1.02)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      {isLoading ? 'Processing...' : `${orderType === 'buy' ? 'Buy' : 'Sell'} ${shares} ${shares === 1 ? 'Share' : 'Shares'}`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Confirmation */}
          {showOrderConfirmation && (
            <div style={{
              backgroundColor: '#22c55e',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              Order executed successfully!
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Account Balance */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '16px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: marbleDarkGray,
              marginBottom: '16px',
              fontFamily: fontHeading
            }}>
              Account Balance
            </h3>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: marbleDarkGray,
              marginBottom: '8px'
            }}>
              ${portfolio?.balance?.toFixed(2) || '0.00'}
            </div>
            <div style={{
              color: marbleGray,
              fontSize: '14px'
            }}>
              Available for trading
            </div>
          </div>

          {/* Portfolio */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '16px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: marbleDarkGray,
              marginBottom: '16px',
              fontFamily: fontHeading
            }}>
              Portfolio
            </h3>
            {!portfolio?.positions || portfolio.positions.length === 0 ? (
              <div style={{
                color: marbleGray,
                textAlign: 'center',
                padding: '20px'
              }}>
                No positions yet
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {portfolio.positions.map((position, index) => (
                  <div key={index} style={{
                    backgroundColor: marbleWhite,
                    borderRadius: '12px',
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
                        color: marbleDarkGray
                      }}>
                        {position.symbol}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: marbleGray
                      }}>
                        {position.shares} shares
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        color: marbleGray
                      }}>
                        Avg: ${position.averagePrice?.toFixed(2)}
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: marbleDarkGray
                      }}>
                        ${getPositionValue(position).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Market Watch */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '16px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: marbleDarkGray,
              marginBottom: '16px',
              fontFamily: fontHeading
            }}>
              Market Watch
            </h3>
            <div style={{
              color: marbleGray,
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              Last: {new Date().toLocaleTimeString()}
            </div>
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
                  borderBottom: index < stocks.length - 1 ? '1px solid #e0e0e0' : 'none'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: marbleDarkGray
                  }}>
                    {stock.symbol}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: marbleDarkGray
                  }}>
                    ${stock.price?.toFixed(2) || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Trade; 