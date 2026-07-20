import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getUserProfile, updateUserProfile } from '../controllers/userController.js';

const router = Router();

router.use(protect);

router.get('/profile', getUserProfile);

router.put(
  '/profile',
  [
    body('name').optional().trim().isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  updateUserProfile
);

export default router;
