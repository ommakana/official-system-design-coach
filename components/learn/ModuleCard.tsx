import clsx from 'clsx';
import { DesignModule } from '@/types';
import Link from 'next/link';
import { Clock, Building2, ArrowRight } from 'lucide-react';

interface ModuleCardProps {
  module: DesignModule;
  completed?: boolean;
  href: string;
}

const DIFFICULTY_STYLES = {
  Senior: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Staff:  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
};

export function ModuleCard({ module, completed, href }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className={clsx(
        'group relative flex flex-col gap-3 p-5 rounded-xl border transition-colors duration-200',
        'bg-surface-card border-surface-border',
        'hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5',
        completed && 'ring-1 ring-violet-500/30',
      )}
    >
      {completed && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-violet-500" title="Completed" />
      )}

      {/* Difficulty + time */}
      <div className="flex items-center gap-2">
        <span className={clsx('px-2 py-0.5 rounded text-xs font-semibold', DIFFICULTY_STYLES[module.difficulty])}>
          {module.difficulty}
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <Clock size={11} />
          {module.estimatedMinutes}m
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors leading-snug">
        {module.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed flex-1">
        {module.description}
      </p>

      {/* Companies */}
      <div className="flex items-center gap-1 text-xs text-slate-400 mt-auto">
        <Building2 size={11} />
        <span className="truncate">{module.companies.slice(0, 3).join(', ')}</span>
      </div>

      {/* Hover arrow */}
      <ArrowRight
        size={14}
        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 text-violet-400 transition-all -translate-x-1 group-hover:translate-x-0"
      />
    </Link>
  );
}
