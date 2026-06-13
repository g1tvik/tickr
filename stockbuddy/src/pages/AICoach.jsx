import React, { useState, useEffect, useRef } from 'react';
import { SuperChart } from '../components/SuperChart';
import { CoachChat } from '../components/CoachChat';
import { DecisionSidebar } from '../components/DecisionSidebar';
import { useCoachChat } from '../hooks/useCoachChat';
import { useSEO, SEO_CONFIG } from '../lib/seo';
import { api } from '../services/api';
import { marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';
import tk, { label, mono, inset, heading, btnPrimary, btnGhost, tag } from '../theme/terminal';
import Icon from '../components/Icon';

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

// Scenario nav ticker symbols
const SCENARIO_ICONS = ['TSLA', 'GME', 'AAPL', 'BTC'];

function AICoach() {
  useSEO(SEO_CONFIG.aiCoach);

  // Marble dark surface palette — this page renders on a dark background (page-dark),
  // so cards/panels must be dark too. These locals override the light palette imports
  // (white/lightGray/marbleDarkGray) for inline card styling only.
  const cardBg = tk.raised;                            // nested card surface
  const cardBg2 = tk.surface;                          // primary panel surface
  const cardText = tk.text;                            // primary cream text
  const cardMuted = tk.muted;                          // muted / secondary text
  const cardBorder = tk.hair;                          // structural hairline border
  const cardShadow = 'none';                           // flat — elevation via hierarchy, not glow

  const [currentScenario, setCurrentScenario] = useState(0);
  const [scenarioCompleted, setScenarioCompleted] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderType, setOrderType] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderReasoning, setOrderReasoning] = useState('');
  const [chartData, setChartData] = useState(null);
  const [chartScenarioIndex, setChartScenarioIndex] = useState(null);
  const [asOfDate, setAsOfDate] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPLCalculation, setShowPLCalculation] = useState(false);
  const [showSharesCalculation, setShowSharesCalculation] = useState(false);
  const [pastDecisions, setPastDecisions] = useState([]);
  const didBounceScenarioRef = useRef(false);
  const bounceInProgressRef = useRef(false);
  const bounceAltIndexRef = useRef(1);
  const defaultScenarioIndexRef = useRef(0);
  const [bouncePhase, setBouncePhase] = useState('idle'); // idle | toAlt | back | done

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
    clearHistory,
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
            content: `Welcome to the ${title} trading challenge!\n\nI'm your AI trading coach. I can help you understand market concepts, explain trading strategies, and provide educational insights.\n\nWhat would you like to know about this scenario?`,
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

  // Past analyzed decisions — persisted server-side by /ai-coach/analyze.
  const loadPastDecisions = async () => {
    try {
      const res = await api.getCoachDecisions();
      if (res.success) setPastDecisions(res.decisions || []);
    } catch {
      // Transient/auth failure — the history panel simply stays hidden.
    }
  };

  useEffect(() => {
    loadPastDecisions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOrderSubmit = async () => {
    if (!orderType || !orderPrice || !orderReasoning.trim()) return;

    const decision = {
      type: orderType,
      price: parseFloat(orderPrice),
      shares: orderType === 'buy' ? Math.floor(BEGINNER_BUDGET / parseFloat(orderPrice)) : 0,
      reasoning: orderReasoning,
      timestamp: Date.now()
    };

    setShowOrderForm(false);
    setOrderType('');
    setOrderPrice('');
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
        content: 'Analyzing your decision...',
        timestamp: Date.now()
      });

      const result = await api.analyzeDecision({
          userDecisions: [decision],
          scenario: scenario.scenario,
          optimalStrategy: scenario.scenario.optimalStrategy,
          // Persisted with the decision so history entries are identifiable.
          scenarioId: scenario.id,
          scenarioTitle: scenario.title
      });
      
      if (result.success) {
        const analysis = result.analysis || {};
        const breakdown = analysis.breakdown || {};
        const coaching = analysis.coaching || {};
        
        let analysisContent = `**Analysis Complete!**\n\n**Your Score: ${analysis.totalScore ?? 0}/100**\n\n`;
        
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
        loadPastDecisions(); // the analyze endpoint just persisted this attempt
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
      if (import.meta.env.DEV) {
        console.error('Analysis error:', error);
      }
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
        <div style={{ textAlign: 'center', color: cardText }}>
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
      {/* Scoped styles: responsive grid collapse to a single column on small screens (<=768px). */}
      <style>{`
        .coach-main-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) 400px; gap: 16px; }
        .coach-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 8px; }
        .coach-position-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
        @media (max-width: 768px) {
          .coach-main-grid,
          .coach-details-grid,
          .coach-position-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <div className="coach-main-grid" style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Main Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          minWidth: 0
        }}>
          {/* Enhanced Scenario Header */}
          <div style={{
            backgroundColor: cardBg2,
            borderRadius: tk.r,
            padding: '24px',
            border: `1px solid ${cardBorder}`,
            boxShadow: cardShadow
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
                    ...heading,
                    fontSize: '26px',
                    color: cardText,
                    margin: 0
                  }}>
                    {scenario.title}
                  </h2>
                  {scenarioCompleted && (
                    <span style={{
                      ...tag,
                      color: tk.up,
                      borderColor: 'rgba(79,180,119,0.4)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <Icon name="check" size={11} /> Complete
                    </span>
                  )}
                </div>
                <div style={{ 
                  color: cardMuted, 
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  fontFamily: fontBody
                }}>
                  Scenario <span style={mono}>{currentScenario + 1}</span> of <span style={mono}>{HISTORICAL_SCENARIOS.length}</span>
                </div>
                <div style={{
                  ...inset,
                  padding: '14px',
                  marginTop: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    marginBottom: '8px'
                  }}>
                    <Icon name="target" size={14} color={tk.gold} />
                    <span style={label}>Challenge Goal</span>
                  </div>
                  <div style={{
                    color: cardMuted,
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
                  ...(showDetails ? btnPrimary : btnGhost),
                  transition: 'all 0.2s ease'
                }}
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            {/* Enhanced Info Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 0,
              marginBottom: '20px',
              borderTop: `1px solid ${tk.hair}`,
              borderBottom: `1px solid ${tk.hair}`,
            }}>
              <div style={{
                padding: '14px 18px',
                borderLeft: `1px solid ${tk.hair}`,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <Icon name="target" size={14} color={tk.gold} />
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: cardMuted,
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
                  color: cardText,
                  fontFamily: fontBody
                }}>
                  {scenario.puzzleType === 'buy' ? 'When to BUY (Entry Decision)' : 
                   scenario.puzzleType === 'sell' ? 'When to SELL (Exit Decision)' : 'When to HOLD (Wait Decision)'}
                </div>
              </div>

              <div style={{
                padding: '14px 18px',
                borderLeft: `1px solid ${tk.hair}`,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <Icon name="calendar" size={14} color={tk.gold} />
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: cardMuted,
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
                  color: cardText,
                  fontFamily: fontBody
                }}>
                  <span style={mono}>{asOfDate}</span>
                </div>
              </div>

              <div style={{
                padding: '14px 18px',
                borderLeft: `1px solid ${tk.hair}`,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <Icon name="coin" size={14} color={tk.gold} />
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: cardMuted,
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
                  color: cardText,
                  fontFamily: fontBody
                }}>
                  <span style={mono}>{scenario.symbol}</span>
                </div>
              </div>
            </div>

            {/* Enhanced Collapsible Details */}
            {showDetails && (
              <div className="coach-details-grid">
                <div style={{ 
                  backgroundColor: cardBg, 
                  borderRadius: tk.rSm, 
                  padding: '20px',
                  border: `1px solid ${cardBorder}`,
                  boxShadow: cardShadow
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '12px' 
                  }}>
                    <Icon name="chart" size={15} color={tk.gold} />
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: '700', 
                      color: cardText, 
                      margin: 0,
                      fontFamily: fontHeading
                    }}>
                      Market Context
                    </h3>
                  </div>
                  <p style={{ 
                    color: cardMuted, 
                    fontSize: '14px', 
                    lineHeight: '1.6', 
                    margin: 0,
                    fontFamily: fontBody
                  }}>
                    {scenario.scenario.context}
                  </p>
                </div>
                
                <div style={{ 
                  backgroundColor: cardBg, 
                  borderRadius: tk.rSm, 
                  padding: '20px',
                  border: `1px solid ${cardBorder}`,
                  boxShadow: cardShadow
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '12px' 
                  }}>
                    <Icon name="calendar" size={15} color={tk.gold} />
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: '700', 
                      color: cardText, 
                      margin: 0,
                      fontFamily: fontHeading
                    }}>
                      Key Events
                    </h3>
                  </div>
                  <ul style={{ 
                    color: cardMuted, 
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
            backgroundColor: cardBg2,
            borderRadius: tk.r,
            padding: '16px',
            border: `1px solid ${cardBorder}`,
            minWidth: 0,
            overflow: 'hidden'
          }}>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="chart" size={15} color={tk.gold} />
                <span style={label}>Price Chart</span>
                <span style={tag}>{scenario.symbol}</span>
                <span style={{ flex: 1, height: 1, background: tk.hair }} />
              </div>
              <div style={{ color: cardMuted, fontSize: '12px', marginTop: '8px', fontFamily: fontBody }}>
                Loading historical data for <span style={mono}>{scenario.startDate}</span> to <span style={mono}>{scenario.endDate}</span>...
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
              backgroundColor: cardBg2,
              borderRadius: tk.r,
              padding: '24px',
              border: `1px solid ${cardBorder}`,
              boxShadow: cardShadow
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '18px'
              }}>
                <Icon name="wallet" size={15} color={tk.gold} />
                <span style={label}>Your Portfolio</span>
                <span style={{ flex: 1, height: 1, background: tk.hair }} />
              </div>

              {/* Available Cash */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: `1px solid ${tk.hair}`
              }}>
                <span style={{ color: cardMuted, fontSize: '13px', fontFamily: fontBody }}>
                  Available Cash
                </span>
                <span style={{ ...mono, color: cardText, fontSize: '22px', fontWeight: 600 }}>
                  ${BEGINNER_BUDGET.toLocaleString()}
                </span>
              </div>

              {/* Current Price */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: `1px solid ${tk.hair}`
              }}>
                <span style={{ color: cardMuted, fontSize: '13px', fontFamily: fontBody }}>
                  Current Price (<span style={mono}>{asOfDate}</span>)
                </span>
                <span style={{ ...mono, color: cardText, fontSize: '16px', fontWeight: 600 }}>
                  ${scenario.initialPrice.toFixed(2)}
                </span>
              </div>

              {/* Maximum Shares */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '12px 0'
              }}>
                <div>
                  <div style={{ ...label, marginBottom: '4px' }}>
                    Maximum Shares You Can Buy
                  </div>
                  <div style={{
                    color: cardMuted,
                    fontSize: '11px',
                    fontStyle: 'italic',
                    fontFamily: fontBody
                  }}>
                    * This assumes you use all available cash
                  </div>
                </div>
                <div style={{ ...mono, color: cardText, fontSize: '16px', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {Math.floor(BEGINNER_BUDGET / scenario.initialPrice)} <span style={{ fontSize: '12px', color: cardMuted }}>shares</span>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Position Calculator */}
          {scenario.puzzleType !== 'buy' && position.hasPosition && (
            <div style={{
              backgroundColor: cardBg2,
              borderRadius: tk.r,
              padding: '24px',
              border: `1px solid ${cardBorder}`,
              boxShadow: cardShadow
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '18px'
              }}>
                <Icon name="wallet" size={15} color={tk.gold} />
                <span style={label}>Example Beginner Position</span>
                <span style={{ flex: 1, height: 1, background: tk.hair }} />
              </div>

              <div className="coach-position-grid">
                {/* Position Details */}
                <div>
                  <h4 style={{
                    ...label,
                    marginTop: 0,
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Icon name="chart" size={14} color={tk.gold} /> Position Details
                    <span style={{ flex: 1, height: 1, background: tk.hair }} />
                  </h4>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '9px 0',
                      borderBottom: `1px solid ${tk.hair}`
                    }}>
                      <span style={{ color: cardMuted, fontSize: '13px', fontWeight: '500', fontFamily: fontBody }}>
                        Budget
                      </span>
                      <span style={{ ...mono, color: cardText, fontSize: '15px', fontWeight: '600' }}>
                        ${BEGINNER_BUDGET.toLocaleString()}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '9px 0',
                      borderBottom: `1px solid ${tk.hair}`
                    }}>
                      <span style={{ color: cardMuted, fontSize: '13px', fontWeight: '500', fontFamily: fontBody }}>
                        Entry Date
                      </span>
                      <span style={{ ...mono, color: cardText, fontSize: '15px', fontWeight: '600' }}>
                        {position.entryDate}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '9px 0',
                      borderBottom: `1px solid ${tk.hair}`
                    }}>
                      <span style={{ color: cardMuted, fontSize: '13px', fontWeight: '500', fontFamily: fontBody }}>
                        Entry Price
                      </span>
                      <span style={{ ...mono, color: cardText, fontSize: '15px', fontWeight: '600' }}>
                        ${position.entryPrice.toFixed(2)}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '9px 0'
                    }}>
                      <span style={{ color: cardMuted, fontSize: '13px', fontWeight: '500', fontFamily: fontBody }}>
                        Shares Owned
                      </span>
                      <span style={{ ...mono, color: cardText, fontSize: '15px', fontWeight: '600' }}>
                        {position.shares}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowSharesCalculation(!showSharesCalculation)}
                    style={{
                      width: '100%',
                      padding: '11px 0',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'left'
                    }}
                  >
                    <span style={label}>
                      Calculation
                    </span>
                    <span style={{
                      color: cardMuted,
                      display: 'flex',
                      transform: showSharesCalculation ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}>
                      <Icon name="chevron-down" size={14} />
                    </span>
                  </button>
                  {showSharesCalculation && (
                    <div style={{ borderTop: `1px solid ${tk.hair}`, paddingTop: '12px' }}>
                      <div style={{
                        ...mono,
                        color: cardText,
                        fontSize: '13px',
                        lineHeight: '1.5'
                      }}>
                        Shares = floor(Budget ÷ Entry)<br/>
                        = floor(${BEGINNER_BUDGET} ÷ ${position.entryPrice.toFixed(2)})<br/>
                        = {position.shares}
                      </div>
                    </div>
                  )}
                </div>

                {/* P&L Performance */}
                <div>
                  <h4 style={{
                    ...label,
                    marginTop: 0,
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Icon name="trending-up" size={14} color={tk.gold} /> Performance as of <span style={{ ...mono, textTransform: 'none', letterSpacing: 'normal' }}>{asOfDate}</span>
                    <span style={{ flex: 1, height: 1, background: tk.hair }} />
                  </h4>
                  
                  {(() => {
                    const pl = getPL();
                    if (!pl) {
                      return (
                        <div style={{
                          textAlign: 'center',
                          color: cardMuted,
                          fontSize: '14px',
                          padding: '20px'
                        }}>
                          Loading P&L calculation...
                        </div>
                      );
                    }
                    
                    const plColor = pl.value >= 0 ? tk.up : tk.down;
                    const delta = (pl.currentPrice - position.entryPrice);
                    
                    return (
                      <div>
                        {/* Current Price */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 0',
                          borderBottom: `1px solid ${tk.hair}`
                        }}>
                          <span style={{ color: cardMuted, fontSize: '13px', fontFamily: fontBody }}>
                            Current Price
                          </span>
                          <span style={{ ...mono, color: cardText, fontSize: '16px', fontWeight: 600 }}>
                            ${pl.currentPrice.toFixed(2)}
                          </span>
                        </div>

                        {/* Price Change */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 0',
                          borderBottom: `1px solid ${tk.hair}`
                        }}>
                          <span style={{ color: cardMuted, fontSize: '13px', fontFamily: fontBody }}>
                            Price Change
                          </span>
                          <span style={{ ...mono, color: plColor, fontSize: '15px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Icon name={pl.value >= 0 ? 'tri-up' : 'tri-down'} size={9} />
                            ${delta.toFixed(2)} ({pl.pct.toFixed(2)}%)
                          </span>
                        </div>

                        {/* Total P&L — single inset row with subtle up/down tint */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '11px 14px',
                          margin: '12px 0',
                          backgroundColor: pl.value >= 0 ? tk.upBg : tk.downBg,
                          borderRadius: tk.rSm,
                          border: `1px solid ${plColor}33`
                        }}>
                          <span style={{ color: cardText, fontSize: '13px', fontWeight: 600 }}>
                            Total P&L
                          </span>
                          <span style={{ ...mono, color: plColor, fontSize: '18px', fontWeight: 700 }}>
                            ${pl.value.toFixed(2)}
                          </span>
                        </div>

                        {/* P&L Calculation */}
                        <button
                          onClick={() => setShowPLCalculation(!showPLCalculation)}
                          style={{
                            width: '100%',
                            padding: '11px 0',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            textAlign: 'left'
                          }}
                        >
                          <span style={label}>
                            P&L Calculation
                          </span>
                          <span style={{
                            color: cardMuted,
                            display: 'flex',
                            transform: showPLCalculation ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                          }}>
                            <Icon name="chevron-down" size={14} />
                          </span>
                        </button>
                        {showPLCalculation && (
                          <div style={{ borderTop: `1px solid ${tk.hair}`, paddingTop: '12px' }}>
                            <div style={{
                              ...mono,
                              color: cardText,
                              fontSize: '13px',
                              lineHeight: '1.5'
                            }}>
                              {position.shares} × (${pl.currentPrice.toFixed(2)} − ${position.entryPrice.toFixed(2)})<br/>
                              = {position.shares} × ${delta.toFixed(2)}<br/>
                              = ${pl.value.toFixed(2)}
                            </div>
                          </div>
                        )}
                        
                        <div style={{
                          marginTop: '12px',
                          color: cardMuted,
                          fontSize: '11px',
                          fontStyle: 'italic'
                        }}>
                          * As-of price uses the official historical close on <span style={{ ...mono, fontStyle: 'normal' }}>{asOfDate}</span>
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
          gap: '16px',
          minWidth: 0
        }}>
          {/* Chat Window */}
          <CoachChat
            scenario={scenario}
            enabled={bouncePhase === 'done' || bouncePhase === 'idle'}
            disabled={scenarioCompleted}
            messages={chatMessages}
            onSendMessage={sendMessage}
            onClearHistory={clearHistory}
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
            backgroundColor: cardBg2,
            borderRadius: tk.r,
            padding: '16px',
            border: `1px solid ${cardBorder}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '14px'
            }}>
              <Icon name="book" size={15} color={tk.gold} />
              <span style={label}>All Scenarios</span>
              <span style={{ flex: 1, height: 1, background: tk.hair }} />
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {HISTORICAL_SCENARIOS.map((scenario, index) => (
                <button
                  key={scenario.id}
                  onClick={() => {
                    setCurrentScenario(index);
                    resetScenario();
                  }}
                  style={{
                    padding: '11px 12px',
                    borderRadius: tk.rSm,
                    border: `1px solid ${currentScenario === index ? tk.goldHair : tk.hair}`,
                    backgroundColor: currentScenario === index ? marbleGold : 'transparent',
                    color: currentScenario === index ? marbleDarkGray : cardText,
                    fontWeight: currentScenario === index ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '13px',
                    textAlign: 'left',
                    fontFamily: fontBody,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span>{scenario.title}</span>
                  <span style={{
                    ...mono,
                    fontSize: '11px',
                    color: currentScenario === index ? marbleDarkGray : cardMuted
                  }}>
                    {scenario.symbol}
                  </span>
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
                    ...btnGhost,
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '12px'
                  }}
                >
                  <Icon name="refresh" size={13} /> Retry
                </button>
                
                {currentScenario < HISTORICAL_SCENARIOS.length - 1 && (
                  <button
                    onClick={nextScenario}
                    style={{
                      ...btnPrimary,
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '12px'
                    }}
                  >
                    Next <Icon name="arrow-right" size={13} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Past attempts — analyzed decisions persisted by the coach */}
          {pastDecisions.length > 0 && (
            <div style={{
              backgroundColor: cardBg2,
              borderRadius: tk.r,
              padding: '16px',
              border: `1px solid ${cardBorder}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '14px'
              }}>
                <Icon name="trophy" size={15} color={tk.gold} />
                <span style={label}>Past attempts</span>
                <span style={{ flex: 1, height: 1, background: tk.hair }} />
                <span style={{ ...mono, fontSize: 11, color: cardMuted }}>{pastDecisions.length}</span>
              </div>

              {pastDecisions.slice(0, 5).map((d) => {
                const score = typeof d.totalScore === 'number' ? d.totalScore : null;
                const scoreColor = score == null ? cardMuted : score >= 70 ? tk.up : score >= 40 ? tk.warn : tk.down;
                return (
                  <div key={d.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '9px 0',
                    borderBottom: `1px solid ${tk.hair}`
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: cardText,
                        fontFamily: fontBody,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {d.scenarioTitle || 'Scenario'}
                        {d.decision?.type && (
                          <span style={{ ...tag, marginLeft: 8, fontSize: 9.5 }}>{d.decision.type}</span>
                        )}
                      </div>
                      <div style={{ ...mono, fontSize: 10.5, color: cardMuted, marginTop: 3 }}>
                        {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''}
                        {d.demo ? ' · demo' : ''}
                      </div>
                    </div>
                    <div style={{ ...mono, fontSize: 15, fontWeight: 600, color: scoreColor, flexShrink: 0 }}>
                      {score == null ? '—' : `${score}/100`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AICoach;
