import { Evaluation } from '@/types';
import clsx from 'clsx';
import { CheckCircle, AlertCircle, Building2, Star } from 'lucide-react';

interface EvaluationReportProps {
  evaluation: Evaluation;
}

const VERDICT_STYLES: Record<string, string> = {
  'Strong Hire':    'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
  'Hire':           'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  'Borderline':     'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  'No Hire':        'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  'Strong No Hire': 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
};

function ScoreMeter({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-surface-hover overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-4 text-right">{score}</span>
    </div>
  );
}

export function EvaluationReport({ evaluation }: EvaluationReportProps) {
  const verdictStyle = VERDICT_STYLES[evaluation.overallRating] ?? VERDICT_STYLES['Borderline'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overall verdict banner */}
      <div className={clsx('flex items-center justify-between p-4 rounded-xl border', verdictStyle)}>
        <div>
          <p className="text-xs font-medium opacity-70 mb-0.5">Overall Rating</p>
          <p className="text-xl font-bold">{evaluation.overallRating}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium opacity-70 mb-0.5">Score</p>
          <p className="text-3xl font-bold">{evaluation.overallScore}<span className="text-base font-normal opacity-60">/10</span></p>
        </div>
      </div>

      {/* Dimension scores */}
      <section>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Dimension Breakdown</h3>
        <div className="space-y-3">
          {evaluation.dimensions.map((d) => (
            <div key={d.label} className="bg-surface-card border border-surface-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{d.label}</span>
              </div>
              <ScoreMeter score={d.score} />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{d.comment}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Things done well */}
      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
          <CheckCircle size={14} /> What You Did Well
        </h3>
        <ul className="space-y-1.5">
          {evaluation.thingsDoneWell.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
              <Star size={12} className="flex-shrink-0 mt-0.5 text-emerald-500" />
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* Missing concepts */}
      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">
          <AlertCircle size={14} /> Missing or Weak Areas
        </h3>
        <ul className="space-y-1.5">
          {evaluation.missingConcepts.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5" />
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* Company verdicts */}
      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          <Building2 size={14} /> How Each Company Would Evaluate
        </h3>
        <div className="space-y-2">
          {evaluation.companyFeedback.map((cf) => {
            const s = VERDICT_STYLES[cf.verdict] ?? VERDICT_STYLES['Borderline'];
            return (
              <div key={cf.company} className="bg-surface-card border border-surface-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{cf.company}</span>
                  <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full border', s)}>
                    {cf.verdict}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{cf.reasoning}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Suggested answer */}
      <section>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          What a Great Answer Would Cover
        </h3>
        <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {evaluation.suggestedAnswer}
          </p>
        </div>
      </section>
    </div>
  );
}
