import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Search, Loader2, RefreshCw } from 'lucide-react';
import { Student } from '../../../api/entities';
import { extractPage, rowId, rowTimestamp, formatDate } from '../../../data/paging';
import { useDatasetStore } from '../../../store/datasetStore';
import Notice from '../../../components/Notice';
const PAGE_SIZE = 20;
const SORTS = [
  { value: '-overallMarks', label: 'Overall marks (high to low)' },
  { value: 'overallMarks', label: 'Overall marks (low to high)' },
  { value: '-attendance', label: 'Attendance (high to low)' },
  { value: 'attendance', label: 'Attendance (low to high)' },
  { value: 'name', label: 'Name (A to Z)' },
  { value: '-name', label: 'Name (Z to A)' },
  { value: 'studentId', label: 'Student ID' },
];
export default function StudentList() {
  const navigate = useNavigate();
  const refreshDb = useDatasetStore((s) => s.refreshDb);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [result, setResult] = useState('');
  const [sort, setSort] = useState('-overallMarks');
  const isComposingRef = useRef(false);
  useEffect(() => {
    if (isComposingRef.current) return undefined;
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const fetchData = async (pageNum) => {
    setLoading(true);
    try {
      const filter = { search };
      if (gender) filter.gender = gender;
      if (result) filter.result = result;
      const res = await Student.paging({ page: pageNum, limit: PAGE_SIZE, filter, sort });
      const parsed = extractPage(res);
      setRows(parsed.rows);
      setTotal(parsed.total);
      setTotalPages(parsed.totalPages || 1);
      setPage(pageNum);
      setSelected([]);
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'Could not load student records.' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, gender, result, sort]);
  const toggleRow = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.concat(id)));
  };
  const toggleAll = () => {
    if (selected.length === rows.length) setSelected([]);
    else setSelected(rows.map((r) => rowId(r)));
  };
  const handleDelete = async (id, name) => {
    if (!window.confirm('Delete the record for ' + name + '? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await Student.delete(id);
      setNotice({ type: 'success', message: 'Student record deleted.' });
      await fetchData(page);
      refreshDb();
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'Could not delete the record.' });
    } finally {
      setDeleting(false);
    }
  };
  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm('Delete ' + selected.length + ' selected record(s)? This cannot be undone.')) return;
    setDeleting(true);
    try {
      if (typeof Student.deleteMany === 'function') {
        await Student.deleteMany(selected);
      } else {
        for (let i = 0; i < selected.length; i += 1) {
          await Student.delete(selected[i]);
        }
      }
      setNotice({ type: 'success', message: selected.length + ' record(s) deleted.' });
      await fetchData(1);
      refreshDb();
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'Could not delete the selected records.' });
    } finally {
      setDeleting(false);
    }
  };
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i += 1) pages.push(i);
    if (right < totalPages - 1) pages.push('…');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };
  const allChecked = rows.length > 0 && selected.length === rows.length;
  return (
    <div className="max-w-7xl mx-auto">
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Dataset</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">Student Records</h2>
          <p className="mt-2 text-sm text-slate-600 tabular-nums">
            {total.toLocaleString('en-US')} saved record{total === 1 ? '' : 's'} in the database
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
          <Link
            to="/admin/students/new"
            className="px-4 py-2 text-sm rounded-lg font-semibold bg-[#4338CA] text-white hover:bg-[#3730a3] hover:text-white transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create record
          </Link>
        </div>
      </header>
      <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
              placeholder="Search by Student ID or name"
              className="w-full pl-9 pr-4 py-2.5 text-base md:text-sm rounded-lg border border-slate-300 focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
            />
          </div>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-3 py-2.5 text-base md:text-sm rounded-lg border border-slate-300 bg-white focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
          >
            <option value="">All genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <select
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="w-full px-3 py-2.5 text-base md:text-sm rounded-lg border border-slate-300 bg-white focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
          >
            <option value="">All results</option>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 text-base md:text-sm rounded-lg border border-slate-300 bg-white focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setGender('');
              setResult('');
              setSort('-overallMarks');
            }}
            className="px-4 py-2 text-sm rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Clear filters
          </button>
          {selected.length > 0 ? (
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-slate-600 tabular-nums">{selected.length} selected</span>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 hover:text-white transition-colors inline-flex items-center gap-2 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete selected
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-500">No student records match the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      aria-label="Select all rows"
                      className="w-4 h-4 accent-[#4338CA]"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Student ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Gender</th>
                  <th className="px-4 py-3 font-medium text-right">Age</th>
                  <th className="px-4 py-3 font-medium text-right">Attendance</th>
                  <th className="px-4 py-3 font-medium text-right">Study hrs</th>
                  <th className="px-4 py-3 font-medium text-right">Math</th>
                  <th className="px-4 py-3 font-medium text-right">Physics</th>
                  <th className="px-4 py-3 font-medium text-right">Computer</th>
                  <th className="px-4 py-3 font-medium text-right">English</th>
                  <th className="px-4 py-3 font-medium text-right">Overall</th>
                  <th className="px-4 py-3 font-medium">Result</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const id = rowId(row);
                  return (
                    <tr key={id} className="border-t border-slate-100 hover:bg-indigo-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(id)}
                          onChange={() => toggleRow(id)}
                          aria-label={'Select ' + row.name}
                          className="w-4 h-4 accent-[#4338CA]"
                        />
                      </td>
                      <td className="px-4 py-3 tabular-nums font-medium text-slate-700">{row.studentId}</td>
                      <td className="px-4 py-3 text-slate-800">{row.name}</td>
                      <td className="px-4 py-3 text-slate-600">{row.gender}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.age}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.attendance}%</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.studyHours}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.mathematics}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.physics}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.computer}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.english}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                        {row.overallMarks}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            'px-2.5 py-1 rounded-full text-xs font-semibold ' +
                            (row.result === 'Pass' ? 'bg-green-50 text-[#15803D]' : 'bg-red-50 text-[#B91C1C]')
                          }
                        >
                          {row.result}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(rowTimestamp(row))}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => navigate('/admin/students/' + id)}
                            aria-label="View"
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate('/admin/students/' + id + '/edit')}
                            aria-label="Edit"
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#4338CA] hover:bg-indigo-50"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(id, row.name)}
                            disabled={deleting}
                            aria-label="Delete"
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#B91C1C] hover:bg-red-50 disabled:opacity-50"
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
          <div className="px-5 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-slate-500 tabular-nums">
              Page {page} of {totalPages} · {total.toLocaleString('en-US')} records
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fetchData(page - 1)}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:border-indigo-300 disabled:opacity-40"
              >
                Prev
              </button>
              {getPageNumbers().map((p, i) =>
                typeof p === 'number' ? (
                  <button
                    key={'p' + i}
                    type="button"
                    onClick={() => fetchData(p)}
                    disabled={loading}
                    className={
                      'min-w-[36px] px-2 py-1.5 text-sm rounded-lg border transition-colors ' +
                      (p === page
                        ? 'border-[#4338CA] bg-indigo-50 text-[#4338CA] font-semibold'
                        : 'border-slate-200 text-slate-600 hover:border-indigo-300')
                    }
                  >
                    {p}
                  </button>
                ) : (
                  <span key={'e' + i} className="px-1 text-slate-400">
                    …
                  </span>
                )
              )}
              <button
                type="button"
                onClick={() => fetchData(page + 1)}
                disabled={page >= totalPages || loading}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:border-indigo-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}