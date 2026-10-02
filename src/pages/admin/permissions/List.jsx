import { useEffect, useRef, useState } from 'react';
import { Plus, Edit, Trash2, Search, Loader2, X, Save, RefreshCw } from 'lucide-react';
import { vibex } from '@/api/vibexClient';
import { Permission } from '../../../api/entities';
import { extractPage, rowId } from '../../../data/paging';
import Notice from '../../../components/Notice';
const PAGE_SIZE = 20;
const ACTIONS = ['read', 'create', 'update', 'delete', 'manage'];
export default function PermissionsList() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const isComposingRef = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({ key: '', name: '', description: '', resource: '', action: 'read' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  useEffect(() => {
    if (isComposingRef.current) return undefined;
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const fetchData = async (pageNum) => {
    setLoading(true);
    try {
      const filter = { search };
      if (actionFilter) filter.action = actionFilter;
      const res = await Permission.paging({ page: pageNum, limit: PAGE_SIZE, filter, sort: 'key' });
      const parsed = extractPage(res);
      setRows(parsed.rows);
      setTotal(parsed.total);
      setTotalPages(parsed.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'Could not load permissions.' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, actionFilter]);
  const openModal = (row) => {
    setEditingId(row ? rowId(row) : '');
    setForm({
      key: row?.key || '',
      name: row?.name || '',
      description: row?.description || '',
      resource: row?.resource || '',
      action: row?.action || 'read',
    });
    setFormError('');
    setModalOpen(true);
  };
  const handleSave = async () => {
    if (!form.key.trim()) {
      setFormError('Permission key is required, in the form resource:action.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const body = {
        key: form.key.trim().toLowerCase(),
        name: form.name.trim() || form.key.trim(),
        description: form.description.trim(),
        resource: form.resource.trim() || form.key.split(':')[0],
        action: form.action,
      };
      if (editingId) await vibex.rbac.updatePermission(editingId, body);
      else await vibex.rbac.createPermission(body);
      setNotice({ type: 'success', message: editingId ? 'Permission updated.' : 'Permission created.' });
      setModalOpen(false);
      fetchData(page);
    } catch (err) {
      setFormError(err?.message || 'Could not save this permission.');
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (row) => {
    if (!window.confirm('Delete the permission "' + row.key + '"?')) return;
    try {
      await vibex.rbac.deletePermission(rowId(row));
      setNotice({ type: 'success', message: 'Permission deleted.' });
      fetchData(page);
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'Could not delete this permission.' });
    }
  };
  return (
    <div className="max-w-7xl mx-auto">
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Users &amp; Permissions</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">Permissions</h2>
          <p className="mt-2 text-sm text-slate-600 tabular-nums">
            {total.toLocaleString('en-US')} capabilities in the catalog
          </p>
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
            onClick={() => openModal(null)}
            className="px-4 py-2 text-sm rounded-lg font-semibold bg-[#4338CA] text-white hover:bg-[#3730a3] hover:text-white transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create permission
          </button>
        </div>
      </header>
      <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-3">
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
            placeholder="Search by key, name or resource"
            className="w-full pl-9 pr-4 py-2.5 text-base md:text-sm rounded-lg border border-slate-300 focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-full px-3 py-2.5 text-base md:text-sm rounded-lg border border-slate-300 bg-white focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
        >
          <option value="">All actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">No permissions match the current filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-medium">Key</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Resource</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={rowId(row)} className="border-t border-slate-100 hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{row.key}</td>
                    <td className="px-4 py-3 text-slate-600">{row.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{row.resource || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full bg-cyan-50 text-[#0E7490] text-xs font-semibold">
                        {row.action || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[280px] truncate">{row.description || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openModal(row)}
                          aria-label="Edit permission"
                          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#4338CA] hover:bg-indigo-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          aria-label="Delete permission"
                          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#B91C1C] hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                {editingId ? 'Edit permission' : 'Create permission'}
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
            <div role="form" aria-label="Permission form" className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Key</label>
                <input
                  type="text"
                  value={form.key}
                  onChange={(e) => setForm((p) => Object.assign({}, p, { key: e.target.value }))}
                  placeholder="students:read"
                  className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Use the collection name and the operation, lowercase English only.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => Object.assign({}, p, { name: e.target.value }))}
                  placeholder="View student records"
                  className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Resource</label>
                  <input
                    type="text"
                    value={form.resource}
                    onChange={(e) => setForm((p) => Object.assign({}, p, { resource: e.target.value }))}
                    placeholder="students"
                    className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Action</label>
                  <select
                    value={form.action}
                    onChange={(e) => setForm((p) => Object.assign({}, p, { action: e.target.value }))}
                    className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 bg-white focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
                  >
                    {ACTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((p) => Object.assign({}, p, { description: e.target.value }))}
                  className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none resize-y"
                />
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
                Save permission
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}