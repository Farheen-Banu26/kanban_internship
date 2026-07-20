import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Helper to create a notification
export const createNotification = async (userId, type, message, relatedId = null) => {
  try {
    await Notification.create({ user: userId, type, message, relatedId });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

// GET /api/notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

  res.status(200).json({
    success: true,
    data: notifications,
    unreadCount,
  });
});

// PUT /api/notifications/read-all
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });

  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

// DELETE /api/notifications
export const clearNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ user: req.user._id });

  res.status(200).json({ success: true, message: 'Notifications cleared' });
});
