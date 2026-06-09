import React from 'react';
import tk, { label, mono, panel, inset, heading, btnPrimary, btnGhost } from '../theme/terminal';
import Icon from './Icon';

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
        return 'Buy Order';
      case 'limit-buy':
        return 'Limit Buy Order';
      case 'sell':
        return 'Sell Order';
      case 'limit-sell':
        return 'Limit Sell Order';
      case 'hold':
        return 'Hold Decision';
      default:
        return 'Trading Decision';
    }
  };

  const getOrderFormIcon = () => {
    switch (orderType) {
      case 'buy':
        return 'trending-up';
      case 'limit-buy':
        return 'target';
      case 'sell':
        return 'trending-down';
      case 'limit-sell':
        return 'target';
      case 'hold':
        return 'pause';
      default:
        return 'chart';
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

  // Solid semantic CTA (market buy / sell) — dark ink on the up/down accent.
  const solidBtn = (accent) => ({
    width: '100%',
    padding: '11px 14px',
    borderRadius: `${tk.rSm}px`,
    border: 'none',
    background: accent,
    color: '#1F1F1F',
    fontFamily: tk.fontBody,
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.02em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  });

  // Ghost action — hairline border, accent-colored label (limit orders, hold).
  const ghostBtn = (accent) => ({
    width: '100%',
    padding: '11px 14px',
    borderRadius: `${tk.rSm}px`,
    border: `1px solid ${tk.hairStrong}`,
    background: 'transparent',
    color: accent,
    fontFamily: tk.fontBody,
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.02em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  });

  const disabledBtn = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: `${tk.rSm}px`,
    border: `1px solid ${tk.hair}`,
    background: 'transparent',
    color: tk.faint,
    fontFamily: tk.fontBody,
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.02em',
    cursor: 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  };

  const fieldStyle = {
    ...inset,
    width: '100%',
    padding: '10px 12px',
    color: tk.text,
    fontSize: '14px',
    fontFamily: tk.fontBody,
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ ...panel, padding: '18px' }}>
      <style>{`
        .coach-decision-field::placeholder { color: ${tk.muted}; opacity: 0.7; }
      `}</style>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <span style={label}>your trading decision</span>
        <span style={{ flex: 1, height: 1, background: tk.hair }} />
      </div>

      {!showOrderForm ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Buy buttons - only show for 'buy' challenges */}
          {puzzleType === 'buy' && (
            <>
              <button
                onClick={() => handleButtonClick('buy', scenario?.initialPrice?.toString() || '')}
                style={solidBtn(tk.up)}
              >
                <Icon name="trending-up" size={15} /> Buy Now
              </button>

              <button
                onClick={() => handleButtonClick('limit-buy', '')}
                style={ghostBtn(tk.up)}
              >
                <Icon name="target" size={15} /> Buy When Price Hits...
              </button>
            </>
          )}

          {/* Sell buttons - only show for 'sell' challenges */}
          {puzzleType === 'sell' && (
            <>
              <button
                onClick={() => handleButtonClick('sell', scenario?.initialPrice?.toString() || '')}
                style={solidBtn(tk.down)}
              >
                <Icon name="trending-down" size={15} /> Sell Now
              </button>

              <button
                onClick={() => handleButtonClick('limit-sell', '')}
                style={ghostBtn(tk.down)}
              >
                <Icon name="target" size={15} /> Sell When Price Hits...
              </button>
            </>
          )}

          {/* Hold button - always available */}
          <button
            onClick={() => handleButtonClick('hold', '0')}
            style={ghostBtn(tk.gold)}
          >
            <Icon name="pause" size={15} /> Hold (Wait and Watch)
          </button>

          {/* Disabled buy buttons for sell challenges */}
          {puzzleType === 'sell' && (
            <>
              <button disabled style={disabledBtn}>
                <Icon name="trending-up" size={15} /> Buy Now (Not Available)
              </button>

              <button disabled style={disabledBtn}>
                <Icon name="target" size={15} /> Buy When Price Hits... (Not Available)
              </button>
            </>
          )}

          {/* Disabled sell buttons for buy challenges */}
          {puzzleType === 'buy' && (
            <>
              <button disabled style={disabledBtn}>
                <Icon name="trending-down" size={15} /> Sell Now (Not Available)
              </button>

              <button disabled style={disabledBtn}>
                <Icon name="target" size={15} /> Sell When Price Hits... (Not Available)
              </button>
            </>
          )}
        </div>
      ) : (
        <div>
          {/* Order form header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Icon name={getOrderFormIcon()} size={15} color={tk.gold} />
            <span style={{ ...heading, fontSize: 15 }}>{getOrderFormTitle()}</span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Portfolio info for buy orders */}
            {(orderType === 'buy' || orderType === 'limit-buy') && (
              <div style={{ ...inset, padding: '12px', marginBottom: '4px' }}>
                <div style={{ ...label, marginBottom: 10 }}>
                  portfolio info
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '6px'
                }}>
                  <span style={{ color: tk.muted, fontSize: '12px', fontFamily: tk.fontBody }}>
                    Available cash
                  </span>
                  <span style={{ ...mono, color: tk.text, fontSize: '13px', fontWeight: 600 }}>
                    ${beginnerBudget.toLocaleString()}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline'
                }}>
                  <span style={{ color: tk.muted, fontSize: '12px', fontFamily: tk.fontBody }}>
                    Max shares @ <span style={{ ...mono }}>${orderPrice || scenario?.initialPrice}</span>
                  </span>
                  <span style={{ ...mono, color: tk.goldBright, fontSize: '13px', fontWeight: 600 }}>
                    {calculateMaxShares()} shares
                  </span>
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>
                <span style={label}>price</span>
                <span style={{ ...mono, fontSize: '12px', color: tk.muted, marginLeft: 8, textTransform: 'none' }}>
                  ${orderPrice}
                </span>
              </label>
              <input
                type="number"
                className="coach-decision-field"
                value={orderPrice}
                onChange={(e) => onOrderPriceChange?.(e.target.value)}
                placeholder="Enter price..."
                style={{ ...fieldStyle, ...mono }}
              />
            </div>

            <div>
              <label style={{ ...label, display: 'block', marginBottom: '6px' }}>
                reasoning
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
                  ...btnPrimary,
                  flex: 1,
                  padding: '10px',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: !orderPrice || !orderReasoning.trim() ? 'not-allowed' : 'pointer',
                  opacity: !orderPrice || !orderReasoning.trim() ? 0.5 : 1
                }}
              >
                <Icon name="check" size={14} /> Submit Decision
              </button>
              <button
                onClick={handleCancel}
                style={{
                  ...btnGhost,
                  flex: 1,
                  padding: '10px',
                  fontSize: '12px',
                  color: tk.muted,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Icon name="x" size={14} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
