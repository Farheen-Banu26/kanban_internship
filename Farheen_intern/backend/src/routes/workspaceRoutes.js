import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../utils/rbac.js';
import {
  getWorkspaces,
  createWorkspace,
  joinWorkspace,
  updateWorkspace,
  updateMemberRole,
  getWorkspaceActivity,
  deleteWorkspace,
  inviteByEmail,
} from '../controllers/workspaceController.js';

const router = Router();

router.use(protect);

const createValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Workspace name is required')
    .isLength({ max: 100 })
    .withMessage('Workspace name cannot exceed 100 characters'),
  body('purpose')
    .trim()
    .notEmpty()
    .withMessage('Purpose is required')
    .isLength({ max: 500 })
    .withMessage('Purpose cannot exceed 500 characters'),
];

const joinValidation = [
  body('inviteCode')
    .trim()
    .notEmpty()
    .withMessage('Invite code is required')
    .isLength({ min: 8, max: 8 })
    .withMessage('Invite code must be 8 characters'),
];

const updateValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Workspace name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Workspace name cannot exceed 100 characters'),
  body('purpose')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Purpose cannot be empty')
    .isLength({ max: 500 })
    .withMessage('Purpose cannot exceed 500 characters'),
];

const inviteValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address'),
];

const roleValidation = [
  body('userId')
    .notEmpty()
    .withMessage('userId is required')
    .isMongoId()
    .withMessage('userId must be a valid ID'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(ROLES)
    .withMessage(`Role must be one of: ${ROLES.join(', ')}`),
];

router.get('/', getWorkspaces);
router.post('/', createValidation, validate, createWorkspace);
router.post('/join', joinValidation, validate, joinWorkspace);
router.put('/:id', updateValidation, validate, updateWorkspace);
router.put('/:id/roles', roleValidation, validate, updateMemberRole);
router.post('/:id/invite-email', inviteValidation, validate, inviteByEmail);
router.get('/:id/activity', getWorkspaceActivity);
router.delete('/:id', deleteWorkspace);

export default router;
