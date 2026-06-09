import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';
import { useSEO } from '../lib/seo';

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
  // Local dark "marble" theme constants (imported palette bindings can't be reassigned)
  const pageBg = '#2C2C2C';
  const cardBg = '#343434';
  const cardBg2 = '#2f2f2f';
  const cardText = '#F4F1E9';
  const cardMuted = '#b8b4a8';
  const cardBorder = 'rgba(182,156,96,0.22)';
  const cardDivider = 'rgba(244, 241, 233, 0.12)';
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
        return '⚡';
      case 'utility':
        switch (effectType) {
          case 'instant_xp': return '🎁';
          case 'skip_token': return '⏭️';
          case 'streak_freeze': return '🛡️';
          case 'instant_coins': return '💰';
          default: return '🔧';
        }
      default:
        return '📦';
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
        return '#22c55e'; // Green for active
      }
    }
    
    if (item.active) return '#22c55e';
    if (item.consumed) return '#6b7280';
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
        <div style={{ color: cardText, fontSize: "18px" }}>❌ {error}</div>
        <button
          onClick={fetchInventory}
          style={{
            backgroundColor: marbleGold,
            color: marbleDarkGray,
            border: "none",
            padding: "12px 24px",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer"
          }}
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
        .inv-items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
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
              color: cardText,
              fontSize: "16px",
              cursor: "pointer",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            ← Back to Dashboard
          </button>
          
          <h1 style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: cardText,
            fontFamily: fontHeading,
            marginBottom: "8px"
          }}>
            Inventory
          </h1>
          
          <p style={{
            fontSize: "18px",
            color: cardMuted,
            marginBottom: "24px"
          }}>
            Manage your purchased items and activate them when you're ready.
          </p>

          {/* Inventory Stats */}
          <div style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap"
          }}>
            <div style={{
              backgroundColor: cardBg,
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              border: `1px solid ${cardBorder}`
            }}>
              <div style={{ fontSize: "24px" }}>⏭️</div>
              <div>
                <div style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: cardText
                }}>
                  {skipTokens}
                </div>
                <div style={{
                  fontSize: "14px",
                  color: cardMuted
                }}>
                  Skip Tokens
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: cardBg,
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              border: `1px solid ${cardBorder}`
            }}>
              <div style={{ fontSize: "24px" }}>🛡️</div>
              <div>
                <div style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: cardText
                }}>
                  {streakFreezes}
                </div>
                <div style={{
                  fontSize: "14px",
                  color: cardMuted
                }}>
                  Streak Freeze Days
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: cardBg,
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              border: `1px solid ${cardBorder}`
            }}>
              <div style={{ fontSize: "24px" }}>⭐</div>
              <div>
                <div style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: cardText
                }}>
                  {learningProgress.xp || 0} XP
                </div>
                <div style={{
                  fontSize: "14px",
                  color: cardMuted
                }}>
                  Current XP
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
              borderRadius: "12px",
              backgroundColor: message ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: message ? '#22c55e' : '#ef4444',
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px"
            }}
          >
            <span>{message || error}</span>
            <button
              onClick={() => { setMessage(null); setError(null); }}
              aria-label="Dismiss message"
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "inherit",
                fontSize: "18px",
                lineHeight: 1,
                cursor: "pointer",
                padding: "0 4px"
              }}
            >
              ×
            </button>
          </div>
        )}

        <div className="inv-items-grid">
          {purchasedItems.length === 0 ? (
            <div style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "48px",
              color: cardMuted
            }}>
              <div style={{
                fontSize: "48px",
                marginBottom: "16px"
              }}>
                🎒
              </div>
              <h3 style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: cardText,
                marginBottom: "8px"
              }}>
                No items in inventory
              </h3>
              <p>Visit the shop to purchase items and they’ll appear here.</p>
              <button
                onClick={() => navigate('/shop')}
                style={{
                  backgroundColor: marbleGold,
                  color: marbleDarkGray,
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  marginTop: "16px"
                }}
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
                style={{
                  backgroundColor: cardBg2,
                  borderRadius: "20px",
                  padding: "24px",
                  border: `2px solid ${cardBorder}`,
                  position: "relative"
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "16px"
                }}>
                  <div style={{
                    fontSize: "32px",
                    marginRight: "16px"
                  }}>
                    {getItemIcon(item.itemType, item.effect?.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: cardText,
                      marginBottom: "4px"
                    }}>
                      {item.itemName}
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: cardMuted,
                      fontWeight: "600",
                      textTransform: "uppercase"
                    }}>
                      {item.itemType}
                    </div>
                  </div>
                </div>

                <p style={{
                  fontSize: "14px",
                  color: cardMuted,
                  marginBottom: "20px",
                  lineHeight: "1.5"
                }}>
                  {getItemDescription(item)}
                </p>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: "600",
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
                        backgroundColor: marbleGold,
                        color: marbleDarkGray,
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
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
                  top: "12px",
                  right: "12px",
                  fontSize: "11px",
                  color: cardMuted,
                  textAlign: "right",
                  lineHeight: "1.4"
                }}>
                  <div style={{ marginBottom: "4px" }}>
                    Purchased: {new Date(item.purchasedAt).toLocaleDateString()}
                  </div>
                  {item.activatedAt && (
                    <div style={{ marginBottom: "4px", color: '#22c55e' }}>
                      Activated: {new Date(item.activatedAt).toLocaleString()}
                    </div>
                  )}
                  {item.consumedAt && !item.activatedAt && (
                    <div style={{ marginBottom: "4px", color: '#6b7280' }}>
                      Used: {new Date(item.consumedAt).toLocaleString()}
                    </div>
                  )}
                  {(() => {
                    const activeEffect = findActiveEffectForItem(item);
                    if (activeEffect && activeEffect.activatedAt) {
                      return (
                        <div style={{ marginBottom: "4px", color: '#22c55e', fontWeight: "600" }}>
                          Active since: {new Date(activeEffect.activatedAt).toLocaleString()}
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
