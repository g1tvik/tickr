import React, { useState, useEffect } from 'react';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';
import StockTicker from '../components/StockTicker';

// Mock stock data - replace with real API calls
const mockStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: 2.15, changePercent: 1.24 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.56, change: -1.23, changePercent: -0.85 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.85, change: 5.67, changePercent: 1.52 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', price: 248.42, change: -3.21, changePercent: -1.28 },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 145.24, change: 1.89, changePercent: 1.32 },
];

const mockPortfolio = {
  balance: 10000,
  positions: [
    { symbol: 'AAPL', shares: 10, avgPrice: 170.00, currentPrice: 175.43 },
    { symbol: 'GOOGL', shares: 5, avgPrice: 145.00, currentPrice: 142.56 },
  ]
};

function Trade() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [orderType, setOrderType] = useState('buy');
  const [shares, setShares] = useState(1);
  const [portfolio, setPortfolio] = useState(mockPortfolio);
  const [stocks, setStocks] = useState(mockStocks);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);

  const filteredStocks = stocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
    setSearchTerm('');
  };

  const calculateOrderTotal = () => {
    if (!selectedStock) return 0;
    return selectedStock.price * shares;
  };

  const handleOrderSubmit = () => {
    if (orderType === 'buy') {
      const total = calculateOrderTotal();
      if (total > portfolio.balance) {
        alert('Insufficient funds!');
        return;
      }
      
      // Update portfolio
      setPortfolio(prev => ({
        ...prev,
        balance: prev.balance - total,
        positions: [...prev.positions, {
          symbol: selectedStock.symbol,
          shares: shares,
          avgPrice: selectedStock.price,
          currentPrice: selectedStock.price
        }]
      }));
    } else {
      // Sell logic
      const position = portfolio.positions.find(p => p.symbol === selectedStock.symbol);
      if (!position || position.shares < shares) {
        alert('Insufficient shares!');
        return;
      }
      
      const total = calculateOrderTotal();
      setPortfolio(prev => ({
        ...prev,
        balance: prev.balance + total,
        positions: prev.positions.map(p => 
          p.symbol === selectedStock.symbol 
            ? { ...p, shares: p.shares - shares }
            : p
        ).filter(p => p.shares > 0)
      }));
    }
    
    setShowOrderConfirmation(true);
    setTimeout(() => setShowOrderConfirmation(false), 3000);
    setSelectedStock(null);
    setShares(1);
  };

  const getPositionValue = (position) => {
    const currentValue = position.shares * position.currentPrice;
    const costBasis = position.shares * position.avgPrice;
    const pnl = currentValue - costBasis;
    const pnlPercent = (pnl / costBasis) * 100;
    return { currentValue, pnl, pnlPercent };
  };

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
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: marbleDarkGray,
              marginBottom: '8px',
              fontFamily: fontHeading
            }}>
              Paper Trading
            </h1>
            <p style={{
              color: marbleGray,
              fontSize: '16px'
            }}>
              Practice trading with virtual money. No real money at risk!
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
            <input
              type="text"
              placeholder="Search by symbol or company name..."
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
            
            {searchTerm && (
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: marbleWhite,
                borderRadius: '12px',
                border: '1px solid #e0e0e0'
              }}>
                {filteredStocks.map((stock) => (
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
                        color: marbleDarkGray,
                        fontSize: '16px'
                      }}>
                        {stock.symbol}
                      </div>
                      <div style={{
                        color: marbleGray,
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
                        ${stock.price.toFixed(2)}
                      </div>
                      <div style={{
                        color: stock.change >= 0 ? '#22c55e' : '#ef4444',
                        fontSize: '14px'
                      }}>
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                ))}
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
                        {selectedStock.name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '28px',
                        fontWeight: 'bold',
                        color: marbleDarkGray
                      }}>
                        ${selectedStock.price.toFixed(2)}
                      </div>
                      <div style={{
                        color: selectedStock.change >= 0 ? '#22c55e' : '#ef4444',
                        fontSize: '16px'
                      }}>
                        {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)} ({selectedStock.changePercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
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
                          backgroundColor: orderType === 'buy' ? '#22c55e' : marbleGray,
                          color: 'white',
                          fontWeight: '500',
                          cursor: 'pointer'
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
                          backgroundColor: orderType === 'sell' ? '#ef4444' : marbleGray,
                          color: 'white',
                          fontWeight: '500',
                          cursor: 'pointer'
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
                      <span style={{ color: marbleGray }}>Price per share:</span>
                      <span style={{ fontWeight: '500' }}>${selectedStock.price.toFixed(2)}</span>
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
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: marbleGold,
                      color: marbleDarkGray,
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    {orderType === 'buy' ? 'Buy' : 'Sell'} {shares} Share{shares > 1 ? 's' : ''}
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
            
            {portfolio.positions.length === 0 ? (
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
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: marbleDarkGray,
              marginBottom: '16px',
              fontFamily: fontHeading
            }}>
              Market Watch
            </h2>
            <StockTicker stocks={stocks} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Trade; 