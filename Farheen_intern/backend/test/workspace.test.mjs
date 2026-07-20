import { request } from './setupTests.js';

const registerAndLogin = async (email) => {
  const user = { name: 'Workspace User', email, password: 'password123' };
  await request.post('/api/auth/register').send(user);
  const loginRes = await request.post('/api/auth/login').send({ email, password: user.password });
  return loginRes.body.data.token;
};

describe('Workspace endpoints', () => {
  it('creates a workspace and returns current user as owner', async () => {
    const token = await registerAndLogin('owner@example.com');
    const res = await request
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Team Board', purpose: 'Project planning' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Team Board');
    expect(res.body.data.currentUserRole).toBe('owner');
  });

  it('prevents anonymous workspace creation', async () => {
    const res = await request.post('/api/workspaces').send({ name: 'Team Board', purpose: 'Project planning' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('allows a user to join a workspace by invite code', async () => {
    const ownerToken = await registerAndLogin('owner2@example.com');
    const createRes = await request
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Joinable Board', purpose: 'Team tasks' });

    const { inviteCode } = createRes.body.data;
    const memberToken = await registerAndLogin('member@example.com');

    const joinRes = await request
      .post('/api/workspaces/join')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ inviteCode });

    expect(joinRes.status).toBe(200);
    expect(joinRes.body.data.currentUserRole).toBe('member');
    expect(joinRes.body.data.name).toBe('Joinable Board');
  });
});
