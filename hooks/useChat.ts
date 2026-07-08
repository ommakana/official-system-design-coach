'use client';

import { useCallback } from 'react';
import { useInterviewStore } from './useInterviewStore';

export function useChat() {
  const store = useInterviewStore();

  const sendMessage = useCallback(async (userText: string) => {
    const { session } = store;
    if (!session || store.streaming) return;

    // 1. Add user message
    store.addMessage('user', userText);

    // 2. Prime an empty assistant message for streaming into
    store.addMessage('assistant', '');
    store.setStreaming(true);
    store.setError(null);

    // Build messages list including the new user message
    const messages = [
      ...session.messages,
      { role: 'user' as const, content: userText },
    ];

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: session.moduleSlug, messages }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'API error' }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      if (!res.body) throw new Error('No response body');

      // 3. Stream tokens into the last assistant message
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        store.appendToLastMessage(decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Something went wrong');
      // Remove the empty assistant placeholder on error
      const { session: s } = useInterviewStore.getState();
      if (s) {
        const msgs = s.messages.slice(0, -1); // remove last (empty assistant)
        useInterviewStore.setState({ session: { ...s, messages: msgs } });
      }
    } finally {
      store.setStreaming(false);
    }
  }, [store]);

  const endInterview = useCallback(async () => {
    const { session } = store;
    if (!session || session.messages.length < 2) return;

    store.setEvaluating(true);
    store.setError(null);

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
      store.setEvaluation(evaluation);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Evaluation failed');
    } finally {
      store.setEvaluating(false);
    }
  }, [store]);

  return {
    session: store.session,
    streaming: store.streaming,
    evaluating: store.evaluating,
    error: store.error,
    sendMessage,
    endInterview,
    startSession: store.startSession,
    clearSession: store.clearSession,
  };
}
