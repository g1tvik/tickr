import React, { useState, useEffect, useRef } from 'react';
import { SuperChart } from '../components/SuperChart';
import { CoachChat } from '../components/CoachChat';
import { DecisionSidebar } from '../components/DecisionSidebar';
import { useCoachChat } from '../hooks/useCoachChat';
import { api } from '../services/api';
import { white, lightGray, gray, marbleDarkGray, marbleGold } from '../marblePalette';
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

const BEGINNER_BUDGET = 1000; // USD, used to size the example position and keep P/L approachable

const escapeHtml = (text = '') =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderMarkdown = (raw = '') => {
  if (!raw) return '';

  let html = escapeHtml(raw);

  // Headings
  html = html.replace(/^###\s?(.*)$/gim, '<h3>$1</h3>');
  html = html.replace(/^##\s?(.*)$/gim, '<h2>$1</h2>');
  html = html.replace(/^#\s?(.*)$/gim, '<h1>$1</h1>');

  // Bold / Italic / Code
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, (match, inner) => {
    const trimmed = inner.trim();
    if (!trimmed || inner !== trimmed) return match;
    return `<em>${trimmed}</em>`;
  });
  html = html.replace(/_(.+?)_/g, (match, inner) => {
    const trimmed = inner.trim();
    if (!trimmed || inner !== trimmed) return match;
    return `<em>${trimmed}</em>`;
  });
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Lists
  html = html.replace(
    /(^|\n)(- .*(\n- .*)+)/g,
    (match) => {
      const items = match
        .trim()
        .split('\n')
        .map((line) => line.replace(/^- /, '').trim());
      return `\n<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
    }
  );

  // Paragraphs & line breaks
  const blocks = html
    .split(/\n{2,}/)
    .map((block) => {
      const withBreaks = block.replace(/\n/g, '<br/>');
      return `<p>${withBreaks}</p>`;
    })
    .join('');

  return blocks
    .replace(/<p>(<ul>.*?<\/ul>)<\/p>/g, '$1')
    .replace(/<p>(<h\d>.*?<\/h\d>)<\/p>/g, '$1')
    .replace(/<p>/g, '<p style="margin:0;">');
};

// Scenario emoji icons for nav
const SCENARIO_ICONS = ['🚗', '🎮', '🍎', '₿'];

function AICoach() {
  const [currentScenario, setCurrentScenario] = useState(0);
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
  const [showInfo, setShowInfo] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showPLCalculation, setShowPLCalculation] = useState(false);
  const [showSharesCalculation, setShowSharesCalculation] = useState(false);
  const didBounceScenarioRef = useRef(false);
  const bounceInProgressRef = useRef(false);
  const bounceAltIndexRef = useRef(1);
  const defaultScenarioIndexRef = useRef(0);
  const [bouncePhase, setBouncePhase] = useState('idle'); // idle | toAlt | back | done
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'decide'

  // Derive scenario from a safe index so we never read undefined
  const safeIndex = HISTORICAL_SCENARIOS.length > 0
    ? Math.max(0, Math.min(currentScenario, HISTORICAL_SCENARIOS.length - 1))
    : 0;
  const scenario = HISTORICAL_SCENARIOS[safeIndex];

  // Use chat hook for state management (needed for bounce logic and decision analysis)
  // Disable chat during bounce to prevent premature welcome message
  const {
    chatMessages,
    setChatMessages,
    addMessage,
    resetChat,
    isLoading: chatLoading,
    error: chatError,
    sendMessage
  } = useCoachChat(scenario, bouncePhase === 'done' || bouncePhase === 'idle');

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
  // The hook handles this, but we need to respect bounce logic
  useEffect(() => {
    // Don't initialize if bounce is in progress - let bounce handle it
    if (bounceInProgressRef.current) return;
  }, [currentScenario]);

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
        const defaultScenario = HISTORICAL_SCENARIOS[defaultScenarioIndexRef.current];
        const title = defaultScenario?.title ?? 'Trading';
        setChatMessages([
          {
            type: 'ai',
            content: `Welcome to the ${title} trading challenge! 🎯\n\nI'm your AI trading coach. I can help you understand market concepts, explain trading strategies, and provide educational insights.\n\nWhat would you like to know about this scenario?`,
            timestamp: Date.now()
          }
        ]);
      }
    }
  }, [bouncePhase, currentScenario, chartScenarioIndex, chartData, chatMessages.length, setChatMessages]);

  // Auto-scroll is handled by the CoachChat component via the hook

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

  // Chat sending is now handled by the CoachChat component via the hook

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
    addMessage({
      type: 'user',
      content: `I decided to ${orderType} ${decision.shares} shares at $${orderPrice} because: ${orderReasoning}`,
      timestamp: Date.now()
    });

    // Analyze the decision
    try {
      // Show loading message
      addMessage({
        type: 'ai',
        content: '🤔 Analyzing your decision...',
        timestamp: Date.now()
      });

      const result = await api.analyzeDecision({
          userDecisions: [decision],
          scenario: scenario.scenario,
          optimalStrategy: scenario.scenario.optimalStrategy
      });
      
      if (result.success) {
        const analysis = result.analysis || {};
        const breakdown = analysis.breakdown || {};
        const coaching = analysis.coaching || {};
        
        let analysisContent = `🎯 **Analysis Complete!**\n\n**Your Score: ${analysis.totalScore ?? 0}/100**\n\n`;
        
        // Add breakdown if available
        if (breakdown.decisionQuality !== undefined) {
          analysisContent += `## Score Breakdown:\n`;
          analysisContent += `• **Decision Quality**: ${breakdown.decisionQuality ?? 0}/20\n`;
          analysisContent += `• **Timing**: ${breakdown.timing ?? 0}/20\n`;
          analysisContent += `• **Reasoning**: ${breakdown.reasoning ?? 0}/20\n`;
          analysisContent += `• **Risk Management**: ${breakdown.riskManagement ?? 0}/20\n`;
          analysisContent += `• **Market Understanding**: ${breakdown.marketUnderstanding ?? 0}/20\n\n`;
        }
        
        // Overall assessment
        if (coaching.overall) {
            analysisContent += `## Overall Assessment:\n${coaching.overall}\n\n`;
        }
        
        // Strengths
        if (coaching.strengths && Array.isArray(coaching.strengths) && coaching.strengths.length > 0) {
          analysisContent += `## What You Did Well:\n${coaching.strengths.map(s => `• ${s}`).join('\n')}\n\n`;
        }
        
        // Areas for improvement
        if (coaching.improvements && Array.isArray(coaching.improvements) && coaching.improvements.length > 0) {
          analysisContent += `## Areas to Improve:\n${coaching.improvements.map(i => `• ${i}`).join('\n')}\n\n`;
        }
        
        // Key insights
        analysisContent += `## Key Insights:\n`;
        if (coaching.marketPsychology) {
          analysisContent += `### Market Psychology:\n${coaching.marketPsychology}\n\n`;
        }
        if (coaching.fundamentals) {
          analysisContent += `### Fundamental Analysis:\n${coaching.fundamentals}\n\n`;
        }
        if (coaching.technicalAnalysis) {
          analysisContent += `### Technical Analysis:\n${coaching.technicalAnalysis}\n\n`;
        }
        if (coaching.riskManagement) {
          analysisContent += `### Risk Management:\n${coaching.riskManagement}\n\n`;
        }
        
        // Next steps
        if (coaching.nextSteps && Array.isArray(coaching.nextSteps) && coaching.nextSteps.length > 0) {
          analysisContent += `## Next Steps:\n${coaching.nextSteps.map(step => `• ${step}`).join('\n')}\n`;
        }
        
        // Scenario comparison
        if (analysis.scenarioComparison) {
          analysisContent += `\n\n---\n\n**Historical Context:** ${analysis.scenarioComparison}`;
        }
        
        addMessage({
          type: 'ai',
          content: analysisContent,
          timestamp: Date.now()
        });
        // Only mark as completed if analysis succeeded
        setScenarioCompleted(true);
      } else {
        addMessage({
          type: 'ai',
          content: `I apologize, but I'm having trouble analyzing your decision right now. Please try again later. ${result.error || 'Analysis service unavailable'}`,
          timestamp: Date.now()
        });
        // Don't auto-complete on error
        setScenarioCompleted(false);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      addMessage({
        type: 'ai',
        content: `I encountered an error while analyzing your decision: ${error.message || 'Unknown error'}. Please try submitting again.`,
        timestamp: Date.now()
      });
      // Don't auto-complete on error
      setScenarioCompleted(false);
    }
  };

  const handleCancelOrder = () => {
    setShowOrderForm(false);
    setOrderType('');
    setOrderPrice('');
    setOrderReasoning('');
  };

  const resetScenario = () => {
    resetChat();
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

  if (!scenario) {
    return (
      <div className="page-dark" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', color: white }}>
          <p>No scenarios available. Please try again later.</p>
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
            backgroundColor: lightGray,
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
                  color: gray, 
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  fontFamily: fontBody
                }}>
                  Scenario {currentScenario + 1} of {HISTORICAL_SCENARIOS.length}
                </div>
                <div style={{
                  backgroundColor: white,
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
                    color: gray,
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
                  background: showDetails ? marbleGold : white,
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
                backgroundColor: white,
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
                    color: gray,
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
                backgroundColor: white,
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
                    color: gray,
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
                backgroundColor: white,
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
                    color: gray,
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
                  backgroundColor: white, 
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
                    color: gray, 
                    fontSize: '14px', 
                    lineHeight: '1.6', 
                    margin: 0,
                    fontFamily: fontBody
                  }}>
                    {scenario.scenario.context}
                  </p>
                </div>
                
                <div style={{ 
                  backgroundColor: white, 
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
                    color: gray, 
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
            backgroundColor: lightGray,
            borderRadius: '20px',
            padding: '16px'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: marbleDarkGray, margin: 0 }}>
                📈 {scenario.symbol} Chart
              </h3>
              <div style={{ color: gray, fontSize: '12px', marginTop: '4px' }}>
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
              backgroundColor: lightGray,
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
                backgroundColor: white,
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
                  <span style={{ color: gray, fontSize: '14px', fontWeight: '500', fontFamily: fontBody }}>
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
                  <span style={{ color: gray, fontSize: '14px', fontWeight: '500', fontFamily: fontBody }}>
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
                    color: gray,
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
                    color: gray,
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
              backgroundColor: lightGray,
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
                  backgroundColor: white,
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
                      <span style={{ color: gray, fontSize: '14px', fontWeight: '500', fontFamily: fontBody }}>
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
                      <span style={{ color: gray, fontSize: '14px', fontWeight: '500', fontFamily: fontBody }}>
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
                      <span style={{ color: gray, fontSize: '14px', fontWeight: '500', fontFamily: fontBody }}>
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
                      <span style={{ color: gray, fontSize: '14px', fontWeight: '500', fontFamily: fontBody }}>
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
                        color: gray,
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Calculation:
                      </span>
                      <span style={{
                        color: gray,
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
                  backgroundColor: white,
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
                          color: gray,
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
                          <span style={{ color: gray, fontSize: '14px', fontWeight: '500' }}>
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
                          <span style={{ color: gray, fontSize: '14px', fontWeight: '500' }}>
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
                              color: gray,
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              P&L Calculation:
                            </span>
                            <span style={{
                              color: gray,
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
                          color: gray,
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
          <CoachChat
            scenario={scenario}
            enabled={bouncePhase === 'done' || bouncePhase === 'idle'}
            disabled={scenarioCompleted}
            messages={chatMessages}
            onSendMessage={sendMessage}
            isLoading={chatLoading}
            error={chatError}
          />

          {/* Trading Actions */}
          <DecisionSidebar
            scenario={scenario}
            scenarioCompleted={scenarioCompleted}
            orderType={orderType}
            orderPrice={orderPrice}
            orderReasoning={orderReasoning}
            showOrderForm={showOrderForm}
            beginnerBudget={BEGINNER_BUDGET}
            onOrderTypeChange={setOrderType}
            onOrderPriceChange={setOrderPrice}
            onOrderReasoningChange={setOrderReasoning}
            onShowOrderFormChange={setShowOrderForm}
            onSubmitDecision={handleOrderSubmit}
            onCancelOrder={handleCancelOrder}
          />

          {/* Navigation */}
          <div style={{
            backgroundColor: lightGray,
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
                    backgroundColor: currentScenario === index ? marbleGold : white,
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
                    backgroundColor: gray,
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
