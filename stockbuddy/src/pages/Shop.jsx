import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import progressManager from '../utils/progressManager';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';

// Shop items data
const shopItems = [
  {
    id: 1,
    name: "XP Booster",
    description: "Get 50% more XP for the next 3 lessons",
    price: 25,
    type: "booster",
    icon: "⚡",
    rarity: "common"
  },
  {
    id: 2,
    name: "Premium Avatar",
    description: "Unlock a special trading-themed avatar",
    price: 100,
    type: "cosmetic",
    icon: "👤",
    rarity: "rare"
  },
  {
    id: 3,
    name: "Study Guide",
    description: "Access to detailed study materials for all lessons",
    price: 150,
    type: "content",
    icon: "📚",
    rarity: "epic"
  },
  {
    id: 4,
    name: "Practice Tests",
    description: "Unlimited practice tests for all units",
    price: 200,
    type: "content",
    icon: "📝",
    rarity: "epic"
  },
  {
    id: 5,
    name: "Trading Simulator",
    description: "Advanced trading simulation with real market data",
    price: 500,
    type: "feature",
    icon: "🎮",
    rarity: "legendary"
  },
  {
    id: 6,
    name: "Mentor Access",
    description: "1-on-1 session with a trading expert",
    price: 1000,
    type: "service",
    icon: "🎓",
    rarity: "legendary"
  },
  {
    id: 7,
    name: "Portfolio Tracker",
    description: "Advanced portfolio analytics and insights",
    price: 300,
    type: "feature",
    icon: "📊",
    rarity: "epic"
  },
  {
    id: 8,
    name: "Market Alerts",
    description: "Real-time market notifications and alerts",
    price: 75,
    type: "feature",
    icon: "🔔",
    rarity: "rare"
  }
];

export default function Shop() {
  const navigate = useNavigate();
  const [userProgress, setUserProgress] = useState(null);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    // Load user progress
    setUserProgress(progressManager.getOverallProgress());
    
    // Load purchased items from localStorage
    const stored = localStorage.getItem('stockbuddy_purchased_items');
    if (stored) {
      setPurchasedItems(JSON.parse(stored));
    }
  }, []);

  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'booster', name: 'Boosters' },
    { id: 'cosmetic', name: 'Cosmetics' },
    { id: 'content', name: 'Content' },
    { id: 'feature', name: 'Features' },
    { id: 'service', name: 'Services' }
  ];

  const filteredItems = shopItems.filter(item => 
    selectedCategory === 'all' || item.type === selectedCategory
  );

  const handlePurchase = (item) => {
    if (userProgress.coins >= item.price) {
      setSelectedItem(item);
      setShowPurchaseModal(true);
    } else {
      alert('Not enough coins! Complete more lessons to earn coins.');
    }
  };

  const confirmPurchase = () => {
    if (!selectedItem) return;

    // Deduct coins
    const newCoins = userProgress.coins - selectedItem.price;
    progressManager.progress.coins = newCoins;
    progressManager.saveProgress();

    // Add to purchased items
    const newPurchasedItems = [...purchasedItems, {
      ...selectedItem,
      purchasedAt: new Date().toISOString()
    }];
    setPurchasedItems(newPurchasedItems);
    localStorage.setItem('stockbuddy_purchased_items', JSON.stringify(newPurchasedItems));

    // Update user progress
    setUserProgress({ ...userProgress, coins: newCoins });

    // Apply item effects
    applyItemEffect(selectedItem);

    setShowPurchaseModal(false);
    setSelectedItem(null);
  };

  const applyItemEffect = (item) => {
    switch (item.type) {
      case 'booster':
        // Apply XP booster effect
        localStorage.setItem('stockbuddy_xp_booster', JSON.stringify({
          active: true,
          multiplier: 1.5,
          lessonsRemaining: 3,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }));
        alert('XP Booster activated! You\'ll get 50% more XP for the next 3 lessons.');
        break;
      case 'cosmetic':
        alert('Avatar unlocked! You can now use this avatar in your profile.');
        break;
      case 'content':
        alert('Content unlocked! Check your learning materials for new content.');
        break;
      case 'feature':
        alert('Feature unlocked! New features are now available in the app.');
        break;
      case 'service':
        alert('Service purchased! You\'ll receive an email with booking instructions.');
        break;
      default:
        alert('Item purchased successfully!');
    }
  };

  const isItemPurchased = (itemId) => {
    return purchasedItems.some(item => item.id === itemId);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return marbleGray;
      case 'rare': return '#4A90E2';
      case 'epic': return '#9B59B6';
      case 'legendary': return marbleGold;
      default: return marbleGray;
    }
  };

  if (!userProgress) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: marbleWhite,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fontBody
      }}>
        <div>Loading shop...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: marbleWhite,
      fontFamily: fontBody
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: marbleLightGray,
        padding: "24px",
        borderBottom: `1px solid ${marbleGray}`
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
              color: marbleDarkGray,
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
            color: marbleDarkGray,
            fontFamily: fontHeading,
            marginBottom: "8px"
          }}>
            Shop
          </h1>
          
          <p style={{
            fontSize: "18px",
            color: marbleGray,
            marginBottom: "24px"
          }}>
            Spend your coins on upgrades and exclusive content
          </p>

          {/* User Balance */}
          <div style={{
            backgroundColor: marbleWhite,
            borderRadius: "12px",
            padding: "16px",
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
                color: marbleDarkGray
              }}>
                {userProgress.coins} Coins
              </div>
              <div style={{
                fontSize: "14px",
                color: marbleGray
              }}>
                Available Balance
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
                backgroundColor: selectedCategory === category.id ? marbleGold : marbleLightGray,
                color: selectedCategory === category.id ? marbleDarkGray : marbleDarkGray,
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
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "24px"
        }}>
          {filteredItems.map(item => (
            <div
              key={item.id}
              style={{
                backgroundColor: marbleLightGray,
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
                    color: marbleDarkGray,
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
                color: marbleGray,
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
                    color: marbleDarkGray
                  }}>
                    {item.price}
                  </span>
                </div>

                {isItemPurchased(item.id) ? (
                  <button
                    disabled
                    style={{
                      backgroundColor: marbleGray,
                      color: marbleWhite,
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
                    disabled={userProgress.coins < item.price}
                    style={{
                      backgroundColor: userProgress.coins >= item.price ? marbleGold : marbleGray,
                      color: userProgress.coins >= item.price ? marbleDarkGray : marbleWhite,
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: userProgress.coins >= item.price ? "pointer" : "not-allowed"
                    }}
                  >
                    {userProgress.coins >= item.price ? "Purchase" : "Not Enough Coins"}
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
            color: marbleGray
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
              color: marbleDarkGray,
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
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: marbleWhite,
            borderRadius: "20px",
            padding: "32px",
            maxWidth: "400px",
            width: "90%",
            textAlign: "center"
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
              color: marbleDarkGray,
              marginBottom: "16px"
            }}>
              Confirm Purchase
            </h3>
            
            <p style={{
              fontSize: "16px",
              color: marbleGray,
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
                  backgroundColor: marbleGray,
                  color: marbleWhite,
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