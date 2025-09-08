import React, { useState, useEffect, useRef } from 'react';
import { SuperChart } from '../components/SuperChart';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody, fontMono } from '../fontPalette';

// Enhanced historical trading scenarios with detailed analysis
const HISTORICAL_SCENARIOS = [
  {
    id: 1,
    title: "Tesla's 2020 Breakout",
    description: "March 2020 — After the COVID sell‑off, split‑adjusted TSLA traded near $70. Assume you already bought there. Your task: decide when to sell.",
    symbol: "TSLA",
    startDate: "2020-03-01",
    endDate: "2020-12-31",
    initialPrice: 70,
    finalPrice: 705,
    // Explicit puzzle framing for clarity
    puzzleType: 'sell', // buy | sell | hold
    scenario: {
      context: "You already own Tesla shares that you bought at $70 during the March 2020 crash. Now the stock is recovering and you need to decide: when do you sell? Do you sell early to lock in profits, or hold longer for bigger gains? The stock eventually reaches $705 by December, but you don't know that will happen. This challenge teaches you about profit-taking strategies and risk management.",
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
      context: "You already own GameStop shares at $20. Reddit users are rallying to buy the stock to squeeze hedge funds who bet against it. The stock is skyrocketing - do you sell now to lock in profits, or hold for even bigger gains? This challenge teaches you about momentum trading and knowing when to exit.",
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
      context: "You have cash and Apple is launching the revolutionary iPhone at $150 per share. Many analysts think it's overpriced, but you see potential. Do you buy now, wait for a better price, or skip it entirely? This challenge teaches you about evaluating new technology and entry timing.",
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
      context: "You already own Bitcoin that you bought at $1,000. It's now at $20,000 and everyone is talking about it. Some say it's a bubble about to pop, others say it's just getting started. Do you sell to lock in your 20x gains, or hold for even more? This challenge teaches you about profit-taking and bubble recognition.",
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
  const [chartScenarioIndex, setChartScenarioIndex] = useState(null);
  const [asOfDate, setAsOfDate] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPLCalculation, setShowPLCalculation] = useState(false);
  const [showSharesCalculation, setShowSharesCalculation] = useState(false);
  const chatEndRef = useRef(null);
  const didBounceScenarioRef = useRef(false);
  const bounceInProgressRef = useRef(false);
  const bounceAltIndexRef = useRef(1);
  const defaultScenarioIndexRef = useRef(0);
  const [bouncePhase, setBouncePhase] = useState('idle'); // idle | toAlt | back | done

  const scenario = HISTORICAL_SCENARIOS[currentScenario];
  const BEGINNER_BUDGET = 1000; // USD, used to size the example position and keep P/L approachable

  // Derive initial as-of date based on puzzle type for clarity
  useEffect(() => {
    if (!scenario) return;
    const initial = scenario.puzzleType === 'buy' ? scenario.startDate : scenario.endDate;
    setAsOfDate(initial);
  }, [currentScenario]);

  // On first mount, switch to an alternate scenario and then back to default
  useEffect(() => {
    if (didBounceScenarioRef.current) return;
    didBounceScenarioRef.current = true;
    if (HISTORICAL_SCENARIOS.length <= 1) return;
    bounceInProgressRef.current = true;
    defaultScenarioIndexRef.current = currentScenario;
    bounceAltIndexRef.current = currentScenario === 0 ? 1 : 0;
    setBouncePhase('toAlt');
    setCurrentScenario(bounceAltIndexRef.current);
  }, []);

  // Initialize chat with welcome message (skip during bounce)
  useEffect(() => {
    if (chatMessages.length === 0 && !bounceInProgressRef.current) {
      setChatMessages([
        {
          type: 'ai',
          content: `Welcome to the ${scenario.title} trading challenge! 🎯\n\nI'm your AI trading coach. I can help you understand market concepts, explain trading strategies, and provide educational insights.\n\nWhat would you like to know about this scenario?`,
          timestamp: Date.now()
        }
      ]);
    }
  }, [currentScenario, chatMessages.length]);

  // Progress bounce when candles arrive for the displayed scenario
  useEffect(() => {
    if (!bounceInProgressRef.current) return;
    if (!chartData || !Array.isArray(chartData.candles) || chartData.candles.length === 0) return;

    const dataMatchesCurrent = chartScenarioIndex === currentScenario;
    if (!dataMatchesCurrent) return;

    if (bouncePhase === 'toAlt' && currentScenario === bounceAltIndexRef.current) {
      setBouncePhase('back');
      setCurrentScenario(defaultScenarioIndexRef.current);
      return;
    }

    if (bouncePhase === 'back' && currentScenario === defaultScenarioIndexRef.current) {
      setBouncePhase('done');
      bounceInProgressRef.current = false;
      if (chatMessages.length === 0) {
        setChatMessages([
          {
            type: 'ai',
            content: `Welcome to the ${HISTORICAL_SCENARIOS[defaultScenarioIndexRef.current].title} trading challenge! 🎯\n\nI'm your AI trading coach. I can help you understand market concepts, explain trading strategies, and provide educational insights.\n\nWhat would you like to know about this scenario?`,
            timestamp: Date.now()
          }
        ]);
      }
    }
  }, [bouncePhase, currentScenario, chartScenarioIndex, chartData, chatMessages.length]);

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
      // Beginner-sized example position based on budget
      const shares = Math.max(1, Math.floor(BEGINNER_BUDGET / entryPrice));
      return {
        hasPosition: true,
        shares,
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
      shares: orderType === 'buy' ? Math.floor(BEGINNER_BUDGET / parseFloat(orderPrice)) : 0,
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
        gridTemplateColumns: '1.2fr 400px',
        gap: '16px'
      }}>
        {/* Main Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Enhanced Scenario Header */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header Row */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              marginBottom: '20px' 
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  marginBottom: '8px' 
                }}>
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: marbleDarkGray,
                    margin: 0,
                    fontFamily: fontHeading,
                    letterSpacing: '-0.5px'
                  }}>
                    {scenario.title}
                  </h2>
                  {scenarioCompleted && (
                    <div style={{
                      backgroundColor: '#22c55e',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      ✅ Complete
                    </div>
                  )}
                </div>
                <div style={{ 
                  color: marbleGray, 
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  fontFamily: fontBody
                }}>
                  Scenario {currentScenario + 1} of {HISTORICAL_SCENARIOS.length}
                </div>
                <div style={{
                  backgroundColor: marbleWhite,
                  borderRadius: '12px',
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  marginTop: '8px'
                }}>
                  <div style={{
                    color: marbleDarkGray,
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '4px',
                    fontFamily: fontBody
                  }}>
                    🎯 Challenge Goal:
                  </div>
                  <div style={{
                    color: marbleGray,
                    fontSize: '12px',
                    lineHeight: '1.4',
                    fontFamily: fontBody
                  }}>
                    {scenario.puzzleType === 'buy' ? 
                      'You have cash and need to decide when to buy shares. Watch the price action and make your entry decision.' :
                      scenario.puzzleType === 'sell' ? 
                      'You already own shares and need to decide when to sell them. Choose your exit strategy based on market conditions.' :
                      'You need to decide whether to buy, sell, or wait. Analyze the situation and make your trading decision.'
                    }
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setShowDetails(v => !v)} 
                style={{
                  padding: '10px 16px', 
                  borderRadius: '12px', 
                  border: '2px solid rgba(255, 255, 255, 0.2)', 
                  background: showDetails ? marbleGold : marbleWhite,
                  color: showDetails ? marbleDarkGray : marbleDarkGray, 
                  fontSize: '13px', 
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            {/* Enhanced Info Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                backgroundColor: marbleWhite,
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '8px' 
                }}>
                  <span style={{ fontSize: '16px' }}>🎯</span>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: marbleGray,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontFamily: fontBody
                  }}>
                    Challenge Type
                  </span>
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '700', 
                  color: marbleDarkGray,
                  fontFamily: fontBody
                }}>
                  {scenario.puzzleType === 'buy' ? 'When to BUY (Entry Decision)' : 
                   scenario.puzzleType === 'sell' ? 'When to SELL (Exit Decision)' : 'When to HOLD (Wait Decision)'}
                </div>
              </div>

              <div style={{
                backgroundColor: marbleWhite,
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '8px' 
                }}>
                  <span style={{ fontSize: '16px' }}>📅</span>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: marbleGray,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontFamily: fontBody
                  }}>
                    Current Date
                  </span>
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '700', 
                  color: marbleDarkGray,
                  fontFamily: fontBody
                }}>
                  {asOfDate}
                </div>
              </div>

              <div style={{
                backgroundColor: marbleWhite,
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '8px' 
                }}>
                  <span style={{ fontSize: '16px' }}>🪙</span>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: marbleGray,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontFamily: fontBody
                  }}>
                    Symbol
                  </span>
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '700', 
                  color: marbleDarkGray,
                  fontFamily: fontBody
                }}>
                  {scenario.symbol}
                </div>
              </div>
            </div>

            {/* Enhanced Collapsible Details */}
            {showDetails && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '20px',
                marginTop: '8px'
              }}>
                <div style={{ 
                  backgroundColor: marbleWhite, 
                  borderRadius: '16px', 
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '12px' 
                  }}>
                    <span style={{ fontSize: '18px' }}>📊</span>
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: '700', 
                      color: marbleDarkGray, 
                      margin: 0,
                      fontFamily: fontHeading
                    }}>
                      Market Context
                    </h3>
                  </div>
                  <p style={{ 
                    color: marbleGray, 
                    fontSize: '14px', 
                    lineHeight: '1.6', 
                    margin: 0,
                    fontFamily: fontBody
                  }}>
                    {scenario.scenario.context}
                  </p>
                </div>
                
                <div style={{ 
                  backgroundColor: marbleWhite, 
                  borderRadius: '16px', 
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '12px' 
                  }}>
                    <span style={{ fontSize: '18px' }}>📅</span>
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: '700', 
                      color: marbleDarkGray, 
                      margin: 0,
                      fontFamily: fontHeading
                    }}>
                      Key Events
                    </h3>
                  </div>
                  <ul style={{ 
                    color: marbleGray, 
                    fontSize: '14px', 
                    lineHeight: '1.6', 
                    paddingLeft: '20px', 
                    margin: 0,
                    fontFamily: fontBody
                  }}>
                    {scenario.scenario.keyEvents.map((event, index) => (
                      <li key={index} style={{ marginBottom: '8px' }}>{event}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Chart */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '16px'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: marbleDarkGray, margin: 0 }}>
                📈 {scenario.symbol} Chart
              </h3>
              <div style={{ color: marbleGray, fontSize: '12px', marginTop: '4px' }}>
                Loading historical data for {scenario.startDate} to {scenario.endDate}...
              </div>
            </div>
            <SuperChart
              symbol={scenario.symbol}
              initialInterval="1d"
              theme="dark"
              realtime={false}
              height={400}
              onDataUpdate={(data) => {
                setChartData(data);
                setChartScenarioIndex(currentScenario);
              }}
              showDebugOverlay={false}
              dateRange={{ start: scenario.startDate, end: scenario.endDate }}
              visibleRange={{
                from: Math.floor(new Date((scenario.startDate || '2020-01-01') + 'T00:00:00Z').getTime() / 1000),
                to: Math.floor(new Date((scenario.endDate || '2020-12-31') + 'T23:59:59Z').getTime() / 1000)
              }}
            />
          </div>

          {/* Portfolio Balance for Buy Challenges */}
          {scenario.puzzleType === 'buy' && (
            <div style={{
              backgroundColor: marbleLightGray,
              borderRadius: '24px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '24px' }}>💰</span>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: marbleDarkGray,
                  margin: 0,
                  fontFamily: fontHeading
                }}>
                  Your Portfolio
                </h3>
              </div>

              <div style={{
                backgroundColor: marbleWhite,
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <span style={{ color: marbleGray, fontSize: '14px', fontWeight: '500', fontFamily: fontBody }}>
                    Available Cash
                  </span>
                  <span style={{ 
                    color: marbleDarkGray, 
                    fontSize: '24px', 
                    fontWeight: '700',
                    fontFamily: fontBody
                  }}>
                    ${BEGINNER_BUDGET.toLocaleString()}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <span style={{ color: marbleGray, fontSize: '14px', fontWeight: '500', fontFamily: fontBody }}>
                    Current Price ({asOfDate})
                  </span>
                  <span style={{ 
                    color: marbleDarkGray, 
                    fontSize: '18px', 
                    fontWeight: '700',
                    fontFamily: fontBody
                  }}>
                    ${scenario.initialPrice.toFixed(2)}
                  </span>
                </div>

                <div style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    color: marbleGray,
                    fontSize: '12px',
                    fontWeight: '500',
                    marginBottom: '4px',
                    fontFamily: fontBody
                  }}>
                    Maximum Shares You Can Buy:
                  </div>
                  <div style={{
                    color: marbleDarkGray,
                    fontSize: '16px',
                    fontWeight: '700',
                    fontFamily: fontMono
                  }}>
                    {Math.floor(BEGINNER_BUDGET / scenario.initialPrice)} shares
                  </div>
                  <div style={{
                    color: marbleGray,
                    fontSize: '11px',
                    marginTop: '4px',
                    fontStyle: 'italic',
                    fontFamily: fontBody
                  }}>
                    * This assumes you use all available cash
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Position Calculator */}
          {scenario.puzzleType !== 'buy' && position.hasPosition && (
            <div style={{
              backgroundColor: marbleLightGray,
              borderRadius: '24px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '24px' }}>💼</span>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: marbleDarkGray,
                  margin: 0,
                  fontFamily: fontHeading
                }}>
                  Example Beginner Position
                </h3>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                alignItems: 'start'
              }}>
                {/* Position Details */}
                <div style={{
                  backgroundColor: marbleWhite,
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: marbleDarkGray,
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    📊 Position Details
                  </h4>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ color: marbleGray, fontSize: '14px', fontWeight: '500', fontFamily: fontBody }}>
                        Budget
                      </span>
                      <span style={{ color: marbleDarkGray, fontSize: '16px', fontWeight: '700', fontFamily: fontBody }}>
                        ${BEGINNER_BUDGET.toLocaleString()}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ color: marbleGray, fontSize: '14px', fontWeight: '500', fontFamily: fontBody }}>
                        Entry Date
                      </span>
                      <span style={{ color: marbleDarkGray, fontSize: '16px', fontWeight: '700', fontFamily: fontBody }}>
                        {position.entryDate}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ color: marbleGray, fontSize: '14px', fontWeight: '500', fontFamily: fontBody }}>
                        Entry Price
                      </span>
                      <span style={{ color: marbleDarkGray, fontSize: '16px', fontWeight: '700', fontFamily: fontBody }}>
                        ${position.entryPrice.toFixed(2)}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <span style={{ color: marbleGray, fontSize: '14px', fontWeight: '500', fontFamily: fontBody }}>
                        Shares Owned
                      </span>
                      <span style={{ color: marbleDarkGray, fontSize: '16px', fontWeight: '700', fontFamily: fontBody }}>
                        {position.shares}
                      </span>
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => setShowSharesCalculation(!showSharesCalculation)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{
                        color: marbleGray,
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Calculation:
                      </span>
                      <span style={{
                        color: marbleGray,
                        fontSize: '14px',
                        transform: showSharesCalculation ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}>
                        ▼
                      </span>
                    </button>
                    
                    {showSharesCalculation && (
                      <div style={{
                        padding: '0 12px 12px 12px',
                        borderTop: '1px solid rgba(0, 0, 0, 0.1)'
                      }}>
                        <div style={{
                          color: marbleDarkGray,
                          fontSize: '13px',
                          fontFamily: fontMono,
                          lineHeight: '1.4'
                        }}>
                          Shares = floor(Budget ÷ Entry)<br/>
                          = floor(${BEGINNER_BUDGET} ÷ ${position.entryPrice.toFixed(2)})<br/>
                          = {position.shares}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* P&L Performance */}
                <div style={{
                  backgroundColor: marbleWhite,
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: marbleDarkGray,
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    📈 Performance as of {asOfDate}
                  </h4>
                  
                  {(() => {
                    const pl = getPL();
                    if (!pl) {
                      return (
                        <div style={{
                          textAlign: 'center',
                          color: marbleGray,
                          fontSize: '14px',
                          padding: '20px'
                        }}>
                          Loading P&L calculation...
                        </div>
                      );
                    }
                    
                    const plColor = pl.value >= 0 ? '#22c55e' : '#ef4444';
                    const delta = (pl.currentPrice - position.entryPrice);
                    
                    return (
                      <div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px'
                        }}>
                          <span style={{ color: marbleGray, fontSize: '14px', fontWeight: '500' }}>
                            Current Price
                          </span>
                          <span style={{ 
                            color: marbleDarkGray, 
                            fontSize: '18px', 
                            fontWeight: '700' 
                          }}>
                            ${pl.currentPrice.toFixed(2)}
                          </span>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px'
                        }}>
                          <span style={{ color: marbleGray, fontSize: '14px', fontWeight: '500' }}>
                            Price Change
                          </span>
                          <span style={{ 
                            color: plColor, 
                            fontSize: '16px', 
                            fontWeight: '700' 
                          }}>
                            ${delta.toFixed(2)} ({pl.pct.toFixed(2)}%)
                          </span>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '16px',
                          padding: '12px',
                          backgroundColor: plColor === '#22c55e' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          borderRadius: '8px',
                          border: `1px solid ${plColor}20`
                        }}>
                          <span style={{ color: marbleDarkGray, fontSize: '14px', fontWeight: '600' }}>
                            Total P&L
                          </span>
                          <span style={{ 
                            color: plColor, 
                            fontSize: '18px', 
                            fontWeight: '700' 
                          }}>
                            ${pl.value.toFixed(2)}
                          </span>
                        </div>

                        <div style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.05)',
                          borderRadius: '8px',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          overflow: 'hidden'
                        }}>
                          <button
                            onClick={() => setShowPLCalculation(!showPLCalculation)}
                            style={{
                              width: '100%',
                              padding: '12px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              textAlign: 'left'
                            }}
                          >
                            <span style={{
                              color: marbleGray,
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              P&L Calculation:
                            </span>
                            <span style={{
                              color: marbleGray,
                              fontSize: '14px',
                              transform: showPLCalculation ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease'
                            }}>
                              ▼
                            </span>
                          </button>
                          
                          {showPLCalculation && (
                            <div style={{
                              padding: '0 12px 12px 12px',
                              borderTop: '1px solid rgba(0, 0, 0, 0.1)'
                            }}>
                              <div style={{
                                color: marbleDarkGray,
                                fontSize: '13px',
                                fontFamily: fontMono,
                                lineHeight: '1.4'
                              }}>
                                {position.shares} × (${pl.currentPrice.toFixed(2)} − ${position.entryPrice.toFixed(2)})<br/>
                                = {position.shares} × ${delta.toFixed(2)}<br/>
                                = ${pl.value.toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div style={{
                          marginTop: '12px',
                          color: marbleGray,
                          fontSize: '11px',
                          fontStyle: 'italic'
                        }}>
                          * As-of price uses the official historical close on {asOfDate}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
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
                    whiteSpace: 'pre-wrap',
                    fontFamily: fontBody
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
                    fontSize: '14px',
                    fontFamily: fontBody
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
                    fontSize: '14px',
                    fontFamily: fontBody
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
                    fontSize: '14px',
                    fontFamily: fontBody
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
                  {/* Buy buttons - only show for 'buy' challenges */}
                  {scenario.puzzleType === 'buy' && (
                    <>
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
                      fontSize: '14px',
                      fontFamily: fontBody
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
                      fontSize: '14px',
                      fontFamily: fontBody
                    }}
                  >
                    📋 Buy When Price Hits...
                      </button>
                    </>
                  )}

                  {/* Sell buttons - only show for 'sell' challenges */}
                  {scenario.puzzleType === 'sell' && (
                    <>
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
                      fontSize: '14px',
                      fontFamily: fontBody
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
                      fontSize: '14px',
                      fontFamily: fontBody
                    }}
                  >
                    📋 Sell When Price Hits...
                      </button>
                    </>
                  )}

                  {/* Hold button - always available */}
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
                      fontSize: '14px',
                      fontFamily: fontBody
                    }}
                  >
                    ⏸️ Hold (Wait and Watch)
                  </button>

                  {/* Disabled buy buttons for sell challenges */}
                  {scenario.puzzleType === 'sell' && (
                    <>
                      <button
                        disabled
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#9ca3af',
                          color: '#6b7280',
                          fontWeight: 'bold',
                          cursor: 'not-allowed',
                          fontSize: '14px',
                          opacity: 0.6,
                          fontFamily: fontBody
                        }}
                      >
                        📈 Buy Now (Not Available)
                      </button>
                      
                      <button
                        disabled
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#9ca3af',
                          color: '#6b7280',
                          fontWeight: 'bold',
                          cursor: 'not-allowed',
                          fontSize: '14px',
                          opacity: 0.6,
                          fontFamily: fontBody
                        }}
                      >
                        📋 Buy When Price Hits... (Not Available)
                      </button>
                    </>
                  )}

                  {/* Disabled sell buttons for buy challenges */}
                  {scenario.puzzleType === 'buy' && (
                    <>
                      <button
                        disabled
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#9ca3af',
                          color: '#6b7280',
                          fontWeight: 'bold',
                          cursor: 'not-allowed',
                          fontSize: '14px',
                          opacity: 0.6,
                          fontFamily: fontBody
                        }}
                      >
                        📉 Sell Now (Not Available)
                      </button>
                      
                      <button
                        disabled
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#9ca3af',
                          color: '#6b7280',
                          fontWeight: 'bold',
                          cursor: 'not-allowed',
                          fontSize: '14px',
                          opacity: 0.6,
                          fontFamily: fontBody
                        }}
                      >
                        📋 Sell When Price Hits... (Not Available)
                      </button>
                    </>
                  )}
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
                    {/* Portfolio info for buy orders */}
                    {(orderType === 'buy' || orderType === 'limit-buy') && (
                      <div style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          color: marbleGray,
                          fontSize: '12px',
                          fontWeight: '500',
                          marginBottom: '4px',
                          fontFamily: fontBody
                        }}>
                          Portfolio Info:
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <span style={{ color: marbleGray, fontSize: '12px', fontFamily: fontBody }}>
                            Available Cash:
                          </span>
                          <span style={{ color: marbleDarkGray, fontSize: '14px', fontWeight: '600', fontFamily: fontBody }}>
                            ${BEGINNER_BUDGET.toLocaleString()}
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ color: marbleGray, fontSize: '12px', fontFamily: fontBody }}>
                            Max Shares at ${orderPrice || scenario.initialPrice}:
                          </span>
                          <span style={{ color: marbleDarkGray, fontSize: '14px', fontWeight: '600', fontFamily: fontBody }}>
                            {Math.floor(BEGINNER_BUDGET / parseFloat(orderPrice || scenario.initialPrice))} shares
                          </span>
                        </div>
                      </div>
                    )}

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
                          fontSize: '14px',
                          fontFamily: fontBody
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
                          resize: 'vertical',
                          fontFamily: fontBody
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
                          fontSize: '12px',
                          fontFamily: fontBody
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
                          fontSize: '12px',
                          fontFamily: fontBody
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
                    textAlign: 'left',
                    fontFamily: fontBody
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
                    fontSize: '12px',
                    fontFamily: fontBody
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
                      fontSize: '12px',
                      fontFamily: fontBody
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
