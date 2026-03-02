import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Uses GEMINI_API_KEY from env — never put credentials in code.
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
});

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set. Add it in Vercel env vars." },
      { status: 503 }
    );
  }

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid prompt" },
        { status: 400 }
      );
    }

    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Create a high-quality advertising image for this brief: ${prompt}`,
            },
          ],
        },
      ],
      config: {
        responseModalities: ["Text", "Image"],
      },
    });

    const candidate = (response as any).candidates?.[0];
    const parts = candidate?.content?.parts ?? [];

    const images: string[] = [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType ?? "image/png";
        images.push(`data:${mime};base64,${part.inlineData.data}`);
      }
    }

    if (!images.length) {
      return NextResponse.json(
        { error: "No image data in Gemini response", raw: response },
        { status: 502 }
      );
    }

    return NextResponse.json({ imageUrl: images[0], ok: true });
  } catch (error) {
    console.error("[api/generate/photo]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Image generation failed",
      },
      { status: 500 }
    );
  }
}
