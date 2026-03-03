# Deploying to Vercel & Handling Credentials

## Never put credentials in code

If you have a `video.py` (or any script) with API keys or tokens **in the file**, do this:

1. **Remove** all keys, secrets, and passwords from the code.
2. **Use environment variables** instead. This app already reads:
   - `GEMINI_API_KEY` — for script generation (Gemini)
   - `REPLICATE_API_TOKEN` — for video and photo generation (Replicate)
3. **Local development**: Copy `.env.example` to `.env.local` and fill in your own values. `.env.local` is gitignored and will not be committed.
4. **Vercel**: In your project on [vercel.com](https://vercel.com) go to **Project → Settings → Environment Variables** and add the same variable names and values. Redeploy after adding or changing variables.

## If your cousin’s `video.py` uses a different API

- If it uses **Replicate**: The app is already set up; just set `REPLICATE_API_TOKEN` and optionally change the model in `app/api/generate/video/route.ts` or `app/api/generate/photo/route.ts`.
- If it uses **another provider** (e.g. Runway, Stability, OpenAI): Replace the logic inside the corresponding API route with calls to that provider, still using **env vars** for any API keys (e.g. `RUNWAY_API_KEY`). You can paste the relevant parts of `video.py` and we can port the logic into the Next.js API route.

## Vercel limits

- **Hobby**: Serverless function timeout is 10 seconds. Video generation can take 1–3 minutes, so you may need **Vercel Pro** for long-running video (this app sets `maxDuration = 120` on the video route).
- Build command: `npm run build` (default).
- Output: Next.js (default). No extra config needed for a standard Next.js deploy.
