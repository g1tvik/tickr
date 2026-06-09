import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useCoachChat } from '../hooks/useCoachChat';
import { fontHeading, fontBody } from '../fontPalette';

// ── Marble dark theme tokens (chat renders on the dark AI Coach page) ──────────
const PANEL    = '#2f2f2f';                       // chat panel surface
const FIELD    = '#262626';                        // message scroll area (inset)
const AI_BUBBLE = '#3a3a3a';                        // assistant message bubble
const INPUT_BG = '#343434';                        // composer input surface
const TEXT     = '#F4F1E9';                         // primary cream text
const MUTED    = '#b8b4a8';                         // muted / secondary text
const GOLD      = '#B69C60';
const GOLD_LT   = '#E6C87A';
const BORDER    = 'rgba(182, 156, 96, 0.22)';
const DIVIDER   = 'rgba(244, 241, 233, 0.12)';
const DARK_ON_GOLD = '#2C2C2C';                     // text on gold bubbles/button

/**
 * CoachChat Component
 *
 * Displays the chat transcript UI for the AI Trading Coach.
 * Handles message display, input, and auto-scrolling.
 *
 * @param {Object} props
 * @param {Object} props.scenario - The current trading scenario
 * @param {boolean} props.enabled - Whether chat is enabled (default: true)
 * @param {boolean} props.disabled - Whether chat input is disabled (e.g., scenario completed)
 * @param {string} props.placeholder - Custom placeholder text for input
 * @param {Function} props.onMessageSent - Callback when a message is sent
 * @param {Function} props.onError - Callback when an error occurs
 * @param {Function} props.onClearHistory - Callback to clear the persisted conversation
 */
export function CoachChat({
  scenario,
  enabled = true,
  disabled = false,
  placeholder = null,
  onMessageSent = null,
  onError = null,
  messages = null,
  onSendMessage = null,
  onClearHistory = null,
  isLoading = false,
  error = null
}) {
  // If props are provided (controlled mode), use them. Otherwise use internal hook (uncontrolled mode).
  // Skip persistence here: when controlled, the parent owns (and persists) the conversation.
  const isControlled = messages !== null;
  const internalHook = useCoachChat(scenario, enabled, { persist: !isControlled });

  const displayMessages = isControlled ? messages : internalHook.chatMessages;
  const sendMessage = isControlled ? onSendMessage : internalHook.sendMessage;
  const loading = isControlled ? isLoading : internalHook.isLoading;
  const displayError = isControlled ? error : internalHook.error;
  const clearHistory = isControlled ? onClearHistory : internalHook.clearHistory;

  const [internalInput, setInternalInput] = React.useState('');
  const userInput = isControlled ? internalInput : internalHook.userInput;
  const setUserInput = isControlled ? setInternalInput : internalHook.setUserInput;

  const chatContainerRef = React.useRef(null);
  const chatEndRef = React.useRef(null);

  // Notify parent of errors
  React.useEffect(() => {
    if (displayError && onError) {
      onError(displayError);
    }
  }, [displayError, onError]);

  // Auto-scroll when messages change or loading state changes
  React.useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    // Always scroll to bottom on new messages or loading state to ensure visibility
    setTimeout(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  }, [displayMessages, loading]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || disabled || !enabled) return;

    await sendMessage(userInput);

    if (isControlled) {
      setUserInput('');
    }

    if (onMessageSent) {
      onMessageSent(userInput);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const defaultPlaceholder = scenario
    ? `Ask about ${scenario.symbol}, ${scenario.puzzleType?.toUpperCase()} puzzle, or any trading concept...`
    : 'Ask me about trading...';

  // The coach is in demo mode when the backend has no live AI key configured.
  const isDemoMode = displayMessages.some((m) => m && m.demo);
  const canClearHistory = typeof clearHistory === 'function' && displayMessages.length > 0;

  const handleClearHistory = () => {
    if (!canClearHistory) return;
    clearHistory();
  };

  return (
    <div style={{
      backgroundColor: PANEL,
      borderRadius: '20px',
      padding: '16px',
      height: '500px',
      display: 'flex',
      flexDirection: 'column',
      border: `1px solid ${BORDER}`,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)'
    }}>
      {/* Scoped styles: typing dots + markdown rhythm inside AI bubbles */}
      <style>{`
        @keyframes coachDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40%           { transform: translateY(-4px); opacity: 1; }
        }
        .coach-message-content > *:first-child { margin-top: 0; }
        .coach-message-content > *:last-child { margin-bottom: 0; }
        .coach-message-content p { margin: 0 0 8px; }
        .coach-message-content h1,
        .coach-message-content h2,
        .coach-message-content h3 {
          font-size: 14px; font-weight: 700; margin: 12px 0 6px; color: ${TEXT};
        }
        .coach-message-content ul,
        .coach-message-content ol { margin: 6px 0; padding-left: 18px; }
        .coach-message-content li { margin-bottom: 4px; }
        .coach-message-content strong { color: ${GOLD_LT}; }
        .coach-message-content code {
          background: rgba(244,241,233,0.10); padding: 1px 5px;
          border-radius: 5px; font-size: 12px;
        }
        .coach-message-content hr { border: none; border-top: 1px solid ${DIVIDER}; margin: 10px 0; }
        .coach-message-content a { color: ${GOLD_LT}; }
      `}</style>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '400',
          color: TEXT,
          margin: 0,
          fontFamily: fontHeading,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          letterSpacing: '-0.01em'
        }}>
          <span aria-hidden="true" style={{ color: GOLD }}>◆</span>
          AI Trading Coach
        </h3>
        <button
          type="button"
          onClick={handleClearHistory}
          disabled={!canClearHistory}
          aria-label="Clear chat history"
          title="Clear chat history"
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: `1px solid ${DIVIDER}`,
            backgroundColor: 'transparent',
            color: MUTED,
            fontSize: '12px',
            fontWeight: '600',
            fontFamily: fontBody,
            cursor: canClearHistory ? 'pointer' : 'not-allowed',
            opacity: canClearHistory ? 1 : 0.5,
            transition: 'border-color 0.2s ease, color 0.2s ease'
          }}
        >
          Clear chat
        </button>
      </div>

      {isDemoMode && (
        <div
          role="status"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            alignSelf: 'flex-start',
            marginBottom: '12px',
            padding: '4px 10px',
            borderRadius: '999px',
            backgroundColor: 'rgba(182, 156, 96, 0.12)',
            border: '1px solid rgba(182, 156, 96, 0.35)',
            color: GOLD_LT,
            fontSize: '11px',
            fontWeight: '600',
            fontFamily: fontBody
          }}
        >
          ● Demo mode — coach running without a live AI key
        </div>
      )}

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '14px',
          padding: '12px',
          backgroundColor: FIELD,
          borderRadius: '14px',
          border: `1px solid ${DIVIDER}`
        }}>
        {displayMessages.length === 0 && !loading && (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: MUTED,
            padding: '24px'
          }}>
            <div aria-hidden="true" style={{
              width: '44px', height: '44px', borderRadius: '50%',
              display: 'grid', placeItems: 'center', marginBottom: '12px',
              background: 'rgba(182,156,96,0.14)', border: `1px solid ${BORDER}`,
              color: GOLD_LT, fontSize: '20px'
            }}>◆</div>
            <div style={{ color: TEXT, fontSize: '15px', fontWeight: 600, marginBottom: '4px', fontFamily: fontHeading }}>
              Ask your trading coach
            </div>
            <div style={{ fontSize: '12px', lineHeight: 1.5, maxWidth: '240px' }}>
              Questions about the scenario, a strategy, or any market concept — go ahead.
            </div>
          </div>
        )}
        {displayMessages.map((message, index) => {
          const isUser = message.type === 'user';
          return (
            <div key={index} style={{
              marginBottom: '12px',
              display: 'flex',
              justifyContent: isUser ? 'flex-end' : 'flex-start'
            }}>
              <div style={{ maxWidth: '85%', textAlign: 'left' }}>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '9px 13px',
                    borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: isUser
                      ? `linear-gradient(180deg, ${GOLD_LT} 0%, ${GOLD} 100%)`
                      : AI_BUBBLE,
                    color: isUser ? DARK_ON_GOLD : TEXT,
                    border: isUser ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    fontSize: '14px',
                    lineHeight: '1.45',
                    fontFamily: fontBody,
                    boxShadow: isUser ? '0 4px 14px rgba(182,156,96,0.20)' : 'none'
                  }}
                >
                  <div className="coach-message-content">
                    <ReactMarkdown>{message.content || ''}</ReactMarkdown>
                  </div>
                </div>
                {message.type === 'ai' && message.demo && (
                  <div style={{
                    marginTop: '4px',
                    fontSize: '11px',
                    fontStyle: 'italic',
                    color: GOLD,
                    fontFamily: fontBody
                  }}>
                    Demo response — no live AI key configured.
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '11px 14px',
              borderRadius: '14px 14px 14px 4px',
              backgroundColor: AI_BUBBLE,
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: GOLD_LT,
                    display: 'inline-block',
                    animation: `coachDot 1.2s ${i * 0.16}s infinite ease-in-out`
                  }}
                />
              ))}
              <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                AI is thinking
              </span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      {!disabled && enabled && (
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder || defaultPlaceholder}
            aria-label="Ask the AI trading coach a question"
            disabled={loading}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: '999px',
              border: `1px solid ${BORDER}`,
              background: INPUT_BG,
              color: TEXT,
              fontSize: '14px',
              fontFamily: fontBody,
              outline: 'none',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'text'
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !userInput.trim()}
            aria-label="Send message to AI coach"
            title="Send"
            style={{
              flexShrink: 0,
              width: '40px',
              height: '40px',
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              border: 'none',
              background: `linear-gradient(180deg, ${GOLD_LT} 0%, ${GOLD} 100%)`,
              color: DARK_ON_GOLD,
              cursor: loading || !userInput.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !userInput.trim() ? 0.5 : 1,
              transition: 'filter 0.2s ease, opacity 0.2s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      )}

      {displayError && (
        <div style={{
          marginTop: '8px',
          padding: '9px 12px',
          backgroundColor: 'rgba(239, 68, 68, 0.10)',
          border: '1px solid rgba(239, 68, 68, 0.30)',
          borderRadius: '8px',
          color: '#f0a9a4',
          fontSize: '12px',
          fontFamily: fontBody
        }}>
          ⚠️ {displayError}
        </div>
      )}
    </div>
  );
}
