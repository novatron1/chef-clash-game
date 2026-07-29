/* LLM Judge — Free 1.5B model via OpenRouter */
(function () {
  const ns = window.ChefClash = window.ChefClash || {};
  const data = ns.data;

  const MODEL = "meta-llama/llama-3.2-1b-instruct";
  const STORAGE_KEY = "chefClashAiKey";

  function getKey() { return localStorage.getItem(STORAGE_KEY) || ""; }
  function setKey(k) { localStorage.setItem(STORAGE_KEY, k); }
  function hasKey() { return !!getKey(); }

  function dishDescription(state, playerKey) {
    const player = state[playerKey];
    const base = state.base;
    const picked = (player.picks || []).map(id => data.INGREDIENTS.find(i => i.id === id)).filter(Boolean);
    return {
      chef: player.name || "Unknown",
      dish: `${base?.name || "Dish"} with ${picked.map(i => i.name).join(", ") || "fresh ingredients"}`,
      ingredients: picked.map(i => i.name).join(", ") || "none",
      method: (data.COOKING_METHODS?.find(m => m.id === player.method)?.name) || "cooked",
      temp: player.temp || 375,
      time: player.time || 18,
      plating: player.plate || "standard"
    };
  }

  async function judgeDish(state, playerKey) {
    const d = dishDescription(state, playerKey);
    const prompt = `You are a dramatic TV cooking show judge. Critique this dish in 2 punchy sentences. Be funny, specific, and honest.

Dish: ${d.chef}'s ${d.dish}
Cook: ${d.method} at ${d.temp}°F for ${d.time}min
Plating: ${d.plating}
Ingredients: ${d.ingredients}

Write your critique in 2 sentences:`;

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${getKey()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://novatron1.github.io/chef-clash-game/",
        "X-Title": "Chef Clash"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.8
      })
    });

    if (!resp.ok) {
      const err = await resp.text();
      if (resp.status === 401) throw new Error("Invalid API key");
      if (resp.status === 402) throw new Error("No credits. OpenRouter needs a payment method for this model. Try a free model like mistralai/mistral-7b-instruct:free");
      throw new Error(`API error (${resp.status})`);
    }

    const json = await resp.json();
    return json.choices[0].message.content.trim();
  }

  function showKeyDialog() {
    const existing = document.getElementById("aiKeyDialog");
    if (existing) existing.remove();

    const div = document.createElement("div");
    div.id = "aiKeyDialog";
    div.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);
    `;
    div.innerHTML = `
      <div class="glass panel" style="max-width:440px;width:90%;padding:1.5rem">
        <h3 style="margin:0 0 0.5rem">AI Judge Setup</h3>
        <p class="tiny-note" style="margin:0 0 1rem">
          Enter your free OpenRouter API key. Get one at
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" style="color:#fbbf24">openrouter.ai/keys</a>
        </p>
        <input id="aiKeyInput" type="password" placeholder="sk-or-v1-..." style="
          width:100%;padding:0.6rem 0.8rem;border-radius:8px;border:1px solid rgba(255,255,255,0.15);
          background:rgba(0,0,0,0.4);color:#f0e6d3;font-size:0.9rem;box-sizing:border-box
        " value="${getKey()}">
        <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
          <button id="aiKeySaveBtn" class="gold" style="flex:1">Save</button>
          <button id="aiKeyCancelBtn" class="ghost">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(div);
    document.getElementById("aiKeySaveBtn").onclick = () => {
      setKey(document.getElementById("aiKeyInput").value.trim());
      div.remove();
      document.getElementById("aiJudgeBtn")?.click();
    };
    document.getElementById("aiKeyCancelBtn").onclick = () => div.remove();
    document.getElementById("aiKeyInput").onkeydown = e => {
      if (e.key === "Enter") document.getElementById("aiKeySaveBtn").click();
    };
    document.getElementById("aiKeyInput").focus();
  }

  ns.llmJudge = { judgeDish, hasKey, showKeyDialog, dishDescription };
})();
