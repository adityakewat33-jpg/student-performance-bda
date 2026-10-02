export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12 px-6">
      {Icon ? (
        <div className="w-14 h-14 rounded-full bg-indigo-50 text-[#4338CA] flex items-center justify-center mx-auto mb-4">
          <Icon className="w-6 h-6" />
        </div>
      ) : null}
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}