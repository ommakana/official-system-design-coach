import { InterviewSession, UserProgress } from '@/types';

const PROGRESS_KEY = 'sdc_progress_v1';
const SESSION_KEY  = 'sdc_sessions_v1';

// ── Progress ────────────────────────────────────────────────────────────────

export function getProgress(): UserProgress {
  if (typeof window === 'undefined') return { completedModules: [], completedInterviews: [] };
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : { completedModules: [], completedInterviews: [] };
  } catch {
    return { completedModules: [], completedInterviews: [] };
  }
}

export function markModuleComplete(slug: string): void {
  const p = getProgress();
  if (!p.completedModules.includes(slug)) {
    p.completedModules.push(slug);
    p.lastVisited = slug;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  }
}

export function markInterviewComplete(sessionId: string): void {
  const p = getProgress();
  if (!p.completedInterviews.includes(sessionId)) {
    p.completedInterviews.push(sessionId);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  }
}

// ── Sessions ────────────────────────────────────────────────────────────────

export function getSessions(): InterviewSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getSession(id: string): InterviewSession | undefined {
  return getSessions().find((s) => s.id === id);
}

export function saveSession(session: InterviewSession): void {
  if (typeof window === 'undefined') return;
  const sessions = getSessions().filter((s) => s.id !== session.id);
  // Keep max 20 sessions to avoid localStorage bloat
  const trimmed = [session, ...sessions].slice(0, 20);
  localStorage.setItem(SESSION_KEY, JSON.stringify(trimmed));
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter((s) => s.id !== id);
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
