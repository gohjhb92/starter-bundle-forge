import { useState, useRef, useEffect } from "react";
import { Hammer, Send, Loader, Sparkles, Wand2, ShoppingBag, MessageCircle, Mail } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { GAMES, FACTIONS, STORE } from "../catalogue.js";

const GREETING =
  "Welcome to Bastion Wargames — I'm the Quartermaster. Tell me who I'm kitting out: which game (Warhammer 40,000, Age of Sigmar, The Old World, Magic, Pokémon…), any faction or theme they fancy, and a rough budget. New to the hobby? I'll make sure you leave with everything needed to build and paint.";

const SUGGESTIONS = [
  "My son wants to start 40k Space Marines, budget ~$150",
  "Get into Magic: The Gathering with friends, under $50",
  "A Pokémon TCG starter for a 9-year-old, around $60",
  "A complete Old World Empire army to paint, around $250",
  "What do I need to start Age of Sigmar?",
];

export default function App() {
  const [messages, setMessages] = useState([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [demo, setDemo] = useState(false);
  // Quick-pick state
  const [game, setGame] = useState("");
  const [faction, setFaction] = useState("");
  const [budget, setBudget] = useState("");
  const logRef = useRef(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(1) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setDemo(Boolean(data.demo));
      setMessages((m) => [...m, { role: "assistant", content: String(data.reply || "…"), bundle: data.bundle || null }]);
    } catch (e) {
      setError("Couldn't reach the Quartermaster. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function askFromPicks() {
    if (!game) return;
    const parts = [];
    parts.push(game === "Not sure yet" ? "I'm not sure which game to start" : `I'd like to start ${game}`);
    if (faction) parts.push(`interested in ${faction}`);
    if (budget) parts.push(`budget around $${budget}`);
    send(parts.join(", ") + ".");
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const factions = game ? FACTIONS[game] || [] : [];

  return (
    <div className="flex min-h-screen w-full flex-col bg-neutral-950 text-stone-200 font-sans">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-amber-900 pb-4">
          <div className="grid h-11 w-11 place-items-center rounded-sm bg-amber-600 text-neutral-950 shadow-inner">
            <Hammer size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-amber-500">Bastion Wargames · Singapore</div>
            <h1 className="font-serif text-2xl font-bold leading-tight text-stone-100">The Quartermaster</h1>
          </div>
          {demo && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-200 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-800">
              <Sparkles size={11} /> Demo · no AI
            </span>
          )}
        </div>

        {/* Chat log */}
        <div ref={logRef} className="flex-1 space-y-4 overflow-y-auto py-6">
          {messages.map((m, i) => (
            <div key={i} className="space-y-2">
              <Bubble role={m.role} content={m.content} />
              {m.role === "assistant" && m.bundle && <BundleCard bundle={m.bundle} />}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Loader size={15} className="animate-spin text-amber-500" />
              <span>The Quartermaster is checking the catalogue…</span>
            </div>
          )}
          {error && !loading && (
            <div className="rounded-sm border border-amber-800 bg-amber-950/40 px-3 py-2 text-sm text-amber-300">{error}</div>
          )}
        </div>

        {/* Suggestions (only before the first user turn) */}
        {messages.length === 1 && !loading && (
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s)}
                className="rounded-full border border-stone-700 px-3 py-1.5 text-xs text-stone-300 transition hover:border-amber-500 hover:text-amber-400"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Quick-pick dropdowns */}
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-sm border border-stone-800 bg-neutral-900/60 p-2">
          <span className="px-1 text-[10px] font-semibold uppercase tracking-widest text-stone-500">Quick pick</span>
          <select
            value={game}
            onChange={(e) => { setGame(e.target.value); setFaction(""); }}
            className="rounded-sm border border-stone-700 bg-stone-100 px-2 py-1.5 text-sm text-stone-900 focus:border-amber-500 focus:outline-none"
          >
            <option value="">Game…</option>
            {GAMES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select
            value={faction}
            onChange={(e) => setFaction(e.target.value)}
            disabled={!game || factions.length === 0}
            className="rounded-sm border border-stone-700 bg-stone-100 px-2 py-1.5 text-sm text-stone-900 focus:border-amber-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">{game && factions.length ? "Faction (optional)" : "Faction"}</option>
            {factions.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <div className="flex items-center rounded-sm border border-stone-700 bg-stone-100 px-2">
            <span className="text-sm text-stone-500">$</span>
            <input
              type="number"
              min="0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Budget"
              className="w-20 bg-transparent px-1 py-1.5 text-sm text-stone-900 placeholder:text-stone-500 focus:outline-none"
            />
          </div>
          <button
            onClick={askFromPicks}
            disabled={loading || !game}
            className="inline-flex items-center gap-1.5 rounded-sm bg-amber-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-950 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Wand2 size={14} /> Ask
          </button>
        </div>

        {/* Composer */}
        <div className="flex items-end gap-2 rounded-sm border border-stone-700 bg-stone-100 p-2 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder="Describe the game, faction and budget…"
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-base leading-relaxed text-stone-900 placeholder:text-stone-500 focus:outline-none"
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-amber-600 text-neutral-950 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : <Send size={18} strokeWidth={2.4} />}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-stone-600">
          Prototype · rough SGD price estimates · every bundle is staff-reviewed before it reaches a customer
        </p>
      </div>
    </div>
  );
}

// Render the assistant's markdown (bold, bullet/numbered lists) with styles that
// fit the chat bubble. User messages stay plain text — they're not markdown.
const MD_COMPONENTS = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-stone-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-0.5 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-0.5 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-snug">{children}</li>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-amber-700 underline">
      {children}
    </a>
  ),
  code: ({ children }) => <code className="rounded bg-stone-200 px-1 py-0.5 text-[13px]">{children}</code>,
};

function Bubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm leading-relaxed shadow ${
          isUser
            ? "whitespace-pre-wrap rounded-br-sm bg-amber-600 text-neutral-950"
            : "rounded-bl-sm bg-stone-100 text-stone-800"
        }`}
      >
        {isUser ? (
          content
        ) : (
          <ReactMarkdown components={MD_COMPONENTS}>{content}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}

const fmtMoney = (n) => `$${Number(n || 0).toLocaleString()}`;

// Pre-filled enquiry the customer sends to reserve the bundle at the store.
function buildReserveText(bundle) {
  const lines = bundle.items.map(
    (it) => `• ${it.name}${it.qty > 1 ? ` ×${it.qty}` : ""} — ${fmtMoney(it.price * it.qty)}`
  );
  const budgetNote = bundle.budget != null ? ` (budget ${fmtMoney(bundle.budget)})` : "";
  return [
    `Hi ${STORE.name}, I'd like to reserve this starter bundle:`,
    "",
    ...lines,
    "",
    `Total: ${fmtMoney(bundle.total)}${budgetNote}`,
    "",
    "Name:",
    "Preferred pickup date:",
  ].join("\n");
}

// Structured order card: itemised bundle, total, budget bar, and reserve actions.
function BundleCard({ bundle }) {
  const { items, total, budget, currency } = bundle;
  const over = budget != null && total > budget;
  const pct = budget ? Math.min(100, Math.round((total / budget) * 100)) : null;
  const text = buildReserveText(bundle);
  const waHref = STORE.whatsapp ? `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}` : null;
  const mailHref = `mailto:${STORE.email}?subject=${encodeURIComponent(
    `Bundle reservation — ${STORE.name}`
  )}&body=${encodeURIComponent(text)}`;

  return (
    <div className="max-w-[85%] rounded-lg border border-stone-700 bg-neutral-900/80 p-4 text-sm shadow">
      <div className="mb-2 flex items-center gap-2 text-amber-500">
        <ShoppingBag size={15} />
        <span className="text-[11px] font-semibold uppercase tracking-widest">Your bundle</span>
        <span className="ml-auto text-[10px] font-medium uppercase tracking-wide text-stone-500">{currency}</span>
      </div>

      <ul className="divide-y divide-stone-800">
        {items.map((it, i) => (
          <li key={i} className="flex items-baseline gap-2 py-1.5">
            <span className="flex-1 text-stone-200">
              {it.name}
              {it.qty > 1 && <span className="text-stone-500"> ×{it.qty}</span>}
            </span>
            <span className="tabular-nums text-stone-300">{fmtMoney(it.price * it.qty)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-baseline gap-2 border-t border-stone-700 pt-2">
        <span className="flex-1 font-semibold text-stone-100">Total</span>
        <span className="tabular-nums text-lg font-bold text-amber-400">{fmtMoney(total)}</span>
      </div>

      {budget != null && (
        <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-800">
            <div
              className={`h-full rounded-full ${over ? "bg-red-500" : "bg-emerald-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className={`mt-1 text-[11px] ${over ? "text-red-400" : "text-emerald-400"}`}>
            {over
              ? `${fmtMoney(total - budget)} over your ${fmtMoney(budget)} budget`
              : `${fmtMoney(budget - total)} under your ${fmtMoney(budget)} budget`}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-sm bg-amber-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-950 transition hover:bg-amber-500"
          >
            <MessageCircle size={14} /> Reserve via WhatsApp
          </a>
        )}
        <a
          href={mailHref}
          className="inline-flex items-center gap-1.5 rounded-sm border border-stone-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-stone-200 transition hover:border-amber-500 hover:text-amber-400"
        >
          <Mail size={14} /> Reserve by email
        </a>
      </div>
      <p className="mt-2 text-[11px] text-stone-500">
        Opens a pre-filled message — staff confirm stock and price before payment.
      </p>
    </div>
  );
}
