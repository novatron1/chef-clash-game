/* LLM Judge — AI-powered dish critique via OpenRouter */
(function () {
  const ns = window.ChefClash = window.ChefClash || {};
  const data = ns.data;

  function getApiKey() {
    return localStorage.getItem("chefClashLlmKey") || "";
  }

  function setApiKey(key) {
    localStorage.setItem("chefClashLlmKey", key);
  }

  function hasApiKey() {
    return !!getApiKey();
  }

  function dishDescription(state, playerKey) {
    const player = state[playerKey];
    const base = state.base;
    const picked = (player.picks || []).map(id => data.INGREDIENTS.find(i => i.id === id)).filter(Boolean);
    return {
      chef: player.name || "Unknown Chef",
      dish: `${base?.name || "Mystery"} with ${picked.map(i => i.name).join(", ") || "nothing"}`,
      base: base?.name || "Unknown",
      ingredients: picked.map(i => `${i.name} (${i.category})`),
      method: (data.COOKING_METHODS?.find(m => m.id === player.method)?.name) || "unknown",
      temperature: player.temp || 375,
      time: player.time || 18,
      portions: player.amount || 3,
      plating: player.plate || "standard",
      commands: player.commands || []
    };
  }

  async function fetchCritique(dish, apiKey) {
    const prompt = `You are a dramatic, flamboyant TV cooking show judge. Critique this dish in 2-3 punchy sentences — be specific, funny, and honest about the ingredients and technique. Never generic.

Dish: ${dish.dish}
Chef: ${dish.chef}
Base: ${dish.base}
Ingredients: ${dish.ingredients.join(", ")}
Method: ${dish.method} at ${dish.temperature}°F for ${dish.time}min, ${dish.portions} portions
Plating: ${dish.plating}
Commands: ${dish.commands.join(", ") || "none"}

Plain text only, no quotes, no markdown.`;

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://novatron1.github.io/chef-clash-game/",
        "X-Title": "Chef Clash"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.9
      })
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`LLM judge error (${resp.status})`);
    }

    const json = await resp.json();
    return json.choices[0].message.content.trim();
  }

  async function judgeDish(state, playerKey) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("No API key set. Click the key icon to configure.");
    const dish = dishDescription(state, playerKey);
    return await fetchCritique(dish, apiKey);
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
        <h3 style="margin:0 0 0.5rem">AI Judge Key</h3>
        <p class="tiny-note" style="margin:0 0 1rem">
          Enter your OpenRouter API key. Get one free at
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" style="color:#fbbf24">openrouter.ai/keys</a>
        </p>
        <input id="aiKeyInput" type="password" placeholder="sk-or-v1-..." style="
          width:100%;padding:0.6rem 0.8rem;border-radius:8px;border:1px solid rgba(255,255,255,0.15);
          background:rgba(0,0,0,0.4);color:#f0e6d3;font-size:0.9rem;box-sizing:border-box
        " value="${getApiKey()}">
        <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
          <button id="aiKeySaveBtn" class="gold" style="flex:1">Save</button>
          <button id="aiKeyCancelBtn" class="ghost">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(div);

    const input = document.getElementById("aiKeyInput");
    document.getElementById("aiKeySaveBtn").onclick = () => {
      setApiKey(input.value.trim());
      div.remove();
      document.getElementById("aiJudgeBtn")?.click();
    };
    document.getElementById("aiKeyCancelBtn").onclick = () => div.remove();
    input.onkeydown = e => { if (e.key === "Enter") document.getElementById("aiKeySaveBtn").click(); };
    input.focus();
  }

  ns.llmJudge = { dishDescription, judgeDish, hasApiKey, showKeyDialog, setApiKey };
})();
