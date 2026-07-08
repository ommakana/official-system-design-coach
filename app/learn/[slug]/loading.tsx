// Shown instantly while /learn/[slug] page data is being resolved.
// Matches the real page layout so there's zero layout shift on load.
export default function LearnModuleLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 animate-pulse">
      {/* Back link skeleton */}
      <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />

      {/* Header block */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-14 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-5 w-10 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-9 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-9 w-36 rounded-xl bg-violet-200 dark:bg-violet-900/40" />
      </div>

      {/* Section nav pills */}
      <div className="flex flex-wrap gap-2">
        {[80, 110, 95, 120, 70, 100, 85].map((w, i) => (
          <div key={i} className="h-7 rounded-full bg-slate-200 dark:bg-slate-800" style={{ width: w }} />
        ))}
      </div>

      {/* Section blocks */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-px w-full bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-4/6 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
