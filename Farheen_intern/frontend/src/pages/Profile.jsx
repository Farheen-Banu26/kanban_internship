import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function Profile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        setProfile(res.data.data);
        setName(res.data.data.name);
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password && password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      const body = {};
      if (name.trim() !== profile.name) body.name = name.trim();
      if (password) body.password = password;

      if (Object.keys(body).length === 0) {
        toast('No changes to save', { icon: 'ℹ️' });
        setSaving(false);
        return;
      }

      const res = await api.put('/users/profile', body);
      setProfile((prev) => ({ ...prev, ...res.data.data }));
      setPassword('');
      setConfirmPassword('');
      toast.success('Profile updated successfully!');

      // Update localStorage so name reflects in navbar
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name: res.data.data.name }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  const initials = profile?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-surface-900 dark:text-slate-100">My Profile</h1>
        <p className="mt-1 text-surface-500 dark:text-slate-400">View and update your personal information</p>
      </div>

      {/* Profile Info Card */}
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-3xl font-bold shadow-lg shadow-brand-500/25 shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-slate-100">{profile?.name}</h2>
            <p className="text-sm text-surface-500 dark:text-slate-400">{profile?.email}</p>
            <p className="mt-1 text-xs text-surface-400 dark:text-slate-500">
              Joined {formatDate(profile?.createdAt)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 text-center">
            <div className="text-2xl font-extrabold text-brand-700">{profile?.workspaceCount ?? 0}</div>
            <div className="mt-1 text-xs font-medium text-surface-500 dark:text-slate-400">Workspaces</div>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-center">
            <div className="text-2xl font-extrabold text-emerald-700">{profile?.assignedTaskCount ?? 0}</div>
            <div className="mt-1 text-xs font-medium text-surface-500 dark:text-slate-400">Assigned Tasks</div>
          </div>
        </div>
      </div>

      {/* Update Form */}
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm space-y-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-surface-900 dark:text-slate-100">Update Profile</h2>

        <form onSubmit={handleUpdate} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-700 dark:text-slate-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-3 text-sm text-surface-800 placeholder:text-surface-400 transition-all focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
            />
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-700 dark:text-slate-300">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              className="w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-3 text-sm text-surface-800 placeholder:text-surface-400 transition-all focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
            />
          </div>

          {/* Confirm Password */}
          {password && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-slate-300">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className={`w-full rounded-xl border px-4 py-3 text-sm text-surface-800 placeholder:text-surface-400 transition-all focus:ring-4 focus:outline-none bg-surface-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-surface-300 focus:border-brand-500 focus:bg-white focus:ring-brand-500/10'
                }`}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
