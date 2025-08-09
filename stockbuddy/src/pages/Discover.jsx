import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';

const AITradingCoach = () => {
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [currentPrice, setCurrentPrice] = useState(150.25);
  const [priceChange, setPriceChange] = useState(2.15);
  const [priceChangePercent, setPriceChangePercent] = useState(1.45);
  const [aiInsights, setAiInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('coach');
  const [marketSentiment, setMarketSentiment] = useState('bullish');
  const [riskLevel, setRiskLevel] = useState('moderate');
  const [tradingStrategy, setTradingStrategy] = useState('swing');
  
  const chatEndRef = useRef(null);

  // Mock AI insights
  const mockInsights = [
    {
      id: 1,
      type: 'analysis',
      title: 'Technical Analysis',
      content: 'AAPL is showing strong support at $148.50 with RSI indicating oversold conditions. Consider a buy position with stop loss at $145.',
      confidence: 85,
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      type: 'news',
      title: 'Market News Impact',
      content: 'Recent earnings beat expectations by 12%. This positive surprise could drive the stock higher in the next 2-3 weeks.',
      confidence: 78,
      timestamp: new Date().toISOString()
    },
    {
      id: 3,
      type: 'strategy',
      title: 'Trading Strategy',
      content: 'Consider a covered call strategy with $155 strike price expiring in 30 days. This provides income while limiting upside risk.',
      confidence: 92,
      timestamp: new Date().toISOString()
    }
  ];

  // Mock chat responses
  const mockResponses = [
    "Based on the current market conditions, I'd recommend a conservative approach. The stock shows strong fundamentals but market volatility is high.",
    "Looking at the technical indicators, there's a potential breakout pattern forming. Consider setting a buy order at $149.50 with a stop loss at $147.",
    "The volume analysis suggests institutional buying. This could be a good entry point for a swing trade position.",
    "I notice you're asking about risk management. Always remember the 2% rule - never risk more than 2% of your portfolio on a single trade."
  ];

  useEffect(() => {
    setAiInsights(mockInsights);
    // Simulate real-time price updates
    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 2;
      setCurrentPrice(prev => {
        const newPrice = prev + change;
        setPriceChange(change);
        setPriceChangePercent((change / prev) * 100);
        return newPrice;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = () => {
    if (!userMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, newMessage]);
    setUserMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: mockResponses[Math.floor(Math.random() * mockResponses.length)],
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'bullish': return '#22c55e';
      case 'bearish': return '#ef4444';
      case 'neutral': return '#f59e0b';
      default: return marbleGray;
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return '#22c55e';
      case 'moderate': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return marbleGray;
    }
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
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: marbleDarkGray,
            fontFamily: fontHeading,
            marginBottom: '16px'
          }}>
            🤖 AI Trading Coach
          </h1>
          <p style={{
            fontSize: '18px',
            color: marbleGray,
            marginBottom: '24px'
          }}>
            Your personal AI assistant for smarter trading decisions
          </p>

          {/* Stock Selector */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: `2px solid ${marbleLightGray}`,
                backgroundColor: marbleWhite,
                color: marbleDarkGray,
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <option value="AAPL">AAPL - Apple Inc.</option>
              <option value="TSLA">TSLA - Tesla Inc.</option>
              <option value="MSFT">MSFT - Microsoft Corp.</option>
              <option value="GOOGL">GOOGL - Alphabet Inc.</option>
              <option value="AMZN">AMZN - Amazon.com Inc.</option>
            </select>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: marbleLightGray,
              borderRadius: '12px'
            }}>
              <span style={{ fontSize: '18px', fontWeight: '600', color: marbleDarkGray }}>
                ${currentPrice.toFixed(2)}
              </span>
              <span style={{
                color: priceChange >= 0 ? '#22c55e' : '#ef4444',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          justifyContent: 'center'
        }}>
          {[
            { id: 'coach', label: 'AI Coach', icon: '🤖' },
            { id: 'analysis', label: 'Market Analysis', icon: '📊' },
            { id: 'education', label: 'Learning', icon: '📚' },
            { id: 'portfolio', label: 'Portfolio', icon: '💼' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? marbleGold : marbleLightGray,
                color: activeTab === tab.id ? marbleDarkGray : marbleDarkGray,
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '32px',
          minHeight: '600px'
        }}>
          {/* Left Panel */}
        <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {activeTab === 'coach' && (
              <>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: marbleDarkGray,
                  marginBottom: '20px',
            fontFamily: fontHeading
          }}>
                  Chat with AI Coach
          </h2>
                
                {/* Chat Messages */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  marginBottom: '20px',
                  padding: '16px',
                  backgroundColor: marbleWhite,
                  borderRadius: '12px',
                  minHeight: '400px'
                }}>
                  {chatHistory.length === 0 && (
          <div style={{
                      textAlign: 'center',
                      color: marbleGray,
                      padding: '40px 20px'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
                      <p>Ask me anything about trading, market analysis, or investment strategies!</p>
                    </div>
                  )}
                  
                  {chatHistory.map((message) => (
                    <div
                      key={message.id}
                style={{
                        marginBottom: '16px',
                        display: 'flex',
                        justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
                      }}
              >
                <div style={{
                        maxWidth: '70%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: message.type === 'user' ? marbleGold : marbleWhite,
                        color: message.type === 'user' ? marbleDarkGray : marbleDarkGray,
                        fontSize: '14px',
                        lineHeight: '1.4'
                      }}>
                        {message.content}
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                  marginBottom: '16px'
                }}>
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: marbleWhite,
                        color: marbleGray,
                        fontSize: '14px'
                      }}>
                        AI is thinking...
                      </div>
                    </div>
                  )}
                  
                  <div ref={chatEndRef} />
                </div>
                
                {/* Message Input */}
                <div style={{
                  display: 'flex',
                  gap: '12px'
                }}>
                  <textarea
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask your AI coach about trading strategies, market analysis, or investment advice..."
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: `2px solid ${marbleLightGray}`,
                      backgroundColor: marbleWhite,
                      color: marbleDarkGray,
                      fontSize: '14px',
                      resize: 'none',
                      minHeight: '50px',
                      outline: 'none',
                      fontFamily: fontBody
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!userMessage.trim() || isLoading}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: marbleGold,
                      color: marbleDarkGray,
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: userMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
                      opacity: userMessage.trim() && !isLoading ? 1 : 0.6
                    }}
                  >
                    Send
                  </button>
                </div>
              </>
            )}

            {activeTab === 'analysis' && (
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: marbleDarkGray,
                  marginBottom: '20px',
                  fontFamily: fontHeading
                }}>
                  Market Analysis
                </h2>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    backgroundColor: marbleWhite,
                    padding: '16px',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📈</div>
                    <div style={{ fontSize: '14px', color: marbleGray, marginBottom: '4px' }}>Sentiment</div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: getSentimentColor(marketSentiment)
                    }}>
                      {marketSentiment.toUpperCase()}
                    </div>
                  </div>
                  
                  <div style={{
                    backgroundColor: marbleWhite,
                    padding: '16px',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
                    <div style={{ fontSize: '14px', color: marbleGray, marginBottom: '4px' }}>Risk Level</div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: getRiskColor(riskLevel)
                    }}>
                      {riskLevel.toUpperCase()}
                    </div>
                  </div>
                  
                  <div style={{
                    backgroundColor: marbleWhite,
                    padding: '16px',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
                    <div style={{ fontSize: '14px', color: marbleGray, marginBottom: '4px' }}>Strategy</div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: marbleDarkGray
                    }}>
                      {tradingStrategy.toUpperCase()}
                    </div>
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: marbleWhite,
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '20px'
                }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                    color: marbleDarkGray,
                    marginBottom: '12px'
                }}>
                    Technical Indicators
                </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px'
                  }}>
                    {[
                      { name: 'RSI', value: '32', status: 'Oversold' },
                      { name: 'MACD', value: '0.15', status: 'Bullish' },
                      { name: 'MA 50', value: '$152.30', status: 'Above' },
                      { name: 'Volume', value: '2.1M', status: 'High' }
                    ].map(indicator => (
                      <div key={indicator.name} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: `1px solid ${marbleLightGray}`
                      }}>
                        <span style={{ fontSize: '14px', color: marbleDarkGray }}>{indicator.name}</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: marbleDarkGray }}>
                            {indicator.value}
                          </div>
                          <div style={{ fontSize: '12px', color: marbleGray }}>
                            {indicator.status}
                          </div>
                        </div>
              </div>
            ))}
          </div>
        </div>
              </div>
            )}

            {activeTab === 'education' && (
        <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: marbleDarkGray,
                  marginBottom: '20px',
              fontFamily: fontHeading
            }}>
                  Trading Education
            </h2>

                <div style={{
                  display: 'grid',
                  gap: '16px'
                }}>
                  {[
                    {
                      title: 'Understanding Technical Analysis',
                      description: 'Learn how to read charts and identify patterns',
                      duration: '15 min',
                      level: 'Beginner',
                      icon: '📊'
                    },
                    {
                      title: 'Risk Management Strategies',
                      description: 'Protect your capital with proper position sizing',
                      duration: '20 min',
                      level: 'Intermediate',
                      icon: '🛡️'
                    },
                    {
                      title: 'Options Trading Basics',
                      description: 'Introduction to options strategies and Greeks',
                      duration: '25 min',
                      level: 'Advanced',
                      icon: '📈'
                    }
                  ].map((course, index) => (
                    <div key={index} style={{
                      backgroundColor: marbleWhite,
                      padding: '20px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                      border: `2px solid ${marbleLightGray}`
                    }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
                        gap: '16px'
                      }}>
                        <div style={{ fontSize: '32px' }}>{course.icon}</div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: marbleDarkGray,
                            marginBottom: '4px'
                          }}>
                            {course.title}
                          </h3>
                          <p style={{
                  fontSize: '14px',
                            color: marbleGray,
                            marginBottom: '8px'
                          }}>
                            {course.description}
                          </p>
                <div style={{
                  display: 'flex',
                            gap: '12px',
                            fontSize: '12px'
                          }}>
                            <span style={{
                              backgroundColor: marbleLightGray,
                              padding: '4px 8px',
                              borderRadius: '6px',
                              color: marbleDarkGray
                            }}>
                              {course.duration}
                            </span>
                            <span style={{
                              backgroundColor: course.level === 'Beginner' ? '#22c55e' : 
                                           course.level === 'Intermediate' ? '#f59e0b' : '#ef4444',
                              padding: '4px 8px',
                              borderRadius: '6px',
                        color: marbleWhite
                      }}>
                              {course.level}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                      </div>
                    )}

            {activeTab === 'portfolio' && (
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: marbleDarkGray,
                  marginBottom: '20px',
                  fontFamily: fontHeading
                }}>
                  Portfolio Overview
                </h2>
                
                    <div style={{
                      backgroundColor: marbleWhite,
                  padding: '20px',
                      borderRadius: '12px',
                  marginBottom: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: marbleDarkGray
                    }}>
                      Total Value
                    </h3>
                      <span style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#22c55e'
                      }}>
                      $25,430.50
                      </span>
                    </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', color: marbleGray, marginBottom: '4px' }}>Today's P&L</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>+$342.15</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', color: marbleGray, marginBottom: '4px' }}>Total Return</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>+12.4%</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', color: marbleGray, marginBottom: '4px' }}>Positions</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: marbleDarkGray }}>8</div>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: marbleWhite,
                  padding: '20px',
                  borderRadius: '12px'
                }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: marbleDarkGray,
                    marginBottom: '16px'
                    }}>
                    Top Holdings
                    </h3>

                  <div style={{
                    display: 'grid',
                    gap: '12px'
                  }}>
                    {[
                      { symbol: 'AAPL', shares: 15, value: 2250, change: 2.3 },
                      { symbol: 'TSLA', shares: 8, value: 1840, change: -1.2 },
                      { symbol: 'MSFT', shares: 12, value: 4320, change: 1.8 }
                    ].map(holding => (
                      <div key={holding.symbol} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: `1px solid ${marbleLightGray}`
                      }}>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: marbleDarkGray }}>
                            {holding.symbol}
                          </div>
                          <div style={{ fontSize: '12px', color: marbleGray }}>
                            {holding.shares} shares
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: marbleDarkGray }}>
                            ${holding.value.toLocaleString()}
                          </div>
                    <div style={{
                            fontSize: '12px',
                            color: holding.change >= 0 ? '#22c55e' : '#ef4444'
                          }}>
                            {holding.change >= 0 ? '+' : ''}{holding.change}%
                          </div>
                        </div>
                      </div>
                      ))}
                    </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - AI Insights */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '24px',
            height: 'fit-content'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: marbleDarkGray,
              marginBottom: '20px',
              fontFamily: fontHeading
            }}>
              AI Insights
            </h2>
            
            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              {aiInsights.map((insight) => (
                <div key={insight.id} style={{
                  backgroundColor: marbleWhite,
                  padding: '16px',
                  borderRadius: '12px',
                  border: `2px solid ${marbleLightGray}`
                }}>
                    <div style={{
                      display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                    }}>
                    <h3 style={{
                        fontSize: '14px',
                      fontWeight: 'bold',
                      color: marbleDarkGray
                      }}>
                      {insight.title}
                    </h3>
                      <div style={{
                      backgroundColor: insight.confidence >= 80 ? '#22c55e' : 
                                   insight.confidence >= 60 ? '#f59e0b' : '#ef4444',
                      color: marbleWhite,
                      padding: '4px 8px',
                      borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                      {insight.confidence}%
                      </div>
                    </div>
                  
                  <p style={{
                    fontSize: '13px',
                    color: marbleGray,
                    lineHeight: '1.4',
                    marginBottom: '8px'
                  }}>
                    {insight.content}
                  </p>
                  
                  <div style={{
                    fontSize: '11px',
                    color: marbleGray
                  }}>
                    {new Date(insight.timestamp).toLocaleTimeString()}
                  </div>
                </div>
            ))}
          </div>

            <div style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: marbleWhite,
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>💡</div>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: marbleDarkGray,
                marginBottom: '4px'
              }}>
                Pro Tip
              </div>
              <div style={{
                fontSize: '12px',
                color: marbleGray,
                lineHeight: '1.4'
              }}>
                Always set stop losses and take profits before entering a trade. This helps manage risk and lock in gains.
              </div>
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AITradingCoach; 