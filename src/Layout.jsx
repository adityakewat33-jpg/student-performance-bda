import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BarChart, PieChart, TrendingUp, Search, BookOpen, Menu, X, RefreshCw, Users, UploadCloud } from 'lucide-react';
import { useDatasetStore } from './store/datasetStore';
const NAV = [
  { to: '/', label: 'Dashboard', icon: BarChart, hint: 'Key numbers at a glance' },
  { to: '/analysis', label: 'Student Analysis', icon: PieChart, hint: 'Groups, gender, attendance' },
  { to: '/trends', label: 'Performance Trends', icon: TrendingUp, hint: 'Batch, age, study hours' },
  { to: '/search', label: 'Student Search', icon: Search, hint: 'Find one student profile' },
  { to: '/upload', label: 'Upload Dataset', icon: UploadCloud, hint: 'Ingest CSV / JSON data' },
  { to: '/about', label: 'About Project', icon: BookOpen, hint: 'Report content and viva Q&A' },
];
const GRID_BG = {
  backgroundImage:
    'linear-gradient(to right, rgba(67,56,202,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(67,56,202,0.045) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
};
const FONT = { fontFamily: "'Pretendard', system-ui, -apple-system, sans-serif" };
export default function Layout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const init = useDatasetStore((s) => s.init);
  const refreshDb = useDatasetStore((s) => s.refreshDb);
  const students = useDatasetStore((s) => s.students);
  const loading = useDatasetStore((s) => s.loading);
  const refreshing = useDatasetStore((s) => s.refreshing);
  const importMeta = useDatasetStore((s) => s.importMeta);
  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);
  const current = NAV.find((n) => n.to === location.pathname) || NAV[0];
  const navList = (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      {NAV.map((item) => {
        const active = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={
              'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 ' +
              (active
                ? 'bg-indigo-50 text-[#4338CA] border border-indigo-200'
                : 'text-slate-600 hover:bg-slate-50 border border-transparent')
            }
          >
            <item.icon className={'w-5 h-5 mt-0.5 shrink-0 ' + (active ? 'text-[#4338CA]' : 'text-slate-400')} />
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-tight">{item.label}</span>
              <span className="block text-xs text-slate-400 mt-0.5 leading-tight">{item.hint}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
  return (
    <div className="min-h-screen flex overflow-x-hidden bg-slate-50 text-slate-800" style={FONT}>
      <div className="fixed inset-0 pointer-events-none" style={GRID_BG} aria-hidden="true" />
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex-col z-40">
        <div className="h-16 flex items-center px-5 border-b border-slate-100">
          <Link to="/" className="flex items-center">
            <img
              src="https://cdn.vibe-x.app/apps/d7ae1e35c4e83e7b4f62fe53/assets/original/logo-0-159731.png"
              alt="Logo"
              className="h-9 w-auto object-contain"
            />
          </Link>
        </div>
        {navList}
        <div className="px-4 py-4 border-t border-slate-100">
          <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Dataset</p>
          <p className="mt-1 text-sm text-slate-600 tabular-nums">
            {loading ? 'Loading…' : students.length.toLocaleString('en-US') + ' records'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {importMeta ? 'Imported CSV + saved rows' : 'Generated sample + saved rows'}
          </p>
        </div>
      </aside>
      {/* Mobile drawer */}
      {menuOpen ? (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white border-r border-slate-200 flex flex-col">
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
            {navList}
          </div>
        </div>
      ) : null}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen relative">
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="lg:hidden min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center rounded-lg text-slate-600 active:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-semibold text-slate-900 truncate tracking-tight">
                {current.label}
              </h1>
              <p className="hidden sm:block text-xs text-slate-400 truncate">
                Student Performance Analysis Using Big Data Analytics
              </p>
            </div>
            <Link
              to="/upload"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Dataset</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
              <Users className="w-4 h-4 text-[#4338CA]" />
              <span className="text-xs font-medium text-[#4338CA] tabular-nums">
                {loading ? '…' : students.length.toLocaleString('en-US')} records
              </span>
            </div>
            <button
              type="button"
              onClick={() => refreshDb()}
              disabled={refreshing}
              aria-label="Refresh dataset"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-[#4338CA] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={'w-4 h-4 ' + (refreshing ? 'animate-spin' : '')} />
            </button>
          </div>
        </header>
        <main className="flex-1 relative">
          <Outlet />
        </main>
        <footer className="relative" style={{ backgroundColor: '#1E1B4B' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="flex items-center gap-4">
                <img
                  src="https://cdn.vibe-x.app/apps/d7ae1e35c4e83e7b4f62fe53/assets/original/on-dark-logo_variant-0-159731.png"
                  alt="Logo"
                  className="h-8 w-auto object-contain"
                />
                <p className="text-xs text-indigo-200/80 leading-relaxed">
                  Computer Engineering mini-project · Big Data Analytics
                </p>
              </div>
              <div className="hidden md:flex items-center gap-6">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="text-xs text-indigo-200/80 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-indigo-200/60">
                © 2026 Student Performance Analysis Using Big Data Analytics
              </p>
              <Link to="/admin/login" className="text-xs text-indigo-300/60 hover:text-indigo-100 transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}