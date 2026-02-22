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
