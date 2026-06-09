const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../services/emailService', () => ({
  sendGoalReminder: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true)
}));

const { app } = require('../server');

describe('Shop routes - Integration tests', () => {
  let authToken;
  let userId;
  let testUser;
  const testEmail = `shop-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testUsername = `shopuser${Math.floor(Math.random() * 10000)}`;

  // Helper to get the test user from storage (async)
  const getTestUser = async () => {
    return app.locals.storage.getUserById(userId);
  };

  // Helper to update test user (async)
  const updateTestUser = async (updates) => {
    const user = await app.locals.storage.getUserById(userId);
    if (user) {
      Object.assign(user, updates);
      await app.locals.storage.saveUser(user);
    }
  };

  beforeAll(async () => {
    // Register a test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        name: 'Shop Test User',
        username: testUsername
      });

    expect(registerResponse.status).toBe(200);
    expect(registerResponse.body.success).toBe(true);
    authToken = registerResponse.body.token;

    // Decode token to get user ID
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'your-secret-key');
    userId = decoded.userId;

    // Get initial user state
    testUser = await getTestUser();
    expect(testUser).toBeDefined();
  });

  beforeEach(async () => {
    // Reset user state before each test
    testUser = await getTestUser();
    if (testUser) {
      // Reset coins to a known amount for each test
      if (!testUser.learningProgress) {
        testUser.learningProgress = { xp: 0, coins: 100 };
      } else {
        testUser.learningProgress.coins = 100;
      }
      testUser.purchasedItems = [];
      testUser.activeEffects = {};
      testUser.skipTokens = 0;
      testUser.streakFreezes = 0;
      await updateTestUser(testUser);
    }
  });

  describe('POST /api/shop/purchase', () => {
    it('should successfully purchase an item with sufficient coins', async () => {
      // Ensure user has enough coins
      await updateTestUser({
        learningProgress: { xp: 0, coins: 100 }
      });

      const response = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 1 }); // XP Booster (25 coins)

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Purchase successful');
      expect(response.body.purchase).toBeDefined();
      expect(response.body.purchase.itemId).toBe(1);
      expect(response.body.purchase.itemName).toBe('XP Booster');
      expect(response.body.purchase.active).toBe(false);
      expect(response.body.purchase.consumed).toBe(false);
      expect(response.body.remainingCoins).toBe(75); // 100 - 25

      // Verify user state was updated
      const user = await getTestUser();
      expect(user.learningProgress.coins).toBe(75);
      expect(user.purchasedItems.length).toBe(1);
      expect(user.purchasedItems[0].itemId).toBe(1);
    });

    it('should fail with insufficient coins', async () => {
      // Set user to have insufficient coins
      await updateTestUser({
        learningProgress: { xp: 0, coins: 10 }
      });

      const response = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 1 }); // XP Booster (25 coins)

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient coins');
      expect(response.body.userCoins).toBe(10);
      expect(response.body.itemPrice).toBe(25);

      // Verify user state was not changed
      const user = await getTestUser();
      expect(user.learningProgress.coins).toBe(10);
      expect(user.purchasedItems.length).toBe(0);
    });

    it('should fail when item ID is missing', async () => {
      const response = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Item ID is required');
    });

    it('should fail when item ID is invalid', async () => {
      const response = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 999 });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Item not found');
    });

    it('should allow purchasing multiple boosters of the same type', async () => {
      await updateTestUser({
        learningProgress: { xp: 0, coins: 100 }
      });

      // Purchase first XP Booster
      const firstPurchase = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 1 });

      expect(firstPurchase.status).toBe(200);
      expect(firstPurchase.body.success).toBe(true);

      // Purchase second XP Booster (should be allowed for boosters)
      const secondPurchase = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 1 });

      expect(secondPurchase.status).toBe(200);
      expect(secondPurchase.body.success).toBe(true);

      // Verify both purchases exist
      const user = await getTestUser();
      expect(user.purchasedItems.length).toBe(2);
      expect(user.purchasedItems.every(p => p.itemId === 1)).toBe(true);
      expect(user.learningProgress.coins).toBe(50); // 100 - 25 - 25
    });


    it('should generate unique purchase IDs for rapid purchases in the same millisecond', async () => {
      await updateTestUser({
        learningProgress: { xp: 0, coins: 100 }
      });

      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

      const firstPurchase = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 1 });

      const secondPurchase = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 1 });

      nowSpy.mockRestore();

      expect(firstPurchase.status).toBe(200);
      expect(secondPurchase.status).toBe(200);
      expect(firstPurchase.body.purchase.id).not.toBe(secondPurchase.body.purchase.id);

      const user = await getTestUser();
      const uniqueIds = new Set(user.purchasedItems.map(p => p.id));
      expect(uniqueIds.size).toBe(user.purchasedItems.length);
    });
  });

  describe('POST /api/shop/use', () => {
    let purchaseId;

    beforeEach(async () => {
      // Purchase an item before each test
      await updateTestUser({
        learningProgress: { xp: 0, coins: 100 }
      });

      const purchaseResponse = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 1 }); // XP Booster

      expect(purchaseResponse.status).toBe(200);
      purchaseId = purchaseResponse.body.purchase.id;
    });

    it('should successfully use a booster item', async () => {
      const response = await request(app)
        .post('/api/shop/use')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ purchaseId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Item used successfully');
      expect(response.body.purchase.consumed).toBe(true);
      expect(response.body.purchase.active).toBe(true);
      expect(response.body.activeEffects).toBeDefined();

      // Verify active effects were created
      const effectKeys = Object.keys(response.body.activeEffects);
      expect(effectKeys.length).toBeGreaterThan(0);

      // Verify user state was updated
      const user = await getTestUser();
      expect(user.purchasedItems[0].consumed).toBe(true);
      expect(user.purchasedItems[0].active).toBe(true);
      expect(user.activeEffects).toBeDefined();
      expect(Object.keys(user.activeEffects).length).toBeGreaterThan(0);
    });

    it('should successfully use an instant XP utility item', async () => {
      // Purchase XP Bundle instead
      await updateTestUser({
        learningProgress: { xp: 0, coins: 100 },
        purchasedItems: []
      });

      const purchaseResponse = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 4 }); // XP Bundle

      expect(purchaseResponse.status).toBe(200);
      const xpBundlePurchaseId = purchaseResponse.body.purchase.id;

      // Use the XP Bundle
      const useResponse = await request(app)
        .post('/api/shop/use')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ purchaseId: xpBundlePurchaseId });

      expect(useResponse.status).toBe(200);
      expect(useResponse.body.success).toBe(true);
      expect(useResponse.body.purchase.consumed).toBe(true);
      expect(useResponse.body.learningProgress.xp).toBe(200); // Instant 200 XP

      // Verify user state was updated
      const user = await getTestUser();
      expect(user.learningProgress.xp).toBe(200);
      expect(user.purchasedItems[0].consumed).toBe(true);
    });

    it('should successfully use a skip token utility item', async () => {
      // Purchase Lesson Skip Token
      await updateTestUser({
        learningProgress: { xp: 0, coins: 100 },
        purchasedItems: []
      });

      const purchaseResponse = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 5 }); // Lesson Skip Token

      expect(purchaseResponse.status).toBe(200);
      const skipTokenPurchaseId = purchaseResponse.body.purchase.id;

      // Use the skip token
      const useResponse = await request(app)
        .post('/api/shop/use')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ purchaseId: skipTokenPurchaseId });

      expect(useResponse.status).toBe(200);
      expect(useResponse.body.success).toBe(true);
      expect(useResponse.body.purchase.consumed).toBe(true);
      expect(useResponse.body.skipTokens).toBe(1);

      // Verify user state was updated
      const user = await getTestUser();
      expect(user.skipTokens).toBe(1);
      expect(user.purchasedItems[0].consumed).toBe(true);
    });

    it('should fail when trying to use an already consumed item (double-use)', async () => {
      // First use - should succeed
      const firstUse = await request(app)
        .post('/api/shop/use')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ purchaseId });

      expect(firstUse.status).toBe(200);
      expect(firstUse.body.success).toBe(true);
      expect(firstUse.body.purchase.consumed).toBe(true);

      // Second use - should fail
      const secondUse = await request(app)
        .post('/api/shop/use')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ purchaseId });

      expect(secondUse.status).toBe(400);
      expect(secondUse.body.success).toBe(false);
      expect(secondUse.body.message).toBe('This item has already been used');
    });

    it('should fail when purchase ID is missing', async () => {
      const response = await request(app)
        .post('/api/shop/use')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Purchase ID is required');
    });

    it('should fail when purchase ID is invalid', async () => {
      const response = await request(app)
        .post('/api/shop/use')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ purchaseId: 'invalid-purchase-id' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Purchase not found');
    });

    it('should fail when user has no purchased items', async () => {
      // Clear purchased items
      await updateTestUser({
        purchasedItems: []
      });

      const response = await request(app)
        .post('/api/shop/use')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ purchaseId: 'some-id' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No purchased items found');
    });

    it('should successfully use a streak freeze utility item', async () => {
      // Purchase Streak Freeze
      await updateTestUser({
        learningProgress: { xp: 0, coins: 100 },
        purchasedItems: []
      });

      const purchaseResponse = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 6 }); // Streak Freeze

      expect(purchaseResponse.status).toBe(200);
      const streakFreezePurchaseId = purchaseResponse.body.purchase.id;

      // Use the streak freeze
      const useResponse = await request(app)
        .post('/api/shop/use')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ purchaseId: streakFreezePurchaseId });

      expect(useResponse.status).toBe(200);
      expect(useResponse.body.success).toBe(true);
      expect(useResponse.body.purchase.consumed).toBe(true);
      expect(useResponse.body.streakFreezes).toBe(3); // 3 days

      // Verify user state was updated
      const user = await getTestUser();
      expect(user.streakFreezes).toBe(3);
      expect(user.purchasedItems[0].consumed).toBe(true);
    });
  });

  describe('Shop endpoints - Authentication', () => {
    it('should require authentication for purchase', async () => {
      const response = await request(app)
        .post('/api/shop/purchase')
        .send({ itemId: 1 });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No token provided');
    });

    it('should require authentication for use', async () => {
      const response = await request(app)
        .post('/api/shop/use')
        .send({ purchaseId: 'some-id' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No token provided');
    });
  });

  describe('Shop endpoints - Security & Edge Cases', () => {
    let secondUserToken;
    let secondUserId;

    beforeAll(async () => {
      // Create a second user for cross-user tests
      const secondEmail = `shop-test-2-${Date.now()}@example.com`;
      const secondUsername = `shopuser2${Math.floor(Math.random() * 10000)}`;

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: secondEmail,
          password: 'TestPassword123!',
          name: 'Second Test User',
          username: secondUsername
        });

      expect(registerResponse.status).toBe(200);
      secondUserToken = registerResponse.body.token;
      const decoded = jwt.verify(secondUserToken, process.env.JWT_SECRET || 'your-secret-key');
      secondUserId = decoded.userId;
    });

    it('should reject string itemId (prevents type coercion attacks)', async () => {
      await updateTestUser({
        learningProgress: { xp: 0, coins: 100 }
      });

      // Send itemId as string "1" instead of number 1
      // The code uses strict equality (===), so this should fail
      const response = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: '1' }); // String instead of number

      // Should fail because strict equality prevents type coercion
      // This is actually a security feature - prevents type coercion attacks
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Item not found');
    });

    it('should prevent coins from going negative', async () => {
      await updateTestUser({
        learningProgress: { xp: 0, coins: 25 }
      });

      // Purchase item that costs exactly what user has
      const response = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 1 }); // Costs 25 coins

      expect(response.status).toBe(200);
      expect(response.body.remainingCoins).toBe(0);

      // Try to purchase another item - should fail
      const secondPurchase = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 1 });

      expect(secondPurchase.status).toBe(400);
      expect(secondPurchase.body.message).toBe('Insufficient coins');
      expect(secondPurchase.body.userCoins).toBe(0);

      // Verify coins are still 0, not negative
      const user = await getTestUser();
      expect(user.learningProgress.coins).toBe(0);
    });

    it('should prevent using another user\'s purchase ID', async () => {
      // User 1 purchases an item
      await updateTestUser({
        learningProgress: { xp: 0, coins: 100 }
      });

      const purchaseResponse = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 1 });

      expect(purchaseResponse.status).toBe(200);
      const user1PurchaseId = purchaseResponse.body.purchase.id;

      // User 2 tries to use User 1's purchase ID
      // User 2 has no purchased items, so the check fails early (security feature)
      const useResponse = await request(app)
        .post('/api/shop/use')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({ purchaseId: user1PurchaseId });

      expect(useResponse.status).toBe(404);
      expect(useResponse.body.success).toBe(false);
      // The code checks if user has purchasedItems first, preventing info leakage
      expect(useResponse.body.message).toBe('No purchased items found');

      // Verify User 1's purchase is still unused and belongs to User 1
      const user1 = await getTestUser();
      const user1Purchase = user1.purchasedItems.find(p => p.id === user1PurchaseId);
      expect(user1Purchase).toBeDefined();
      expect(user1Purchase.consumed).toBe(false);
    });

    it('should not allow using itemId as purchaseId for consumed items', async () => {
      await updateTestUser({
        learningProgress: { xp: 0, coins: 100 }
      });

      // Purchase and use an item
      const purchaseResponse = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 1 });

      const purchaseId = purchaseResponse.body.purchase.id;

      // Use the item
      const useResponse = await request(app)
        .post('/api/shop/use')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ purchaseId });

      expect(useResponse.status).toBe(200);
      expect(useResponse.body.purchase.consumed).toBe(true);

      // Try to use itemId "1" as purchaseId (legacy fallback) - should fail because item is consumed
      const legacyUseResponse = await request(app)
        .post('/api/shop/use')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ purchaseId: '1' }); // itemId as string

      // Should fail because the item is already consumed
      // The legacy fallback checks if consumed, so this should return 404 or 400
      expect(legacyUseResponse.status).not.toBe(200);
    });

    it('should reject null itemId', async () => {
      const response = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: null });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Item ID is required');
    });

    it('should reject undefined itemId', async () => {
      const response = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: undefined });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Item ID is required');
    });

    it('should reject zero itemId (treated as falsy)', async () => {
      const response = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 0 });

      // Zero is treated as falsy in JavaScript, so it's caught by the "Item ID is required" check
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Item ID is required');
    });

    it('should reject negative itemId', async () => {
      const response = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: -1 });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Item not found');
    });

    it('should handle purchase with exactly enough coins (edge case)', async () => {
      await updateTestUser({
        learningProgress: { xp: 0, coins: 25 } // Exactly the price of item 1
      });

      const response = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 1 }); // Costs 25 coins

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.remainingCoins).toBe(0);

      const user = await getTestUser();
      expect(user.learningProgress.coins).toBe(0);
      expect(user.learningProgress.coins).not.toBeLessThan(0);
    });

    it('should prevent using purchaseId that belongs to a different user even if guessed', async () => {
      // User 1 makes a purchase
      await updateTestUser({
        learningProgress: { xp: 0, coins: 100 }
      });

      const purchaseResponse = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 1 });

      const user1PurchaseId = purchaseResponse.body.purchase.id;

      // User 2 tries to use User 1's purchaseId directly
      // Since User 2 has no purchased items, the check fails early
      const maliciousUse = await request(app)
        .post('/api/shop/use')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({ purchaseId: user1PurchaseId });

      expect(maliciousUse.status).toBe(404);
      // Code checks for purchasedItems first, preventing information leakage about other users' purchases
      expect(maliciousUse.body.message).toBe('No purchased items found');

      // Verify User 1's purchase is still unused and belongs to User 1
      const user1 = await getTestUser();
      const user1Purchase = user1.purchasedItems.find(p => p.id === user1PurchaseId);
      expect(user1Purchase).toBeDefined();
      expect(user1Purchase.consumed).toBe(false);
    });

    it('should prevent User 2 from using User 1\'s purchase ID even when User 2 has purchases', async () => {
      // User 1 makes a purchase
      await updateTestUser({
        learningProgress: { xp: 0, coins: 100 }
      });

      const user1PurchaseResponse = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 1 });

      const user1PurchaseId = user1PurchaseResponse.body.purchase.id;

      // User 2 makes their own purchase
      const secondUser = await app.locals.storage.getUserById(secondUserId);
      secondUser.learningProgress = { xp: 0, coins: 100 };
      await app.locals.storage.saveUser(secondUser);

      const user2PurchaseResponse = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({ itemId: 1 });

      expect(user2PurchaseResponse.status).toBe(200);
      const user2PurchaseId = user2PurchaseResponse.body.purchase.id;

      // User 2 tries to use User 1's purchase ID instead of their own
      const maliciousUse = await request(app)
        .post('/api/shop/use')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({ purchaseId: user1PurchaseId });

      expect(maliciousUse.status).toBe(404);
      expect(maliciousUse.body.success).toBe(false);
      expect(maliciousUse.body.message).toBe('Purchase not found');

      // Verify User 1's purchase is still unused
      const user1 = await getTestUser();
      const user1Purchase = user1.purchasedItems.find(p => p.id === user1PurchaseId);
      expect(user1Purchase).toBeDefined();
      expect(user1Purchase.consumed).toBe(false);

      // Verify User 2 can still use their own purchase
      const legitimateUse = await request(app)
        .post('/api/shop/use')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({ purchaseId: user2PurchaseId });

      expect(legitimateUse.status).toBe(200);
      expect(legitimateUse.body.success).toBe(true);
    });

    it('should handle missing effect data gracefully', async () => {
      await updateTestUser({
        learningProgress: { xp: 0, coins: 100 },
        purchasedItems: [{
          id: 'test-purchase-1',
          itemId: 1,
          itemName: 'Test Item',
          itemType: 'booster',
          price: 25,
          purchasedAt: new Date().toISOString(),
          effect: null, // Missing effect
          active: false,
          consumed: false
        }]
      });

      const response = await request(app)
        .post('/api/shop/use')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ purchaseId: 'test-purchase-1' });

      // Should fail because effect is missing or invalid
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should prevent purchasing when coins are exactly 0', async () => {
      await updateTestUser({
        learningProgress: { xp: 0, coins: 0 }
      });

      const response = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 1 }); // Costs 25 coins

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient coins');
      expect(response.body.userCoins).toBe(0);
    });

    it('should validate purchaseId is not empty string', async () => {
      const response = await request(app)
        .post('/api/shop/use')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ purchaseId: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Purchase ID is required');
    });

    it('should handle concurrent purchase attempts (race condition simulation)', async () => {
      await updateTestUser({
        learningProgress: { xp: 0, coins: 30 } // Enough for one purchase of item 4 (30 coins)
      });

      // Simulate two concurrent purchases
      const [purchase1, purchase2] = await Promise.all([
        request(app)
          .post('/api/shop/purchase')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ itemId: 4 }), // XP Bundle (30 coins)
        request(app)
          .post('/api/shop/purchase')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ itemId: 4 }) // XP Bundle (30 coins)
      ]);

      // One should succeed, one should fail
      const successCount = [purchase1, purchase2].filter(r => r.status === 200).length;
      const failureCount = [purchase1, purchase2].filter(r => r.status === 400).length;

      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);

      // Verify coins are not negative
      const user = await getTestUser();
      expect(user.learningProgress.coins).toBeGreaterThanOrEqual(0);
    });

    it('should prevent using purchaseId with invalid JWT token', async () => {
      await updateTestUser({
        learningProgress: { xp: 0, coins: 100 }
      });

      const purchaseResponse = await request(app)
        .post('/api/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 1 });

      const purchaseId = purchaseResponse.body.purchase.id;

      // Try to use with invalid token
      const invalidToken = 'invalid.jwt.token';
      const response = await request(app)
        .post('/api/shop/use')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send({ purchaseId });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token');
    });
  });
});

