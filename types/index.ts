// ── Module content types ────────────────────────────────────────────────────

export type Difficulty = 'Senior' | 'Staff' | 'Reference';

export interface ModuleSection {
  id: string;
  title: string;
  content: string; // markdown-ish plain text with code fences
}

export interface DesignModule {
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  companies: string[];
  tags: string[];
  estimatedMinutes: number;
  sections: ModuleSection[];
  youtubeUrl?: string; // optional curated video resource
}

// ── Interview / chat types ──────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface InterviewSession {
  id: string;
  moduleSlug: string;
  moduleTitle: string;
  startedAt: number;
  endedAt?: number;
  messages: ChatMessage[];
  evaluation?: Evaluation;
}

// ── Evaluation types ────────────────────────────────────────────────────────

export interface ScoreDimension {
  label: string;
  score: number; // 1–10
  comment: string;
}

export interface CompanyFeedback {
  company: string;
  verdict: string;       // e.g. "Strong Hire", "Hire", "No Hire"
  reasoning: string;
}

export interface Evaluation {
  dimensions: ScoreDimension[];
  overallScore: number;       // 1–10
  overallRating: string;      // e.g. "Strong Hire"
  thingsDoneWell: string[];
  missingConcepts: string[];
  suggestedAnswer: string;
  companyFeedback: CompanyFeedback[];
}

// ── Progress types ──────────────────────────────────────────────────────────

export interface UserProgress {
  completedModules: string[];        // slugs
  completedInterviews: string[];     // session ids
  lastVisited?: string;              // slug
}
