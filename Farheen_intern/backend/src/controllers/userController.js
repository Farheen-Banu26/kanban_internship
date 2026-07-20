import bcrypt from 'bcryptjs';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import Task from '../models/Task.js';

// GET /api/users/profile
export const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [workspaceCount, assignedTaskCount] = await Promise.all([
    Workspace.countDocuments({ members: userId }),
    Task.countDocuments({ assignee: userId }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      createdAt: req.user.createdAt,
      workspaceCount,
      assignedTaskCount,
    },
  });
});

// PUT /api/users/profile
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, password } = req.body;

  if (!name && !password) {
    throw new ApiError(400, 'Please provide at least name or password to update');
  }

  const user = await User.findById(req.user._id).select('+password');

  if (name) {
    if (name.trim().length === 0) throw new ApiError(400, 'Name cannot be empty');
    if (name.trim().length > 50) throw new ApiError(400, 'Name cannot exceed 50 characters');
    user.name = name.trim();
  }

  if (password) {
    if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');
    user.password = await bcrypt.hash(password, 12);
  }

  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});
