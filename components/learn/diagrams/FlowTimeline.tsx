import clsx from 'clsx';
import { FlowTimelineData, NodeColor } from '@/types/visuals';

const STEP_COLORS: Record<NodeColor, { dot: string; border: string; badge: string }> = {
  violet:  { dot: 'bg-violet-500', border: 'border-violet-200 dark:border-violet-800', badge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' },
  blue:    { dot: 'bg-blue-500',   border: 'border-blue-200 dark:border-blue-800',     badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  emerald: { dot: 'bg-emerald-500',border: 'border-emerald-200 dark:border-emerald-800',badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
  amber:   { dot: 'bg-amber-500',  border: 'border-amber-200 dark:border-amber-800',   badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
  slate:   { dot: 'bg-slate-400',  border: 'border-slate-200 dark:border-slate-700',   badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
  rose:    { dot: 'bg-rose-500',   border: 'border-rose-200 dark:border-rose-800',     badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' },
};

interface StepRowProps {
  step: FlowTimelineData['steps'][number];
  index: number;
  isLast: boolean;
}

function StepRow({ step, index, isLast }: StepRowProps) {
  const c = STEP_COLORS[step.color ?? 'violet'];
  return (
    <div className="flex gap-3">
      {/* Timeline rail */}
      <div className="flex flex-col items-center flex-shrink-0 w-6">
        <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0', c.dot)}>
          {index + 1}
        </div>
        {!isLast && <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 my-1" />}
      </div>
      {/* Content */}
      <div className={clsx('flex-1 pb-4 border-b last:border-0', c.border)}>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">{step.label}</p>
        {step.detail && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{step.detail}</p>
        )}
        {/* Branch steps */}
        {step.branch && step.branch.length > 0 && (
          <div className="mt-2 ml-3 pl-3 border-l-2 border-dashed border-slate-300 dark:border-slate-600 space-y-1.5">
            {step.branch.map((b, bi) => {
              const bc = STEP_COLORS[b.color ?? 'slate'];
              return (
                <div key={bi} className="flex items-start gap-2">
                  <span className={clsx('mt-0.5 w-2 h-2 rounded-full flex-shrink-0', bc.dot)} />
                  <div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{b.label}</p>
                    {b.detail && <p className="text-[11px] text-slate-400 mt-0.5">{b.detail}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function FlowTimeline({ data }: { data: FlowTimelineData }) {
  return (
    <div className="my-4 p-4 rounded-xl border border-surface-border bg-surface-card">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">{data.title}</p>
      <div className="space-y-0">
        {data.steps.map((step, i) => (
          <StepRow key={i} step={step} index={i} isLast={i === data.steps.length - 1} />
        ))}
      </div>
    </div>
  );
}
