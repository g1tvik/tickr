const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { sendGoalReminder, sendWelcomeEmail } = require('../services/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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

// Validate username format
const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, username } = req.body;
    
    if (!email || !password || !name || !username) {
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
    const existingUserByEmail = Object.values(users).find(user => user.email === email);
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const existingUserByUsername = Object.values(users).find(user => user.username === username);
    if (existingUserByUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user with initial data
    const userId = generateUserId();
    const newUser = {
      id: userId,
      email,
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
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Send welcome email (don't wait for it to complete)
    sendWelcomeEmail(newUser.email, newUser.name).catch(error => {
      console.error('Failed to send welcome email:', error);
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
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Login user with email or username
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    
    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/username and password are required'
      });
    }

    const users = getUsers(req);
    
    // Find user by email or username
    const user = Object.values(users).find(u => 
      u.email === emailOrUsername || u.username === emailOrUsername
    );
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    users[user.id] = user;
    saveUsers(req, users);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

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
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Google OAuth login
router.post('/google', async (req, res) => {
  try {
    console.log('🔍 Google OAuth request received');
    console.log('🔍 Environment variables:', {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET'
    });
    
    const { token } = req.body;
    
    if (!token) {
      console.error('❌ No token provided in request body');
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    console.log('🔍 Token received, length:', token.length);
    console.log('🔍 Token preview:', token.substring(0, 50) + '...');

    // Verify Google token
    console.log('🔍 Verifying Google token...');
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    console.log('✅ Google token verified successfully');
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    
    console.log('🔍 Google user info:', { email, name, picture: picture ? 'SET' : 'NOT SET' });

    const users = getUsers(req);
    
    // Check if user exists
    let user = Object.values(users).find(u => u.email === email);
    const isNewUser = !user;
    console.log('🔍 User lookup result:', user ? 'EXISTING USER' : 'NEW USER');
    
    if (!user) {
      // Create new user with generated username
      const userId = generateUserId();
      const username = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      console.log('🔍 Creating new user with ID:', userId, 'Username:', username);
      
      user = {
        id: userId,
        email,
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
    } else {
      // Update existing user
      console.log('🔍 Updating existing user:', user.id);
      user.lastLogin = new Date().toISOString();
      user.picture = picture;
      users[user.id] = user;
    }

    console.log('🔍 Saving user data...');
    saveUsers(req, users);
    console.log('✅ User data saved successfully');

    // Generate JWT token
    console.log('🔍 Generating JWT token...');
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    console.log('✅ JWT token generated successfully');

    console.log('✅ Google OAuth login completed successfully');
    
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
    console.error('❌ Google login error:', error);
    console.error('❌ Error stack:', error.stack);
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const users = getUsers(req);
    const user = users[decoded.userId];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
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
      purchasedItems: user.purchasedItems || []
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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
          message: 'Username already taken'
        });
      }
    }

    // Check if email is already taken (if changing)
    if (email && email !== user.email) {
      const existingUserByEmail = Object.values(users).find(u => u.email === email);
      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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

// Export middleware for use in other routes
router.authenticateToken = authenticateToken;

module.exports = router; 