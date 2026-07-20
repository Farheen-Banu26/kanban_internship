import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { findWorkspaceById, isUserMember } from '../services/workspaceService.js';

export const isWorkspaceMember = asyncHandler(async (req, _res, next) => {
  const { workspaceId } = req.params;

  if (!workspaceId) {
    throw new ApiError(400, 'Workspace ID is required');
  }

  const workspace = await findWorkspaceById(workspaceId);

  if (!isUserMember(workspace, req.user._id)) {
    throw new ApiError(403, 'Not authorized to access this workspace');
  }

  req.workspace = workspace;
  next();
});
