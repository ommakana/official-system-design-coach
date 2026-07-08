'use client';

import { useCallback } from 'react';
import { useInterviewStore } from './useInterviewStore';

export function useChat() {
  // Subscribe only to the slices we need for rendering — not the whole store.
  // Actions use getState() so they never appear in deps and stay stable.
  const session    = useInterviewStore((s) => s.session);
  const streaming  = useInterviewStore((s) => s.streaming);
  const evaluating = useInterviewStore((s) => s.evaluating);
  const error      = useInterviewStore((s) => s.error);

  const sendMessage = useCallback(async (userText: string) => {
    // Read fresh state at call time — no stale closure risk
    const { session, streaming, addMessage, setStreaming, setError } =
      useInterviewStore.getState();
    if (!session || streaming) return;

    // 1. Add user message
    addMessage('user', userText);

    // 2. Prime an empty assistant message for streaming into
    addMessage('assistant', '');
    setStreaming(true);
    setError(null);

    // Read fresh session after mutations
    const freshMessages = useInterviewStore.getState().session?.messages ?? [];
    const messages = [
      ...freshMessages.slice(0, -1), // all but the empty assistant placeholder
      { role: 'user' as const, content: userText },
    ];

    const slug = useInterviewStore.getState().session!.moduleSlug;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, messages }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'API error' }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      if (!res.body) throw new Error('No response body');

      // 3. Stream tokens into the last assistant message
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const { appendToLastMessage } = useInterviewStore.getState();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        appendToLastMessage(decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      useInterviewStore.getState().setError(
        err instanceof Error ? err.message : 'Something went wrong',
      );
      // Remove the empty assistant placeholder on error
      const { session: s } = useInterviewStore.getState();
      if (s) {
        const msgs = s.messages.slice(0, -1);
        useInterviewStore.setState({ session: { ...s, messages: msgs } });
      }
    } finally {
      useInterviewStore.getState().setStreaming(false);
    }
  // Empty deps — getState() reads fresh values at call time, no closures needed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endInterview = useCallback(async () => {
    const { session, setEvaluating, setError, setEvaluation } = useInterviewStore.getState();
    if (!session || session.messages.length < 2) return;

    setEvaluating(true);
    setError(null);

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleTitle: session.moduleTitle,
          messages: session.messages,
        }),
      });

      if (!res.ok) throw new Error(`Evaluation failed: HTTP ${res.status}`);
      const evaluation = await res.json();
      setEvaluation(evaluation);
    } catch (err) {
      useInterviewStore.getState().setError(
        err instanceof Error ? err.message : 'Evaluation failed',
      );
    } finally {
      useInterviewStore.getState().setEvaluating(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    session,
    streaming,
    evaluating,
    error,
    sendMessage,
    endInterview,
    startSession: useInterviewStore.getState().startSession,
    clearSession: useInterviewStore.getState().clearSession,
  };
}
