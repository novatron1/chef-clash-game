(function () {
  const ns = window.ChefClash = window.ChefClash || {};
  const data = ns.data;

  const STORAGE_KEY = "chefclash.recipeLibrary.v1";
  const LAST_KEY = "chefclash.lastOpenKitchenRecipe.v1";
  const VERSION = 1;

  let memoryLibrary = [];
  let memoryLastRecord = null;

  const byId = (list, id) => list.find((item) => item.id === id);

  function now() {
    return Date.now();
  }

  function randomId() {
    if (globalThis.crypto?.randomUUID) return `recipe_${globalThis.crypto.randomUUID()}`;
    return `recipe_${now()}_${Math.random().toString(16).slice(2, 8)}`;
  }

  function safeRead(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      if (key === STORAGE_KEY) return memoryLibrary ? JSON.stringify({ version: VERSION, recipes: memoryLibrary }) : null;
      if (key === LAST_KEY) return memoryLastRecord ? JSON.stringify(memoryLastRecord) : null;
      return null;
    }
  }

  function safeWrite(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      if (key === STORAGE_KEY) {
        try {
          const parsed = JSON.parse(value);
          memoryLibrary = Array.isArray(parsed?.recipes) ? parsed.recipes.slice() : [];
        } catch {
          memoryLibrary = [];
        }
      }
      if (key === LAST_KEY) {
        try {
          memoryLastRecord = JSON.parse(value);
        } catch {
          memoryLastRecord = null;
        }
      }
      return false;
    }
  }

  function safeRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      if (key === STORAGE_KEY) memoryLibrary = [];
      if (key === LAST_KEY) memoryLastRecord = null;
    }
  }

  function cleanString(value, fallback = "") {
    if (typeof value === "string") return value.trim();
    if (value == null) return fallback;
    return String(value);
  }

  function cleanNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function cleanArray(value) {
    return Array.isArray(value) ? value.map((item) => cleanString(item)).filter(Boolean) : [];
  }

  function normalizeIdArray(value) {
    return Array.isArray(value)
      ? value.map((item) => cleanString(item?.id ?? item?.value ?? item?.name ?? item)).filter(Boolean)
      : [];
  }

  function ingredientNameFor(id) {
    return byId(data?.INGREDIENTS || [], id)?.name || cleanString(id);
  }

  function baseNameFor(id) {
    return byId(data?.BASES || [], id)?.name || cleanString(id);
  }

  function normalizeControls(controls = {}) {
    return {
      temp: cleanNumber(controls.temp, 375),
      time: cleanNumber(controls.time, 18),
      amount: cleanNumber(controls.amount, 3)
    };
  }

  function verdictFromScore(score) {
    if (score >= 90) return "Legendary";
    if (score >= 80) return "Strong";
    if (score >= 65) return "Solid";
    if (score >= 45) return "Shaky";
    return "Rough";
  }

  function normalizeRecipeCard(raw) {
    if (!raw || typeof raw !== "object") return null;

    const baseId = cleanString(raw.baseId || raw.base?.id || raw.base_id);
    const ingredients = normalizeIdArray(raw.ingredients || raw.ingredientIds);
    const ingredientNames = Array.isArray(raw.ingredientNames) && raw.ingredientNames.length
      ? raw.ingredientNames.map((name) => cleanString(name?.name ?? name)).filter(Boolean)
      : ingredients.map(ingredientNameFor);
    const createdAt = cleanNumber(raw.createdAt, now());
    const updatedAt = cleanNumber(raw.updatedAt, createdAt);
    const score = cleanNumber(raw.score, 0);
    const notes = Array.isArray(raw.notes)
      ? raw.notes.map((note) => cleanString(note)).filter(Boolean)
      : raw.notes != null
        ? [cleanString(raw.notes)].filter(Boolean)
        : [];

    const rawBase = raw.base;
    const base = cleanString(
      raw.baseName
      || (rawBase && typeof rawBase === "object" ? rawBase.name : rawBase)
      || baseNameFor(baseId)
      || ""
    );
    const recipe = {
      id: cleanString(raw.id, randomId()),
      name: cleanString(raw.name, base ? `${base} Recipe` : "Open Kitchen Recipe"),
      mode: cleanString(raw.mode, "openKitchen"),
      base,
      baseName: cleanString(raw.baseName, base || baseNameFor(baseId)),
      baseId,
      ingredients,
      ingredientNames: ingredientNames.length ? ingredientNames : ingredients.map(ingredientNameFor),
      methodId: cleanString(raw.methodId, ""),
      plate: cleanString(raw.plate, "street"),
      controls: normalizeControls(raw.controls),
      score,
      verdict: cleanString(raw.verdict, verdictFromScore(score)),
      notes,
      createdAt,
      updatedAt,
      version: VERSION
    };

    return recipe;
  }

  function normalizeLibraryPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
      if (Array.isArray(payload.recipes)) return payload.recipes;
      if (payload.recipe) return [payload.recipe];
    }
    return [];
  }

  function loadRecipeLibrary() {
    try {
      const raw = safeRead(STORAGE_KEY);
      if (!raw) {
        memoryLibrary = memoryLibrary.filter(Boolean);
        return memoryLibrary.slice();
      }
      const parsed = JSON.parse(raw);
      const recipes = normalizeLibraryPayload(parsed)
        .map(normalizeRecipeCard)
        .filter(Boolean);
      memoryLibrary = recipes.slice();
      return recipes;
    } catch {
      return memoryLibrary.slice();
    }
  }

  function saveRecipeLibrary(recipes) {
    const normalized = (Array.isArray(recipes) ? recipes : [])
      .map(normalizeRecipeCard)
      .filter(Boolean);
    memoryLibrary = normalized.slice();
    safeWrite(STORAGE_KEY, JSON.stringify({ version: VERSION, recipes: normalized }));
    return normalized;
  }

  function loadOpenKitchenRecord() {
    try {
      const raw = safeRead(LAST_KEY);
      if (!raw) return memoryLastRecord;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if ("recipe" in parsed || "openKitchen" in parsed) {
        const record = {
          version: cleanNumber(parsed.version, VERSION),
          openKitchen: Boolean(parsed.openKitchen),
          recipe: parsed.recipe ? normalizeRecipeCard(parsed.recipe) : null,
          updatedAt: cleanNumber(parsed.updatedAt, now())
        };
        memoryLastRecord = record;
        return record;
      }
      const record = {
        version: VERSION,
        openKitchen: true,
        recipe: normalizeRecipeCard(parsed),
        updatedAt: cleanNumber(parsed.updatedAt, now())
      };
      memoryLastRecord = record;
      return record;
    } catch {
      return memoryLastRecord;
    }
  }

  function saveOpenKitchenRecord(record) {
    const normalized = {
      version: VERSION,
      openKitchen: Boolean(record?.openKitchen ?? record?.recipe),
      recipe: record?.recipe ? normalizeRecipeCard(record.recipe) : null,
      updatedAt: cleanNumber(record?.updatedAt, now())
    };
    memoryLastRecord = normalized;
    safeWrite(LAST_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function loadLastOpenKitchenRecipe() {
    return loadOpenKitchenRecord()?.recipe || null;
  }

  function saveLastOpenKitchenRecipe(recipe) {
    return saveOpenKitchenRecord({
      openKitchen: true,
      recipe
    }).recipe;
  }

  function createRecipeCard(state, result = {}, playerKey = state?.buildPlayer || "p1") {
    const player = state?.[playerKey] || state?.p1 || {};
    const base = state?.base || {};
    const ingredients = Array.isArray(player.picks) ? player.picks.slice() : [];
    const ingredientNames = ingredients.map(ingredientNameFor);
    const score = cleanNumber(result.score ?? result.total, 0);
    const timestamp = now();
    const notes = Array.isArray(result.notes)
      ? result.notes.map((note) => cleanString(note)).filter(Boolean)
      : result.note != null
        ? [cleanString(result.note)].filter(Boolean)
        : [];

    return normalizeRecipeCard({
      id: result.id || randomId(),
      name: cleanString(result.name || result.dish, base.name ? `${base.name} Recipe` : "Open Kitchen Recipe"),
      mode: cleanString(state?.mode, "openKitchen"),
      base: base.name || "",
      baseName: base.name || "",
      baseId: base.id || "",
      ingredients,
      ingredientNames,
      methodId: player.method || "",
      plate: player.plate || "street",
      controls: {
        temp: player.temp,
        time: player.time,
        amount: player.amount
      },
      score,
      verdict: cleanString(result.verdict, verdictFromScore(score)),
      notes,
      createdAt: cleanNumber(result.createdAt, timestamp),
      updatedAt: cleanNumber(result.updatedAt, timestamp),
      version: VERSION
    });
  }

  function saveRecipe(state, result = {}, playerKey) {
    const card = result?.id ? normalizeRecipeCard(result) : createRecipeCard(state, result, playerKey);
    const recipes = loadRecipeLibrary();
    const index = recipes.findIndex((item) => item.id === card.id);
    const next = index >= 0
      ? recipes.map((item, i) => (i === index ? { ...item, ...card, updatedAt: now(), version: VERSION } : item))
      : [card, ...recipes];
    saveRecipeLibrary(next);
    saveOpenKitchenRecord({ openKitchen: true, recipe: card });
    return card;
  }

  function restoreOpenKitchenState(state) {
    const record = loadOpenKitchenRecord();
    if (!record) return null;
    state.openKitchen = Boolean(record.openKitchen || record.recipe);
    state.openKitchenRecipe = record.recipe;
    state.openKitchenPersistedAt = record.updatedAt || now();
    return record;
  }

  function clearOpenKitchenState() {
    safeRemove(LAST_KEY);
    memoryLastRecord = null;
  }

  ns.recipeLibrary = {
    STORAGE_KEY,
    LAST_KEY,
    VERSION,
    loadRecipeLibrary,
    saveRecipeLibrary,
    loadOpenKitchenRecord,
    saveOpenKitchenRecord,
    loadLastOpenKitchenRecipe,
    saveLastOpenKitchenRecipe,
    createRecipeCard,
    saveRecipe,
    restoreOpenKitchenState,
    clearOpenKitchenState
  };
})();
