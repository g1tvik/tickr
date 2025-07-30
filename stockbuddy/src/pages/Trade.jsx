import React, { useState, useEffect } from 'react';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';
import StockTicker from '../components/StockTicker';
import { api } from '../services/api';

function Trade() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [orderType, setOrderType] = useState('buy');
  const [shares, setShares] = useState(1);
  const [portfolio, setPortfolio] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [marketStatus, setMarketStatus] = useState('loading');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      loadPortfolio();
      loadMarketData();
      checkMarketStatus();
    } else {
      setError('Please sign in to access trading features');
    }
  }, []);

  // Auto-refresh portfolio and selected stock every 60 seconds to stay within API limits
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      loadPortfolio();
      if (selectedStock) {
        updateSelectedStockPrice();
      }
    }, 60000); // Refresh every 60 seconds to stay within 200 calls/min limit

    return () => clearInterval(interval);
  }, [selectedStock, isAuthenticated]);

  // Search stocks when search term changes
  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchStocks();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const loadPortfolio = async () => {
    try {
      const response = await api.getPortfolio();
      if (response.success) {
        setPortfolio(response.portfolio);
      } else {
        setError('Failed to load portfolio');
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
      setError('Failed to load portfolio. Please check your connection.');
    }
  };

  const loadMarketData = async () => {
    try {
      const response = await api.getMarketData();
      if (response.success) {
        setStocks(response.marketData);
        setLastUpdate(new Date());
        setError(null); // Clear any previous errors
      } else {
        setError('Failed to load market data');
      }
    } catch (error) {
      console.error('Error loading market data:', error);
      setError('Failed to load market data. Please check your connection.');
    }
  };

  const checkMarketStatus = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Check if it's a weekday (Monday = 1, Sunday = 0)
    if (day === 0 || day === 6) {
      setMarketStatus('closed');
      return;
    }
    
    // Check if it's during market hours (9:30 AM - 4:00 PM ET)
    // Note: This is a simplified check. In production, you'd want to account for timezone
    const marketOpen = 9 * 60 + 30; // 9:30 AM in minutes
    const marketClose = 16 * 60; // 4:00 PM in minutes
    const currentTime = hour * 60 + minute;
    
    if (currentTime >= marketOpen && currentTime <= marketClose) {
      setMarketStatus('open');
    } else {
      setMarketStatus('closed');
    }
  };

  const searchStocks = async () => {
    if (searchTerm.length < 2) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await api.searchStocks(searchTerm);
      if (response.success) {
        setSearchResults(response.results);
      } else {
        setError('Failed to search stocks');
      }
    } catch (error) {
      console.error('Error searching stocks:', error);
      setError('Failed to search stocks. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const updateSelectedStockPrice = async () => {
    if (!selectedStock) return;
    
    try {
      const response = await api.getStockQuote(selectedStock.symbol);
      if (response.success) {
        setSelectedStock(response.quote);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error updating stock price:', error);
    }
  };

  const handleStockSelect = async (stock) => {
    setIsLoading(true);
    try {
      // Get real-time quote for the selected stock
      const response = await api.getStockQuote(stock.symbol);
      if (response.success) {
        setSelectedStock(response.quote);
        setLastUpdate(new Date());
      } else {
        setSelectedStock(stock);
      }
    } catch (error) {
      console.error('Error getting stock quote:', error);
      setSelectedStock(stock);
    } finally {
      setIsLoading(false);
      setSearchTerm('');
      setSearchResults([]);
    }
  };

  const calculateOrderTotal = () => {
    if (!selectedStock) return 0;
    return selectedStock.price * shares;
  };

  const handleOrderSubmit = async () => {
    if (!selectedStock) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = orderType === 'buy' 
        ? await api.buyStock(selectedStock.symbol, shares)
        : await api.sellStock(selectedStock.symbol, shares);
      
      if (response.success) {
        setPortfolio(response.portfolio);
        setShowOrderConfirmation(true);
        setTimeout(() => setShowOrderConfirmation(false), 3000);
        setSelectedStock(null);
        setShares(1);
      } else {
        setError(response.message || 'Order failed');
      }
    } catch (error) {
      console.error('Error executing order:', error);
      setError('Failed to execute order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionValue = (position) => {
    const currentValue = position.shares * position.currentPrice;
    const costBasis = position.shares * position.avgPrice;
    const pnl = currentValue - costBasis;
    const pnlPercent = (pnl / costBasis) * 100;
    return { currentValue, pnl, pnlPercent };
  };

  const getMarketStatusColor = () => {
    return marketStatus === 'open' ? '#22c55e' : '#ef4444';
  };

  const getMarketStatusText = () => {
    return marketStatus === 'open' ? 'Market Open' : 'Market Closed';
  };

  // Show loading state while checking authentication
  if (!isAuthenticated && !error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: marbleWhite,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fontBody
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: marbleDarkGray, marginBottom: '16px' }}>
            Loading Trading Interface...
          </div>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (!isAuthenticated && error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: marbleWhite,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fontBody
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: '#ef4444', marginBottom: '16px' }}>
            {error}
          </div>
          <div style={{ color: marbleGray }}>
            Please sign in to access the trading features.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: marbleWhite,
      padding: '24px',
      fontFamily: fontBody
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '24px'
      }}>
        {/* Main Trading Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: marbleDarkGray,
                fontFamily: fontHeading
              }}>
                📈 Paper Trading
              </h1>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: marbleWhite,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: getMarketStatusColor()
                }}></div>
                {getMarketStatusText()}
              </div>
            </div>
            <p style={{
              color: marbleGray,
              fontSize: '16px'
            }}>
              💰 Practice trading with virtual money. Real-time data powered by Alpaca API.
              {lastUpdate && (
                <span style={{ 
                  fontSize: '12px', 
                  color: '#22c55e',
                  marginLeft: '8px',
                  fontWeight: '500'
                }}>
                  🔄 Last updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>

          {/* Stock Search */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '24px'
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
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by symbol or company name (e.g., AAPL, Apple, TSLA)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid transparent',
                  fontSize: '16px',
                  backgroundColor: marbleWhite,
                  color: marbleDarkGray,
                  marginBottom: '16px'
                }}
              />
              {isSearching && (
                <div style={{
                  position: 'absolute',
                  right: '20px',
                  top: '12px',
                  color: marbleGray
                }}>
                  Searching...
                </div>
              )}
            </div>
            
            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            
            {searchResults.length > 0 && (
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: marbleWhite,
                borderRadius: '12px',
                border: '1px solid #e0e0e0'
              }}>
                {searchResults.map((stock) => {
                  const isPositive = stock.change >= 0;
                  return (
                    <div
                      key={stock.symbol}
                      onClick={() => handleStockSelect(stock)}
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f8f8'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <div>
                        <div style={{
                          fontWeight: 'bold',
                          color: isPositive ? marbleGold : marbleGray,
                          fontSize: '16px'
                        }}>
                          {stock.symbol}
                        </div>
                        <div style={{
                          color: marbleDarkGray,
                          fontSize: '14px'
                        }}>
                          {stock.name}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontWeight: 'bold',
                          color: marbleDarkGray,
                          fontSize: '16px'
                        }}>
                          ${stock.price ? stock.price.toFixed(2) : 'Loading...'}
                        </div>
                        {stock.change !== undefined && stock.changePercent !== undefined && stock.price && (
                          <div style={{
                            color: isPositive ? marbleGold : marbleGray,
                            fontSize: '14px'
                          }}>
                            {isPositive ? '+' : ''}{parseFloat(stock.change).toFixed(2)} ({parseFloat(stock.changePercent).toFixed(2)}%)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
              <div style={{
                textAlign: 'center',
                color: marbleGray,
                padding: '20px',
                fontSize: '14px'
              }}>
                No stocks found. Try a different search term.
              </div>
            )}
          </div>

          {/* Trading Interface */}
          {selectedStock && (
            <div style={{
              backgroundColor: marbleLightGray,
              borderRadius: '20px',
              padding: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: marbleDarkGray,
                marginBottom: '20px',
                fontFamily: fontHeading
              }}>
                Place Order
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                marginBottom: '24px'
              }}>
                {/* Stock Info */}
                <div style={{
                  backgroundColor: marbleWhite,
                  borderRadius: '16px',
                  padding: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: marbleDarkGray
                      }}>
                        {selectedStock.symbol}
                      </div>
                      <div style={{
                        color: marbleGray,
                        fontSize: '14px'
                      }}>
                        {selectedStock.name || 'Loading...'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '28px',
                        fontWeight: 'bold',
                        color: marbleDarkGray
                      }}>
                        ${selectedStock.price ? selectedStock.price.toFixed(2) : 'Loading...'}
                      </div>
                      {selectedStock.change !== undefined && selectedStock.changePercent !== undefined && selectedStock.price && (
                        <div style={{
                          color: selectedStock.change >= 0 ? '#22c55e' : '#ef4444',
                          fontSize: '16px'
                        }}>
                          {selectedStock.change >= 0 ? '+' : ''}{parseFloat(selectedStock.change).toFixed(2)} ({parseFloat(selectedStock.changePercent).toFixed(2)}%)
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedStock.volume && (
                    <div style={{
                      color: marbleGray,
                      fontSize: '14px'
                    }}>
                      Volume: {selectedStock.volume.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Order Form */}
                <div style={{
                  backgroundColor: marbleWhite,
                  borderRadius: '16px',
                  padding: '20px'
                }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: marbleDarkGray,
                      fontWeight: '500'
                    }}>
                      Order Type
                    </label>
                    <div style={{
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <button
                        onClick={() => setOrderType('buy')}
                        disabled={isLoading}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: orderType === 'buy' ? '#22c55e' : marbleGray,
                          color: 'white',
                          fontWeight: '500',
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          opacity: isLoading ? 0.6 : 1
                        }}
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => setOrderType('sell')}
                        disabled={isLoading}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: orderType === 'sell' ? '#ef4444' : marbleGray,
                          color: 'white',
                          fontWeight: '500',
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          opacity: isLoading ? 0.6 : 1
                        }}
                      >
                        Sell
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: marbleDarkGray,
                      fontWeight: '500'
                    }}>
                      Shares
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={shares}
                      onChange={(e) => setShares(parseInt(e.target.value) || 1)}
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        fontSize: '16px',
                        opacity: isLoading ? 0.6 : 1
                      }}
                    />
                  </div>

                  <div style={{
                    padding: '16px',
                    backgroundColor: marbleLightGray,
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <span style={{ color: marbleGray }}>Price per share:</span>
                      <span style={{ fontWeight: '500' }}>${selectedStock.price ? selectedStock.price.toFixed(2) : 'Loading...'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <span style={{ color: marbleGray }}>Shares:</span>
                      <span style={{ fontWeight: '500' }}>{shares}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #e0e0e0',
                      paddingTop: '8px'
                    }}>
                      <span style={{ fontWeight: 'bold', color: marbleDarkGray }}>Total:</span>
                      <span style={{ fontWeight: 'bold', color: marbleDarkGray }}>${calculateOrderTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleOrderSubmit}
                    disabled={isLoading || !selectedStock.price}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: isLoading ? marbleGray : marbleGold,
                      color: marbleDarkGray,
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      transition: 'transform 0.2s',
                      opacity: isLoading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => !isLoading && (e.target.style.transform = 'scale(1.02)')}
                    onMouseLeave={(e) => !isLoading && (e.target.style.transform = 'scale(1)')}
                  >
                    {isLoading ? 'Processing...' : `${orderType === 'buy' ? 'Buy' : 'Sell'} ${shares} Share${shares > 1 ? 's' : ''}`}
                  </button>
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
              Order executed successfully! Check your portfolio for updates.
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Account Balance */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '24px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: marbleDarkGray,
              marginBottom: '16px',
              fontFamily: fontHeading
            }}>
              Account Balance
            </h2>
            {portfolio ? (
              <>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: marbleDarkGray,
                  marginBottom: '8px'
                }}>
                  ${portfolio.balance.toFixed(2)}
                </div>
                <div style={{
                  color: marbleGray,
                  fontSize: '14px'
                }}>
                  Available for trading
                </div>
              </>
            ) : (
              <div style={{
                color: marbleGray,
                fontSize: '14px'
              }}>
                Loading balance...
              </div>
            )}
          </div>

          {/* Portfolio */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '24px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: marbleDarkGray,
              marginBottom: '16px',
              fontFamily: fontHeading
            }}>
              Portfolio
            </h2>
            
            {!portfolio ? (
              <div style={{
                color: marbleGray,
                textAlign: 'center',
                padding: '20px'
              }}>
                Loading portfolio...
              </div>
            ) : portfolio.positions.length === 0 ? (
              <div style={{
                color: marbleGray,
                textAlign: 'center',
                padding: '20px'
              }}>
                No positions yet. Start trading to build your portfolio!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {portfolio.positions.map((position) => {
                  const { currentValue, pnl, pnlPercent } = getPositionValue(position);
                  return (
                    <div key={position.symbol} style={{
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
                          fontWeight: 'bold',
                          color: marbleDarkGray
                        }}>
                          {position.symbol}
                        </div>
                        <div style={{
                          color: pnl >= 0 ? '#22c55e' : '#ef4444',
                          fontWeight: '500'
                        }}>
                          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} ({pnlPercent.toFixed(2)}%)
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '14px',
                        color: marbleGray
                      }}>
                        <span>{position.shares} shares</span>
                        <span>${currentValue.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Market Ticker */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: marbleDarkGray,
                fontFamily: fontHeading,
                margin: 0
              }}>
                Market Watch
              </h2>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {lastUpdate && (
                  <span style={{
                    fontSize: '12px',
                    color: marbleGray
                  }}>
                    Last: {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={loadMarketData}
                  disabled={isLoading}
                  style={{
                    backgroundColor: marbleGold,
                    color: marbleWhite,
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                    fontFamily: fontBody
                  }}
                >
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
            {stocks.length > 0 ? (
              <StockTicker stocks={stocks} />
            ) : (
              <div style={{
                color: marbleGray,
                textAlign: 'center',
                padding: '20px'
              }}>
                Loading market data...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Trade; 