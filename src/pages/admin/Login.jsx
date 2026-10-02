import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { vibex } from '@/api/vibexClient';
const FONT = { fontFamily: "'Pretendard', system-ui, -apple-system, sans-serif" };
const GRID_BG = {
  backgroundImage:
    'linear-gradient(to right, rgba(67,56,202,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(67,56,202,0.05) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
};
export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setChecking(false);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const res = await vibex.auth.me();
        const user = res?.data;
        const isAdminAccount = user?.type === 'admin' || (user?.type == null && user?.role === 'admin');
        if (!alive) return;
        if (isAdminAccount) {
          navigate('/admin', { replace: true });
          return;
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      } catch (err) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      } finally {
        if (alive) setChecking(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [navigate]);
  const handleSubmit = async () => {
    if (loading) return;
    if (!email.trim() || !password) {
      setError('Please enter both email address and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await vibex.auth.login({ email: email.trim(), password });
      const payload = res?.data?.data || res?.data || {};
      const token = payload.token;
      const user = payload.user;
      if (token) localStorage.setItem('access_token', token);
      if (user) localStorage.setItem('user', JSON.stringify(user));
      const meRes = await vibex.auth.me();
      const me = meRes?.data;
      const isAdminAccount = me?.type === 'admin' || (me?.type == null && me?.role === 'admin');
      if (!isAdminAccount) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setError('This account is not an admin account.');
        setLoading(false);
        return;
      }
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err?.message || 'Sign in failed. Please try again.');
      setLoading(false);
    }
  };
  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 overflow-x-hidden" style={FONT}>
      <div className="fixed inset-0 pointer-events-none" style={GRID_BG} aria-hidden="true" />
      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img
            src="https://cdn.vibe-x.app/apps/d7ae1e35c4e83e7b4f62fe53/assets/original/logo-0-159731.png"
            alt="Logo"
            className="h-10 w-auto object-contain"
          />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-7 sm:px-8">
          <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Admin Console</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage the student dataset, CSV imports and console users.
          </p>
          <div role="form" aria-label="Admin sign in" className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSubmit();
                }}
                placeholder="Please enter email address"
                autoComplete="username"
                className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSubmit();
                  }}
                  placeholder="Please enter password"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 text-base rounded-lg border border-slate-300 focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error ? (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-[#B91C1C] mt-0.5 shrink-0" />
                <p className="text-sm text-[#B91C1C]">{error}</p>
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full px-6 py-3 text-base rounded-lg font-semibold bg-[#4338CA] text-white hover:bg-[#3730a3] hover:text-white active:scale-95 transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Sign in
            </button>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          © 2026 Student Performance Analysis Using Big Data Analytics
        </p>
      </div>
    </div>
  );
}