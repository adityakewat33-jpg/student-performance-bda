import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  List,
  Upload,
  Users,
  Briefcase,
  Check,
  Zap,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { vibex } from '@/api/vibexClient';
const FONT = { fontFamily: "'Pretendard', system-ui, -apple-system, sans-serif" };
const ADMIN_NAV = [
  { label: 'Dashboard', icon: Home, to: '/admin' },
  {
    label: 'Dataset',
    icon: List,
    children: [
      { label: 'Student Records', icon: List, to: '/admin/students', permission: 'students:read' },
      { label: 'CSV Upload', icon: Upload, to: '/admin/upload', permission: 'import_logs:create' },
    ],
  },
  {
    label: 'Users & Permissions',
    icon: Users,
    children: [
      { label: 'Users', icon: Users, to: '/admin/users', permission: 'users:read' },
      { label: 'Roles', icon: Briefcase, to: '/admin/roles' },
      { label: 'Permissions', icon: Check, to: '/admin/permissions' },
    ],
  },
  {
    label: 'Settings',
    icon: Zap,
    children: [{ label: 'AI Settings', icon: Zap, to: '/admin/ai-settings' }],
  },
];
export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [rbac, setRbac] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    let alive = true;
    (async () => {
      try {
        const res = await vibex.auth.me();
        const user = res?.data;
        if (!alive) return;
        const isAdminAccount =
          user?.type === 'admin' || (user?.type == null && user?.role === 'admin');
        if (!isAdminAccount) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          navigate('/admin/login', { replace: true });
          return;
        }
        setMe(user);
        setIsAuthenticated(true);
        try {
          const r = await vibex.rbac.me();
          if (alive) setRbac(r?.data || null);
        } catch (e) {
          if (alive) setRbac(null);
        }
      } catch (err) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        navigate('/admin/login', { replace: true });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [navigate]);
  useEffect(() => {
    const next = {};
    ADMIN_NAV.forEach((group) => {
      if (group.children) {
        next[group.label] = group.children.some((c) => location.pathname.startsWith(c.to));
      }
    });
    setOpenGroups((prev) => {
      const merged = Object.assign({}, next, prev);
      ADMIN_NAV.forEach((group) => {
        if (group.children && next[group.label]) merged[group.label] = true;
      });
      return merged;
    });
    setMenuOpen(false);
  }, [location.pathname]);
  const can = (key) => {
    if (!key) return true;
    if (!rbac) return true;
    if (rbac.isAdmin) return true;
    return Array.isArray(rbac.permissions) ? rbac.permissions.includes(key) : true;
  };
  const handleLogout = () => {
    try {
      vibex.auth.logout();
    } catch (err) {
      /* ignore */
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/admin/login', { replace: true });
  };
  if (loading || !isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }
  const navContent = (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      {ADMIN_NAV.map((group) => {
        if (!group.children) {
          if (!can(group.permission)) return null;
          const active = location.pathname === group.to;
          return (
            <Link
              key={group.label}
              to={group.to}
              className={
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ' +
                (active
                  ? 'bg-indigo-50 text-[#4338CA] border border-indigo-200'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent')
              }
            >
              <group.icon className="w-4 h-4 shrink-0" />
              {group.label}
            </Link>
          );
        }
        const visible = group.children.filter((c) => can(c.permission));
        if (visible.length === 0) return null;
        const expanded = !!openGroups[group.label];
        return (
          <div key={group.label}>
            <button
              type="button"
              onClick={() =>
                setOpenGroups((prev) => Object.assign({}, prev, { [group.label]: !prev[group.label] }))
              }
              className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-3">
                <group.icon className="w-4 h-4 shrink-0 text-slate-400" />
                {group.label}
              </span>
              <ChevronDown
                className={'w-4 h-4 text-slate-400 transition-transform ' + (expanded ? 'rotate-180' : '')}
              />
            </button>
            {expanded ? (
              <div className="mt-1 ml-4 pl-3 border-l border-slate-200 space-y-1">
                {visible.map((child) => {
                  const active = location.pathname === child.to || location.pathname.startsWith(child.to + '/');
                  return (
                    <Link
                      key={child.to}
                      to={child.to}
                      className={
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ' +
                        (active ? 'bg-indigo-50 text-[#4338CA] font-semibold' : 'text-slate-600 hover:bg-slate-50')
                      }
                    >
                      <child.icon className="w-4 h-4 shrink-0" />
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
  return (
    <div className="flex h-screen bg-slate-50 overflow-x-hidden" style={FONT}>
      <aside className="hidden lg:flex w-64 border-r border-slate-200 bg-white flex-col">
        <div className="h-16 flex items-center px-5 border-b border-slate-100">
          <Link to="/admin">
            <img
              src="https://cdn.vibe-x.app/apps/d7ae1e35c4e83e7b4f62fe53/assets/original/logo-0-159731.png"
              alt="Logo"
              className="h-9 w-auto object-contain"
            />
          </Link>
        </div>
        {navContent}
        <div className="px-4 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm rounded-lg font-medium text-[#B91C1C] hover:bg-red-50 transition-colors inline-flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
      {menuOpen ? (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
              <img
                src="https://cdn.vibe-x.app/apps/d7ae1e35c4e83e7b4f62fe53/assets/original/logo-0-159731.png"
                alt="Logo"
                className="h-8 w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 active:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {navContent}
            <div className="px-4 py-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-4 py-2 text-sm rounded-lg font-medium text-[#B91C1C] hover:bg-red-50 transition-colors inline-flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center px-4 sm:px-6 gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="lg:hidden min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center rounded-lg text-slate-600 active:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">Admin Console</p>
            <p className="hidden sm:block text-xs text-slate-400 truncate">
              Student Performance Analysis Using Big Data Analytics
            </p>
          </div>
          <Link
            to="/"
            className="hidden sm:inline-flex px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-[#4338CA] transition-colors"
          >
            View dashboard
          </Link>
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            {me?.avatar ? (
              <img src={me.avatar} alt="" className="w-8 h-8 rounded-full object-cover bg-slate-100" />
            ) : (
              <span className="w-8 h-8 rounded-full bg-indigo-50 text-[#4338CA] flex items-center justify-center text-xs font-semibold">
                {(me?.name || 'A').slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="hidden sm:block text-sm text-slate-700 truncate max-w-[120px]">
              {me?.name || 'Admin'}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}