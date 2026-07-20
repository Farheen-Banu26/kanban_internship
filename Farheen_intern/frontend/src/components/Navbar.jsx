import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { createSocketClient } from '../services/socket';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/workspaces', label: 'Workspaces' },
];

function NotificationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TYPE_ICON = {
  workspace_created: '📁',
  workspace_joined: '🔗',
  task_assigned: '📋',
  task_completed: '✅',
  task_due_soon: '⏰',
  task_mentioned: '💬',
};

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Dropdowns
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nLoading, setNLoading] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = useCallback(async () => {
    setNLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
    } catch {
      // silent
    } finally {
      setNLoading(false);
    }
  }, []);

  const socketUrl = useMemo(() => {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    if (baseUrl && baseUrl !== '/api') {
      return baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '') || window.location.origin;
    }
    return window.location.origin;
  }, []);
  const socketRef = useRef(null);

  // Fetch unread count on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = createSocketClient(token, socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      // no-op
    });

    socket.on('disconnect', () => {
      // no-op
    });

    socket.on('notification', ({ notification }) => {
      if (!notification) return;
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);
    });

    socket.on('connect_error', () => {
      // ignore connection errors for notifications
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [socketUrl]);

  const handleOpenNotifications = () => {
    setShowProfile(false);
    setShowNotifications((v) => !v);
    if (!showNotifications) fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleClearNotifications = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
      toast.success('Notifications cleared');
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-surface-200 bg-white/80 backdrop-blur-lg px-4 md:px-6 transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark/80 dark:backdrop-blur-md">
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2.5 mr-8 group">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-md shadow-brand-500/25 transition-transform group-hover:scale-105">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent hidden sm:block dark:bg-none dark:text-heading-dark">
          TaskFlow
        </span>
      </Link>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-1">
        {NAV_LINKS.map(({ to, label }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <Link
              key={to}
              to={to}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive ? 'bg-brand-50 text-brand-700 dark:bg-card-dark dark:text-white' : 'text-surface-500 hover:text-surface-800 hover:bg-surface-100 dark:text-muted-dark dark:hover:bg-slate-800 dark:hover:text-heading-dark'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:text-muted-dark dark:hover:bg-slate-800 dark:hover:text-heading-dark"
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2.5v2" /><path d="M12 19.5v2" /><path d="M4.5 4.5l1.5 1.5" /><path d="M18 18l1.5 1.5" /><path d="M2.5 12h2" /><path d="M19.5 12h2" /><path d="M4.5 19.5l1.5-1.5" /><path d="M18 6l1.5-1.5" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" /></svg>
          )}
        </button>

        {/* ── Notifications ─────────────────────────── */}
        <div className="relative" ref={notifRef}>
          <button
            id="notifications-btn"
            onClick={handleOpenNotifications}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors dark:text-muted-dark dark:hover:bg-slate-800/80 dark:hover:text-heading-dark"
            aria-label="Notifications"
          >
            <NotificationIcon />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-11 w-80 rounded-2xl border border-surface-200 bg-white shadow-xl z-50 overflow-hidden dark:border-border-dark dark:bg-card-dark dark:shadow-slate-950/60">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-border-dark">
                <span className="font-semibold text-sm text-surface-900 dark:text-heading-dark">
                  Notifications {unreadCount > 0 && <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-600 dark:bg-red-950/50 dark:text-red-300">{unreadCount}</span>}
                </span>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-brand-600 hover:text-brand-800 dark:text-primary-dark dark:hover:text-blue-400 font-medium">
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={handleClearNotifications} className="text-xs text-surface-400 hover:text-red-600 dark:text-muted-dark dark:hover:text-red-400 font-medium">
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="max-h-72 overflow-y-auto">
                {nLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-surface-400 dark:text-muted-dark">
                    <div className="text-2xl mb-2">🔔</div>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`flex gap-3 px-4 py-3 border-b border-surface-50 transition-colors ${
                        n.isRead ? 'bg-white dark:bg-card-dark dark:border-border-dark' : 'bg-brand-50/50 dark:bg-surface-dark border-l-4 border-brand-500 dark:border-l-primary-dark'
                      }`}
                    >
                      <span className="text-lg shrink-0 mt-0.5">{TYPE_ICON[n.type] || '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${n.isRead ? 'text-surface-600 dark:text-muted-dark' : 'text-surface-900 dark:text-heading-dark font-medium'}`}>
                          {n.message}
                        </p>
                        <p className="mt-0.5 text-xs text-surface-400 dark:text-slate-400">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-brand-500 dark:bg-primary-dark shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Profile ───────────────────────────────── */}
        <div className="relative" ref={profileRef}>
          <button
            id="profile-btn"
            onClick={() => {
              setShowNotifications(false);
              setShowProfile((v) => !v);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-sm font-semibold shadow-sm select-none hover:shadow-md hover:scale-105 transition-all"
            title={user?.name || 'Profile'}
          >
            {initials}
          </button>

          {showProfile && (
            <div className="absolute right-0 top-11 w-56 rounded-2xl border border-surface-200 bg-white shadow-xl z-50 overflow-hidden dark:border-border-dark dark:bg-card-dark dark:shadow-slate-950/60">
              {/* User info */}
              <div className="px-4 py-3 border-b border-surface-100 dark:border-border-dark">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-sm font-semibold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-surface-900 dark:text-heading-dark truncate">{user?.name}</p>
                    <p className="text-xs text-surface-400 dark:text-muted-dark truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                <Link
                  to="/profile"
                  onClick={() => setShowProfile(false)}
                  className="group flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors dark:text-heading-dark dark:hover:bg-primary-dark dark:hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-surface-400 transition-colors dark:text-slate-400 group-hover:dark:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  My Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowProfile(false)}
                  className="group flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors dark:text-heading-dark dark:hover:bg-primary-dark dark:hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-surface-400 transition-colors dark:text-slate-400 group-hover:dark:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Settings
                </Link>
              </div>

              <div className="border-t border-surface-100 dark:border-border-dark py-1.5">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
