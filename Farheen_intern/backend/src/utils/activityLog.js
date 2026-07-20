const formatTime = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
};

const buildTaskActivity = (task) => {
  const createdAt = formatTime(task.createdAt);
  const updatedAt = formatTime(task.updatedAt || task.createdAt);
  const timestamp = updatedAt || createdAt;

  if (!timestamp) return null;

  const isNew = createdAt && updatedAt && createdAt === updatedAt;

  return {
    id: `task-${task._id || task.id}`,
    type: 'task',
    title: isNew ? 'Task created' : 'Task updated',
    description: `${task.title || 'Task'} • ${task.status || 'todo'}`,
    timestamp,
  };
};

export const buildWorkspaceActivity = (workspace, tasks = []) => {
  const entries = [];

  if (workspace?.createdAt) {
    entries.push({
      id: `workspace-${workspace._id || workspace.id}`,
      type: 'workspace',
      title: 'Workspace created',
      description: workspace.name || 'Workspace',
      timestamp: formatTime(workspace.createdAt),
    });
  }

  const taskEntries = tasks
    .map(buildTaskActivity)
    .filter(Boolean);

  entries.push(...taskEntries);

  return entries
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 12);
};
