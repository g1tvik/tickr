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
  if (typeof lp.currentStreak !== 'number') lp.currentStreak = 0;
  if (typeof lp.longestStreak !== 'number') lp.longestStreak = 0;
  if (lp.lastActivityDate === undefined) lp.lastActivityDate = null;
  return lp;
}

/** Server-local calendar date as YYYY-MM-DD (matches the toDateString()-based
 *  daily limits elsewhere: all "days" are server-local days). */
function localYmd(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Whole days from one YYYY-MM-DD to another (DST-safe via UTC noon). */
function dayDiff(fromYmd, toYmd) {
  const atNoon = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10), 12);
  return Math.round((atNoon(toYmd) - atNoon(fromYmd)) / 86400000);
}

/**
 * Record a day of learning activity and maintain the streak. Called from the
 * award events (lesson complete, unit test, final test) — the first such event
 * each server-local day extends or restarts the streak.
 *
 * Missed days are covered by shop streak freezes (user.streakFreezes), one per
 * missed day, consumed automatically — matching the shop item's promise
 * ("protect your streak even if you miss lessons"). If there aren't enough
 * freezes for the whole gap, the streak resets to 1 and no freezes are spent.
 *
 * Mutates user (learningProgress.currentStreak/longestStreak/lastActivityDate
 * and user.streakFreezes).
 */
function recordDailyActivity(user, now = new Date()) {
  const lp = ensureLearningProgress(user);
  const today = localYmd(now);
  const last = lp.lastActivityDate;
  let extendedToday = false;
  let freezesUsed = 0;

  if (last !== today) {
    if (!last) {
      lp.currentStreak = 1;
      extendedToday = true;
    } else {
      const diff = dayDiff(last, today);
      if (diff === 1) {
        lp.currentStreak = (lp.currentStreak || 0) + 1;
        extendedToday = true;
      } else if (diff > 1) {
        const missed = diff - 1;
        if ((user.streakFreezes || 0) >= missed) {
          user.streakFreezes -= missed;
          freezesUsed = missed;
          lp.currentStreak = (lp.currentStreak || 0) + 1;
        } else {
          lp.currentStreak = 1;
        }
        extendedToday = true;
      } else {
        // diff <= 0: clock moved backwards (TZ/DST edge) — keep the streak,
        // just make sure today still counts.
        lp.currentStreak = Math.max(1, lp.currentStreak || 0);
      }
    }
    lp.lastActivityDate = today;
  }

  if ((lp.currentStreak || 0) > (lp.longestStreak || 0)) lp.longestStreak = lp.currentStreak;

  return {
    current: lp.currentStreak,
    longest: lp.longestStreak,
    extendedToday,
    freezesUsed,
    streakFreezesLeft: user.streakFreezes || 0,
  };
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
  recordDailyActivity,
  localYmd,
};
