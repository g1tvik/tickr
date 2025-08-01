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
          unitTestAttempts: {},
          lessonAttempts: {}
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
          unitTestAttempts: {},
          lessonAttempts: {}
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
        unitTestAttempts: {},
        lessonAttempts: {}
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
    
    return {
      attempts: lessonAttempts.attempts,
      completed: completed,
      bestScore: lessonAttempts.bestScore
    };
  }

  // Record lesson attempt
  async recordLessonAttempt(lessonId) {
    const progress = await this.getProgress();
    
    if (!progress.lessonAttempts[lessonId]) {
      progress.lessonAttempts[lessonId] = { attempts: 0, completed: false, bestScore: 0 };
    }
    
    progress.lessonAttempts[lessonId].attempts += 1;
    await this.saveProgress();
  }

  // Complete lesson
  async completeLesson(lessonId, score) {
    const progress = await this.getProgress();
    
    // Record attempt
    if (!progress.lessonAttempts[lessonId]) {
      progress.lessonAttempts[lessonId] = { attempts: 0, completed: false, bestScore: 0 };
    }
    
    progress.lessonAttempts[lessonId].attempts += 1;
    progress.lessonAttempts[lessonId].bestScore = Math.max(progress.lessonAttempts[lessonId].bestScore, score);
    
    // Ensure arrays are properly initialized
    if (!Array.isArray(progress.completedLessons)) {
      progress.completedLessons = [];
    }
    
    // Check if lesson is being completed for the first time
    const lessonCompleted = !progress.completedLessons.includes(lessonId);
    
    if (lessonCompleted) {
      progress.completedLessons.push(lessonId);
      progress.lessonAttempts[lessonId].completed = true;
      progress.lessonAttempts[lessonId].lastAttempt = new Date().toISOString();
      
      // Find lesson and award XP/coins
      const lesson = this.findLesson(lessonId);
      if (lesson) {
        const xpEarned = Math.floor(lesson.xp * (score / 100));
        const coinsEarned = Math.floor(lesson.coins * (score / 100));
        
        progress.xp += xpEarned;
        progress.coins += coinsEarned;
      }
    } else {
      // Record attempt timestamp even if not completed
      progress.lessonAttempts[lessonId].lastAttempt = new Date().toISOString();
    }
    
    await this.saveProgress();
    
    return {
      lessonCompleted,
      xpEarned: lessonCompleted ? Math.floor(this.findLesson(lessonId)?.xp * (score / 100) || 0) : 0,
      coinsEarned: lessonCompleted ? Math.floor(this.findLesson(lessonId)?.coins * (score / 100) || 0) : 0
    };
  }

  // Take unit test
  async takeUnitTest(unitId, score) {
    const progress = await this.getProgress();
    
    // Check if all lessons in unit are completed
    const unit = this.findUnit(unitId);
    if (!unit) return { success: false, message: 'Unit not found' };
    
    // Ensure arrays are properly initialized
    if (!Array.isArray(progress.completedLessons)) {
      progress.completedLessons = [];
    }
    if (!Array.isArray(progress.completedUnitTests)) {
      progress.completedUnitTests = [];
    }
    
    const allLessonsCompleted = unit.lessons.every(lesson => 
      progress.completedLessons.includes(lesson.id)
    );
    
    if (!allLessonsCompleted) {
      return { success: false, message: 'Complete all lessons in this unit first' };
    }
    
    // Check attempts
    const attempts = progress.unitTestAttempts[unitId] || 0;
    if (attempts >= 3) {
      return { success: false, message: 'No attempts left for today' };
    }
    
    // Record attempt
    progress.unitTestAttempts[unitId] = attempts + 1;
    
    // Award XP and coins based on score
    const xpEarned = Math.floor(unit.unitTest.xp * (score / 100));
    const coinsEarned = Math.floor(unit.unitTest.coins * (score / 100));
    
    progress.xp += xpEarned;
    progress.coins += coinsEarned;
    
    // Mark unit test as completed if score is good enough (e.g., 70%+)
    if (score >= 70 && !progress.completedUnitTests.includes(unitId)) {
      progress.completedUnitTests.push(unitId);
    }
    
    await this.saveProgress();
    
    return {
      success: true,
      xpEarned,
      coinsEarned,
      unitCompleted: progress.completedUnitTests.includes(unitId)
    };
  }

  // Take final test
  async takeFinalTest(score) {
    const progress = await this.getProgress();
    
    // Ensure arrays are properly initialized
    if (!Array.isArray(progress.completedUnitTests)) {
      progress.completedUnitTests = [];
    }
    
    // Check if all unit tests are completed
    const allUnitsCompleted = lessonStructure.units.every(unit =>
      progress.completedUnitTests.includes(unit.id)
    );
    
    if (!allUnitsCompleted) {
      return { success: false, message: 'Complete all unit tests first' };
    }
    
    // Check if already completed today
    const today = new Date().toDateString();
    if (progress.finalTestLastAttempt === today) {
      return { success: false, message: 'You can only take the final test once per day' };
    }
    
    // Record attempt
    progress.finalTestLastAttempt = today;
    
    // Award XP and coins based on score
    const xpEarned = Math.floor(lessonStructure.finalTest.xp * (score / 100));
    const coinsEarned = Math.floor(lessonStructure.finalTest.coins * (score / 100));
    
    progress.xp += xpEarned;
    progress.coins += coinsEarned;
    
    // Mark as completed if score is good enough
    if (score >= 70) {
      progress.finalTestCompleted = true;
    }
    
    await this.saveProgress();
    
    return {
      success: true,
      xpEarned,
      coinsEarned,
      finalCompleted: progress.finalTestCompleted
    };
  }

  // Check if can take unit test
  canTakeUnitTest(unitId) {
    const progress = this.progress;
    if (!progress) return { canTake: false, attemptsLeft: 0, message: 'Progress not loaded' };
    
    const attempts = progress.unitTestAttempts[unitId] || 0;
    const attemptsLeft = Math.max(0, 3 - attempts);
    
    return {
      canTake: attemptsLeft > 0,
      attemptsLeft,
      message: attemptsLeft > 0 ? `${attemptsLeft} attempts left` : 'No attempts left for today'
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
      completedLessons: completedLessons.length,
      totalLessons,
      completedUnitTests: completedUnitTests.length,
      totalUnits,
      finalTestCompleted: progress.finalTestCompleted
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
      unitTestAttempts: {},
      lessonAttempts: {}
    };
    await this.saveProgress();
  }
}

// Create singleton instance
const progressManager = new ProgressManager();

export default progressManager; 