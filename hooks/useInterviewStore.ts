'use client';

import { create } from 'zustand';
import { ChatMessage, Evaluation, InterviewSession } from '@/types';
import { generateId, saveSession } from '@/lib/storage';

interface InterviewStore {
  session: InterviewSession | null;
  streaming: boolean;
  evaluating: boolean;
  error: string | null;

  startSession: (moduleSlug: string, moduleTitle: string) => void;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  appendToLastMessage: (chunk: string) => void;
  setStreaming: (v: boolean) => void;
  setEvaluating: (v: boolean) => void;
  setEvaluation: (ev: Evaluation) => void;
  setError: (msg: string | null) => void;
  clearSession: () => void;
}

export const useInterviewStore = create<InterviewStore>((set, get) => ({
  session: null,
  streaming: false,
  evaluating: false,
  error: null,

  startSession: (moduleSlug, moduleTitle) => {
    const session: InterviewSession = {
      id: generateId(),
      moduleSlug,
      moduleTitle,
      startedAt: Date.now(),
      messages: [],
    };
    set({ session, error: null });
  },

  addMessage: (role, content) => {
    const { session } = get();
    if (!session) return;
    const msg: ChatMessage = { id: generateId(), role, content, timestamp: Date.now() };
    const updated = { ...session, messages: [...session.messages, msg] };
    set({ session: updated });
    saveSession(updated);
  },

  // Streams tokens into the last assistant message
  appendToLastMessage: (chunk) => {
    const { session } = get();
    if (!session) return;
    const msgs = [...session.messages];
    const last = msgs[msgs.length - 1];
    if (!last || last.role !== 'assistant') return;
    msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
    const updated = { ...session, messages: msgs };
    set({ session: updated });
  },

  setStreaming: (v) => set({ streaming: v }),
  setEvaluating: (v) => set({ evaluating: v }),

  setEvaluation: (ev) => {
    const { session } = get();
    if (!session) return;
    const updated: InterviewSession = {
      ...session,
      endedAt: Date.now(),
      evaluation: ev,
    };
    set({ session: updated });
    saveSession(updated);
  },

  setError: (msg) => set({ error: msg }),
  clearSession: () => set({ session: null, streaming: false, evaluating: false, error: null }),
}));
