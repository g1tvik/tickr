import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { white, lightGray, gray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';

export default function Shop() {
  const navigate = useNavigate();
  const [shopItems, setShopItems] = useState([]);
  const [userCoins, setUserCoins] = useState(0);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🛍️ Shop: Fetching shop data...');
      
      // Fetch shop items, purchases, and user data in parallel
      const [itemsResponse, purchasesResponse, userDataResponse] = await Promise.all([
        api.getShopItems(),
        api.getPurchases(),
        api.getUserData()
      ]);

      console.log('📦 Shop: Items received:', itemsResponse.items?.length || 0);
      console.log('🛒 Shop: Purchases received:', purchasesResponse.purchases?.length || 0);
      console.log('💰 Shop: User coins:', userDataResponse.user?.learningProgress?.coins || 0);

      setShopItems(itemsResponse.items || []);
      setPurchasedItems(purchasesResponse.purchases || []);
      setUserCoins(userDataResponse.user?.learningProgress?.coins || 0);
    } catch (err) {
      console.error('❌ Shop: Error fetching data:', err);
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
      setSelectedItem(item);
      setShowPurchaseModal(true);
    } else {
      alert('Not enough coins! Complete more lessons to earn coins.');
    }
  };

  const confirmPurchase = async () => {
    if (!selectedItem) return;

    try {
      console.log(`🛒 Shop: Purchasing ${selectedItem.name} (ID: ${selectedItem.id}) for ${selectedItem.price} coins...`);
      console.log(`💰 Shop: Current balance: ${userCoins} coins`);
      
      // Call backend to purchase item
      const response = await api.purchaseItem(selectedItem.id);
      
      if (response.success) {
        console.log('✅ Shop: Purchase successful!', response);
        console.log(`💰 Shop: New balance: ${response.remainingCoins} coins`);
        
        // Update local state
        setUserCoins(response.remainingCoins);
        setPurchasedItems([...purchasedItems, response.purchase]);

        // Show success message
        alert(getSuccessMessage(selectedItem));
        
        setShowPurchaseModal(false);
        setSelectedItem(null);
      } else {
        console.error('❌ Shop: Purchase failed - backend returned success: false');
        alert('Purchase failed. Please try again.');
      }
    } catch (err) {
      console.error('❌ Shop: Purchase failed:', err);
      alert(err.message || 'Purchase failed. Please try again.');
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
      <div style={{
        minHeight: "100vh",
        backgroundColor: white,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fontBody
      }}>
        <div>Loading shop...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: white,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
        fontFamily: fontBody
      }}>
        <div style={{ color: marbleDarkGray, fontSize: "18px" }}>❌ {error}</div>
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
    <div style={{
      minHeight: "100vh",
      backgroundColor: white,
      fontFamily: fontBody
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: lightGray,
        padding: "24px",
        borderBottom: `1px solid ${gray}`
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
            color: gray,
            marginBottom: "24px"
          }}>
            Spend your coins on upgrades and exclusive content
          </p>

          {/* User Balance */}
          <div style={{
            backgroundColor: white,
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px"
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
                  color: marbleDarkGray
                }}>
                  {userCoins} Coins
                </div>
                <div style={{
                  fontSize: "14px",
                  color: gray
                }}>
                  Available Balance
                </div>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  console.log('🎁 Adding test coins...');
                  const response = await api.addTestCoins(100);
                  if (response.success) {
                    setUserCoins(response.newBalance);
                    console.log('✅ Test coins added! New balance:', response.newBalance);
                  }
                } catch (err) {
                  console.error('❌ Failed to add test coins:', err);
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
                backgroundColor: selectedCategory === category.id ? marbleGold : lightGray,
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
                backgroundColor: lightGray,
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
                color: gray,
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
                      backgroundColor: gray,
                      color: white,
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
                      color: userCoins >= item.price ? marbleDarkGray : white,
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
            color: gray
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
            backgroundColor: white,
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
              color: gray,
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
                  color: white,
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