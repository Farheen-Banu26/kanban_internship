import { Router } from 'express';
import { query } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getDashboard } from '../controllers/dashboardController.js';

const router = Router();

router.use(protect);

router.get(
  '/',
  [
    query('workspaceId')
      .notEmpty()
      .withMessage('workspaceId query parameter is required')
      .isMongoId()
      .withMessage('workspaceId must be a valid ID'),
  ],
  validate,
  getDashboard
);

export default router;
