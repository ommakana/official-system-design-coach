import clsx from 'clsx';
import { ComponentTreeData, NodeColor, TreeNode } from '@/types/visuals';

const LABEL_COLORS: Record<NodeColor, string> = {
  violet:  'text-violet-700 dark:text-violet-300 font-semibold',
  blue:    'text-blue-700 dark:text-blue-300 font-semibold',
  emerald: 'text-emerald-700 dark:text-emerald-300 font-semibold',
  amber:   'text-amber-700 dark:text-amber-300 font-semibold',
  slate:   'text-slate-600 dark:text-slate-400',
  rose:    'text-rose-700 dark:text-rose-300 font-semibold',
};

function TreeRow({ node, depth, isLast }: { node: TreeNode; depth: number; isLast: boolean }) {
  const indent = depth * 16;
  const hasChildren = node.children && node.children.length > 0;
  const labelStyle = LABEL_COLORS[node.color ?? 'slate'];

  return (
    <div>
      <div className="flex items-baseline gap-1.5" style={{ paddingLeft: `${indent}px` }}>
        {depth > 0 && (
          <span className="text-slate-300 dark:text-slate-600 text-sm select-none flex-shrink-0">
            {isLast ? '└─' : '├─'}
          </span>
        )}
        <span className={clsx('text-sm font-mono', labelStyle)}>
          &lt;{node.label}&gt;
        </span>
        {node.note && (
          <span className="text-[11px] text-slate-400 italic ml-1">{node.note}</span>
        )}
      </div>
      {hasChildren && node.children!.map((child, i) => (
        <TreeRow
          key={i}
          node={child}
          depth={depth + 1}
          isLast={i === node.children!.length - 1}
        />
      ))}
    </div>
  );
}

export function ComponentTree({ data }: { data: ComponentTreeData }) {
  return (
    <div className="my-4 p-4 rounded-xl border border-surface-border bg-surface-card overflow-x-auto">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">{data.title}</p>
      <div className="font-mono text-sm space-y-0.5 min-w-[280px]">
        <TreeRow node={data.root} depth={0} isLast={true} />
      </div>
    </div>
  );
}
