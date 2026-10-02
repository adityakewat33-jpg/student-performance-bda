import { useMemo } from 'react';
import { Clock, Users, Check, X } from 'lucide-react';
import { useDatasetStore } from '../store/datasetStore';
import { computeAnalytics } from '../data/analytics';
import {
  Bar,
  Doughnut,
  Scatter,
  baseOptions,
  INDIGO_SOFT,
  TEAL_SOFT,
  GREEN,
  RED,
} from '../components/charts';
import ChartCard from '../components/ChartCard';
import EmptyDatasetPrompt from '../components/EmptyDatasetPrompt';
import { ChartSkeleton, StatSkeletonGrid } from '../components/Skeletons';
import StatCard from '../components/StatCard';
export default function StudentAnalysis() {
  const students = useDatasetStore((s) => s.students);
  const loading = useDatasetStore((s) => s.loading);
  const a = useMemo(() => computeAnalytics(students), [students]);
  const subjectData = {
    labels: a.subjectAverages.map((s) => s.label),
    datasets: [
      {
        label: 'Average marks',
        data: a.subjectAverages.map((s) => s.avg),
        backgroundColor: INDIGO_SOFT,
        hoverBackgroundColor: '#4338CA',
        borderRadius: 6,
        maxBarThickness: 64,
      },
    ],
  };
  const barOptions = baseOptions({
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1E1B4B', titleColor: '#FFFFFF', bodyColor: '#E0E7FF', padding: 12, cornerRadius: 8 },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#64748b' } },
      y: { beginAtZero: true, max: 100, grid: { color: '#E2E8F0' }, border: { display: false }, ticks: { color: '#64748b', stepSize: 20 } },
    },
  });
  const genderData = {
    labels: a.gender.map((g) => g.gender),
    datasets: [
      {
        label: 'Average marks',
        data: a.gender.map((g) => g.avgMarks),
        backgroundColor: INDIGO_SOFT,
        hoverBackgroundColor: '#4338CA',
        borderRadius: 6,
        maxBarThickness: 52,
      },
      {
        label: 'Pass percentage',
        data: a.gender.map((g) => g.passPct),
        backgroundColor: TEAL_SOFT,
        hoverBackgroundColor: '#0E7490',
        borderRadius: 6,
        maxBarThickness: 52,
      },
    ],
  };
  const genderOptions = baseOptions({
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 16, color: '#475569' },
      },
      tooltip: { backgroundColor: '#1E1B4B', titleColor: '#FFFFFF', bodyColor: '#E0E7FF', padding: 12, cornerRadius: 8 },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#64748b' } },
      y: { beginAtZero: true, max: 100, grid: { color: '#E2E8F0' }, border: { display: false }, ticks: { color: '#64748b', stepSize: 20 } },
    },
  });
  const resultData = {
    labels: ['Pass', 'Fail'],
    datasets: [
      {
        data: [a.passCount, a.failCount],
        backgroundColor: [GREEN, RED],
        hoverOffset: 6,
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    ],
  };
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: { display: true, position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 16, color: '#475569' } },
      tooltip: { backgroundColor: '#1E1B4B', titleColor: '#FFFFFF', bodyColor: '#E0E7FF', padding: 12, cornerRadius: 8 },
    },
  };
  const scatterData = {
    datasets: [
      {
        label: 'Pass',
        data: a.scatterPass,
        backgroundColor: 'rgba(21, 128, 61, 0.55)',
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Fail',
        data: a.scatterFail,
        backgroundColor: 'rgba(185, 28, 28, 0.6)',
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };
  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 16, color: '#475569' } },
      tooltip: {
        backgroundColor: '#1E1B4B',
        titleColor: '#FFFFFF',
        bodyColor: '#E0E7FF',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => 'Attendance ' + ctx.parsed.x + '% · Marks ' + ctx.parsed.y,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Attendance (%)', color: '#64748b' },
        min: 40,
        max: 100,
        grid: { color: '#E2E8F0' },
        border: { display: false },
        ticks: { color: '#64748b' },
      },
      y: {
        title: { display: true, text: 'Overall marks', color: '#64748b' },
        beginAtZero: true,
        max: 100,
        grid: { color: '#E2E8F0' },
        border: { display: false },
        ticks: { color: '#64748b', stepSize: 20 },
      },
    },
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-10 pb-16">
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Analysis</p>
        <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Student Analysis</h2>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          Breakdown of the dataset by subject, gender, performance group and attendance. Every number below is
          recomputed from the records currently loaded.
        </p>
      </header>

      {!loading && students.length === 0 ? (
        <EmptyDatasetPrompt title="Awaiting Dataset for Student Analysis" pageName="Student Analysis" />
      ) : (
        <>
          <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <ChartCard label="Aggregation" title="Subject-wise Average Marks" description="Which subject needs the most attention.">
              <Bar data={subjectData} options={barOptions} />
            </ChartCard>
            <ChartCard
              label="Comparison"
              title="Gender-wise Performance"
              description={
                a.gender.map((g) => g.gender + ': ' + g.count + ' students').join(' · ')
              }
            >
              <Bar data={genderData} options={genderOptions} />
            </ChartCard>
          </>
        )}
      </section>
      {/* Gender numeric summary — quiet strip */}
      {!loading ? (
        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {a.gender.map((g) => (
            <div key={g.gender} className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#4338CA]" />
                  <span className="text-sm font-semibold text-slate-900">{g.gender}</span>
                </div>
                <span className="text-xs text-slate-500 tabular-nums">{g.count.toLocaleString('en-US')} students</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-slate-500">Avg marks</p>
                  <p className="text-xl font-semibold text-slate-900 tabular-nums">{g.avgMarks}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pass %</p>
                  <p className="text-xl font-semibold text-[#15803D] tabular-nums">{g.passPct}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Avg attendance</p>
                  <p className="text-xl font-semibold text-[#0E7490] tabular-nums">{g.avgAttendance}</p>
                </div>
              </div>
            </div>
          ))}
        </section>
      ) : null}
      <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <ChartCard label="Grouping" title="Pass / Fail Distribution" description="Result split across the whole dataset.">
              <Doughnut data={resultData} options={doughnutOptions} />
            </ChartCard>
            <ChartCard
              label="Correlation"
              title="Attendance vs Overall Marks"
              description="Each dot is one student. Points are sampled for smooth rendering on large datasets."
            >
              <Scatter data={scatterData} options={scatterOptions} />
            </ChartCard>
          </>
        )}
      </section>
      {/* Performance group summary — inverted/full-bleed style table */}
      <section className="mt-8">
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden text-white">
          <div className="px-5 py-4 border-b border-white/10">
            <p className="text-xs uppercase tracking-widest text-indigo-300 font-medium">Grouping</p>
            <h3 className="mt-1 text-base font-semibold tracking-tight">Performance Group Summary</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            {a.groups.map((g) => (
              <div key={g.key} className="px-5 py-5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                  <p className="text-sm font-medium text-slate-200">{g.label}</p>
                </div>
                <p className="mt-3 text-3xl font-semibold tabular-nums">{g.count.toLocaleString('en-US')}</p>
                <p className="mt-1 text-sm text-slate-400 tabular-nums">{g.pct}% of all students</p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: g.pct + '%', backgroundColor: g.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Attendance statistics */}
      <section className="mt-8">
        <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium mb-4">Attendance Statistics</p>
        {loading ? (
          <StatSkeletonGrid count={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard icon={Clock} label="Minimum" value={a.attendance.min} suffix="%" hint="Lowest attendance in dataset" tone="red" />
            <StatCard icon={Clock} label="Maximum" value={a.attendance.max} suffix="%" hint="Highest attendance in dataset" tone="green" />
            <StatCard icon={Clock} label="Average" value={a.attendance.avg} suffix="%" hint="Mean attendance" tone="teal" />
            <StatCard
              icon={X}
              label="Below 75%"
              value={a.attendance.below75.toLocaleString('en-US')}
              hint={a.total ? Math.round((a.attendance.below75 / a.total) * 1000) / 10 + '% of students at risk' : '—'}
              tone="red"
            />
          </div>
        )}
      </section>
      <section className="mt-8">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-5">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[#15803D] mt-0.5 shrink-0" />
            <p className="text-sm text-slate-600 leading-relaxed">
              Reading the charts: the subject with the lowest bar is the one the class struggles with most, the
              scatter plot shows that students with attendance below about 70% rarely cross 50 marks, and the
              students in the Poor group are the ones who need help first.
            </p>
          </div>
        </div>
      </section>
    </>
  )}
    </div>
  );
}