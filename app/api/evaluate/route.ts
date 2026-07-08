import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';
import { EVALUATOR_PROMPT } from '@/lib/prompts';
import { Evaluation } from '@/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { moduleTitle, messages } = await req.json() as {
      moduleTitle: string;
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!messages || messages.length < 2) {
      return NextResponse.json(
        { error: 'Interview transcript is too short to evaluate' },
        { status: 400 },
      );
    }

    // Format transcript for the evaluator
    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'CANDIDATE' : 'INTERVIEWER'}: ${m.content}`)
      .join('\n\n');

    const userMessage = `Design problem: "${moduleTitle}"\n\nInterview transcript:\n\n${transcript}\n\nProvide your evaluation JSON now.`;

    const evaluation = await generateJSON<Evaluation>(EVALUATOR_PROMPT, userMessage);

    return NextResponse.json(evaluation);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
