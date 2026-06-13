/**
 * Learning-progress rewards — the server-side award path.
 *
 * Currency (XP/coins) is server-owned: POST /auth/user-data strips any
 * client-sent amounts, so these endpoints are the ONLY way lesson/test rewards
 * reach the persisted user. Each mirrors the rules the frontend
 * progressManager has always shown the user:
 *
 *   lesson-complete   progressive top-up: floor(reward * score/100), award the
 *                     delta over what this lesson already paid out (base
 *                     amounts; boosters are a bonus on top)
 *   unit-test         gated on all unit lessons complete; 3 attempts/day and
 *                     3 total; one-time award; completed at score >= 70
 *   final-test        gated on all unit tests + coin unlock; once per day;
 *                     one-time award; completed at score >= 70
 *   unlock-final-test spends coins (server-side deduction)
 *   skip-lesson       consumes one skip token; marks the lesson complete with
 *                     ZERO rewards (tokens unlock progression, not currency)
 *
 * Active booster effects (xp_multiplier / coin_multiplier from the shop) are
 * applied and consumed here — see services/learningRewards.applyActiveBoosters.
 *
 * Gate failures return 200 { success:false, message } (the UI shows these
 * messages verbatim); malformed input returns 400.
 */
const express = require('express');
const authRoutes = require('./auth');
const { requireApproved } = require('../middleware/requireApproved');
const rewards = require('../services/learningRewards');

const router = express.Router();
const authenticateToken = authRoutes.authenticateToken;
const storageOf = (req) => req.app.locals.storage;

const isScore = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100;

/** Shared response payload: the updated, canonical learning progress. */
function progressPayload(user) {
  return { learningProgress: user.learningProgress, activeEffects: user.activeEffects || {} };
}

// ── POST /lesson-complete { lessonId, score } ───────────────────────────────
router.post('/lesson-complete', authenticateToken, requireApproved, async (req, res) => {
  try {
    const lessonId = Number(req.body?.lessonId);
    const score = Number(req.body?.score);
    const lesson = rewards.getLesson(lessonId);
    if (!lesson || !isScore(score)) {
      return res.status(400).json({ success: false, message: 'Invalid lessonId or score' });
    }

    const storage = storageOf(req);
    const result = await storage.withUserLock(req.user.userId, async (tx) => {
      const user = await tx.getUserById(req.user.userId);
      if (!user) return { status: 404, body: { success: false, message: 'User not found' } };

      const lp = rewards.ensureLearningProgress(user);
      const now = new Date();

      // Attempt bookkeeping.
      if (!lp.lessonAttempts[lessonId]) {
        lp.lessonAttempts[lessonId] = { attempts: 0, completed: false, bestScore: 0 };
      }
      const attempt = lp.lessonAttempts[lessonId];
      attempt.attempts += 1;
      attempt.bestScore = Math.max(attempt.bestScore || 0, score);
      attempt.lastAttempt = now.toISOString();

      // Progressive top-up on BASE amounts: each lesson can pay out at most
      // its full reward across all attempts; better scores top up the delta.
      if (!lp.lessonEarnedRewards[lessonId]) lp.lessonEarnedRewards[lessonId] = { xp: 0, coins: 0 };
      const earned = lp.lessonEarnedRewards[lessonId];

      const attemptXp = Math.floor(lesson.xp * (score / 100));
      const attemptCoins = Math.floor(lesson.coins * (score / 100));
      const baseXpToAdd = Math.max(0, attemptXp - earned.xp);
      const baseCoinsToAdd = Math.max(0, attemptCoins - earned.coins);

      // Boosters multiply the awarded delta and are consumed by the event.
      const boosted = rewards.applyActiveBoosters(user, { xp: baseXpToAdd, coins: baseCoinsToAdd }, now);
      lp.xp += boosted.xp;
      lp.coins += boosted.coins;

      earned.xp = Math.max(earned.xp, attemptXp);
      earned.coins = Math.max(earned.coins, attemptCoins);

      const lessonCompleted = !lp.completedLessons.includes(lessonId);
      if (lessonCompleted) {
        lp.completedLessons.push(lessonId);
        attempt.completed = true;
      }
      if (score >= 100) lp.lessonRewards[lessonId] = true;

      await tx.saveUser(user);

      return {
        status: 200,
        body: {
          success: true,
          lessonCompleted,
          xpEarned: boosted.xp,
          coinsEarned: boosted.coins,
          boostsApplied: boosted.applied,
          totalXpPossible: lesson.xp,
          totalCoinsPossible: lesson.coins,
          xpRemaining: Math.max(0, lesson.xp - earned.xp),
          coinsRemaining: Math.max(0, lesson.coins - earned.coins),
          rewardAlreadyGiven: lp.lessonRewards[lessonId] || false,
          totalXpEarned: earned.xp,
          totalCoinsEarned: earned.coins,
          ...progressPayload(user),
        },
      };
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Lesson-complete error:', error);
    res.status(500).json({ success: false, message: 'Failed to record lesson completion' });
  }
});

// ── POST /unit-test { unitId, score } ───────────────────────────────────────
router.post('/unit-test', authenticateToken, requireApproved, async (req, res) => {
  try {
    const unitId = Number(req.body?.unitId);
    const score = Number(req.body?.score);
    const unit = rewards.getUnit(unitId);
    if (!unit || !isScore(score)) {
      return res.status(400).json({ success: false, message: 'Invalid unitId or score' });
    }

    const storage = storageOf(req);
    const result = await storage.withUserLock(req.user.userId, async (tx) => {
      const user = await tx.getUserById(req.user.userId);
      if (!user) return { status: 404, body: { success: false, message: 'User not found' } };

      const lp = rewards.ensureLearningProgress(user);
      const now = new Date();

      const allLessonsCompleted = unit.lessonIds.every((id) => lp.completedLessons.includes(id));
      if (!allLessonsCompleted) {
        return { status: 200, body: { success: false, message: 'Complete all lessons in this unit first' } };
      }

      // Attempt limits — same keys the frontend has always stored.
      const today = now.toDateString();
      const dailyKey = `${unitId}_${today}`;
      const totalKey = `${unitId}_total`;
      const dailyAttempts = lp.unitTestAttempts[dailyKey] || 0;
      const totalAttempts = lp.unitTestAttempts[totalKey] || 0;
      if (dailyAttempts >= 3) {
        return { status: 200, body: { success: false, message: 'No attempts left for today (3 per day limit)' } };
      }
      if (totalAttempts >= 3) {
        return { status: 200, body: { success: false, message: 'No attempts left for this unit test (3 total limit)' } };
      }
      lp.unitTestAttempts[dailyKey] = dailyAttempts + 1;
      lp.unitTestAttempts[totalKey] = totalAttempts + 1;

      // One-time award.
      const alreadyCompleted = lp.completedUnitTests.includes(unitId);
      const baseXp = alreadyCompleted ? 0 : Math.floor(unit.testXp * (score / 100));
      const baseCoins = alreadyCompleted ? 0 : Math.floor(unit.testCoins * (score / 100));
      const boosted = rewards.applyActiveBoosters(user, { xp: baseXp, coins: baseCoins }, now);
      lp.xp += boosted.xp;
      lp.coins += boosted.coins;

      if (score >= 70 && !lp.completedUnitTests.includes(unitId)) {
        lp.completedUnitTests.push(unitId);
      }

      await tx.saveUser(user);

      return {
        status: 200,
        body: {
          success: true,
          xpEarned: boosted.xp,
          coinsEarned: boosted.coins,
          boostsApplied: boosted.applied,
          unitCompleted: lp.completedUnitTests.includes(unitId),
          attemptsLeft: Math.max(0, 3 - (totalAttempts + 1)),
          dailyAttemptsLeft: Math.max(0, 3 - (dailyAttempts + 1)),
          ...progressPayload(user),
        },
      };
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Unit-test error:', error);
    res.status(500).json({ success: false, message: 'Failed to record unit test' });
  }
});

// ── POST /unlock-final-test ─────────────────────────────────────────────────
router.post('/unlock-final-test', authenticateToken, requireApproved, async (req, res) => {
  try {
    const storage = storageOf(req);
    const result = await storage.withUserLock(req.user.userId, async (tx) => {
      const user = await tx.getUserById(req.user.userId);
      if (!user) return { status: 404, body: { success: false, message: 'User not found' } };

      const lp = rewards.ensureLearningProgress(user);
      if (lp.finalTestUnlocked) {
        return { status: 200, body: { success: false, message: 'Final test is already unlocked' } };
      }
      const unlockCost = rewards.finalTest.unlockCost;
      if (lp.coins < unlockCost) {
        return {
          status: 200,
          body: { success: false, message: `Not enough coins. Need ${unlockCost} coins to unlock.` },
        };
      }

      lp.coins -= unlockCost;
      lp.finalTestUnlocked = true;
      await tx.saveUser(user);

      return {
        status: 200,
        body: { success: true, message: 'Final test unlocked!', ...progressPayload(user) },
      };
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Unlock-final-test error:', error);
    res.status(500).json({ success: false, message: 'Failed to unlock final test' });
  }
});

// ── POST /final-test { score } ──────────────────────────────────────────────
router.post('/final-test', authenticateToken, requireApproved, async (req, res) => {
  try {
    const score = Number(req.body?.score);
    if (!isScore(score)) {
      return res.status(400).json({ success: false, message: 'Invalid score' });
    }

    const storage = storageOf(req);
    const result = await storage.withUserLock(req.user.userId, async (tx) => {
      const user = await tx.getUserById(req.user.userId);
      if (!user) return { status: 404, body: { success: false, message: 'User not found' } };

      const lp = rewards.ensureLearningProgress(user);
      const now = new Date();

      const allUnitsCompleted = rewards.allUnitIds.every((id) => lp.completedUnitTests.includes(id));
      if (!allUnitsCompleted) {
        return { status: 200, body: { success: false, message: 'Complete all unit tests first' } };
      }
      if (!lp.finalTestUnlocked) {
        return { status: 200, body: { success: false, message: 'Final test must be unlocked with coins first' } };
      }
      const today = now.toDateString();
      if (lp.finalTestLastAttempt === today) {
        return { status: 200, body: { success: false, message: 'You can only take the final test once per day' } };
      }
      lp.finalTestLastAttempt = today;

      const alreadyCompleted = lp.finalTestCompleted;
      const baseXp = alreadyCompleted ? 0 : Math.floor(rewards.finalTest.xp * (score / 100));
      const baseCoins = alreadyCompleted ? 0 : Math.floor(rewards.finalTest.coins * (score / 100));
      const boosted = rewards.applyActiveBoosters(user, { xp: baseXp, coins: baseCoins }, now);
      lp.xp += boosted.xp;
      lp.coins += boosted.coins;

      if (score >= 70) lp.finalTestCompleted = true;

      await tx.saveUser(user);

      return {
        status: 200,
        body: {
          success: true,
          xpEarned: boosted.xp,
          coinsEarned: boosted.coins,
          boostsApplied: boosted.applied,
          finalCompleted: lp.finalTestCompleted,
          ...progressPayload(user),
        },
      };
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Final-test error:', error);
    res.status(500).json({ success: false, message: 'Failed to record final test' });
  }
});

// ── POST /skip-lesson { lessonId } ──────────────────────────────────────────
router.post('/skip-lesson', authenticateToken, requireApproved, async (req, res) => {
  try {
    const lessonId = Number(req.body?.lessonId);
    if (!rewards.getLesson(lessonId)) {
      return res.status(400).json({ success: false, message: 'Invalid lessonId' });
    }

    const storage = storageOf(req);
    const result = await storage.withUserLock(req.user.userId, async (tx) => {
      const user = await tx.getUserById(req.user.userId);
      if (!user) return { status: 404, body: { success: false, message: 'User not found' } };

      const lp = rewards.ensureLearningProgress(user);
      if (lp.completedLessons.includes(lessonId)) {
        return { status: 200, body: { success: false, message: 'Lesson already completed' } };
      }
      if (!(user.skipTokens > 0)) {
        return { status: 200, body: { success: false, message: 'No skip tokens — get one from the shop' } };
      }

      user.skipTokens -= 1;
      lp.completedLessons.push(lessonId);
      if (!lp.lessonAttempts[lessonId]) {
        lp.lessonAttempts[lessonId] = { attempts: 0, completed: false, bestScore: 0 };
      }
      lp.lessonAttempts[lessonId].completed = true;
      lp.lessonAttempts[lessonId].skipped = true;
      lp.lessonAttempts[lessonId].lastAttempt = new Date().toISOString();

      await tx.saveUser(user);

      return {
        status: 200,
        body: { success: true, skipTokens: user.skipTokens, ...progressPayload(user) },
      };
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Skip-lesson error:', error);
    res.status(500).json({ success: false, message: 'Failed to skip lesson' });
  }
});

module.exports = router;
