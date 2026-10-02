export default function ChartCard({ label, title, description, height, children, footer }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-colors duration-150 hover:border-indigo-300">
      <div className="px-5 py-4 border-b border-slate-100">
        {label ? (
          <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">{label}</p>
        ) : null}
        <h3 className="mt-1 text-base font-semibold text-slate-900 tracking-tight">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      <div className="px-4 py-5">
        <div style={{ height: height || 288 }}>{children}</div>
      </div>
      {footer ? (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-500">{footer}</div>
      ) : null}
    </div>
  );
}