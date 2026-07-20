import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { findWorkspaceById, isUserMember } from '../services/workspaceService.js';
import { getDashboardData } from '../services/dashboardService.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const { workspaceId } = req.query;

  if (!workspaceId) {
    throw new ApiError(400, 'workspaceId query parameter is required');
  }

  const workspace = await findWorkspaceById(workspaceId);

  if (!isUserMember(workspace, req.user._id)) {
    throw new ApiError(403, 'Not authorized to access this workspace');
  }

  const data = await getDashboardData(workspaceId, req.user._id);

  res.status(200).json({
    success: true,
    data,
  });
});
