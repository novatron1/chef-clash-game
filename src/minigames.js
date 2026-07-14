(function () {
  const ns = window.ChefClash = window.ChefClash || {};
  const ui = ns.ui;
  const audio = ns.audio;

  const PHASES = [
    { id: "prep", label: "Prep", prompt: "Slice clean. Tap the moving marker inside the safe zone.", action: "Chop", className: "prep", bonusKey: "technique" },
    { id: "fire", label: "Fire", prompt: "Keep the pan hot, not chaotic. Tap the moving marker to control the flame.", action: "Stir", className: "fire", bonusKey: "flavor" },
    { id: "plate", label: "Plate", prompt: "Finish with style. Tap the moving marker for the cleanest reveal.", action: "Plate", className: "plate", bonusKey: "presentation" }
  ];

  function createActionState(playerKey) {
    return {
      playerKey,
      phaseIndex: 0,
      startedAt: 0,
      marker: 0,
      direction: 1,
      accuracy: 0,
      totalScore: 0,
      pauseUntil: 0,
      running: false,
      raf: 0,
      timeout: 0
    };
  }

  function resetActionBonuses(state) {
    state.actionBonuses = {
      p1: { flavor: 0, technique: 0, creativity: 0, presentation: 0 },
      p2: { flavor: 0, technique: 0, creativity: 0, presentation: 0 }
    };
    state.actionLog = { p1: [], p2: [] };
  }

  function prepAssetsFor(state, player, choppedCount = 0) {
    const data = ns.data;
    const sourceIds = (player.picks && player.picks.length ? player.picks : state.base.likes || []).slice(0, 3);
    const fallbackIds = ["onion", "garlic", "tomato"];
    return (sourceIds.length ? sourceIds : fallbackIds).map((id, index) => {
      const item = data.INGREDIENTS.find((entry) => entry.id === id);
      const chopped = index < choppedCount;
      const asset = chopped ? item?.prepChoppedAsset || item?.asset : item?.prepAsset || item?.asset;
      return {
        id,
        item,
        chopped,
        asset
      };
    });
  }

  function playerImageForKey(playerKey) {
    return playerKey === "p1" ? "assets/chefs/chef_01_chop_pose.png" : "assets/chefs/chef_02_chop_pose.png";
  }

  function heatTier(temp = 375) {
    if (temp >= 430) return "high";
    if (temp >= 360) return "medium";
    return "low";
  }

  function stoveBurnerFor(temp = 375) {
    return `assets/cookware/gas_burner_${heatTier(temp)}_01.png`;
  }

  function cookwareForMethod(methodId, baseId) {
    const map = {
      grill: "assets/cookware/grill_pan_steak_01.png",
      fry: "assets/cookware/frying_pan_food_01.png",
      saute: baseId === "dessert" ? "assets/cookware/saucepan_milk_01.png" : "assets/cookware/saucepan_empty_01.png",
      braise: "assets/cookware/pot_soup_01.png",
      steam: "assets/cookware/pot_boiling_water_01.png",
      smoke: "assets/cookware/wok_stirfry_01.png",
      bake: "assets/cookware/pie_pan.svg"
    };
    return map[methodId] || "assets/cookware/pot_empty_01.png";
  }

  function utensilForMethod(methodId) {
    const map = {
      grill: "assets/cookware/tongs_01.png",
      fry: "assets/cookware/spatula_01.png",
      saute: "assets/cookware/wooden_spoon_01.png",
      braise: "assets/cookware/ladle_01.png",
      steam: "assets/cookware/ladle_01.png",
      smoke: "assets/cookware/spatula_01.png",
      bake: "assets/cookware/wooden_spoon_01.png"
    };
    return map[methodId] || "assets/cookware/wooden_spoon_01.png";
  }

  function fireAssetsFor(state, player) {
    const data = ns.data;
    const sourceIds = (player.picks && player.picks.length ? player.picks : state.base.likes || []).slice(0, 3);
    const fallbackIds = ["butter", "garlic", "chili"];
    return (sourceIds.length ? sourceIds : fallbackIds).map((id, index) => {
      const item = data.INGREDIENTS.find((entry) => entry.id === id);
      const cookedAsset = item?.cookAsset || item?.prepChoppedAsset || item?.prepAsset || item?.asset;
      return {
        id,
        item,
        cookedAsset,
        label: index === 0 ? "Sizzle" : index === 1 ? "Fold" : "Finish"
      };
    });
  }

  function spawnMiniFx(kind, label, imageSrc) {
    const mini = document.getElementById("visualMiniGame");
    if (!mini) return;
    const fx = document.createElement("div");
    fx.className = `mini-fx mini-fx-${kind}`;
    fx.style.left = `${18 + Math.random() * 64}%`;
    fx.style.top = `${16 + Math.random() * 58}%`;
    fx.style.setProperty("--delay", `${Math.random() * 60}ms`);
    fx.innerHTML = `
      ${imageSrc ? `<img src="${imageSrc}" alt="" />` : ""}
      ${label ? `<span>${label}</span>` : ""}
    `;
    mini.appendChild(fx);
    window.setTimeout(() => fx.remove(), 1100);
  }

  function flashMiniGame(kind = "hit") {
    const mini = document.getElementById("visualMiniGame");
    if (!mini) return;
    mini.classList.add(`mini-hit-${kind}`);
    window.clearTimeout(mini._flashTimer);
    mini._flashTimer = window.setTimeout(() => {
      mini.classList.remove(`mini-hit-${kind}`);
    }, 180);
  }

  function phaseWindow(phase) {
    const mobile = typeof window !== "undefined" && window.innerWidth < 720;
    const table = {
      prep: mobile ? [34, 68] : [40, 62],
      fire: mobile ? [41, 79] : [46, 74],
      plate: mobile ? [52, 88] : [58, 84]
    };
    return table[phase.id] || [40, 70];
  }

  function visualForPhase(phase, state, player) {
    const mini = document.getElementById("visualMiniGame");
    if (!mini) return;
    const playerName = player.name;
    if (phase.id === "prep") {
      const assets = prepAssetsFor(state, player, state._action?.prepChopCount || 0);
      mini.innerHTML = `
        <div class="prep-stage">
          <img src="assets/props/cutting_board_01.png" alt="" class="prep-board" />
          <img src="${playerImageForKey(state._action?.playerKey || "p1")}" alt="" class="prep-chef" />
          <img src="assets/chefs/chef_knife_01.png" alt="" class="prep-knife" />
          <div class="prep-tray">
            ${assets.map((entry) => `
              <div class="prep-ingredient ${entry.chopped ? "chopped" : ""}">
                <img src="${entry.asset || "assets/cookware/plate.svg"}" alt="" />
                <span>${entry.item?.name || entry.id}</span>
              </div>
            `).join("")}
          </div>
          <div class="phase-copy prep-copy">
            <strong>Chopping station</strong>
            <span>${playerName} is slicing ingredients on the board.</span>
          </div>
        </div>
      `;
    } else if (phase.id === "fire") {
      const cookAssets = fireAssetsFor(state, player);
      const temp = player.temp || 375;
      mini.innerHTML = `
        <div class="phase-visual stove-visual">
          <img src="${stoveBurnerFor(temp)}" alt="" class="stove-burner" />
          <img src="${cookwareForMethod(player.method, state.base.id)}" alt="" class="stove-cookware" />
          <img src="${utensilForMethod(player.method)}" alt="" class="stove-utensil" />
          <div class="stove-ingredients">
            ${cookAssets.map((entry) => `
              <div class="stove-ingredient">
                <img src="${entry.cookedAsset || "assets/cookware/plate.svg"}" alt="" />
                <span>${entry.item?.name || entry.id}</span>
              </div>
            `).join("")}
          </div>
          <img src="assets/fx/open_flame_01.svg" alt="" class="stove-fx stove-fx-flame" />
          <img src="assets/fx/smoke_fx_01.svg" alt="" class="stove-fx stove-fx-smoke" />
          <div class="phase-copy">
            <strong>Open flames</strong>
            <span>Keep the pan moving and the heat under control.</span>
          </div>
        </div>
      `;
    } else {
      mini.innerHTML = `
        <div class="phase-visual plate-visual">
          <div class="plate-mini"></div>
          <img src="assets/fx/score_popup_01.png" alt="" class="phase-icon phase-fx-icon" />
          <div class="phase-copy">
            <strong>Plating window</strong>
            <span>Serve the judges a clean finish.</span>
          </div>
        </div>
      `;
    }
    audio.cue(phase.id === "prep" ? "chop" : phase.id === "fire" ? "sizzle" : "serve");
  }

  function setPhaseUI(state, phase, player) {
    const label = document.getElementById("actionPhaseLabel");
    const stat = document.getElementById("actionPhaseStat");
    const coach = document.getElementById("actionCoachLine");
    const instruction = document.getElementById("actionInstruction");
    const tapBtn = document.getElementById("actionTapBtn");
    const skipBtn = document.getElementById("actionSkipBtn");
    const scorePill = document.getElementById("actionScorePill");
    const log1 = document.getElementById("log1");
    const log2 = document.getElementById("log2");
    const log3 = document.getElementById("log3");
    [log1, log2, log3].forEach((node, index) => node?.classList.toggle("active", index === state._action.phaseIndex));
    if (label) label.textContent = phase.label;
    if (stat) stat.textContent = `${player.name} - ${phase.action}`;
    if (coach) coach.textContent = phase.prompt;
    if (instruction) instruction.textContent = `${phase.prompt} Tap the moving marker to freeze and score.`;
    if (tapBtn) tapBtn.textContent = phase.action;
    if (skipBtn) skipBtn.textContent = state._action.phaseIndex === PHASES.length - 1 ? "Finish" : "Skip";
    if (scorePill) scorePill.textContent = `Mini-Game +${state.actionBonuses[state._action.playerKey][phase.bonusKey] || 0}`;
    visualForPhase(phase, state, player);
  }

  function setMarkerPosition() {
    const state = ns.state;
    const meter = document.getElementById("actionFill");
    const marker = document.getElementById("actionMarker");
    if (!meter || !marker || !state._action) return;
    const x = state._action.marker;
    meter.style.width = `${x}%`;
    marker.style.left = `${x}%`;
  }

  function setSafeZone(start, end) {
    const zone = document.getElementById("actionSafeZone");
    if (!zone) return;
    zone.style.left = `${start}%`;
    zone.style.right = `${100 - end}%`;
  }

  function addActionBonus(state, key, phase, amount, text) {
    const slot = state.actionBonuses[key];
    slot[phase.bonusKey] = (slot[phase.bonusKey] || 0) + amount;
    state.actionLog[key].push(text);
    const pill = document.getElementById("actionScorePill");
    if (pill) {
      const total = Math.round(slot.flavor + slot.technique + slot.creativity + slot.presentation);
      pill.textContent = `Mini-Game +${total}`;
    }
  }

  function finalizePhase(state, value) {
    const phase = PHASES[state._action.phaseIndex];
    const roll = Math.max(0, Math.min(1, value));
    const points = Math.round(phase.id === "fire" ? 6 + roll * 16 : phase.id === "plate" ? 5 + roll * 14 : 5 + roll * 12);
    const text = roll > 0.7 ? `Perfect ${phase.label.toLowerCase()} +${points}` : roll > 0.45 ? `Good ${phase.label.toLowerCase()} +${points}` : `Scraped ${phase.label.toLowerCase()} +${Math.max(1, points - 4)}`;
    addActionBonus(state, state._action.playerKey, phase, roll > 0.45 ? points : Math.max(1, points - 4), text);
    if (roll > 0.7) {
      spawnMiniFx("score", `+${points}`, "assets/fx/score_popup_01.png");
      audio.cue("combo");
    } else if (roll > 0.45) {
      audio.cue("good");
    } else {
      audio.cue("tap");
    }
  }

  function updateMiniGameVisual(phase, marker) {
    const mini = document.getElementById("visualMiniGame");
    if (!mini) return;
    const phaseClass = phase.className;
    const label = phase.label;
    mini.querySelectorAll(".phase-beat").forEach((node) => node.remove());
    const beat = document.createElement("div");
    beat.className = `phase-beat ${phaseClass}`;
    beat.innerHTML = `<span>${label}</span>`;
    beat.style.left = `${marker}%`;
    mini.appendChild(beat);
  }

  function runPhase(state, onComplete) {
    const phase = PHASES[state._action.phaseIndex];
    const player = state[state._action.playerKey];
    const duration = state.speed === "fast" ? 4200 : state.speed === "slow" ? 7000 : 5600;
    const [safeStart, safeEnd] = phaseWindow(phase);
    setSafeZone(safeStart, safeEnd);
    setPhaseUI(state, phase, player);
    audio.cue("crowd");
    state._action.marker = 8;
    state._action.direction = 1;
    state._action.startedAt = performance.now();
    state._action.running = true;
    state._action.accuracy = 0;
    state._action.advance = onComplete;

    const tick = (now) => {
      if (!state._action.running) return;
      if (state._action.pauseUntil && now < state._action.pauseUntil) {
        setMarkerPosition();
        updateMiniGameVisual(phase, state._action.marker);
        state._action.raf = requestAnimationFrame(tick);
        return;
      }
      const elapsed = now - state._action.startedAt;
      const progress = Math.min(1, elapsed / duration);
      const pingPong = Math.sin(progress * Math.PI * 2);
      state._action.marker = 50 + pingPong * 36;
      setMarkerPosition();
      updateMiniGameVisual(phase, state._action.marker);
      if (progress >= 1) {
        state._action.running = false;
        finalizePhase(state, state._action.accuracy * 0.25);
        onComplete();
        return;
      }
      state._action.raf = requestAnimationFrame(tick);
    };
    state._action.timeout = window.setTimeout(() => {
      if (!state._action.running) return;
      state._action.running = false;
      finalizePhase(state, Math.max(0.15, state._action.accuracy * 0.2));
      onComplete();
    }, duration + 40);
    state._action.raf = requestAnimationFrame(tick);
  }

  function tapAction(state) {
    if (!state._action?.running) return;
    const phase = PHASES[state._action.phaseIndex];
    const [safeStart, safeEnd] = phaseWindow(phase);
    const marker = state._action.marker;
    const inside = marker >= safeStart && marker <= safeEnd;
    const distance = inside ? 0 : Math.min(Math.abs(marker - safeStart), Math.abs(marker - safeEnd));
    const accuracy = inside ? 1 : Math.max(0, 1 - distance / 18);
    state._action.accuracy = Math.max(state._action.accuracy, accuracy);
    audio.cue(inside ? "sparkle" : "tap");
    if (inside) {
      state._action.pauseUntil = performance.now() + 260;
      state._action.marker = Math.max(safeStart, Math.min(safeEnd, state._action.marker));
      if (state._action.phaseIndex === 0) {
        state._action.prepChopCount = Math.min(3, (state._action.prepChopCount || 0) + 1);
      }
      setMarkerPosition();
      updateMiniGameVisual(phase, state._action.marker);
      flashMiniGame("hit");
      visualForPhase(phase, state, state[state._action.playerKey]);
      if (phase.id === "prep") {
        spawnMiniFx("chop", "Chop", "assets/fx/chop_particles_01.png");
        spawnMiniFx("slash", null, "assets/fx/knife_slash_fx_01.png");
        audio.cue("knife");
        if ((state._action.prepChopCount || 0) >= 3) {
          spawnMiniFx("combo", "Combo", "assets/fx/combo_popup_01.png");
          audio.cue("combo");
        }
      } else if (phase.id === "fire") {
        spawnMiniFx("steam", "Steam", "assets/fx/steam_fx_01.svg");
        spawnMiniFx("oil", null, "assets/fx/oil_splash_fx_01.png");
        audio.cue(Math.random() > 0.5 ? "stir" : "oil");
      } else {
        spawnMiniFx("score", "Plate", "assets/fx/score_popup_01.png");
        audio.cue("plate");
      }
    } else {
      flashMiniGame("miss");
    }
  }

  function skipAction(state) {
    if (!state._action) return;
    state._action.running = false;
    clearTimeout(state._action.timeout);
    cancelAnimationFrame(state._action.raf);
    finalizePhase(state, state._action.accuracy * 0.1);
    state._action.advance?.();
    audio.cue("judge");
  }

  function startActionRound(state, playerKey, onComplete) {
    ns.state = state;
    state._action = createActionState(playerKey);
    resetActionBonuses(state);
    const tapBtn = document.getElementById("actionTapBtn");
    const skipBtn = document.getElementById("actionSkipBtn");
    if (tapBtn) tapBtn.onclick = () => tapAction(state);
    if (skipBtn) skipBtn.onclick = () => skipAction(state);

    const next = () => {
      if (state._action.phaseIndex >= PHASES.length - 1) {
        clearTimeout(state._action.timeout);
        cancelAnimationFrame(state._action.raf);
        state._action.running = false;
        onComplete?.();
        return;
      }
      state._action.phaseIndex += 1;
      runPhase(state, next);
    };
    runPhase(state, next);
  }

  function simulateAiAction(state, playerKey) {
    if (state.mode === "openKitchen") return null;
    const bonus = { flavor: 0, technique: 0, creativity: 0, presentation: 0 };
    PHASES.forEach((phase) => {
      const base = phase.id === "fire" ? 8 : phase.id === "plate" ? 7 : 6;
      const roll = Math.random() * 0.9 + 0.1;
      bonus[phase.bonusKey] += Math.round(base + roll * 14);
      state.actionLog[playerKey].push(`${phase.label} bot +${Math.round(base + roll * 14)}`);
    });
    state.actionBonuses[playerKey] = bonus;
    return bonus;
  }

  ns.minigames = {
    PHASES,
    resetActionBonuses,
    startActionRound,
    simulateAiAction,
    setSafeZone,
    setMarkerPosition
  };
})();
