import { ALL_MODULES } from '@/lib/modules';
import { ModuleCard } from '@/components/learn/ModuleCard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Learn' };

export default function LearnPage() {
  const senior    = ALL_MODULES.filter((m) => m.difficulty === 'Senior');
  const staff     = ALL_MODULES.filter((m) => m.difficulty === 'Staff');
  const reference = ALL_MODULES.filter((m) => m.difficulty === 'Reference');

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Learning Modules</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {ALL_MODULES.length} curated modules — system design + quick-reference guides.
        </p>
      </div>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Senior Level</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {senior.map((m) => (
            <ModuleCard key={m.slug} module={m} href={`/learn/${m.slug}`} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Staff Level</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((m) => (
            <ModuleCard key={m.slug} module={m} href={`/learn/${m.slug}`} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Reference</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Crisp, scannable guides for concepts you want to look up fast.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reference.map((m) => (
            <ModuleCard key={m.slug} module={m} href={`/learn/${m.slug}`} />
          ))}
        </div>
      </section>
    </div>
  );
}
