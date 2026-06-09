import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { fontBody } from '../fontPalette';
import { useSEO, SEO_CONFIG } from '../lib/seo';
import tk, { label, mono, panel, heading, btnPrimary, btnGhost, tag } from '../theme/terminal';
import Icon from '../components/Icon';

export default function Shop() {
  useSEO(SEO_CONFIG.shop);
  const navigate = useNavigate();
  // Terminal Editorial theme bindings (kept as local names; values from terminal.js tokens)
  const pageBg = tk.bg;
  const cardBg = tk.surface;
  const cardBg2 = tk.raised;
  const cardText = tk.text;
  const cardMuted = tk.muted;
  const cardDivider = tk.hair;
  const [shopItems, setShopItems] = useState([]);
  const [userCoins, setUserCoins] = useState(0);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (import.meta.env.DEV) console.log('Shop: Fetching shop data...');

      // Fetch shop items, purchases, and user data in parallel
      const [itemsResponse, purchasesResponse, userDataResponse] = await Promise.all([
        api.getShopItems(),
        api.getPurchases(),
        api.getUserData()
      ]);

      if (import.meta.env.DEV) {
        console.log('Shop: Items received:', itemsResponse.items?.length || 0);
        console.log('Shop: Purchases received:', purchasesResponse.purchases?.length || 0);
        console.log('Shop: User coins:', userDataResponse.user?.learningProgress?.coins || 0);
      }

      setShopItems(itemsResponse.items || []);
      setPurchasedItems(purchasesResponse.purchases || []);
      setUserCoins(userDataResponse.user?.learningProgress?.coins || 0);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Shop: Error fetching data:', err);
      setError(err.message || 'Failed to load shop data');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'booster', name: 'Boosters' },
    { id: 'cosmetic', name: 'Cosmetics' },
    { id: 'feature', name: 'Features' },
    { id: 'utility', name: 'Utilities' }
  ];

  const filteredItems = shopItems.filter(item => 
    selectedCategory === 'all' || item.type === selectedCategory
  );

  const handlePurchase = (item) => {
    if (userCoins >= item.price) {
      setActionError(null);
      setSelectedItem(item);
      setShowPurchaseModal(true);
    } else {
      setMessage(null);
      setActionError('Not enough coins! Complete more lessons to earn coins.');
    }
  };

  const confirmPurchase = async () => {
    if (!selectedItem) return;

    setMessage(null);
    setActionError(null);

    try {
      if (import.meta.env.DEV) {
        console.log(`Shop: Purchasing ${selectedItem.name} (ID: ${selectedItem.id}) for ${selectedItem.price} coins...`);
        console.log(`Shop: Current balance: ${userCoins} coins`);
      }

      // Call backend to purchase item
      const response = await api.purchaseItem(selectedItem.id);

      if (response.success) {
        if (import.meta.env.DEV) {
          console.log('Shop: Purchase successful!', response);
          console.log(`Shop: New balance: ${response.remainingCoins} coins`);
        }

        // Update local state
        setUserCoins(response.remainingCoins);
        setPurchasedItems([...purchasedItems, response.purchase]);

        // Show success message inline
        setMessage(getSuccessMessage(selectedItem));

        setShowPurchaseModal(false);
        setSelectedItem(null);
      } else {
        if (import.meta.env.DEV) console.error('Shop: Purchase failed - backend returned success: false');
        setActionError('Purchase failed. Please try again.');
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Shop: Purchase failed:', err);
      setActionError(err.message || 'Purchase failed. Please try again.');
    }
  };

  const getSuccessMessage = (item) => {
    switch (item.type) {
      case 'booster':
        if (item.effect.type === 'xp_multiplier') {
          const bonusPercent = (item.effect.multiplier - 1) * 100;
          return `XP Booster added to your inventory! Activate it when you're ready to earn ${bonusPercent}% more XP for ${item.effect.lessonsRemaining} lessons.`;
        } else if (item.effect.type === 'coin_multiplier') {
          const bonusPercent = (item.effect.multiplier - 1) * 100;
          return `Coin Doubler added to your inventory! Activate it when you want ${bonusPercent}% more coins for ${item.effect.lessonsRemaining} lessons.`;
        }
        return `${item.name} added to your inventory!`;
      case 'utility':
        if (item.effect.type === 'instant_coins') {
          return `Coin pack added to your inventory! Activate it from your inventory to receive ${item.effect.amount} coins.`;
        } else if (item.effect.type === 'instant_xp') {
          return `XP Bundle added to your inventory! Use it from the inventory screen to receive ${item.effect.amount} XP.`;
        } else if (item.effect.type === 'skip_token') {
          return `Lesson Skip Token added to your inventory! Use it from your inventory whenever you need to skip a lesson.`;
        } else if (item.effect.type === 'streak_freeze') {
          return `Streak Freeze added to your inventory! Use it from the inventory screen to protect your streak for ${item.effect.days} days.`;
        }
        return `${item.name} added to your inventory!`;
      default:
        return 'Item added to your inventory!';
    }
  };

  const isItemPurchased = (itemId) => {
    return purchasedItems.some(item => item.itemId === itemId);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return tk.muted;
      case 'rare': return tk.text;
      case 'epic': return tk.gold;
      case 'legendary': return tk.goldBright;
      default: return tk.muted;
    }
  };

  // Presentational glyph picker — maps item type/effect to a monoline Icon name.
  const getItemIcon = (item) => {
    const effectType = item.effect?.type;
    if (effectType === 'xp_multiplier' || effectType === 'instant_xp') return 'bolt';
    if (effectType === 'coin_multiplier' || effectType === 'instant_coins') return 'coin';
    if (effectType === 'skip_token') return 'skip-forward';
    if (effectType === 'streak_freeze') return 'shield';
    switch (item.type) {
      case 'booster': return 'bolt';
      case 'cosmetic': return 'star';
      case 'feature': return 'sparkle';
      case 'utility': return 'box';
      default: return 'gift';
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
        <div>Loading shop...</div>
      </div>
    );
  }

  if (error) {
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
        <div style={{
          width: 44,
          height: 44,
          border: `1px solid ${tk.goldHair}`,
          borderRadius: tk.rSm,
          display: "grid",
          placeItems: "center",
          color: tk.down
        }}>
          <Icon name="alert" size={18} />
        </div>
        <div style={{ color: cardText, fontSize: "16px" }}>{error}</div>
        <button
          onClick={fetchShopData}
          style={{ ...btnPrimary, padding: "10px 20px", fontSize: "13px" }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="page-dark" style={{
      minHeight: "100vh",
      backgroundColor: pageBg,
      fontFamily: fontBody
    }}>
      {/* Scoped styles: responsive grid collapse + header layout (<=768px). */}
      <style>{`
        .shop-items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
        .shop-balance-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .shop-item-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .shop-item-card:not(.is-owned):hover { transform: translateY(-2px); outline: 1px solid var(--tk-gold-hair); outline-offset: -1px; }
        @media (prefers-reduced-motion: reduce) {
          .shop-item-card:hover { transform: none; }
        }
        @media (max-width: 768px) {
          .shop-items-grid { grid-template-columns: 1fr; }
          .shop-balance-bar { flex-direction: column; align-items: stretch; }
          .shop-balance-bar > button { width: 100%; }
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
              fontFamily: tk.fontBody,
              fontSize: "13px",
              cursor: "pointer",
              marginBottom: "16px",
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
            color: cardText,
            marginBottom: "8px"
          }}>
            Shop
          </h1>

          <p style={{
            fontSize: "14px",
            color: cardMuted,
            marginBottom: "24px"
          }}>
            Spend your coins on upgrades and exclusive content
          </p>

          {/* User Balance */}
          <div className="shop-balance-bar" style={{
            ...panel,
            backgroundColor: cardBg,
            padding: "16px"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <div style={{
                width: 40,
                height: 40,
                border: `1px solid ${tk.goldHair}`,
                borderRadius: tk.rSm,
                display: "grid",
                placeItems: "center",
                color: tk.gold
              }}>
                <Icon name="coin" size={18} />
              </div>
              <div>
                <div style={{ ...label, marginBottom: "4px" }}>
                  Available Balance
                </div>
                <div style={{
                  ...mono,
                  fontSize: "20px",
                  fontWeight: 500,
                  color: cardText
                }}>
                  {userCoins} <span style={{ fontSize: "13px", color: cardMuted }}>coins</span>
                </div>
              </div>
            </div>
            {import.meta.env.DEV && (
              <button
                onClick={async () => {
                  setMessage(null);
                  setActionError(null);
                  try {
                    if (import.meta.env.DEV) console.log('Adding test coins...');
                    const response = await api.addTestCoins(100);
                    if (response.success) {
                      setUserCoins(response.newBalance);
                      if (import.meta.env.DEV) console.log('Test coins added! New balance:', response.newBalance);
                    }
                  } catch (err) {
                    if (import.meta.env.DEV) console.error('Failed to add test coins:', err);
                    setActionError(err.message || 'Failed to add test coins.');
                  }
                }}
                style={{
                  ...btnPrimary,
                  padding: "8px 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Icon name="plus" size={14} /> Add Test Coins
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "48px 24px"
      }}>
        {(message || actionError) && (
          <div
            role="status"
            style={{
              marginBottom: "24px",
              padding: "11px 14px",
              borderRadius: tk.rSm,
              backgroundColor: message ? tk.upBg : tk.downBg,
              color: message ? tk.up : tk.down,
              border: `1px solid ${message ? 'rgba(79,180,119,0.4)' : 'rgba(224,96,90,0.4)'}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px"
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <Icon name={message ? 'check' : 'alert'} size={15} />
              {message || actionError}
            </span>
            <button
              onClick={() => { setMessage(null); setActionError(null); }}
              aria-label="Dismiss message"
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "inherit",
                lineHeight: 1,
                cursor: "pointer",
                padding: "0 4px",
                display: "inline-flex",
                alignItems: "center"
              }}
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        )}

        {/* Categories */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <span style={label}>category</span>
          <span style={{ flex: 1, height: 1, background: tk.hair }} />
        </div>
        <div style={{
          display: "flex",
          gap: "10px",
          marginBottom: "32px",
          flexWrap: "wrap"
        }}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                fontFamily: tk.fontBody,
                backgroundColor: selectedCategory === category.id ? tk.gold : "transparent",
                color: selectedCategory === category.id ? "#1F1F1F" : cardText,
                border: `1px solid ${selectedCategory === category.id ? tk.gold : tk.hairStrong}`,
                padding: "8px 14px",
                borderRadius: tk.rSm,
                fontSize: "12px",
                fontWeight: "600",
                letterSpacing: "0.04em",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <span style={label}>items</span>
          <span style={{ flex: 1, height: 1, background: tk.hair }} />
          <span style={{ ...mono, fontSize: 11, color: tk.muted }}>{filteredItems.length} items</span>
        </div>
        <div className="shop-items-grid">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={`shop-item-card${isItemPurchased(item.id) ? ' is-owned' : ''}`}
              style={{
                ...panel,
                backgroundColor: cardBg2,
                borderRadius: tk.r,
                padding: "20px",
                position: "relative",
                opacity: isItemPurchased(item.id) ? 0.65 : 1
              }}
            >
              {isItemPurchased(item.id) && (
                <span style={{
                  ...tag,
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <Icon name="check" size={10} /> owned
                </span>
              )}

              <div style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "16px"
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  marginRight: "14px",
                  border: `1px solid ${tk.goldHair}`,
                  borderRadius: tk.rSm,
                  display: "grid",
                  placeItems: "center",
                  color: tk.gold,
                  flexShrink: 0
                }}>
                  <Icon name={getItemIcon(item)} size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: cardText,
                    marginBottom: "6px"
                  }}>
                    {item.name}
                  </div>
                  <span style={{
                    ...tag,
                    color: getRarityColor(item.rarity),
                    borderColor: tk.hairStrong
                  }}>
                    {item.rarity}
                  </span>
                </div>
              </div>

              <p style={{
                fontSize: "13px",
                color: cardMuted,
                marginBottom: "20px",
                lineHeight: "1.5"
              }}>
                {item.description}
              </p>

              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "16px",
                borderTop: `1px solid ${tk.hair}`
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <Icon name="coin" size={16} color={tk.gold} />
                  <span style={{
                    ...mono,
                    fontSize: "16px",
                    fontWeight: 600,
                    color: cardText
                  }}>
                    {item.price}
                  </span>
                </div>

                {isItemPurchased(item.id) ? (
                  <button
                    disabled
                    style={{
                      ...btnGhost,
                      color: tk.faint,
                      borderColor: tk.hair,
                      cursor: "not-allowed"
                    }}
                  >
                    Owned
                  </button>
                ) : (
                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={userCoins < item.price}
                    style={
                      userCoins >= item.price
                        ? { ...btnPrimary }
                        : { ...btnGhost, color: tk.faint, borderColor: tk.hair, cursor: "not-allowed" }
                    }
                  >
                    {userCoins >= item.price ? "Purchase" : "Not Enough Coins"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "40px 24px",
            color: cardMuted
          }}>
            <div style={{
              width: 44,
              height: 44,
              margin: "0 auto 14px",
              border: `1px solid ${tk.goldHair}`,
              borderRadius: tk.rSm,
              display: "grid",
              placeItems: "center",
              color: tk.gold
            }}>
              <Icon name="bag" size={18} />
            </div>
            <h3 style={{
              ...heading,
              fontSize: "16px",
              color: cardText,
              marginBottom: "6px"
            }}>
              No items in this category
            </h3>
            <p style={{ fontSize: "13px", color: cardMuted, lineHeight: 1.5, maxWidth: 360, margin: "0 auto" }}>Try selecting a different category or check back later for new items.</p>
          </div>
        )}
      </div>

      {/* Purchase Confirmation Modal */}
      {showPurchaseModal && selectedItem && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: cardBg,
            borderRadius: tk.r,
            padding: "28px",
            maxWidth: "400px",
            width: "90%",
            textAlign: "center",
            border: `1px solid ${tk.hairStrong}`,
            boxShadow: "0 12px 32px rgba(0,0,0,0.45)"
          }}>
            <div style={{
              width: 48,
              height: 48,
              margin: "0 auto 16px",
              border: `1px solid ${tk.goldHair}`,
              borderRadius: tk.rSm,
              display: "grid",
              placeItems: "center",
              color: tk.gold
            }}>
              <Icon name={getItemIcon(selectedItem)} size={22} />
            </div>

            <h3 style={{
              ...heading,
              fontSize: "20px",
              color: cardText,
              marginBottom: "12px"
            }}>
              Confirm Purchase
            </h3>

            <p style={{
              fontSize: "14px",
              color: cardMuted,
              marginBottom: "24px",
              lineHeight: 1.5
            }}>
              Purchase <strong style={{ color: cardText }}>{selectedItem.name}</strong> for <strong style={{ ...mono, color: cardText }}>{selectedItem.price}</strong> coins?
            </p>

            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center"
            }}>
              <button
                onClick={() => setShowPurchaseModal(false)}
                style={{ ...btnGhost, padding: "10px 20px", fontSize: "13px" }}
              >
                Cancel
              </button>

              <button
                onClick={confirmPurchase}
                style={{ ...btnPrimary, padding: "10px 20px", fontSize: "13px" }}
              >
                Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 