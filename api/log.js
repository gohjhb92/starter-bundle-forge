import { readLog, upstashEnabled } from "../datastore.js";

// Read the store's query log: GET /api/log?token=<LOG_TOKEN>&n=100
//
// Default-deny: if LOG_TOKEN isn't set the endpoint doesn't exist at all, so a
// deployment can never leak the log by accident. Set LOG_TOKEN (a long random
// string) in your Vercel env vars to switch it on.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const token = process.env.LOG_TOKEN;
  if (!token) {
    res.status(404).json({ error: "Query log is disabled. Set LOG_TOKEN to enable it." });
    return;
  }

  // req.query is provided by Vercel's Node helper; parse the URL as a fallback.
  const query = req.query || Object.fromEntries(new URL(req.url, "http://localhost").searchParams);
  if (String(query.token || "") !== token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const n = Math.min(500, Math.max(1, Number(query.n) || 100));
  try {
    const entries = await readLog(n);
    res.status(200).json({
      count: entries.length,
      persistent: upstashEnabled(),
      entries,
    });
  } catch (e) {
    res.status(500).json({ error: "Could not read the query log." });
  }
}
