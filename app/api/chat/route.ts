import { NextRequest, NextResponse } from 'next/server';
import { streamGemini } from '@/lib/gemini';
import { buildInterviewerPrompt } from '@/lib/prompts';
import { getModule } from '@/lib/modules';

export const maxDuration = 60; // Vercel Pro allows up to 300s; free tier 60s

export async function POST(req: NextRequest) {
  try {
    const { slug, messages } = await req.json() as {
      slug: string;
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    const module = getModule(slug);
    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Build Gemini history from previous messages (all but the last user message)
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.content }],
    }));

    // Last message is the current user input to send
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 });
    }

    const systemPrompt = buildInterviewerPrompt(module);
    const stream = await streamGemini(systemPrompt, lastMessage.content, history);

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no', // Disable Nginx buffering on Vercel
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
