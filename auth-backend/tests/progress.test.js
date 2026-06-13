/**
 * Integration tests for /api/progress — the server-side reward path.
 * Currency (XP/coins) is server-owned (POST /auth/user-data strips it), so
 * these endpoints are the only way lesson/test rewards persist. Covers:
 * proportional awards, progressive top-up, booster application/consumption,
 * unit/final-test gating and limits, the coin-spending unlock, and skip
 * tokens. One registered user (auth endpoints are rate-limited).
 */
const request = require('supertest');

jest.mock('../services/emailService', () => ({
  sendGoalReminder: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true)
}));

const { app } = require('../server');
const rewardsTable = require('../data-static/lessonRewards.json');

const LESSON_1 = rewardsTable.lessons['1'];   // unit 1
const LESSON_2 = rewardsTable.lessons['2'];   // unit 1
const UNIT_1 = rewardsTable.units['1'];
const FINAL = rewardsTable.finalTest;

describe('Progress routes', () => {
  let token;
  let userId;

  const getUser = () => app.locals.storage.getUserById(userId);
  const mutateUser = async (mut) => {
    const user = await getUser();
    mut(user);
    await app.locals.storage.saveUser(user);
  };
  const post = (path, body = {}) =>
    request(app)
      .post(`/api/progress/${path}`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        email: `progress-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Progress Test',
        username: `proguser${Math.floor(Math.random() * 100000)}`
      })
      .expect(200);
    token = reg.body.token;
    const jwt = require('jsonwebtoken');
    userId = jwt.verify(token, process.env.JWT_SECRET || 'test-secret').userId;
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/progress/lesson-complete').send({ lessonId: 1, score: 80 });
    expect(res.status).toBe(401);
  });

  it('rejects invalid lesson ids and scores', async () => {
    expect((await post('lesson-complete', { lessonId: 999, score: 80 })).status).toBe(400);
    expect((await post('lesson-complete', { lessonId: 1, score: 150 })).status).toBe(400);
    expect((await post('lesson-complete', { lessonId: 1, score: -5 })).status).toBe(400);
    expect((await post('unit-test', { unitId: 999, score: 80 })).status).toBe(400);
    expect((await post('final-test', { score: 'high' })).status).toBe(400);
  });

  it('awards proportional rewards and persists currency server-side', async () => {
    const res = await post('lesson-complete', { lessonId: 1, score: 80 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.lessonCompleted).toBe(true);
    expect(res.body.xpEarned).toBe(Math.floor(LESSON_1.xp * 0.8));
    expect(res.body.coinsEarned).toBe(Math.floor(LESSON_1.coins * 0.8));

    // The award must survive on the SERVER (this is the whole point).
    const user = await getUser();
    expect(user.learningProgress.xp).toBe(Math.floor(LESSON_1.xp * 0.8));
    expect(user.learningProgress.coins).toBe(Math.floor(LESSON_1.coins * 0.8));
    expect(user.learningProgress.completedLessons).toContain(1);
  });

  it('progressive top-up: a better retake pays the delta, a worse one pays nothing', async () => {
    const better = await post('lesson-complete', { lessonId: 1, score: 100 });
    expect(better.body.xpEarned).toBe(LESSON_1.xp - Math.floor(LESSON_1.xp * 0.8));
    expect(better.body.coinsEarned).toBe(LESSON_1.coins - Math.floor(LESSON_1.coins * 0.8));
    expect(better.body.lessonCompleted).toBe(false); // already completed

    const worse = await post('lesson-complete', { lessonId: 1, score: 50 });
    expect(worse.body.xpEarned).toBe(0);
    expect(worse.body.coinsEarned).toBe(0);

    const user = await getUser();
    expect(user.learningProgress.xp).toBe(LESSON_1.xp);       // capped at full reward
    expect(user.learningProgress.coins).toBe(LESSON_1.coins);
  });

  it('applies booster multipliers to awards and consumes them', async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await mutateUser((u) => {
      u.activeEffects = {
        xp_boost: { type: 'xp_multiplier', multiplier: 2, lessonsRemaining: 1, expiresAt: future },
        coin_boost: { type: 'coin_multiplier', multiplier: 2, lessonsRemaining: 1, expiresAt: future },
      };
    });

    const res = await post('lesson-complete', { lessonId: 2, score: 100 });
    expect(res.body.xpEarned).toBe(LESSON_2.xp * 2);
    expect(res.body.coinsEarned).toBe(LESSON_2.coins * 2);
    expect(res.body.boostsApplied).toHaveLength(2);

    // Both single-use boosters are spent and pruned.
    const user = await getUser();
    expect(Object.keys(user.activeEffects || {})).toHaveLength(0);
  });

  it('ignores expired boosters', async () => {
    const past = new Date(Date.now() - 1000).toISOString();
    await mutateUser((u) => {
      u.activeEffects = {
        stale: { type: 'xp_multiplier', multiplier: 5, lessonsRemaining: 3, expiresAt: past },
      };
    });

    const res = await post('lesson-complete', { lessonId: 3, score: 100 });
    const lesson3 = rewardsTable.lessons['3'];
    expect(res.body.xpEarned).toBe(lesson3.xp); // unmultiplied
    expect(res.body.boostsApplied).toHaveLength(0);
    const user = await getUser();
    expect(Object.keys(user.activeEffects || {})).toHaveLength(0); // pruned
  });

  it('gates the unit test until every lesson in the unit is complete, then awards once', async () => {
    const blocked = await post('unit-test', { unitId: 1, score: 90 });
    expect(blocked.body.success).toBe(false);
    expect(blocked.body.message).toMatch(/complete all lessons/i);

    // Finish the remaining unit-1 lessons.
    for (const id of UNIT_1.lessonIds) {
      await post('lesson-complete', { lessonId: id, score: 100 });
    }

    const first = await post('unit-test', { unitId: 1, score: 80 });
    expect(first.body.success).toBe(true);
    expect(first.body.xpEarned).toBe(Math.floor(UNIT_1.testXp * 0.8));
    expect(first.body.coinsEarned).toBe(Math.floor(UNIT_1.testCoins * 0.8));
    expect(first.body.unitCompleted).toBe(true); // 80 >= 70
    expect(first.body.attemptsLeft).toBe(2);

    // Completed unit tests never pay again.
    const repeat = await post('unit-test', { unitId: 1, score: 100 });
    expect(repeat.body.success).toBe(true);
    expect(repeat.body.xpEarned).toBe(0);
    expect(repeat.body.coinsEarned).toBe(0);

    // Attempt limits: third attempt allowed, fourth blocked.
    await post('unit-test', { unitId: 1, score: 60 });
    const fourth = await post('unit-test', { unitId: 1, score: 60 });
    expect(fourth.body.success).toBe(false);
    expect(fourth.body.message).toMatch(/no attempts left/i);
  });

  it('gate-failure responses still carry canonical learningProgress', async () => {
    // unit-test on a not-yet-eligible unit fails its gate but must echo
    // learningProgress so the client cache stays fresh.
    const res = await post('unit-test', { unitId: 5, score: 90 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.learningProgress).toBeDefined();
    expect(typeof res.body.learningProgress.xp).toBe('number');
  });

  it('final test: gated, coin-unlocked, once per day, one-time award', async () => {
    const gated = await post('final-test', { score: 90 });
    expect(gated.body.success).toBe(false);
    expect(gated.body.message).toMatch(/complete all unit tests/i);

    await mutateUser((u) => {
      u.learningProgress.completedUnitTests = rewardsTable && Object.keys(rewardsTable.units).map(Number);
    });

    const locked = await post('final-test', { score: 90 });
    expect(locked.body.success).toBe(false);
    expect(locked.body.message).toMatch(/unlocked/i);

    // Unlock: refuses without funds, then deducts.
    await mutateUser((u) => { u.learningProgress.coins = FINAL.unlockCost - 1; });
    const poor = await post('unlock-final-test');
    expect(poor.body.success).toBe(false);
    expect(poor.body.message).toMatch(/not enough coins/i);

    await mutateUser((u) => { u.learningProgress.coins = FINAL.unlockCost + 50; });
    const unlocked = await post('unlock-final-test');
    expect(unlocked.body.success).toBe(true);
    let user = await getUser();
    expect(user.learningProgress.coins).toBe(50);
    expect(user.learningProgress.finalTestUnlocked).toBe(true);

    const taken = await post('final-test', { score: 80 });
    expect(taken.body.success).toBe(true);
    expect(taken.body.xpEarned).toBe(Math.floor(FINAL.xp * 0.8));
    expect(taken.body.coinsEarned).toBe(Math.floor(FINAL.coins * 0.8));
    expect(taken.body.finalCompleted).toBe(true);

    const sameDay = await post('final-test', { score: 90 });
    expect(sameDay.body.success).toBe(false);
    expect(sameDay.body.message).toMatch(/once per day/i);
  });

  describe('streaks', () => {
    // Server-local YYYY-MM-DD, matching services/learningRewards.localYmd.
    const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const daysAgo = (n) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return ymd(d);
    };
    // Lesson 1 is already fully rewarded by earlier tests, so completing it
    // again awards nothing — a pure "activity" event for streak purposes.
    const doActivity = () => post('lesson-complete', { lessonId: 1, score: 50 });
    const seedStreak = (fields, freezes) => mutateUser((u) => {
      Object.assign(u.learningProgress, fields);
      if (freezes !== undefined) u.streakFreezes = freezes;
    });

    it('first activity starts a 1-day streak; same-day repeats do not double-count', async () => {
      await seedStreak({ currentStreak: 0, longestStreak: 0, lastActivityDate: null });

      const first = await doActivity();
      expect(first.body.streak).toMatchObject({ current: 1, extendedToday: true, freezesUsed: 0 });

      const sameDay = await doActivity();
      expect(sameDay.body.streak).toMatchObject({ current: 1, extendedToday: false });
    });

    it('activity on consecutive days extends the streak', async () => {
      await seedStreak({ currentStreak: 3, longestStreak: 3, lastActivityDate: daysAgo(1) });
      const res = await doActivity();
      expect(res.body.streak).toMatchObject({ current: 4, longest: 4, extendedToday: true, freezesUsed: 0 });
    });

    it('a missed day is covered by consuming a streak freeze', async () => {
      await seedStreak({ currentStreak: 5, longestStreak: 5, lastActivityDate: daysAgo(2) }, 2); // 1 missed day
      const res = await doActivity();
      expect(res.body.streak).toMatchObject({ current: 6, freezesUsed: 1, streakFreezesLeft: 1 });
      const user = await getUser();
      expect(user.streakFreezes).toBe(1);
    });

    it('too few freezes for the gap resets the streak without spending them', async () => {
      await seedStreak({ currentStreak: 6, longestStreak: 6, lastActivityDate: daysAgo(4) }, 1); // 3 missed days
      const res = await doActivity();
      expect(res.body.streak).toMatchObject({ current: 1, freezesUsed: 0, longest: 6 }); // longest preserved
      const user = await getUser();
      expect(user.streakFreezes).toBe(1); // not partially spent
    });

    it('streak fields are server-owned: client writes via /user-data are ignored', async () => {
      const before = await getUser();
      const real = before.learningProgress.currentStreak;

      await request(app)
        .post('/api/auth/user-data')
        .set('Authorization', `Bearer ${token}`)
        .send({ learningProgress: { currentStreak: 999, longestStreak: 999, lastActivityDate: '2099-01-01', streak: 999 } })
        .expect(200);

      const after = await getUser();
      expect(after.learningProgress.currentStreak).toBe(real);
      expect(after.learningProgress.longestStreak).not.toBe(999);
      expect(after.learningProgress.lastActivityDate).not.toBe('2099-01-01');
    });
  });

  it('skip-lesson consumes a token and completes the lesson with zero rewards', async () => {
    const broke = await post('skip-lesson', { lessonId: 6 });
    expect(broke.body.success).toBe(false);
    expect(broke.body.message).toMatch(/no skip tokens/i);

    await mutateUser((u) => { u.skipTokens = 2; });
    const before = await getUser();
    const { xp, coins } = before.learningProgress;

    const res = await post('skip-lesson', { lessonId: 6 });
    expect(res.body.success).toBe(true);
    expect(res.body.skipTokens).toBe(1);

    const user = await getUser();
    expect(user.learningProgress.completedLessons).toContain(6);
    expect(user.learningProgress.xp).toBe(xp);       // no reward for skipping
    expect(user.learningProgress.coins).toBe(coins);
    expect(user.learningProgress.lessonAttempts[6].skipped).toBe(true);

    const again = await post('skip-lesson', { lessonId: 6 });
    expect(again.body.success).toBe(false);
    expect(again.body.message).toMatch(/already completed/i);
  });
});
