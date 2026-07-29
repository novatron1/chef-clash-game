/* LLM Judge — AI-powered challenges, verdicts, coach tips, and banter via OpenRouter */
(function () {
  const ns = window.ChefClash = window.ChefClash || {};
  const data = ns.data;

  const MODEL = "meta-llama/llama-3.2-1b-instruct";
  const KEY_STORE = "chefClashAiKey";
  const getKey = () => localStorage.getItem(KEY_STORE) || "";
  const setKey = k => localStorage.setItem(KEY_STORE, k);
  const hasKey = () => !!getKey();

  function dishDesc(state, key) {
    const p = state[key];
    const base = state.base;
    const picked = (p.picks || []).map(id => data.INGREDIENTS.find(i => i.id === id)).filter(Boolean);
    const method = data.COOKING_METHODS?.find(m => m.id === p.method);
    const logs = state.actionLog?.[key] || [];
    const bonuses = state.actionBonuses?.[key] || {};
    const bonusTotal = Math.round((bonuses.flavor || 0) + (bonuses.technique || 0) + (bonuses.creativity || 0) + (bonuses.presentation || 0));
    return {
      chef: p.name || "Chef",
      dish: `${base?.name || "Dish"} with ${picked.map(i => i.name).join(", ") || "fresh ingredients"}`,
      base: base?.name || "proteins",
      ingredients: picked.map(i => `${i.name} (${i.category})`).join(", ") || "basic",
      method: method?.name || "cooked",
      temp: p.temp || 375,
      time: p.time || 18,
      plate: p.plate || "standard",
      score: state.lastResult?.[key]?.total || 0,
      flavor: state.lastResult?.[key]?.flavor || 0,
      technique: state.lastResult?.[key]?.technique || 0,
      creativity: state.lastResult?.[key]?.creativity || 0,
      presentation: state.lastResult?.[key]?.presentation || 0,
      bonusTotal: bonusTotal,
      actionLog: logs.slice(-3).join("; ") || "no events"
    };
  }

  async function callAI(messages) {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${getKey()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://novatron1.github.io/chef-clash-game/",
        "X-Title": "Chef Clash"
      },
      body: JSON.stringify({ model: MODEL, messages, max_tokens: 300, temperature: 0.8 })
    });
    if (!resp.ok) {
      const t = await resp.text();
      if (resp.status === 401) throw new Error("Invalid API key");
      if (resp.status === 402) throw new Error("Add a payment method on openrouter.ai/keys");
      throw new Error(`API error (${resp.status})`);
    }
    const j = await resp.json();
    return j.choices[0].message.content.trim();
  }

  async function getChallenge() {
    const text = await callAI([
      { role: "system", content: "You set short, fun cooking challenges. Give one food challenge in 8 words or fewer. Examples: 'Make something blazing hot' or 'Keep it under 350°F' or 'Use a secret sweet ingredient'. No quotes, no punctuation beyond what's needed." },
      { role: "user", content: "Give me a cooking challenge for tonight's battle." }
    ]);
    return text.replace(/^["'\s]+|["'\s]+$/g, "");
  }

  async function getVerdicts(state) {
    const p1 = dishDesc(state, "p1");
    const p2 = dishDesc(state, "p2");
    const challenge = state.challenge || "";

    const prompt = `You are a TV cooking show judge. For each category below, write ONE short punchy sentence (under 15 words). Be specific to the dish and reference what happened during cooking.

CHALLENGE: "${challenge}"

--- CHEF 1: ${p1.chef} ---
Dish: ${p1.dish} | Score: ${p1.score}/100
Flavor (${p1.flavor}): ${p1.ingredients}
Technique (${p1.technique}): ${p1.method}, ${p1.temp}°F, ${p1.time}min
Creativity (${p1.creativity}): base ${p1.base}
Presentation (${p1.presentation}): ${p1.plate}
Cook action bonus: +${p1.bonusTotal}
Cook moments: ${p1.actionLog}

--- CHEF 2: ${p2.chef} ---
Dish: ${p2.dish} | Score: ${p2.score}/100
Flavor (${p2.flavor}): ${p2.ingredients}
Technique (${p2.technique}): ${p2.method}, ${p2.temp}°F, ${p2.time}min
Creativity (${p2.creativity}): base ${p2.base}
Presentation (${p2.presentation}): ${p2.plate}
Cook action bonus: +${p2.bonusTotal}
Cook moments: ${p2.actionLog}

Respond EXACTLY in this format (no extra text):
V1_FLAVOR: ...
V1_TECHNIQUE: ...
V1_CREATIVITY: ...
V1_PRESENTATION: ...
V2_FLAVOR: ...
V2_TECHNIQUE: ...
V2_CREATIVITY: ...
V2_PRESENTATION: ...
BATTLE: ...`;

    const text = await callAI([{ role: "user", content: prompt }]);
    const parse = key => { const m = text.match(new RegExp(`${key}:\\s*(.+?)(?:\\n|$)`)); return m ? m[1].trim() : ""; };
    const p1v = ["flavor","technique","creativity","presentation"].map(k => parse(`V1_${k.toUpperCase()}`));
    const p2v = ["flavor","technique","creativity","presentation"].map(k => parse(`V2_${k.toUpperCase()}`));
    return {
      p1: { flavor: p1v[0], technique: p1v[1], creativity: p1v[2], presentation: p1v[3] },
      p2: { flavor: p2v[0], technique: p2v[1], creativity: p2v[2], presentation: p2v[3] },
      battle: parse("BATTLE")
    };
  }

  async function getCoachTip(state, playerKey) {
    const d = dishDesc(state, playerKey);
    const text = await callAI([
      { role: "system", content: "You are a cooking coach. Give ONE short, specific tip (under 15 words) to improve this dish before the judges see it. Be direct, no fluff." },
      { role: "user", content: `Dish: ${d.chef}'s ${d.dish}\nCook: ${d.method} at ${d.temp}°F\nPlating: ${d.plate}\nIngredients: ${d.ingredients}\n\nTip:` }
    ]);
    return text.replace(/^["'\s]+|["'\s]+$/g, "");
  }

  function showKeyDialog() {
    const e = document.getElementById("aiKeyDialog");
    if (e) e.remove();
    const d = document.createElement("div");
    d.id = "aiKeyDialog";
    d.style.cssText = "position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);";
    d.innerHTML = `
      <div class="glass panel" style="max-width:440px;width:90%;padding:1.5rem">
        <h3 style="margin:0 0 0.5rem">AI Judge Setup</h3>
        <p class="tiny-note" style="margin:0 0 1rem">
          Enter your free OpenRouter API key from
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" style="color:#fbbf24">openrouter.ai/keys</a>
        </p>
        <input id="aiKeyInput" type="password" placeholder="sk-or-v1-..." style="
          width:100%;padding:0.6rem 0.8rem;border-radius:8px;border:1px solid rgba(255,255,255,0.15);
          background:rgba(0,0,0,0.4);color:#f0e6d3;font-size:0.9rem;box-sizing:border-box" value="${getKey()}">
        <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
          <button id="aiKeySaveBtn" class="gold" style="flex:1">Save</button>
          <button id="aiKeyCancelBtn" class="ghost">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(d);
    d.querySelector("#aiKeySaveBtn").onclick = () => { setKey(d.querySelector("#aiKeyInput").value.trim()); d.remove(); };
    d.querySelector("#aiKeyCancelBtn").onclick = () => d.remove();
    d.querySelector("#aiKeyInput").onkeydown = e => { if (e.key === "Enter") d.querySelector("#aiKeySaveBtn").click(); };
    d.querySelector("#aiKeyInput").focus();
  }

  function showKeyNotice(returnFn) {
    const e = document.getElementById("aiKeyDialog");
    if (e) e.remove();
    const d = document.createElement("div");
    d.id = "aiKeyDialog";
    d.style.cssText = "position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);";
    d.innerHTML = `
      <div class="glass panel" style="max-width:440px;width:90%;padding:1.5rem">
        <h3 style="margin:0 0 0.5rem">Set Up AI Judge First</h3>
        <p class="tiny-note" style="margin:0 0 1rem">
          The AI Judge needs an API key. Get one free at
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" style="color:#fbbf24">openrouter.ai/keys</a>
        </p>
        <input id="aiKeyInput" type="password" placeholder="sk-or-v1-..." style="
          width:100%;padding:0.6rem 0.8rem;border-radius:8px;border:1px solid rgba(255,255,255,0.15);
          background:rgba(0,0,0,0.4);color:#f0e6d3;font-size:0.9rem;box-sizing:border-box" value="${getKey()}">
        <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
          <button id="aiKeySaveBtn" class="gold" style="flex:1">Save</button>
          <button id="aiKeyCancelBtn" class="ghost">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(d);
    d.querySelector("#aiKeySaveBtn").onclick = () => { setKey(d.querySelector("#aiKeyInput").value.trim()); d.remove(); if (returnFn) setTimeout(returnFn, 100); };
    d.querySelector("#aiKeyCancelBtn").onclick = () => d.remove();
    d.querySelector("#aiKeyInput").onkeydown = e => { if (e.key === "Enter") d.querySelector("#aiKeySaveBtn").click(); };
    d.querySelector("#aiKeyInput").focus();
  }

  ns.llmJudge = { hasKey, showKeyNotice, showKeyDialog, getChallenge, getVerdicts, getCoachTip, dishDesc };
})();
