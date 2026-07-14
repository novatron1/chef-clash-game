(function () {
  const ns = window.ChefClash = window.ChefClash || {};
  const data = ns.data;
  const scoring = ns.scoring;

  const ids = [
    "installBtn", "homeBtn", "quickBattleBtn", "careerModeBtn", "openKitchenBtn", "recipeLibraryBtn", "assetReferenceBtn", "playAgainBtn", "backHomeBtn", "libraryBackBtn", "assetsBackBtn",
    "p1Name", "p2Name", "modeSelect", "difficultySelect", "costModeSelect", "pantryStyleSelect",
    "coachModeSelect", "speedSelect", "bestPill",
    "buildTitle", "playerPill", "switchPlayerBtn", "randomizeBtn", "clearBtn", "costPill",
    "categoryTabs", "ingredientGrid", "plateSelect", "tempLabel", "timeLabel", "amountLabel",
    "tempRange", "timeRange", "amountRange", "donenessReadout", "controlReadout", "riskReadout",
    "coachBtn", "coachLines", "lockInBtn", "startCookBtn", "selectedCount", "comboText", "comboBar",
    "comboHints", "selectedList", "baseArt", "dishStack",
    "worldMap", "careerGrid", "careerRank", "careerFans", "careerTrophies", "careerModal",
    "closeCareerModalBtn", "fightBossBtn", "modalAvatar", "modalName", "modalRegion", "modalNote",
    "cookTitle", "cookP1Name", "cookP2Name", "cookP1Dish", "cookP2Dish", "showCardLeftName",
    "showCardRightName", "heatHud", "timeHud", "hypeHud", "hypeLabel", "hypeMeter",
    "arena", "flame", "steamTrail", "coachCallout", "roundBanner", "dishReveal", "actionScorePill",
    "actionInstruction", "visualMiniGame", "actionSafeZone", "actionFill", "actionMarker",
    "actionTapBtn", "actionSkipBtn", "actionPhaseLabel", "actionPhaseStat", "actionCoachLine",
    "log1", "log2", "log3", "winnerTitle", "resultsGrid", "judgeComments", "saveRecipeBtn",
    "judgeTestBtn", "recipeLibraryGrid", "recipeLibraryDetail", "recipeLibraryCount", "libraryScreen", "assetReferenceGrid", "assetReferenceCount", "assetsScreen", "toast"
  ];

  function cache() {
    const out = {};
    ids.forEach((id) => { out[id] = document.getElementById(id); });
    return out;
  }

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.toggle("active", screen.id === `${name}Screen`);
    });
  }

  function toast(message) {
    const node = document.getElementById("toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(node._timer);
    node._timer = setTimeout(() => node.classList.remove("show"), 1600);
  }

  function bestPill(best) {
    const node = document.getElementById("bestPill");
    if (node) node.textContent = `Best ${best}`;
  }

  function setOpenKitchenActions(visible) {
    ["saveRecipeBtn", "judgeTestBtn"].forEach((id) => {
      document.getElementById(id)?.classList.toggle("hidden", !visible);
    });
  }

  function assetFor(item, fallback) {
    return item?.asset || fallback || "";
  }

  function plateAssetFor(plateId) {
    const map = {
      street: "assets/plating/plates/plate_black_round_01.png",
      fine: "assets/plating/plates/plate_white_round_01.png",
      comfort: "assets/plating/plates/plate_stone_round_01.png",
      fusion: "assets/plating/plates/plate_slate_rect_01.png"
    };
    return map[plateId] || "assets/cookware/plate.svg";
  }

  function platedFoodAssetFor(state, player) {
    const picked = player.picks.map((id) => data.INGREDIENTS.find((item) => item.id === id)).filter(Boolean);
    const ids = new Set([state.base?.id, ...picked.map((item) => item.id)].filter(Boolean));
    const hasAny = (...values) => values.some((value) => ids.has(value));
    if (hasAny("pie", "dessert")) return state.base?.asset || "assets/ingredients/pie.svg";
    if (hasAny("steak", "beefbites", "lamb", "duck", "porkbelly")) return "assets/plating/plated_food/sliced_steak_01.png";
    if (hasAny("shrimp", "crab", "lobster", "scallop")) return "assets/plating/plated_food/grilled_shrimp_01.png";
    if (hasAny("salmon", "fish", "tuna")) return "assets/plating/plated_food/seared_salmon_01.png";
    if (hasAny("rice", "ricebowl", "tofu", "broccoli", "zucchini", "asparagus", "spinach", "eggplant", "beet", "cabbage")) return "assets/plating/plated_food/roasted_vegetables_01.png";
    if (hasAny("pasta", "mushroom", "cheese", "cream", "creamcheese", "ricotta", "mozzarella")) return "assets/plating/plated_food/risotto_cream_01.png";
    return "assets/plating/plated_food/roasted_vegetables_01.png";
  }

  function garnishAssetFor(item, index) {
    const id = item?.id || "";
    const category = item?.category || "";
    const direct = {
      basil: "assets/plating/garnishes/basil_leaves_01.png",
      rosemary: "assets/plating/garnishes/rosemary_sprig_01.png",
      thyme: "assets/plating/garnishes/thyme_sprig_01.png",
      dill: "assets/plating/garnishes/microgreens_01.png",
      mint: "assets/plating/garnishes/edible_flowers_01.png",
      cilantro: "assets/plating/garnishes/microgreens_01.png",
      scallion: "assets/plating/garnishes/chives_01.png",
      lemon: "assets/plating/garnishes/lemon_zest_01.png",
      lime: "assets/plating/garnishes/lemon_zest_01.png",
      cherry: "assets/plating/garnishes/edible_flowers_01.png",
      blueberry: "assets/plating/garnishes/microgreens_01.png",
      peach: "assets/plating/garnishes/edible_flowers_01.png",
      pie: "assets/plating/garnishes/edible_flowers_01.png"
    };
    if (direct[id]) return direct[id];
    if (category === "herb") return ["assets/plating/garnishes/microgreens_01.png", "assets/plating/garnishes/basil_leaves_01.png", "assets/plating/garnishes/rosemary_sprig_01.png", "assets/plating/garnishes/thyme_sprig_01.png"][index % 4];
    if (category === "fruit" || category === "baking" || category === "sweet") return ["assets/plating/garnishes/edible_flowers_01.png", "assets/plating/garnishes/lemon_zest_01.png", "assets/plating/garnishes/microgreens_01.png"][index % 3];
    if (category === "meat" || category === "seafood" || category === "vegetable" || category === "starch") return ["assets/plating/garnishes/microgreens_01.png", "assets/plating/garnishes/radish_slices_01.png", "assets/plating/garnishes/chives_01.png"][index % 3];
    if (category === "dairy") return ["assets/plating/garnishes/edible_flowers_01.png", "assets/plating/garnishes/microgreens_01.png"][index % 2];
    return item?.asset || "assets/cookware/plate.svg";
  }

  function sauceAssetFor(state, index = 0) {
    const baseId = state.base?.id || "";
    const dessertSet = ["pie", "dessert"];
    const seafoodSet = ["fish", "salmon", "shrimp", "crab", "lobster", "tuna", "scallop"];
    const meatSet = ["steak", "beefbites", "lamb", "duck", "porkbelly", "sausage", "chicken", "chickenstrips", "chickenwing"];
    const vegetableSet = ["tofu", "rice", "ricebowl", "pasta", "broccoli", "zucchini", "asparagus", "spinach", "eggplant", "beet", "cabbage"];
    if (dessertSet.includes(baseId)) return ["assets/plating/sauces/cream_smear_01.png", "assets/plating/sauces/sauce_dots_01.png", "assets/plating/sauces/balsamic_drizzle_01.png"][index % 3];
    if (seafoodSet.includes(baseId)) return ["assets/plating/sauces/oil_drops_01.png", "assets/plating/sauces/sauce_dots_01.png", "assets/plating/sauces/puree_swoosh_01.png"][index % 3];
    if (meatSet.includes(baseId)) return ["assets/plating/sauces/sauce_smear_01.png", "assets/plating/sauces/balsamic_drizzle_01.png", "assets/plating/sauces/puree_swoosh_01.png"][index % 3];
    if (vegetableSet.includes(baseId)) return ["assets/plating/sauces/puree_swoosh_01.png", "assets/plating/sauces/sauce_smear_01.png", "assets/plating/sauces/oil_drops_01.png"][index % 3];
    return ["assets/plating/sauces/sauce_smear_01.png", "assets/plating/sauces/sauce_dots_01.png", "assets/plating/sauces/puree_swoosh_01.png"][index % 3];
  }

  function dishVisualFor(state, player) {
    const picked = player.picks.map((id) => data.INGREDIENTS.find((item) => item.id === id)).filter(Boolean);
    const plateArt = plateAssetFor(player.plate);
    const foodArt = platedFoodAssetFor(state, player);
    const garnishArt = garnishAssetFor(picked[0], 0);
    const sauceArt = sauceAssetFor(state, 1);
    return `
      <div class="result-plate-stage">
        <div class="plate-ring"></div>
        <div class="result-plate-media">
          <img src="${plateArt}" alt="" style="--layer:0;" class="result-layer result-plate-base" loading="lazy" />
          <img src="${foodArt}" alt="" style="--layer:1;" class="result-layer result-plate-food" loading="lazy" />
          ${garnishArt ? `<img src="${garnishArt}" alt="" style="--layer:2;" class="result-layer result-plate-garnish" loading="lazy" />` : ""}
          ${sauceArt ? `<img src="${sauceArt}" alt="" style="--layer:3;" class="result-layer result-plate-sauce" loading="lazy" />` : ""}
        </div>
        <div class="dish-stack result-dish-stack">${[state.base?.name || "Base", ...player.picks.slice(0, 3).map((id) => data.INGREDIENTS.find((x) => x.id === id)?.name || "")].filter(Boolean).join(" · ")}</div>
      </div>
    `;
  }

  function garnishVisualFor(player) {
    const picked = player.picks.map((id) => data.INGREDIENTS.find((item) => item.id === id)).filter(Boolean);
    const garnishIds = picked.slice(-3);
    return `
      <div class="garnish-strip">
        ${garnishIds.map((item, index) => {
          const art = garnishAssetFor(item, index);
          return `
            <div class="garnish-chip">
              <img src="${art}" alt="" loading="lazy" />
              <span>${item?.name || `Garnish ${index + 1}`}</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function finalTouchVisualFor(player) {
    const picked = player.picks.map((id) => data.INGREDIENTS.find((item) => item.id === id)).filter(Boolean);
    const touchIds = picked.slice(0, 3);
    if (!touchIds.length) return "";
    return `
      <div class="final-touch-strip">
        ${touchIds.map((item, index) => {
          const art = [
            "assets/plating/tools/tweezers_01.png",
            "assets/plating/tools/sauce_squeeze_bottle_01.png",
            "assets/plating/tools/basting_brush_01.png"
          ][index] || item?.cookAsset || item?.prepChoppedAsset || item?.prepAsset || item?.asset || "assets/cookware/plate.svg";
          const label = index === 0 ? "Finish" : index === 1 ? "Sauce" : "Lift";
          return `
            <div class="final-touch-chip">
              <img src="${art}" alt="" loading="lazy" />
              <span>${label}</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function ingredientRailFor(state, player) {
    const picked = player.picks.map((id) => data.INGREDIENTS.find((item) => item.id === id)).filter(Boolean);
    const railItems = [state.base, ...picked].slice(0, 5).filter(Boolean);
    return `
      <div class="result-ingredient-rail">
        ${railItems.map((item, index) => {
          const art = item?.prepChoppedAsset || item?.prepAsset || item?.asset || item?.cookAsset || "assets/cookware/plate.svg";
          const label = index === 0 ? "Base" : item?.name || "Item";
          return `
            <div class="result-ingredient-chip">
              <img src="${art}" alt="" loading="lazy" />
              <span>${label}</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function propRailFor() {
    const props = [
      { src: "assets/props/olive_oil_bottle_01.png", label: "Oil" },
      { src: "assets/props/salt_shaker.svg", label: "Salt" },
      { src: "assets/props/spice_jar.svg", label: "Spice" },
      { src: "assets/props/squeeze_bottle.svg", label: "Sauce" },
      { src: "assets/plating/plates/plate_white_round_01.png", label: "Plate" },
      { src: "assets/plating/tools/tweezers_01.png", label: "Tweezers" },
      { src: "assets/plating/tools/basting_brush_01.png", label: "Brush" }
    ];
    return `
      <div class="judge-prop-rail">
        ${props.map((item) => `
          <div class="judge-prop-chip">
            <img src="${item.src}" alt="" loading="lazy" />
            <span>${item.label}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function medalLabelFor(total, isWinner) {
    if (isWinner && total >= 90) return "Legendary Gold";
    if (isWinner && total >= 80) return "Champion Gold";
    if (isWinner && total >= 70) return "Silver Finish";
    if (total >= 60) return "Bronze Finish";
    return "Finish Line";
  }

  function judgeVerdictLines(judgeName, result, isWinner, rivalName, baseId) {
    const bucket = result.reaction?.bucket || "strong";
    const dessertLines = {
      winner: [
        "That dessert landed clean and the finish stayed elegant.",
        "The sweetness was controlled and the plate looked ready for a magazine shoot."
      ],
      loser: [
        "The dessert idea was strong, but the rival had the cleaner finish.",
        "A little more balance on the sweet side would have helped."
      ]
    };
    const pieLines = {
      winner: [
        "That pie crust held together like a TV finale.",
        "The filling and finish came off like a proper bakery callout."
      ],
      loser: [
        "The pie had spirit, but the crust and filling needed tighter control.",
        "One more clean bake could have changed the story."
      ]
    };
    const seafoodLines = {
      winner: [
        "The seafood stayed bright and never overcooked itself.",
        "Clean heat, clean finish, exactly what the judges wanted."
      ],
      loser: [
        "The seafood direction was sound, but the rival got the cleaner landing.",
        "A little less heat and a little more polish would have helped."
      ]
    };
    const savoryLines = {
      winner: [
        "That savory plate had real restaurant confidence.",
        "The seasoning stack landed with authority."
      ],
      loser: [
        "Good savory instincts, but the rival had the sharper read.",
        "The plate needed one more level of depth."
      ]
    };
    const winnerMap = {
      "Chef Vex": [
        "That finish belongs in a highlight reel.",
        "The heat stayed controlled and the plate kept its nerve."
      ],
      "Mama Mirepoix": [
        "That’s a real kitchen champion plate.",
        "The seasoning and heart both showed up."
      ],
      "Professor Palate": [
        "The numbers agree: this is the cleanest plate.",
        "Balance, timing, and presentation all lined up."
      ]
    };
    const loserMap = {
      "Chef Vex": [
        `The ${bucket} looked promising, but ${rivalName} had the cleaner close.`,
        "A tougher landing than the rival. The finish needed more polish."
      ],
      "Mama Mirepoix": [
        `The flavor idea was there, but ${rivalName} served the sharper plate.`,
        "Good spirit, but the sauce and balance needed one more pass."
      ],
      "Professor Palate": [
        "Close, but the arithmetic went the other way.",
        "One or two cleaner decisions would have flipped the result."
      ]
    };
    const coursePool = baseId === "pie"
      ? pieLines
      : baseId === "dessert"
        ? dessertLines
        : ["fish", "salmon", "shrimp", "tuna", "scallop"].includes(baseId)
          ? seafoodLines
          : savoryLines;
    const courseLine = (isWinner ? coursePool.winner : coursePool.loser)[Math.floor(Math.random() * (isWinner ? coursePool.winner.length : coursePool.loser.length))];
    const pool = isWinner ? winnerMap[judgeName] : loserMap[judgeName];
    return `${courseLine} ${pool[Math.floor(Math.random() * pool.length)]}`;
  }

  function ingredientCard(item, state, locked) {
    const selected = state.picks.includes(item.id);
    const art = item.prepAsset || assetFor(item, "");
    const visual = art
      ? `<img class="ingredient-art" src="${art}" alt="" loading="lazy" />`
      : `<div class="ingredient-fallback">${item.emoji}</div>`;
    return `
      <button class="ingredient-card ${selected ? "selected" : ""} ${locked ? "locked" : ""}" data-ingredient="${item.id}" ${locked ? "disabled" : ""} aria-label="${item.name}, cost ${item.cost}">
        ${visual}
        <div class="ingredient-meta">
          <strong class="ingredient-name">${item.name}</strong>
          <div class="ingredient-cost">Cost ${item.cost}</div>
        </div>
      </button>
    `;
  }

  function renderCategoryTabs(state) {
    const wrap = document.getElementById("categoryTabs");
    if (!wrap) return;
    wrap.innerHTML = data.CATEGORY_INFO.map((cat) => `
      <button type="button" class="${state.activeCategory === cat.id ? "active" : ""}" data-category="${cat.id}" aria-pressed="${state.activeCategory === cat.id ? "true" : "false"}">${cat.label}</button>
    `).join("");
    wrap.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeCategory = button.dataset.category;
        const grid = document.getElementById("ingredientGrid");
        if (grid) grid.scrollTop = 0;
        renderCategoryTabs(state);
        renderIngredientGrid(state);
      });
    });
  }

  function renderIngredientGrid(state) {
    const wrap = document.getElementById("ingredientGrid");
    if (!wrap) return;
    const list = data.INGREDIENTS.filter((item) => state.activeCategory === "all" || item.category === state.activeCategory);
    const current = state[state.buildPlayer];
    const sandbox = state.mode === "openKitchen";
    const activeLabel = data.CATEGORY_INFO.find((cat) => cat.id === state.activeCategory)?.label || "All";
    wrap.innerHTML = `
      <div class="ingredient-filter-status">
        <strong>${activeLabel}</strong>
        <span>${list.length} ingredients</span>
      </div>
      ${list.map((item) => {
      const spent = current.picks.reduce((sum, id) => sum + (data.INGREDIENTS.find((x) => x.id === id)?.cost || 0), 0);
      const wouldSpend = spent + (current.picks.includes(item.id) ? 0 : item.cost);
      const locked = !sandbox && (current.picks.length >= state.maxExtras || (state.budgetMode !== "open" && wouldSpend > state.budget));
      return ingredientCard(item, current, locked);
      }).join("")}
    `;
  }

  function renderMethods(state) {
    const wrap = document.getElementById("selectedList");
    if (!wrap) return;
    const current = state[state.buildPlayer];
    const picks = current.picks.map((id) => data.INGREDIENTS.find((item) => item.id === id)).filter(Boolean);
    wrap.innerHTML = `
      <div class="selected-item">
        <div>
          <strong>${state.base.emoji} ${state.base.name}</strong>
          <div class="tiny-note">Base ingredient</div>
        </div>
        <span class="pill">${picks.length} extras</span>
      </div>
      ${picks.map((item) => `
        <div class="selected-item">
          <div>
            <strong>${item.emoji} ${item.name}</strong>
            <div class="tiny-note">${item.tags?.join(" · ") || ""}</div>
          </div>
          <button class="ghost" data-remove="${item.id}">Remove</button>
        </div>
      `).join("")}
    `;
  }

  function renderPlateOptions(state) {
    const select = document.getElementById("plateSelect");
    if (!select) return;
    const current = state[state.buildPlayer];
    select.innerHTML = Object.entries(data.PLATES).map(([id, plate]) => `<option value="${id}">${plate.name}</option>`).join("");
    select.value = current.plate;
  }

  function renderBaseSelect(state) {
    const select = document.getElementById("baseSelect");
    if (!select) return;
    select.innerHTML = data.BASES.map((base) => `<option value="${base.id}">${base.emoji} ${base.name}</option>`).join("");
    select.value = state.base.id;
  }

  function renderMethodGrid(state, onSelect) {
    const grid = document.getElementById("methodGrid");
    if (!grid) return;
    const current = state[state.buildPlayer];
    grid.innerHTML = data.METHODS.map((method) => `
      <button class="method-card ${current.method === method.id ? "active" : ""}" data-method="${method.id}">
        <strong>${method.emoji} ${method.name}</strong>
        <span>${method.desc}</span>
      </button>
    `).join("");
    grid.querySelectorAll("[data-method]").forEach((button) => {
      button.addEventListener("click", () => onSelect(button.dataset.method));
    });
  }

  function renderBuildSummary(state, scoringResult) {
    const current = state[state.buildPlayer];
    const selectedCount = document.getElementById("selectedCount");
    if (selectedCount) {
      selectedCount.textContent = state.mode === "openKitchen" || !Number.isFinite(state.maxExtras)
        ? `${current.picks.length} / ∞`
        : `${current.picks.length} / ${state.maxExtras}`;
    }
    const costPill = document.getElementById("costPill");
    if (costPill) {
      costPill.textContent = state.mode === "openKitchen"
        ? "Unlimited cost"
        : state.budgetMode === "open"
          ? "Open cost"
          : `Cost ${state.budget}`;
    }
    const playerPill = document.getElementById("playerPill");
    if (playerPill) playerPill.textContent = state.buildPlayer === "p1" ? "P1" : "P2";
    const buildTitle = document.getElementById("buildTitle");
    if (buildTitle) buildTitle.textContent = `${current.name}'s Dish`;
    const baseArt = document.getElementById("baseArt");
    if (baseArt) baseArt.src = state.base.asset || data.INGREDIENTS.find((x) => x.id === state.base.id)?.asset || "assets/cookware/plate.svg";
    const dishStack = document.getElementById("dishStack");
    if (dishStack) {
      dishStack.textContent = [state.base.emoji, ...current.picks.map((id) => data.INGREDIENTS.find((x) => x.id === id)?.emoji || "")]
        .join(" ");
    }
    const comboBar = document.getElementById("comboBar");
    const comboText = document.getElementById("comboText");
    const comboHints = document.getElementById("comboHints");
    const percent = scoringResult ? Math.min(100, Math.max(0, Math.round((scoringResult.creativity + scoringResult.flavor - 80) * 0.9))) : Math.min(100, current.picks.length * 18);
    if (comboBar) comboBar.style.width = `${percent}%`;
    if (comboText) comboText.textContent = `${percent}%`;
    if (comboHints) comboHints.textContent = scoringResult?.notes?.[0] || "Choose ingredients to discover combo bonuses.";
  }

  function renderControlLabels(state, status) {
    const tempLabel = document.getElementById("tempLabel");
    const timeLabel = document.getElementById("timeLabel");
    const amountLabel = document.getElementById("amountLabel");
    const donenessReadout = document.getElementById("donenessReadout");
    const controlReadout = document.getElementById("controlReadout");
    const riskReadout = document.getElementById("riskReadout");
    const current = state[state.buildPlayer];
    if (tempLabel) tempLabel.textContent = `${current.temp}°F`;
    if (timeLabel) timeLabel.textContent = `${current.time} min`;
    if (amountLabel) amountLabel.textContent = `${current.amount} portions`;
    if (donenessReadout) donenessReadout.textContent = status?.doneness || "Good";
    if (controlReadout) controlReadout.textContent = status?.control || "Stable";
    if (riskReadout) riskReadout.textContent = status?.risk || "Low";
  }

  function renderCareer(state, bosses, progression, onSelect) {
    const map = document.getElementById("worldMap");
    const grid = document.getElementById("careerGrid");
    const rank = document.getElementById("careerRank");
    const fans = document.getElementById("careerFans");
    const trophies = document.getElementById("careerTrophies");
    const defeatedCount = Object.keys(progression.defeated || {}).length;
    if (rank) rank.textContent = defeatedCount >= 6 ? "Legend" : defeatedCount >= 3 ? "Head Chef" : defeatedCount >= 1 ? "Sous Chef" : "Rookie";
    if (fans) fans.textContent = String(progression.fans || 0);
    if (trophies) trophies.textContent = `${defeatedCount}/${bosses.length}`;
    if (map) {
      map.innerHTML = bosses.map((boss) => `
        <button class="career-pin ${progression.defeated?.[boss.id] ? "defeated" : ""}" style="left:${boss.x}%;top:${boss.y}%;" data-boss="${boss.id}" title="${boss.name}">
          <span>${boss.emoji}</span>
        </button>
      `).join("");
      map.querySelectorAll("[data-boss]").forEach((button) => {
        button.addEventListener("click", () => onSelect(button.dataset.boss));
      });
    }
    if (grid) {
      grid.innerHTML = bosses.map((boss, index) => {
        const locked = index > (progression.unlocked || 0);
        const defeated = !!progression.defeated?.[boss.id];
        return `
          <article class="career-card ${locked ? "locked" : ""} ${defeated ? "defeated" : ""}">
            <div class="career-avatar" style="background:linear-gradient(180deg, ${boss.colors[0]}, ${boss.colors[1]});">${boss.emoji}</div>
            <h4>${boss.name}</h4>
            <p>${boss.region}</p>
            <p>${boss.style}</p>
            <button data-boss="${boss.id}" ${locked ? "disabled" : ""}>${defeated ? "Rechallenge" : locked ? "Locked" : "Challenge"}</button>
          </article>
        `;
      }).join("");
      grid.querySelectorAll("[data-boss]").forEach((button) => {
        button.addEventListener("click", () => onSelect(button.dataset.boss));
      });
    }
  }

  function renderResults(state, r1, r2) {
    setOpenKitchenActions(false);
    const grid = document.getElementById("resultsGrid");
    if (!grid) return;
    const winnerIsP1 = r1.total >= r2.total;
    const diff = Math.abs(r1.total - r2.total);
    const leadLabel = diff === 0 ? "Dead heat" : diff < 6 ? "Photo finish" : "Clear winner";
    const hype = Math.min(100, Math.round((r1.total + r2.total) * 0.55));
    const winnerPlayer = winnerIsP1 ? state.p1 : state.p2;
    const winnerResult = winnerIsP1 ? r1 : r2;
    const winnerMedal = medalLabelFor(winnerResult.total, true);
    const runnerMedal = medalLabelFor((winnerIsP1 ? r2 : r1).total, false);
    grid.innerHTML = `
      <section class="glass panel judge-stage">
        <div class="winner-confetti" aria-hidden="true">
          ${Array.from({ length: 14 }).map((_, index) => `<span style="--i:${index};"></span>`).join("")}
        </div>
        <div class="broadcast-sweep"></div>
        <div class="broadcast-flash"></div>
        <div class="winner-reveal">
          <div class="winner-reveal-trophy">
            <img src="assets/ui/trophy.svg" alt="" />
          </div>
          <div class="winner-reveal-copy">
            <p class="eyebrow">Kitchen Champion</p>
            <h3>${resultText(winnerPlayer.name)} takes the win</h3>
            <p>${resultText(winnerResult.dish)} ends the round on ${winnerResult.total} points.</p>
            <div class="winner-rank-strip">
              <span class="winner-rank-chip">${winnerMedal}</span>
              <span class="winner-rank-chip">Rank up +1</span>
              <span class="winner-rank-chip">Broadcast Final</span>
            </div>
          </div>
        </div>
        <div class="judge-stage-head">
          <div>
            <p class="eyebrow">Judge Table</p>
            <h3>Plated reveal</h3>
          </div>
          <div class="judge-stage-badges">
            <span class="pill">${winnerIsP1 ? state.p1.name : state.p2.name} takes it</span>
            <span class="pill">${r1.reaction?.bucket === "excellent" || r2.reaction?.bucket === "excellent" ? "Showstopper" : "Hot decision"}</span>
            <span class="pill">${leadLabel}</span>
          </div>
        </div>
        <div class="live-ticker">
          <span>LIVE</span>
          <strong>${state.base.name} face-off</strong>
          <em>${hype}% hype</em>
          <em>${winnerIsP1 ? state.p1.name : state.p2.name} leading</em>
        </div>
        ${propRailFor()}
        <div class="broadcast-strip">
          <div class="broadcast-chip">
            <span>Hype</span>
            <strong>${hype}%</strong>
          </div>
          <div class="broadcast-chip">
            <span>Gap</span>
            <strong>${diff}</strong>
          </div>
          <div class="broadcast-chip">
            <span>Finish</span>
            <strong>${winnerIsP1 ? "P1" : "P2"}</strong>
          </div>
        </div>
        <div class="judge-table-grid">
          <div class="judge-table-card ${winnerIsP1 ? "winner" : ""}">
            <div class="judge-table-top">
              <div class="judge-table-avatar">
                <img src="assets/chefs/chef_01_chop_pose.png" alt="" />
              </div>
              <div>
                <strong>${state.p1.name}</strong>
                <span>${r1.dish}</span>
              </div>
              <div class="judge-table-score">${r1.total}</div>
            </div>
            ${dishVisualFor(state, state.p1)}
            ${ingredientRailFor(state, state.p1)}
            ${garnishVisualFor(state.p1)}
            ${finalTouchVisualFor(state.p1)}
            <div class="judge-reaction-banner ${r1.reaction?.bucket || "strong"}">
              <strong>${resultText(judgeVerdictLines("Chef Vex", r1, winnerIsP1, state.p2.name, state.base.id))}</strong>
              <span>${resultText(r1.reaction?.crowd || "The crowd leans in.")}</span>
            </div>
            <div class="judge-table-copy">${resultText(r1.reaction?.crowd || "The crowd is leaning in.")}</div>
          </div>
          <div class="judge-table-card ${!winnerIsP1 ? "winner" : ""}">
            <div class="judge-table-top">
              <div class="judge-table-avatar">
                <img src="assets/chefs/chef_02_chop_pose.png" alt="" />
              </div>
              <div>
                <strong>${state.p2.name}</strong>
                <span>${r2.dish}</span>
              </div>
              <div class="judge-table-score">${r2.total}</div>
            </div>
            ${dishVisualFor(state, state.p2)}
            ${ingredientRailFor(state, state.p2)}
            ${garnishVisualFor(state.p2)}
            ${finalTouchVisualFor(state.p2)}
            <div class="judge-reaction-banner ${r2.reaction?.bucket || "strong"}">
              <strong>${resultText(judgeVerdictLines("Mama Mirepoix", r2, !winnerIsP1, state.p1.name, state.base.id))}</strong>
              <span>${resultText(r2.reaction?.crowd || "The crowd leans in.")}</span>
            </div>
            <div class="judge-table-copy">${resultText(r2.reaction?.crowd || "The crowd is leaning in.")}</div>
          </div>
        </div>
      </section>
      <div class="results-grid-inner">
        ${[r1, r2].map((result, index) => {
          const player = index === 0 ? state.p1 : state.p2;
          const isWinner = index === 0 ? winnerIsP1 : !winnerIsP1;
          return `
            <article class="result-card ${isWinner ? "winner" : ""}">
              <div class="screen-head" style="margin:0 0 8px">
                <div>
                  <p class="eyebrow">${isWinner ? "Winner" : "Runner Up"}</p>
                  <h3 style="margin:0">${player.name}</h3>
                </div>
                <div class="score-big">${result.total}</div>
              </div>
              <div class="tiny-note">${result.dish}</div>
              <div class="meter-block" style="margin-top:10px">
                <strong>${result.reaction?.crowd || "The room is watching."}</strong>
                <div class="tiny-note" style="margin-top:6px">${result.reaction?.judge || ""}</div>
              </div>
              <div class="breakdown">
                <div class="mini-score">Flavor<strong>${result.flavor}</strong></div>
                <div class="mini-score">Technique<strong>${result.technique}</strong></div>
                <div class="mini-score">Creativity<strong>${result.creativity}</strong></div>
                <div class="mini-score">Presentation<strong>${result.presentation}</strong></div>
                <div class="mini-score">Control<strong>${result.control.score}</strong></div>
                <div class="mini-score">Setup<strong>${player.temp}°F / ${player.time}m</strong></div>
              </div>
              <div class="meter-block" style="margin-top:12px">
                ${result.notes.map((note) => `<div class="tiny-note">${note}</div>`).join("")}
              </div>
            </article>
          `;
        }).join("")}
      </div>
    `;
    const judgeComments = document.getElementById("judgeComments");
    if (judgeComments) {
      const loserPlayer = winnerIsP1 ? state.p2 : state.p1;
      const loserResult = winnerIsP1 ? r2 : r1;
      judgeComments.innerHTML = `
        <div class="judge-portrait">
          <div class="judge-avatar judge-vex">🔥</div>
          <div>
            <strong>Chef Vex <span class="pill">${r1.reaction?.bucket || "crowd"}</span></strong>
            <div class="tiny-note">${resultText(judgeVerdictLines("Chef Vex", winnerResult, true, loserPlayer.name, state.base.id))}</div>
          </div>
        </div>
        <div class="judge-portrait">
          <div class="judge-avatar judge-mama">🍴</div>
          <div>
            <strong>Mama Mirepoix <span class="pill">${r2.reaction?.bucket || "crowd"}</span></strong>
            <div class="tiny-note">${resultText(judgeVerdictLines("Mama Mirepoix", winnerResult, true, loserPlayer.name, state.base.id))}</div>
          </div>
        </div>
        <div class="judge-portrait">
          <div class="judge-avatar judge-prof">⭐</div>
          <div>
            <strong>Professor Palate <span class="pill">${leadLabel}</span></strong>
            <div class="tiny-note">Battle note - ${resultText(scoring.battleNote(r1, r2))} ${resultText(`Winner: ${winnerPlayer.name}. Runner-up: ${loserPlayer.name} (${runnerMedal}).`)}</div>
          </div>
        </div>
      `;
    }
    const winnerTitle = document.getElementById("winnerTitle");
    if (winnerTitle) winnerTitle.textContent = winnerIsP1 ? `${state.p1.name} Wins the Kitchen` : `${state.p2.name} Wins the Kitchen`;
  }

  function renderOpenKitchenResults(state, result, recipeCard = null) {
    setOpenKitchenActions(true);
    const grid = document.getElementById("resultsGrid");
    if (!grid) return;
    const winnerTitle = document.getElementById("winnerTitle");
    if (winnerTitle) winnerTitle.textContent = "Open Kitchen Judge Preview";
    grid.innerHTML = `
      <section class="glass panel judge-stage sandbox-stage">
        <div class="judge-stage-head">
          <div>
            <p class="eyebrow">Open Kitchen</p>
            <h3>Sandbox dish ready</h3>
          </div>
          <div class="judge-stage-badges">
            <span class="pill">No cost cap</span>
            <span class="pill">Unlimited ingredients</span>
            <span class="pill">${result.verdict}</span>
          </div>
        </div>
        <div class="sandbox-summary">
          <div class="result-card winner">
            <div class="screen-head" style="margin:0 0 8px">
              <div>
                <p class="eyebrow">Finished dish</p>
                <h3 style="margin:0">${state.p1.name}</h3>
              </div>
              <div class="score-big">${result.total}</div>
            </div>
            <div class="tiny-note">${result.dish}</div>
            <div class="meter-block" style="margin-top:10px">
              <strong>${result.reaction?.crowd || "The judges are leaning in."}</strong>
              <div class="tiny-note" style="margin-top:6px">${result.comment || ""}</div>
            </div>
            <div class="breakdown">
              <div class="mini-score">Flavor<strong>${result.flavor}</strong></div>
              <div class="mini-score">Technique<strong>${result.technique}</strong></div>
              <div class="mini-score">Creativity<strong>${result.creativity}</strong></div>
              <div class="mini-score">Presentation<strong>${result.presentation}</strong></div>
              <div class="mini-score">Control<strong>${result.control.score}</strong></div>
              <div class="mini-score">Setup<strong>${state.p1.temp}°F / ${state.p1.time}m</strong></div>
            </div>
            <div class="meter-block sandbox-actions">
              <div class="tiny-note">Save this recipe after the round, or run Judge Test later without rebuilding the sandbox flow.</div>
              ${recipeCard ? `<div class="pill recipe-pill">Recipe draft ready</div>` : ""}
            </div>
          </div>
        </div>
      </section>
    `;
    const judgeComments = document.getElementById("judgeComments");
    if (judgeComments) {
      judgeComments.innerHTML = `
        <div class="judge-portrait">
          <div class="judge-avatar judge-vex">🔥</div>
          <div>
            <strong>Open Kitchen Notes <span class="pill">sandbox</span></strong>
            <div class="tiny-note">${result.notes?.[0] || "No major combo triggered. The judges focused on balance."}</div>
          </div>
        </div>
      `;
    }
  }

  function resultText(text) {
    return String(text).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
  }

  ns.ui = {
    cache,
    showScreen,
    toast,
    bestPill,
    assetFor,
    renderCategoryTabs,
    renderIngredientGrid,
    renderMethods,
    renderBaseSelect,
    renderMethodGrid,
    renderPlateOptions,
    renderBuildSummary,
    renderControlLabels,
    renderCareer,
    renderResults,
    renderOpenKitchenResults,
    setOpenKitchenActions,
    resultText
  };
})();
