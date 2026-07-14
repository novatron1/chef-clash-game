(function () {
  const ns = window.ChefClash = window.ChefClash || {};
  const data = ns.data;
  const scoring = ns.scoring;
  const ui = ns.ui;
  const audio = ns.audio;
  const minigames = ns.minigames;
  const career = ns.career;
  const recipeLibrary = ns.recipeLibrary;

  const state = ns.createState();
  if (recipeLibrary) {
    recipeLibrary.restoreOpenKitchenState(state);
    if (state.openKitchen) state.mode = "openKitchen";
  }
  ns.state = state;

  let installPrompt = null;

  const byId = (list, id) => list.find((item) => item.id === id);
  const rand = (list) => list[Math.floor(Math.random() * list.length)];
  const isOpenKitchen = () => state.mode === "openKitchen" || state.openKitchen;

  function getBest() {
    return Number(localStorage.getItem("chefClashBest") || 0);
  }

  function setBest(v) {
    if (v > getBest()) localStorage.setItem("chefClashBest", String(v));
    ui.bestPill(getBest());
  }

  function currentPlayer() {
    return state[state.buildPlayer];
  }

  function heatTier(temp = 375) {
    if (temp >= 430) return "high";
    if (temp >= 360) return "medium";
    return "low";
  }

  function burnerForTemp(temp = 375) {
    return `assets/cookware/gas_burner_${heatTier(temp)}_01.png`;
  }

  function updateStoveVisuals() {
    const player = currentPlayer();
    const flame = document.getElementById("flame");
    const steamTrail = document.getElementById("steamTrail");
    const heatHud = document.getElementById("heatHud");
    const heatCard = heatHud?.closest(".hud-item");
    const tier = heatTier(player.temp);

    if (heatHud && heatCard) {
      heatCard.classList.remove("heat-low", "heat-medium", "heat-high");
      heatCard.classList.add(`heat-${tier}`);
    }
    if (flame) {
      flame.classList.add("on");
      flame.style.backgroundImage = `url(${burnerForTemp(player.temp)})`;
      flame.style.backgroundRepeat = "no-repeat";
      flame.style.backgroundPosition = "center";
      flame.style.backgroundSize = "contain";
    }
    if (steamTrail) {
      steamTrail.style.backgroundImage = `url(${player.method === "smoke" ? "assets/fx/smoke_fx_01.svg" : "assets/fx/steam_fx_01.svg"})`;
      steamTrail.style.backgroundRepeat = "no-repeat";
      steamTrail.style.backgroundPosition = "center";
      steamTrail.style.backgroundSize = "contain";
    }
    if (heatHud) heatHud.textContent = `${player.temp}°F`;
  }

  function updateHomeInputs() {
    const set = (id, value) => {
      const node = document.getElementById(id);
      if (node) node.value = value;
    };
    set("p1Name", state.p1.name);
    set("p2Name", state.p2.name);
    set("modeSelect", state.mode);
    set("difficultySelect", state.difficulty);
    set("costModeSelect", state.budgetMode);
    set("pantryStyleSelect", state.pantryStyle);
    set("coachModeSelect", state.coachMode);
    set("speedSelect", state.speed);
  }

  function syncSetupFromInputs() {
    state.p1.name = document.getElementById("p1Name")?.value.trim() || "Chef Nova";
    state.p2.name = document.getElementById("p2Name")?.value.trim() || "Chef Blaze";
    state.mode = document.getElementById("modeSelect")?.value || "quick";
    state.difficulty = document.getElementById("difficultySelect")?.value || "normal";
    state.budgetMode = document.getElementById("costModeSelect")?.value || "standard";
    state.pantryStyle = document.getElementById("pantryStyleSelect")?.value || "full";
    state.coachMode = document.getElementById("coachModeSelect")?.value || "guided";
    state.speed = document.getElementById("speedSelect")?.value || "normal";
    state.openKitchen = state.mode === "openKitchen";
    if (state.openKitchen) {
      state.budgetMode = "open";
      state.maxExtras = data.INGREDIENTS.length;
      state.budget = Infinity;
    }
  }

  function resetPlayersForBase(base) {
    state.base = base;
    state.maxExtras = isOpenKitchen() ? Infinity : state.budgetMode === "open" ? 8 : 5;
    state.budget = isOpenKitchen() ? Infinity : base.budget;
    state.p1.picks = [];
    state.p2.picks = [];
    state.p1.commands = [];
    state.p2.commands = [];
    state.p1.method = "saute";
    state.p2.method = "grill";
    state.p1.plate = "street";
    state.p2.plate = "fine";
    state.p1.temp = 375;
    state.p1.time = 18;
    state.p1.amount = 3;
    state.p2.temp = 375;
    state.p2.time = 18;
    state.p2.amount = 3;
    state.activeCategory = "all";
    state.buildPlayer = "p1";
    state.actionLog = { p1: [], p2: [] };
    state.actionBonuses = {
      p1: { flavor: 0, technique: 0, creativity: 0, presentation: 0 },
      p2: { flavor: 0, technique: 0, creativity: 0, presentation: 0 }
    };
  }

  function aiBuildForBase(base) {
    const picks = [];
    const liked = data.INGREDIENTS.filter((item) => base.likes.includes(item.id));
    const wild = data.INGREDIENTS.filter((item) => !base.hates.includes(item.id));
    const pool = [...liked, ...liked, ...wild];
    let spent = 0;
    const limit = Number.isFinite(state.maxExtras) ? state.maxExtras : 8;
    while (picks.length < limit && pool.length) {
      const choice = rand(pool);
      const nextSpend = spent + choice.cost;
      if (state.budgetMode === "open" || nextSpend <= base.budget) {
        if (!picks.includes(choice.id)) {
          picks.push(choice.id);
          spent = nextSpend;
        }
      }
      if (picks.length >= limit) break;
      if (Math.random() > 0.65) break;
    }
    if (!picks.length) picks.push(...base.likes.slice(0, 2).filter(Boolean));
    return picks.slice(0, limit);
  }

  function buildAiDish() {
    state.p2.picks = aiBuildForBase(state.base);
    state.p2.method = data.METHODS.find((method) => method.likes.includes(state.base.id))?.id || rand(data.METHODS).id;
    state.p2.plate = rand(Object.keys(data.PLATES));
    state.p2.temp = scoring.idealCookControls(state.base, state.p2.method).temp;
    state.p2.time = scoring.idealCookControls(state.base, state.p2.method).time;
    state.p2.amount = scoring.idealCookControls(state.base, state.p2.method).amount;
  }

  function prepareMatch(mode = "quick") {
    syncSetupFromInputs();
    const base = rand(data.BASES);
    state.mode = mode;
    state.career = false;
    state.careerBoss = null;
    state.pendingBoss = null;
    state.openKitchen = mode === "openKitchen";
    state.openKitchenResult = null;
    state.openKitchenJudgeTest = null;
    resetPlayersForBase(base);
    state.p1.name = document.getElementById("p1Name")?.value.trim() || state.p1.name;
    state.p2.name = document.getElementById("p2Name")?.value.trim() || state.p2.name;
    state.p1.method = "saute";
    state.p1.plate = "street";
    if (mode === "quick") buildAiDish();
    ui.showScreen("build");
    renderBuild();
    ui.toast(mode === "openKitchen" ? `Open Kitchen ready: ${base.name}` : `Match ready: ${base.name}`);
  }

  function prepareBattle() {
    prepareMatch("quick");
  }

  function prepareOpenKitchen() {
    prepareMatch("openKitchen");
  }

  function openRecipeLibrary() {
    if (ns.openKitchen?.showLibrary) {
      ns.openKitchen.showLibrary(state);
    } else {
      ui.toast("Recipe Library is not ready.");
    }
  }

  function openAssetReference() {
    ui.showScreen("assets");
    ns.assetReference?.renderAssetReference?.();
  }

  function renderBuild() {
    ui.renderBaseSelect(state);
    ui.renderPlateOptions(state);
    ui.renderCategoryTabs(state);
    ui.renderIngredientGrid(state);
    ui.renderMethods(state);
    ui.renderMethodGrid(state, setMethod);
    ui.renderBuildSummary(state);
    ui.renderControlLabels(state, scoring.controlStatus(state.base, currentPlayer()));
    renderMethodNote();
    updatePlayerControls();
    updateCoachLines();
    updateVisibleSelections();
    ui.bestPill(getBest());
  }

  function updatePlayerControls() {
    const switchBtn = document.getElementById("switchPlayerBtn");
    if (!switchBtn) return;
    if (isOpenKitchen()) {
      switchBtn.textContent = "Sandbox";
      switchBtn.disabled = true;
    } else if (state.mode === "quick" && state.buildPlayer === "p1") {
      switchBtn.textContent = "Rival Auto";
      switchBtn.disabled = true;
    } else {
      switchBtn.disabled = false;
      switchBtn.textContent = state.buildPlayer === "p1" ? "Switch to P2" : "Switch to P1";
    }
    const playerPill = document.getElementById("playerPill");
    if (playerPill) playerPill.textContent = state.buildPlayer === "p1" ? "P1" : "P2";
  }

  function updateCoachLines() {
    const current = currentPlayer();
    const status = scoring.controlStatus(state.base, current);
    const line = document.getElementById("coachLines");
    if (!line) return;
    const ideal = status.ideal;
    const method = byId(data.METHODS, current.method);
    const baseLine = `Target for ${state.base.name} with ${method?.name || "this method"}: ${ideal.temp}°F for ${ideal.time} min.`;
    if (state.coachMode === "off") {
      line.textContent = "Coach mode is off.";
    } else if (state.coachMode === "strong") {
      line.textContent = `${baseLine} ${status.score >= 80 ? "You are locked in." : "Bump heat and time closer to the ideal."}`;
    } else {
      line.textContent = `${baseLine} ${status.score >= 80 ? "Nice control." : "Tune the sliders before you lock in."}`;
    }
  }

  function renderMethodNote() {
    const current = currentPlayer();
    const method = byId(data.METHODS, current.method);
    if (!method) return;
    const note = document.getElementById("actionInstruction");
    if (note && state._action?.running) return;
  }

  function updateVisibleSelections() {
    const current = currentPlayer();
    document.getElementById("cookP1Name").textContent = state.p1.name;
    document.getElementById("cookP2Name").textContent = state.p2.name;
    document.getElementById("showCardLeftName").textContent = state.p1.name;
    document.getElementById("showCardRightName").textContent = state.p2.name;
    document.getElementById("cookP1Dish").textContent = scoring.makeDishName(state.p1, state.base, state.p1.picks);
    document.getElementById("cookP2Dish").textContent = scoring.makeDishName(state.p2, state.base, state.p2.picks);
    document.getElementById("buildTitle").textContent = `${current.name}'s Dish`;
  }

  function setBase(id) {
    const base = byId(data.BASES, id) || data.BASES[0];
    resetPlayersForBase(base);
    if (state.mode === "quick") buildAiDish();
    renderBuild();
  }

  function setMethod(id) {
    currentPlayer().method = id;
    renderBuild();
  }

  function setPlate(id) {
    currentPlayer().plate = id;
    renderBuild();
  }

  function setControl(kind, value) {
    currentPlayer()[kind] = Number(value);
    ui.renderControlLabels(state, scoring.controlStatus(state.base, currentPlayer()));
    updateCoachLines();
  }

  function togglePlayer() {
    if (isOpenKitchen()) {
      ui.toast("Open Kitchen stays on one station.");
      return;
    }
    if (state.mode === "quick") {
      ui.toast("Quick Battle keeps the rival on auto-cook.");
      return;
    }
    state.buildPlayer = state.buildPlayer === "p1" ? "p2" : "p1";
    renderBuild();
  }

  function ingredientSpend(picks) {
    return picks.reduce((sum, id) => sum + (byId(data.INGREDIENTS, id)?.cost || 0), 0);
  }

  function toggleIngredient(id) {
    const player = currentPlayer();
    const existing = player.picks.indexOf(id);
    if (existing >= 0) {
      player.picks.splice(existing, 1);
    } else {
      const item = byId(data.INGREDIENTS, id);
      if (!item) return;
      const nextSpend = ingredientSpend(player.picks) + item.cost;
      if (!isOpenKitchen() && player.picks.length >= state.maxExtras) return ui.toast("Extra limit reached.");
      if (!isOpenKitchen() && state.budgetMode !== "open" && nextSpend > state.budget) return ui.toast("Budget exceeded.");
      player.picks.push(id);
    }
    renderBuild();
  }

  function removeIngredient(id) {
    const player = currentPlayer();
    player.picks = player.picks.filter((item) => item !== id);
    renderBuild();
  }

  function clearExtras() {
    currentPlayer().picks = [];
    renderBuild();
  }

  function randomizeExtras() {
    const player = currentPlayer();
    const base = state.base;
    const pool = isOpenKitchen()
      ? data.INGREDIENTS.slice()
      : data.INGREDIENTS.filter((item) => !base.hates.includes(item.id));
    player.picks = [];
    let tries = 0;
    const maxRolls = isOpenKitchen() ? Math.min(12, pool.length) : state.maxExtras;
    while (player.picks.length < maxRolls && tries < 28) {
      tries += 1;
      const item = rand(pool);
      const nextSpend = ingredientSpend(player.picks) + item.cost;
      if (isOpenKitchen() || state.budgetMode === "open" || nextSpend <= state.budget) {
        if (!player.picks.includes(item.id)) player.picks.push(item.id);
      }
      if (!isOpenKitchen() && Math.random() > 0.5 && player.picks.length >= 3) break;
    }
    renderBuild();
  }

  function coachTip() {
    const player = currentPlayer();
    const ideal = scoring.idealCookControls(state.base, player.method);
    player.temp = ideal.temp;
    player.time = ideal.time;
    player.amount = ideal.amount;
    ui.toast("Coach tip applied");
    renderBuild();
  }

  function lockDish() {
    audio.cue("sparkle");
    ui.toast(`${currentPlayer().name} locked in`);
    if (state.mode === "quick") {
      buildAiDish();
      renderBuild();
    }
  }

  function ensureOpponentReady() {
    if (isOpenKitchen()) return true;
    if (state.mode === "quick") {
      buildAiDish();
    }
    if (state.mode === "local" && state.p2.picks.length === 0) {
      ui.toast("Build the second chef before cooking.");
      return false;
    }
    if (state.career && state.careerBoss && state.p2.picks.length === 0) {
      state.p2.picks = state.careerBoss.likes.slice(0, state.maxExtras);
    }
    return true;
  }

  function showCookingHUD() {
    const lead = state.p1;
    const rival = state.p2;
    document.getElementById("timeHud").textContent = `${lead.time}m`;
    document.getElementById("hypeHud").textContent = "0%";
    document.getElementById("hypeLabel").textContent = "0%";
    document.getElementById("hypeMeter").style.width = "0%";
    updateStoveVisuals();
    document.getElementById("dishReveal").innerHTML = `
      <div class="dish-reveal-row">
        <span>${lead.name}</span>
        <strong>${state.base.emoji} ${lead.picks.map((id) => byId(data.INGREDIENTS, id)?.emoji || "").join(" ")}</strong>
      </div>
      <div class="dish-reveal-row">
        <span>${rival.name}</span>
        <strong>${state.base.emoji} ${rival.picks.map((id) => byId(data.INGREDIENTS, id)?.emoji || "").join(" ")}</strong>
      </div>
    `;
    if (isOpenKitchen()) {
      document.getElementById("cookP2Name").textContent = "Open Kitchen";
      document.getElementById("cookP2Dish").textContent = "Judge Test ready";
      document.getElementById("showCardRightName").textContent = "Open Kitchen";
    }
  }

  function setHype(pct) {
    const clamped = Math.max(0, Math.min(100, pct));
    document.getElementById("hypeLabel").textContent = `${Math.round(clamped)}%`;
    document.getElementById("hypeHud").textContent = `${Math.round(clamped)}%`;
    document.getElementById("hypeMeter").style.width = `${clamped}%`;
  }

  function setCoachCallout(message) {
    document.getElementById("coachCallout").textContent = message;
  }

  function startCookOff() {
    if (!ensureOpponentReady()) return;
    ns.state = state;
    state.buildPlayer = "p1";
    ui.showScreen("cook");
    document.getElementById("cookTitle").textContent = isOpenKitchen() ? `${state.base.name} Open Kitchen` : `${state.base.name} Face-Off`;
    showCookingHUD();
    setCoachCallout(isOpenKitchen() ? "Open Kitchen ready." : "Chef Coach ready.");
    document.getElementById("roundBanner").textContent = isOpenKitchen() ? "Sandbox prep in progress" : "Prep in progress";
    document.getElementById("actionScorePill").textContent = "Mini-Game +0";
    document.getElementById("actionTapBtn").disabled = false;
    document.getElementById("actionSkipBtn").disabled = false;
    audio.cue("fire");
    minigames.startActionRound(state, "p1", () => {
      setCoachCallout(isOpenKitchen() ? "Judge preview ready." : "Fire round complete.");
      setHype(100);
      if (!isOpenKitchen()) {
        minigames.simulateAiAction(state, "p2");
      }
      window.setTimeout(showResults, 350);
    });
  }

  function showResults() {
    document.getElementById("roundBanner").textContent = "Winner revealed";
    if (isOpenKitchen()) {
      const result = scoring.scoreOpenKitchenDish(state, "p1");
      state.openKitchenResult = result;
      const recipeCard = recipeLibrary?.createRecipeCard?.(state, result, "p1") || null;
      state.openKitchenRecipe = recipeCard || state.openKitchenRecipe;
      ui.renderOpenKitchenResults(state, result, recipeCard);
      document.getElementById("roundBanner").textContent = result.reaction?.crowd || "Open Kitchen complete.";
      document.getElementById("coachCallout").textContent = result.comment || "Judge preview ready.";
      ui.showScreen("results");
      setBest(result.total);
      if (result.total >= 80) burstConfetti();
      window.setTimeout(() => audio.cue("fanfare"), 180);
      audio.cue(result.reaction?.sound || "good");
      return;
    }

    const r1 = scoring.evaluateDish(state, "p1");
    const r2 = scoring.evaluateDish(state, "p2");
    const battleReaction = scoring.makeBattleReaction(r1, r2);
    if (state.career) career.applyCareerResult(state, r1, r2);
    setBest(Math.max(r1.total, r2.total));
    ui.renderResults(state, r1, r2);
    document.getElementById("roundBanner").textContent = battleReaction.crowd;
    document.getElementById("coachCallout").textContent = battleReaction.judge;
    ui.showScreen("results");
    state.winner = r1.total >= r2.total ? "p1" : "p2";
    if (r1.total !== r2.total) burstConfetti();
    window.setTimeout(() => audio.cue("fanfare"), 180);
    audio.cue(battleReaction.sound || (r1.total >= r2.total ? "win" : "fail"));
  }

  function burstConfetti() {
    for (let i = 0; i < 24; i++) {
      const node = document.createElement("div");
      node.style.position = "fixed";
      node.style.left = `${Math.random() * 100}vw`;
      node.style.top = "-10px";
      node.style.width = "8px";
      node.style.height = "14px";
      node.style.background = ["#ffd166", "#ff6b35", "#7dd56f", "#f4b35d"][Math.floor(Math.random() * 4)];
      node.style.zIndex = 200;
      node.style.borderRadius = "2px";
      node.style.opacity = "0.9";
      node.style.pointerEvents = "none";
      document.body.appendChild(node);
      const duration = 1200 + Math.random() * 1200;
      node.animate([
        { transform: "translateY(0) rotate(0deg)", opacity: 0.95 },
        { transform: `translateY(${window.innerHeight + 40}px) rotate(${180 + Math.random() * 300}deg)`, opacity: 0.1 }
      ], { duration, easing: "cubic-bezier(.1,.7,.1,1)" });
      window.setTimeout(() => node.remove(), duration + 40);
    }
  }

  function saveOpenKitchenRecipe() {
    if (!isOpenKitchen() || !state.openKitchenResult) {
      ui.toast("No Open Kitchen dish to save yet.");
      return;
    }
    const card = recipeLibrary?.saveRecipe?.(state, state.openKitchenResult, "p1") || null;
    if (card) {
      state.openKitchenRecipe = card;
      state.openKitchenPersistedAt = card.updatedAt || Date.now();
      ui.toast("Recipe saved.");
    } else {
      ui.toast("Recipe storage is unavailable.");
    }
  }

  function runOpenKitchenJudgeTest() {
    if (!isOpenKitchen() || !state.openKitchenResult) {
      ui.toast("Open Kitchen judge test is not ready.");
      return;
    }
    state.openKitchenJudgeTest = scoring.scoreOpenKitchenDish(state, "p1");
    ui.toast(`Judge Test queued: ${state.openKitchenJudgeTest.total}`);
  }

  function returnHome() {
    state.career = false;
    state.careerBoss = null;
    state.pendingBoss = null;
    ui.showScreen("home");
    updateHomeInputs();
    ui.bestPill(getBest());
  }

  function setActionMeter(value) {
    document.getElementById("actionFill").style.width = `${value}%`;
    document.getElementById("actionMarker").style.left = `${value}%`;
  }

  function attachEvents() {
    document.getElementById("quickBattleBtn").addEventListener("click", () => prepareMatch("quick"));
    document.getElementById("careerModeBtn").addEventListener("click", () => career.openCareer(state));
    document.getElementById("openKitchenBtn").addEventListener("click", prepareOpenKitchen);
    document.getElementById("recipeLibraryBtn").addEventListener("click", openRecipeLibrary);
    document.getElementById("assetReferenceBtn").addEventListener("click", openAssetReference);
    document.getElementById("homeBtn").addEventListener("click", returnHome);
    document.getElementById("backHomeBtn").addEventListener("click", returnHome);
    document.getElementById("libraryBackBtn").addEventListener("click", returnHome);
    document.getElementById("assetsBackBtn").addEventListener("click", returnHome);
    document.getElementById("playAgainBtn").addEventListener("click", () => {
      if (isOpenKitchen()) {
        prepareOpenKitchen();
        return;
      }
      prepareBattle();
    });
    document.getElementById("saveRecipeBtn").addEventListener("click", saveOpenKitchenRecipe);
    document.getElementById("judgeTestBtn").addEventListener("click", runOpenKitchenJudgeTest);
    document.getElementById("installBtn").addEventListener("click", async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      document.getElementById("installBtn").classList.add("hidden");
    });

    document.getElementById("switchPlayerBtn").addEventListener("click", togglePlayer);
    document.getElementById("randomizeBtn").addEventListener("click", randomizeExtras);
    document.getElementById("clearBtn").addEventListener("click", clearExtras);
    document.getElementById("coachBtn").addEventListener("click", coachTip);
    document.getElementById("lockInBtn").addEventListener("click", lockDish);
    document.getElementById("startCookBtn").addEventListener("click", startCookOff);
    document.getElementById("closeCareerModalBtn").addEventListener("click", career.closeModal);
    document.getElementById("fightBossBtn").addEventListener("click", () => career.startCareerBattle(state));

    document.getElementById("baseSelect").addEventListener("change", (e) => setBase(e.target.value));
    document.getElementById("plateSelect").addEventListener("change", (e) => setPlate(e.target.value));
    document.getElementById("tempRange").addEventListener("input", (e) => {
      setControl("temp", e.target.value);
      document.getElementById("tempLabel").textContent = `${e.target.value}°F`;
    });
    document.getElementById("timeRange").addEventListener("input", (e) => {
      setControl("time", e.target.value);
      document.getElementById("timeLabel").textContent = `${e.target.value} min`;
    });
    document.getElementById("amountRange").addEventListener("input", (e) => {
      setControl("amount", e.target.value);
      document.getElementById("amountLabel").textContent = `${e.target.value} portions`;
    });

    ["p1Name", "p2Name", "modeSelect", "difficultySelect", "costModeSelect", "pantryStyleSelect", "coachModeSelect", "speedSelect"].forEach((id) => {
      document.getElementById(id).addEventListener("change", syncSetupFromInputs);
      document.getElementById(id).addEventListener("input", syncSetupFromInputs);
    });

    document.addEventListener("click", (event) => {
      const ingredient = event.target.closest("[data-ingredient]");
      if (ingredient) {
        toggleIngredient(ingredient.dataset.ingredient);
        return;
      }
      const remove = event.target.closest("[data-remove]");
      if (remove) {
        removeIngredient(remove.dataset.remove);
        return;
      }
      const selectRecipe = event.target.closest("[data-library-select]");
      if (selectRecipe) {
        ns.openKitchen?.selectRecipe?.(state, selectRecipe.dataset.librarySelect);
        return;
      }
      const openRecipe = event.target.closest("[data-library-open]");
      if (openRecipe) {
        ns.openKitchen?.openRecipe?.(state, openRecipe.dataset.libraryOpen);
        return;
      }
      const judgeRecipe = event.target.closest("[data-library-judge]");
      if (judgeRecipe) {
        ns.openKitchen?.judgeRecipe?.(state, judgeRecipe.dataset.libraryJudge);
      }
    });

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      installPrompt = event;
      document.getElementById("installBtn").classList.remove("hidden");
    });
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    }
  }

  function renderInitialState() {
    ui.bestPill(getBest());
    ui.renderBaseSelect(state);
    ui.renderPlateOptions(state);
    renderBuild();
    updateHomeInputs();
    ui.showScreen("home");
  }

  document.addEventListener("DOMContentLoaded", () => {
    registerServiceWorker();
    attachEvents();
    renderInitialState();
    syncSetupFromInputs();
  });

  ns.game = {
    state,
    prepareBattle,
    renderBuild,
    startCookOff,
    showResults,
    returnHome
  };
})();
