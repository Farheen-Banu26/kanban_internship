import { canCreateTask, canManageTask, getWorkspaceRole, getEffectiveRole, ROLES } from '../src/utils/rbac.js';

describe('RBAC utility functions', () => {
  it('returns member role for unknown inputs', () => {
    expect(getEffectiveRole(undefined)).toBe('member');
    expect(getEffectiveRole({})).toBe('member');
  });

  it('supports owner and admin permissions', () => {
    expect(getEffectiveRole('owner')).toBe('owner');
    expect(canCreateTask('owner')).toBe(true);
    expect(canCreateTask('admin')).toBe(true);
    expect(canCreateTask('member')).toBe(true);
  });

  it('allows owners to manage any task', () => {
    expect(canManageTask('owner', { createdBy: { _id: '2' } }, '1')).toBe(true);
  });

  it('allows members to only manage own tasks', () => {
    expect(canManageTask('member', { createdBy: { _id: '2' } }, '1')).toBe(false);
    expect(canManageTask('member', { createdBy: { _id: '1' } }, '1')).toBe(true);
  });

  it('detects workspace role from owner and memberRoles', () => {
    const workspace = {
      owner: { _id: 'ownerid' },
      memberRoles: [{ user: { _id: 'memberid' }, role: 'admin' }],
    };

    expect(getWorkspaceRole(workspace, 'ownerid')).toBe('owner');
    expect(getWorkspaceRole(workspace, 'memberid')).toBe('admin');
  });

  it('exposes the expected ROLES array', () => {
    expect(ROLES).toEqual(['owner', 'admin', 'member']);
  });
});
