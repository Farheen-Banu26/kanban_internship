import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'bg-surface-400', bar: 'bg-surface-400' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500', bar: 'bg-blue-50' },
  review: { label: 'Review', color: 'bg-amber-500', bar: 'bg-amber-500' },
  done: { label: 'Done', color: 'bg-emerald-500', bar: 'bg-emerald-500' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-50' },
  medium: { label: 'Medium', color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
  high: { label: 'High', color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50' },
  urgent: { label: 'Urgent', color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' },
};

function StatCard({ label, value, icon, accent }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900">
      <div className={`absolute top-0 right-0 h-24 w-24 rounded-bl-[80px] opacity-10 ${accent}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-surface-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-surface-900 dark:text-slate-100">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent} bg-opacity-10`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function DistributionCard({ title, data, config, mode = 'relative' }) {
  const items = Object.entries(data).filter(([, count]) => count > 0);
  const maxCount = Math.max(...items.map(([, count]) => count), 1);
  const totalCount = items.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-900 dark:text-slate-100">{title}</h3>
        <span className="rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-semibold text-surface-600 dark:bg-slate-800 dark:text-slate-300">
          {totalCount}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-200 px-4 py-6 text-center text-sm text-surface-400 dark:border-slate-700 dark:text-slate-400">
          No activity yet
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(([key, count]) => {
            const cfg = config[key] || { label: key, color: 'bg-surface-300', text: 'text-surface-600', bg: 'bg-surface-50' };
            const width = mode === 'percent' && totalCount > 0
              ? `${(count / totalCount) * 100}%`
              : `${(count / maxCount) * 100}%`;

            return (
              <div key={key}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${cfg.text} ${cfg.bg}`}>
                    {cfg.label}
                  </span>
                  <span className="text-sm font-bold text-surface-700">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-100">
                  <div
                    className={`h-full rounded-full ${cfg.color} transition-all duration-500`}
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TaskTable({ title, tasks, showAssignee = false }) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
        <h3 className="text-sm font-semibold text-surface-900 dark:text-slate-100">{title}</h3>
        <span className="rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-bold text-surface-600 dark:bg-slate-800 dark:text-slate-300">
          {tasks.length}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-surface-400 dark:text-slate-400">No tasks found</div>
      ) : (
        <div className="divide-y divide-surface-100">
          {tasks.map((task) => {
            const p = PRIORITY_CONFIG[task.priority] || { color: 'bg-surface-300', label: task.priority };
            const s = STATUS_CONFIG[task.status] || { color: 'bg-surface-300', label: task.status };

            return (
              <div key={task.id} className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-surface-50 dark:hover:bg-slate-800/70">
                {/* Priority dot */}
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${p.color}`} />

                {/* Title */}
                <span className="flex-1 truncate text-sm font-medium text-surface-800 dark:text-slate-200">{task.title}</span>

                {/* Assignee (for overdue) */}
                {showAssignee && task.assignee && (
                  <span className="hidden sm:inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                    {task.assignee.name}
                  </span>
                )}

                {/* Status badge */}
                <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${
                  task.status === 'done'
                    ? 'bg-emerald-50 text-emerald-700'
                    : task.status === 'in_progress'
                      ? 'bg-blue-50 text-blue-700'
                      : task.status === 'review'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-surface-100 text-surface-600'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${s.color}`} />
                  {s.label}
                </span>

                {/* Due date */}
                {task.dueDate && (
                  <span className="hidden md:inline text-xs text-surface-400 whitespace-nowrap dark:text-slate-400">
                    {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWsId, setSelectedWsId] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [error, setError] = useState('');

  // Fetch workspaces on mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await api.get('/workspaces');
        const wsList = response.data.data;
        setWorkspaces(wsList);
        if (wsList.length > 0) {
          setSelectedWsId(wsList[0].id);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch workspaces.');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  // Fetch dashboard data when selected workspace changes
  const fetchDashboard = useCallback(async (wsId) => {
    if (!wsId) return;
    setLoadingDashboard(true);
    try {
      const response = await api.get(`/dashboard?workspaceId=${wsId}`);
      setDashboardData(response.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard metrics.');
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    if (selectedWsId) {
      fetchDashboard(selectedWsId);
    }
  }, [selectedWsId, fetchDashboard]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-surface-200 p-12 text-center max-w-lg mx-auto mt-10 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
        </div>
        <h3 className="text-lg font-bold text-surface-900 dark:text-slate-100">No data available</h3>
        <p className="mt-1 text-sm text-surface-500 dark:text-slate-400">You must belong to at least one workspace to view dashboard statistics.</p>
        <div className="mt-6">
          <Link
            to="/workspaces"
            className="inline-flex rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm transition-all"
          >
            Create or Join Workspace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900 dark:text-slate-100">Dashboard</h1>
          <p className="mt-1 text-surface-500 dark:text-slate-400">Overview of your workspace activity</p>
        </div>

        {/* Workspace select */}
        <div className="flex items-center gap-2">
          <label htmlFor="workspace-select" className="text-sm font-medium text-surface-600 whitespace-nowrap dark:text-slate-300">
            Workspace:
          </label>
          <select
            id="workspace-select"
            value={selectedWsId}
            onChange={(e) => setSelectedWsId(e.target.value)}
            className="rounded-xl border border-surface-300 bg-white px-3.5 py-2 text-sm text-surface-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {loadingDashboard || !dashboardData ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : (
        <>
          {/* ── Stat cards ───────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            <StatCard
              label="Total Tasks"
              value={dashboardData.totalTasks}
              accent="bg-brand-500"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>}
            />
            <StatCard
              label="My Tasks"
              value={dashboardData.myTasks?.length || 0}
              accent="bg-blue-500"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
            />
            <StatCard
              label="Overdue"
              value={dashboardData.overdueTasks?.length || 0}
              accent="bg-red-500"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
            />
          </div>

          {/* ── Distribution cards ───────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <DistributionCard
              title="Priority Distribution"
              data={dashboardData.priorityDistribution || {}}
              config={PRIORITY_CONFIG}
              mode="relative"
            />
            <DistributionCard
              title="Task Status"
              data={dashboardData.tasksByStatus || {}}
              config={STATUS_CONFIG}
              mode="percent"
            />
          </div>

          {/* ── Task lists ───────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <TaskTable title="Overdue Tasks" tasks={dashboardData.overdueTasks || []} showAssignee />
            <TaskTable title="My Tasks" tasks={dashboardData.myTasks || []} />
          </div>
        </>
      )}
    </div>
  );
}
