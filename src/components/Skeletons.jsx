export function SkeletonBlock({ className }) {
  return <div className={'animate-pulse rounded-lg bg-slate-200/70 ' + (className || 'h-4 w-full')} />;
}
export function StatSkeletonGrid({ count }) {
  const items = Array.from({ length: count || 5 });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
      {items.map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-200/70 animate-pulse shrink-0" />
            <div className="flex-1 space-y-3">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-7 w-24" />
              <SkeletonBlock className="h-3 w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
export function ChartSkeleton({ height }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="h-5 w-48 mt-3" />
      <div
        className="mt-6 animate-pulse rounded-lg bg-slate-200/60"
        style={{ height: height || 240 }}
      />
    </div>
  );
}
export function TableSkeleton({ rows }) {
  const items = Array.from({ length: rows || 6 });
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
      <SkeletonBlock className="h-4 w-40" />
      {items.map((_, i) => (
        <SkeletonBlock key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}