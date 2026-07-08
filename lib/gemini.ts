import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  // Fail loudly at module load time in server context
  console.warn('[gemini] GEMINI_API_KEY not set — AI features will not work');
}

// Singleton client — reused across requests in the same Lambda execution
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export function getGeminiModel(modelName = 'gemini-2.0-flash') {
  if (!genAI) throw new Error('GEMINI_API_KEY is not configured');
  return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Stream a Gemini response as a ReadableStream of text chunks.
 * Designed to be returned directly from a Next.js route handler.
 */
export async function streamGemini(
  systemPrompt: string,
  userMessage: string,
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [],
): Promise<ReadableStream<Uint8Array>> {
  const model = getGeminiModel();

  const chat = model.startChat({
    systemInstruction: systemPrompt,
    history,
  });

  const result = await chat.sendMessageStream(userMessage);

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });
}

/**
 * Non-streaming Gemini call — used for structured evaluation JSON.
 */
export async function generateJSON<T>(
  systemPrompt: string,
  userMessage: string,
): Promise<T> {
  const model = getGeminiModel();
  const result = await model.generateContent({
    systemInstruction: systemPrompt,
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });
  const text = result.response.text();
  return JSON.parse(text) as T;
}
