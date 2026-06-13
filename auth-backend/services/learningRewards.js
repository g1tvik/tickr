/**
 * Learning rewards — the server-owned reward table plus the booster-effect
 * application logic. POST /user-data deliberately strips client-sent coins/xp
 * (they are server-owned currency); the /api/progress routes use THIS module
 * to compute and award them instead.
 *
 * Reward table: data-static/lessonRewards.json, generated from the frontend's
 * lessonStructure (npm run generate:rewards).
 *
 * Boosters: shop POST /use writes user.activeEffects entries shaped
 *   { type: 'xp_multiplier'|'coin_multiplier', multiplier, lessonsRemaining,
 *     duration, expiresAt, purchasedAt, activatedAt }
 * (see routes/shop.js). applyActiveBoosters() consumes them here: per award
 * event the single strongest valid multiplier of each type is applied and has
 * one lesson decremented; expired/spent entries are pruned.
 */
const rewardsTable = require('../data-static/lessonRewards.json');

function getLesson(lessonId) {
  return rewardsTable.lessons[String(lessonId)] || null;
}

function getUnit(unitId) {
  return rewardsTable.units[String(unitId)] || null;
}

const finalTest = rewardsTable.finalTest;

/** Every unit id in the course (numbers). */
const allUnitIds = Object.keys(rewardsTable.units).map(Number);

/**
 * Bring user.learningProgress up to the canonical shape (non-destructive).
 * Mirrors the frontend progressManager defaults so both sides agree.
 */
function ensureLearningProgress(user) {
  if (!user.learningProgress) user.learningProgress = {};
  const lp = user.learningProgress;
  if (typeof lp.xp !== 'number') lp.xp = 0;
  if (typeof lp.coins !== 'number') lp.coins = 0;
  if (!Array.isArray(lp.completedLessons)) lp.completedLessons = [];
  if (!Array.isArray(lp.completedUnitTests)) lp.completedUnitTests = [];
  if (typeof lp.finalTestCompleted !== 'boolean') lp.finalTestCompleted = false;
  if (lp.finalTestLastAttempt === undefined) lp.finalTestLastAttempt = null;
  if (typeof lp.finalTestUnlocked !== 'boolean') lp.finalTestUnlocked = false;
  if (!lp.unitTestAttempts || typeof lp.unitTestAttempts !== 'object') lp.unitTestAttempts = {};
  if (!lp.lessonAttempts || typeof lp.lessonAttempts !== 'object') lp.lessonAttempts = {};
  if (!lp.lessonRewards || typeof lp.lessonRewards !== 'object') lp.lessonRewards = {};
  if (!lp.lessonEarnedRewards || typeof lp.lessonEarnedRewards !== 'object') lp.lessonEarnedRewards = {};
  return lp;
}

/**
 * Apply the user's active booster effects to a base award, consuming one
 * "lesson" from each multiplier actually used. Mutates user.activeEffects
 * (prunes expired/spent entries). Earned-reward caps are tracked on the BASE
 * amounts — boosters are a bonus on top, they don't eat into future caps.
 *
 * @returns {{ xp: number, coins: number, applied: Array<{type, multiplier}> }}
 */
function applyActiveBoosters(user, base, now = new Date()) {
  const effects = user.activeEffects && typeof user.activeEffects === 'object' ? user.activeEffects : {};
  user.activeEffects = effects;

  // Prune anything already expired or spent.
  for (const key of Object.keys(effects)) {
    const e = effects[key];
    const valid = e && new Date(e.expiresAt) > now && e.lessonsRemaining > 0 && e.multiplier > 0;
    if (!valid) delete effects[key];
  }

  const pickBest = (type) => {
    let bestKey = null;
    for (const [key, e] of Object.entries(effects)) {
      if (e.type === type && (bestKey === null || e.multiplier > effects[bestKey].multiplier)) {
        bestKey = key;
      }
    }
    return bestKey;
  };

  const applied = [];
  let xp = base.xp;
  let coins = base.coins;

  if (base.xp > 0) {
    const key = pickBest('xp_multiplier');
    if (key) {
      xp = Math.floor(base.xp * effects[key].multiplier);
      effects[key].lessonsRemaining -= 1;
      applied.push({ type: 'xp_multiplier', multiplier: effects[key].multiplier });
    }
  }
  if (base.coins > 0) {
    const key = pickBest('coin_multiplier');
    if (key) {
      coins = Math.floor(base.coins * effects[key].multiplier);
      effects[key].lessonsRemaining -= 1;
      applied.push({ type: 'coin_multiplier', multiplier: effects[key].multiplier });
    }
  }

  // Prune anything the decrements just spent.
  for (const key of Object.keys(effects)) {
    if (effects[key].lessonsRemaining <= 0) delete effects[key];
  }

  return { xp, coins, applied };
}

module.exports = {
  getLesson,
  getUnit,
  finalTest,
  allUnitIds,
  ensureLearningProgress,
  applyActiveBoosters,
};
