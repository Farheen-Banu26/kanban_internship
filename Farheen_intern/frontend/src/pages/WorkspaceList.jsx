import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const GRADIENT_SETS = [
  'from-brand-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-rose-600',
  'from-cyan-500 to-blue-600',
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function CreateWorkspaceModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !purpose.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      await api.post('/workspaces', { name, purpose });
      setName('');
      setPurpose('');
      onSuccess();
      onClose();
      toast.success('Workspace created successfully!');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create workspace.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:border dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-bold text-surface-900 dark:text-slate-100">Create Workspace</h3>
        <p className="mt-1 text-sm text-surface-500 dark:text-slate-400">A workspace is where your team collaborates on tasks.</p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="workspace-name" className="block text-sm font-medium text-surface-700">
              Workspace Name <span className="text-red-500">*</span>
            </label>
            <input
              id="workspace-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Product Team"
              className="w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-3 text-sm text-surface-800 placeholder:text-surface-400 transition-all focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="workspace-purpose" className="block text-sm font-medium text-surface-700">
              Purpose <span className="text-red-500">*</span>
            </label>
            <textarea
              id="workspace-purpose"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="What is this workspace for?"
              rows={3}
              className="w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-3 text-sm text-surface-800 placeholder:text-surface-400 transition-all focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none resize-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-xl border border-surface-300 px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="create-workspace-submit-btn"
              type="submit"
              disabled={submitting || !name.trim() || !purpose.trim()}
              className="flex-1 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JoinWorkspaceModal({ isOpen, onClose, onSuccess }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      await api.post('/workspaces/join', { inviteCode: code });
      setCode('');
      onSuccess();
      onClose();
      toast.success('Joined workspace successfully!');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to join workspace. Please verify the code.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:border dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-bold text-surface-900 dark:text-slate-100">Join Workspace</h3>
        <p className="mt-1 text-sm text-surface-500 dark:text-slate-400">Enter the invite code shared by a workspace member.</p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="invite-code" className="block text-sm font-medium text-surface-700">
              Invite code
            </label>
            <input
              id="invite-code"
              type="text"
              required
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., ENG2X9KA"
              className="w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-3 text-sm font-mono text-surface-800 placeholder:text-surface-400 tracking-widest uppercase transition-all focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-xl border border-surface-300 px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="join-workspace-submit-btn"
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Joining...' : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WorkspaceCard({ ws, index, onNavigate }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const isOwner = ws.owner?.id === user?.id || ws.owner?._id === user?.id || String(ws.owner?.id) === String(user?.id);

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(ws.inviteCode);
      setCopied(true);
      toast.success('Invite Code Copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy invite code');
    }
  };

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer dark:border-slate-800 dark:bg-slate-900"
      onClick={() => onNavigate(`/board/${ws.id}`)}
    >
      {/* Header gradient */}
      <div className={`h-20 bg-gradient-to-br ${GRADIENT_SETS[index % GRADIENT_SETS.length]} relative`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-3 right-3">
          {isOwner && (
            <span className="inline-block rounded-md bg-white/20 backdrop-blur-sm px-2 py-0.5 text-xs font-semibold text-white">
              Owner
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-3">
        {/* 📁 Name */}
        <div>
          <h3 className="flex items-center gap-1.5 text-base font-bold text-surface-900 transition-colors group-hover:text-brand-700 dark:text-slate-100">
            <span>📁</span> {ws.name}
          </h3>
        </div>

        {/* 📝 Purpose */}
        {ws.purpose && (
          <p className="flex gap-1.5 text-sm leading-relaxed text-surface-500 line-clamp-2 dark:text-slate-400">
            <span className="shrink-0">📝</span>
            <span>{ws.purpose}</span>
          </p>
        )}

        {/* 📅 Created */}
        <div className="flex items-center gap-1.5 text-xs text-surface-400">
          <span>📅</span>
          <span>Created: <span className="font-medium text-surface-600 dark:text-slate-300">{formatDate(ws.createdAt)}</span></span>
        </div>

        {/* 👥 Members */}
        <div className="flex items-center gap-1.5 text-xs text-surface-500">
          <span>👥</span>
          <span><span className="font-semibold text-surface-700 dark:text-slate-200">{ws.members?.length || 0}</span> member{ws.members?.length !== 1 ? 's' : ''}</span>
        </div>

        {/* 🔑 Invite Code + Copy */}
        <div
          className="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">🔑</span>
            <span className="font-mono text-xs font-bold tracking-wider text-surface-700 dark:text-slate-200">{ws.inviteCode}</span>
          </div>
          <button
            onClick={handleCopy}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
              copied
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
            }`}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        {/* Settings link for owner */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex -space-x-2">
            {ws.members?.slice(0, 4).map((m, j) => (
              <div
                key={j}
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white bg-gradient-to-br ${GRADIENT_SETS[(index + j) % GRADIENT_SETS.length]}`}
                title={m.name}
              >
                {m.name?.charAt(0) || '?'}
              </div>
            ))}
            {ws.members?.length > 4 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-surface-100 text-xs font-semibold text-surface-600">
                +{ws.members.length - 4}
              </div>
            )}
          </div>
          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/settings?workspaceId=${ws.id}`;
              }}
              className="flex items-center gap-1 text-xs text-surface-400 transition-colors hover:text-surface-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Settings
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const navigate = useNavigate();

  const fetchWorkspaces = useCallback(async () => {
    setError('');
    try {
      const response = await api.get('/workspaces');
      setWorkspaces(response.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load workspaces. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900 dark:text-slate-100">Workspaces</h1>
          <p className="mt-1 text-surface-500 dark:text-slate-400">Manage and switch between your team workspaces</p>
        </div>
        <div className="flex gap-3">
          <button
            id="join-workspace-btn"
            onClick={() => setShowJoin(true)}
            className="rounded-xl border border-surface-300 px-4 py-2.5 text-sm font-medium text-surface-700 transition-all hover:bg-surface-50 hover:border-surface-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Join Workspace
          </button>
          <button
            id="create-workspace-btn"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Workspace
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : workspaces.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-surface-200 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
          </div>
          <h3 className="text-lg font-bold text-surface-900 dark:text-slate-100">No workspaces yet</h3>
          <p className="mt-1 mx-auto max-w-sm text-sm text-surface-500 dark:text-slate-400">Create a new workspace or join an existing one using an invite code to get started.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => setShowJoin(true)} className="rounded-xl border border-surface-300 px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
              Join Workspace
            </button>
            <button onClick={() => setShowCreate(true)} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm">
              Create Workspace
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {workspaces.map((ws, i) => (
            <WorkspaceCard key={ws.id} ws={ws} index={i} onNavigate={navigate} />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateWorkspaceModal isOpen={showCreate} onClose={() => setShowCreate(false)} onSuccess={fetchWorkspaces} />
      <JoinWorkspaceModal isOpen={showJoin} onClose={() => setShowJoin(false)} onSuccess={fetchWorkspaces} />
    </div>
  );
}
