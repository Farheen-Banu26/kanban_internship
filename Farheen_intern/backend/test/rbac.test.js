import test from 'node:test';
import assert from 'node:assert/strict';
import { canCreateTask, canManageTask, getEffectiveRole, ROLES } from '../src/utils/rbac.js';

test('owner can create and manage any task', () => {
  assert.equal(getEffectiveRole('owner', 'owner'), 'owner');
  assert.equal(canCreateTask('owner'), true);
  assert.equal(canManageTask('owner', { createdBy: { _id: '2' } }, '1'), true);
});

test('admin can manage tasks but member can only update own tasks', () => {
  assert.equal(canCreateTask('admin'), true);
  assert.equal(canManageTask('admin', { createdBy: { _id: '2' } }, '1'), true);
  assert.equal(canCreateTask('member'), true);
  assert.equal(canManageTask('member', { createdBy: { _id: '2' } }, '1'), false);
  assert.equal(canManageTask('member', { createdBy: { _id: '1' } }, '1'), true);
});

test('roles list includes the expected workspace roles', () => {
  assert.deepEqual(ROLES, ['owner', 'admin', 'member']);
});
