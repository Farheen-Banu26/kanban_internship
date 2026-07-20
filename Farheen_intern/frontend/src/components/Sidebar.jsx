import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import api from '../services/api';

const MENU_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    to: '/workspaces',
    label: 'Workspaces',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

const BOTTOM_ITEMS = [
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await api.get('/workspaces');
        setWorkspaces(response.data.data);
      } catch (err) {
        console.error('Failed to load workspaces in sidebar:', err);
      }
    };
    fetchWorkspaces();
  }, [location.pathname]); // Refresh list when navigating (e.g. after adding workspace)

  const linkClasses = (path) => {
    const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
    return `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-brand-50 text-brand-700 shadow-sm shadow-brand-500/10'
        : 'text-surface-500 hover:bg-surface-100 hover:text-surface-700'
    }`;
  };

  const iconClasses = (path) => {
    const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
    return isActive ? 'text-brand-500' : 'text-surface-400 group-hover:text-surface-600';
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-surface-200 bg-white p-4 shrink-0 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
      {/* ── Main navigation ──────────────────────────── */}
      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400 shrink-0 dark:text-slate-500">
          Menu
        </p>
        {MENU_ITEMS.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} className={linkClasses(to)}>
            <span className={iconClasses(to)}>{icon}</span>
            {label}
          </NavLink>
        ))}

        {/* ── Workspace shortcuts ──────────────────── */}
        <p className="px-3 mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400 shrink-0 dark:text-slate-500">
          My Workspaces
        </p>
        <div className="space-y-1">
          {workspaces.map((ws, i) => {
            const path = `/board/${ws.id}`;
            const isActive = location.pathname === path;
            const initials = ws.name?.charAt(0).toUpperCase() || '?';
            return (
              <Link
                key={ws.id}
                to={path}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-sm shadow-brand-500/10'
                    : 'text-surface-500 hover:bg-surface-100 hover:text-surface-700'
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25'
                    : 'bg-gradient-to-br from-brand-100 to-brand-200 text-brand-600'
                }`}>
                  {initials}
                </span>
                <span className="truncate">{ws.name}</span>
              </Link>
            );
          })}
          {workspaces.length === 0 && (
            <p className="px-3 py-2 text-xs text-surface-450 italic dark:text-slate-500">No workspaces</p>
          )}
        </div>
      </nav>

      {/* ── Bottom actions ────────────────────────────── */}
      <div className="border-t border-surface-200 pt-3 mt-3 flex flex-col gap-1 shrink-0 dark:border-slate-800">
        {BOTTOM_ITEMS.map(({ to, label, icon }) => (
          <NavLink key={label} to={to} className={linkClasses(to)}>
            <span className={iconClasses(to)}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
