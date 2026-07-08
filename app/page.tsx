import Link from 'next/link';
import { ALL_MODULES } from '@/lib/modules';
import { BookOpen, MessageSquare, Zap, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  const totalModules = ALL_MODULES.length;
  const fullModules  = ALL_MODULES.filter((m) => m.sections.length > 3).length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      {/* Hero */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
          <Zap size={11} />
          Powered by Gemini 2.0 Flash
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
          Official System Design{' '}
          <span className="text-violet-500">Coach</span>
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
          Prepare for Senior and Staff frontend interviews at Google, Meta, Atlassian, Airbnb and more.
          Study curated modules, then go head-to-head with an AI interviewer.
        </p>
      </div>

      {/* CTA cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/learn"
          className="group flex flex-col gap-4 p-6 rounded-2xl border border-surface-border bg-surface-card hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/5 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <BookOpen size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white mb-1">Study Modules</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {totalModules} curated designs — {fullModules} with deep dives. Architecture, tradeoffs, interview tips.
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-violet-600 dark:text-violet-400 mt-auto">
            Browse all modules <ChevronRight size={14} />
          </div>
        </Link>

        <Link
          href="/interview"
          className="group flex flex-col gap-4 p-6 rounded-2xl border border-surface-border bg-surface-card hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/5 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white mb-1">AI Interview</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Pick a topic and go live. The AI challenges your assumptions, then scores you across 8 dimensions.
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-auto">
            Start an interview <ChevronRight size={14} />
          </div>
        </Link>
      </div>

      {/* Quick-start modules */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
          Popular Starting Points
        </h2>
        <div className="space-y-2">
          {ALL_MODULES.slice(0, 5).map((m) => (
            <div key={m.slug} className="flex items-center justify-between p-3 rounded-lg border border-surface-border bg-surface-card hover:border-violet-500/20 transition-colors">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{m.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{m.companies.slice(0, 3).join(' · ')}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/learn/${m.slug}`} className="text-xs px-3 py-1.5 rounded-lg border border-surface-border text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-400 transition-colors">
                  Study
                </Link>
                <Link href={`/interview/${m.slug}`} className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors">
                  Interview
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
