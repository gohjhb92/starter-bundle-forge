import Anthropic from "@anthropic-ai/sdk";

// Same catalogue + rules as the Claude Project. Lives server-side so the client never sees the key.
const SYSTEM_PROMPT = `You are a beginner starter-bundle assistant for a Warhammer and tabletop hobby store in Singapore. Given a customer's request, recommend ONE beginner bundle using ONLY the catalogue below, within the stated budget. Prices are SGD, current July 2026 (Warhammer 40k 11th Edition).

CATALOGUE:
Warhammer 40,000 (11th Edition):
- 40K Introductory Set $111 [12 push-fit minis PLUS 6 paints, a brush and tools — complete beginner pack]
- 40K Getting Started: Space Marines $239 [Space Marines Combat Patrol PLUS 11 paints, brush, tool]
- 40K Getting Started: Orks $239 [Orks Combat Patrol PLUS 11 paints, brush, tool]
- 40K Starter Set $353 [two Combat Patrol armies, terrain, boards, rules — two-player game-in-a-box]
- Combat Patrol: [faction] $239 [single-faction force — NO paints/tools]
Age of Sigmar:
- Spearhead: [faction] $215 [single-faction force — NO paints/tools]
Warhammer: The Old World:
- Old World Army Set: [faction] $230 [single-faction starting army — NO paints/tools]
- Old World Battalion: [faction] $150 [smaller single-faction starter box — NO paints/tools]
Paints & tools (add only when the core set does NOT already include them):
- Faction Paint Set $54 ; Warhammer Tools Set $28 ; Plastic glue $11 ; Starter brush $9 ; Painting Handle $9 ; Citadel paint (each) $9
Magic: The Gathering:
- MTG Starter Kit $30 ; MTG Commander Deck $60 ; MTG Play Booster $9
Pokemon TCG:
- Pokemon Battle Academy $50 ; Pokemon Elite Trainer Box $70 ; Pokemon Booster Pack $9
TCG accessories:
- Deck sleeves (100) $9 ; Deck box $12 ; Playmat $32

ESSENTIALS:
- 40K/AoS/Old World: customer must end up with minis PLUS paints, a brush, glue and clippers. BUT the Introductory Set, Getting Started sets, and Starter Set ALREADY include paints/brush/tools — do NOT add separate paints, brush, handle or Tools Set to these; add only plastic glue. A bare Combat Patrol, Spearhead, or Old World Army/Battalion set includes none — add a Faction Paint Set, Tools Set and glue.
- TCG: core product PLUS deck sleeves at minimum; deck box/playmat only if budget allows.

RULES:
- Use ONLY catalogue products and prices. Never invent a product or price.
- If the customer wants a game/product not in the catalogue, do not substitute — return status "draft" with a note "not in catalogue — staff to advise".
- Never double-buy essentials already included in a core set.
- total must equal the sum of items and be <= budget. Never exceed budget: if the minimum viable bundle costs more than budget, return status "draft", items [], and a note stating the shortfall and the closest cheaper entry point.
- If budget, hobby or interest is unknown, return status "draft" with a note listing the exact questions to ask.

Respond with ONLY a JSON object, no markdown fences, no text before or after:
{"hobby":"40K|Age of Sigmar|Magic|Pokemon|Unclear","interest":"faction/theme or no preference","budget":number-or-null,"items":[{"name":"catalogue name","price":number}],"total":number,"withinBudget":boolean,"note":"one line, no line breaks","status":"ready|draft"}`;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Basic in-memory per-IP rate limit. NOTE: serverless instances are ephemeral and
// NOT shared, so this counter resets on cold starts and doesn't coordinate across
// concurrent instances — it blunts casual abuse but is not real protection. For a
// public site with real traffic, use a shared store like Upstash Ratelimit (README).
const RATE_LIMIT = 10; // requests...
const RATE_WINDOW_MS = 60_000; // ...per minute, per IP
const hits = new Map(); // ip -> { count, resetAt }

function rateLimited(ip) {
  const now = Date.now();
  // Opportunistic cleanup so the map can't grow unbounded on a long-lived instance.
  if (hits.size > 5000) {
    for (const [key, rec] of hits) if (now > rec.resetAt) hits.delete(key);
  }
  const rec = hits.get(ip);
  if (!rec || now > rec.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > RATE_LIMIT;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    res.status(429).json({ error: "Too many requests. Please wait a minute and try again." });
    return;
  }
  try {
    const { request } = req.body || {};
    if (!request || typeof request !== "string" || request.length > 2000) {
      res.status(400).json({ error: "Provide a request string under 2000 characters." });
      return;
    }
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001", // lower cost per call; this structured task runs fine on it. Verify current IDs at the docs link in README.
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: request }],
    });
    const raw = (message.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    res.status(200).json({ raw });
  } catch (e) {
    res.status(500).json({ error: "Generation failed. Check the server logs and your ANTHROPIC_API_KEY." });
  }
}
