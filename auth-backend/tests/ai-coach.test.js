/**
 * Integration tests for /api/ai-coach decision persistence. Tests run without
 * GEMINI_API_KEY, so /analyze takes the demo-analysis path — which must still
 * authenticate and persist the decision to the user's coach history.
 */
const request = require('supertest');

jest.mock('../services/emailService', () => ({
  sendGoalReminder: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true)
}));

const { app } = require('../server');

const DECISION_BODY = {
  userDecisions: [{ type: 'buy', price: 100, shares: 5, reasoning: 'Strong fundamentals after the dip', timestamp: 1700000000000 }],
  scenario: { title: 'Tesla COVID Crash', context: 'March 2020 selloff', keyEvents: [], puzzleType: 'buy' },
  optimalStrategy: { entry: { type: 'buy', price: 90 } },
  scenarioId: 1,
  scenarioTitle: 'Tesla COVID Crash'
};

describe('AI Coach decision persistence', () => {
  let token;
  let userId;

  const getUser = () => app.locals.storage.getUserById(userId);
  const analyze = (body = DECISION_BODY, tok = token) =>
    request(app)
      .post('/api/ai-coach/analyze')
      .set('Authorization', `Bearer ${tok}`)
      .send(body);

  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        email: `coach-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Coach Test',
        username: `coachuser${Math.floor(Math.random() * 100000)}`
      })
      .expect(200);
    token = reg.body.token;
    const jwt = require('jsonwebtoken');
    userId = jwt.verify(token, process.env.JWT_SECRET || 'test-secret').userId;
  });

  it('rejects unauthenticated /analyze requests', async () => {
    const res = await request(app).post('/api/ai-coach/analyze').send(DECISION_BODY);
    expect(res.status).toBe(401);
  });

  it('analyzes in demo mode and persists the decision to the user', async () => {
    const res = await analyze();
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.demo).toBe(true); // no GEMINI_API_KEY in tests
    expect(typeof res.body.analysis.totalScore).toBe('number');

    const user = await getUser();
    expect(Array.isArray(user.coachDecisions)).toBe(true);
    expect(user.coachDecisions).toHaveLength(1);
    const saved = user.coachDecisions[0];
    expect(saved.scenarioId).toBe(1);
    expect(saved.scenarioTitle).toBe('Tesla COVID Crash');
    expect(saved.decision.type).toBe('buy');
    expect(saved.decision.reasoning).toMatch(/fundamentals/);
    expect(saved.totalScore).toBe(res.body.analysis.totalScore);
    expect(saved.demo).toBe(true);
    expect(saved.createdAt).toBeTruthy();
  });

  it('GET /decisions returns the history newest-first', async () => {
    await analyze({ ...DECISION_BODY, scenarioId: 2, scenarioTitle: 'GameStop Squeeze' });

    const res = await request(app)
      .get('/api/ai-coach/decisions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.decisions).toHaveLength(2);
    expect(res.body.decisions[0].scenarioTitle).toBe('GameStop Squeeze'); // newest first
    expect(res.body.decisions[1].scenarioTitle).toBe('Tesla COVID Crash');
  });

  it('GET /decisions requires authentication', async () => {
    const res = await request(app).get('/api/ai-coach/decisions');
    expect(res.status).toBe(401);
  });

  it('caps the stored history at 50 decisions', async () => {
    const user = await getUser();
    user.coachDecisions = Array.from({ length: 50 }, (_, i) => ({
      id: `dec_seed_${i}`,
      scenarioTitle: `Seed ${i}`,
      createdAt: new Date().toISOString()
    }));
    await app.locals.storage.saveUser(user);

    await analyze({ ...DECISION_BODY, scenarioTitle: 'Newest' });

    const after = await getUser();
    expect(after.coachDecisions).toHaveLength(50);
    expect(after.coachDecisions[0].scenarioTitle).toBe('Newest');
    expect(after.coachDecisions[49].scenarioTitle).toBe('Seed 48'); // oldest dropped
  });
});
