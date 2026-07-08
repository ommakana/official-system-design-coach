import clsx from 'clsx';
import { ComparisonPanelData, NodeColor } from '@/types/visuals';

const HEADER_COLORS: Record<NodeColor, string> = {
  violet:  'bg-violet-600 text-white',
  blue:    'bg-blue-600 text-white',
  emerald: 'bg-emerald-600 text-white',
  amber:   'bg-amber-500 text-white',
  slate:   'bg-slate-600 text-white',
  rose:    'bg-rose-600 text-white',
};

const BULLET_COLORS: Record<NodeColor, string> = {
  violet:  'bg-violet-400',
  blue:    'bg-blue-400',
  emerald: 'bg-emerald-400',
  amber:   'bg-amber-400',
  slate:   'bg-slate-400',
  rose:    'bg-rose-400',
};

export function ComparisonPanel({ data }: { data: ComparisonPanelData }) {
  return (
    <div className="my-4 rounded-xl border border-surface-border bg-surface-card overflow-hidden">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 pt-4 pb-3">{data.title}</p>
      <div className="grid grid-cols-2">
        {data.columns.map((col, ci) => (
          <div key={ci} className={clsx(ci === 0 ? 'border-r border-surface-border' : '')}>
            <div className={clsx('px-4 py-2.5 text-sm font-bold', HEADER_COLORS[col.color])}>
              {col.heading}
            </div>
            <ul className="px-4 py-3 space-y-2">
              {col.points.map((pt, pi) => (
                <li key={pi} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1', BULLET_COLORS[col.color])} />
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
