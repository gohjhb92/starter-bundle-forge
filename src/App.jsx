import { useState, useRef, useEffect } from "react";
import { Hammer, Send, Loader, Sparkles } from "lucide-react";

const GREETING =
  "Welcome to Bastion Wargames — I'm the Quartermaster. Tell me who I'm kitting out: which game (Warhammer 40,000, Age of Sigmar, The Old World, Magic, Pokémon…), any faction or theme they fancy, and a rough budget. New to the hobby? I'll make sure you leave with everything needed to build and paint.";

const SUGGESTIONS = [
  "My son wants to start 40k Space Marines, budget ~$150",
  "I want to get into Magic with friends, under $50",
  "A complete Old World Empire army to paint, around $250",
  "What do I need to start Age of Sigmar?",
];

export default function App() {
  const [messages, setMessages] = useState([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [demo, setDemo] = useState(false);
  const logRef = useRef(null);
  const taRef = useRef(null);

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
        // Drop the client-side greeting (index 0) so the thread starts with the user.
        body: JSON.stringify({ messages: next.slice(1) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setDemo(Boolean(data.demo));
      setMessages((m) => [...m, { role: "assistant", content: String(data.reply || "…") }]);
    } catch (e) {
      setError("Couldn't reach the Quartermaster. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

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
            <Bubble key={i} role={m.role} content={m.content} />
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

        {/* Composer */}
        <div className="flex items-end gap-2 rounded-sm border border-stone-700 bg-stone-100 p-2 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500">
          <textarea
            ref={taRef}
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
          Prototype on a synthetic catalogue · prices in SGD · every bundle is staff-reviewed before it reaches a customer
        </p>
      </div>
    </div>
  );
}

function Bubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-2.5 text-sm leading-relaxed shadow ${
          isUser
            ? "rounded-br-sm bg-amber-600 text-neutral-950"
            : "rounded-bl-sm bg-stone-100 text-stone-800"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
