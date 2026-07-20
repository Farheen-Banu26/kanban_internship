import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AcceptInvitation() {
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useAuth();
  const [invitation, setInvitation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading || !isAuthenticated) return;

    const loadInvitation = async () => {
      try {
        const response = await api.get(`/invitations/${token}`);
        setInvitation(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load this invitation.');
      }
    };

    loadInvitation();
  }, [isAuthenticated, loading, token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const handleAccept = async () => {
    setSubmitting(true);
    setError('');

    try {
      const response = await api.post(`/invitations/${token}/accept`);
      toast.success(response.data.message || 'Invitation accepted');
      const workspaceId = response.data.data?.workspace?.id;
      if (workspaceId) {
        navigate(`/board/${workspaceId}`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to accept this invitation.';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-brand-50 px-4 py-10 transition-colors duration-300 dark:from-bg-dark dark:to-surface-dark">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-brand-100 dark:border-border-dark dark:bg-card-dark dark:shadow-none">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white dark:bg-primary-dark">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h16" />
              <path d="M7 3h10" />
              <path d="M5 11h14" />
              <path d="M5 15h8" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-blue-400">Workspace Invitation</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-heading-dark">Join your team</h1>
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">{error}</div>
        ) : null}

        {invitation ? (
          <div className="space-y-5">
            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-surface-dark/60 dark:border dark:border-border-dark">
              <p className="text-sm font-medium text-slate-500 dark:text-muted-dark">Workspace</p>
              <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-heading-dark">{invitation.workspace?.name || 'Shared Workspace'}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-body-dark">{invitation.workspace?.purpose || 'You have been invited to collaborate.'}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-border-dark dark:bg-card-dark/60">
                <p className="text-sm font-medium text-slate-500 dark:text-muted-dark">Invited by</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-heading-dark">{invitation.invitedBy?.name || 'A workspace collaborator'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-border-dark dark:bg-card-dark/60">
                <p className="text-sm font-medium text-slate-500 dark:text-muted-dark">Invite code</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-heading-dark">{invitation.inviteCode}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-muted-dark">Signed in as <span className="font-semibold text-slate-700 dark:text-body-dark">{user?.email || 'your account'}</span>.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAccept}
                disabled={submitting}
                className="flex-1 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary-dark dark:hover:bg-blue-600"
              >
                {submitting ? 'Joining workspace...' : 'Accept Invitation'}
              </button>
              <button
                type="button"
                onClick={handleDecline}
                className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-border-dark dark:bg-surface-dark dark:text-white dark:hover:bg-card-dark"
              >
                Decline
              </button>
            </div>
          </div>
        ) : !error ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 dark:border-border-dark dark:bg-surface-dark/60 dark:text-muted-dark">Loading invitation details...</div>
        ) : null}

        <div className="mt-6 text-sm text-slate-500 dark:text-muted-dark">
          Need a different account? <Link to="/login" className="font-semibold text-brand-600 dark:text-blue-400 dark:hover:text-blue-300">Sign in with another account</Link>
        </div>
      </div>
    </div>
  );
}
