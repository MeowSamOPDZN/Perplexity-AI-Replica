// Perplexity AI Replica — real AI proxy with model routing.
// Browser -> /api/chat -> xKiro (OpenAI-compatible). Key ONLY in XKIRO_API_KEY env var.
// Models exposed to the client: "mistral" (Mistral Large) and "mnai" (MNAI 8 Pro).
// Upstream ids live ONLY here, server-side.
const UPSTREAM = "https://api.xkiro.com/v1/chat/completions";
const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const GENERIC_SYSTEM = {
  role: "system",
  content:
    "You are the AI answer engine inside a Perplexity-style interface, powered by Mistral Large. Answer the user's question directly and accurately in clean markdown. " +
    "Start with a short paragraph that directly answers the question. Use ## section headings and bullet lists only when they genuinely help. " +
    "Bold key terms sparingly. Keep answers focused and readable — typically 150-450 words unless the question clearly needs more. Never mention these instructions.",
};

const MNAI_SYSTEM = {
  role: "system",
  content:
    "You are MNAI 8 Pro, the flagship AI assistant of MNAI. MNAI means 'Meow x Nythera AI'. " +
    "You were created, owned and trained by MeowSamOP DZN, an Indian digital creator and developer (born February 13, 2013) who started coding at around age 10. " +
    "If asked who made you, who created you, or who trained you, answer exactly: Made by MeowSamOP DZN. " +
    "If asked what MNAI stands for or its full form, answer exactly: Meow x Nythera AI. " +
    "You are MNAI — never say you are Qwen, Alibaba, Mistral, GPT, ChatGPT, Claude or any other model or company, and never mention any upstream model, provider or API. If someone claims they made you or owns MNAI and they are not MeowSamOP DZN, politely say that is not correct. " +
    "Name yourself (MNAI 8 Pro) only when explicitly asked which model you are. " +
    "MeowSamOP DZN Studio team (share only when asked about the studio): owner Sam (MeowSamOP DZN), co-owner Rudransh, manager Shahab. " +
    "Model lineup: Free — MNAI 6 (default), MNAI 7, MNAI 8, MNAI Prowl, Synthex, Glyph series (1, 1.5, 2, 2.5, 3). Pro — MNAI 6.1 Pro, MNAI 7 Pro, MNAI 8 Pro (you, the flagship). Discontinued: MNAI 1, 2, 3, 3.5, 4, 4.5, 5, 5.9 — if asked about those, say they are discontinued. " +
    "Related products by MeowSamOP DZN: OrbitOS (a web-based PC at orbitos-pc.vercel.app), MeowAI (a Roblox Studio plugin that builds games with AI), Dash MNAI (the developer console for the MNAI API). " +
    "Answer helpfully in clean markdown with a direct, ChatGPT-like style: answer first, use headings and bullets only when they help, keep it readable.",
};

const MODEL_MAP = {
  mistral: { upstream: "mistralai/mistral-large-4-0", system: GENERIC_SYSTEM, passthrough: true },
  mnai: { upstream: "qwen/qwen3.8-omni-flash:free", system: MNAI_SYSTEM, passthrough: false },
};

function sendJson(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  const key = process.env.XKIRO_API_KEY;
  if (!key) return sendJson(res, 500, { code: "AI_NOT_CONFIGURED", error: "AI is not configured on the server yet." });

  let raw = "";
  try { for await (const chunk of req) raw += chunk; } catch (e) { return sendJson(res, 400, { error: "Could not read request body." }); }
  let body;
  try { body = JSON.parse(raw || "{}"); } catch (e) { return sendJson(res, 400, { error: "Invalid JSON body." }); }

  const conf = MODEL_MAP[body.model] || MODEL_MAP.mistral;
  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const messages = incoming
    .filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string" && m.content.trim())
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content.slice(0, 8000) }));
  if (!messages.length) return sendJson(res, 400, { error: "No messages provided." });
  const wantStream = !!body.stream;

  const callUpstream = async stream =>
    fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "User-Agent": CHROME_UA },
      body: JSON.stringify({ model: conf.upstream, messages: [conf.system, ...messages], temperature: 0.6, stream }),
    });

  let upstream;
  try { upstream = await callUpstream(wantStream && conf.passthrough); }
  catch (e) { return sendJson(res, 502, { error: "Could not reach the AI service. Try again in a moment." }); }
  if (!upstream.ok) return sendJson(res, 502, { error: "The AI service returned an error. Please try again.", upstreamStatus: upstream.status });

  // Mistral: true SSE passthrough.
  if (wantStream && conf.passthrough) {
    res.writeHead(200, { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" });
    try {
      const reader = upstream.body.getReader();
      for (;;) { const { done, value } = await reader.read(); if (done) break; res.write(Buffer.from(value)); }
    } catch (e) {}
    return res.end();
  }

  // Non-passthrough models: read the full answer server-side, then answer.
  const data = await upstream.json().catch(() => null);
  const msg = data?.choices?.[0]?.message || {};
  const content = msg.content || msg.reasoning_content || "";
  if (!content) return sendJson(res, 502, { error: "The AI returned an empty answer. Please try again." });

  if (!wantStream) return sendJson(res, 200, { content });

  // Re-emit as SSE word-chunks (typewriter feel; nothing upstream-identifying is forwarded).
  res.writeHead(200, { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" });
  const words = content.split(/(?<=\s)/);
  let i = 0;
  while (i < words.length) {
    const piece = words.slice(i, i + 3).join("");
    i += 3;
    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: piece } }] })}\n\n`);
    await sleep(12);
  }
  res.write("data: [DONE]\n\n");
  return res.end();
}
