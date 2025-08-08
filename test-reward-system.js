// Simple test to verify the new reward system
// This file can be run in the browser console to test the reward system

// Test the new progressive reward system
async function testRewardSystem() {
  console.log('=== Testing New Reward System ===');
  
  // Import the progress manager
  const { default: progressManager } = await import('./stockbuddy/src/utils/progressManager.js');
  
  // Reset progress to start fresh
  await progressManager.resetProgress();
  
  // Test with lesson ID 1 (Basic Investing)
  const lessonId = 1;
  
  console.log('\n--- Test 1: First attempt with 66% score ---');
  const result1 = await progressManager.completeLesson(lessonId, 66);
  console.log('Result:', result1);
  
  console.log('\n--- Test 2: Second attempt with 100% score ---');
  const result2 = await progressManager.completeLesson(lessonId, 100);
  console.log('Result:', result2);
  
  console.log('\n--- Test 3: Third attempt with 50% score (should not give more rewards) ---');
  const result3 = await progressManager.completeLesson(lessonId, 50);
  console.log('Result:', result3);
  
  console.log('\n--- Final Progress Check ---');
  const progress = await progressManager.getProgress();
  console.log('Total XP:', progress.xp);
  console.log('Total Coins:', progress.coins);
  console.log('Lesson Rewards:', progress.lessonEarnedRewards);
  
  console.log('\n=== Test Complete ===');
}

// Run the test
testRewardSystem().catch(console.error);
