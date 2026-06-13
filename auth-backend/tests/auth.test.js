const request = require('supertest');

jest.mock('../services/emailService', () => ({
  sendGoalReminder: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true)
}));

const { app } = require('../server');

describe('Auth routes', () => {
  it('registers a new user and logs in successfully', async () => {
    const email = `testuser-${Date.now()}@example.com`;
    const password = 'Password123!';
    const username = `user${Math.floor(Math.random() * 10000)}`;

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email,
        password,
        name: 'Test User',
        username
      })
      .expect(200);

    expect(registerResponse.body.success).toBe(true);
    expect(registerResponse.body.token).toBeDefined();

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        emailOrUsername: email,
        password
      })
      .expect(200);

    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.token).toBeDefined();
    expect(loginResponse.body.user.email).toBe(email);
  });

  it('treats email login as case-insensitive', async () => {
    const email = `caseuser-${Date.now()}@example.com`;
    const password = 'Password123!';
    const username = `caseuser${Math.floor(Math.random() * 10000)}`;

    await request(app)
      .post('/api/auth/register')
      .send({
        email,
        password,
        name: 'Case User',
        username
      })
      .expect(200);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        emailOrUsername: email.toUpperCase(),
        password
      })
      .expect(200);

    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.user.email).toBe(email);
  });
});

describe('Health check', () => {
  it('returns healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('healthy');
    expect(response.body.port).toBeDefined();
  });
});

describe('POST /api/auth/change-password', () => {
  // Register a single user (auth endpoints are rate-limited, so we avoid a
  // per-test register). The happy-path test restores the original password so
  // the negative tests below can keep using it.
  let token;
  const password = 'Password123!';
  const email = `pwtest-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const username = `pwuser${Math.floor(Math.random() * 100000)}`;

  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email, password, name: 'Pw Test', username })
      .expect(200);
    token = reg.body.token;
  });

  const change = (body, tok = token) =>
    request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${tok}`)
      .send(body);

  it('changes the password and lets the user log in with the new one', async () => {
    const newPassword = 'NewPassword456!';
    const res = await change({ currentPassword: password, newPassword });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Old password no longer works…
    await request(app)
      .post('/api/auth/login')
      .send({ emailOrUsername: email, password })
      .expect(401);

    // …new one does.
    const login = await request(app)
      .post('/api/auth/login')
      .send({ emailOrUsername: email, password: newPassword })
      .expect(200);
    expect(login.body.success).toBe(true);

    // Restore the original so the remaining tests' `password` stays valid.
    await change({ currentPassword: newPassword, newPassword: password }).expect(200);
  });

  it('rejects an incorrect current password', async () => {
    const res = await change({ currentPassword: 'WrongPass1!', newPassword: 'NewPassword456!' });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/current password is incorrect/i);
  });

  it('rejects a weak new password', async () => {
    const res = await change({ currentPassword: password, newPassword: 'weak' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least 8 characters/i);
  });

  it('rejects reusing the current password', async () => {
    const res = await change({ currentPassword: password, newPassword: password });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/different/i);
  });

  it('requires both fields', async () => {
    const res = await change({ currentPassword: password });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .send({ currentPassword: password, newPassword: 'NewPassword456!' });
    expect(res.status).toBe(401);
  });
});
