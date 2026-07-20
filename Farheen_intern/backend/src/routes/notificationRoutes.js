import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getNotifications,
  markAllAsRead,
  clearNotifications,
} from '../controllers/notificationController.js';

const router = Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.delete('/', clearNotifications);

export default router;
