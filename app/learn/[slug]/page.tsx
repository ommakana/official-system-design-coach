import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getModule, ALL_MODULES } from '@/lib/modules';
import { ModuleSection } from '@/types';
import { ArrowLeft, Clock, Building2, Play } from 'lucide-react';
import type { Metadata } from 'next';
import clsx from 'clsx';

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return ALL_MODULES.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const m = getModule(slug);
  return { title: m?.title ?? 'Module' };
}

function SectionBlock({ section }: { section: ModuleSection }) {
  return (
    <div id={section.id} className="scroll-mt-6">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3 pb-2 border-b border-surface-border">
        {section.title}
      </h2>
      <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
        {section.content}
      </div>
    </div>
  );
}

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;
  const module = getModule(slug);
  if (!module) notFound();

  const DIFFICULTY_STYLES = {
    Senior: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    Staff:  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Back */}
      <Link href="/learn" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-500 transition-colors">
        <ArrowLeft size={14} /> All Modules
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className={clsx('px-2.5 py-0.5 rounded text-xs font-semibold', DIFFICULTY_STYLES[module.difficulty])}>
            {module.difficulty}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock size={11} /> {module.estimatedMinutes}m
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Building2 size={11} /> {module.companies.join(', ')}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{module.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{module.description}</p>
        <Link
          href={`/interview/${module.slug}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <Play size={14} /> Practice Interview
        </Link>
      </div>

      {/* Section nav */}
      <nav className="flex flex-wrap gap-2" aria-label="Section navigation">
        {module.sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="text-xs px-3 py-1.5 rounded-full border border-surface-border text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-400 transition-colors"
          >
            {s.title}
          </a>
        ))}
      </nav>

      {/* Sections */}
      <div className="space-y-8">
        {module.sections.map((s) => (
          <SectionBlock key={s.id} section={s} />
        ))}
      </div>
    </div>
  );
}
