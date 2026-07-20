import mongoose from 'mongoose';
import Task, { TASK_STATUSES, TASK_PRIORITIES } from '../models/Task.js';

const TASK_LIST_LIMIT = 20;

const userLookup = (field) => ({
  $lookup: {
    from: 'users',
    localField: field,
    foreignField: '_id',
    as: field,
    pipeline: [{ $project: { name: 1, email: 1 } }],
  },
});

const unwindUser = (field) => ({
  $unwind: { path: `$${field}`, preserveNullAndEmptyArrays: field === 'assignee' },
});

const taskListPipeline = [
  userLookup('assignee'),
  unwindUser('assignee'),
  userLookup('createdBy'),
  unwindUser('createdBy'),
  {
    $project: {
      title: 1,
      description: 1,
      status: 1,
      priority: 1,
      dueDate: 1,
      labels: 1,
      assignee: 1,
      createdBy: 1,
      workspace: 1,
      createdAt: 1,
      updatedAt: 1,
    },
  },
];

const formatAggregatedTask = (task) => ({
  id: task._id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueDate: task.dueDate,
  labels: task.labels,
  assignee: task.assignee || null,
  createdBy: task.createdBy,
  workspace: task.workspace,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

const toCountMap = (items, keys) => {
  const map = Object.fromEntries(keys.map((key) => [key, 0]));
  for (const { _id, count } of items) {
    if (_id in map) map[_id] = count;
  }
  return map;
};

export const getDashboardData = async (workspaceId, userId) => {
  const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();

  const [result] = await Task.aggregate([
    { $match: { workspace: workspaceObjectId } },
    {
      $facet: {
        total: [{ $count: 'count' }],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
        overdueTasks: [
          {
            $match: {
              dueDate: { $ne: null, $lt: now },
              status: { $ne: 'done' },
            },
          },
          { $sort: { dueDate: 1 } },
          { $limit: TASK_LIST_LIMIT },
          ...taskListPipeline,
        ],
        myTasks: [
          { $match: { assignee: userObjectId } },
          { $sort: { dueDate: 1, createdAt: -1 } },
          { $limit: TASK_LIST_LIMIT },
          ...taskListPipeline,
        ],
      },
    },
  ]);

  return {
    totalTasks: result.total[0]?.count ?? 0,
    tasksByStatus: toCountMap(result.byStatus, TASK_STATUSES),
    priorityDistribution: toCountMap(result.byPriority, TASK_PRIORITIES),
    overdueTasks: result.overdueTasks.map(formatAggregatedTask),
    myTasks: result.myTasks.map(formatAggregatedTask),
  };
};
