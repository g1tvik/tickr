import React from 'react';
import { fontBody } from '../fontPalette';

// ── Marble dark theme tokens (renders on the dark AI Coach page) ───────────────
const PANEL   = '#2f2f2f';                       // sidebar surface
const CARD    = '#343434';                        // nested order-form surface
const INSET   = '#2a2a2a';                        // deepest inset (info box / inputs)
const TEXT    = '#F4F1E9';                         // primary cream text
const MUTED   = '#b8b4a8';                         // muted / secondary text
const GOLD     = '#B69C60';
const GOLD_LT  = '#E6C87A';
const BORDER   = 'rgba(182, 156, 96, 0.22)';
const DIVIDER  = 'rgba(244, 241, 233, 0.12)';
const DARK_ON_GOLD = '#2C2C2C';
const DISABLED_BG = 'rgba(244, 241, 233, 0.06)';

/**
 * DecisionSidebar Component
 *
 * Displays the trading decision interface with order buttons and order form.
 * Handles order type selection, price input, reasoning, and submission.
 *
 * @typedef {Object} Scenario
 * @property {string} title - Scenario title
 * @property {string} puzzleType - 'buy' | 'sell' | 'hold'
 * @property {number} initialPrice - Initial price for the scenario
 *
 * @typedef {Object} DecisionSidebarProps
 * @property {Scenario} scenario - The current trading scenario
 * @property {boolean} scenarioCompleted - Whether the scenario has been completed
 * @property {string} orderType - Current order type ('buy' | 'sell' | 'hold' | 'limit-buy' | 'limit-sell' | '')
 * @property {string} orderPrice - Current order price value
 * @property {string} orderReasoning - Current order reasoning text
 * @property {boolean} showOrderForm - Whether to show the order form or action buttons
 * @property {number} beginnerBudget - Available budget for beginner positions (default: 1000)
 * @property {function(string): void} onOrderTypeChange - Callback when order type changes
 * @property {function(string): void} onOrderPriceChange - Callback when order price changes
 * @property {function(string): void} onOrderReasoningChange - Callback when order reasoning changes
 * @property {function(boolean): void} onShowOrderFormChange - Callback to show/hide order form
 * @property {function(): void} onSubmitDecision - Callback when decision is submitted
 * @property {function(): void} onCancelOrder - Callback when order form is cancelled
 *
 * @param {DecisionSidebarProps} props
 */
export function DecisionSidebar({
  scenario,
  scenarioCompleted = false,
  orderType = '',
  orderPrice = '',
  orderReasoning = '',
  showOrderForm = false,
  beginnerBudget = 1000,
  onOrderTypeChange,
  onOrderPriceChange,
  onOrderReasoningChange,
  onShowOrderFormChange,
  onSubmitDecision,
  onCancelOrder
}) {
  const puzzleType = scenario?.puzzleType || 'buy';

  const handleButtonClick = (type, price = '') => {
    onOrderTypeChange?.(type);
    onOrderPriceChange?.(price);
    onShowOrderFormChange?.(true);
  };

  const handleSubmit = () => {
    if (orderPrice && orderReasoning.trim()) {
      onSubmitDecision?.();
    }
  };

  const handleCancel = () => {
    onCancelOrder?.();
  };

  const getOrderFormTitle = () => {
    switch (orderType) {
      case 'buy':
        return '📈 Buy Order';
      case 'limit-buy':
        return '📋 Limit Buy Order';
      case 'sell':
        return '📉 Sell Order';
      case 'limit-sell':
        return '📋 Limit Sell Order';
      case 'hold':
        return '⏸️ Hold Decision';
      default:
        return '📊 Trading Decision';
    }
  };

  const calculateMaxShares = () => {
    const price = parseFloat(orderPrice || scenario?.initialPrice || 1);
    if (price <= 0) return 0;
    return Math.floor(beginnerBudget / price);
  };

  if (scenarioCompleted) {
    return null;
  }

  // Shared style for the primary action buttons (semantic colors kept).
  const actionBtn = (bg, color = '#FFFFFF') => ({
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: bg,
    color,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: fontBody
  });

  const disabledBtn = {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: `1px solid ${DIVIDER}`,
    backgroundColor: DISABLED_BG,
    color: MUTED,
    fontWeight: 'bold',
    cursor: 'not-allowed',
    fontSize: '14px',
    opacity: 0.7,
    fontFamily: fontBody
  };

  const fieldStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: `1px solid ${BORDER}`,
    background: INSET,
    color: TEXT,
    fontSize: '14px',
    fontFamily: fontBody,
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={{
      backgroundColor: PANEL,
      borderRadius: '20px',
      padding: '16px',
      border: `1px solid ${BORDER}`,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)'
    }}>
      <style>{`
        .coach-decision-field::placeholder { color: ${MUTED}; opacity: 0.7; }
      `}</style>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '700',
        color: TEXT,
        marginBottom: '16px',
        fontFamily: fontBody
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
          {puzzleType === 'buy' && (
            <>
              <button
                onClick={() => handleButtonClick('buy', scenario?.initialPrice?.toString() || '')}
                style={actionBtn('#22c55e')}
              >
                📈 Buy Now
              </button>

              <button
                onClick={() => handleButtonClick('limit-buy', '')}
                style={actionBtn('#3b82f6')}
              >
                📋 Buy When Price Hits...
              </button>
            </>
          )}

          {/* Sell buttons - only show for 'sell' challenges */}
          {puzzleType === 'sell' && (
            <>
              <button
                onClick={() => handleButtonClick('sell', scenario?.initialPrice?.toString() || '')}
                style={actionBtn('#ef4444')}
              >
                📉 Sell Now
              </button>

              <button
                onClick={() => handleButtonClick('limit-sell', '')}
                style={actionBtn('#f59e0b')}
              >
                📋 Sell When Price Hits...
              </button>
            </>
          )}

          {/* Hold button - always available */}
          <button
            onClick={() => handleButtonClick('hold', '0')}
            style={actionBtn(GOLD, DARK_ON_GOLD)}
          >
            ⏸️ Hold (Wait and Watch)
          </button>

          {/* Disabled buy buttons for sell challenges */}
          {puzzleType === 'sell' && (
            <>
              <button disabled style={disabledBtn}>
                📈 Buy Now (Not Available)
              </button>

              <button disabled style={disabledBtn}>
                📋 Buy When Price Hits... (Not Available)
              </button>
            </>
          )}

          {/* Disabled sell buttons for buy challenges */}
          {puzzleType === 'buy' && (
            <>
              <button disabled style={disabledBtn}>
                📉 Sell Now (Not Available)
              </button>

              <button disabled style={disabledBtn}>
                📋 Sell When Price Hits... (Not Available)
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{
          backgroundColor: CARD,
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${BORDER}`
        }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: TEXT,
            marginBottom: '12px',
            fontFamily: fontBody
          }}>
            {getOrderFormTitle()}
          </h4>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Portfolio info for buy orders */}
            {(orderType === 'buy' || orderType === 'limit-buy') && (
              <div style={{
                backgroundColor: INSET,
                borderRadius: '8px',
                padding: '12px',
                border: `1px solid ${DIVIDER}`,
                marginBottom: '8px'
              }}>
                <div style={{
                  color: MUTED,
                  fontSize: '12px',
                  fontWeight: '500',
                  marginBottom: '8px',
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
                  <span style={{ color: MUTED, fontSize: '12px', fontFamily: fontBody }}>
                    Available Cash:
                  </span>
                  <span style={{ color: TEXT, fontSize: '14px', fontWeight: '600', fontFamily: fontBody }}>
                    ${beginnerBudget.toLocaleString()}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: MUTED, fontSize: '12px', fontFamily: fontBody }}>
                    Max Shares at ${orderPrice || scenario?.initialPrice}:
                  </span>
                  <span style={{ color: GOLD_LT, fontSize: '14px', fontWeight: '600', fontFamily: fontBody }}>
                    {calculateMaxShares()} shares
                  </span>
                </div>
              </div>
            )}

            <div>
              <label style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: TEXT,
                marginBottom: '4px',
                display: 'block',
                fontFamily: fontBody
              }}>
                Price: ${orderPrice}
              </label>
              <input
                type="number"
                className="coach-decision-field"
                value={orderPrice}
                onChange={(e) => onOrderPriceChange?.(e.target.value)}
                placeholder="Enter price..."
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: TEXT,
                marginBottom: '4px',
                display: 'block',
                fontFamily: fontBody
              }}>
                Reasoning:
              </label>
              <textarea
                className="coach-decision-field"
                value={orderReasoning}
                onChange={(e) => onOrderReasoningChange?.(e.target.value)}
                placeholder="Explain your decision..."
                style={{ ...fieldStyle, minHeight: '60px', resize: 'vertical' }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={handleSubmit}
                disabled={!orderPrice || !orderReasoning.trim()}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: GOLD,
                  color: DARK_ON_GOLD,
                  fontWeight: '700',
                  cursor: !orderPrice || !orderReasoning.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  opacity: !orderPrice || !orderReasoning.trim() ? 0.5 : 1,
                  fontFamily: fontBody
                }}
              >
                ✅ Submit Decision
              </button>
              <button
                onClick={handleCancel}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${DIVIDER}`,
                  backgroundColor: 'transparent',
                  color: MUTED,
                  fontWeight: '600',
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
  );
}
