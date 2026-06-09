import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

// localStorage key for persisting the coach conversation across reloads
const HISTORY_STORAGE_KEY = 'tickr_coach_history';

// Safely read any previously saved conversation so a reload doesn't wipe it.
const loadPersistedMessages = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('Failed to load coach history from storage:', err);
    }
    return [];
  }
};

/**
 * Custom hook for managing AI Coach chat functionality
 *
 * @param {Object} scenario - The current trading scenario
 * @param {boolean} enabled - Whether chat is enabled (default: true)
 * @param {Object} [options]
 * @param {boolean} [options.persist=true] - Persist the transcript to localStorage.
 *   The component that owns the conversation should leave this on; a secondary
 *   (controlled) instance should pass false to avoid clobbering the shared key.
 * @returns {Object} Chat state and handlers
 */
export function useCoachChat(scenario, enabled = true, { persist = true } = {}) {
  const [chatMessages, setChatMessages] = useState(() => (persist ? loadPersistedMessages() : []));
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  // Persist the conversation to localStorage so a reload keeps the transcript.
  useEffect(() => {
    if (!persist || typeof window === 'undefined') return;
    try {
      if (chatMessages.length === 0) {
        window.localStorage.removeItem(HISTORY_STORAGE_KEY);
      } else {
        window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(chatMessages));
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('Failed to persist coach history to storage:', err);
      }
    }
  }, [chatMessages, persist]);

  // Initialize welcome message when scenario changes
  // Note: This is controlled externally via setChatMessages for bounce scenario logic
  useEffect(() => {
    if (!enabled || !scenario) return;
    
    // Only show welcome message if no messages exist
    if (chatMessages.length === 0) {
      const puzzleTypeHint = scenario?.puzzleType === 'buy' 
        ? 'Your challenge is to decide when to **enter** this trade. Consider factors like timing, entry price, and market conditions.'
        : scenario?.puzzleType === 'sell'
        ? 'Your challenge is to decide when to **exit** your position. Consider profit targets, risk management, and market signals.'
        : 'Your challenge is to make the best trading decision based on the scenario.';
      
      const welcomeMessage = {
        type: 'ai',
        content: `Welcome to the **${scenario?.title || 'Trading'}** challenge! 🎯\n\nI'm your AI trading coach, here to help you master trading through real historical scenarios.\n\n## What I Can Help With:\n• **Understanding market concepts** - Ask me about technical analysis, fundamentals, or market psychology\n• **Exploring this scenario** - I can explain key events, market conditions, and what traders were thinking\n• **Decision frameworks** - Learn how to evaluate opportunities and manage risk\n• **Historical context** - Understand what actually happened and why\n\n${puzzleTypeHint}\n\n**Feel free to ask me anything!** For example:\n• "What factors should I consider for this decision?"\n• "Can you explain [any trading concept]?"\n• "What was happening in the market during this scenario?"\n\n*Remember: I'm here to teach, not to tell you what to do. The best learning comes from understanding the "why" behind trading decisions.*`,
        timestamp: Date.now()
      };
      setChatMessages([welcomeMessage]);
    }
  }, [scenario?.id, enabled, chatMessages.length, setChatMessages]); // Only reset when scenario ID changes

  // Note: Auto-scroll is now handled in CoachChat component to avoid page scroll
  // This useEffect is intentionally minimal to prevent page nudging

  /**
   * Send a chat message to the AI coach
   * 
   * @param {string} message - The message to send (optional, uses userInput if not provided)
   */
  const sendMessage = async (message = null) => {
    const messageToSend = message || userInput.trim();
    if (!messageToSend || !scenario || !enabled) return;

    const userMessage = {
      type: 'user',
      content: messageToSend,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Backend expects: scenario.title, scenario.context, scenario.keyEvents
      // Merge top-level title with nested scenario properties
      let scenarioData;
      if (scenario?.scenario) {
        scenarioData = {
          title: scenario.title,
          ...scenario.scenario
        };
      } else {
        scenarioData = scenario;
      }
      
      const response = await api.sendCoachMessage({
        message: messageToSend,
        scenario: scenarioData,
        chatHistory: chatMessages
      });

      if (response && response.success) {
        const aiMessage = {
          type: 'ai',
          content: response.response || response.message || 'No response content',
          // Backend may flag responses generated without a live AI key.
          demo: response.demo === true || response.source === 'demo',
          timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, aiMessage]);
      } else {
        // More helpful fallback response based on error type
        let fallbackContent = "I'm here to help you learn about trading! Ask me about market psychology, technical analysis, risk management, or any trading concepts you'd like to understand better.";
        // Detect when the backend is running without an AI key so the UI can show a demo note.
        let isDemo = response?.demo === true || response?.source === 'demo';

        if (response?.error) {
          if (response.error.includes('not configured') || response.error.includes('503')) {
            fallbackContent = "I apologize, but the AI coach service isn't configured right now. Please check with the administrator to set up the AI service.";
            isDemo = true;
          } else if (response.error.includes('timeout')) {
            fallbackContent = "I apologize, but my response is taking longer than expected. Please try asking your question again in a moment.";
          } else {
            fallbackContent = `I'm having trouble connecting right now. ${response.error}. Please try again in a moment, or ask a different question.`;
          }
        }

        const fallbackMessage = {
          type: 'ai',
          content: fallbackContent,
          demo: isDemo,
          timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, fallbackMessage]);
        setError(response?.error || response?.message || 'Failed to get response');
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Chat error:', err.message);
      }

      // More helpful error message based on error type
      let errorContent = "I apologize, but I'm having trouble connecting right now. ";
      // A 503 / "not configured" response means there's no AI key — surface demo mode.
      let isDemo = false;

      if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        errorContent += "It looks like there's a network issue. Please check your internet connection and try again.";
      } else if (err.message.includes('timeout')) {
        errorContent += "The request timed out. Please try asking your question again - sometimes I need a moment to process complex questions.";
      } else if (err.message.includes('503') || err.message.includes('Service Unavailable') || err.message.includes('not configured')) {
        errorContent += "The AI coach isn't connected to a live AI service right now, so it's running in demo mode. You can still explore the scenario, charts, and decision tools.";
        isDemo = true;
      } else {
        errorContent += `Error: ${err.message || 'Unknown error'}. Please try again or rephrase your question.`;
      }

      const errorMessage = {
        type: 'ai',
        content: errorContent,
        demo: isDemo,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMessage]);
      setError(err.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add a message to the chat (for external use, e.g., decision analysis)
   * 
   * @param {Object} message - Message object with type and content
   */
  const addMessage = (message) => {
    if (!message || !message.content) return;
    const newMessage = {
      type: message.type || 'ai',
      content: message.content,
      timestamp: message.timestamp || Date.now()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  /**
   * Clear chat messages
   */
  const clearMessages = () => {
    setChatMessages([]);
    setError(null);
  };

  /**
   * Reset chat for a new scenario
   */
  const resetChat = () => {
    clearMessages();
    setUserInput('');
    setError(null);
  };

  /**
   * Clear the persisted conversation history (user-facing affordance).
   * Empties messages; the persistence effect removes the stored copy.
   */
  const clearHistory = () => {
    clearMessages();
    setUserInput('');
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(HISTORY_STORAGE_KEY);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('Failed to clear coach history from storage:', err);
        }
      }
    }
  };

  return {
    // State
    chatMessages,
    userInput,
    isLoading,
    error,
    chatEndRef,

    // Handlers
    sendMessage,
    addMessage,
    clearMessages,
    clearHistory,
    resetChat,
    setUserInput,
    setChatMessages
  };
}

