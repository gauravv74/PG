export default function SkeletonCard() {
  return (
    <div className="card flex gap-3 p-3">
      <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-100 shimmer sm:h-36 sm:w-40" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-3/4 rounded bg-slate-100" />
        <div className="h-3 w-1/2 rounded bg-slate-100" />
        <div className="flex gap-1.5">
          <div className="h-5 w-16 rounded-full bg-slate-100" />
          <div className="h-5 w-16 rounded-full bg-slate-100" />
        </div>
        <div className="h-3 w-2/3 rounded bg-slate-100" />
        <div className="mt-3 h-5 w-24 rounded bg-slate-100" />
      </div>
    </div>
  );
}
