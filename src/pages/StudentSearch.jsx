import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Check, X, Clock, BookOpen, Award } from 'lucide-react';
import { useDatasetStore } from '../store/datasetStore';
import { performanceGroup, PERF_GROUPS, SUBJECTS } from '../data/analytics';
import EmptyState from '../components/EmptyState';
import EmptyDatasetPrompt from '../components/EmptyDatasetPrompt';
import { TableSkeleton } from '../components/Skeletons';
function groupMeta(key) {
  return PERF_GROUPS.find((g) => g.key === key) || PERF_GROUPS[3];
}
export default function StudentSearch() {
  const students = useDatasetStore((s) => s.students);
  const loading = useDatasetStore((s) => s.loading);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const isComposingRef = useRef(false);
  useEffect(() => {
    if (isComposingRef.current) return undefined;
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    const out = [];
    for (let i = 0; i < students.length && out.length < 60; i += 1) {
      const s = students[i];
      if (
        String(s.studentId).toLowerCase().includes(term) ||
        String(s.name).toLowerCase().includes(term)
      ) {
        out.push(s);
      }
    }
    return out;
  }, [students, search]);
  useEffect(() => {
    if (results.length > 0) {
      const stillThere = results.some((r) => r.studentId === selectedId);
      if (!stillThere) setSelectedId(results[0].studentId);
    } else {
      setSelectedId('');
    }
  }, [results, selectedId]);
  const selected = useMemo(
    () => results.find((r) => r.studentId === selectedId) || null,
    [results, selectedId]
  );
  const group = selected ? groupMeta(performanceGroup(selected.overallMarks)) : null;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-10 pb-16">
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Lookup</p>
        <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Student Search</h2>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          Type a Student ID or a name. Partial matches work, and results update as you type.
        </p>
      </header>

      {!loading && students.length === 0 ? (
        <EmptyDatasetPrompt title="Awaiting Dataset for Student Search" pageName="Student Search" />
      ) : (
        <>
          <div role="form" aria-label="Search students" className="mt-6 max-w-2xl">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
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
            placeholder="Search by Student ID or name, e.g. STU0042 or Ananya"
            className="w-full pl-12 pr-4 py-3 text-base rounded-lg border border-slate-300 bg-white focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
          />
        </div>
        <p className="mt-2 text-xs text-slate-400 tabular-nums">
          {loading
            ? 'Preparing dataset…'
            : search.trim()
            ? results.length + ' match' + (results.length === 1 ? '' : 'es') + ' found'
            : students.length.toLocaleString('en-US') + ' records available'}
        </p>
      </div>
      {loading ? (
        <div className="mt-8">
          <TableSkeleton rows={5} />
        </div>
      ) : !search.trim() ? (
        <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon={Search}
            title="Start by typing a Student ID or name"
            description="For example try STU0100, or type a surname such as Sharma to see every matching student."
          />
        </div>
      ) : results.length === 0 ? (
        <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon={X}
            title="No student found"
            description={'Nothing in the dataset matches "' + search + '". Check the spelling, or try just a part of the ID such as STU01.'}
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Matches</p>
              </div>
              <ul className="max-h-[520px] overflow-y-auto divide-y divide-slate-100">
                {results.map((s) => {
                  const active = s.studentId === selectedId;
                  return (
                    <li key={s.studentId}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(s.studentId)}
                        className={
                          'w-full text-left px-5 py-3 transition-colors flex items-center justify-between gap-3 ' +
                          (active ? 'bg-indigo-50' : 'hover:bg-slate-50')
                        }
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-900 truncate">{s.name}</span>
                          <span className="block text-xs text-slate-500 tabular-nums">{s.studentId}</span>
                        </span>
                        <span
                          className={
                            'shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums ' +
                            (s.result === 'Pass' ? 'bg-green-50 text-[#15803D]' : 'bg-red-50 text-[#B91C1C]')
                          }
                        >
                          {s.overallMarks}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <div className="lg:col-span-3">
            {selected ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium tabular-nums">
                      {selected.studentId}
                    </p>
                    <h3 className="mt-1 text-2xl font-bold text-slate-900 tracking-tight truncate">{selected.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {selected.gender} · {selected.age} years
                    </p>
                  </div>
                  <span
                    className={
                      'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold ' +
                      (selected.result === 'Pass'
                        ? 'bg-green-50 text-[#15803D] border border-green-200'
                        : 'bg-red-50 text-[#B91C1C] border border-red-200')
                    }
                  >
                    {selected.result === 'Pass' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {selected.result}
                  </span>
                </div>
                <div className="px-6 py-5">
                  <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Subject marks</p>
                  <div className="mt-4 space-y-4">
                    {SUBJECTS.map((sub) => {
                      const value = Number(selected[sub.key]) || 0;
                      const weak = value < 35;
                      return (
                        <div key={sub.key}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-700 font-medium">{sub.label}</span>
                            <span
                              className={
                                'tabular-nums font-semibold ' + (weak ? 'text-[#B91C1C]' : 'text-slate-900')
                              }
                            >
                              {value}
                              <span className="text-xs text-slate-400 font-normal"> / 100</span>
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: value + '%',
                                backgroundColor: weak ? '#B91C1C' : '#4338CA',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="px-6 py-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Award className="w-3.5 h-3.5" />
                      Overall
                    </div>
                    <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">{selected.overallMarks}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      Attendance
                    </div>
                    <p
                      className={
                        'mt-1 text-2xl font-semibold tabular-nums ' +
                        (selected.attendance < 75 ? 'text-[#B91C1C]' : 'text-slate-900')
                      }
                    >
                      {selected.attendance}%
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <BookOpen className="w-3.5 h-3.5" />
                      Study hours
                    </div>
                    <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">{selected.studyHours}</p>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Group</div>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: group.color }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                      {group.key}
                    </p>
                  </div>
                </div>
                <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Rule used: a student passes when the overall average is 40 or above and every single subject
                    is at least 35. {selected.attendance < 75 ? 'Attendance is below the 75% requirement.' : 'Attendance meets the 75% requirement.'}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  )}
</div>
);
}