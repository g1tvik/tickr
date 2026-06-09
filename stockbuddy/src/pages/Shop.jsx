import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { gray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';
import { useSEO, SEO_CONFIG } from '../lib/seo';

export default function Shop() {
  useSEO(SEO_CONFIG.shop);
  const navigate = useNavigate();
  // Local dark "marble" theme constants (imported palette bindings can't be reassigned)
  const pageBg = '#2C2C2C';
  const cardBg = '#343434';
  const cardBg2 = '#2f2f2f';
  const cardText = '#F4F1E9';
  const cardMuted = '#b8b4a8';
  const cardBorder = 'rgba(182,156,96,0.22)';
  const cardDivider = 'rgba(244, 241, 233, 0.12)';
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
      case 'common': return gray;
      case 'rare': return '#4A90E2';
      case 'epic': return '#9B59B6';
      case 'legendary': return marbleGold;
      default: return gray;
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
        <div style={{ color: cardText, fontSize: "18px" }}>❌ {error}</div>
        <button
          onClick={fetchShopData}
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
            Shop
          </h1>
          
          <p style={{
            fontSize: "18px",
            color: cardMuted,
            marginBottom: "24px"
          }}>
            Spend your coins on upgrades and exclusive content
          </p>

          {/* User Balance */}
          <div className="shop-balance-bar" style={{
            backgroundColor: cardBg,
            borderRadius: "12px",
            padding: "16px",
            border: `1px solid ${cardBorder}`
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <div style={{
                fontSize: "24px"
              }}>
                🪙
              </div>
              <div>
                <div style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: cardText
                }}>
                  {userCoins} Coins
                </div>
                <div style={{
                  fontSize: "14px",
                  color: cardMuted
                }}>
                  Available Balance
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
                  backgroundColor: marbleGold,
                  color: marbleDarkGray,
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                + Add Test Coins
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
            <span>{message || actionError}</span>
            <button
              onClick={() => { setMessage(null); setActionError(null); }}
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

        {/* Categories */}
        <div style={{
          display: "flex",
          gap: "12px",
          marginBottom: "32px",
          flexWrap: "wrap"
        }}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                backgroundColor: selectedCategory === category.id ? marbleGold : cardBg2,
                color: selectedCategory === category.id ? marbleDarkGray : cardText,
                border: "none",
                padding: "12px 20px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="shop-items-grid">
          {filteredItems.map(item => (
            <div
              key={item.id}
              style={{
                backgroundColor: cardBg2,
                borderRadius: "20px",
                padding: "24px",
                border: `2px solid ${getRarityColor(item.rarity)}`,
                position: "relative",
                opacity: isItemPurchased(item.id) ? 0.7 : 1
              }}
            >
              {isItemPurchased(item.id) && (
                <div style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  backgroundColor: marbleGold,
                  color: marbleDarkGray,
                  padding: "4px 8px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  OWNED
                </div>
              )}

              <div style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "16px"
              }}>
                <div style={{
                  fontSize: "32px",
                  marginRight: "16px"
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: cardText,
                    marginBottom: "4px"
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: getRarityColor(item.rarity),
                    fontWeight: "600",
                    textTransform: "uppercase"
                  }}>
                    {item.rarity}
                  </div>
                </div>
              </div>

              <p style={{
                fontSize: "14px",
                color: cardMuted,
                marginBottom: "20px",
                lineHeight: "1.5"
              }}>
                {item.description}
              </p>

              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span style={{
                    fontSize: "16px"
                  }}>
                    🪙
                  </span>
                  <span style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: cardText
                  }}>
                    {item.price}
                  </span>
                </div>

                {isItemPurchased(item.id) ? (
                  <button
                    disabled
                    style={{
                      backgroundColor: gray,
                      color: cardText,
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "not-allowed"
                    }}
                  >
                    Owned
                  </button>
                ) : (
                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={userCoins < item.price}
                    style={{
                      backgroundColor: userCoins >= item.price ? marbleGold : gray,
                      color: userCoins >= item.price ? marbleDarkGray : cardText,
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: userCoins >= item.price ? "pointer" : "not-allowed"
                    }}
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
            padding: "48px",
            color: cardMuted
          }}>
            <div style={{
              fontSize: "48px",
              marginBottom: "16px"
            }}>
              🛍️
            </div>
            <h3 style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: cardText,
              marginBottom: "8px"
            }}>
              No items in this category
            </h3>
            <p>Try selecting a different category or check back later for new items.</p>
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
            borderRadius: "20px",
            padding: "32px",
            maxWidth: "400px",
            width: "90%",
            textAlign: "center",
            border: `1px solid ${cardBorder}`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.28)"
          }}>
            <div style={{
              fontSize: "48px",
              marginBottom: "16px"
            }}>
              {selectedItem.icon}
            </div>
            
            <h3 style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: cardText,
              marginBottom: "16px"
            }}>
              Confirm Purchase
            </h3>
            
            <p style={{
              fontSize: "16px",
              color: cardMuted,
              marginBottom: "24px"
            }}>
              Purchase <strong>{selectedItem.name}</strong> for <strong>{selectedItem.price} coins</strong>?
            </p>
            
            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center"
            }}>
              <button
                onClick={() => setShowPurchaseModal(false)}
                style={{
                  backgroundColor: gray,
                  color: cardText,
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={confirmPurchase}
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
                Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 