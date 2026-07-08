'use client';

import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import clsx from 'clsx';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = 'Share your approach...' }: ChatInputProps) {
  const [value, setValue] = useState('');

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex gap-3 items-end">
      <textarea
        className={clsx(
          'flex-1 resize-none rounded-xl px-4 py-3 text-sm',
          'bg-surface-card border border-surface-border',
          'text-slate-900 dark:text-slate-100 placeholder:text-slate-400',
          'focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30',
          'transition-colors min-h-[52px] max-h-[160px]',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        disabled={disabled}
        rows={1}
        aria-label="Your answer"
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className={clsx(
          'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center',
          'bg-violet-600 text-white transition-all',
          'hover:bg-violet-700 active:scale-95',
          (disabled || !value.trim()) && 'opacity-40 cursor-not-allowed',
        )}
        aria-label="Send message"
      >
        <Send size={16} />
      </button>
    </div>
  );
}
