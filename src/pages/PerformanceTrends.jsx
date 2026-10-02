import { useMemo } from 'react';
import { useDatasetStore } from '../store/datasetStore';
import { computeAnalytics } from '../data/analytics';
import { Line, Bar, Scatter, baseOptions, INDIGO_SOFT, TEAL_SOFT } from '../components/charts';
import ChartCard from '../components/ChartCard';
import EmptyDatasetPrompt from '../components/EmptyDatasetPrompt';
import { ChartSkeleton } from '../components/Skeletons';
export default function PerformanceTrends() {
  const students = useDatasetStore((s) => s.students);
  const loading = useDatasetStore((s) => s.loading);
  const a = useMemo(() => computeAnalytics(students), [students]);
  const lineOptions = baseOptions({
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1E1B4B', titleColor: '#FFFFFF', bodyColor: '#E0E7FF', padding: 12, cornerRadius: 8 },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#64748b', maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
      y: { beginAtZero: true, max: 100, grid: { color: '#E2E8F0' }, border: { display: false }, ticks: { color: '#64748b', stepSize: 20 } },
    },
  });
  const batchData = {
    labels: a.batches.map((b) => b.label),
    datasets: [
      {
        label: 'Average marks',
        data: a.batches.map((b) => b.avg),
        borderColor: '#4338CA',
        backgroundColor: 'rgba(67, 56, 202, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#4338CA',
      },
    ],
  };
  const ageData = {
    labels: a.ageGroups.map((g) => g.age + ' yrs'),
    datasets: [
      {
        label: 'Average marks',
        data: a.ageGroups.map((g) => g.avg),
        borderColor: '#0E7490',
        backgroundColor: 'rgba(14, 116, 144, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#0E7490',
      },
    ],
  };
  const studyData = {
    labels: a.studyBuckets.map((b) => b.label),
    datasets: [
      {
        label: 'Average marks',
        data: a.studyBuckets.map((b) => b.avg),
        backgroundColor: TEAL_SOFT,
        hoverBackgroundColor: '#0E7490',
        borderRadius: 6,
        maxBarThickness: 64,
      },
    ],
  };
  const studyOptions = baseOptions({
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E1B4B',
        titleColor: '#FFFFFF',
        bodyColor: '#E0E7FF',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          afterLabel: (ctx) => {
            const bucket = a.studyBuckets[ctx.dataIndex];
            return bucket ? bucket.count.toLocaleString('en-US') + ' students' : '';
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#64748b' } },
      y: { beginAtZero: true, max: 100, grid: { color: '#E2E8F0' }, border: { display: false }, ticks: { color: '#64748b', stepSize: 20 } },
    },
  });
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
        callbacks: { label: (ctx) => 'Attendance ' + ctx.parsed.x + '% · Marks ' + ctx.parsed.y },
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
        <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Trends</p>
        <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Performance Trends</h2>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          How average marks move across student batches, across age groups and across study hour ranges. This
          is the grouping stage of the pipeline — records are bucketed first, then averaged inside each bucket.
        </p>
      </header>

      {!loading && students.length === 0 ? (
        <EmptyDatasetPrompt title="Awaiting Dataset for Performance Trends" pageName="Performance Trends" />
      ) : (
        <>
          <section className="mt-8 space-y-4 md:space-y-6">
        {loading ? (
          <ChartSkeleton height={280} />
        ) : (
          <ChartCard
            label="Batch trend"
            title="Average Marks by Student Batch"
            description="Students sorted by Student_ID and split into groups of 100."
            height={300}
            footer={a.batches.length + ' batches · chunk size ' + (a.batches[0] ? a.batches[0].count : 0)}
          >
            <Line data={batchData} options={lineOptions} />
          </ChartCard>
        )}
      </section>
      <section className="mt-4 md:mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <ChartCard label="Age trend" title="Average Marks by Age Group" description="Mean overall marks for each age present in the dataset.">
              <Line data={ageData} options={lineOptions} />
            </ChartCard>
            <ChartCard
              label="Study habit"
              title="Study Hours vs Average Marks"
              description="Students grouped into 1-2, 3-4, 5-6 and 7-8 hour ranges."
            >
              <Bar data={studyData} options={studyOptions} />
            </ChartCard>
          </>
        )}
      </section>
      <section className="mt-4 md:mt-6">
        {loading ? (
          <ChartSkeleton height={300} />
        ) : (
          <ChartCard
            label="Correlation"
            title="Attendance vs Overall Marks"
            description="The upward cloud shows that higher attendance usually means higher marks."
            height={320}
          >
            <Scatter data={scatterData} options={scatterOptions} />
          </ChartCard>
        )}
      </section>
      {!loading ? (
        <section className="mt-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Table view</p>
              <h3 className="mt-1 text-base font-semibold text-slate-900 tracking-tight">Study Hour Ranges</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3 font-medium">Range</th>
                    <th className="px-5 py-3 font-medium text-right">Students</th>
                    <th className="px-5 py-3 font-medium text-right">Average marks</th>
                    <th className="px-5 py-3 font-medium text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {a.studyBuckets.map((b) => (
                    <tr key={b.label} className="border-t border-slate-100 hover:bg-indigo-50/40 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-700">{b.label}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700">{b.count.toLocaleString('en-US')}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold text-slate-900">{b.avg}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-500">
                        {a.total ? Math.round((b.count / a.total) * 1000) / 10 : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
    </>
  )}
</div>
);
}