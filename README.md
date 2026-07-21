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
- `api/bundle.js` includes a basic in-memory per-IP rate limit (10 req/min). It
  blunts casual abuse but resets on cold starts and doesn't coordinate across
  serverless instances — for real traffic, back it with a shared store like
  Upstash Ratelimit. **A monthly spend cap on the key is still the real safeguard.**

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
