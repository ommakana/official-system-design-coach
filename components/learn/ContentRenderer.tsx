import { ReactNode, Fragment } from 'react';

// ── Inline parser: **bold**, `code`, plain text ───────────────────────────

function parseInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  // Match **bold** and `code` in one pass
  const re = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));

    if (m[0].startsWith('**')) {
      parts.push(
        <strong key={m.index} className="font-semibold text-slate-900 dark:text-white">
          {m[2]}
        </strong>
      );
    } else {
      parts.push(
        <code
          key={m.index}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400 text-[0.8em] font-mono"
        >
          {m[3]}
        </code>
      );
    }
    last = m.index + m[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// ── Block-level types ─────────────────────────────────────────────────────

type Block =
  | { kind: 'code';  lang: string; body: string }
  | { kind: 'table'; rows: string[][] }
  | { kind: 'list';  items: string[] }
  | { kind: 'hr' }
  | { kind: 'para';  text: string };

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];

  // Pull out fenced code blocks first so they're never touched by line logic
  const segments = content.split(/(```[\s\S]*?```)/g);

  for (const seg of segments) {
    if (seg.startsWith('```')) {
      const inner = seg.slice(3, -3);
      const nl = inner.indexOf('\n');
      const lang = nl === -1 ? inner.trim() : inner.slice(0, nl).trim();
      const body = nl === -1 ? '' : inner.slice(nl + 1).trimEnd();
      blocks.push({ kind: 'code', lang, body });
      continue;
    }

    // Process remaining text line-by-line
    const lines = seg.split('\n');
    let i = 0;

    while (i < lines.length) {
      const raw = lines[i];
      const line = raw.trim();

      if (!line) { i++; continue; }

      // Horizontal rule
      if (line === '---') {
        blocks.push({ kind: 'hr' });
        i++;
        continue;
      }

      // Table — line has leading |
      if (line.startsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }
        // Skip separator row (|---|---|)
        const rows = tableLines
          .filter((l) => !/^\|[-| :]+\|$/.test(l))
          .map((l) =>
            l
              .replace(/^\|/, '')
              .replace(/\|$/, '')
              .split('|')
              .map((c) => c.trim())
          );
        if (rows.length) blocks.push({ kind: 'table', rows });
        continue;
      }

      // Bullet list
      if (line.startsWith('- ')) {
        const items: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('- ')) {
          items.push(lines[i].trim().slice(2));
          i++;
        }
        blocks.push({ kind: 'list', items });
        continue;
      }

      // Paragraph — collect consecutive non-special lines
      const paraLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].trim().startsWith('- ') &&
        !lines[i].trim().startsWith('|') &&
        lines[i].trim() !== '---'
      ) {
        paraLines.push(lines[i].trim());
        i++;
      }
      if (paraLines.length) {
        blocks.push({ kind: 'para', text: paraLines.join('\n') });
      }
    }
  }

  return blocks;
}

// ── Block renderers ───────────────────────────────────────────────────────

function CodeBlock({ lang, body }: { lang: string; body: string }) {
  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      {lang && (
        <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-400 border-b border-slate-200 dark:border-slate-700">
          {lang}
        </div>
      )}
      <pre className="px-4 py-3 bg-slate-50 dark:bg-slate-900 overflow-x-auto text-xs leading-relaxed font-mono text-slate-800 dark:text-slate-200">
        <code>{body}</code>
      </pre>
    </div>
  );
}

function TableBlock({ rows }: { rows: string[][] }) {
  const [head, ...body] = rows;
  return (
    <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full text-sm">
        {head && (
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              {head.map((cell, i) => (
                <th
                  key={i}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap"
                >
                  {parseInline(cell)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {body.map((row, ri) => (
            <tr key={ri} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2.5 text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListBlock({ items, isReference }: { items: string[]; isReference: boolean }) {
  return (
    <ul className="my-2 space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
          <span
            className={`mt-[5px] w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              isReference
                ? 'bg-emerald-500'
                : 'bg-violet-400'
            }`}
          />
          <span className="leading-relaxed">{parseInline(item)}</span>
        </li>
      ))}
    </ul>
  );
}

function ParaBlock({ text }: { text: string }) {
  // Lines starting with → get callout treatment
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 my-2">
      {lines.map((line, i) => {
        if (line.startsWith('→')) {
          return (
            <div
              key={i}
              className="flex items-start gap-2 text-sm pl-3 border-l-2 border-emerald-400 text-emerald-700 dark:text-emerald-400"
            >
              <span className="leading-relaxed">{parseInline(line.slice(1).trim())}</span>
            </div>
          );
        }
        return (
          <p key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {parseInline(line)}
          </p>
        );
      })}
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────

interface ContentRendererProps {
  content: string;
  isReference?: boolean;
}

export function ContentRenderer({ content, isReference = false }: ContentRendererProps) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-1">
      {blocks.map((block, i) => (
        <Fragment key={i}>
          {block.kind === 'code'  && <CodeBlock lang={block.lang} body={block.body} />}
          {block.kind === 'table' && <TableBlock rows={block.rows} />}
          {block.kind === 'list'  && <ListBlock items={block.items} isReference={isReference} />}
          {block.kind === 'hr'    && <hr className="my-4 border-surface-border" />}
          {block.kind === 'para'  && <ParaBlock text={block.text} />}
        </Fragment>
      ))}
    </div>
  );
}
