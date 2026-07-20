import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { TASK_STATUSES, TASK_PRIORITIES } from '../models/Task.js';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskComments,
  createTaskComment,
  updateTaskComment,
  deleteTaskComment,
  uploadTaskAttachment,
  getTaskAttachments,
  deleteTaskAttachment,
} from '../controllers/taskController.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(protect);

const mongoId = (field) =>
  body(field)
    .optional({ values: 'null' })
    .custom((value) => {
      if (value === null || value === '') return true;
      return /^[a-fA-F0-9]{24}$/.test(value);
    })
    .withMessage(`${field} must be a valid ID`);

const createValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('status')
    .optional()
    .isIn(TASK_STATUSES)
    .withMessage(`Status must be one of: ${TASK_STATUSES.join(', ')}`),
  body('priority')
    .optional()
    .isIn(TASK_PRIORITIES)
    .withMessage(`Priority must be one of: ${TASK_PRIORITIES.join(', ')}`),
  body('dueDate')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('labels')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Labels must be an array with at most 10 items'),
  body('labels.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each label must be between 1 and 30 characters'),
  body('workspace')
    .notEmpty()
    .withMessage('Workspace is required')
    .isMongoId()
    .withMessage('Workspace must be a valid ID'),
  mongoId('assignee'),
];

const updateValidation = [
  param('id').isMongoId().withMessage('Invalid task ID'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('status')
    .optional()
    .isIn(TASK_STATUSES)
    .withMessage(`Status must be one of: ${TASK_STATUSES.join(', ')}`),
  body('priority')
    .optional()
    .isIn(TASK_PRIORITIES)
    .withMessage(`Priority must be one of: ${TASK_PRIORITIES.join(', ')}`),
  body('dueDate')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('labels')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Labels must be an array with at most 10 items'),
  body('labels.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each label must be between 1 and 30 characters'),
  mongoId('assignee'),
];

const getTasksValidation = [
  query('workspaceId')
    .notEmpty()
    .withMessage('workspaceId query parameter is required')
    .isMongoId()
    .withMessage('workspaceId must be a valid ID'),
];

const deleteValidation = [param('id').isMongoId().withMessage('Invalid task ID')];
const commentValidation = [
  param('id').isMongoId().withMessage('Invalid task ID'),
  param('commentId').isMongoId().withMessage('Invalid comment ID'),
];

router.get('/', getTasksValidation, validate, getTasks);
router.post('/', createValidation, validate, createTask);
router.put('/:id', updateValidation, validate, updateTask);
router.delete('/:id', deleteValidation, validate, deleteTask);
router.get('/:id/comments', deleteValidation, validate, getTaskComments);
router.post('/:id/comments', deleteValidation, validate, createTaskComment);
router.put('/:id/comments/:commentId', commentValidation, validate, updateTaskComment);
router.delete('/:id/comments/:commentId', commentValidation, validate, deleteTaskComment);
router.post('/:id/attachments', upload.single('attachment'), uploadTaskAttachment);
router.get('/:id/attachments', deleteValidation, validate, getTaskAttachments);
router.delete('/:id/attachments/:attachmentId', deleteValidation, validate, deleteTaskAttachment);

export default router;
