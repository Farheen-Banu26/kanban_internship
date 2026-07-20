import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import Task, { TASK_STATUSES, TASK_PRIORITIES } from '../models/Task.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { findWorkspaceById, isUserMember } from '../services/workspaceService.js';
import { canCreateTask, canManageTask, getWorkspaceRole } from '../utils/rbac.js';
import { broadcastCommentEvent } from '../utils/commentRealtime.js';
import { broadcastWorkspaceEvent } from '../utils/socketServer.js';
import { createNotification } from './notificationController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

const userFields = 'name email';
const workspaceFields = 'name inviteCode';

const formatTask = (task) => ({
  id: task._id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueDate: task.dueDate,
  labels: task.labels,
  assignee: task.assignee,
  workspace: task.workspace,
  createdBy: task.createdBy,
  attachments: task.attachments || [],
  comments: (task.comments || []).map(formatComment),
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

const formatComment = (comment) => ({
  id: comment._id,
  text: comment.text,
  author: comment.author,
  mentions: comment.mentions || [],
  edited: Boolean(comment.edited),
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

const populateOptions = [
  { path: 'assignee', select: userFields },
  { path: 'createdBy', select: userFields },
  { path: 'workspace', select: workspaceFields },
  { path: 'comments.author', select: userFields },
  { path: 'attachments.uploadedBy', select: userFields },
];

const populateTaskQuery = (query) => query.populate(populateOptions);

const populateTaskDoc = async (task) => task.populate(populateOptions);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeMention = (value) => (value || '').trim().toLowerCase().replace(/\s+/g, '');
const extractMentionsFromText = (text) => {
  const matches = text.match(/@([\w.-]+)/g) || [];
  return Array.from(new Set(matches.map((mention) => normalizeMention(mention.slice(1)))));
};

const createTaskActivity = async ({ userId, workspaceId, taskId, action, title, description }) => {
  if (!userId || !workspaceId || !taskId) return null;

  return Activity.create({
    user: userId,
    workspace: workspaceId,
    task: taskId,
    action,
    title,
    description,
    timestamp: new Date(),
  });
};

const verifyWorkspaceAccess = async (workspaceId, userId) => {
  const workspace = await findWorkspaceById(workspaceId);

  if (!isUserMember(workspace, userId)) {
    throw new ApiError(403, 'Not authorized to access this workspace');
  }

  return workspace;
};

const verifyAssignee = (workspace, assigneeId) => {
  if (!assigneeId) return;

  const isMember = workspace.members.some((member) => {
    const memberId = member?._id?.toString() || member?.toString();
    return memberId === assigneeId.toString();
  });

  if (!isMember) {
    throw new ApiError(400, 'Assignee must be a workspace member');
  }
};

const getTaskForUser = async (taskId, userId) => {
  const task = await populateTaskQuery(Task.findById(taskId));

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  await verifyWorkspaceAccess(task.workspace._id || task.workspace, userId);

  return task;
};

export const getTasks = asyncHandler(async (req, res) => {
  const { workspaceId } = req.query;

  if (!workspaceId) {
    throw new ApiError(400, 'workspaceId query parameter is required');
  }

  await verifyWorkspaceAccess(workspaceId, req.user._id);

  const tasks = await populateTaskQuery(Task.find({ workspace: workspaceId }).sort({ createdAt: -1 }));

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks.map(formatTask),
  });
});

export const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, labels, assignee, workspace } = req.body;

  const workspaceDoc = await verifyWorkspaceAccess(workspace, req.user._id);
  const role = getWorkspaceRole(workspaceDoc, req.user._id);

  if (!canCreateTask(role)) {
    throw new ApiError(403, 'You do not have permission to create tasks in this workspace');
  }

  verifyAssignee(workspaceDoc, assignee);

  const task = await Task.create({
    title,
    description,
    status,
    priority,
    dueDate: dueDate || null,
    labels,
    assignee: assignee || null,
    workspace,
    createdBy: req.user._id,
  });

  await populateTaskDoc(task);
  await broadcastWorkspaceEvent(workspace, 'task_created', { task: formatTask(task), workspaceId: workspace });

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: formatTask(task),
  });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await getTaskForUser(req.params.id, req.user._id);
  const workspaceDoc = await findWorkspaceById(task.workspace._id || task.workspace);
  const role = getWorkspaceRole(workspaceDoc, req.user._id);

  if (!canManageTask(role, task, req.user._id)) {
    throw new ApiError(403, 'You do not have permission to update this task');
  }

  const { title, description, status, priority, dueDate, labels, assignee } = req.body;

  if (assignee !== undefined) {
    verifyAssignee(workspaceDoc, assignee);
    task.assignee = assignee || null;
  }

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate || null;
  if (labels !== undefined) task.labels = labels;

  await task.save();
  await populateTaskDoc(task);
  await broadcastWorkspaceEvent(task.workspace._id || task.workspace, 'task_updated', { task: formatTask(task), workspaceId: task.workspace._id || task.workspace });

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: formatTask(task),
  });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await getTaskForUser(req.params.id, req.user._id);
  const workspaceDoc = await findWorkspaceById(task.workspace._id || task.workspace);
  const role = getWorkspaceRole(workspaceDoc, req.user._id);

  if (!canManageTask(role, task, req.user._id)) {
    throw new ApiError(403, 'You do not have permission to delete this task');
  }

  const workspaceId = task.workspace._id || task.workspace;
  const taskId = task._id.toString();
  await task.deleteOne();
  await broadcastWorkspaceEvent(workspaceId, 'task_deleted', { taskId, workspaceId });

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully',
  });
});

export const getTaskComments = asyncHandler(async (req, res) => {
  const task = await getTaskForUser(req.params.id, req.user._id);
  await populateTaskDoc(task);

  res.status(200).json({
    success: true,
    data: (task.comments || []).map(formatComment),
  });
});

export const createTaskComment = asyncHandler(async (req, res) => {
  const task = await getTaskForUser(req.params.id, req.user._id);

  const { text, mentions } = req.body;
  const trimmedText = text?.trim();

  if (!trimmedText) {
    throw new ApiError(400, 'Comment text is required');
  }

  const textMentions = extractMentionsFromText(trimmedText);
  const explicitMentions = Array.isArray(mentions)
    ? mentions.filter((mention) => typeof mention === 'string' && mention.trim()).map(normalizeMention)
    : [];
  const commentMentions = Array.from(new Set([...textMentions, ...explicitMentions])).slice(0, 10);

  const comment = {
    _id: new mongoose.Types.ObjectId(),
    text: trimmedText,
    author: req.user._id,
    mentions: commentMentions,
    edited: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  task.comments.push(comment);
  task.updatedAt = new Date();
  await task.save();
  await populateTaskDoc(task);

  if (commentMentions.length > 0) {
    const mentionQueries = commentMentions.map((mention) => ({
      $or: [
        { name: new RegExp(`^${escapeRegExp(mention)}$`, 'i') },
        { email: new RegExp(`^${escapeRegExp(mention)}$`, 'i') },
      ],
    }));

    const mentionedUsers = await User.find({ $or: mentionQueries }).select('name email');
    const uniqueMentionedUsers = mentionedUsers.filter((user, index, self) =>
      self.findIndex((other) => other._id.equals(user._id)) === index
    );

    for (const mentionedUser of uniqueMentionedUsers) {
      if (mentionedUser._id.equals(req.user._id)) continue;
      const message = `${req.user.name} mentioned you in a comment on task '${task.title}'.`;
      await createNotification(mentionedUser._id, 'task_mentioned', message, task._id, true);
    }
  }

  await createTaskActivity({
    userId: req.user._id,
    workspaceId: task.workspace._id || task.workspace,
    taskId: task._id,
    action: 'comment_added',
    title: 'Comment added',
    description: `Added a comment to "${task.title}"`,
  });
  await broadcastCommentEvent('comment_added', { taskId: task._id.toString(), userId: req.user._id.toString() });
  await broadcastWorkspaceEvent(task.workspace._id || task.workspace, 'comment_added', {
    taskId: task._id.toString(),
    comment: formatComment(task.comments[task.comments.length - 1]),
    userId: req.user._id.toString(),
  });

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: formatComment(task.comments[task.comments.length - 1]),
  });
});

export const updateTaskComment = asyncHandler(async (req, res) => {
  const task = await getTaskForUser(req.params.id, req.user._id);
  const workspaceDoc = await findWorkspaceById(task.workspace._id || task.workspace);
  const role = getWorkspaceRole(workspaceDoc, req.user._id);

  const comment = task.comments.id(req.params.commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  const isAuthor = comment.author?.toString() === req.user._id.toString();
  const canModerate = role === 'owner' || role === 'admin';

  if (!isAuthor && !canModerate) {
    throw new ApiError(403, 'You do not have permission to edit this comment');
  }

  const { text, mentions } = req.body;
  const trimmedText = text?.trim();

  if (!trimmedText) {
    throw new ApiError(400, 'Comment text is required');
  }

  comment.text = trimmedText;
  comment.mentions = Array.isArray(mentions)
    ? mentions.filter((mention) => typeof mention === 'string' && mention.trim()).map((mention) => mention.trim()).slice(0, 10)
    : [];
  comment.edited = true;
  comment.updatedAt = new Date();
  task.updatedAt = new Date();

  await task.save();
  await populateTaskDoc(task);

  await createTaskActivity({
    userId: req.user._id,
    workspaceId: task.workspace._id || task.workspace,
    taskId: task._id,
    action: 'comment_updated',
    title: 'Comment updated',
    description: `Updated a comment on "${task.title}"`,
  });
  await broadcastCommentEvent('comment_updated', { taskId: task._id.toString(), userId: req.user._id.toString() });
  await broadcastWorkspaceEvent(task.workspace._id || task.workspace, 'comment_updated', {
    taskId: task._id.toString(),
    comment: formatComment(comment),
    userId: req.user._id.toString(),
  });

  res.status(200).json({
    success: true,
    message: 'Comment updated successfully',
    data: formatComment(comment),
  });
});

export const deleteTaskComment = asyncHandler(async (req, res) => {
  const task = await getTaskForUser(req.params.id, req.user._id);
  const workspaceDoc = await findWorkspaceById(task.workspace._id || task.workspace);
  const role = getWorkspaceRole(workspaceDoc, req.user._id);

  const comment = task.comments.id(req.params.commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  const isAuthor = comment.author?.toString() === req.user._id.toString();
  const canModerate = role === 'owner' || role === 'admin';

  if (!isAuthor && !canModerate) {
    throw new ApiError(403, 'You do not have permission to delete this comment');
  }

  task.comments.pull({ _id: req.params.commentId });
  task.updatedAt = new Date();
  await task.save();

  await createTaskActivity({
    userId: req.user._id,
    workspaceId: task.workspace._id || task.workspace,
    taskId: task._id,
    action: 'comment_deleted',
    title: 'Comment deleted',
    description: `Deleted a comment from "${task.title}"`,
  });
  await broadcastCommentEvent('comment_deleted', { taskId: task._id.toString(), userId: req.user._id.toString() });
  await broadcastWorkspaceEvent(task.workspace._id || task.workspace, 'comment_deleted', {
    taskId: task._id.toString(),
    commentId: req.params.commentId,
    userId: req.user._id.toString(),
  });

  res.status(200).json({
    success: true,
    message: 'Comment deleted successfully',
  });
});

export const uploadTaskAttachment = asyncHandler(async (req, res) => {
  const task = await getTaskForUser(req.params.id, req.user._id);
  const workspaceDoc = await findWorkspaceById(task.workspace._id || task.workspace);
  const role = getWorkspaceRole(workspaceDoc, req.user._id);

  if (!canManageTask(role, task, req.user._id)) {
    throw new ApiError(403, 'You do not have permission to upload attachments for this task');
  }

  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  const attachment = {
    _id: new mongoose.Types.ObjectId(),
    fileName: req.file.filename,
    originalName: req.file.originalname,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    fileUrl: `/uploads/${req.file.filename}`,
    uploadedBy: req.user._id,
    uploadedAt: new Date(),
  };

  task.attachments.push(attachment);
  await task.save();
  await populateTaskDoc(task);

  res.status(201).json({
    success: true,
    message: 'Attachment uploaded successfully',
    data: formatTask(task),
  });
});

export const getTaskAttachments = asyncHandler(async (req, res) => {
  const task = await getTaskForUser(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    data: task.attachments || [],
  });
});

export const deleteTaskAttachment = asyncHandler(async (req, res) => {
  const task = await getTaskForUser(req.params.id, req.user._id);
  const workspaceDoc = await findWorkspaceById(task.workspace._id || task.workspace);
  const role = getWorkspaceRole(workspaceDoc, req.user._id);

  if (!canManageTask(role, task, req.user._id)) {
    throw new ApiError(403, 'You do not have permission to delete attachments from this task');
  }

  const attachment = task.attachments.id(req.params.attachmentId);
  if (!attachment) {
    throw new ApiError(404, 'Attachment not found');
  }

  const filePath = path.join(uploadsDir, attachment.fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  task.attachments.pull({ _id: req.params.attachmentId });
  await task.save();

  res.status(200).json({
    success: true,
    message: 'Attachment deleted successfully',
  });
});
