(function () {
  const ns = window.ChefClash = window.ChefClash || {};
  const data = ns.data;
  const ui = ns.ui;
  const scoring = ns.scoring;
  const recipeLibrary = ns.recipeLibrary;

  const byId = (list, id) => list.find((item) => item.id === id);

  function normalizeRecipes() {
    return recipeLibrary?.loadRecipeLibrary?.() || [];
  }

  function selectedRecipeFor(state, recipes) {
    if (!recipes.length) return null;
    const preferred = state.librarySelectedRecipeId || state.openKitchenRecipe?.id || recipes[0].id;
    return recipes.find((recipe) => recipe.id === preferred) || recipes[0];
  }

  function recipeIngredients(recipe) {
    const ids = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    const names = Array.isArray(recipe.ingredientNames) ? recipe.ingredientNames : [];
    return ids.map((id, index) => ({
      id,
      name: names[index] || byId(data.INGREDIENTS, id)?.name || id,
      asset: byId(data.INGREDIENTS, id)?.asset || byId(data.INGREDIENTS, id)?.prepAsset || "assets/cookware/plate.svg"
    }));
  }

  function recipeState(recipe) {
    const state = ns.createState();
    state.mode = "openKitchen";
    state.openKitchen = true;
    state.budgetMode = "open";
    state.maxExtras = data.INGREDIENTS.length;
    state.budget = Infinity;
    state.base = byId(data.BASES, recipe.baseId) || data.BASES[0];
    state.p1 = ns.createChefState(recipe.name || "Open Kitchen Dish", recipe.methodId || "saute", recipe.plate || "street", state.base.id);
    state.p1.picks = Array.isArray(recipe.ingredients) ? recipe.ingredients.slice() : [];
    state.p1.temp = recipe.controls?.temp ?? 375;
    state.p1.time = recipe.controls?.time ?? 18;
    state.p1.amount = recipe.controls?.amount ?? 3;
    state.p1.plate = recipe.plate || "street";
    state.p1.method = recipe.methodId || "saute";
    state.p2 = ns.createChefState("Judge", "saute", "fine", state.base.id);
    state.librarySelectedRecipeId = recipe.id;
    return state;
  }

  function renderLibraryCard(recipe, selected = false) {
    const ingredients = recipeIngredients(recipe).slice(0, 4);
    const count = Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0;
    return `
      <button class="recipe-card ${selected ? "selected" : ""}" data-library-select="${recipe.id}">
        <div class="recipe-card__head">
          <div>
            <strong>${ui.resultText(recipe.name || "Untitled Recipe")}</strong>
            <div class="tiny-note">${ui.resultText(recipe.baseName || recipe.base || "Unknown base")}</div>
          </div>
          <span class="pill">${ui.resultText(recipe.verdict || "Draft")}</span>
        </div>
        <div class="recipe-card__score">${Number(recipe.score || 0)}</div>
        <div class="recipe-card__meta">
          <span>${ui.resultText(recipe.methodId || "method")}</span>
          <span>${ui.resultText(recipe.plate || "plate")}</span>
          <span>${count} items</span>
        </div>
        <div class="recipe-card__ingredients">
          ${ingredients.map((item) => `
            <span class="recipe-chip">
              <img src="${item.asset}" alt="" loading="lazy" />
              <span>${ui.resultText(item.name)}</span>
            </span>
          `).join("")}
        </div>
      </button>
    `;
  }

  function renderLibraryDetail(recipe) {
    if (!recipe) {
      return `
        <div class="recipe-empty">
          <p class="eyebrow">Recipe Library</p>
          <h3>No saved recipes yet</h3>
          <p class="tiny-note">Finish an Open Kitchen dish and use Save Recipe to store it here.</p>
        </div>
      `;
    }

    const ingredients = recipeIngredients(recipe);
    const controls = recipe.controls || {};
    return `
      <article class="recipe-detail">
        <div class="screen-head" style="margin:0 0 12px">
          <div>
            <p class="eyebrow">Recipe Card</p>
            <h3 style="margin:0">${ui.resultText(recipe.name || "Untitled Recipe")}</h3>
          </div>
          <div class="screen-actions">
            <span class="pill">${ui.resultText(recipe.verdict || "Draft")}</span>
            <span class="pill">${Number(recipe.score || 0)}</span>
          </div>
        </div>

        <div class="recipe-detail-meta">
          <div><span>Base</span><strong>${ui.resultText(recipe.baseName || recipe.base || "Unknown")}</strong></div>
          <div><span>Method</span><strong>${ui.resultText(recipe.methodId || "saute")}</strong></div>
          <div><span>Plate</span><strong>${ui.resultText(recipe.plate || "street")}</strong></div>
          <div><span>Controls</span><strong>${controls.temp ?? 375}°F / ${controls.time ?? 18}m / ${controls.amount ?? 3}</strong></div>
        </div>

        <div class="recipe-detail-actions">
          <button class="gold" data-library-open="${recipe.id}">Open in Kitchen</button>
          <button class="secondary" data-library-judge="${recipe.id}">Judge Test</button>
        </div>

        <div class="recipe-detail-section">
          <h4>Ingredients</h4>
          <div class="recipe-detail-ingredient-list">
            ${ingredients.map((item) => `
              <div class="recipe-detail-ingredient">
                <img src="${item.asset}" alt="" loading="lazy" />
                <span>${ui.resultText(item.name)}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="recipe-detail-section">
          <h4>Notes</h4>
          <div class="recipe-detail-notes">
            ${(Array.isArray(recipe.notes) && recipe.notes.length ? recipe.notes : ["No notes recorded."]).map((note) => `
              <div class="tiny-note">${ui.resultText(note)}</div>
            `).join("")}
          </div>
        </div>
      </article>
    `;
  }

  function renderLibrary(state) {
    const recipes = normalizeRecipes();
    state.libraryRecipes = recipes;
    const selected = selectedRecipeFor(state, recipes);
    if (selected) state.librarySelectedRecipeId = selected.id;
    const countNode = document.getElementById("recipeLibraryCount");
    const gridNode = document.getElementById("recipeLibraryGrid");
    const detailNode = document.getElementById("recipeLibraryDetail");
    if (countNode) countNode.textContent = String(recipes.length);
    if (gridNode) {
      gridNode.innerHTML = recipes.length
        ? recipes.map((recipe) => renderLibraryCard(recipe, recipe.id === selected?.id)).join("")
        : `<div class="recipe-empty tiny-note">Save a dish from Open Kitchen and it will appear here.</div>`;
    }
    if (detailNode) detailNode.innerHTML = renderLibraryDetail(selected);
    return selected;
  }

  function showLibrary(state) {
    ui.showScreen("library");
    renderLibrary(state);
  }

  function selectRecipe(state, recipeId) {
    state.librarySelectedRecipeId = recipeId;
    renderLibrary(state);
  }

  function openRecipe(state, recipeId) {
    const recipe = normalizeRecipes().find((item) => item.id === recipeId);
    if (!recipe) {
      ui.toast("Recipe not found.");
      return;
    }
    state.mode = "openKitchen";
    state.openKitchen = true;
    state.budgetMode = "open";
    state.maxExtras = data.INGREDIENTS.length;
    state.budget = Infinity;
    state.base = byId(data.BASES, recipe.baseId) || data.BASES[0];
    state.buildPlayer = "p1";
    state.p1.picks = Array.isArray(recipe.ingredients) ? recipe.ingredients.slice() : [];
    state.p1.method = recipe.methodId || state.p1.method;
    state.p1.plate = recipe.plate || state.p1.plate;
    state.p1.temp = recipe.controls?.temp ?? state.p1.temp;
    state.p1.time = recipe.controls?.time ?? state.p1.time;
    state.p1.amount = recipe.controls?.amount ?? state.p1.amount;
    state.librarySelectedRecipeId = recipe.id;
    state.openKitchenRecipe = recipe;
    if (ns.game?.renderBuild) ns.game.renderBuild();
    ui.showScreen("build");
    ui.toast(`Loaded ${recipe.name || "recipe"}`);
  }

  function judgeRecipe(state, recipeId) {
    const recipe = normalizeRecipes().find((item) => item.id === recipeId);
    if (!recipe) {
      ui.toast("Recipe not found.");
      return null;
    }
    const judgeState = recipeState(recipe);
    const result = scoring.scoreOpenKitchenDish(judgeState, "p1");
    ui.renderOpenKitchenResults(judgeState, result, recipe);
    ui.showScreen("results");
    state.openKitchenResult = result;
    state.openKitchenJudgeTest = result;
    state.openKitchenRecipe = recipe;
    return result;
  }

  ns.openKitchen = {
    renderLibrary,
    showLibrary,
    selectRecipe,
    openRecipe,
    judgeRecipe,
    recipeState,
    renderLibraryCard,
    renderLibraryDetail
  };
})();
