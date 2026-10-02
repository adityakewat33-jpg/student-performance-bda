import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Award, Clock, TrendingUp, Target, Check, X, UploadCloud } from 'lucide-react';
import { useDatasetStore } from '../store/datasetStore';
import { computeAnalytics } from '../data/analytics';
import { Bar, Doughnut, baseOptions, INDIGO_SOFT, TEAL_SOFT, GREEN, RED } from '../components/charts';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import InsightChat from '../components/InsightChat';
import EmptyDatasetPrompt from '../components/EmptyDatasetPrompt';
import { StatSkeletonGrid, ChartSkeleton, TableSkeleton } from '../components/Skeletons';
export default function Home() {
  const students = useDatasetStore((s) => s.students);
  const loading = useDatasetStore((s) => s.loading);
  const importMeta = useDatasetStore((s) => s.importMeta);
  const analytics = useMemo(() => computeAnalytics(students), [students]);
  const subjectData = {
    labels: analytics.subjectAverages.map((s) => s.label),
    datasets: [
      {
        label: 'Average marks',
        data: analytics.subjectAverages.map((s) => s.avg),
        backgroundColor: INDIGO_SOFT,
        hoverBackgroundColor: '#4338CA',
        borderRadius: 6,
        maxBarThickness: 64,
      },
    ],
  };
  const subjectOptions = baseOptions({
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E1B4B',
        titleColor: '#FFFFFF',
        bodyColor: '#E0E7FF',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#64748b' } },
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: '#E2E8F0' },
        border: { display: false },
        ticks: { color: '#64748b', stepSize: 20 },
      },
    },
  });
  const resultData = {
    labels: ['Pass', 'Fail'],
    datasets: [
      {
        data: [analytics.passCount, analytics.failCount],
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
      legend: {
        display: true,
        position: 'bottom',
        labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 16, color: '#475569' },
      },
      tooltip: {
        backgroundColor: '#1E1B4B',
        titleColor: '#FFFFFF',
        bodyColor: '#E0E7FF',
        padding: 12,
        cornerRadius: 8,
      },
    },
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-10 pb-16">
      {/* Mini hero — DOMINANT section */}
      <section className="w-full">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="w-full md:w-1/2 text-center md:text-left">
            <span className="inline-block text-xs uppercase tracking-widest text-indigo-700 font-medium">
              Big Data Analytics · Mini Project
            </span>
            <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
              Student Performance Analysis
            </h2>
            <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto md:mx-0">
              A CSV dataset is loaded, cleaned, aggregated and ranked entirely in the browser — the same five
              steps a real Big Data pipeline follows — and the result is this dashboard.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Link
                to="/upload"
                className="px-4 py-2 rounded-lg bg-[#4338CA] text-white text-xs font-semibold hover:bg-[#3730a3] transition-all shadow-sm inline-flex items-center gap-1.5 active:scale-95"
              >
                <UploadCloud className="w-4 h-4" />
                Upload Dataset
              </Link>
              <span className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-600 tabular-nums">
                {loading ? 'Loading dataset…' : analytics.total.toLocaleString('en-US') + ' student records'}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-600">
                {importMeta ? `Source: ${importMeta.fileName || 'Uploaded Dataset'}` : 'Source: Generated Sample Dataset'}
              </span>
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <img
                src="https://cdn.vibe-x.app/apps/d7ae1e35c4e83e7b4f62fe53/assets/original/hero-1-159731.png"
                alt="Blueprint style analytics dashboard banner"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {!loading && students.length === 0 ? (
        <EmptyDatasetPrompt title="Awaiting Dataset Ingestion" pageName="the Executive Dashboard" />
      ) : (
        <>
          {/* KPI cards — secondary */}
          <section className="mt-10 md:mt-14">
            <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium mb-4">Key Metrics</p>
        {loading ? (
          <StatSkeletonGrid count={5} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
            <StatCard icon={Users} label="Total Students" value={analytics.total.toLocaleString('en-US')} hint="Records in the active dataset" />
            <StatCard icon={Award} label="Average Marks" value={analytics.avgMarks} suffix="/ 100" hint="Mean of overall marks" tone="teal" />
            <StatCard icon={Clock} label="Average Attendance" value={analytics.avgAttendance} suffix="%" hint={analytics.attendance.below75 + ' students below 75%'} />
            <StatCard icon={TrendingUp} label="Pass Percentage" value={analytics.passPct} suffix="%" hint={analytics.passCount + ' pass / ' + analytics.failCount + ' fail'} tone="green" />
            <StatCard icon={Target} label="Highest Marks" value={analytics.highestMarks} suffix="/ 100" hint={analytics.top10[0] ? analytics.top10[0].name : '—'} tone="teal" />
          </div>
        )}
      </section>
      {/* Charts — secondary */}
      <section className="mt-8 md:mt-10 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <ChartCard
              label="Aggregation"
              title="Subject-wise Average Marks"
              description="Average score of every student in each of the four subjects."
            >
              <Bar data={subjectData} options={subjectOptions} />
            </ChartCard>
            <ChartCard
              label="Grouping"
              title="Pass / Fail Distribution"
              description="Pass requires overall marks of 40 or above and at least 35 in every subject."
            >
              <Doughnut data={resultData} options={doughnutOptions} />
            </ChartCard>
          </>
        )}
      </section>
      {/* Top 10 — quiet section */}
      <section className="mt-8 md:mt-10">
        {loading ? (
          <TableSkeleton rows={8} />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Ranking</p>
              <h3 className="mt-1 text-base font-semibold text-slate-900 tracking-tight">Top 10 Students</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3 font-medium">Rank</th>
                    <th className="px-5 py-3 font-medium">Student ID</th>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium text-right">Overall Marks</th>
                    <th className="px-5 py-3 font-medium text-right">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.top10.map((s, index) => (
                    <tr key={s.studentId} className="border-t border-slate-100 hover:bg-indigo-50/40 transition-colors">
                      <td className="px-5 py-3 tabular-nums text-slate-500">{index + 1}</td>
                      <td className="px-5 py-3 tabular-nums font-medium text-slate-700">{s.studentId}</td>
                      <td className="px-5 py-3 text-slate-800">{s.name}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold text-slate-900">
                        {s.overallMarks}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ' +
                            (s.result === 'Pass'
                              ? 'bg-green-50 text-[#15803D]'
                              : 'bg-red-50 text-[#B91C1C]')
                          }
                        >
                          {s.result === 'Pass' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {s.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
      {/* AI insight — accent section */}
      <section className="mt-8 md:mt-10">
        <InsightChat analytics={analytics} />
      </section>
      {/* Dataset note — quiet */}
      <section className="mt-8 md:mt-10">
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-5 py-5">
          <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Dataset Note</p>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            The default dataset contains 1,000 synthetic student records generated in the browser from a fixed
            random seed, so the numbers are identical every time the demo is opened. Marks are correlated with
            attendance and study hours with natural variation, and roughly 80–85% of students pass. Records
            saved in the admin panel override generated records with the same Student_ID, and a CSV upload
            replaces the generated set completely.
          </p>
        </div>
      </section>
    </>
  )}
    </div>
  );
}