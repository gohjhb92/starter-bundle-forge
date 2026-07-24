# The Quartermaster — Starter Bundle Builder

An AI chat assistant for a Warhammer & TCG hobby store. Customers chat with "The
Quartermaster", which recommends a budget-checked beginner bundle from the store
catalogue. React chat front-end + one serverless function that calls Claude.

**Architecture (why it's built this way):** the Anthropic API key is a secret and
must never reach the browser. So the React app never calls Anthropic directly —
it calls `/api/bundle`, a serverless function that holds the key server-side
(`process.env.ANTHROPIC_API_KEY`) and forwards the request. This is the only
safe pattern for a public site.

```
Browser (React)  ->  /api/bundle (serverless, holds key)  ->  Anthropic API
```

The reply **streams** back token-by-token: `/api/bundle` responds with a
newline-delimited JSON (NDJSON) stream — `{"type":"text","delta":…}` events as
the model writes, then a final `{"type":"done","reply":…,"bundles":[…]}` carrying
the canonical text and the structured order card(s). The UI fills the chat bubble
live and renders the cards on `done`.

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
- `/api/bundle` enforces a per-IP rate limit (20 req/min, `Retry-After` on 429).
  **Set the two Upstash env vars below** so the limit is shared across serverless
  instances — without them it falls back to per-instance in-memory counting,
  which resets on every cold start and barely limits anything in production.
  **A monthly spend cap on the key is still the real safeguard.**

## Production hardening (Upstash)
Rate limiting and the query log both want a shared, persistent store. Create a
free Redis database at https://upstash.com and set its REST credentials as env
vars (locally in `.env`, in production via Vercel → Settings → Environment
Variables):
```
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-rest-token
```
`datastore.js` uses them when present and **degrades gracefully to in-memory**
when absent (and if Upstash is unreachable it fails open rather than blocking
customers), so the app runs fine either way.

## Query log (what customers are asking)
Every completed turn is recorded so the store can see real demand — what people
ask for, what budgets they name, and which bundles got recommended. Each entry is
deliberately compact: a timestamp, the customer's latest message (truncated to
200 chars), whether a recommendation was made, each option's label and total, the
budget, and the demo flag. **No full transcripts.**

Read it at:
```
GET /api/log?token=<LOG_TOKEN>&n=100
```
Set `LOG_TOKEN` (a long random string) to enable the endpoint. **If `LOG_TOKEN`
is unset the route 404s**, so a deployment can never leak the log by accident.
The response includes `"persistent": true|false` — `false` means Upstash isn't
configured and entries are only per-instance in-memory (fine for a smoke test,
useless in production). Configure Upstash for a log that actually survives.

## Model
`api/bundle.js` uses `claude-haiku-4-5-20251001` — low cost per call, and this
structured task runs fine on it. For higher-quality output at a higher price,
switch to `claude-sonnet-5`. Confirm the current model IDs at
https://docs.claude.com/en/docs/about-claude/models before deploying, since
model names change.

## Demo mode (no API key, no cost)
If `ANTHROPIC_API_KEY` is **not set** (or `DEMO_MODE=1`), `/api/bundle` skips the
Anthropic call and returns a catalogue-accurate **sample** bundle assembled with
simple rules — so you can deploy and demo the whole flow for free. The UI shows a
small **"Demo · no AI"** badge so sample data is never mistaken for live output.
Set a real `ANTHROPIC_API_KEY` to switch to genuine AI responses automatically.

## The order card & reserving at the store
When the assistant recommends a **final** bundle it calls a `recommend_bundles`
tool (see `api/bundle.js`), so alongside its friendly message the app receives one
or more structured, itemised bundles and renders each as an **order card** — line
items, a total, and a budget bar (green under budget, red over). Using a tool
rather than parsing the prose makes the cards reliable.

When it helps, the assistant offers **2-3 tiers** (e.g. Good / Better / Best, or
Essentials / Recommended / Complete) — each rendered as its own labelled card the
customer can compare, edit and reserve independently.

The card is **interactive**: customers adjust quantities, remove items, or add an
extra from the add-on picker (the `ADDONS` list in [`catalogue.js`](catalogue.js)),
and the total, budget bar and reservation message all update live — no need to
ask the assistant to tweak it. A **Reset** restores the assistant's original.

Each card has **Reserve** buttons that open a pre-filled WhatsApp / email enquiry
to the store — turning a chat into a real lead. Set the store's contact details in
[`catalogue.js`](catalogue.js):
```js
export const STORE = {
  name: "Bastion Wargames",
  whatsapp: "",                          // full intl number, digits only, e.g. "6591234567". "" hides the button.
  email: "hello@bastionwargames.example" // replace with the real enquiries inbox
};
```
These are **placeholders** — replace them before going live. Nothing is sent
automatically; the buttons just open the customer's own WhatsApp/email composer.

## Editing the catalogue
The catalogue and rules live in the `SYSTEM_PROMPT` string at the top of
`api/bundle.js` — combat patrols, spearheads, boxes, paints, tools and TCG
products. Product **names** reflect Warhammer's real current range; **prices are
rough SGD estimates** (Warhammer prices are region-specific and warhammer.com
blocks automated fetching, so these are approximate — refine to Bastion Wargames'
exact figures when you have them). Combat Patrol / Spearhead faction availability
also rotates, so trim the lists to what you actually stock.

The game/faction lists that feed the quick-pick dropdowns **and** the demo replies
live once in [`catalogue.js`](catalogue.js), imported by both the browser app and
the serverless function — edit factions there, not in two places. The scripted
`demoReply` fallback in `api/bundle.js` only covers a few sample bundles; a real
API key gives the full catalogue-aware conversation.

## Using Claude Code on this repo
From this folder, run `claude`, then try:
> "Read the README, run it locally with vercel dev, and walk me through deploying
> to Vercel. Don't hardcode my API key anywhere — use environment variables."
