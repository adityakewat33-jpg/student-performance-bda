import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, List, Upload, Award, Loader2 } from 'lucide-react';
import { Student, ImportLog, User } from '../../api/entities';
import { extractPage, formatDate, rowTimestamp, rowId } from '../../data/paging';
import { useDatasetStore } from '../../store/datasetStore';
import { computeAnalytics } from '../../data/analytics';
import StatCard from '../../components/StatCard';
import { StatSkeletonGrid, TableSkeleton } from '../../components/Skeletons';
export default function Dashboard() {
  const students = useDatasetStore((s) => s.students);
  const analytics = useMemo(() => computeAnalytics(students), [students]);
  const [counts, setCounts] = useState({ students: 0, imports: 0, users: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [sRes, iRes, uRes] = await Promise.all([
          Student.paging({ page: 1, limit: 1, filter: { search: '' } }),
          ImportLog.paging({ page: 1, limit: 5, sort: '-created_at', filter: { search: '' } }),
          User.paging({ page: 1, limit: 1, filter: { search: '' } }),
        ]);
        if (!alive) return;
        const sPage = extractPage(sRes);
        const iPage = extractPage(iRes);
        const uPage = extractPage(uRes);
        setCounts({ students: sPage.total, imports: iPage.total, users: uPage.total });
        setRecent(iPage.rows);
      } catch (err) {
        if (alive) setError(err?.message || 'Could not load the admin summary.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  return (
    <div className="max-w-7xl mx-auto">
      <header>
        <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Overview</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h2>
        <p className="mt-2 text-sm text-slate-600">
          Saved records, CSV import history and the active analysis dataset.
        </p>
      </header>
      <section className="mt-6">
        {loading ? (
          <StatSkeletonGrid count={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard icon={List} label="Saved records" value={counts.students.toLocaleString('en-US')} hint="Rows stored in the database" />
            <StatCard icon={Users} label="Active dataset" value={analytics.total.toLocaleString('en-US')} hint="Generated or imported + saved" tone="teal" />
            <StatCard icon={Upload} label="CSV imports" value={counts.imports.toLocaleString('en-US')} hint="Recorded in import history" />
            <StatCard icon={Award} label="Console users" value={counts.users.toLocaleString('en-US')} hint="Accounts with console access" tone="green" />
          </div>
        )}
      </section>
      {error ? (
        <p className="mt-6 text-sm text-[#B91C1C] bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      ) : null}
      <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          {loading ? (
            <TableSkeleton rows={4} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900 tracking-tight">Recent CSV imports</h3>
                <Link to="/admin/upload" className="text-sm font-medium text-[#4338CA] hover:text-[#3730a3]">
                  Upload
                </Link>
              </div>
              {recent.length === 0 ? (
                <p className="px-5 py-8 text-sm text-slate-500 text-center">No imports recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-3 font-medium">File</th>
                        <th className="px-5 py-3 font-medium text-right">Imported</th>
                        <th className="px-5 py-3 font-medium text-right">Cleaned</th>
                        <th className="px-5 py-3 font-medium text-right">Skipped</th>
                        <th className="px-5 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((row) => (
                        <tr key={rowId(row)} className="border-t border-slate-100">
                          <td className="px-5 py-3 text-slate-800 max-w-[220px] truncate">{row.fileName}</td>
                          <td className="px-5 py-3 text-right tabular-nums text-[#15803D] font-medium">
                            {Number(row.importedRows || 0).toLocaleString('en-US')}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                            {Number(row.cleanedRows || 0).toLocaleString('en-US')}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-[#B91C1C]">
                            {Number(row.skippedRows || 0).toLocaleString('en-US')}
                          </td>
                          <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                            {formatDate(rowTimestamp(row))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-5">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">Quick actions</h3>
            <div className="mt-4 space-y-2">
              <Link
                to="/admin/students"
                className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 hover:border-indigo-300 hover:text-[#4338CA] transition-colors"
              >
                <List className="w-4 h-4" />
                Manage student records
              </Link>
              <Link
                to="/admin/upload"
                className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 hover:border-indigo-300 hover:text-[#4338CA] transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload a CSV dataset
              </Link>
              <Link
                to="/admin/users"
                className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 hover:border-indigo-300 hover:text-[#4338CA] transition-colors"
              >
                <Users className="w-4 h-4" />
                Users and roles
              </Link>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-5">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">Current dataset</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Average marks</dt>
                <dd className="tabular-nums font-medium text-slate-900">{analytics.avgMarks}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Average attendance</dt>
                <dd className="tabular-nums font-medium text-slate-900">{analytics.avgAttendance}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Pass percentage</dt>
                <dd className="tabular-nums font-medium text-[#15803D]">{analytics.passPct}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Below 75% attendance</dt>
                <dd className="tabular-nums font-medium text-[#B91C1C]">{analytics.attendance.below75}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
}