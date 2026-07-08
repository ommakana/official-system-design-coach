import { ALL_MODULES } from '@/lib/modules';
import { ModuleCard } from '@/components/learn/ModuleCard';
import type { Metadata } from 'next';
import { Mic } from 'lucide-react';

export const metadata: Metadata = { title: 'Interview' };

export default function InterviewPickerPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
          <Mic size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Start an Interview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
            Pick a design problem. The AI becomes your interviewer — asks questions, challenges assumptions,
            and scores you on 8 dimensions at the end.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_MODULES.map((m) => (
          <ModuleCard key={m.slug} module={m} href={`/interview/${m.slug}`} />
        ))}
      </div>
    </div>
  );
}
