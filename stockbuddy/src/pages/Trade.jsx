import React from 'react';
import StockTicker from '../components/StockTicker';
import StockSearch from '../components/StockSearch';
import { useTrading } from '../hooks/useTrading';
import { getPositionValue, calculateOrderTotal } from '../utils/tradeUtils';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';

function Trade() {
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

  // Show loading state while checking authentication
  if (!isAuthenticated && !error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: marbleWhite,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '18px',
            color: marbleGray,
            fontWeight: '500'
          }}>
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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#222222',
      padding: '24px',
      fontFamily: fontBody
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 350px',
        gap: '24px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Main Trading Area */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '24px'
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
            <StockSearch 
              onStockSelect={handleStockSelect}
              placeholder="Search by symbol or company name (e.g., AAPL, Apple, TSLA)..."
            />
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
                marginBottom: '16px',
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
                        {selectedStock.name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '28px',
                        fontWeight: 'bold',
                        color: marbleDarkGray
                      }}>
                        ${selectedStock.price?.toFixed(2) || 'N/A'}
                      </div>
                      <div style={{
                        fontSize: '16px',
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
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '8px',
                          border: 'none',
                          color: 'white',
                          fontWeight: '500',
                          cursor: 'pointer',
                          backgroundColor: orderType === 'buy' ? '#22c55e' : marbleGray,
                          transition: 'opacity 0.2s'
                        }}
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => setOrderType('sell')}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '8px',
                          border: 'none',
                          color: 'white',
                          fontWeight: '500',
                          cursor: 'pointer',
                          backgroundColor: orderType === 'sell' ? '#ef4444' : marbleGray,
                          transition: 'opacity 0.2s'
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
                      value={shares}
                      onChange={(e) => setShares(parseInt(e.target.value) || 1)}
                      min="1"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        fontSize: '16px'
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
                      <span style={{ color: marbleGray }}>Price per share</span>
                      <span style={{ fontWeight: '500' }}>${selectedStock.price?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <span style={{ color: marbleGray }}>Number of shares</span>
                      <span style={{ fontWeight: '500' }}>{shares}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #e0e0e0',
                      paddingTop: '8px',
                      marginBottom: 0
                    }}>
                      <span style={{ fontWeight: 'bold', color: marbleDarkGray }}>Total</span>
                      <span style={{ fontWeight: 'bold', color: marbleDarkGray }}>
                        ${calculateOrderTotal(selectedStock, shares).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleOrderSubmit}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: marbleGold,
                      color: marbleDarkGray,
                      fontSize: '16px',
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
          gap: '24px'
        }}>
          {/* Account Balance */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '24px'
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
            padding: '24px'
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
                      <span style={{
                        fontWeight: 'bold',
                        color: marbleDarkGray
                      }}>
                        {position.symbol}
                      </span>
                      <span style={{
                        fontWeight: '500',
                        color: position.changePercent && parseFloat(position.changePercent) >= 0 ? '#22c55e' : '#ef4444'
                      }}>
                        {position.changePercent && position.changePercent !== 'N/A' ? 
                          `${parseFloat(position.changePercent) >= 0 ? '+' : ''}${position.changePercent}%` : 
                          'N/A'
                        }
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '14px',
                      color: marbleGray
                    }}>
                      <span>{position.shares} {position.shares === 1 ? 'share' : 'shares'}</span>
                      <span>${getPositionValue(position).currentValue.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
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
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: marbleDarkGray,
                margin: 0,
                fontFamily: fontHeading
              }}>
                Market Watch
              </h3>
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
                    Last: {new Date(lastUpdate).toLocaleTimeString()}
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
                    fontFamily: fontBody,
                    opacity: isLoading ? 0.6 : 1
                  }}
                >
                  Refresh
                </button>
              </div>
            </div>
            {stocks.length > 0 && <StockTicker stocks={stocks} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Trade; 