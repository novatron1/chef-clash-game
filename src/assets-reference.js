(function () {
  const ns = window.ChefClash = window.ChefClash || {};

  function iconFor(item) {
    return item.path;
  }

  function renderAssetReference() {
    const wrap = document.getElementById("assetReferenceGrid");
    const countNode = document.getElementById("assetReferenceCount");
    if (!wrap) return;
    const groups = Array.isArray(ns.assetCatalog) ? ns.assetCatalog : [];
    const total = groups.reduce((sum, group) => sum + (group.items?.length || 0), 0);
    if (countNode) countNode.textContent = String(total);
    wrap.innerHTML = groups.map((group) => `
      <section class="asset-group">
        <div class="asset-group-head">
          <div>
            <p class="eyebrow">${group.label}</p>
            <h3>${group.label}</h3>
          </div>
          <span class="pill">${group.items.length} assets</span>
        </div>
        <div class="asset-grid">
          ${group.items.map((item) => `
            <article class="asset-card">
              <div class="asset-thumb">
                <img class="asset-thumb-img asset-thumb-${item.type} asset-thumb-${group.id}" src="${iconFor(item)}" alt="" loading="lazy" />
              </div>
              <div class="asset-card-copy">
                <strong>${item.label}</strong>
                <span>${item.path}</span>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `).join("") || `<div class="recipe-empty">Asset manifest is not ready yet.</div>`;
  }

  ns.assetReference = {
    renderAssetReference
  };
})();
