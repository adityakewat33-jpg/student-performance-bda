export default function StatCard({ icon: Icon, label, value, suffix, hint, tone }) {
  const toneClass =
    tone === 'green'
      ? 'bg-green-50 text-[#15803D]'
      : tone === 'red'
      ? 'bg-red-50 text-[#B91C1C]'
      : tone === 'teal'
      ? 'bg-cyan-50 text-[#0E7490]'
      : 'bg-indigo-50 text-[#4338CA]';
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-5 transition-colors duration-150 hover:border-indigo-300">
      <div className="flex items-start gap-4">
        <div className={'w-12 h-12 rounded-full flex items-center justify-center shrink-0 ' + toneClass}>
          {Icon ? <Icon className="w-5 h-5" /> : null}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 tabular-nums leading-none">
            {value}
            {suffix ? <span className="text-base font-medium text-slate-500 ml-1">{suffix}</span> : null}
          </p>
          {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}