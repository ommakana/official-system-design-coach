// Shown instantly while /interview/[slug] initialises.
export default function InterviewLoading() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border bg-surface-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-3 w-14 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
        <div className="h-7 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Chat area */}
      <div className="flex-1 px-5 py-5 space-y-4">
        {/* AI opening message skeleton */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
          <div className="space-y-2 max-w-[70%]">
            <div className="h-4 w-72 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-56 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="px-5 py-4 border-t border-surface-border bg-surface-card flex-shrink-0">
        <div className="flex gap-3">
          <div className="flex-1 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="w-11 h-11 rounded-xl bg-violet-200 dark:bg-violet-900/40 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}
