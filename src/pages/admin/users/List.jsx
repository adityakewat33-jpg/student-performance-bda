import { useEffect, useRef, useState } from 'react';
import { Plus, Edit, Trash2, Search, Loader2, X, Save, RefreshCw } from 'lucide-react';
import { vibex } from '@/api/vibexClient';
import { User, Role } from '../../../api/entities';
import { extractPage, rowId, rowTimestamp, formatDate } from '../../../data/paging';
import { toBooleanFlag } from '@/lib/booleanFlag';
import Notice from '../../../components/Notice';
const PAGE_SIZE = 20;
const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  type: 'user',
  isActive: true,
  isVerified: false,
  roles: [],
};
export default function UsersList() {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const isComposingRef = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  useEffect(() => {
    if (isComposingRef.current) return undefined;
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await Role.paging({ page: 1, limit: 100, filter: { search: '' } });
        if (alive) setRoles(extractPage(res).rows);
      } catch (err) {
        if (alive) setRoles([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  const fetchData = async (pageNum) => {
    setLoading(true);
    try {
      const filter = { search };
      if (roleFilter) filter.role = roleFilter;
      if (activeFilter) filter.isActive = activeFilter === 'yes';
      const res = await User.paging({ page: pageNum, limit: PAGE_SIZE, filter, sort: '-created_at' });
      const parsed = extractPage(res);
      setRows(parsed.rows);
      setTotal(parsed.total);
      setTotalPages(parsed.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'Could not load users.' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, activeFilter]);
  const openCreate = () => {
    setEditingId('');
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };
  const openEdit = (row) => {
    setEditingId(rowId(row));
    setForm({
      name: row.name || '',
      email: row.email || '',
      password: '',
      type: row.type === 'admin' ? 'admin' : 'user',
      isActive: toBooleanFlag(row.isActive),
      isVerified: toBooleanFlag(row.isVerified),
      roles: row.role ? [row.role] : [],
    });
    setFormError('');
    setModalOpen(true);
  };
  const validate = () => {
    if (!form.name.trim() || form.name.trim().length < 2) return 'Name must be at least 2 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Enter a valid email address.';
    if (!editingId) {
      if (form.password.length < 8) return 'Password must be at least 8 characters.';
      if (!/[A-Za-z]/.test(form.password)) return 'Password must include a letter.';
      if (!/[0-9]/.test(form.password)) return 'Password must include a number.';
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password))
        return 'Password must include a special character.';
    } else if (form.password) {
      if (form.password.length < 8) return 'New password must be at least 8 characters.';
      if (!/[A-Za-z]/.test(form.password)) return 'New password must include a letter.';
      if (!/[0-9]/.test(form.password)) return 'New password must include a number.';
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password))
        return 'New password must include a special character.';
    }
    return '';
  };
  const handleSave = async () => {
    const message = validate();
    if (message) {
      setFormError(message);
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      let userId = editingId;
      if (editingId) {
        const payload = {
          name: form.name.trim(),
          type: form.type,
          isActive: form.isActive,
          isVerified: form.isVerified,
        };
        if (form.password) payload.password = form.password;
        await User.update(editingId, payload);
      } else {
        const created = await User.create({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          type: form.type,
          isActive: form.isActive,
          isVerified: form.isVerified,
        });
        const body = created?.data?.data || created?.data || created;
        userId = rowId(body);
      }
      if (userId && form.roles.length > 0) {
        try {
          await vibex.rbac.assignRoles(userId, form.roles);
        } catch (err) {
          setNotice({ type: 'error', message: err?.message || 'The account was saved but roles could not be assigned.' });
        }
      }
      setNotice({ type: 'success', message: editingId ? 'User updated.' : 'User created.' });
      setModalOpen(false);
      fetchData(editingId ? page : 1);
    } catch (err) {
      setFormError(err?.message || 'Could not save this user.');
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (row) => {
    if (row.email === 'admin@vibe-x.app') {
      setNotice({ type: 'error', message: 'The primary admin account cannot be deleted.' });
      return;
    }
    if (!window.confirm('Delete the account for ' + (row.name || row.email) + '?')) return;
    try {
      await User.delete(rowId(row));
      setNotice({ type: 'success', message: 'User deleted.' });
      fetchData(page);
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'Could not delete this user.' });
    }
  };
  const toggleRole = (name) => {
    setForm((prev) => {
      const has = prev.roles.includes(name);
      return Object.assign({}, prev, {
        roles: has ? prev.roles.filter((r) => r !== name) : prev.roles.concat(name),
      });
    });
  };
  return (
    <div className="max-w-7xl mx-auto">
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Users &amp; Permissions</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">Users</h2>
          <p className="mt-2 text-sm text-slate-600 tabular-nums">{total.toLocaleString('en-US')} accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchData(page)}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg font-medium border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-[#4338CA] transition-colors inline-flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 text-sm rounded-lg font-semibold bg-[#4338CA] text-white hover:bg-[#3730a3] hover:text-white transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create user
          </button>
        </div>
      </header>
      <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={(e) => {
              isComposingRef.current = false;
              setSearchInput(e.currentTarget.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing && !isComposingRef.current) {
                setSearch(searchInput);
              }
            }}
            placeholder="Search by name or email"
            className="w-full pl-9 pr-4 py-2.5 text-base md:text-sm rounded-lg border border-slate-300 focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full px-3 py-2.5 text-base md:text-sm rounded-lg border border-slate-300 bg-white focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={rowId(r)} value={r.name}>
              {r.displayName || r.name}
            </option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="w-full px-3 py-2.5 text-base md:text-sm rounded-lg border border-slate-300 bg-white focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
        >
          <option value="">All statuses</option>
          <option value="yes">Active</option>
          <option value="no">Inactive</option>
        </select>
      </div>
      <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">No users match the current filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Active</th>
                  <th className="px-4 py-3 font-medium">Verified</th>
                  <th className="px-4 py-3 font-medium">Last login</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const active = toBooleanFlag(row.isActive);
                  const verified = toBooleanFlag(row.isVerified);
                  return (
                    <tr key={rowId(row)} className="border-t border-slate-100 hover:bg-indigo-50/30 transition-colors">
                      <td className="px-4 py-3 text-slate-800">{row.name || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{row.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-[#4338CA] text-xs font-semibold">
                          {row.role || 'user'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.type || 'user'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            'px-2.5 py-1 rounded-full text-xs font-semibold ' +
                            (active ? 'bg-green-50 text-[#15803D]' : 'bg-slate-100 text-slate-500')
                          }
                        >
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{verified ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(row.lastLoginAt)}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(rowTimestamp(row))}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            aria-label="Edit"
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#4338CA] hover:bg-indigo-50"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            aria-label="Delete"
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#B91C1C] hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 ? (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm text-slate-500 tabular-nums">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchData(page - 1)}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => fetchData(page + 1)}
                disabled={page >= totalPages || loading}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
      {modalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setModalOpen(false)} aria-hidden="true" />
          <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-xl border border-slate-200 shadow-xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-base font-semibold text-slate-900">
                {editingId ? 'Edit user' : 'Create user'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div role="form" aria-label="User form" className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => Object.assign({}, p, { name: e.target.value }))}
                  className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  disabled={!!editingId}
                  onChange={(e) => setForm((p) => Object.assign({}, p, { email: e.target.value }))}
                  className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {editingId ? 'Reset password (optional)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => Object.assign({}, p, { password: e.target.value }))}
                  placeholder="8+ characters with a letter, number and symbol"
                  className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Account type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => Object.assign({}, p, { type: e.target.value }))}
                  className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 bg-white focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
                >
                  <option value="user">user — no admin console access</option>
                  <option value="admin">admin — can sign into the console</option>
                </select>
              </div>
              <div>
                <p className="block text-sm font-medium text-slate-700 mb-2">Roles</p>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => {
                    const checked = form.roles.includes(r.name);
                    return (
                      <button
                        key={rowId(r)}
                        type="button"
                        onClick={() => toggleRole(r.name)}
                        className={
                          'px-3 py-1.5 text-sm rounded-full border transition-colors ' +
                          (checked
                            ? 'border-[#4338CA] bg-indigo-50 text-[#4338CA] font-semibold'
                            : 'border-slate-200 text-slate-600 hover:border-indigo-300')
                        }
                      >
                        {r.displayName || r.name}
                      </button>
                    );
                  })}
                  {roles.length === 0 ? <p className="text-sm text-slate-400">No roles available.</p> : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => Object.assign({}, p, { isActive: e.target.checked }))}
                    className="w-4 h-4 accent-[#4338CA]"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isVerified}
                    onChange={(e) => setForm((p) => Object.assign({}, p, { isVerified: e.target.checked }))}
                    className="w-4 h-4 accent-[#4338CA]"
                  />
                  Verified
                </label>
              </div>
              {formError ? (
                <p className="text-sm text-[#B91C1C] bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {formError}
                </p>
              ) : null}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm rounded-lg font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 text-sm rounded-lg font-semibold bg-[#4338CA] text-white hover:bg-[#3730a3] hover:text-white transition-colors inline-flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}