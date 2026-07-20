export const ROLES = ['owner', 'admin', 'member'];

export const PERMISSIONS = {
  DELETE_WORKSPACE: 'delete_workspace',
  UPDATE_WORKSPACE: 'update_workspace',
  MANAGE_MEMBERS: 'manage_members',
  ASSIGN_ROLES: 'assign_roles',
  MANAGE_TASKS: 'manage_tasks',
  INVITE_MEMBERS: 'invite_members',
  VIEW_WORKSPACE: 'view_workspace',
  CREATE_TASKS: 'create_tasks',
  EDIT_OWN_TASKS: 'edit_own_tasks',
};

const ROLE_PERMISSIONS = {
  owner: [
    PERMISSIONS.DELETE_WORKSPACE,
    PERMISSIONS.UPDATE_WORKSPACE,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.ASSIGN_ROLES,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.INVITE_MEMBERS,
    PERMISSIONS.VIEW_WORKSPACE,
    PERMISSIONS.CREATE_TASKS,
    PERMISSIONS.EDIT_OWN_TASKS,
  ],
  admin: [
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.INVITE_MEMBERS,
    PERMISSIONS.VIEW_WORKSPACE,
    PERMISSIONS.CREATE_TASKS,
    PERMISSIONS.EDIT_OWN_TASKS,
  ],
  member: [
    PERMISSIONS.VIEW_WORKSPACE,
    PERMISSIONS.CREATE_TASKS,
    PERMISSIONS.EDIT_OWN_TASKS,
  ],
};

const normalizeRole = (role, fallback = 'member') => {
  if (typeof role === 'string' && role.trim()) {
    return role.toLowerCase();
  }

  return fallback;
};

export const getEffectiveRole = (role, fallback = 'member') => {
  if (typeof role === 'string') return normalizeRole(role, fallback);
  if (role && typeof role === 'object' && role.role) return normalizeRole(role.role, fallback);
  return fallback;
};

export const hasPermission = (role, permission) =>
  ROLE_PERMISSIONS[getEffectiveRole(role)]?.includes(permission) ?? false;

export const getWorkspaceRole = (workspace, userId) => {
  if (!workspace || !userId) return 'member';

  const targetId = userId.toString();
  const ownerId = workspace.owner?._id?.toString() || workspace.owner?.id?.toString() || workspace.owner?.toString();

  if (ownerId && ownerId === targetId) return 'owner';

  const matchedRole = (workspace.memberRoles || []).find((entry) => {
    const entryUserId =
      entry?.user?._id?.toString() ||
      entry?.user?.id?.toString() ||
      entry?.user?.toString();

    return entryUserId === targetId;
  });

  return getEffectiveRole(matchedRole?.role, 'member');
};

export const canCreateTask = (role) => hasPermission(role, PERMISSIONS.CREATE_TASKS);
export const canAssignRoles = (role) => hasPermission(role, PERMISSIONS.ASSIGN_ROLES);
export const canViewWorkspace = (role) => hasPermission(role, PERMISSIONS.VIEW_WORKSPACE);

export const canManageTask = (role, task, userId) => {
  if (hasPermission(role, PERMISSIONS.MANAGE_TASKS)) return true;
  if (!hasPermission(role, PERMISSIONS.EDIT_OWN_TASKS)) return false;

  const createdById =
    task.createdBy?._id?.toString() ||
    task.createdBy?.id?.toString() ||
    task.createdBy?.toString();

  return createdById === userId.toString();
};
