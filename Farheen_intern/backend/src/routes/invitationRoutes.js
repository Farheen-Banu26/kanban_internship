import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getInvitationDetails, acceptInvitation } from '../controllers/workspaceController.js';

const router = Router();

router.get('/:token', protect, getInvitationDetails);
router.post('/:token/accept', protect, acceptInvitation);

export default router;
