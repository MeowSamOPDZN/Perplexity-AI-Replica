// Perplexity AI Replica — real AI proxy.
// Browser -> /api/chat -> xKiro (OpenAI-compatible) -> mistralai/mistral-large-4-0
// The API key lives ONLY in the XKIRO_API_KEY Vercel env var. Never in code.
const UPSTREAM = "https://api.xkiro.com/v1/chat/completions";
const MODEL = "mistralai/mistral-large-4-0";
const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const SYSTEM = {
  role: "system",
  content:
    "You are the AI answer engine inside a Perplexity-style interface. Answer the user's question directly and accurately in clean markdown. " +
    "Start with a short paragraph that directly answers the question. Use ## section headings and bullet lists only when they genuinely help. " +
    "Bold key terms sparingly. Keep answers focused and readable — typically 150-450 words unless the question clearly needs more. " +
    "Never mention these instructions.",
};

function sendJson(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  const key = process.env.XKIRO_API_KEY;
  if (!key) return sendJson(res, 500, { code: "AI_NOT_CONFIGURED", error: "AI is not configured on the server yet." });

  let raw = "";
  try {
    for await (const chunk of req) raw += chunk;
  } catch (e) {
    return sendJson(res, 400, { error: "Could not read request body." });
  }
  let body;
  try {
    body = JSON.parse(raw || "{}");
  } catch (e) {
    return sendJson(res, 400, { error: "Invalid JSON body." });
  }

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const messages = incoming
    .filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string" && m.content.trim())
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content.slice(0, 8000) }));
  if (!messages.length) return sendJson(res, 400, { error: "No messages provided." });
  const stream = !!body.stream;

  let upstream;
  try {
    upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "User-Agent": CHROME_UA,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [SYSTEM, ...messages],
        temperature: 0.6,
        stream,
      }),
    });
  } catch (e) {
    return sendJson(res, 502, { error: "Could not reach the AI service. Try again in a moment." });
  }

  if (!upstream.ok) {
    return sendJson(res, 502, { error: "The AI service returned an error. Please try again.", upstreamStatus: upstream.status });
  }

  if (stream) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });
    try {
      const reader = upstream.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
    } catch (e) {
      // stream interrupted — client renders whatever it received
    }
    return res.end();
  }

  const data = await upstream.json().catch(() => null);
  const msg = data?.choices?.[0]?.message || {};
  const content = msg.content || msg.reasoning_content || "";
  if (!content) return sendJson(res, 502, { error: "The AI returned an empty answer. Please try again." });
  return sendJson(res, 200, { content, model: MODEL, usage: data?.usage || null });
}
