const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const { OAuth2Client } = require('google-auth-library');
const { sendGoalReminder, sendWelcomeEmail } = require('../services/emailService');
const { requireApproved } = require('../middleware/requireApproved');

const JWT_SECRET = process.env.JWT_SECRET;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const logAuthAttempt = (req, details) => {
  const logger = req.app?.locals?.authLogger;
  if (!logger) {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('user-agent'),
    ...details
  };

  logger.write(`${JSON.stringify(entry)}\n`);
};

const rateLimitHandler = (req, res, next, options) => {
  logAuthAttempt(req, {
    action: 'rate-limit',
    success: false,
    identifier: req.body?.emailOrUsername || req.body?.email || 'unknown',
    message: 'Too many authentication attempts'
  });
  res.status(options.statusCode).json({
    success: false,
    message: 'Too many attempts. Please try again later.'
  });
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

// Dedicated limiter for sensitive account mutations (profile/data/delete).
const accountMutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

// Stricter limiter for the public (unauthenticated) leaderboard endpoint to
// protect this user-enumerating read from abuse/scraping.
const leaderboardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Async storage access
const storageOf = (req) => req.app.locals.storage;

// Generate unique user ID (cryptographically random)
const generateUserId = () => `user_${crypto.randomUUID()}`;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

// Validate username format
const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};

// Basic email format validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validateEmail = (email) => EMAIL_REGEX.test(email);

// Password complexity: min 8 chars and at least one lowercase, uppercase, digit, symbol
const validatePasswordComplexity = (password) => {
  if (typeof password !== 'string' || password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^a-zA-Z0-9]/.test(password)) return false;
  return true;
};

// Whitelist schema for bulk user-data writes. Only learning-progress-style fields
// are accepted from the client; server owns money/inventory (balance/coins/xp) via
// trading/shop, so those are never trusted from this endpoint.
//
// learningProgress: validated as a record of progress fields. `coins` and `xp`
// are server-owned currency — they are explicitly stripped here and re-merged
// from the persisted user record below so a client can never mint currency by
// POSTing {learningProgress:{coins:999999, xp:999999}}.
const learningProgressSchema = z
  .object({
    completedLessons: z.array(z.any()).max(10000).optional(),
    completedUnitTests: z.array(z.any()).max(10000).optional(),
    finalTestCompleted: z.boolean().optional(),
    finalTestLastAttempt: z.any().optional(),
    unitTestAttempts: z.record(z.string(), z.any()).optional(),
    lessonAttempts: z.record(z.string(), z.any()).optional(),
    dailyGoal: z.number().int().optional(),
  })
  // Drop unknown/extra fields entirely — including client-supplied coins/xp
  // AND the streak fields (currentStreak/longestStreak/lastActivityDate),
  // which are server-owned and maintained by the /api/progress award path.
  .strip();

// purchasedItems: the shop endpoints own purchases/effects, but the frontend
// syncs item state (e.g. consumed/active) through /user-data, so we keep the
// field but constrain each entry to a known, effect-free shape and drop any
// extra fields. Capped to a sane max length.
const purchasedItemSchema = z
  .object({
    id: z.string(),
    itemId: z.union([z.string(), z.number()]).optional(),
    itemName: z.string().optional(),
    price: z.number().optional(),
    consumed: z.boolean().optional(),
    active: z.boolean().optional(),
  })
  .strip();

const userDataSchema = z
  .object({
    learningProgress: learningProgressSchema.optional(),
    purchasedItems: z.array(purchasedItemSchema).max(500).optional(),
  })
  .passthrough();

// Validation for learning preferences updates.
const learningPreferencesSchema = z
  .object({
    dailyGoal: z.number().int().min(1).max(100).optional(),
    notifications: z.boolean().optional(),
  })
  .strip();

// Register new user
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name, username } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = typeof name === 'string' ? name.trim() : '';

    if (!normalizedEmail || !password || !normalizedName || !username) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, name, and username are required'
      });
    }

    // Validate email format
    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate name length
    if (normalizedName.length < 1 || normalizedName.length > 60) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 1 and 60 characters'
      });
    }

    // Validate username format
    if (!validateUsername(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-30 characters long and contain only letters, numbers, and underscores'
      });
    }

    // Validate password complexity
    if (!validatePasswordComplexity(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include a lowercase letter, an uppercase letter, a number, and a symbol'
      });
    }

    const storage = storageOf(req);

    // Check if user already exists by email or username
    const existingUserByEmail = await storage.getUserByEmail(normalizedEmail);
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. This email may be associated with a Google account. Please try logging in instead, or use a different email address.'
      });
    }

    const existingUserByUsername = await storage.getUserByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken. Please choose a different username.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user with initial data
    const userId = generateUserId();
    const newUser = {
      id: userId,
      email: normalizedEmail,
      username,
      password: hashedPassword,
      name: normalizedName,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      // Initialize user-specific data
      portfolio: {
        balance: 10000, // Starting balance
        positions: [],
        totalValue: 10000
      },
      learningProgress: {
        xp: 0,
        coins: 0,
        completedLessons: [],
        completedUnitTests: [],
        finalTestCompleted: false,
        finalTestLastAttempt: null,
        unitTestAttempts: {},
        lessonAttempts: {}
      },
      purchasedItems: []
    };

    await storage.saveUser(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send welcome email (don't wait for it to complete)
    sendWelcomeEmail(newUser.email, newUser.name).catch(error => {
      console.error('Failed to send welcome email:', error);
    });

    logAuthAttempt(req, {
      action: 'register',
      success: true,
      identifier: normalizedEmail
    });

    res.json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        name: newUser.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    logAuthAttempt(req, {
      action: 'register',
      success: false,
      identifier: normalizeEmail(req.body?.email),
      message: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Login user with email or username
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    const normalizedIdentity = String(emailOrUsername || '').trim();
    const normalizedEmailIdentity = normalizeEmail(emailOrUsername);
    
    if (!normalizedIdentity || !password) {
      logAuthAttempt(req, {
        action: 'login',
        success: false,
        identifier: normalizedIdentity || 'unknown',
        message: 'Missing credentials'
      });
      return res.status(400).json({
        success: false,
        message: 'Email/username and password are required'
      });
    }

    const storage = storageOf(req);

    // Find user by email (case-insensitive) or username
    let user = await storage.getUserByEmail(normalizedEmailIdentity);
    if (!user) {
      user = await storage.getUserByUsername(normalizedIdentity);
    }

    if (!user) {
      logAuthAttempt(req, {
        action: 'login',
        success: false,
        identifier: normalizedIdentity,
        message: 'User not found'
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password. Please check your credentials and try again.'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      logAuthAttempt(req, {
        action: 'login',
        success: false,
        identifier: normalizedIdentity,
        message: 'Invalid password'
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password. Please check your credentials and try again.'
      });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    await storage.saveUser(user);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logAuthAttempt(req, {
      action: 'login',
      success: true,
      identifier: normalizedIdentity
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    logAuthAttempt(req, {
      action: 'login',
      success: false,
      identifier: String(req.body?.emailOrUsername || '').trim() || 'unknown',
      message: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Google OAuth login
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      logAuthAttempt(req, {
        action: 'google-auth',
        success: false,
        identifier: 'google',
        message: 'Missing token'
      });
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    const normalizedEmail = normalizeEmail(email);

    const storage = storageOf(req);

    // Check if user exists
    let user = await storage.getUserByEmail(normalizedEmail);
    const isNewUser = !user;

    if (!user) {
      // Create new user with generated username
      const userId = generateUserId();
      const username = `user_${crypto.randomUUID()}`;

      user = {
        id: userId,
        email: normalizedEmail,
        username,
        name,
        picture,
        googleId: payload.sub,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        // Initialize user-specific data
        portfolio: {
          balance: 10000,
          positions: [],
          totalValue: 10000
        },
        learningProgress: {
          xp: 0,
          coins: 0,
          completedLessons: [],
          completedUnitTests: [],
          finalTestCompleted: false,
          finalTestLastAttempt: null,
          unitTestAttempts: {},
          lessonAttempts: {}
        },
        purchasedItems: []
      };

      logAuthAttempt(req, {
        action: 'google-auth',
        success: true,
        identifier: normalizedEmail,
        message: 'Registered via Google'
      });
    } else {
      // Update existing user
      user.lastLogin = new Date().toISOString();
      user.picture = picture;

      logAuthAttempt(req, {
        action: 'google-auth',
        success: true,
        identifier: normalizedEmail,
        message: 'Login via Google'
      });
    }

    await storage.saveUser(user);

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Send welcome email for new users (don't wait for it to complete)
    if (isNewUser) {
      sendWelcomeEmail(user.email, user.name).catch(error => {
        console.error('Failed to send welcome email:', error);
      });
    }
    
    res.json({
      success: true,
      message: 'Google login successful',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        picture: user.picture
      }
    });
  } catch (error) {
    console.error('Google login error:', error.message);
    logAuthAttempt(req, {
      action: 'google-auth',
      success: false,
      identifier: 'google',
      message: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Google login failed'
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const storage = storageOf(req);
    const user = await storage.getUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Ensure user has learning preferences
    if (!user.learningPreferences) {
      user.learningPreferences = {
        dailyGoal: 3,
        notifications: true,
        difficulty: 'auto'
      };
      await storage.saveUser(user);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        picture: user.picture,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Get user data (portfolio and learning progress)
router.get('/user-data', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const storage = storageOf(req);
    const user = await storage.getUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const originalPurchases = user.purchasedItems || [];
    let purchasesUpdated = false;
    const sanitizedPurchases = originalPurchases.map(purchase => {
      if (!purchase) return purchase;
      if (purchase.active && !purchase.consumed) {
        purchasesUpdated = true;
        return {
          ...purchase,
          active: false,
          activatedAt: null
        };
      }
      return purchase;
    });

    if (purchasesUpdated) {
      user.purchasedItems = sanitizedPurchases;
      await storage.saveUser(user);
    }

    res.json({
      success: true,
      portfolio: user.portfolio || {
        balance: 10000,
        positions: [],
        totalValue: 10000
      },
      learningProgress: user.learningProgress || {
        xp: 0,
        coins: 0,
        completedLessons: [],
        completedUnitTests: [],
        finalTestCompleted: false,
        finalTestLastAttempt: null,
        unitTestAttempts: {},
        lessonAttempts: {}
      },
      purchasedItems: user.purchasedItems || [],
      skipTokens: user.skipTokens || 0,
      streakFreezes: user.streakFreezes || 0,
      activeEffects: user.activeEffects || {}
    });
  } catch (error) {
    console.error('User data error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Update user data (portfolio and learning progress)
router.post('/user-data', accountMutationLimiter, authenticateToken, requireApproved, async (req, res) => {
  try {
    const storage = storageOf(req);
    const user = await storage.getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate/whitelist client input: only learningProgress and purchasedItems
    // may be set here. Money/inventory (balance/coins/xp) are server-owned and
    // must never be set arbitrarily from this bulk-write endpoint.
    const parsed = userDataSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user data payload'
      });
    }

    const { learningProgress, purchasedItems } = parsed.data;

    // Update only whitelisted user data. `portfolio` from the client is ignored
    // here — its balance/coins/xp are owned by the trading/shop flows.
    if (learningProgress) {
      // Currency (coins/xp) is server-owned: always preserve the EXISTING server
      // values and ignore anything the client supplied. The schema already strips
      // client coins/xp, but we re-assert them explicitly to be safe.
      const existing = user.learningProgress || {};
      user.learningProgress = {
        ...existing,
        ...learningProgress,
        coins: existing.coins || 0,
        xp: existing.xp || 0
      };
    }
    if (purchasedItems) user.purchasedItems = purchasedItems;

    await storage.saveUser(user);

    res.json({
      success: true,
      message: 'User data updated successfully'
    });
  } catch (error) {
    console.error('Update user data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user data'
    });
  }
});

// Update user profile (name, username, email)
router.put('/profile', accountMutationLimiter, authenticateToken, requireApproved, async (req, res) => {
  try {
    const storage = storageOf(req);
    const user = await storage.getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { name, username, email } = req.body;
    const normalizedName = name !== undefined ? String(name).trim() : undefined;
    const normalizedEmail = email !== undefined ? normalizeEmail(email) : undefined;

    // Validate name length if provided
    if (normalizedName !== undefined && (normalizedName.length < 1 || normalizedName.length > 60)) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 1 and 60 characters'
      });
    }

    // Validate username format if provided
    if (username && !validateUsername(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-30 characters long and contain only letters, numbers, and underscores'
      });
    }

    // Validate email format if provided
    if (normalizedEmail !== undefined && !validateEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if username is already taken (if changing)
    if (username && username !== user.username) {
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername && existingUserByUsername.id !== user.id) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken. Please choose a different username.'
        });
      }
    }

    // Check if email is already taken (if changing)
    if (normalizedEmail !== undefined && normalizedEmail !== user.email) {
      const existingUserByEmail = await storage.getUserByEmail(normalizedEmail);
      if (existingUserByEmail && existingUserByEmail.id !== user.id) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered. This email may be associated with a Google account. Please try logging in instead, or use a different email address.'
        });
      }
    }

    // Update user profile
    if (normalizedName) user.name = normalizedName;
    if (username) user.username = username;
    if (normalizedEmail) user.email = normalizedEmail;

    await storage.saveUser(user);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        picture: user.picture,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Update learning preferences
router.put('/learning-preferences', accountMutationLimiter, authenticateToken, requireApproved, async (req, res) => {
  try {
    const storage = storageOf(req);
    const user = await storage.getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate input: dailyGoal int 1..100 optional, notifications boolean optional.
    const parsedPrefs = learningPreferencesSchema.safeParse(req.body || {});
    if (!parsedPrefs.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid learning preferences payload'
      });
    }

    const { dailyGoal, notifications } = parsedPrefs.data;

    // Initialize learning preferences if they don't exist
    if (!user.learningPreferences) {
      user.learningPreferences = {
        dailyGoal: 3,
        notifications: true
      };
    }

    // Update preferences
    if (dailyGoal !== undefined) user.learningPreferences.dailyGoal = dailyGoal;
    if (notifications !== undefined) user.learningPreferences.notifications = notifications;

    await storage.saveUser(user);

    res.json({
      success: true,
      message: 'Learning preferences updated successfully',
      preferences: user.learningPreferences
    });
  } catch (error) {
    console.error('Learning preferences update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update learning preferences'
    });
  }
});

// Get learning preferences
router.get('/learning-preferences', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const storage = storageOf(req);
    const user = await storage.getUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Ensure user has learning preferences
    if (!user.learningPreferences) {
      user.learningPreferences = {
        dailyGoal: 3,
        notifications: true
      };
      await storage.saveUser(user);
    }

    res.json({
      success: true,
      preferences: user.learningPreferences
    });
  } catch (error) {
    console.error('Get learning preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get learning preferences'
    });
  }
});

// Export user data
router.get('/export-data', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const storage = storageOf(req);
    const user = await storage.getUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare export data (excluding sensitive information)
    const exportData = {
      profile: {
        name: user.name,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      portfolio: user.portfolio || {
        balance: 10000,
        positions: [],
        totalValue: 10000
      },
      learningProgress: user.learningProgress || {
        xp: 0,
        coins: 0,
        completedLessons: [],
        completedUnitTests: [],
        finalTestCompleted: false,
        unitTestAttempts: {},
        lessonAttempts: {}
      },
      learningPreferences: user.learningPreferences || {
        dailyGoal: 3,
        notifications: true,
        difficulty: 'auto'
      },
      purchasedItems: user.purchasedItems || [],
      exportDate: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${user.username}-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data'
    });
  }
});

// Reset learning progress
router.post('/reset-progress', accountMutationLimiter, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const storage = storageOf(req);
    const user = await storage.getUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Reset learning progress
    user.learningProgress = {
      xp: 0,
      coins: 0,
      completedLessons: [],
      completedUnitTests: [],
      finalTestCompleted: false,
      finalTestLastAttempt: null,
      unitTestAttempts: {},
      lessonAttempts: {}
    };

    await storage.saveUser(user);

    res.json({
      success: true,
      message: 'Learning progress reset successfully'
    });
  } catch (error) {
    console.error('Reset progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset progress'
    });
  }
});

// Change password (for password-based accounts; Google-only accounts have none)
router.post('/change-password', accountMutationLimiter, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const storage = storageOf(req);
    const user = await storage.getUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required'
      });
    }

    // Accounts created via Google OAuth have no local password to verify.
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google sign-in and has no password to change'
      });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    if (!validatePasswordComplexity(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include a lowercase letter, an uppercase letter, a number, and a symbol'
      });
    }

    // Reject a no-op change so "changed" always means the secret actually rotated.
    const isSameAsCurrent = await bcrypt.compare(newPassword, user.password);
    if (isSameAsCurrent) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from your current password'
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await storage.saveUser(user);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// Delete account
router.delete('/account', accountMutationLimiter, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const storage = storageOf(req);
    const user = await storage.getUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user account (cascades portfolio + transactions)
    await storage.deleteUser(decoded.userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
});

// Send goal reminder email
router.post('/send-goal-reminder', authenticateToken, async (req, res) => {
  console.log('Received goal reminder request');
  try {
    const storage = storageOf(req);
    const user = await storage.getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if notifications are enabled
    if (!user.learningPreferences?.notifications) {
      return res.status(400).json({
        success: false,
        message: 'Notifications are disabled for this user'
      });
    }

    // Calculate today's progress
    const today = new Date().toDateString();
    const lessonAttempts = user.learningProgress?.lessonAttempts || {};
    
    const lessonsCompletedToday = Object.keys(lessonAttempts).filter(lessonId => {
      const attempt = lessonAttempts[lessonId];
      if (attempt.lastAttempt) {
        const attemptDate = new Date(attempt.lastAttempt).toDateString();
        return attemptDate === today && attempt.completed;
      }
      return false;
    }).length;

    const dailyGoal = user.learningPreferences?.dailyGoal || 3;

    // Send email reminder
    const emailSent = await sendGoalReminder(
      user.email,
      user.name || user.username,
      dailyGoal,
      lessonsCompletedToday
    );

    if (emailSent) {
      res.json({
        success: true,
        message: 'Goal reminder email sent successfully',
        data: {
          dailyGoal,
          completedToday: lessonsCompletedToday,
          remaining: Math.max(dailyGoal - lessonsCompletedToday, 0)
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send goal reminder email'
      });
    }
  } catch (error) {
    console.error('Send goal reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send goal reminder'
    });
  }
});

// Test endpoint to add coins (for testing shop functionality)
router.post('/add-test-coins', authenticateToken, async (req, res) => {
  try {
    // Test-only endpoint: never allow in production.
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is not available in production'
      });
    }

    const { amount } = req.body;
    const storage = storageOf(req);
    const user = await storage.getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.learningProgress) {
      user.learningProgress = { xp: 0, coins: 0 };
    }

    const coinsToAdd = amount || 100;
    user.learningProgress.coins += coinsToAdd;

    await storage.saveUser(user);

    console.log(`[TEST] Added ${coinsToAdd} coins to user ${req.user.userId}. New balance: ${user.learningProgress.coins}`);

    res.json({
      success: true,
      message: `Added ${coinsToAdd} test coins`,
      newBalance: user.learningProgress.coins
    });
  } catch (error) {
    console.error('Add test coins error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add test coins'
    });
  }
});

// Get leaderboard
router.get('/leaderboard', leaderboardLimiter, async (req, res) => {
  try {
    const users = await storageOf(req).getUsers();

    // Convert users object to array and extract relevant data
    const leaderboardData = Object.values(users)
      .map(user => ({
        userId: user.id,
        username: user.username,
        name: user.name,
        xp: user.learningProgress?.xp || 0,
        coins: user.learningProgress?.coins || 0,
        completedLessons: user.learningProgress?.completedLessons?.length || 0,
        totalValue: user.portfolio?.totalValue || 0,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }))
      .filter(user => user.xp > 0) // Only include users with some XP
      .sort((a, b) => b.xp - a.xp) // Sort by XP descending
      .slice(0, 10) // Top 10 users
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    res.json({
      success: true,
      leaderboard: leaderboardData,
      totalUsers: Object.keys(users).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard'
    });
  }
});

// Export middleware for use in other routes
router.authenticateToken = authenticateToken;

module.exports = router; 
