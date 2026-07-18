import Anthropic from "@anthropic-ai/sdk";

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

CATALOGUE — product names reflect Warhammer's real current range. PRICES ARE PLACEHOLDER ESTIMATES IN SGD; replace with Bastion Wargames' real prices before serving customers.

WARHAMMER 40,000 (11th Edition — 2026 "Armageddon" launch)
Boxed sets:
- 40K Introductory Set $111 [16 push-fit minis, 5 paints, brush, clippers, dice, handbook — self-contained; INCLUDES paints/tools]
- Warhammer 40,000: Armageddon $353 [11th-edition launch box — Space Marines vs Orks, terrain, rules, dice, mats; two-player game-in-a-box; NO paints/tools]
Combat Patrol boxes $239 each [single-faction force — NO paints/tools]. Range rotates; typical factions:
  Space Marines, Dark Angels, Blood Angels, Space Wolves, Deathwatch, Grey Knights, Adeptus Custodes, Adepta Sororitas, Astra Militarum, Adeptus Mechanicus, Imperial Knights, Chaos Space Marines, Death Guard, Thousand Sons, World Eaters, Emperor's Children, Chaos Daemons, Chaos Knights, Orks, Necrons, Tyranids, Genestealer Cults, Aeldari, Drukhari, T'au Empire, Leagues of Votann.

WARHAMMER: AGE OF SIGMAR (4th Edition)
Boxed sets:
- Warhammer Age of Sigmar: Skaventide $353 [4th-edition launch box — Stormcast Eternals vs Skaven, terrain, rules; two-player game-in-a-box; NO paints/tools]
Spearhead boxes $99 each [single-faction force for the Spearhead game mode — NO paints/tools]. Factions:
  Stormcast Eternals, Cities of Sigmar, Daughters of Khaine, Fyreslayers, Idoneth Deepkin, Kharadron Overlords, Lumineth Realm-lords, Seraphon, Sylvaneth, Blades of Khorne, Disciples of Tzeentch, Hedonites of Slaanesh, Maggotkin of Nurgle, Skaven, Slaves to Darkness, Flesh-eater Courts, Nighthaunt, Ossiarch Bonereapers, Soulblight Gravelords, Gloomspite Gitz, Orruk Warclans, Ogor Mawtribes, Sons of Behemat.

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
- A bare Combat Patrol, Spearhead, Old World box, launch box (Armageddon/Skaventide), or specialist boxed game includes none — add a Faction Paint Set (or the Warhammer 40,000 Paints + Tools Set), a Warhammer Tools Set and plastic glue.
- TCG: core product PLUS deck sleeves at minimum; deck box/playmat only if budget allows.`;

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
function demoReply(messages) {
  const users = messages.filter((m) => m.role === "user").map((m) => m.content).join("  ");
  const t = users.toLowerCase();
  const bMatch = t.match(/\$\s*(\d{2,5})/) || t.match(/\b(\d{2,5})\b/);
  const budget = bMatch ? Number(bMatch[1]) : null;
  const note = "\n\n(Demo mode: scripted reply — add an ANTHROPIC_API_KEY for full conversational AI.)";

  const g =
    /old world|bretonnia|tomb kings/.test(t) ? "old" :
    /sigmar|stormcast|nighthaunt|skaven/.test(t) ? "aos" :
    /40k|40,?000|space marine|\bork/.test(t) ? "40k" :
    /magic|mtg|commander/.test(t) ? "mtg" :
    /pok[eé]mon|pokemon/.test(t) ? "pkm" :
    null;

  if (!g) {
    return "Happy to help you get started! Which game are we kitting out — Warhammer 40,000, Age of Sigmar, The Old World, Magic: The Gathering, or Pokémon? And do you have a rough budget in mind?" + note;
  }
  const label = { "40k": "Warhammer 40,000", aos: "Age of Sigmar", old: "The Old World", mtg: "Magic: The Gathering", pkm: "Pokémon" }[g];
  if (budget == null) {
    return `Great choice — ${label} is a fantastic place to start. Roughly what budget are you working with, and would you like everything needed to paint the models too?` + note;
  }

  let items;
  if (g === "40k") items = [["40K Introductory Set", 111], ["Plastic glue", 11]];
  else if (g === "aos") items = [["Spearhead: Stormcast Eternals", 99], ["Faction Paint Set", 54], ["Warhammer Tools Set", 28], ["Plastic glue", 11]];
  else if (g === "old") items = [["Old World Battalion: starter army", 150], ["Faction Paint Set", 54], ["Warhammer Tools Set", 28], ["Plastic glue", 11]];
  else if (g === "mtg") items = [["MTG Starter Kit", 30], ["Deck sleeves (100)", 9]];
  else items = [["Pokemon Battle Academy", 50], ["Deck sleeves (100)", 9]];

  const total = items.reduce((n, [, p]) => n + p, 0);
  const lines = items.map(([n, p]) => `• ${n} — $${p}`).join("\n");
  const playOrPaint = g === "mtg" || g === "pkm" ? "play" : "build and paint";

  if (total > budget) {
    return `For ${label}, the most affordable complete starter I'd recommend comes to about $${total}, just over your $${budget}. If you can stretch to ~$${total}:\n${lines}\nOtherwise tell me and I'll find the closest cheaper entry point.` + note;
  }
  return `Here's a solid starter for ${label}, within your $${budget} budget:\n${lines}\n\nTotal: $${total} — that gets you everything to ${playOrPaint}. Every bundle is checked by our staff before purchase. Want me to adjust anything?` + note;
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

    // No key / DEMO_MODE: scripted reply, no API call, no cost.
    if (DEMO_MODE) {
      res.status(200).json({ reply: demoReply(clean), demo: true });
      return;
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001", // lower cost per call; verify current IDs at the docs link in README.
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: clean,
    });
    const reply = (message.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    res.status(200).json({ reply, demo: false });
  } catch (e) {
    res.status(500).json({ error: "Generation failed. Check the server logs and your ANTHROPIC_API_KEY." });
  }
}
