import React from 'react';
import { useCoachChat } from '../hooks/useCoachChat';
import { white, lightGray, gray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';

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

  html = html.replace(/^###\s?(.*)$/gim, '<h3>$1</h3>');
  html = html.replace(/^##\s?(.*)$/gim, '<h2>$1</h2>');
  html = html.replace(/^#\s?(.*)$/gim, '<h1>$1</h1>');

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

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
    .replace(/<p>/g, '<p style="margin:0 0 8px 0;">');
};

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
  isLoading = false,
  error = null
}) {
  // If props are provided (controlled mode), use them. Otherwise use internal hook (uncontrolled mode).
  const internalHook = useCoachChat(scenario, enabled);
  
  const isControlled = messages !== null;
  
  const displayMessages = isControlled ? messages : internalHook.chatMessages;
  const sendMessage = isControlled ? onSendMessage : internalHook.sendMessage;
  const loading = isControlled ? isLoading : internalHook.isLoading;
  const displayError = isControlled ? error : internalHook.error;
  
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

  return (
    <div style={{
      backgroundColor: lightGray,
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
              <div
                className="coach-message-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
              />
            </div>
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

