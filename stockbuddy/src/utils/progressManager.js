import { lessonStructure } from '../data/lessonStructure';
import { api } from '../services/api';

// User progress management system that syncs with backend
class ProgressManager {
  constructor() {
    this.progress = null;
    this.isInitialized = false;
  }

  // Initialize progress from backend
  async initialize() {
    if (this.isInitialized) return this.progress;

    try {
      const response = await api.getUserData();
      if (response.success) {
        this.progress = response.learningProgress || {
          xp: 0,
          coins: 0,
          completedLessons: [],
          completedUnitTests: [],
          finalTestCompleted: false,
          finalTestLastAttempt: null,
          finalTestUnlocked: false,
          unitTestAttempts: {},
          lessonAttempts: {},
          lessonRewards: {}, // Track which lessons have given rewards
          lessonEarnedRewards: {} // Track how much XP and coins have been earned per lesson
        };
      } else {
        // Initialize with default values if no data exists
        this.progress = {
          xp: 0,
          coins: 0,
          completedLessons: [],
          completedUnitTests: [],
          finalTestCompleted: false,
          finalTestLastAttempt: null,
          finalTestUnlocked: false,
          unitTestAttempts: {},
          lessonAttempts: {},
          lessonRewards: {},
          lessonEarnedRewards: {}
        };
      }
      this.isInitialized = true;
      return this.progress;
    } catch (error) {
      console.error('Failed to initialize progress:', error);
      // Fallback to default values
      this.progress = {
        xp: 0,
        coins: 0,
        completedLessons: [],
        completedUnitTests: [],
        finalTestCompleted: false,
        finalTestLastAttempt: null,
        finalTestUnlocked: false,
        unitTestAttempts: {},
        lessonAttempts: {},
        lessonRewards: {},
        lessonEarnedRewards: {}
      };
      this.isInitialized = true;
      return this.progress;
    }
  }

  // Save progress to backend
  async saveProgress() {
    if (!this.progress) return;

    try {
      await api.updateUserData({
        learningProgress: this.progress
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  // Get current progress
  async getProgress() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.progress;
  }

  // Get lesson progress
  async getLessonProgress(lessonId) {
    const progress = await this.getProgress();
    const lessonAttempts = progress.lessonAttempts[lessonId] || { attempts: 0, completed: false, bestScore: 0 };
    const completedLessons = Array.isArray(progress.completedLessons) ? progress.completedLessons : [];
    const completed = completedLessons.includes(lessonId);
    
    // Get reward information
    const lesson = this.findLesson(lessonId);
    const earnedRewards = progress.lessonEarnedRewards?.[lessonId] || { xp: 0, coins: 0 };
    const totalXpPossible = lesson?.xp || 0;
    const totalCoinsPossible = lesson?.coins || 0;
    
    return {
      attempts: lessonAttempts.attempts,
      completed: completed,
      bestScore: lessonAttempts.bestScore,
      totalXpPossible,
      totalCoinsPossible,
      xpEarned: earnedRewards.xp,
      coinsEarned: earnedRewards.coins,
      xpRemaining: Math.max(0, totalXpPossible - earnedRewards.xp),
      coinsRemaining: Math.max(0, totalCoinsPossible - earnedRewards.coins),
      rewardProgress: totalXpPossible > 0 ? (earnedRewards.xp / totalXpPossible) * 100 : 0
    };
  }

  // Sync local progress from a server response that carries the canonical
  // learningProgress (every /api/progress endpoint returns it).
  syncFromServer(response) {
    if (response && response.learningProgress) {
      this.progress = response.learningProgress;
      this.isInitialized = true;
    }
  }

  // Complete lesson — rewards are computed and persisted SERVER-side
  // (/api/progress/lesson-complete): XP/coins are server-owned currency, and
  // any active shop boosters are applied + consumed there. Returns the same
  // shape the UI has always consumed (xpEarned, coinsEarned, remaining, ...).
  async completeLesson(lessonId, score) {
    await this.getProgress();
    const response = await api.completeLesson(lessonId, score);
    this.syncFromServer(response);
    return response;
  }

  // Take unit test — gates (all lessons complete, 3/day + 3 total attempts),
  // rewards, and booster application are all enforced server-side.
  async takeUnitTest(unitId, score) {
    await this.getProgress();
    const response = await api.takeUnitTest(unitId, score);
    this.syncFromServer(response);
    return response;
  }

  // Unlock final test — the coin deduction happens server-side.
  async unlockFinalTest() {
    await this.getProgress();
    const response = await api.unlockFinalTest();
    this.syncFromServer(response);
    return response;
  }

  // Take final test — gated and awarded server-side (once per day).
  async takeFinalTest(score) {
    await this.getProgress();
    const response = await api.takeFinalTest(score);
    this.syncFromServer(response);
    return response;
  }

  // Skip a lesson with a shop skip token: consumes one token server-side and
  // marks the lesson complete with ZERO rewards (tokens unlock progression,
  // not currency).
  async skipLesson(lessonId) {
    await this.getProgress();
    const response = await api.skipLesson(lessonId);
    this.syncFromServer(response);
    return response;
  }

  // Check if can take unit test
  canTakeUnitTest(unitId) {
    const progress = this.progress;
    if (!progress) return { canTake: false, attemptsLeft: 0, message: 'Progress not loaded' };
    
    const today = new Date().toDateString();
    const dailyAttempts = progress.unitTestAttempts?.[`${unitId}_${today}`] || 0;
    const totalAttempts = progress.unitTestAttempts?.[`${unitId}_total`] || 0;
    
    const dailyAttemptsLeft = Math.max(0, 3 - dailyAttempts);
    const totalAttemptsLeft = Math.max(0, 3 - totalAttempts);
    
    const canTake = dailyAttemptsLeft > 0 && totalAttemptsLeft > 0;
    
    return {
      canTake,
      dailyAttemptsLeft,
      totalAttemptsLeft,
      message: canTake ? 
        `${dailyAttemptsLeft} daily attempts left, ${totalAttemptsLeft} total attempts left` : 
        dailyAttemptsLeft === 0 ? 'No daily attempts left (3 per day limit)' : 'No total attempts left (3 total limit)'
    };
  }

  // Check if can take final test
  canTakeFinalTest() {
    const progress = this.progress;
    if (!progress) return { canTake: false, message: 'Progress not loaded' };
    
    // Ensure arrays are properly initialized
    if (!Array.isArray(progress.completedUnitTests)) {
      progress.completedUnitTests = [];
    }
    
    // Check if all unit tests are completed
    const allUnitsCompleted = lessonStructure.units.every(unit =>
      progress.completedUnitTests.includes(unit.id)
    );
    
    if (!allUnitsCompleted) {
      return { canTake: false, message: 'Complete all unit tests first' };
    }
    
    // Check if final test is unlocked
    if (!progress.finalTestUnlocked) {
      const unlockCost = lessonStructure.finalTest.unlockCost;
      return { 
        canTake: false, 
        message: `Final test must be unlocked with ${unlockCost} coins first`,
        needsUnlock: true,
        unlockCost
      };
    }
    
    // Check if already taken today
    const today = new Date().toDateString();
    if (progress.finalTestLastAttempt === today) {
      return { canTake: false, message: 'You can only take the final test once per day' };
    }
    
    return { canTake: true, message: 'Ready to take final test' };
  }

  // Get overall progress statistics
  async getOverallProgress() {
    const progress = await this.getProgress();
    const totalLessons = lessonStructure.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
    const totalUnits = lessonStructure.units.length;
    
    // Ensure arrays are properly initialized
    const completedLessons = Array.isArray(progress.completedLessons) ? progress.completedLessons : [];
    const completedUnitTests = Array.isArray(progress.completedUnitTests) ? progress.completedUnitTests : [];
    
    const lessonProgress = (completedLessons.length / totalLessons) * 100;
    const unitProgress = (completedUnitTests.length / totalUnits) * 100;
    
    return {
      xp: progress.xp,
      coins: progress.coins,
      lessonProgress,
      unitProgress,
      completedLessons: completedLessons, // Return the actual array, not the count
      totalLessons,
      completedUnitTests: completedUnitTests, // Return the actual array, not the count
      totalUnits,
      finalTestCompleted: progress.finalTestCompleted,
      finalTestUnlocked: progress.finalTestUnlocked
    };
  }

  // Helper methods
  findLesson(lessonId) {
    for (const unit of lessonStructure.units) {
      const lesson = unit.lessons.find(l => l.id === lessonId);
      if (lesson) return lesson;
    }
    return null;
  }

  findUnit(unitId) {
    return lessonStructure.units.find(u => u.id === unitId);
  }

  areAllUnitsCompleted() {
    const completedUnitTests = Array.isArray(this.progress?.completedUnitTests) ? this.progress.completedUnitTests : [];
    return lessonStructure.units.every(unit =>
      completedUnitTests.includes(unit.id)
    );
  }

  // Reset progress (for testing)
  async resetProgress() {
    this.progress = {
      xp: 0,
      coins: 0,
      completedLessons: [],
      completedUnitTests: [],
      finalTestCompleted: false,
      finalTestLastAttempt: null,
      finalTestUnlocked: false,
      unitTestAttempts: {},
      lessonAttempts: {},
      lessonRewards: {},
      lessonEarnedRewards: {}
    };
    await this.saveProgress();
  }

  // Test the new reward system (for debugging) — no-op outside dev builds
  async testRewardSystem(lessonId) {
    if (!import.meta.env.DEV) return;
    console.log('=== Testing Reward System ===');
    
    // Test 1: First attempt with 66% score
    console.log('\nTest 1: 66% score');
    const result1 = await this.completeLesson(lessonId, 66);
    console.log('Result:', result1);
    
    // Test 2: Second attempt with 100% score
    console.log('\nTest 2: 100% score');
    const result2 = await this.completeLesson(lessonId, 100);
    console.log('Result:', result2);
    
    // Test 3: Third attempt with 50% score (should not give more rewards)
    console.log('\nTest 3: 50% score (should not give more rewards)');
    const result3 = await this.completeLesson(lessonId, 50);
    console.log('Result:', result3);
    
    console.log('\n=== Test Complete ===');
  }
}

// Create singleton instance
const progressManager = new ProgressManager();

export default progressManager; 