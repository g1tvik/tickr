const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { OAuth2Client } = require('google-auth-library');
const { sendGoalReminder, sendWelcomeEmail } = require('../services/emailService');

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

// File-based user management
const getUsers = (req) => req.app.locals.fileStorage.getUsers();
const saveUsers = (req, users) => req.app.locals.fileStorage.saveUsers(users);

// Generate unique user ID
const generateUserId = () => {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

// Validate username format
const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Register new user
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name, username } = req.body;
    const normalizedEmail = normalizeEmail(email);
    
    if (!normalizedEmail || !password || !name || !username) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, name, and username are required'
      });
    }

    // Validate username format
    if (!validateUsername(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores'
      });
    }

    const users = getUsers(req);
    
    // Check if user already exists by email or username
    const existingUserByEmail = Object.values(users).find(user => normalizeEmail(user.email) === normalizedEmail);
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. This email may be associated with a Google account. Please try logging in instead, or use a different email address.'
      });
    }

    const existingUserByUsername = Object.values(users).find(user => user.username === username);
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
      name,
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

    users[userId] = newUser;
    saveUsers(req, users);

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

    const users = getUsers(req);
    
    // Find user by email or username
    const user = Object.values(users).find(u => 
      normalizeEmail(u.email) === normalizedEmailIdentity || u.username === normalizedIdentity
    );
    
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
    users[user.id] = user;
    saveUsers(req, users);

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

    const users = getUsers(req);
    
    // Check if user exists
    let user = Object.values(users).find(u => normalizeEmail(u.email) === normalizedEmail);
    const isNewUser = !user;
    
    if (!user) {
      // Create new user with generated username
      const userId = generateUserId();
      const username = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
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
      users[userId] = user;

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
      users[user.id] = user;

      logAuthAttempt(req, {
        action: 'google-auth',
        success: true,
        identifier: normalizedEmail,
        message: 'Login via Google'
      });
    }

    saveUsers(req, users);

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
    const users = getUsers(req);
    const user = users[decoded.userId];

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
      users[user.id] = user;
      saveUsers(req, users);
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
    const users = getUsers(req);
    const user = users[decoded.userId];

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
      users[user.id] = user;
      saveUsers(req, users);
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
router.post('/user-data', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const users = getUsers(req);
    const user = users[decoded.userId];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { portfolio, learningProgress, purchasedItems } = req.body;

    // Update user data
    if (portfolio) user.portfolio = portfolio;
    if (learningProgress) user.learningProgress = learningProgress;
    if (purchasedItems) user.purchasedItems = purchasedItems;

    users[user.id] = user;
    saveUsers(req, users);

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
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const users = getUsers(req);
    const user = users[decoded.userId];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { name, username, email } = req.body;

    // Validate username format if provided
    if (username && !validateUsername(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores'
      });
    }

    // Check if username is already taken (if changing)
    if (username && username !== user.username) {
      const existingUserByUsername = Object.values(users).find(u => u.username === username);
      if (existingUserByUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken. Please choose a different username.'
        });
      }
    }

    // Check if email is already taken (if changing)
    if (email && email !== user.email) {
      const existingUserByEmail = Object.values(users).find(u => u.email === email);
      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered. This email may be associated with a Google account. Please try logging in instead, or use a different email address.'
        });
      }
    }

    // Update user profile
    if (name) user.name = name;
    if (username) user.username = username;
    if (email) user.email = email;

    users[user.id] = user;
    saveUsers(req, users);

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
router.put('/learning-preferences', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const users = getUsers(req);
    const user = users[decoded.userId];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { dailyGoal, notifications } = req.body;

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

    users[user.id] = user;
    saveUsers(req, users);

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
    const users = getUsers(req);
    const user = users[decoded.userId];

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
      users[user.id] = user;
      saveUsers(req, users);
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
    const users = getUsers(req);
    const user = users[decoded.userId];

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
router.post('/reset-progress', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const users = getUsers(req);
    const user = users[decoded.userId];

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

    users[user.id] = user;
    saveUsers(req, users);

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

// Delete account
router.delete('/account', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const users = getUsers(req);
    const user = users[decoded.userId];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user account
    delete users[decoded.userId];
    saveUsers(req, users);

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
    const users = getUsers(req);
    const user = users[req.user.userId];

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
router.post('/add-test-coins', authenticateToken, (req, res) => {
  try {
    const { amount } = req.body;
    const users = getUsers(req);
    const user = users[req.user.userId];
    
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
    
    saveUsers(req, users);
    
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
router.get('/leaderboard', async (req, res) => {
  try {
    const users = getUsers(req);
    
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
