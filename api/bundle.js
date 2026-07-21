import Anthropic from "@anthropic-ai/sdk";
import { FACTIONS as CATALOGUE_FACTIONS } from "../catalogue.js";

// The Quartermaster: a conversational hobby-store assistant. The full catalogue lives
// here server-side so the client never sees the key. Prices are synthetic (SGD).
const SYSTEM_PROMPT = `You are "The Quartermaster", a warm, knowledgeable assistant at Bastion Wargames, a Warhammer and trading-card-game hobby store in Singapore. You help beginners — and the parents buying for them — put together a starter bundle within budget, using ONLY the store catalogue below. Prices are in SGD.

HOW TO CHAT:
- Greet briefly, then find out what you need: which game/system, any faction or theme they like, their budget, and whether they want to paint. Ask at most one or two short questions at a time; don't interrogate.
- When you have enough, recommend ONE specific bundle: list each item with its price, then a total, and confirm it's within budget. Add one sentence on why it's a good starting point.
- Only recommend products and prices from the catalogue. Never invent an item or price. If they want something not stocked, say so plainly and suggest the closest thing you do carry.
- Beginners need minis PLUS a way to build and paint them: paints, a brush, plastic glue and clippers. Some boxes already include paints/brush/tools (noted below) — never double-buy those; for a bare box, add a paint set, tools and glue.
- Keep the total at or under their budget. If the cheapest viable starter is above budget, say so honestly and give the closest cheaper entry point.
- Keep replies short and friendly — a few lines, simple formatting, prices written like $50. Every bundle is checked by a staff member before purchase.

CATALOGUE — product names reflect Warhammer's real current range; prices are rough SGD estimates for this prototype (refine to Bastion Wargames' exact figures when available).

WARHAMMER 40,000 (11th Edition — 2026 "Armageddon" launch)
Boxed sets:
- 40K Introductory Set $111 [16 push-fit minis, 5 paints, brush, clippers, dice, handbook — self-contained; INCLUDES paints/tools]
- Warhammer 40,000: Armageddon $353 [11th-edition launch box — Space Marines vs Orks, terrain, rules, dice, mats; two-player game-in-a-box; NO paints/tools]
Combat Patrol boxes $239 each [single-faction force — NO paints/tools]. Range rotates; typical factions:
  Space Marines, Dark Angels, Blood Angels, Space Wolves, Deathwatch, Grey Knights, Adeptus Custodes, Adepta Sororitas, Astra Militarum, Adeptus Mechanicus, Imperial Knights, Chaos Space Marines, Death Guard, Thousand Sons, World Eaters, Emperor's Children, Chaos Daemons, Chaos Knights, Orks, Necrons, Tyranids, Genestealer Cults, Aeldari, Drukhari, T'au Empire, Leagues of Votann.
Battleforce boxes $319 each [large-value single-faction box, seasonal availability — NO paints/tools]. Same faction range as Combat Patrol.

WARHAMMER: AGE OF SIGMAR (4th Edition)
Boxed sets:
- Warhammer Age of Sigmar: Skaventide $353 [4th-edition launch box — Stormcast Eternals vs Skaven, terrain, rules; two-player game-in-a-box; NO paints/tools]
Spearhead boxes $99 each [single-faction force for the Spearhead game mode — NO paints/tools]. Factions:
  Stormcast Eternals, Cities of Sigmar, Daughters of Khaine, Fyreslayers, Idoneth Deepkin, Kharadron Overlords, Lumineth Realm-lords, Seraphon, Sylvaneth, Blades of Khorne, Disciples of Tzeentch, Hedonites of Slaanesh, Maggotkin of Nurgle, Skaven, Slaves to Darkness, Flesh-eater Courts, Nighthaunt, Ossiarch Bonereapers, Soulblight Gravelords, Gloomspite Gitz, Orruk Warclans, Ogor Mawtribes, Sons of Behemat.
Battleforce boxes $319 each [large-value single-faction box, seasonal — NO paints/tools]. Same faction range as Spearhead.

WARHAMMER: THE OLD WORLD [all NO paints/tools]
- The Old World Core Set $230 [two-army box — Grand Cathay vs Warriors of Chaos, rulebook, mat, templates, dice]
- Old World Army Set: [faction] $230 [single-faction starting army]. Army sets: Kingdom of Bretonnia, Tomb Kings of Khemri.
- Old World faction starter box: [faction] $150 [single-faction box]. Armies: Beastmen Brayherds, Dwarfen Mountain Holds, Empire of Man, Grand Cathay, High Elf Realms, Kingdom of Bretonnia, Orc & Goblin Tribes, Tomb Kings of Khemri, Warriors of Chaos, Wood Elf Realms.

SPECIALIST BOXED GAMES [self-contained; NO paints/tools]
- Kill Team starter box $170 [two squads, terrain, rules]
- Warcry starter box $170 [two warbands, terrain, rules]
- Blood Bowl $99 [two teams, pitch, rules]
- Warhammer Underworlds $75 [two warbands, cards, rules]

PAINTS (Citadel Colour)
- Citadel paint, each $9 (Base / Layer / Dry / Air)
- Citadel Shade (wash), each $9
- Citadel Contrast paint, each $11
- Citadel Technical/Texture paint, each $11
- Faction Paint Set $54 [curated paints for one army]
- Warhammer 40,000 Paints + Tools Set $54 [paints, brush and clippers to start one army]
- Citadel Contrast Paint Set $54

BRUSHES
- Citadel Starter Brush $9
- Citadel Base / Layer / Shade / Dry brush, each $12
- Citadel Fine Detail brush $16
- Citadel Painting Handle $9 ; Painting Handle MkII $18

BUILD TOOLS & GLUE
- Warhammer Tools Set $28 [clippers, mouldline remover, file]
- Citadel Fine Detail Cutters $32
- Citadel Knife $28 ; Mouldline Remover $18
- Plastic glue $11 ; Super glue $11 ; Green Stuff $13

PRIMER & VARNISH (spray)
- Chaos Black / Corax White / Grey Seer / Wraithbone spray, each $28
- Munitorum Varnish spray $28

BASING & EXTRAS
- Citadel Basing selection (sand & grass) $18 ; Citadel Water Pot $9
- Movement Tray set $18 ; Objective markers $28
- Combat gauge & range ruler $18 ; Citadel Dice set $28
- Citadel Project Paint Station $60 ; Citadel Figure Case $85

MAGIC: THE GATHERING
- MTG Starter Kit $30 [two ready-to-play decks + codes]
- Commander Deck $60 ; Prerelease Pack $50
- Play Booster $9 ; Booster Bundle (9) $65 ; Collector Booster $40

POKEMON TCG
- Pokemon Battle Academy $50 [multiplayer intro box]
- Build & Battle Box $35 ; Battle Deck $25
- Elite Trainer Box $70 ; Booster Pack $9 ; Booster Bundle (6) $45

TCG ACCESSORIES
- Deck sleeves (100) $9 ; Deck box $12 ; Playmat $32
- Binder/portfolio (9-pocket) $28 ; Toploaders (25) $12
- Card storage box (400ct) $18 ; Dice & counters set $12

ESSENTIALS GUIDANCE:
- A complete start = minis PLUS paints, a brush, plastic glue and clippers.
- The 40K Introductory Set already includes paints & tools — add only plastic glue if anything; never add a paint set or Tools Set to it.
- A bare Combat Patrol, Battleforce, Spearhead, Old World box, launch box (Armageddon/Skaventide), or specialist boxed game includes none — add a Faction Paint Set (or the Warhammer 40,000 Paints + Tools Set), a Warhammer Tools Set and plastic glue.
- Offer variety: name the faction-specific box (e.g. Combat Patrol: Necrons, Spearhead: Nighthaunt, a faction Battleforce) rather than a generic starter, and suggest a cheaper or bigger option when it helps.
- TCG: core product PLUS deck sleeves at minimum; deck box/playmat only if budget allows.

PRESENTING FINAL BUNDLE(S):
- When — and only when — you recommend specific, final bundle(s), do BOTH: (1) write your short friendly message, and (2) call the \`recommend_bundles\` tool so the app can show each as an itemised order card.
- Usually offer ONE bundle. When it genuinely helps — e.g. the ideal build is over budget, or the customer would benefit from seeing a range — offer 2-3 tiers, cheapest first, each with a short label like "Essentials", "Recommended" and "Complete" (or "Good"/"Better"/"Best").
- In your written message, keep it brief and don't re-list every item/price line-by-line — the cards show those. Do NOT use markdown tables.
- Use exact catalogue names and prices; each bundle's total must equal the sum of price×qty; pass the customer's stated budget (omit it if they gave none); currency is always "SGD".
- While you're still asking questions or not giving a concrete recommendation, do NOT call the tool.
- Never mention the tool, JSON or "order card" in your written message — the app renders the cards separately.`;

// Tool the model calls to hand back one or more structured, itemised bundle
// options alongside its conversational reply. Far more reliable than parsing prose.
const BUNDLE_TOOL = {
  name: "recommend_bundles",
  description:
    "Record the finalised starter bundle option(s) you are recommending so the app can display each as an itemised order card with a reserve button. Call this ONLY when presenting specific, final recommendation(s) — never while still asking questions. Provide one bundle normally, or 2-3 tiers (cheapest first) when offering a range.",
  input_schema: {
    type: "object",
    properties: {
      bundles: {
        type: "array",
        description: "1 to 3 bundle options, cheapest/simplest first.",
        items: {
          type: "object",
          properties: {
            label: { type: "string", description: "Short tier label, e.g. \"Essentials\", \"Recommended\", \"Complete\". Omit for a single bundle." },
            items: {
              type: "array",
              description: "Each product in this bundle, using exact catalogue names and prices.",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  price: { type: "number", description: "Unit price in SGD." },
                  qty: { type: "number", description: "Quantity (default 1)." },
                },
                required: ["name", "price"],
              },
            },
            total: { type: "number", description: "Sum of price×qty across this bundle's items, in SGD." },
          },
          required: ["items", "total"],
        },
      },
      budget: { type: "number", description: "The customer's stated budget in SGD. Omit if none was given." },
      currency: { type: "string", description: "Always \"SGD\"." },
    },
    required: ["bundles"],
  },
};

// Normalise one bundle's raw items/total into the shape the client card expects.
function normalizeOneBundle(raw, budget, currency) {
  if (!raw || !Array.isArray(raw.items)) return null;
  const items = raw.items
    .map((it) => ({ name: String(it.name || "").slice(0, 120), price: Number(it.price) || 0, qty: Number(it.qty) || 1 }))
    .filter((it) => it.name);
  if (!items.length) return null;
  const total = Number(raw.total) || items.reduce((n, it) => n + it.price * it.qty, 0);
  return {
    label: raw.label ? String(raw.label).slice(0, 40) : null,
    items,
    total,
    budget: Number.isFinite(budget) ? budget : null,
    currency: currency || "SGD",
  };
}

// Normalise a recommend_bundles tool input into an array of client bundles.
function normalizeBundles(input) {
  if (!input || !Array.isArray(input.bundles)) return [];
  const budget = input.budget == null ? null : Number(input.budget);
  return input.bundles
    .map((b) => normalizeOneBundle(b, budget, input.currency))
    .filter(Boolean)
    .slice(0, 3);
}

const DEMO_MODE =
  !process.env.ANTHROPIC_API_KEY ||
  process.env.DEMO_MODE === "1" ||
  process.env.DEMO_MODE === "true";

// --- Basic in-memory per-IP rate limit -------------------------------------
// NOTE: serverless instances are ephemeral and NOT shared, so this counter resets
// on cold starts and doesn't coordinate across instances — it blunts casual abuse
// but is not real protection. For real traffic use a shared store (e.g. Upstash).
const RATE_LIMIT = 20; // requests...
const RATE_WINDOW_MS = 60_000; // ...per minute, per IP
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
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

// --- Demo mode: scripted (no-LLM) reply so the prototype runs free ----------
// Returns { text, bundles } — bundles is an array of structured order objects
// (one, or a couple of tiers) when a concrete bundle is recommended, or [] while
// still asking questions.
function demoReply(messages) {
  const users = messages.filter((m) => m.role === "user").map((m) => m.content).join("  ");
  const t = users.toLowerCase();
  const bMatch = t.match(/\$\s*(\d{2,5})/) || t.match(/\b(\d{2,5})\b/);
  const budget = bMatch ? Number(bMatch[1]) : null;
  const note = "\n\n(Demo mode: scripted reply — add an ANTHROPIC_API_KEY for full conversational AI.)";

  const fmt = (items) => items.map(([n, p]) => `• ${n} — $${p}`).join("\n");
  const sum = (items) => items.reduce((n, [, p]) => n + p, 0);
  // Turn [name, price] pairs into the structured bundle the order card renders.
  const bundleOf = (items, label = null) => ({
    label,
    items: items.map(([name, price]) => ({ name, price, qty: 1 })),
    total: sum(items),
    budget: budget ?? null,
    currency: "SGD",
  });

  const g =
    /old world|bretonnia|tomb kings|grand cathay/.test(t) ? "old" :
    /sigmar|stormcast|nighthaunt|skaven|spearhead/.test(t) ? "aos" :
    /40k|40,?000|space marine|\bork|combat patrol|battleforce/.test(t) ? "40k" :
    /magic|mtg|commander/.test(t) ? "mtg" :
    /pok[eé]mon|pokemon/.test(t) ? "pkm" :
    null;

  if (!g) {
    return { text: "Happy to help you get started! Which game are we kitting out — Warhammer 40,000, Age of Sigmar, The Old World, Magic: The Gathering, or Pokémon? And do you have a rough budget in mind?" + note, bundles: [] };
  }
  const label = { "40k": "Warhammer 40,000", aos: "Age of Sigmar", old: "The Old World", mtg: "Magic: The Gathering", pkm: "Pokémon" }[g];
  if (budget == null) {
    return { text: `Great choice — ${label} is a fantastic place to start. Roughly what budget are you working with, and would you like everything needed to paint the models too?` + note, bundles: [] };
  }

  // Trading card games — offer an Essentials tier, plus a Complete tier when it fits.
  if (g === "mtg" || g === "pkm") {
    const core = g === "mtg" ? ["MTG Starter Kit", 30] : ["Pokemon Battle Academy", 50];
    const items = [core, ["Deck sleeves (100)", 9]];
    const total = sum(items);
    if (total > budget) {
      return { text: `The most affordable ${label} starter I'd suggest is about $${total}, just over your $${budget}:\n${fmt(items)}\nStretch a little and you're set — or tell me and I'll trim it.` + note, bundles: [bundleOf(items)] };
    }
    const complete = [...items, ["Deck box", 12]];
    const tiers = [bundleOf(items, "Essentials")];
    if (sum(complete) <= budget) tiers.push(bundleOf(complete, "Complete"));
    return { text: `Here's a solid ${label} starter within your $${budget} budget — everything to start playing. Every bundle is staff-reviewed. Want me to adjust anything?` + note, bundles: tiers };
  }

  // Warhammer — faction-aware, with a range of box options. Faction list comes
  // from the shared catalogue (keyed by full game name).
  const FULLNAME = { "40k": "Warhammer 40,000", aos: "Age of Sigmar", old: "The Old World" };
  const factionList = CATALOGUE_FACTIONS[FULLNAME[g]] || [];
  const faction = factionList.find((f) => t.includes(f.toLowerCase())) || null;
  const fac = faction || "your chosen faction";
  const ess = [["Faction Paint Set", 54], ["Warhammer Tools Set", 28], ["Plastic glue", 11]];
  const essCost = 93;

  // Faction-specific core boxes, cheapest first.
  let cores;
  if (g === "40k") cores = [["Combat Patrol: " + fac, 239], ["Battleforce: " + fac, 319]];
  else if (g === "aos") cores = [["Spearhead: " + fac, 99], ["Battleforce: " + fac, 319]];
  else {
    cores = [[fac + " starter box", 150]];
    if (faction === "Kingdom of Bretonnia" || faction === "Tomb Kings of Khemri") cores.push(["Old World Army Set: " + fac, 230]);
  }

  const bundles = cores.map((c) => ({ core: c, items: [c, ...ess], total: c[1] + essCost }));
  const fit = bundles.filter((b) => b.total <= budget).sort((a, b) => b.total - a.total);

  if (fit.length) {
    const pick = fit[0];
    const pricier = bundles.filter((b) => b.total > pick.total).sort((a, b) => a.total - b.total)[0];
    // Recommended tier that fits, plus a "Complete" bigger-force tier when one exists.
    const tiers = [bundleOf(pick.items, pricier ? "Recommended" : null)];
    if (pricier) tiers.push(bundleOf(pricier.items, "Bigger force"));
    const alt = pricier ? ` I've added a bigger-force option too — it runs over budget but gives you more to paint.` : "";
    return { text: `Here's your ${label} force for ${faction || "your faction"} within your $${budget} budget — the box plus paints, tools and glue to build and paint it.${alt} Every bundle is staff-reviewed. Want me to adjust anything?` + note, bundles: tiers };
  }

  // Nothing fits. For 40K the Introductory Set is a cheap, paints-included entry.
  if (g === "40k") {
    const intro = [["40K Introductory Set", 111], ["Plastic glue", 11]];
    if (sum(intro) <= budget) {
      return { text: `A full ${fac} force runs about $${bundles[0].total} (Combat Patrol + paints & tools), just over your $${budget}. To start within budget, the 40K Introductory Set is ideal — 16 push-fit minis with paints and tools included. Add a Combat Patrol: ${fac} ($239) when you're ready to grow. Want me to adjust anything?` + note, bundles: [bundleOf(intro)] };
    }
  }
  const cheapest = bundles.sort((a, b) => a.total - b.total)[0];
  return { text: `A complete ${label} starter for ${fac} comes to about $${cheapest.total} (${cheapest.core[0]} plus paints, tools and glue), above your $${budget}. Nudge the budget to ~$${cheapest.total}, or I can suggest a smaller box — just say the word.` + note, bundles: [bundleOf(cheapest.items)] };
}

// Fallback: pull a trailing ```bundle / ```json order block out of the AI's reply
// (in case it emits one instead of calling the tool), parse it, and strip it from
// the prose. Supports either a single-bundle object or a {bundles:[...]} object.
function extractBundle(text) {
  const fence = text.match(/```(?:bundle|json)\s*([\s\S]*?)```/i);
  if (!fence) return { reply: text.trim(), bundles: [] };
  try {
    const obj = JSON.parse(fence[1].trim());
    const bundles = Array.isArray(obj.bundles)
      ? normalizeBundles(obj)
      : Array.isArray(obj.items)
        ? normalizeBundles({ bundles: [obj], budget: obj.budget, currency: obj.currency })
        : [];
    if (bundles.length) return { reply: text.replace(fence[0], "").trim(), bundles };
  } catch {
    // Malformed block — fall through and just show the prose.
  }
  return { reply: text.trim(), bundles: [] };
}

// Short message used when the model called the tool but wrote no prose of its own.
function composeFallback(bundles) {
  if (bundles.length > 1) {
    return "Here are a few options I'd recommend — take a look and tell me which you'd like. Every bundle is staff-reviewed before purchase.";
  }
  const b = bundles[0];
  const within = b.budget != null && b.total <= b.budget ? ", comfortably within budget" : "";
  return `Here's a starter bundle I'd recommend — **$${b.total}** in total${within}. Every bundle is staff-reviewed before purchase. Want me to adjust anything?`;
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
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Provide a non-empty messages array." });
      return;
    }
    // Keep only valid user/assistant turns; cap each message and the whole thread.
    const clean = messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
    if (clean.length === 0 || clean[clean.length - 1].role !== "user") {
      res.status(400).json({ error: "The last message must be from the user." });
      return;
    }
    if (clean.reduce((n, m) => n + m.content.length, 0) > 16000) {
      res.status(400).json({ error: "Conversation too long — start a new chat." });
      return;
    }

    // Stream the response as newline-delimited JSON events:
    //   {"type":"text","delta":"…"}   incremental assistant text
    //   {"type":"done","reply":"…","bundles":[…],"demo":bool}   final, canonical
    //   {"type":"error","error":"…"}  failure after streaming began
    res.writeHead(200, {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    });
    const send = (obj) => res.write(JSON.stringify(obj) + "\n");

    // No key / DEMO_MODE: scripted reply in one chunk, no API call, no cost.
    if (DEMO_MODE) {
      const { text, bundles } = demoReply(clean);
      send({ type: "text", delta: text });
      send({ type: "done", reply: text, bundles, demo: true });
      res.end();
      return;
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001", // lower cost per call; verify current IDs at the docs link in README.
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: clean,
      tools: [BUNDLE_TOOL],
    });

    let acc = "";
    stream.on("text", (delta) => {
      acc += delta;
      send({ type: "text", delta });
    });

    const final = await stream.finalMessage();
    const blocks = final.content || [];
    const toolUse = blocks.find((b) => b.type === "tool_use" && b.name === "recommend_bundles");

    // Prefer the structured tool call; fall back to a fenced block if the model
    // put one in prose. extractBundle also strips any stray fence from the text.
    let { reply, bundles } = extractBundle(acc);
    if (toolUse) bundles = normalizeBundles(toolUse.input);
    if (!reply && bundles.length) reply = composeFallback(bundles);

    // Canonical final text (fence-stripped / fallback) — client replaces the
    // streamed text with this on done.
    send({ type: "done", reply: reply || "…", bundles, demo: false });
    res.end();
  } catch (e) {
    // If we haven't started streaming yet, a normal JSON error; otherwise emit an
    // error event on the open stream.
    if (res.headersSent) {
      res.write(JSON.stringify({ type: "error", error: "Generation failed. Check the server logs and your ANTHROPIC_API_KEY." }) + "\n");
      res.end();
    } else {
      res.status(500).json({ error: "Generation failed. Check the server logs and your ANTHROPIC_API_KEY." });
    }
  }
}
