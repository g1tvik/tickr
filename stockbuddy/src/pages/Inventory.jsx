import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { fontBody } from '../fontPalette';
import { useSEO } from '../lib/seo';
import tk, { label, mono, panel, heading, btnPrimary, tag } from '../theme/terminal';
import Icon from '../components/Icon';

const defaultInventoryState = {
  purchasedItems: [],
  skipTokens: 0,
  streakFreezes: 0,
  learningProgress: {
    xp: 0,
    coins: 0
  },
  activeEffects: {}
};

export default function Inventory() {
  useSEO({ title: 'Inventory' });
  const navigate = useNavigate();
  // Terminal Editorial theme bindings (charcoal + cream + restrained gold).
  const pageBg = tk.bg;
  const cardBg = tk.raised;
  const cardBg2 = tk.surface;
  const cardText = tk.text;
  const cardMuted = tk.muted;
  const cardDivider = tk.hair;
  const [inventoryData, setInventoryData] = useState(defaultInventoryState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [usingItemId, setUsingItemId] = useState(null);
  const [activeEffects, setActiveEffects] = useState({});

  useEffect(() => {
    fetchInventory();
    // Set up interval to refresh active effects every 30 seconds to show updated remaining duration
    const interval = setInterval(() => {
      fetchActiveEffects();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveEffects = async () => {
    try {
      const response = await api.getActiveEffects();
      if (response.success) {
        setActiveEffects(response.activeEffects || {});
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Inventory: Error fetching active effects:', err);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      if (import.meta.env.DEV) console.log('Inventory: Fetching user data...');
      const [userDataResponse, activeEffectsResponse] = await Promise.all([
        api.getUserData(),
        api.getActiveEffects()
      ]);

      if (import.meta.env.DEV) {
        console.log('Inventory: User data received:', userDataResponse);
        console.log('Inventory: Active effects received:', activeEffectsResponse);
      }

      const activeEffectsData = activeEffectsResponse.success 
        ? (activeEffectsResponse.activeEffects || {})
        : (userDataResponse.activeEffects || {});

      setInventoryData({
        purchasedItems: userDataResponse.purchasedItems || [],
        skipTokens: userDataResponse.skipTokens || 0,
        streakFreezes: userDataResponse.streakFreezes || 0,
        learningProgress: userDataResponse.learningProgress || { xp: 0, coins: 0 },
        activeEffects: activeEffectsData
      });
      setActiveEffects(activeEffectsData);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Inventory: Error fetching data:', err);
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const resolvePurchaseId = (item) => {
    if (!item) return undefined;
    if (item.id) return item.id;
    if (typeof item.itemId === 'number') return item.itemId.toString();
    return item.itemId;
  };

  const getItemIcon = (itemType, effectType) => {
    switch (itemType) {
      case 'booster':
        return 'bolt';
      case 'utility':
        switch (effectType) {
          case 'instant_xp': return 'gift';
          case 'skip_token': return 'skip-forward';
          case 'streak_freeze': return 'shield';
          case 'instant_coins': return 'wallet';
          default: return 'settings';
        }
      default:
        return 'box';
    }
  };

  const getItemDescription = (item) => {
    switch (item.effect?.type) {
      case 'xp_multiplier': {
        const bonusPercent = Math.round((item.effect.multiplier - 1) * 100);
        return `Get ${bonusPercent}% more XP for ${item.effect.lessonsRemaining} lessons.`;
      }
      case 'coin_multiplier': {
        const bonusPercent = Math.round((item.effect.multiplier - 1) * 100);
        return `Get ${bonusPercent}% more coins for ${item.effect.lessonsRemaining} lessons.`;
      }
      case 'instant_xp':
        return `Grant ${item.effect.amount} XP when activated.`;
      case 'skip_token':
        return `Skip any lesson while maintaining progress.`;
      case 'streak_freeze':
        return `Protect your learning streak for ${item.effect.days} days.`;
      case 'instant_coins':
        return `Grant ${item.effect.amount} coins when activated.`;
      default:
        return 'Special item effect';
    }
  };

  const formatDurationLabel = (durationMs = 0) => {
    if (!durationMs) return '';
    const oneDay = 24 * 60 * 60 * 1000;
    if (durationMs % oneDay === 0) {
      const days = Math.round(durationMs / oneDay);
      return `${days} day${days === 1 ? '' : 's'}`;
    }
    const hours = Math.round(durationMs / (60 * 60 * 1000));
    if (hours >= 1) {
      return `${hours} hour${hours === 1 ? '' : 's'}`;
    }
    const minutes = Math.max(1, Math.round(durationMs / (60 * 1000)));
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  };

  // Find matching active effect for a purchased item
  const findActiveEffectForItem = (item) => {
    if (!item || item.itemType !== 'booster') return null;
    
    // Look for active effects that match this item's effect type
    const effectType = item.effect?.type;
    if (!effectType) return null;

    // Find the most recent active effect of this type
    let matchingEffect = null;
    let latestActivatedAt = null;

    Object.values(activeEffects).forEach(effect => {
      if (effect.type === effectType) {
        const activatedAt = effect.activatedAt ? new Date(effect.activatedAt).getTime() : 0;
        if (!latestActivatedAt || activatedAt > latestActivatedAt) {
          latestActivatedAt = activatedAt;
          matchingEffect = effect;
        }
      }
    });

    return matchingEffect;
  };

  // Calculate remaining time for an active effect
  const getRemainingTime = (effect) => {
    if (!effect || !effect.expiresAt) return null;
    
    const now = new Date();
    const expiresAt = new Date(effect.expiresAt);
    const remaining = expiresAt.getTime() - now.getTime();
    
    if (remaining <= 0) return null;
    return remaining;
  };

  const getItemStatus = (item) => {
    if (!item) return 'Ready';

    // Check if there's an active effect for this booster
    if (item.itemType === 'booster') {
      const activeEffect = findActiveEffectForItem(item);
      if (activeEffect) {
        const remainingTime = getRemainingTime(activeEffect);
        const lessonsRemaining = activeEffect.lessonsRemaining || 0;
        
        if (remainingTime && remainingTime > 0) {
          const remainingLabel = formatDurationLabel(remainingTime);
          if (lessonsRemaining > 0) {
            return `Active · ${remainingLabel} left · ${lessonsRemaining} lesson${lessonsRemaining === 1 ? '' : 's'} remaining`;
          }
          return `Active · ${remainingLabel} left`;
        } else if (lessonsRemaining > 0) {
          return `Active · ${lessonsRemaining} lesson${lessonsRemaining === 1 ? '' : 's'} remaining`;
        }
        return 'Active';
      }
    }

    // Fallback to item's own status
    if (item.active) {
      if (item.effect?.type === 'streak_freeze') {
        return `Activated for ${item.effect.days} day${item.effect.days === 1 ? '' : 's'}`;
      }
      if (item.effect?.duration) {
        return `Activated for ${formatDurationLabel(item.effect.duration)}`;
      }
      if (item.effect?.lessonsRemaining) {
        return `Activated · ${item.effect.lessonsRemaining} lessons remaining`;
      }
      return 'Activated';
    }

    if (item.consumed) {
      return 'Used';
    }

    return 'Ready to use';
  };

  const getStatusColor = (item) => {
    if (!item) return cardText;
    
    // Check if there's an active effect for boosters
    if (item.itemType === 'booster') {
      const activeEffect = findActiveEffectForItem(item);
      if (activeEffect) {
        return tk.up; // active
      }
    }

    if (item.active) return tk.up;
    if (item.consumed) return tk.faint;
    return cardText;
  };

  const isItemUsable = (item) => {
    const purchaseId = resolvePurchaseId(item);
    if (!purchaseId) return false;
    
    // If item is consumed, it can't be used again
    if (item?.consumed) return false;
    
    // If item is marked as active (but not consumed), it can't be used
    if (item?.active) return false;
    
    // Item is ready to use
    return true;
  };

  const handleUseItem = async (purchaseId) => {
    setError(null);
    setMessage(null);
    setUsingItemId(purchaseId);

    try {
      const response = await api.useInventoryItem(purchaseId);
      if (import.meta.env.DEV) console.log('Inventory: Item used response:', response);

      // Refresh active effects to get updated remaining duration
      const activeEffectsResponse = await api.getActiveEffects();
      const updatedActiveEffects = activeEffectsResponse.success 
        ? (activeEffectsResponse.activeEffects || {})
        : (response.activeEffects || {});

      setInventoryData(prev => ({
        purchasedItems: prev.purchasedItems.map(item =>
          resolvePurchaseId(item) === purchaseId ? response.purchase : item
        ),
        skipTokens: response.skipTokens ?? prev.skipTokens,
        streakFreezes: response.streakFreezes ?? prev.streakFreezes,
        learningProgress: response.learningProgress ?? prev.learningProgress,
        activeEffects: updatedActiveEffects
      }));
      
      setActiveEffects(updatedActiveEffects);

      const activatedName = response.purchase?.itemName || 'Ability';
      setMessage(response.message || `${activatedName} activated!`);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Inventory: Error using item:', err);
      setError(err.message || 'Failed to use item');
    } finally {
      setUsingItemId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-dark" style={{
        minHeight: "100vh",
        backgroundColor: pageBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: cardText,
        fontFamily: fontBody
      }}>
        <div>Loading inventory...</div>
      </div>
    );
  }

  if (error && inventoryData.purchasedItems.length === 0) {
    return (
      <div className="page-dark" style={{
        minHeight: "100vh",
        backgroundColor: pageBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
        fontFamily: fontBody
      }}>
        <div style={{ color: cardText, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="alert" size={18} color={tk.down} /> {error}
        </div>
        <button
          onClick={fetchInventory}
          style={{ ...btnPrimary, padding: "10px 22px", fontSize: "13px" }}
        >
          Retry
        </button>
      </div>
    );
  }

  const purchasedItems = inventoryData.purchasedItems || [];
  const skipTokens = inventoryData.skipTokens || 0;
  const streakFreezes = inventoryData.streakFreezes || 0;
  const learningProgress = inventoryData.learningProgress || { xp: 0, coins: 0 };

  return (
    <div className="page-dark" style={{
      minHeight: "100vh",
      backgroundColor: pageBg,
      fontFamily: fontBody
    }}>
      {/* Scoped styles: responsive grid collapse (<=768px). */}
      <style>{`
        .inv-items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .inv-item-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .inv-item-card:hover { transform: translateY(-2px); outline: 1px solid var(--tk-gold-hair); outline-offset: -1px; }
        @media (prefers-reduced-motion: reduce) {
          .inv-item-card:hover { transform: none; }
        }
        @media (max-width: 768px) {
          .inv-items-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      {/* Header */}
      <div style={{
        backgroundColor: cardBg2,
        padding: "24px",
        borderBottom: `1px solid ${cardDivider}`
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: cardMuted,
              fontFamily: fontBody,
              fontSize: "13px",
              cursor: "pointer",
              marginBottom: "20px",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Icon name="arrow-left" size={14} /> Back to Dashboard
          </button>

          <h1 style={{
            ...heading,
            fontSize: "28px",
            marginBottom: "8px"
          }}>
            Inventory
          </h1>

          <p style={{
            fontSize: "15px",
            color: cardMuted,
            marginBottom: "28px"
          }}>
            Manage your purchased items and activate them when you're ready.
          </p>

          {/* Inventory Stats */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
            <span style={label}>balances</span>
            <span style={{ flex: 1, height: 1, background: cardDivider }} />
          </div>
          <div style={{
            display: "flex",
            gap: "14px",
            flexWrap: "wrap"
          }}>
            <div style={{
              ...panel,
              background: cardBg,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <Icon name="skip-forward" size={18} color={tk.gold} />
              <div>
                <div style={{
                  ...mono,
                  fontSize: "20px",
                  fontWeight: 600,
                  color: cardText,
                  lineHeight: 1
                }}>
                  {skipTokens}
                </div>
                <div style={{ ...label, marginTop: "6px" }}>
                  skip tokens
                </div>
              </div>
            </div>

            <div style={{
              ...panel,
              background: cardBg,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <Icon name="shield" size={18} color={tk.gold} />
              <div>
                <div style={{
                  ...mono,
                  fontSize: "20px",
                  fontWeight: 600,
                  color: cardText,
                  lineHeight: 1
                }}>
                  {streakFreezes}
                </div>
                <div style={{ ...label, marginTop: "6px" }}>
                  streak freeze days
                </div>
              </div>
            </div>

            <div style={{
              ...panel,
              background: cardBg,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <Icon name="star" size={18} color={tk.gold} />
              <div>
                <div style={{
                  ...mono,
                  fontSize: "20px",
                  fontWeight: 600,
                  color: cardText,
                  lineHeight: 1
                }}>
                  {learningProgress.xp || 0}
                  <span style={{ fontSize: "11px", color: cardMuted, marginLeft: "4px" }}>XP</span>
                </div>
                <div style={{ ...label, marginTop: "6px" }}>
                  current xp
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "48px 24px"
      }}>
        {(message || error) && (
          <div
            role="status"
            style={{
              marginBottom: "24px",
              padding: "12px 16px",
              borderRadius: `${tk.rSm}px`,
              background: message ? tk.upBg : tk.downBg,
              border: `1px solid ${message ? 'rgba(79,180,119,0.35)' : 'rgba(224,96,90,0.35)'}`,
              color: message ? tk.up : tk.down,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px"
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <Icon name={message ? 'check' : 'alert'} size={15} /> {message || error}
            </span>
            <button
              onClick={() => { setMessage(null); setError(null); }}
              aria-label="Dismiss message"
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "inherit",
                lineHeight: 1,
                cursor: "pointer",
                padding: "0 4px",
                display: "inline-flex"
              }}
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
          <span style={label}>your items</span>
          <span style={{ flex: 1, height: 1, background: cardDivider }} />
          <span style={{ ...mono, fontSize: "11px", color: cardMuted }}>
            {purchasedItems.length} {purchasedItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="inv-items-grid">
          {purchasedItems.length === 0 ? (
            <div style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "48px 24px",
              color: cardMuted
            }}>
              <div style={{
                width: "44px",
                height: "44px",
                margin: "0 auto 16px",
                border: `1px solid ${tk.goldHair}`,
                borderRadius: `${tk.rSm}px`,
                display: "grid",
                placeItems: "center",
                color: tk.gold
              }}>
                <Icon name="box" size={20} />
              </div>
              <h3 style={{
                ...heading,
                fontSize: "18px",
                color: cardText,
                marginBottom: "8px"
              }}>
                No items in inventory
              </h3>
              <p style={{ fontSize: "13px", color: cardMuted, lineHeight: 1.5 }}>Visit the shop to purchase items and they’ll appear here.</p>
              <button
                onClick={() => navigate('/shop')}
                style={{ ...btnPrimary, padding: "10px 22px", fontSize: "13px", marginTop: "16px" }}
              >
                Go to Shop
              </button>
            </div>
          ) : (
            purchasedItems
              .sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt))
              .map((item) => (
              <div
                key={resolvePurchaseId(item) || `${item.itemId}-${item.purchasedAt}`}
                className="inv-item-card"
                style={{
                  ...panel,
                  background: cardBg2,
                  padding: "20px",
                  position: "relative"
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "16px"
                }}>
                  <div style={{
                    width: "38px",
                    height: "38px",
                    border: `1px solid ${tk.goldHair}`,
                    borderRadius: `${tk.rSm}px`,
                    display: "grid",
                    placeItems: "center",
                    color: tk.gold,
                    marginRight: "14px",
                    flexShrink: 0
                  }}>
                    <Icon name={getItemIcon(item.itemType, item.effect?.type)} size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: cardText,
                      marginBottom: "6px"
                    }}>
                      {item.itemName}
                    </div>
                    <span style={tag}>
                      {item.itemType}
                    </span>
                  </div>
                </div>

                <p style={{
                  fontSize: "13px",
                  color: cardMuted,
                  marginBottom: "18px",
                  lineHeight: "1.5"
                }}>
                  {getItemDescription(item)}
                </p>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  paddingTop: "16px",
                  borderTop: `1px solid ${cardDivider}`
                }}>
                  <div style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: getStatusColor(item)
                  }}>
                    {getItemStatus(item)}
                  </div>

                  {(() => {
                    const purchaseId = resolvePurchaseId(item);
                    const activatable = Boolean(purchaseId) && isItemUsable(item);
                    if (!activatable) {
                      return null;
                    }
                    return (
                    <button
                      onClick={() => handleUseItem(purchaseId)}
                      disabled={usingItemId === purchaseId}
                      style={{
                        ...btnPrimary,
                        flexShrink: 0,
                        cursor: usingItemId === purchaseId ? "not-allowed" : "pointer",
                        opacity: usingItemId === purchaseId ? 0.7 : 1
                      }}
                    >
                      {usingItemId === purchaseId ? 'Activating...' : 'Activate'}
                    </button>
                    );
                  })()}
                </div>

                <div style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  fontSize: "10.5px",
                  color: cardMuted,
                  textAlign: "right",
                  lineHeight: "1.6"
                }}>
                  <div style={{ marginBottom: "3px" }}>
                    Purchased: <span style={mono}>{new Date(item.purchasedAt).toLocaleDateString()}</span>
                  </div>
                  {item.activatedAt && (
                    <div style={{ marginBottom: "3px", color: tk.up }}>
                      Activated: <span style={mono}>{new Date(item.activatedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {item.consumedAt && !item.activatedAt && (
                    <div style={{ marginBottom: "3px", color: tk.faint }}>
                      Used: <span style={mono}>{new Date(item.consumedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {(() => {
                    const activeEffect = findActiveEffectForItem(item);
                    if (activeEffect && activeEffect.activatedAt) {
                      return (
                        <div style={{ marginBottom: "3px", color: tk.up, fontWeight: 600 }}>
                          Active since: <span style={mono}>{new Date(activeEffect.activatedAt).toLocaleString()}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
