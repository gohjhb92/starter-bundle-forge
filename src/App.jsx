import { useState, useRef } from "react";
import { Hammer, ArrowRight, ScrollText, ShieldCheck, TriangleAlert, Coins, Loader } from "lucide-react";

const EXAMPLES = [
  { label: "Space Marines · $150", text: "Hi, my son wants to get into Warhammer 40k and he likes the Space Marines. We've got a budget of around $150. What should we get to start?" },
  { label: "Magic · under $50", text: "I've never played Magic but a few friends do and I want to join in. What do I actually need to start? Trying to keep it under $50." },
  { label: "Old World (not stocked)", text: "Do you have a starter set for Warhammer: The Old World? I've got about $150 to spend." },
  { label: "Vague 40k ask", text: "hey what do i need to start 40k" },
];

export default function App() {
  const [request, setRequest] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const areaRef = useRef(null);

  async function assemble() {
    const text = request.trim();
    if (!text || loading) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: text }),
      });
      if (!res.ok) throw new Error("request-failed");
      const data = await res.json();
      const clean = String(data.raw || "").replace(/```json/gi, "").replace(/```/g, "").trim();
      setResult(JSON.parse(clean));
    } catch (e) {
      setError("Couldn't read a bundle back. Try again, or rephrase the request with a game and a budget.");
    } finally {
      setLoading(false);
    }
  }

  function loadExample(t) { setRequest(t); setResult(null); setError(null); areaRef.current && areaRef.current.focus(); }
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
            <label className="text-xs font-semibold uppercase tracking-widest text-stone-400">Recruit's request</label>
            <textarea
              ref={areaRef} value={request} onChange={e => setRequest(e.target.value)} onKeyDown={onKey} rows={5}
              placeholder={'Paste what the customer said — their game and their budget. e.g. "Want to start 40k Space Marines, budget around $150."'}
              className="mt-2 w-full resize-none rounded-sm border border-stone-700 bg-stone-100 px-4 py-3 text-base leading-relaxed text-stone-900 placeholder:text-stone-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((ex, i) => (
                <button key={i} onClick={() => loadExample(ex.text)}
                  className="rounded-full border border-stone-700 px-3 py-1 text-xs text-stone-300 transition hover:border-amber-500 hover:text-amber-400">{ex.label}</button>
              ))}
            </div>
            <button onClick={assemble} disabled={loading || !request.trim()}
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
            </div>
            <div className="px-4 py-4">
              {!result && !loading && !error && (
                <div className="py-14 text-center">
                  <ScrollText size={30} className="mx-auto text-stone-300" />
                  <p className="mt-3 text-sm text-stone-500">Awaiting requisition.</p>
                  <p className="text-xs text-stone-400">Enter a request or pick an example.</p>
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
