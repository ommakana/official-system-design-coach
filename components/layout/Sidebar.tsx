'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, MessageSquare, Home, X, BookMarked } from 'lucide-react';
import clsx from 'clsx';
import { ALL_MODULES } from '@/lib/modules';

const NAV = [
  { href: '/',          label: 'Dashboard',  Icon: Home },
  { href: '/learn',     label: 'Learn',      Icon: BookOpen },
  { href: '/interview', label: 'Interview',  Icon: MessageSquare },
];

const REFERENCE_MODULES = ALL_MODULES.filter((m) => m.difficulty === 'Reference');

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full bg-surface-card border-r border-surface-border w-64">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
        <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold font-mono">&lt;/&gt;</span>
          </div>
          <span className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">
            System Design<br />
            <span className="text-violet-500 font-bold">Coach</span>
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href) && !pathname.startsWith('/learn/'));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-surface-hover hover:text-slate-900 dark:hover:text-white',
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}

        {/* Reference section */}
        <div className="pt-4">
          <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Reference
          </p>
          {REFERENCE_MODULES.map((m) => {
            const href = `/learn/${m.slug}`;
            const active = pathname === href;
            return (
              <Link
                key={m.slug}
                href={href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-surface-hover hover:text-slate-900 dark:hover:text-white',
                )}
              >
                <BookMarked size={16} />
                {m.title}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer hint */}
      <div className="px-5 py-4 border-t border-surface-border">
        <p className="text-xs text-slate-400 leading-relaxed">
          Powered by Gemini 2.0 Flash.{' '}
          <span className="text-violet-400">Free tier</span> — no account needed.
        </p>
      </div>
    </aside>
  );
}
