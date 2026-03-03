"use client";

import React, { useState } from "react";
import {
  Video,
  Camera,
  Music,
  FileText,
  Sparkles,
  Loader2,
  Play,
  ImageIcon,
  AlertCircle,
} from "lucide-react";

type Mode = "video" | "photo";

export default function AdStudio() {
  const [prompt, setPrompt] = useState(
    "A 15-second high-energy TikTok ad for 'Be Bodywise' Hair Growth Serum."
  );
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("video");
  const [duration, setDuration] = useState<number>(4); // seconds
  const [resolution, setResolution] = useState<"720p" | "1080p">("720p");
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");
  const [referenceImage, setReferenceImage] = useState<{
    data: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);
  const [result, setResult] = useState<{
    script?: string;
    videoUrl?: string;
    imageUrl?: string;
    error?: string;
  } | null>(null);

  const handleReferenceImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      setReferenceImage(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] ?? "";
      setReferenceImage({
        data: base64,
        mimeType: file.type || "image/png",
        previewUrl: dataUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  const parseJsonOrError = async (res: Response) => {
    const text = await res.text();
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) {
      throw new Error(
        text.includes("<!DOCTYPE") || text.includes("<html")
          ? "Server returned an error page. Check that GEMINI_API_KEY is set in ai-ad-studio/.env.local and restart the dev server (npm run dev)."
          : text.slice(0, 200) || "Unknown server error"
      );
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(text.slice(0, 200) || "Invalid response");
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const scriptRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const scriptData = await parseJsonOrError(scriptRes).catch((e) => ({
        error: e instanceof Error ? e.message : "Script API failed",
      }));
      const script =
        "error" in scriptData
          ? "Could not generate script."
          : scriptData.script ?? "Could not generate script.";

      if ("error" in scriptData && scriptData.error) {
        setResult({ error: scriptData.error });
        setLoading(false);
        return;
      }

      if (mode === "video") {
        const res = await fetch("/api/generate/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: script,
            durationSeconds: duration,
            resolution,
            aspectRatio,
            referenceImage: referenceImage
              ? { data: referenceImage.data, mimeType: referenceImage.mimeType }
              : null,
          }),
        });
        const data = await parseJsonOrError(res);
        if (!res.ok) {
          setResult({
            script,
            error: data.error ?? "Video generation failed",
          });
          setLoading(false);
          return;
        }
        setResult({
          script,
          videoUrl: data.videoUrl,
        });
      } else {
        const res = await fetch("/api/generate/photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: script }),
        });
        const data = await parseJsonOrError(res);
        if (!res.ok) {
          setResult({
            script,
            error: data.error ?? "Photo generation failed",
          });
          setLoading(false);
          return;
        }
        setResult({
          script,
          imageUrl: data.imageUrl,
        });
      }
    } catch (err) {
      setResult({
        error: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-10">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Video className="text-blue-500" /> Mosaic Wellness AI Studio
          </h1>
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              2. Include Assets
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode("video")}
                className={`flex items-center gap-4 p-5 rounded-2xl border text-left transition-colors ${
                  mode === "video"
                    ? "bg-blue-600/10 border-blue-600/50 text-blue-400 font-bold"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                }`}
              >
                <Video size={20} /> Video
              </button>
              <button
                type="button"
                onClick={() => setMode("photo")}
                className={`flex items-center gap-4 p-5 rounded-2xl border text-left transition-colors ${
                  mode === "photo"
                    ? "bg-blue-600/10 border-blue-600/50 text-blue-400 font-bold"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                }`}
              >
                <Camera size={20} /> Photos
              </button>
              <div className="flex items-center gap-4 p-5 rounded-2xl border bg-zinc-900/50 border-zinc-800 text-zinc-500 opacity-60">
                <Music size={20} /> Audio
              </div>
              <div className="flex items-center gap-4 p-5 rounded-2xl border bg-blue-600/10 border-blue-600/50 text-blue-400 font-bold">
                <FileText size={20} /> Script
              </div>
            </div>
            {mode === "video" && (
              <div className="space-y-3 pt-2">
                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                  Upload Reference Photo (optional)
                </p>
                <label className="flex flex-col gap-2 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-4 text-xs text-zinc-400 cursor-pointer hover:border-zinc-500 transition-colors">
                  <span>
                    Choose an image that matches your product or concept. Veo
                    will use it to style the video.
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleReferenceImageChange}
                  />
                  <span className="text-[11px] text-zinc-500">
                    Click to upload (JPG/PNG, up to a few MB)
                  </span>
                </label>
                {referenceImage?.previewUrl && (
                  <div className="relative mt-2 w-32 h-32 rounded-xl overflow-hidden border border-zinc-800">
                    <img
                      src={referenceImage.previewUrl}
                      alt="Reference"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              3. Input Brief
            </h2>
            <textarea
              className="w-full h-44 bg-[#111] border border-zinc-800 rounded-2xl p-6 text-sm text-zinc-300 outline-none focus:ring-1 focus:ring-blue-600"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your ad or campaign..."
            />
          </div>
          {mode === "video" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold uppercase tracking-widest">
                    Duration
                  </span>
                  <span>{duration}s</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={8}
                  step={2}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <p className="text-[11px] text-zinc-500">
                  Shorter clips generate faster. Supported values: 4, 6, 8
                  seconds.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold uppercase tracking-widest">
                    Resolution
                  </span>
                  <span>{resolution}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={1}
                  value={resolution === "720p" ? 0 : 1}
                  onChange={(e) =>
                    setResolution(e.target.value === "0" ? "720p" : "1080p")
                  }
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>720p (faster)</span>
                  <span>1080p (sharper)</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold uppercase tracking-widest">
                    Aspect
                  </span>
                  <span>{aspectRatio === "9:16" ? "Vertical 9:16" : "Wide 16:9"}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio("9:16")}
                    className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${
                      aspectRatio === "9:16"
                        ? "bg-blue-600/10 border-blue-600/60 text-blue-300"
                        : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    }`}
                  >
                    Vertical 9:16
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio("16:9")}
                    className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${
                      aspectRatio === "16:9"
                        ? "bg-blue-600/10 border-blue-600/60 text-blue-300"
                        : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    }`}
                  >
                    Wide 16:9
                  </button>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed py-5 rounded-2xl font-bold flex justify-center items-center gap-3"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}
            {loading
              ? "Generating..."
              : mode === "video"
                ? "Generate Video"
                : "Generate Photo"}
          </button>
        </div>
        <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[2.5rem] flex items-center justify-center min-h-[600px]">
          {loading ? (
            <div className="text-center space-y-4">
              <Loader2
                className="animate-spin mx-auto text-blue-500"
                size={40}
              />
              <p className="text-xs text-zinc-500 font-bold uppercase">
                AI Rendering
              </p>
            </div>
          ) : result ? (
            <div className="w-full h-full p-6 space-y-6">
              {result.error && (
                <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-950/50 border border-red-800 text-red-300 text-sm">
                  <AlertCircle size={18} />
                  {result.error}
                </div>
              )}
              {result.videoUrl && (
                <video
                  controls
                  autoPlay
                  loop
                  className="w-full rounded-3xl aspect-[9/16] object-cover max-h-[480px] mx-auto border border-zinc-800"
                >
                  <source src={result.videoUrl} type="video/mp4" />
                </video>
              )}
              {result.imageUrl && (
                <div className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden border border-zinc-800 aspect-square">
                  <img
                    src={result.imageUrl}
                    alt="Generated"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {result.script && (
                <div className="p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                  <p className="text-[10px] text-blue-400 font-bold uppercase mb-2">
                    AI Script
                  </p>
                  <p className="text-sm text-zinc-300 italic">
                    &quot;{result.script}&quot;
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center opacity-20">
              {mode === "video" ? (
                <Play size={48} className="mx-auto mb-4" />
              ) : (
                <ImageIcon size={48} className="mx-auto mb-4" />
              )}
              <p className="text-sm font-medium">
                {mode === "video"
                  ? "Video preview will appear here"
                  : "Photo preview will appear here"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


