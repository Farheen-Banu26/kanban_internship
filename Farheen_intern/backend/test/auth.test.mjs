import { request } from './setupTests.js';
import User from '../src/models/User.js';

describe('Auth endpoints', () => {
  it('registers a new user successfully', async () => {
    const payload = { name: 'Test User', email: 'test@example.com', password: 'password123' };
    const res = await request.post('/api/auth/register').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({ name: 'Test User', email: 'test@example.com' });
    expect(res.body.data.token).toBeTruthy();

    const user = await User.findOne({ email: payload.email });
    expect(user).not.toBeNull();
    expect(user.name).toBe(payload.name);
  });

  it('rejects duplicate email registration', async () => {
    await request.post('/api/auth/register').send({ name: 'Test User', email: 'test@example.com', password: 'password123' });
    const res = await request.post('/api/auth/register').send({ name: 'Test User', email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Email already registered/i);
  });

  it('logs in an existing user with valid credentials', async () => {
    const payload = { name: 'Test User', email: 'login@example.com', password: 'password123' };
    await request.post('/api/auth/register').send(payload);

    const res = await request.post('/api/auth/login').send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({ email: payload.email });
    expect(res.body.data.token).toBeTruthy();
  });

  it('rejects login with incorrect password', async () => {
    const payload = { name: 'Test User', email: 'login-fail@example.com', password: 'password123' };
    await request.post('/api/auth/register').send(payload);

    const res = await request.post('/api/auth/login').send({ email: payload.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid email or password/i);
  });
});
