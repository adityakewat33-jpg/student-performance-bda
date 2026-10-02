import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Loader2 } from 'lucide-react';
import { Student } from '../../../api/entities';
import { extractOne, formatDate, rowTimestamp } from '../../../data/paging';
import { SUBJECTS, performanceGroup, PERF_GROUPS } from '../../../data/analytics';
import { useDatasetStore } from '../../../store/datasetStore';
import Notice from '../../../components/Notice';
export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const refreshDb = useDatasetStore((s) => s.refreshDb);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await Student.get(id);
        if (alive) setRow(extractOne(res));
      } catch (err) {
        if (alive) setNotice({ type: 'error', message: err?.message || 'Could not load this record.' });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);
  const handleDelete = async () => {
    if (!row) return;
    if (!window.confirm('Delete the record for ' + row.name + '?')) return;
    try {
      await Student.delete(id);
      refreshDb();
      navigate('/admin/students');
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'Could not delete this record.' });
    }
  };
  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }
  if (!row) {
    return (
      <div className="max-w-3xl mx-auto">
        <Notice notice={notice} onClose={() => setNotice(null)} />
        <p className="text-sm text-slate-500">This student record could not be loaded.</p>
        <Link to="/admin/students" className="mt-4 inline-block text-sm font-medium text-[#4338CA]">
          Back to student records
        </Link>
      </div>
    );
  }
  const groupKey = performanceGroup(row.overallMarks);
  const group = PERF_GROUPS.find((g) => g.key === groupKey) || PERF_GROUPS[3];
  return (
    <div className="max-w-4xl mx-auto">
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <Link to="/admin/students" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#4338CA]">
        <ArrowLeft className="w-4 h-4" />
        Back to student records
      </Link>
      <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium tabular-nums">
              {row.studentId}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">{row.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {row.gender} · {row.age} years · saved {formatDate(rowTimestamp(row))}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={'/admin/students/' + id + '/edit'}
              className="px-4 py-2 text-sm rounded-lg font-medium border-2 border-[#4338CA] text-[#4338CA] hover:bg-indigo-50 transition-colors inline-flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-sm rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 hover:text-white transition-colors inline-flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-500">Overall marks</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">{row.overallMarks}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Result</p>
            <p
              className={
                'mt-1 text-2xl font-semibold ' + (row.result === 'Pass' ? 'text-[#15803D]' : 'text-[#B91C1C]')
              }
            >
              {row.result}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Attendance</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">{row.attendance}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Study hours</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">{row.studyHours}</p>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Subject marks</p>
          <div className="mt-4 space-y-4">
            {SUBJECTS.map((sub) => {
              const value = Number(row[sub.key]) || 0;
              const weak = value < 35;
              return (
                <div key={sub.key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 font-medium">{sub.label}</span>
                    <span className={'tabular-nums font-semibold ' + (weak ? 'text-[#B91C1C]' : 'text-slate-900')}>
                      {value} / 100
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: value + '%', backgroundColor: weak ? '#B91C1C' : '#4338CA' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-sm text-slate-600">
            Performance group:{' '}
            <span className="font-semibold" style={{ color: group.color }}>
              {group.label}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}