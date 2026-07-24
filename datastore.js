// Durable-store helpers shared by the serverless functions. Uses Upstash Redis
// over its REST API when configured, otherwise degrades to per-instance in-memory
// state. Kept at the project root (not under /api) so Vercel doesn't route it.
//
// In-memory fallback is fine for local dev and low traffic, but is NOT shared
// across serverless instances and resets on cold starts — set the two Upstash
// env vars in production for a real, shared rate limit and a persistent log:
//   UPSTASH_REDIS_REST_URL   e.g. https://xxx.upstash.io
//   UPSTASH_REDIS_REST_TOKEN
// Create a free Redis database at https://upstash.com and copy its REST creds.

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export function upstashEnabled() {
  return Boolean(REST_URL && REST_TOKEN);
}

// Run one Redis command via the Upstash REST API, e.g. redis(["INCR", key]).
async function redis(command) {
  const res = await fetch(REST_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

// --- Rate limiting ---------------------------------------------------------
// In-memory fixed-window fallback (per instance).
const memHits = new Map();
function memRateLimit(ip, limit, windowMs) {
  const now = Date.now();
  if (memHits.size > 5000) {
    for (const [k, rec] of memHits) if (now > rec.resetAt) memHits.delete(k);
  }
  const rec = memHits.get(ip);
  if (!rec || now > rec.resetAt) {
    memHits.set(ip, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfter: 0 };
  }
  rec.count += 1;
  return { limited: rec.count > limit, retryAfter: Math.ceil((rec.resetAt - now) / 1000) };
}

// Returns { limited, retryAfter }. Uses Upstash when configured so the limit is
// shared across all serverless instances; falls back to in-memory on any error.
export async function rateLimit(ip, limit, windowSec) {
  if (upstashEnabled()) {
    try {
      const bucket = Math.floor(Date.now() / 1000 / windowSec);
      const key = `rl:${ip}:${bucket}`;
      const count = await redis(["INCR", key]);
      if (count === 1) await redis(["EXPIRE", key, windowSec]);
      const retryAfter = windowSec - (Math.floor(Date.now() / 1000) % windowSec);
      return { limited: count > limit, retryAfter };
    } catch {
      // Upstash unreachable — fail open to the in-memory limiter rather than
      // blocking legitimate traffic.
    }
  }
  return memRateLimit(ip, limit, windowSec * 1000);
}

// --- Query log -------------------------------------------------------------
const LOG_KEY = "quartermaster:log";
const LOG_CAP = 500;
const memLog = []; // per-instance fallback ring buffer

// Record one completed turn. Fire-and-forget friendly; never throws.
export async function logQuery(entry) {
  const rec = JSON.stringify({ t: Date.now(), ...entry });
  if (upstashEnabled()) {
    try {
      await redis(["LPUSH", LOG_KEY, rec]);
      await redis(["LTRIM", LOG_KEY, "0", String(LOG_CAP - 1)]);
      return;
    } catch {
      // fall through to in-memory
    }
  }
  memLog.unshift(rec);
  if (memLog.length > LOG_CAP) memLog.length = LOG_CAP;
}

// Read the most recent n log entries (newest first).
export async function readLog(n = 100) {
  const count = Math.min(LOG_CAP, Math.max(1, n));
  let raw = [];
  if (upstashEnabled()) {
    try {
      raw = (await redis(["LRANGE", LOG_KEY, "0", String(count - 1)])) || [];
    } catch {
      raw = memLog.slice(0, count);
    }
  } else {
    raw = memLog.slice(0, count);
  }
  return raw.map((s) => {
    try {
      return JSON.parse(s);
    } catch {
      return { raw: s };
    }
  });
}
