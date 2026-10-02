import { useEffect, useRef, useState } from 'react';
import { Plus, Edit, Trash2, Search, Loader2, X, Save, RefreshCw } from 'lucide-react';
import { vibex } from '@/api/vibexClient';
import { Role, Permission, RolePermission } from '../../../api/entities';
import { extractPage, rowId, rowTimestamp, formatDate } from '../../../data/paging';
import { toBooleanFlag } from '@/lib/booleanFlag';
import Notice from '../../../components/Notice';
const PAGE_SIZE = 20;
export default function RolesList() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const isComposingRef = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({ name: '', displayName: '', description: '' });
  const [permissions, setPermissions] = useState([]);
  const [checked, setChecked] = useState(new Set());
  const [modalLoading, setModalLoading] = useState(false);
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
      const res = await Role.paging({ page: pageNum, limit: PAGE_SIZE, filter: { search }, sort: 'name' });
      const parsed = extractPage(res);
      setRows(parsed.rows);
      setTotal(parsed.total);
      setTotalPages(parsed.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'Could not load roles.' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  const openModal = async (role) => {
    setModalOpen(true);
    setModalLoading(true);
    setFormError('');
    setChecked(new Set());
    setEditingId(role ? rowId(role) : '');
    setForm({
      name: role?.name || '',
      displayName: role?.displayName || '',
      description: role?.description || '',
    });
    try {
      const permRes = await Permission.paging({ page: 1, limit: 200, filter: { search: '' }, sort: 'key' });
      const permRows = extractPage(permRes).rows;
      setPermissions(permRows);
      if (role) {
        let ids = [];
               try {
          const res = await vibex.rbac.getRolePermissionIds(rowId(role));
          const body = res?.data ?? res;
          if (Array.isArray(body)) ids = body.map((x) => String(x));
          else if (Array.isArray(body?.permissionIds)) ids = body.permissionIds.map((x) => String(x));
        } catch (err) {
          ids = [];
        }
        if (ids.length === 0) {
          try {
            const mapRes = await RolePermission.paging({
              page: 1,
              limit: 300,
              filter: { roleId: rowId(role), search: '' },
            });
            ids = extractPage(mapRes)
              .rows.map((r) => String(r.permissionId || ''))
              .filter(Boolean);
          } catch (err) {
            ids = [];
          }
        }
        setChecked(new Set(ids.map(String)));
      }
    } catch (err) {
      setFormError(err?.message || 'Could not load permissions.');
    } finally {
      setModalLoading(false);
    }
  };
  const closeModal = () => {
    setModalOpen(false);
    setChecked(new Set());
    setEditingId('');
    setForm({ name: '', displayName: '', description: '' });
    setFormError('');
  };
  const toggleOne = (id) => {
    setChecked((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const groups = permissions.reduce((acc, p) => {
    const key = p.resource || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});
  const toggleGroup = (resource) => {
    const ids = (groups[resource] || []).map((p) => String(rowId(p)));
    const allOn = ids.every((id) => checked.has(id));
    setChecked((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (allOn) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };
  const toggleAll = () => {
    const ids = permissions.map((p) => String(rowId(p)));
    const allOn = ids.length > 0 && ids.every((id) => checked.has(id));
    setChecked(allOn ? new Set() : new Set(ids));
  };
  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('Role name is required (lowercase English, e.g. manager).');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      let roleId = editingId;
      const body = {
        name: form.name.trim(),
        displayName: form.displayName.trim() || form.name.trim(),
        description: form.description.trim(),
      };
      if (editingId) {
        await vibex.rbac.updateRole(editingId, body);
      } else {
        const res = await vibex.rbac.createRole(body);
        const created = res?.data?.role || res?.data || res;
        roleId = rowId(created);
      }
      if (roleId) {
        await vibex.rbac.setRolePermissions(roleId, Array.from(checked));
      }
      setNotice({ type: 'success', message: editingId ? 'Role updated.' : 'Role created.' });
      closeModal();
      fetchData(page);
    } catch (err) {
      setFormError(err?.message || 'Could not save this role.');
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (role) => {
    if (toBooleanFlag(role.isSystem)) {
      setNotice({ type: 'error', message: 'System roles cannot be deleted.' });
      return;
    }
    if (!window.confirm('Delete the role "' + role.name + '"? Its permission mappings are removed too.')) return;
    try {
      await vibex.rbac.deleteRole(rowId(role));
      setNotice({ type: 'success', message: 'Role deleted.' });
      fetchData(page);
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'Could not delete this role.' });
    }
  };
  const allChecked = permissions.length > 0 && permissions.every((p) => checked.has(String(rowId(p))));
  return (
    <div className="max-w-7xl mx-auto">
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Users &amp; Permissions</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">Roles</h2>
          <p className="mt-2 text-sm text-slate-600 tabular-nums">{total.toLocaleString('en-US')} roles</p>
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
            Create role
          </button>
        </div>
      </header>
      <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
        <div className="relative max-w-md">
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
            placeholder="Search roles"
            className="w-full pl-9 pr-4 py-2.5 text-base md:text-sm rounded-lg border border-slate-300 focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
          />
        </div>
      </div>
      <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">No roles found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-medium">Role name</th>
                  <th className="px-4 py-3 font-medium">Display name</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">System</th>
                  <th className="px-4 py-3 font-medium">Default</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={rowId(row)} className="border-t border-slate-100 hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                    <td className="px-4 py-3 text-slate-600">{row.displayName || '-'}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[280px] truncate">{row.description || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{toBooleanFlag(row.isSystem) ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-slate-600">{toBooleanFlag(row.isDefault) ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(rowTimestamp(row))}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openModal(row)}
                          aria-label="Edit role"
                          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#4338CA] hover:bg-indigo-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          aria-label="Delete role"
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
          <div className="absolute inset-0 bg-slate-900/50" onClick={closeModal} aria-hidden="true" />
          <div className="relative w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-xl border border-slate-200 shadow-xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-base font-semibold text-slate-900">
                {editingId ? 'Edit role' : 'Create role'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {modalLoading ? (
              <div className="py-20 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : (
              <div role="form" aria-label="Role form" className="px-6 py-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Role name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((p) => Object.assign({}, p, { name: e.target.value }))}
                      placeholder="lowercase English, e.g. manager"
                      className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Display name</label>
                    <input
                      type="text"
                      value={form.displayName}
                      onChange={(e) => setForm((p) => Object.assign({}, p, { displayName: e.target.value }))}
                      placeholder="Shown in the console"
                      className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
                    />
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
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">Permissions</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 tabular-nums">{checked.size} selected</span>
                      <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          onChange={toggleAll}
                          className="w-4 h-4 accent-[#4338CA]"
                        />
                        Select all
                      </label>
                    </div>
                  </div>
                  <div className="mt-3 space-y-3">
                    {Object.keys(groups).map((resource) => {
                      const items = groups[resource];
                      const ids = items.map((p) => String(rowId(p)));
                      const groupAll = ids.every((id) => checked.has(id));
                      return (
                        <div key={resource} className="rounded-lg border border-slate-200 px-4 py-3">
                          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <input
                              type="checkbox"
                              checked={groupAll}
                              onChange={() => toggleGroup(resource)}
                              className="w-4 h-4 accent-[#4338CA]"
                            />
                            {resource}
                          </label>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {items.map((p) => {
                              const id = String(rowId(p));
                              return (
                                <label key={id} className="flex items-center gap-2 text-sm text-slate-600">
                                  <input
                                    type="checkbox"
                                    checked={checked.has(id)}
                                    onChange={() => toggleOne(id)}
                                    className="w-4 h-4 accent-[#4338CA]"
                                  />
                                  <span className="truncate">{p.name || p.key}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {permissions.length === 0 ? (
                      <p className="text-sm text-slate-400">No permissions have been created yet.</p>
                    ) : null}
                  </div>
                </div>
                {formError ? (
                  <p className="text-sm text-[#B91C1C] bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    {formError}
                  </p>
                ) : null}
              </div>
            )}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm rounded-lg font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || modalLoading}
                className="px-6 py-2.5 text-sm rounded-lg font-semibold bg-[#4338CA] text-white hover:bg-[#3730a3] hover:text-white transition-colors inline-flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save role
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}