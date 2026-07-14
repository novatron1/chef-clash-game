(function () {
  const ns = window.ChefClash = window.ChefClash || {};
  const data = ns.data;
  const ui = ns.ui;

  const KEY = "chefClashCareerV17";

  function defaultProgress() {
    return { unlocked: 0, defeated: {}, fans: 0 };
  }

  function loadProgress() {
    try {
      return Object.assign(defaultProgress(), JSON.parse(localStorage.getItem(KEY) || "{}"));
    } catch {
      return defaultProgress();
    }
  }

  function saveProgress(progress) {
    localStorage.setItem(KEY, JSON.stringify(progress));
  }

  function rankName(progress) {
    const defeated = Object.keys(progress.defeated || {}).length;
    if (defeated >= 6) return "Legend";
    if (defeated >= 3) return "Head Chef";
    if (defeated >= 1) return "Sous Chef";
    return "Rookie";
  }

  function renderCareer(state) {
    const progress = loadProgress();
    ui.renderCareer(state, data.CAREER_OPPONENTS, progress, (bossId) => selectBoss(state, bossId));
    const rank = document.getElementById("careerRank");
    if (rank) rank.textContent = rankName(progress);
  }

  function openCareer(state) {
    state.mode = "career";
    state.career = true;
    ui.showScreen("career");
    renderCareer(state);
  }

  function selectBoss(state, bossId) {
    const boss = data.CAREER_OPPONENTS.find((item) => item.id === bossId);
    if (!boss) return;
    const progress = loadProgress();
    const index = data.CAREER_OPPONENTS.findIndex((item) => item.id === bossId);
    if (index > progress.unlocked) {
      ui.toast("Beat the previous boss first.");
      return;
    }
    state.pendingBoss = boss;
    const modal = document.getElementById("careerModal");
    const avatar = document.getElementById("modalAvatar");
    const name = document.getElementById("modalName");
    const region = document.getElementById("modalRegion");
    const note = document.getElementById("modalNote");
    if (avatar) avatar.textContent = boss.emoji;
    if (name) name.textContent = boss.name;
    if (region) region.textContent = `${boss.region} · ${boss.rank}`;
    if (note) note.textContent = boss.lore;
    modal?.classList.remove("hidden");
  }

  function closeModal() {
    document.getElementById("careerModal")?.classList.add("hidden");
  }

  function startCareerBattle(state) {
    const boss = state.pendingBoss;
    if (!boss) return;
    closeModal();
    state.career = true;
    state.careerBoss = boss;
    state.base = data.BASES.find((base) => base.id === boss.base) || data.BASES[0];
    state.p2.name = boss.name;
    state.p2.method = boss.method;
    state.p2.plate = boss.plate;
    state.p2.picks = boss.likes.slice(0, state.maxExtras).filter(Boolean);
    state.p2.temp = 375;
    state.p2.time = 18;
    state.p2.amount = 3;
    state.mode = "career";
    state.buildPlayer = "p1";
    state.actionLog = { p1: [], p2: [] };
    state.actionBonuses = {
      p1: { flavor: 0, technique: 0, creativity: 0, presentation: 0 },
      p2: { flavor: 0, technique: 0, creativity: 0, presentation: 0 }
    };
    ui.showScreen("build");
    ui.toast(`Career match: ${boss.name}`);
  }

  function applyCareerResult(state, r1, r2) {
    const progress = loadProgress();
    const boss = state.careerBoss;
    if (!boss) return;
    const won = r1.total >= r2.total;
    if (won) {
      const index = data.CAREER_OPPONENTS.findIndex((item) => item.id === boss.id);
      progress.unlocked = Math.max(progress.unlocked, index + 1);
      progress.defeated[boss.id] = true;
      progress.fans = (progress.fans || 0) + 250 + Math.max(0, r1.total - r2.total) * 12;
      saveProgress(progress);
    }
  }

  ns.career = {
    KEY,
    defaultProgress,
    loadProgress,
    saveProgress,
    rankName,
    renderCareer,
    openCareer,
    selectBoss,
    closeModal,
    startCareerBattle,
    applyCareerResult
  };
})();
