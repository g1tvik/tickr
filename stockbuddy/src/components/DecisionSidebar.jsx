import React from 'react';
import { white, lightGray, gray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontBody } from '../fontPalette';

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

  return (
    <div style={{
      backgroundColor: lightGray,
      borderRadius: '20px',
      padding: '16px',
      border: '1px solid rgba(42, 69, 128, 0.06)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: marbleDarkGray,
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
                onClick={() => handleButtonClick('limit-buy', '')}
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
          {puzzleType === 'sell' && (
            <>
              <button
                onClick={() => handleButtonClick('sell', scenario?.initialPrice?.toString() || '')}
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
                onClick={() => handleButtonClick('limit-sell', '')}
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
            onClick={() => handleButtonClick('hold', '0')}
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
          {puzzleType === 'sell' && (
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
          {puzzleType === 'buy' && (
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
          backgroundColor: white,
          borderRadius: '12px',
          padding: '16px'
        }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: marbleDarkGray,
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
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                marginBottom: '8px'
              }}>
                <div style={{
                  color: gray,
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
                  <span style={{ color: gray, fontSize: '12px', fontFamily: fontBody }}>
                    Available Cash:
                  </span>
                  <span style={{ color: marbleDarkGray, fontSize: '14px', fontWeight: '600', fontFamily: fontBody }}>
                    ${beginnerBudget.toLocaleString()}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: gray, fontSize: '12px', fontFamily: fontBody }}>
                    Max Shares at ${orderPrice || scenario?.initialPrice}:
                  </span>
                  <span style={{ color: marbleDarkGray, fontSize: '14px', fontWeight: '600', fontFamily: fontBody }}>
                    {calculateMaxShares()} shares
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
                display: 'block',
                fontFamily: fontBody
              }}>
                Price: ${orderPrice}
              </label>
              <input
                type="number"
                value={orderPrice}
                onChange={(e) => onOrderPriceChange?.(e.target.value)}
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
                display: 'block',
                fontFamily: fontBody
              }}>
                Reasoning:
              </label>
              <textarea
                value={orderReasoning}
                onChange={(e) => onOrderReasoningChange?.(e.target.value)}
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
                onClick={handleSubmit}
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
                  opacity: !orderPrice || !orderReasoning.trim() ? 0.6 : 1,
                  fontFamily: fontBody
                }}
              >
                ✅ Submit Decision
              </button>
              <button
                onClick={handleCancel}
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
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

