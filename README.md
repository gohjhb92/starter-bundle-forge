# The Quartermaster — Starter Bundle Builder

An AI-powered beginner starter-bundle builder for a Warhammer & TCG hobby store.
A customer's request goes in; a budget-checked bundle from the store catalogue
comes back. React front-end + one serverless function that calls Claude.

**Architecture (why it's built this way):** the Anthropic API key is a secret and
must never reach the browser. So the React app never calls Anthropic directly —
it calls `/api/bundle`, a serverless function that holds the key server-side
(`process.env.ANTHROPIC_API_KEY`) and forwards the request. This is the only
safe pattern for a public site.

```
Browser (React)  ->  /api/bundle (serverless, holds key)  ->  Anthropic API
```

## Prerequisites
- Node.js 18+ (`node -v`)
- An Anthropic API key — https://console.anthropic.com/
- A Vercel account (free) — https://vercel.com/
- The Vercel CLI for local dev: `npm i -g vercel`

## Run locally
```bash
npm install
cp .env.example .env.local        # then paste your real key into .env.local
vercel dev                        # runs BOTH the UI and the /api function
```
Open the URL it prints (usually http://localhost:3000).

> `npm run dev` runs only the front-end (Vite) — the `/api/bundle` call will 404
> because the function isn't served. Use `vercel dev` so the function runs too.

## Deploy (GitHub -> Vercel)
1. Create a new GitHub repo and push this folder:
   ```bash
   git init && git add . && git commit -m "Starter Bundle Builder"
   git branch -M main
   git remote add origin https://github.com/<you>/starter-bundle-forge.git
   git push -u origin main
   ```
2. In Vercel: **Add New -> Project -> import the repo.** Framework preset is
   auto-detected as Vite. Click Deploy.
3. In the Vercel project: **Settings -> Environment Variables -> add**
   `ANTHROPIC_API_KEY` = your key. Redeploy so the function picks it up.
4. Your live URL is ready. The `/api/bundle` function runs automatically —
   no separate backend to host.

## IMPORTANT — before you share the link
- **Set a monthly spend cap** on the API key in the Anthropic console. A public
  site means strangers spend your credits. This is the real safeguard.
- **Never commit the key.** It lives only in `.env.local` (git-ignored) and in
  Vercel's env vars. If a key is ever pushed, revoke it immediately — git history
  keeps the old value, so rotating is the only fix.
- Optional next step: add rate-limiting (e.g. Upstash Ratelimit) in
  `api/bundle.js` if the site gets real traffic.

## Model
`api/bundle.js` uses `claude-sonnet-5`. For lower cost per call, switch to
`claude-haiku-4-5-20251001` — this structured task runs fine on it. Confirm the
current model IDs at https://docs.claude.com/en/docs/about-claude/models before
deploying, since model names change.

## Editing the catalogue
The catalogue and rules live in the `SYSTEM_PROMPT` string at the top of
`api/bundle.js`. Update prices/products there. Keep the JSON output shape the
same or the front-end won't render it.

## Using Claude Code on this repo
From this folder, run `claude`, then try:
> "Read the README, run it locally with vercel dev, and walk me through deploying
> to Vercel. Don't hardcode my API key anywhere — use environment variables."
