'use client';

import { useEffect, useRef, use } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getModule } from '@/lib/modules';
import { useChat } from '@/hooks/useChat';
import { ChatBubble, TypingIndicator } from '@/components/interview/ChatBubble';
import { ChatInput } from '@/components/interview/ChatInput';
import { EvaluationReport } from '@/components/interview/EvaluationReport';
import { ArrowLeft, StopCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface Props { params: Promise<{ slug: string }> }

export default function InterviewPage({ params }: Props) {
  const { slug } = use(params);
  const module = getModule(slug);
  if (!module) notFound();

  const { session, streaming, evaluating, error, sendMessage, endInterview, startSession } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const didStart   = useRef(false);

  // Start session + send first AI message once
  useEffect(() => {
    if (didStart.current) return;
    didStart.current = true;
    startSession(module.slug, module.title);
    // Kick off the interview with an AI opening
    setTimeout(() => {
      sendMessage('__INTERVIEW_START__');
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages.length, streaming]);

  const messages = session?.messages.filter((m) => m.content !== '__INTERVIEW_START__') ?? [];
  const evaluation = session?.evaluation;
  const hasEnded   = !!evaluation;
  const canEnd     = !streaming && !evaluating && messages.length >= 3 && !hasEnded;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border bg-surface-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/interview" className="text-slate-400 hover:text-violet-500 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-xs text-slate-400">Interview</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{module.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/learn/${module.slug}`}
            className="text-xs px-3 py-1.5 rounded-lg border border-surface-border text-slate-500 hover:text-violet-500 hover:border-violet-400 transition-colors"
          >
            Study Guide
          </Link>
          {canEnd && (
            <button
              onClick={endInterview}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <StopCircle size={12} /> End Interview
            </button>
          )}
        </div>
      </div>

      {/* Chat + evaluation area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.map((msg, i) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            isStreaming={streaming && i === messages.length - 1 && msg.role === 'assistant'}
          />
        ))}

        {/* Show typing indicator when waiting for first token */}
        {streaming && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <TypingIndicator />
        )}

        {/* Evaluating state */}
        {evaluating && (
          <div className="flex items-center gap-3 text-sm text-slate-400 py-4 justify-center">
            <Loader2 size={16} className="animate-spin" />
            Evaluating your performance...
          </div>
        )}

        {/* Evaluation report */}
        {evaluation && (
          <div className="mt-4 p-5 rounded-2xl border border-surface-border bg-surface-card">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-5">Interview Evaluation</h2>
            <EvaluationReport evaluation={evaluation} />
            <div className="mt-6 pt-4 border-t border-surface-border flex gap-3">
              <Link
                href="/interview"
                className="text-sm px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
              >
                Try Another Topic
              </Link>
              <Link
                href={`/learn/${module.slug}`}
                className="text-sm px-4 py-2 rounded-lg border border-surface-border text-slate-600 dark:text-slate-400 hover:border-violet-400 hover:text-violet-500 transition-colors"
              >
                Review Study Guide
              </Link>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={clsx(
            'text-sm text-red-600 dark:text-red-400 px-4 py-3 rounded-xl',
            'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
          )}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input — hidden after interview ends */}
      {!hasEnded && (
        <div className="px-5 py-4 border-t border-surface-border bg-surface-card flex-shrink-0">
          <ChatInput
            onSend={sendMessage}
            disabled={streaming || evaluating}
            placeholder="Share your approach... (Shift+Enter for new line)"
          />
          <p className="text-xs text-slate-400 mt-2 text-center">
            {messages.length < 3
              ? 'Answer at least 3 questions before ending the interview'
              : 'Ready to end? Click "End Interview" above for your evaluation.'}
          </p>
        </div>
      )}
    </div>
  );
}
