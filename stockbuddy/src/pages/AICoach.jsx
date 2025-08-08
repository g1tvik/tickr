import React, { useState, useEffect, useRef } from 'react';
import { SuperChart } from '../components/SuperChart';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';

// Enhanced historical trading scenarios with detailed analysis
const HISTORICAL_SCENARIOS = [
  {
    id: 1,
    title: "Tesla's 2020 Breakout",
    description: "March 2020 - Tesla was trading at $70 during the COVID crash. You have $10,000 to invest. What's your strategy?",
    symbol: "TSLA",
    startDate: "2020-03-01",
    endDate: "2020-12-31",
    initialPrice: 70,
    finalPrice: 705,
    // Explicit puzzle framing for clarity
    puzzleType: 'sell', // buy | sell | hold
    scenario: {
      context: "Tesla was heavily shorted and facing bankruptcy rumors during COVID-19. The stock had dropped from $900 to $70.",
      keyEvents: [
        "March 2020: COVID-19 crash hits markets",
        "May 2020: Tesla announces strong Q1 delivery numbers",
        "July 2020: Tesla reports profitable Q2",
        "December 2020: S&P 500 inclusion announced"
      ],
      optimalStrategy: {
        entry: { type: "buy", price: 70, shares: 142, reasoning: "Strong fundamentals, oversold conditions, fear in market" },
        hold: { type: "hold", price: 200, shares: 142, reasoning: "Letting winners run, strong delivery numbers" },
        exit: { type: "sell", price: 705, shares: 142, reasoning: "Taking profits after 10x gain, S&P inclusion priced in" }
      },
      aiAnalysis: {
        marketPsychology: "Fear and panic created opportunity. When others are fearful, be greedy.",
        fundamentals: "Tesla had strong delivery numbers and was profitable despite market fears.",
        technicalFactors: "Oversold conditions with RSI below 30, massive short interest.",
        riskManagement: "Position sizing was key - not going all-in but taking meaningful position."
      }
    }
  },
  {
    id: 2,
    title: "GameStop Short Squeeze",
    description: "January 2021 - GameStop was at $20 with massive short interest. Reddit's WallStreetBets is buzzing. What do you do?",
    symbol: "GME",
    startDate: "2021-01-01",
    endDate: "2021-02-01",
    initialPrice: 20,
    finalPrice: 325,
    puzzleType: 'sell',
    scenario: {
      context: "GameStop was heavily shorted by hedge funds. Reddit's WallStreetBets community discovered this and began buying shares, causing a massive short squeeze.",
      keyEvents: [
        "January 2021: Reddit users discover high short interest",
        "January 27: Robinhood restricts buying",
        "January 28: Stock reaches $483 intraday",
        "February 1: Price settles around $325"
      ],
      optimalStrategy: {
        entry: { type: "buy", price: 20, shares: 500, reasoning: "High short interest, potential squeeze, momentum building" },
        exit: { type: "sell", price: 325, shares: 500, reasoning: "Taking profits on speculative play, peak reached" }
      },
      aiAnalysis: {
        marketPsychology: "FOMO and revenge trading against hedge funds created momentum.",
        fundamentals: "Company fundamentals were poor - this was purely speculative.",
        technicalFactors: "140% short interest created perfect squeeze setup.",
        riskManagement: "This was high-risk speculation - position sizing crucial."
      }
    }
  },
  {
    id: 3,
    title: "Apple's iPhone Launch",
    description: "September 2007 - Apple is launching the first iPhone. The stock is at $150. Revolutionary product or overpriced gadget?",
    symbol: "AAPL",
    startDate: "2007-06-01",
    endDate: "2008-06-01",
    initialPrice: 150,
    finalPrice: 180,
    puzzleType: 'buy',
    scenario: {
      context: "Apple was launching the iPhone, a revolutionary product that would change mobile computing forever. Many analysts were skeptical.",
      keyEvents: [
        "June 2007: iPhone announced",
        "September 2007: iPhone launches",
        "January 2008: Strong holiday sales",
        "June 2008: iPhone 3G announced"
      ],
      optimalStrategy: {
        entry: { type: "buy", price: 150, shares: 66, reasoning: "Revolutionary product, strong ecosystem potential" },
        hold: { type: "hold", price: 180, shares: 66, reasoning: "Long-term growth story, platform business model" }
      },
      aiAnalysis: {
        marketPsychology: "Skepticism about new technology created opportunity.",
        fundamentals: "iPhone wasn't just a phone - it was a platform for apps and services.",
        technicalFactors: "Breakout from consolidation pattern, strong volume.",
        riskManagement: "Long-term investment in paradigm-shifting technology."
      }
    }
  },
  {
    id: 4,
    title: "Bitcoin's 2017 Bull Run",
    description: "December 2017 - Bitcoin is at $20,000, up from $1,000 in January. Is this the future of money or a bubble?",
    symbol: "BTC",
    startDate: "2017-01-01",
    endDate: "2018-01-01",
    initialPrice: 1000,
    finalPrice: 20000,
    puzzleType: 'sell',
    scenario: {
      context: "Bitcoin had an incredible bull run in 2017, going from $1,000 to $20,000. Many called it a bubble, others saw it as the future of money.",
      keyEvents: [
        "January 2017: Bitcoin at $1,000",
        "June 2017: Major adoption announcements",
        "December 2017: Reaches $20,000",
        "January 2018: Begins correction"
      ],
      optimalStrategy: {
        entry: { type: "buy", price: 1000, shares: 10, reasoning: "Early adoption of revolutionary technology" },
        exit: { type: "sell", price: 20000, shares: 10, reasoning: "Taking profits on speculative asset, bubble signs" }
      },
      aiAnalysis: {
        marketPsychology: "FOMO and greed drove prices to unsustainable levels.",
        fundamentals: "Blockchain technology was revolutionary but valuation was speculative.",
        technicalFactors: "Exponential growth pattern, parabolic move.",
        riskManagement: "Speculative asset required strict position sizing and exit strategy."
      }
    }
  }
];

function AICoach() {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scenarioCompleted, setScenarioCompleted] = useState(false);
  const [userDecision, setUserDecision] = useState(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderType, setOrderType] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderShares, setOrderShares] = useState('');
  const [orderReasoning, setOrderReasoning] = useState('');
  const [chartData, setChartData] = useState(null);
  const [asOfDate, setAsOfDate] = useState(null);
  const chatEndRef = useRef(null);

  const scenario = HISTORICAL_SCENARIOS[currentScenario];

  // Derive initial as-of date based on puzzle type for clarity
  useEffect(() => {
    if (!scenario) return;
    const initial = scenario.puzzleType === 'buy' ? scenario.startDate : scenario.endDate;
    setAsOfDate(initial);
  }, [currentScenario]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          type: 'ai',
          content: `Welcome to the ${scenario.title} trading challenge! 🎯\n\nI'm your AI trading coach. I can help you understand market concepts, explain trading strategies, and provide educational insights.\n\nWhat would you like to know about this scenario?`,
          timestamp: Date.now()
        }
      ]);
    }
  }, [currentScenario]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Helpers for historical price lookup
  const parseDateToEpoch = (dateString) => {
    if (!dateString) return null;
    return Math.floor(new Date(dateString + 'T00:00:00Z').getTime() / 1000);
  };

  const getClosePriceOnOrBefore = (epochSeconds) => {
    try {
      if (!chartData?.candles?.length || !epochSeconds) return null;
      const candles = chartData.candles;
      // Find the latest candle at or before the target epoch
      let candidate = null;
      for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        if (c.timestamp <= epochSeconds) {
          candidate = c;
        } else {
          break;
        }
      }
      return candidate ? candidate.close : null;
    } catch {
      return null;
    }
  };

  // Position context derived from scenario and puzzle type
  const getPositionContext = () => {
    const entry = scenario.scenario.optimalStrategy?.entry;
    if (scenario.puzzleType === 'buy') {
      return { hasPosition: false };
    }
    if (entry) {
      // Prefer historical entry price on scenario.startDate
      const entryEpoch = parseDateToEpoch(scenario.startDate);
      const histEntry = getClosePriceOnOrBefore(entryEpoch);
      const entryPrice = histEntry || entry.price || scenario.initialPrice;
      return {
        hasPosition: true,
        shares: entry.shares,
        entryDate: scenario.startDate,
        entryPrice
      };
    }
    return { hasPosition: false };
  };

  const position = getPositionContext();

  // P/L calculation for sell puzzle using historical reference
  const getPL = () => {
    if (scenario.puzzleType !== 'sell' || !position.hasPosition) return null;
    const asOfEpoch = parseDateToEpoch(asOfDate);
    const currentClose = getClosePriceOnOrBefore(asOfEpoch);
    const currentPrice = currentClose || scenario.finalPrice || null;
    if (!currentPrice || !position.entryPrice) return null;
    const diff = currentPrice - position.entryPrice;
    const value = diff * (position.shares || 0);
    const pct = position.entryPrice ? (diff / position.entryPrice) * 100 : 0;
    return { value, pct, currentPrice };
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage = {
      type: 'user',
      content: userInput,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      // Call AI for educational response
      const response = await fetch('/api/ai-coach/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          scenario: scenario.scenario,
          chatHistory: chatMessages
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const aiMessage = {
          type: 'ai',
          content: result.response,
          timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, aiMessage]);
      } else {
        // Fallback response
        const fallbackMessage = {
          type: 'ai',
          content: "I'm here to help you learn about trading! Ask me about market psychology, technical analysis, risk management, or any trading concepts you'd like to understand better.",
          timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, fallbackMessage]);
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMessage = {
        type: 'ai',
        content: "I'm here to help you learn about trading! Ask me about market psychology, technical analysis, risk management, or any trading concepts you'd like to understand better.",
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderSubmit = async () => {
    if (!orderType || !orderPrice || !orderReasoning.trim()) return;

    const decision = {
      type: orderType,
      price: parseFloat(orderPrice),
      shares: orderType === 'buy' ? Math.floor(10000 / parseFloat(orderPrice)) : 0,
      reasoning: orderReasoning,
      timestamp: Date.now()
    };

    setUserDecision(decision);
    setShowOrderForm(false);
    setOrderType('');
    setOrderPrice('');
    setOrderShares('');
    setOrderReasoning('');

    // Add decision to chat
    const decisionMessage = {
      type: 'user',
      content: `I decided to ${orderType} ${decision.shares} shares at $${orderPrice} because: ${orderReasoning}`,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, decisionMessage]);

    // Analyze the decision
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-coach/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userDecisions: [decision],
          scenario: scenario.scenario,
          optimalStrategy: scenario.scenario.optimalStrategy
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const analysisMessage = {
          type: 'ai',
          content: `🎯 **Analysis Complete!**\n\n**Score: ${result.analysis.totalScore}/100**\n\n${result.analysis.coaching.overall}\n\n**Key Insights:**\n• ${result.analysis.coaching.marketPsychology}\n• ${result.analysis.coaching.fundamentals}\n• ${result.analysis.coaching.technicalAnalysis}\n• ${result.analysis.coaching.riskManagement}\n\n**Next Steps:**\n${result.analysis.coaching.nextSteps.map(step => `• ${step}`).join('\n')}`,
          timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, analysisMessage]);
        setScenarioCompleted(true);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetScenario = () => {
    setChatMessages([]);
    setScenarioCompleted(false);
    setUserDecision(null);
    setShowOrderForm(false);
  };

  const nextScenario = () => {
    if (currentScenario < HISTORICAL_SCENARIOS.length - 1) {
      setCurrentScenario(currentScenario + 1);
      resetScenario();
    }
  };

  return (
    <div className="page-dark" style={{
      minHeight: '100vh',
      padding: '16px',
      fontFamily: fontBody
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '16px'
      }}>
        {/* Main Content */}
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
                🤖 AI Trading Coach
              </h1>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: marbleGray
              }}>
                <span>Scenario {currentScenario + 1} of {HISTORICAL_SCENARIOS.length}</span>
                {scenarioCompleted && <span style={{ color: '#22c55e' }}>✅ Complete</span>}
              </div>
            </div>
            <p style={{
              color: marbleGray,
              fontSize: '14px',
              margin: 0
            }}>
              Learn trading through interactive scenarios and AI-powered guidance.
            </p>
          </div>

          {/* Scenario Info */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '16px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: marbleDarkGray,
              marginBottom: '8px',
              fontFamily: fontHeading
            }}>
              {scenario.title}
            </h2>
            <p style={{
              color: marbleGray,
              fontSize: '16px',
              marginBottom: '16px'
            }}>
              {scenario.description}
            </p>

            {/* Context Bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <span style={{
                backgroundColor: marbleWhite,
                borderRadius: '9999px',
                padding: '6px 12px',
                color: marbleDarkGray,
                fontSize: '12px',
                fontWeight: 'bold',
                border: '1px solid #e5e7eb'
              }}>
                🎯 Puzzle: {scenario.puzzleType === 'buy' ? 'When to BUY' : scenario.puzzleType === 'sell' ? 'When to SELL' : 'When to HOLD'}
              </span>
              <span style={{
                backgroundColor: marbleWhite,
                borderRadius: '9999px',
                padding: '6px 12px',
                color: marbleDarkGray,
                fontSize: '12px',
                border: '1px solid #e5e7eb'
              }}>
                📅 As of: {asOfDate}
              </span>
              <span style={{
                backgroundColor: marbleWhite,
                borderRadius: '9999px',
                padding: '6px 12px',
                color: marbleDarkGray,
                fontSize: '12px',
                border: '1px solid #e5e7eb'
              }}>
                {position.hasPosition ? `💼 Position: ${position.shares} @ $${(position.entryPrice || 0).toFixed ? position.entryPrice.toFixed(2) : position.entryPrice}` : '💼 Position: None'}
              </span>
              <span style={{
                backgroundColor: marbleWhite,
                borderRadius: '9999px',
                padding: '6px 12px',
                color: marbleDarkGray,
                fontSize: '12px',
                border: '1px solid #e5e7eb'
              }}>
                🪙 Symbol: {scenario.symbol}
              </span>
            </div>
            
            <div style={{
              backgroundColor: marbleWhite,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: marbleDarkGray,
                marginBottom: '12px'
              }}>
                📊 Market Context
              </h3>
              <p style={{
                color: marbleGray,
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {scenario.scenario.context}
              </p>
            </div>

            <div style={{
              backgroundColor: marbleWhite,
              borderRadius: '12px',
              padding: '16px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: marbleDarkGray,
                marginBottom: '12px'
              }}>
                📅 Key Events
              </h3>
              <ul style={{
                color: marbleGray,
                fontSize: '14px',
                lineHeight: '1.5',
                paddingLeft: '20px'
              }}>
                {scenario.scenario.keyEvents.map((event, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>{event}</li>
                ))}
              </ul>
            </div>

            {/* Position & P/L (for SELL puzzles) */}
            {scenario.puzzleType === 'sell' && (
              <div style={{
                backgroundColor: marbleWhite,
                borderRadius: '12px',
                padding: '16px',
                marginTop: '16px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: marbleDarkGray,
                  marginBottom: '12px'
                }}>
                  💼 Position & P/L
                </h3>
                {position.hasPosition ? (
                  <div style={{ color: marbleDarkGray, fontSize: '14px' }}>
                    <div style={{ marginBottom: '6px' }}>
                      Position: Holding {position.shares} shares since {position.entryDate} @ ${position.entryPrice?.toFixed ? position.entryPrice.toFixed(2) : position.entryPrice}
                    </div>
                    {(() => {
                      const pl = getPL();
                      if (!pl) return <div style={{ color: marbleGray }}>Fetching historical data...</div>;
                      const plColor = pl.value >= 0 ? '#22c55e' : '#ef4444';
                      return (
                        <div>
                          <div>As-of price ({asOfDate}): ${pl.currentPrice.toFixed(2)}</div>
                          <div style={{ fontWeight: 'bold', color: plColor }}>
                            P/L: ${pl.value.toFixed(2)} ({pl.pct.toFixed(2)}%)
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div style={{ color: marbleGray, fontSize: '14px' }}>No open position.</div>
                )}
              </div>
            )}
          </div>

          {/* Chart */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '16px'
          }}>
            <SuperChart
              symbol={scenario.symbol}
              initialInterval="1d"
              theme="dark"
              realtime={false}
              height={400}
              onDataUpdate={(data) => setChartData(data)}
            />
          </div>
        </div>

        {/* Chat Panel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Chat Window */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '16px',
            height: '500px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: marbleDarkGray,
              marginBottom: '16px',
              fontFamily: fontHeading
            }}>
              💬 AI Trading Coach
            </h3>

            {/* Chat Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: '16px',
              padding: '8px',
              backgroundColor: marbleWhite,
              borderRadius: '12px'
            }}>
              {chatMessages.map((message, index) => (
                <div key={index} style={{
                  marginBottom: '12px',
                  textAlign: message.type === 'user' ? 'right' : 'left'
                }}>
                  <div style={{
                    display: 'inline-block',
                    maxWidth: '80%',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    backgroundColor: message.type === 'user' ? marbleGold : marbleLightGray,
                    color: message.type === 'user' ? marbleDarkGray : marbleDarkGray,
                    fontSize: '14px',
                    lineHeight: '1.4',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{
                  textAlign: 'left',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    backgroundColor: marbleLightGray,
                    color: marbleDarkGray,
                    fontSize: '14px'
                  }}>
                    🤖 AI is thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            {!scenarioCompleted && (
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`Ask about ${scenario.symbol}, ${scenario.puzzleType.toUpperCase()} puzzle, or any trading concept...`}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !userInput.trim()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: marbleGold,
                    color: marbleDarkGray,
                    fontWeight: 'bold',
                    cursor: isLoading || !userInput.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Send
                </button>
              </div>
            )}
          </div>

          {/* Trading Actions */}
          {!scenarioCompleted && (
            <div style={{
              backgroundColor: marbleLightGray,
              borderRadius: '20px',
              padding: '16px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: marbleDarkGray,
                marginBottom: '16px'
              }}>
                📊 Your Trading Decision
              </h3>

              {!showOrderForm ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <button
                    onClick={() => {
                      setOrderType('buy');
                      setOrderPrice(scenario.initialPrice.toString());
                      setShowOrderForm(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#22c55e',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    📈 Buy Now
                  </button>
                  
                  <button
                    onClick={() => {
                      setOrderType('limit-buy');
                      setOrderPrice('');
                      setShowOrderForm(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    📋 Buy When Price Hits...
                  </button>
                  
                  <button
                    onClick={() => {
                      setOrderType('sell');
                      setOrderPrice(scenario.initialPrice.toString());
                      setShowOrderForm(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    📉 Sell Now
                  </button>
                  
                  <button
                    onClick={() => {
                      setOrderType('limit-sell');
                      setOrderPrice('');
                      setShowOrderForm(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    📋 Sell When Price Hits...
                  </button>
                  
                  <button
                    onClick={() => {
                      setOrderType('hold');
                      setOrderPrice('0');
                      setShowOrderForm(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: marbleGold,
                      color: marbleDarkGray,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ⏸️ Hold (Wait and Watch)
                  </button>
                </div>
              ) : (
                <div style={{
                  backgroundColor: marbleWhite,
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: marbleDarkGray,
                    marginBottom: '12px'
                  }}>
                    {orderType === 'buy' ? '📈 Buy Order' :
                     orderType === 'limit-buy' ? '📋 Limit Buy Order' :
                     orderType === 'sell' ? '📉 Sell Order' :
                     orderType === 'limit-sell' ? '📋 Limit Sell Order' :
                     '⏸️ Hold Decision'}
                  </h4>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div>
                      <label style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: marbleDarkGray,
                        marginBottom: '4px',
                        display: 'block'
                      }}>
                        Price: ${orderPrice}
                      </label>
                      <input
                        type="number"
                        value={orderPrice}
                        onChange={(e) => setOrderPrice(e.target.value)}
                        placeholder="Enter price..."
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '2px solid #e0e0e0',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: marbleDarkGray,
                        marginBottom: '4px',
                        display: 'block'
                      }}>
                        Reasoning:
                      </label>
                      <textarea
                        value={orderReasoning}
                        onChange={(e) => setOrderReasoning(e.target.value)}
                        placeholder="Explain your decision..."
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '2px solid #e0e0e0',
                          fontSize: '14px',
                          minHeight: '60px',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <button
                        onClick={handleOrderSubmit}
                        disabled={!orderPrice || !orderReasoning.trim()}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: marbleGold,
                          color: marbleDarkGray,
                          fontWeight: '500',
                          cursor: !orderPrice || !orderReasoning.trim() ? 'not-allowed' : 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✅ Submit Decision
                      </button>
                      <button
                        onClick={() => setShowOrderForm(false)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: marbleGray,
                          color: 'white',
                          fontWeight: '500',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '16px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: marbleDarkGray,
              marginBottom: '12px'
            }}>
              📚 All Scenarios
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {HISTORICAL_SCENARIOS.map((scenario, index) => (
                <button
                  key={scenario.id}
                  onClick={() => {
                    setCurrentScenario(index);
                    resetScenario();
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: currentScenario === index ? marbleGold : marbleWhite,
                    color: currentScenario === index ? marbleDarkGray : marbleDarkGray,
                    fontWeight: currentScenario === index ? 'bold' : 'normal',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textAlign: 'left'
                  }}
                >
                  {scenario.title}
                </button>
              ))}
            </div>
            
            {scenarioCompleted && (
              <div style={{
                marginTop: '16px',
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick={resetScenario}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: marbleGray,
                    color: 'white',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🔄 Retry
                </button>
                
                {currentScenario < HISTORICAL_SCENARIOS.length - 1 && (
                  <button
                    onClick={nextScenario}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: marbleGold,
                      color: marbleDarkGray,
                      fontWeight: '500',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ➡️ Next
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AICoach;
