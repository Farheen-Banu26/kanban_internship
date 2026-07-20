import Workspace from '../models/Workspace.js';
import { ApiError } from '../utils/ApiError.js';

const populateFields = 'name email';

const getEntityId = (entity) => {
  if (!entity) return null;
  if (typeof entity === 'object' && '_id' in entity) {
    return entity._id?.toString();
  }
  return entity.toString();
};

const getMemberRole = (workspace, member) => {
  const memberId = getEntityId(member);
  if (!memberId) return 'member';

  if (getEntityId(workspace.owner) === memberId) return 'owner';

  const roleEntry = (workspace.memberRoles || []).find((entry) => {
    const entryUserId = getEntityId(entry.user);
    return entryUserId === memberId;
  });

  return roleEntry?.role || 'member';
};

export const formatWorkspace = (workspace) => {
  const members = (workspace.members || []).map((member) => {
    const memberId = getEntityId(member);
    const plainMember = typeof member === 'object' && 'toObject' in member ? member.toObject() : member;

    return {
      ...(typeof plainMember === 'object' ? plainMember : {}),
      id: memberId,
      _id: memberId,
      role: getMemberRole(workspace, member),
    };
  });

  const memberRoles = (workspace.memberRoles || []).map((entry) => ({
    user: getEntityId(entry.user),
    role: entry.role || 'member',
  }));

  return {
    id: workspace._id,
    name: workspace.name,
    purpose: workspace.purpose,
    inviteCode: workspace.inviteCode,
    owner: workspace.owner,
    members,
    memberRoles,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };
};

export const getWorkspacesByMember = async (userId) => {
  const workspaces = await Workspace.find({ members: userId })
    .populate('owner', populateFields)
    .populate('members', populateFields)
    .populate({ path: 'memberRoles.user', select: populateFields })
    .sort({ createdAt: -1 });

  return workspaces.map(formatWorkspace);
};

export const createWorkspace = async (name, purpose, ownerId) => {
  const workspace = await Workspace.create({
    name,
    purpose,
    owner: ownerId,
    members: [ownerId],
    memberRoles: [{ user: ownerId, role: 'owner' }],
  });

  await workspace.populate([
    { path: 'owner', select: populateFields },
    { path: 'members', select: populateFields },
    { path: 'memberRoles.user', select: populateFields },
  ]);

  return formatWorkspace(workspace);
};

export const joinWorkspaceByCode = async (inviteCode, userId) => {
  const workspace = await Workspace.findOne({ inviteCode: inviteCode.toUpperCase() });

  if (!workspace) {
    throw new ApiError(404, 'Invalid invite code');
  }

  const isMember = workspace.members.some(
    (memberId) => memberId.toString() === userId.toString()
  );

  if (isMember) {
    throw new ApiError(409, 'You are already a member of this workspace');
  }

  workspace.members.push(userId);

  const existingRole = workspace.memberRoles?.find((entry) => entry.user?.toString() === userId.toString());
  if (!existingRole) {
    workspace.memberRoles.push({ user: userId, role: 'member' });
  }

  await workspace.save();

  await workspace.populate([
    { path: 'owner', select: populateFields },
    { path: 'members', select: populateFields },
    { path: 'memberRoles.user', select: populateFields },
  ]);

  return formatWorkspace(workspace);
};

export const findWorkspaceById = async (workspaceId) => {
  const workspace = await Workspace.findById(workspaceId)
    .populate('owner', populateFields)
    .populate('members', populateFields)
    .populate({ path: 'memberRoles.user', select: populateFields });

  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  return workspace;
};

export const isUserMember = (workspace, userId) => {
  if (!workspace || !userId) return false;

  const targetId = userId.toString();
  const candidates = [workspace.owner, ...(workspace.members || [])];

  return candidates.some((member) => {
    const id = member?._id?.toString() || member?.toString();
    return id === targetId;
  });
};
