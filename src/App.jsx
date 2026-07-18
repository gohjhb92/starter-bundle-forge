import { useState } from "react";
import { Hammer, ArrowRight, ScrollText, ShieldCheck, TriangleAlert, Coins, Loader } from "lucide-react";

// value is what we send to the model (must match the catalogue wording in api/bundle.js);
// label is what the shopkeeper sees; faction is the placeholder hint for the interest field.
const GAMES = [
  { value: "Warhammer 40,000", label: "Warhammer 40,000 (11th Ed.)", faction: "e.g. Space Marines, Orks — or leave blank", stocked: true },
  { value: "Age of Sigmar", label: "Warhammer: Age of Sigmar", faction: "e.g. Stormcast Eternals — or leave blank", stocked: true },
  { value: "The Old World", label: "Warhammer: The Old World", faction: "e.g. Empire, Orcs & Goblins — or leave blank", stocked: true },
  { value: "Magic: The Gathering", label: "Magic: The Gathering", faction: "e.g. a colour or archetype — or leave blank", stocked: true },
  { value: "Pokémon TCG", label: "Pokémon TCG", faction: "e.g. a favourite Pokémon — or leave blank", stocked: true },
  { value: "Not sure yet", label: "Not sure yet", faction: "Tell us what they enjoy", stocked: true },
];

const PRESETS = [
  { label: "40k Space Marines · $150", game: "Warhammer 40,000", faction: "Space Marines", budget: "150" },
  { label: "Magic · under $50", game: "Magic: The Gathering", faction: "", budget: "50" },
  { label: "Old World · $150", game: "The Old World", faction: "", budget: "150" },
  { label: "Vague 40k ask", game: "Warhammer 40,000", faction: "", budget: "" },
];

const FIELD =
  "mt-2 w-full rounded-sm border border-stone-700 bg-stone-100 px-4 py-3 text-base text-stone-900 placeholder:text-stone-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50";
const LABEL = "text-xs font-semibold uppercase tracking-widest text-stone-400";

export default function App() {
  const [game, setGame] = useState("");
  const [faction, setFaction] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [demo, setDemo] = useState(false);

  const selected = GAMES.find((g) => g.value === game);

  function buildRequest() {
    const parts = [];
    parts.push(game === "Not sure yet" ? "I'm not sure which game to start." : `I want to start ${game}.`);
    if (faction.trim()) parts.push(`I'm interested in ${faction.trim()}.`);
    parts.push(budget ? `My budget is around $${budget}.` : "I haven't settled on a budget yet.");
    if (notes.trim()) parts.push(notes.trim());
    return parts.join(" ");
  }

  async function assemble() {
    if (!game || loading) return;
    setLoading(true); setError(null); setResult(null); setDemo(false);
    try {
      const res = await fetch("/api/bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: buildRequest() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't reach the catalogue. Try again in a moment.");
        return;
      }
      const clean = String(data.raw || "").replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(clean);
      setDemo(Boolean(data.demo));
      setResult(parsed);
    } catch (e) {
      setError("Couldn't read a bundle back. Try again, or adjust the game and budget.");
    } finally {
      setLoading(false);
    }
  }

  function loadPreset(p) {
    setGame(p.game); setFaction(p.faction); setBudget(p.budget);
    setResult(null); setError(null);
  }
  function onKey(e) { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") assemble(); }

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-stone-200 font-sans">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="flex items-center gap-3 border-b border-amber-900 pb-5">
          <div className="grid h-11 w-11 place-items-center rounded-sm bg-amber-600 text-neutral-950 shadow-inner">
            <Hammer size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-amber-500">Bastion Wargames · Singapore</div>
            <h1 className="font-serif text-2xl font-bold leading-tight text-stone-100">The Quartermaster</h1>
          </div>
          <div className="ml-auto hidden text-right text-xs uppercase tracking-widest text-stone-500 sm:block">Beginner<br />bundle builder</div>
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="game">Game system</label>
            <select
              id="game" value={game} onKeyDown={onKey}
              onChange={(e) => { setGame(e.target.value); setResult(null); setError(null); }}
              className={FIELD}
            >
              <option value="" disabled>Choose a game…</option>
              {GAMES.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL} htmlFor="faction">Faction / interest <span className="font-normal normal-case tracking-normal text-stone-500">(optional)</span></label>
                <input
                  id="faction" value={faction} disabled={!game} onKeyDown={onKey}
                  onChange={(e) => setFaction(e.target.value)}
                  placeholder={selected ? selected.faction : "Pick a game first"}
                  className={FIELD}
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="budget">Budget SGD <span className="font-normal normal-case tracking-normal text-stone-500">(optional)</span></label>
                <input
                  id="budget" type="number" min="0" inputMode="numeric" value={budget} onKeyDown={onKey}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 150"
                  className={FIELD}
                />
              </div>
            </div>

            <label className={`${LABEL} mt-4 block`} htmlFor="notes">Anything else? <span className="font-normal normal-case tracking-normal text-stone-500">(optional)</span></label>
            <textarea
              id="notes" value={notes} onKeyDown={onKey} rows={2}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. it's a gift for a 12-year-old who wants to paint too"
              className={`${FIELD} resize-none leading-relaxed`}
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {PRESETS.map((p, i) => (
                <button key={i} onClick={() => loadPreset(p)}
                  className="rounded-full border border-stone-700 px-3 py-1 text-xs text-stone-300 transition hover:border-amber-500 hover:text-amber-400">{p.label}</button>
              ))}
            </div>

            {selected && !selected.stocked && (
              <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-amber-500/90">
                <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                <span>{selected.value} isn’t stocked in the current catalogue, so you’ll get a “staff to advise” draft rather than a full bundle.</span>
              </p>
            )}

            <button onClick={assemble} disabled={loading || !game}
              className="mt-4 inline-flex items-center gap-2 rounded-sm bg-amber-600 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-neutral-950 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40">
              {loading ? <Loader size={16} className="animate-spin" /> : <ArrowRight size={16} strokeWidth={2.6} />}
              {loading ? "Consulting the catalogue" : "Assemble bundle"}
            </button>
            <p className="mt-2 text-xs text-stone-600">Tip: ⌘/Ctrl + Enter to assemble.</p>
          </div>

          <div className="rounded-sm bg-stone-100 text-stone-900 shadow-2xl ring-1 ring-neutral-900">
            <div className="flex items-center gap-2 border-b border-stone-300 px-4 py-3">
              <ScrollText size={15} className="text-stone-500" />
              <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">Requisition</span>
              {demo && (
                <span className="ml-auto rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-800">Demo · no AI</span>
              )}
            </div>
            <div className="px-4 py-4">
              {!result && !loading && !error && (
                <div className="py-14 text-center">
                  <ScrollText size={30} className="mx-auto text-stone-300" />
                  <p className="mt-3 text-sm text-stone-500">Awaiting requisition.</p>
                  <p className="text-xs text-stone-400">Choose a game, then assemble.</p>
                </div>
              )}
              {loading && (
                <div className="animate-pulse py-14 text-center">
                  <Loader size={26} className="mx-auto animate-spin text-amber-600" />
                  <p className="mt-3 text-sm text-stone-500">Reading the catalogue…</p>
                </div>
              )}
              {error && !loading && (
                <div className="py-10 text-center">
                  <TriangleAlert size={26} className="mx-auto text-amber-700" />
                  <p className="mt-3 px-3 text-sm text-stone-700">{error}</p>
                </div>
              )}
              {result && !loading && (
                <div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <Meta label="Hobby" value={result.hobby} />
                    <Meta label="Interest" value={result.interest} />
                    <Meta label="Budget" value={result.budget != null ? `$${result.budget}` : "—"} />
                  </div>
                  <div className="mt-4">
                    {Array.isArray(result.items) && result.items.length > 0 ? (
                      result.items.map((it, i) => (
                        <div key={i} className="flex items-baseline py-1.5 text-base">
                          <span className="text-stone-800">{it.name}</span>
                          <span className="mx-2 flex-1 self-center border-b border-dotted border-stone-400" />
                          <span className="font-mono tabular-nums text-stone-900">${it.price}</span>
                        </div>
                      ))
                    ) : (
                      <p className="py-2 text-sm italic text-stone-500">No bundle assembled — see note below.</p>
                    )}
                  </div>
                  {Array.isArray(result.items) && result.items.length > 0 && (
                    <div className={`mt-3 flex items-center justify-between rounded-sm px-3 py-3 ${result.withinBudget ? "bg-emerald-900 text-emerald-50" : "bg-amber-800 text-amber-50"}`}>
                      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"><Coins size={14} /> Sanctioned total</span>
                      <span className="font-mono text-lg font-bold tabular-nums">${result.total}</span>
                    </div>
                  )}
                  <div className="mt-4 flex items-start gap-3">
                    <Seal status={result.status} />
                    <p className="flex-1 pt-1 text-sm leading-relaxed text-stone-700">{result.note}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="mt-8 border-t border-stone-800 pt-4 text-center text-xs text-stone-600">
          Prototype on a synthetic catalogue · prices in SGD · reflects Warhammer 40k 11th Edition (Jul 2026) · every bundle is staff-reviewed before it reaches a customer
        </p>
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">{label}</div>
      <div className="font-medium text-stone-900">{value}</div>
    </div>
  );
}

function Seal({ status }) {
  const ready = status === "ready";
  return (
    <div style={{ transform: "rotate(-7deg)" }}
      className={`grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 text-center ${ready ? "border-emerald-700 text-emerald-800" : "border-amber-700 text-amber-800"}`}>
      <div>
        {ready ? <ShieldCheck size={16} className="mx-auto" /> : <TriangleAlert size={16} className="mx-auto" />}
        <div className="mt-1 text-xs font-bold uppercase leading-none">{ready ? "Ready" : "Draft"}</div>
      </div>
    </div>
  );
}
