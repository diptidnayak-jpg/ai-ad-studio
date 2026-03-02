import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Uses GEMINI_API_KEY from env — never put credentials in code.
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
});

// Keep this relatively low for Vercel Hobby; video generation is long-running.
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set. Add it in Vercel env vars." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const {
      prompt,
      durationSeconds,
      resolution,
      aspectRatio,
      referenceImage,
    } = body ?? {};

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid prompt" },
        { status: 400 }
      );
    }

    const safeDuration =
      typeof durationSeconds === "number" && [4, 6, 8].includes(durationSeconds)
        ? durationSeconds
        : 4;
    const safeResolution =
      resolution === "1080p" || resolution === "720p" ? resolution : "720p";
    const safeAspect =
      aspectRatio === "16:9" || aspectRatio === "9:16" ? aspectRatio : "9:16";

    const params: any = {
      model: "veo-3.1-generate-preview",
      source: {
        prompt,
      },
      config: {
        durationSeconds: safeDuration,
        resolution: safeResolution,
        aspectRatio: safeAspect,
        generateAudio: true,
      },
    };

    if (
      referenceImage &&
      typeof referenceImage === "object" &&
      typeof referenceImage.data === "string" &&
      typeof referenceImage.mimeType === "string"
    ) {
      params.source.image = {
        imageBytes: referenceImage.data,
        mimeType: referenceImage.mimeType,
      };
    }

    let operation = await genAI.models.generateVideos(params);

    const start = Date.now();
    const timeoutMs = 55_000;

    // Poll until the operation is done or we hit our timeout.
    // This mirrors the official @google/genai example.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if ((operation as any).done) break;
      if (Date.now() - start > timeoutMs) {
        return NextResponse.json(
          {
            error:
              "Video generation is taking too long. Try a shorter duration or lower resolution.",
          },
          { status: 504 }
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await genAI.operations.getVideosOperation({
        // The SDK accepts the full operation object here.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        operation: operation as any,
      });
    }

    const videoFile =
      (operation as any).response?.generatedVideos?.[0]?.video ?? null;
    const videoUrl =
      videoFile?.downloadUri ?? videoFile?.uri ?? null;

    if (!videoUrl) {
      return NextResponse.json(
        { error: "No video URL in Gemini response", raw: operation },
        { status: 502 }
      );
    }

    return NextResponse.json({ videoUrl, ok: true });
  } catch (error) {
    console.error("[api/generate/video]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Video generation failed",
      },
      { status: 500 }
    );
  }
}
