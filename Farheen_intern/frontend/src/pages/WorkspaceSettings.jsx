import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function WorkspaceSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialWsId = searchParams.get('workspaceId');

  const [workspaces, setWorkspaces] = useState([]);
  const [selectedId, setSelectedId] = useState(initialWsId || '');
  const [workspace, setWorkspace] = useState(null);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingRoleId, setUpdatingRoleId] = useState('');
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await api.get('/workspaces');
      setWorkspaces(res.data.data);
      if (!selectedId && res.data.data.length > 0) {
        setSelectedId(res.data.data[0].id);
      }
    } catch (err) {
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const ws = workspaces.find((w) => w.id === selectedId);
    if (ws) {
      setWorkspace(ws);
      setName(ws.name);
      setPurpose(ws.purpose || '');
    }
  }, [selectedId, workspaces]);

  useEffect(() => {
    if (!selectedId) return;

    const fetchActivity = async () => {
      setActivityLoading(true);
      try {
        const res = await api.get(`/workspaces/${selectedId}/activity`);
        setActivity(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setActivityLoading(false);
      }
    };

    fetchActivity();
  }, [selectedId]);

  const isOwner = workspace &&
    (workspace.owner?.id === user?.id ||
      String(workspace.owner?.id) === String(user?.id) ||
      String(workspace.owner?._id) === String(user?.id));

  const currentUserRole = workspace?.currentUserRole || 'member';

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !purpose.trim()) {
      toast.error('Name and purpose are required');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/workspaces/${selectedId}`, { name, purpose });
      toast.success('Workspace updated successfully!');
      await fetchWorkspaces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update workspace');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/workspaces/${selectedId}`);
      toast.success('Workspace deleted successfully');
      navigate('/workspaces');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete workspace');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleRoleChange = async (memberId, nextRole) => {
    if (!selectedId || !memberId) return;
    setUpdatingRoleId(memberId);

    try {
      await api.put(`/workspaces/${selectedId}/roles`, { userId: memberId, role: nextRole });
      await fetchWorkspaces();
      toast.success('Workspace role updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdatingRoleId('');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-surface-500 dark:text-slate-400">You don't have any workspaces yet.</p>
        <button onClick={() => navigate('/workspaces')} className="mt-4 rounded-xl bg-brand-600 text-white px-5 py-2 text-sm font-semibold hover:bg-brand-700">
          Go to Workspaces
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-surface-900 dark:text-slate-100">Workspace Settings</h1>
        <p className="mt-1 text-surface-500 dark:text-slate-400">Manage your workspace details and preferences</p>
      </div>

      {/* Workspace Selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-surface-700 dark:text-slate-300">Select Workspace</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-3 text-sm text-surface-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>{ws.name}</option>
          ))}
        </select>
      </div>

      {workspace && (
        <>
          {!isOwner && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
              ⚠️ You are not the owner of this workspace. Only owners can edit or delete workspaces.
            </div>
          )}

          {/* General Section */}
          <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm space-y-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-surface-900 dark:text-slate-100">General</h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-surface-700">
                  Workspace Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isOwner}
                  placeholder="e.g., Product Team"
                  className="w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-3 text-sm text-surface-800 placeholder:text-surface-400 transition-all focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-surface-700">
                  Purpose <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  disabled={!isOwner}
                  placeholder="What is this workspace for?"
                  rows={3}
                  className="w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-3 text-sm text-surface-800 placeholder:text-surface-400 transition-all focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none resize-none disabled:opacity-60 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              {isOwner && (
                <button
                  type="submit"
                  disabled={saving || !name.trim() || !purpose.trim()}
                  className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </form>
          </div>

          {/* Invite Code Info */}
          <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-lg font-bold text-surface-900 dark:text-slate-100">Invite Code</h2>
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-brand-50 px-4 py-2 font-mono text-lg font-bold tracking-widest text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                {workspace.inviteCode}
              </span>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(workspace.inviteCode);
                  toast.success('Invite Code Copied!');
                }}
                className="rounded-xl bg-surface-100 px-4 py-2 text-sm font-semibold text-surface-700 transition-colors hover:bg-surface-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Copy
              </button>
            </div>
            <p className="mt-2 text-xs text-surface-400 dark:text-slate-400">Share this code with people you want to invite to this workspace.</p>
          </div>

          {/* Activity log */}
          <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-surface-900 dark:text-slate-100">Activity Log</h2>
                <p className="mt-1 text-sm text-surface-500 dark:text-slate-400">Recent workspace and task activity</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {activityLoading ? (
                <div className="rounded-xl border border-dashed border-surface-200 px-4 py-6 text-center text-sm text-surface-400 dark:border-slate-700 dark:text-slate-400 dark:bg-slate-900/70">
                  Loading activity...
                </div>
              ) : activity.length === 0 ? (
                <div className="rounded-xl border border-dashed border-surface-200 px-4 py-6 text-center text-sm text-surface-400 dark:border-slate-700 dark:text-slate-400 dark:bg-slate-900/70">
                  No activity yet
                </div>
              ) : (
                activity.map((item) => (
                  <div key={item.id} className="flex gap-3 rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-surface-900 dark:text-slate-100">{item.title}</p>
                        <span className="text-xs text-surface-400 dark:text-slate-500">
                          {new Date(item.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-surface-600 dark:text-slate-300">{item.description}</p>
                      {item.user?.name && (
                        <p className="mt-1 text-xs text-surface-500 dark:text-slate-400">by {item.user.name}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Member roles */}
          <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-surface-900 dark:text-slate-100">Member Roles</h2>
                <p className="mt-1 text-sm text-surface-500 dark:text-slate-400">Your current role: <span className="font-semibold text-brand-700 dark:text-brand-300">{currentUserRole}</span></p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {workspace.members?.map((member) => {
                const memberId = member.id || member._id;
                const memberRole = member.role || 'member';
                const isCurrentUser = String(memberId) === String(user?.id);
                const roleBadgeClass = memberRole === 'owner'
                  ? 'bg-amber-50 text-amber-700'
                  : memberRole === 'admin'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-slate-100 text-slate-700';

                return (
                  <div key={memberId} className="flex flex-col gap-3 rounded-xl border border-surface-200 bg-surface-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-surface-900 dark:text-slate-100">{member.name || member.email || 'Member'}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadgeClass}`}>
                          {memberRole}
                        </span>
                      </div>
                      {member.email && <p className="mt-1 text-xs text-surface-500 dark:text-slate-400">{member.email}</p>}
                    </div>

                    {isOwner ? (
                      <select
                        value={memberRole}
                        disabled={isCurrentUser || updatingRoleId === memberId}
                        onChange={(e) => handleRoleChange(memberId, e.target.value)}
                        className="rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm text-surface-700 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </select>
                    ) : (
                      <span className="text-sm text-surface-500">{memberRole}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danger Zone */}
          {isOwner && (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 space-y-3 dark:border-red-900/60 dark:bg-red-950/40">
              <h2 className="text-lg font-bold text-red-700">Danger Zone</h2>
              <p className="text-sm text-red-600">
                Deleting this workspace will permanently remove all tasks and data associated with it. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-md shadow-red-500/25"
              >
                Delete Workspace
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:border dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-red-700">Delete Workspace</h3>
            <p className="mt-2 text-sm text-surface-600 dark:text-slate-300">
              Are you sure you want to delete <strong>"{workspace?.name}"</strong>? All tasks and data will be permanently lost.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-surface-300 px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-md shadow-red-500/20 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
