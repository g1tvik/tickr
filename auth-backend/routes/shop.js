const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');

// Reuse shared middleware from auth routes
const authenticateToken = authRoutes.authenticateToken;

// Helper function to get formatted timestamp
const getTimestamp = () => {
  return new Date().toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
};

// File-based user management
const getUsers = (req) => req.app.locals.fileStorage.getUsers();
const saveUsers = (req, users) => req.app.locals.fileStorage.saveUsers(users);


const generatePurchaseId = (userId) => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${userId || 'purchase'}_${timestamp}_${randomPart}`;
};

// Shop items definition (synced with frontend)
// Only includes items that are fully implemented
const SHOP_ITEMS = [
  {
    id: 1,
    name: "XP Booster",
    description: "Get 50% more XP for the next 3 lessons",
    price: 25,
    type: "booster",
    icon: "⚡",
    rarity: "common",
    effect: {
      type: "xp_multiplier",
      multiplier: 1.5,
      lessonsRemaining: 3,
      duration: 24 * 60 * 60 * 1000 // 24 hours in ms
    }
  },
  {
    id: 2,
    name: "Coin Doubler",
    description: "Double your coins earned for the next 5 lessons",
    price: 50,
    type: "booster",
    icon: "🪙",
    rarity: "rare",
    effect: {
      type: "coin_multiplier",
      multiplier: 2,
      lessonsRemaining: 5,
      duration: 48 * 60 * 60 * 1000 // 48 hours in ms
    }
  },
  {
    id: 3,
    name: "Super XP Booster",
    description: "Get 100% more XP (2x) for the next 2 lessons",
    price: 75,
    type: "booster",
    icon: "⚡⚡",
    rarity: "epic",
    effect: {
      type: "xp_multiplier",
      multiplier: 2,
      lessonsRemaining: 2,
      duration: 24 * 60 * 60 * 1000 // 24 hours in ms
    }
  },
  {
    id: 4,
    name: "XP Bundle",
    description: "Instantly receive 200 bonus XP to level up faster",
    price: 30,
    type: "utility",
    icon: "🎁",
    rarity: "common",
    effect: {
      type: "instant_xp",
      amount: 200
    }
  },
  {
    id: 5,
    name: "Lesson Skip Token",
    description: "Skip any one lesson while maintaining your progress and streak",
    price: 40,
    type: "utility",
    icon: "⏭️",
    rarity: "rare",
    effect: {
      type: "skip_token",
      uses: 1
    }
  },
  {
    id: 6,
    name: "Streak Freeze",
    description: "Protect your learning streak for 3 days even if you miss lessons",
    price: 60,
    type: "utility",
    icon: "🛡️",
    rarity: "rare",
    effect: {
      type: "streak_freeze",
      days: 3
    }
  }
];

// Get all shop items
router.get('/items', authenticateToken, (req, res) => {
  console.log(`[${getTimestamp()}] 🛍️ Shop: User ${req.user.userId} fetching shop items`);
  
  try {
    res.json({
      success: true,
      items: SHOP_ITEMS
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] ❌ Shop: Error fetching items:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shop items'
    });
  }
});

// Get user's purchased items
router.get('/purchases', authenticateToken, (req, res) => {
  console.log(`[${getTimestamp()}] 🛍️ Shop: User ${req.user.userId} fetching purchases`);
  
  try {
    const users = getUsers(req);
    const user = users[req.user.userId];
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const purchasedItems = user.purchasedItems || [];
    
    console.log(`[${getTimestamp()}] ✅ Shop: Retrieved ${purchasedItems.length} purchases for user ${req.user.userId}`);
    
    res.json({
      success: true,
      purchases: purchasedItems
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] ❌ Shop: Error fetching purchases:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchases'
    });
  }
});

// Purchase an item
router.post('/purchase', authenticateToken, (req, res) => {
  const { itemId } = req.body;
  
  console.log(`[${getTimestamp()}] 🛒 Shop: User ${req.user.userId} attempting to purchase item ${itemId}`);
  
  try {
    // Validate item ID
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Item ID is required'
      });
    }

    // Find the item
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) {
      console.log(`[${getTimestamp()}] ⚠️ Shop: Item ${itemId} not found`);
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Get user data
    const users = getUsers(req);
    const user = users[req.user.userId];
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize user data if needed
    if (!user.learningProgress) {
      user.learningProgress = { xp: 0, coins: 0 };
    }
    if (!user.purchasedItems) {
      user.purchasedItems = [];
    }

    // Check if user has enough coins
    const userCoins = user.learningProgress.coins || 0;
    if (userCoins < item.price) {
      console.log(`[${getTimestamp()}] ⚠️ Shop: User ${req.user.userId} has insufficient coins (${userCoins}/${item.price})`);
      return res.status(400).json({
        success: false,
        message: 'Insufficient coins',
        userCoins,
        itemPrice: item.price
      });
    }

    // Check if item is already purchased (for one-time purchase items)
    const alreadyPurchased = user.purchasedItems.some(p => p.itemId === itemId);
    if (alreadyPurchased && item.type !== 'booster' && item.type !== 'utility') {
      console.log(`[${getTimestamp()}] ⚠️ Shop: User ${req.user.userId} already owns item ${itemId}`);
      return res.status(400).json({
        success: false,
        message: 'You already own this item'
      });
    }

    // Deduct coins
    user.learningProgress.coins -= item.price;

    // Create purchase record
    const purchase = {
      id: generatePurchaseId(req.user.userId),
      itemId: item.id,
      itemName: item.name,
      itemType: item.type,
      price: item.price,
      purchasedAt: new Date().toISOString(),
      effect: item.effect,
      active: false,
      consumed: false,
      activatedAt: null,
      consumedAt: null
    };

    // Add to purchased items
    user.purchasedItems.push(purchase);

    // Save updated user data
    saveUsers(req, users);

    console.log(`[${getTimestamp()}] ✅ Shop: Purchase successful - User ${req.user.userId} bought "${item.name}" for ${item.price} coins (${user.learningProgress.coins} coins remaining)`);

    res.json({
      success: true,
      message: 'Purchase successful',
      purchase: purchase,
      remainingCoins: user.learningProgress.coins
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] ❌ Shop: Error processing purchase:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process purchase'
    });
  }
});

// Use a purchased item
router.post('/use', authenticateToken, (req, res) => {
  const { purchaseId } = req.body;

  console.log(`[${getTimestamp()}] 🎒 Shop: User ${req.user.userId} attempting to use purchase ${purchaseId}`);

  try {
    if (!purchaseId) {
      return res.status(400).json({
        success: false,
        message: 'Purchase ID is required'
      });
    }

    const users = getUsers(req);
    const user = users[req.user.userId];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.purchasedItems || user.purchasedItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No purchased items found'
      });
    }

    let purchase = user.purchasedItems.find(p => p.id === purchaseId);

    if (!purchase) {
      purchase = user.purchasedItems.find(p => {
        if (p.id) return false;
        if (p.consumed) return false;
        const candidateId = typeof p.itemId === 'number' ? p.itemId.toString() : p.itemId;
        return candidateId === purchaseId;
      });
    }

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    if (!purchase.id) {
      purchase.id = generatePurchaseId(req.user.userId);
    }

    if (purchase.consumed) {
      return res.status(400).json({
        success: false,
        message: 'This item has already been used'
      });
    }

    const now = new Date().toISOString();

    if (purchase.itemType === 'booster') {
      if (!user.activeEffects) {
        user.activeEffects = {};
      }

      const effect = purchase.effect || {};
      if (!effect.duration) {
        return res.status(400).json({
          success: false,
          message: 'Invalid booster configuration'
        });
      }

      const effectKey = `${effect.type}_${Date.now()}`;
      user.activeEffects[effectKey] = {
        ...effect,
        expiresAt: new Date(Date.now() + effect.duration).toISOString(),
        purchasedAt: purchase.purchasedAt,
        activatedAt: now
      };

      purchase.active = true;
      purchase.consumed = true;
      purchase.activatedAt = now;
      purchase.consumedAt = now;

      console.log(`[${getTimestamp()}] ⚡ Shop: Activated booster ${effect.type} for user ${req.user.userId}`);
    } else if (purchase.itemType === 'utility') {
      const effect = purchase.effect || {};

      switch (effect.type) {
        case 'instant_xp': {
          if (!user.learningProgress) {
            user.learningProgress = { xp: 0, coins: 0 };
          }
          user.learningProgress.xp = (user.learningProgress.xp || 0) + (effect.amount || 0);
          purchase.consumed = true;
          purchase.consumedAt = now;
          console.log(`[${getTimestamp()}] 🎁 Shop: Applied ${effect.amount} XP to user ${req.user.userId}`);
          break;
        }
        case 'instant_coins': {
          if (!user.learningProgress) {
            user.learningProgress = { xp: 0, coins: 0 };
          }
          user.learningProgress.coins = (user.learningProgress.coins || 0) + (effect.amount || 0);
          purchase.consumed = true;
          purchase.consumedAt = now;
          console.log(`[${getTimestamp()}] 💰 Shop: Applied ${effect.amount} coins to user ${req.user.userId}`);
          break;
        }
        case 'skip_token': {
          if (!user.skipTokens) user.skipTokens = 0;
          user.skipTokens += effect.uses || 1;
          purchase.consumed = true;
          purchase.consumedAt = now;
          console.log(`[${getTimestamp()}] ⏭️ Shop: Granted skip token to user ${req.user.userId}`);
          break;
        }
        case 'streak_freeze': {
          if (!user.streakFreezes) user.streakFreezes = 0;
          user.streakFreezes += effect.days || 0;
          purchase.consumed = true;
          purchase.consumedAt = now;
          console.log(`[${getTimestamp()}] 🛡️ Shop: Granted streak freeze days to user ${req.user.userId}`);
          break;
        }
        default: {
          return res.status(400).json({
            success: false,
            message: 'Unsupported utility item type'
          });
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported item type'
      });
    }

    saveUsers(req, users);

    res.json({
      success: true,
      message: 'Item used successfully',
      purchase,
      skipTokens: user.skipTokens || 0,
      streakFreezes: user.streakFreezes || 0,
      learningProgress: user.learningProgress || { xp: 0, coins: 0 },
      activeEffects: user.activeEffects || {}
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] ❌ Shop: Error using item:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to use item'
    });
  }
});

// Get active effects (boosters)
router.get('/active-effects', authenticateToken, (req, res) => {
  console.log(`[${getTimestamp()}] 🛍️ Shop: User ${req.user.userId} fetching active effects`);
  
  try {
    const users = getUsers(req);
    const user = users[req.user.userId];
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const activeEffects = user.activeEffects || {};
    const now = new Date();

    // Filter out expired effects
    const validEffects = {};
    let hasExpired = false;

    Object.keys(activeEffects).forEach(key => {
      const effect = activeEffects[key];
      if (new Date(effect.expiresAt) > now && effect.lessonsRemaining > 0) {
        validEffects[key] = effect;
      } else {
        hasExpired = true;
      }
    });

    // Update user data if any effects expired
    if (hasExpired) {
      user.activeEffects = validEffects;
      saveUsers(req, users);
      console.log(`[${getTimestamp()}] 🧹 Shop: Cleaned up expired effects for user ${req.user.userId}`);
    }

    console.log(`[${getTimestamp()}] ✅ Shop: Retrieved ${Object.keys(validEffects).length} active effects for user ${req.user.userId}`);
    
    res.json({
      success: true,
      activeEffects: validEffects
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] ❌ Shop: Error fetching active effects:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active effects'
    });
  }
});

module.exports = router;

