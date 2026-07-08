import clsx from 'clsx';
import { ChatMessage } from '@/types';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function ChatBubble({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={clsx('flex gap-3 animate-fade-in', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={clsx(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white',
        isUser ? 'bg-violet-600' : 'bg-slate-600 dark:bg-slate-700',
      )}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Bubble */}
      <div className={clsx(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-violet-600 text-white rounded-tr-sm'
          : 'bg-surface-card border border-surface-border text-slate-800 dark:text-slate-100 rounded-tl-sm',
      )}>
        <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
        {isStreaming && (
          <span className="inline-flex items-center gap-0.5 ml-1 align-middle">
            <span className="typing-dot" style={{ animationDelay: '0ms' }} />
            <span className="typing-dot" style={{ animationDelay: '200ms' }} />
            <span className="typing-dot" style={{ animationDelay: '400ms' }} />
          </span>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600 dark:bg-slate-700 flex items-center justify-center">
        <Bot size={14} className="text-white" />
      </div>
      <div className="bg-surface-card border border-surface-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        <span className="typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="typing-dot" style={{ animationDelay: '200ms' }} />
        <span className="typing-dot" style={{ animationDelay: '400ms' }} />
      </div>
    </div>
  );
}
