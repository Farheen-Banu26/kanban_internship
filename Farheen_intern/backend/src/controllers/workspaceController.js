import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {
  getWorkspacesByMember,
  createWorkspace as createWorkspaceService,
  joinWorkspaceByCode,
  findWorkspaceById,
  formatWorkspace,
} from '../services/workspaceService.js';
import Workspace from '../models/Workspace.js';
import { createNotification } from '../controllers/notificationController.js';
import { canAssignRoles, getWorkspaceRole, ROLES } from '../utils/rbac.js';
import Activity from '../models/Activity.js';
import { buildWorkspaceActivity } from '../utils/activityLog.js';
import Invitation from '../models/Invitation.js';
import { v4 as uuidv4 } from 'uuid';
import { sendInvitationEmail } from '../utils/email.js';
import User from '../models/User.js';
import { env } from '../config/env.js';

const buildWorkspaceResponse = (workspace, userId) => ({
  ...formatWorkspace(workspace),
  currentUserRole: getWorkspaceRole(workspace, userId),
});

export const getWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await getWorkspacesByMember(req.user._id);

  res.status(200).json({
    success: true,
    count: workspaces.length,
    data: workspaces.map((workspace) => ({
      ...workspace,
      currentUserRole: getWorkspaceRole(workspace, req.user._id),
    })),
  });
});

export const createWorkspace = asyncHandler(async (req, res) => {
  const workspace = await createWorkspaceService(req.body.name, req.body.purpose, req.user._id);

  await createNotification(
    req.user._id,
    'workspace_created',
    `You created workspace "${workspace.name}"`,
    workspace.id
  );

  res.status(201).json({
    success: true,
    message: 'Workspace created successfully',
    data: {
      ...workspace,
      currentUserRole: 'owner',
    },
  });
});

export const joinWorkspace = asyncHandler(async (req, res) => {
  const workspace = await joinWorkspaceByCode(req.body.inviteCode, req.user._id);

  await createNotification(
    req.user._id,
    'workspace_joined',
    `You joined workspace "${workspace.name}"`,
    workspace.id
  );

  res.status(200).json({
    success: true,
    message: 'Joined workspace successfully',
    data: {
      ...workspace,
      currentUserRole: 'member',
    },
  });
});

export const updateWorkspace = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, purpose } = req.body;

  const workspace = await findWorkspaceById(id);

  const ownerId = workspace.owner?._id?.toString() || workspace.owner?.toString();
  if (ownerId !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the workspace owner can update workspace settings');
  }

  if (name) workspace.name = name.trim();
  if (purpose) workspace.purpose = purpose.trim();
  await workspace.save();

  await workspace.populate([
    { path: 'owner', select: 'name email' },
    { path: 'members', select: 'name email' },
    { path: 'memberRoles.user', select: 'name email' },
  ]);

  res.status(200).json({
    success: true,
    message: 'Workspace updated successfully',
    data: buildWorkspaceResponse(workspace, req.user._id),
  });
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.body;

  if (!ROLES.includes(role)) {
    throw new ApiError(400, `Role must be one of: ${ROLES.join(', ')}`);
  }

  const workspace = await findWorkspaceById(id);
  const currentRole = getWorkspaceRole(workspace, req.user._id);

  if (!canAssignRoles(currentRole)) {
    throw new ApiError(403, 'Only owners can change workspace roles');
  }

  const targetId = userId.toString();
  const ownerId = workspace.owner?._id?.toString() || workspace.owner?.toString();

  if (targetId === ownerId) {
    throw new ApiError(400, 'The workspace owner role cannot be changed');
  }

  const memberExists = workspace.members.some((member) => {
    const memberId = member?._id?.toString() || member?.toString();
    return memberId === targetId;
  });

  if (!memberExists) {
    throw new ApiError(404, 'The selected user is not a member of this workspace');
  }

  const existingRole = workspace.memberRoles?.find((entry) => {
    const entryUserId = entry.user?._id?.toString() || entry.user?.toString();
    return entryUserId === targetId;
  });

  if (existingRole) {
    existingRole.role = role;
  } else {
    workspace.memberRoles.push({ user: userId, role });
  }

  await workspace.save();
  await workspace.populate([
    { path: 'owner', select: 'name email' },
    { path: 'members', select: 'name email' },
    { path: 'memberRoles.user', select: 'name email' },
  ]);

  res.status(200).json({
    success: true,
    message: 'Member role updated successfully',
    data: buildWorkspaceResponse(workspace, req.user._id),
  });
});

export const getWorkspaceActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const workspace = await findWorkspaceById(id);
  const role = getWorkspaceRole(workspace, req.user._id);

  if (!role) {
    throw new ApiError(403, 'You do not have access to this workspace');
  }

  const activities = await Activity.find({ workspace: id })
    .sort({ timestamp: -1 })
    .limit(20)
    .populate('user', 'name email')
    .populate('task', 'title')
    .lean();

  const activityFeed = (activities || []).map((entry) => ({
    id: entry._id,
    type: 'activity',
    title: entry.title,
    description: entry.description || 'Workspace activity',
    timestamp: entry.timestamp || entry.createdAt,
    user: entry.user ? { name: entry.user.name, email: entry.user.email } : null,
    task: entry.task ? { title: entry.task.title } : null,
  }));

  if (activityFeed.length > 0) {
    res.status(200).json({ success: true, data: activityFeed });
    return;
  }

  const tasks = await Workspace.db.models.Task?.find({ workspace: id }).sort({ updatedAt: -1 }).limit(20).lean();

  res.status(200).json({
    success: true,
    data: buildWorkspaceActivity(workspace, tasks || []),
  });
});

export const inviteByEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  const workspace = await findWorkspaceById(id);
  const currentRole = getWorkspaceRole(workspace, req.user._id);

  if (!['owner', 'admin'].includes(currentRole)) {
    throw new ApiError(403, 'Only workspace owners and admins can send invitations');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingMember = workspace.members.some((member) => {
    const memberEmail = member?.email?.toLowerCase();
    return memberEmail === normalizedEmail;
  });

  if (existingMember) {
    throw new ApiError(409, 'This email already belongs to a workspace member');
  }

  const existingPending = await Invitation.findOne({
    workspace: id,
    email: normalizedEmail,
    status: 'pending',
  });

  if (existingPending) {
    throw new ApiError(409, 'A pending invitation for this email already exists');
  }

  const inviter = await User.findById(req.user._id).select('name email');
  const token = uuidv4();
  const inviteCode = `${workspace.inviteCode}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await Invitation.create({
    workspace: workspace._id,
    email: normalizedEmail,
    inviteCode,
    token,
    invitedBy: req.user._id,
    status: 'pending',
    expiresAt,
  });

  const inviteLink = `${env.frontendUrl}/accept-invitation/${token}`;
  const emailResult = await sendInvitationEmail({
    to: normalizedEmail,
    workspaceName: workspace.name,
    inviterName: inviter?.name || 'A workspace collaborator',
    inviteCode,
    inviteLink,
    expiresAt,
  });

  res.status(201).json({
    success: true,
    message: emailResult.sent ? 'Invitation sent successfully' : 'Invitation created but email could not be sent',
    data: {
      id: invitation._id,
      email: invitation.email,
      inviteCode: invitation.inviteCode,
      expiresAt: invitation.expiresAt,
      emailSent: emailResult.sent,
      note: emailResult.reason || null,
    },
  });
});

export const getInvitationDetails = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const invitation = await Invitation.findOne({ token }).populate('workspace', 'name purpose inviteCode').populate('invitedBy', 'name email');

  if (!invitation) {
    throw new ApiError(404, 'Invitation not found');
  }

  if (invitation.expiresAt < new Date()) {
    invitation.status = 'expired';
    await invitation.save();
  }

  if (invitation.status !== 'pending') {
    throw new ApiError(410, 'This invitation is no longer pending');
  }

  res.status(200).json({
    success: true,
    data: {
      id: invitation._id,
      workspace: invitation.workspace,
      invitedBy: invitation.invitedBy,
      email: invitation.email,
      inviteCode: invitation.inviteCode,
      expiresAt: invitation.expiresAt,
    },
  });
});

export const acceptInvitation = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const invitation = await Invitation.findOne({ token }).populate('workspace', 'name purpose inviteCode members memberRoles owner');

  if (!invitation) {
    throw new ApiError(404, 'Invitation not found');
  }

  if (invitation.expiresAt < new Date()) {
    invitation.status = 'expired';
    await invitation.save();
    throw new ApiError(410, 'This invitation has expired');
  }

  if (invitation.status !== 'pending') {
    throw new ApiError(409, 'This invitation has already been processed');
  }

  const workspace = invitation.workspace;
  const isMember = workspace.members.some((member) => member._id?.toString() === req.user._id.toString());

  if (isMember) {
    invitation.status = 'accepted';
    await invitation.save();
    throw new ApiError(409, 'You are already a member of this workspace');
  }

  workspace.members.push(req.user._id);
  workspace.memberRoles.push({ user: req.user._id, role: 'member' });
  invitation.status = 'accepted';
  await workspace.save();
  await invitation.save();

  await workspace.populate([
    { path: 'owner', select: 'name email' },
    { path: 'members', select: 'name email' },
    { path: 'memberRoles.user', select: 'name email' },
  ]);

  res.status(200).json({
    success: true,
    message: 'Invitation accepted successfully',
    data: {
      workspace: buildWorkspaceResponse(workspace, req.user._id),
    },
  });
});

export const deleteWorkspace = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const workspace = await findWorkspaceById(id);

  const ownerId = workspace.owner?._id?.toString() || workspace.owner?.toString();
  if (ownerId !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the workspace owner can delete this workspace');
  }

  await Workspace.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Workspace deleted successfully',
  });
});
