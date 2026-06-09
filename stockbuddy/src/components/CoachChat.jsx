import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useCoachChat } from '../hooks/useCoachChat';
import { white, lightGray, gray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';

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
      backgroundColor: lightGray,
      borderRadius: '20px',
      padding: '16px',
      height: '500px',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid rgba(42, 69, 128, 0.06)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: marbleDarkGray,
          margin: 0,
          fontFamily: fontHeading
        }}>
          💬 AI Trading Coach
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
            border: `1px solid ${gray}`,
            backgroundColor: 'transparent',
            color: gray,
            fontSize: '12px',
            fontWeight: '600',
            fontFamily: fontBody,
            cursor: canClearHistory ? 'pointer' : 'not-allowed',
            opacity: canClearHistory ? 1 : 0.5
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
            color: marbleGold,
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
        marginBottom: '16px',
        padding: '8px',
        backgroundColor: white,
        borderRadius: '12px'
      }}>
        {displayMessages.map((message, index) => (
          <div key={index} style={{
            marginBottom: '12px',
            textAlign: message.type === 'user' ? 'right' : 'left'
          }}>
            <div
              style={{
              display: 'inline-block',
              maxWidth: '80%',
              padding: '8px 12px',
              borderRadius: '12px',
              backgroundColor: message.type === 'user' ? marbleGold : lightGray,
              color: message.type === 'user' ? marbleDarkGray : marbleDarkGray,
              fontSize: '14px',
              lineHeight: '1.4',
              fontFamily: fontBody
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
                color: marbleGold,
                fontFamily: fontBody
              }}>
                Demo response — no live AI key configured.
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{
            textAlign: 'left',
            marginBottom: '12px'
          }}>
            <div style={{
              display: 'inline-block',
              padding: '8px 12px',
              borderRadius: '12px',
              backgroundColor: lightGray,
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
      {!disabled && enabled && (
        <div style={{
          display: 'flex',
          gap: '8px'
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
              padding: '8px 12px',
              borderRadius: '8px',
              border: '2px solid #e0e0e0',
              fontSize: '14px',
              fontFamily: fontBody,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'text'
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !userInput.trim()}
            aria-label="Send message to AI coach"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: marbleGold,
              color: marbleDarkGray,
              fontWeight: 'bold',
              cursor: loading || !userInput.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontFamily: fontBody,
              opacity: loading || !userInput.trim() ? 0.6 : 1
            }}
          >
            Send
          </button>
        </div>
      )}

      {displayError && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '8px',
          color: '#991b1b',
          fontSize: '12px',
          fontFamily: fontBody
        }}>
          ⚠️ {displayError}
        </div>
      )}
    </div>
  );
}

