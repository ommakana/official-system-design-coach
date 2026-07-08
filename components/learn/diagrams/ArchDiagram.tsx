import clsx from 'clsx';
import { ArchDiagramData, NodeColor } from '@/types/visuals';

const NODE_COLORS: Record<NodeColor, string> = {
  violet:  'bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-200',
  blue:    'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200',
  amber:   'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200',
  slate:   'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300',
  rose:    'bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200',
};

export function ArchDiagram({ data }: { data: ArchDiagramData }) {
  return (
    <div className="my-4 p-4 rounded-xl border border-surface-border bg-surface-card">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">{data.title}</p>
      <div className="flex flex-col items-center gap-0">
        {data.layers.map((layer, li) => (
          <div key={li} className="flex flex-col items-center w-full">
            {/* Arrow + edge label coming INTO this layer (skip for first) */}
            {li > 0 && (
              <div className="flex flex-col items-center my-1">
                {layer.edgeLabel && (
                  <span className="text-[10px] text-slate-400 italic mb-0.5">{layer.edgeLabel}</span>
                )}
                <svg width="14" height="20" viewBox="0 0 14 20" className="text-slate-400">
                  <line x1="7" y1="0" x2="7" y2="14" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3,2" />
                  <polygon points="7,20 3,12 11,12" fill="currentColor" />
                </svg>
              </div>
            )}
            {/* Nodes row */}
            <div className="flex flex-wrap justify-center gap-2 w-full">
              {layer.nodes.map((node, ni) => (
                <div
                  key={ni}
                  className={clsx(
                    'px-3 py-2 rounded-lg border text-center min-w-[100px] max-w-[180px]',
                    NODE_COLORS[node.color ?? 'slate'],
                  )}
                >
                  <p className="text-xs font-semibold leading-tight">{node.label}</p>
                  {node.sublabel && (
                    <p className="text-[10px] opacity-70 mt-0.5 leading-tight">{node.sublabel}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
