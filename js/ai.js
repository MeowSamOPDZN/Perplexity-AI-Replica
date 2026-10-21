"use strict";
/* ================= REAL AI (via /api/chat) ================= */
let chatHistory = [];
function resetChat() { chatHistory = []; }

/* Active model: "mistral" (Mistral Large) or "mnai" (MNAI 8 Pro) */
let activeModel = "mistral";
try { const saved = localStorage.getItem("pplx_model"); if (saved && MODELS.some(m => m.key === saved)) activeModel = saved; } catch (e) {}
function setActiveModel(key) {
  if (!MODELS.some(m => m.key === key)) return;
  activeModel = key;
  try { localStorage.setItem("pplx_model", key); } catch (e) {}
  updateModelUI();
}
function updateModelUI() {
  const meta = MODELS.find(m => m.key === activeModel) || MODELS[0];
  $$("[data-model-label]").forEach(s => { s.textContent = meta.name; });
  $$("[data-model-logo]").forEach(im => { im.src = meta.logo; });
  if (typeof composers !== "undefined") composers.forEach(c => { c.model = meta.name; });
}

function mdInline(s) {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}
function mdToHtml(md) {
  const lines = String(md || "").split("\n");
  let html = "", para = [], list = null, inCode = false, codeBuf = "";
  const flushPara = () => { if (para.length) { html += "<p>" + mdInline(esc(para.join(" "))) + "</p>"; para = []; } };
  const flushList = () => { if (list) { html += `<${list.type}>` + list.items.map(i => "<li>" + mdInline(esc(i)) + "</li>").join("") + `</${list.type}>`; list = null; } };
  for (const rawLine of lines) {
    const line = rawLine;
    if (line.trim().startsWith("```")) {
      if (inCode) { html += "<pre><code>" + esc(codeBuf.replace(/\n$/, "")) + "</code></pre>"; inCode = false; codeBuf = ""; }
      else { flushPara(); flushList(); inCode = true; }
      continue;
    }
    if (inCode) { codeBuf += line + "\n"; continue; }
    const t = line.trim();
    if (!t) { flushPara(); flushList(); continue; }
    const h = t.match(/^(#{1,4})\s+(.*)$/);
    if (h) { flushPara(); flushList(); html += `<h${h[1].length <= 2 ? 3 : 4}>` + mdInline(esc(h[2])) + `</h${h[1].length <= 2 ? 3 : 4}>`; continue; }
    if (/^---+$/.test(t)) { flushPara(); flushList(); html += "<hr>"; continue; }
    const b = t.match(/^[-•*]\s+(.*)$/);
    if (b) { flushPara(); if (!list || list.type !== "ul") { flushList(); list = { type: "ul", items: [] }; } list.items.push(b[1]); continue; }
    const n = t.match(/^\d+[.)]\s+(.*)$/);
    if (n) { flushPara(); if (!list || list.type !== "ol") { flushList(); list = { type: "ol", items: [] }; } list.items.push(n[1]); continue; }
    if (t.startsWith("> ")) { flushPara(); flushList(); html += "<blockquote>" + mdInline(esc(t.slice(2))) + "</blockquote>"; continue; }
    flushList(); para.push(t);
  }
  if (inCode) html += "<pre><code>" + esc(codeBuf) + "</code></pre>";
  flushPara(); flushList();
  return html;
}

/* Streams an answer from /api/chat into bodyEl; hides statusEl on first token. */
async function streamAnswer(messages, modelKey, bodyEl, statusEl, onDone, onError, onFirstToken) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, model: modelKey, stream: true }),
    });
    if (!res.ok || !res.body) {
      let msg = "The AI service returned an error. Please try again.";
      try { const j = await res.json(); if (j && j.error) msg = j.error; } catch (e) {}
      throw new Error(msg);
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", raw = "", shown = false, queued = false, sawDone = false;
    const render = () => { bodyEl.innerHTML = mdToHtml(raw); };
    outer: for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let ix;
      while ((ix = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, ix).trim();
        buf = buf.slice(ix + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") { sawDone = true; break outer; }
        try {
          const j = JSON.parse(data);
          const d = (j.choices && j.choices[0] && j.choices[0].delta) || {};
          const t = d.content || "";
          if (t) {
            raw += t;
            if (!shown) { shown = true; if (statusEl) statusEl.hidden = true; if (onFirstToken) onFirstToken(); }
            if (!queued) { queued = true; setTimeout(() => { queued = false; render(); }, 50); }
          }
        } catch (e) {}
      }
    }
    if (sawDone) { try { await reader.cancel(); } catch (e) {} }
    render();
    if (!raw.trim()) throw new Error("The AI returned an empty answer. Please try again.");
    onDone(raw);
  } catch (err) {
    onError(err);
  }
}
