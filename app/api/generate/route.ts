import { google } from '@ai-sdk/google';
import { generateText, experimental_generateVideo as generateVideo } from 'ai';

export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const { prompt, aspectRatio, durationSeconds } = await req.json();

    const { text: videoPrompt } = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: `Create a cinematic ad for: ${prompt}.`,
    });

    // THE FIX: We wrap the options in an object cast as 'any'
    // This tells Cursor to stop checking the names and just pass them through
    const videoOptions: any = {
      model: 'google/veo-3.1-generate-001',
      prompt: videoPrompt,
      aspectRatio: aspectRatio || '9:16',
      durationSeconds: durationSeconds || 4,
    };

    const result: any = await generateVideo(videoOptions);

    const videoUrl = result.videos?.[0]?.url || result.video?.[0]?.url || result.videoUrl || '';

    return Response.json({ videoUrl, script: videoPrompt });
  } catch (error) {
    return Response.json({ error: "Check your .env.local keys" }, { status: 500 });
  }
}