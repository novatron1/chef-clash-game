(function () {
  const ns = window.ChefClash = window.ChefClash || {};
  const data = ns.data;

  const byId = (list, id) => list.find((item) => item.id === id);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const includesAll = (picks, ids) => ids.every((id) => picks.includes(id));

  function statBlock() {
    return { sweet: 0, salty: 0, sour: 0, bitter: 0, umami: 0, texture: 0, heat: 0, fresh: 0 };
  }

  function idealCookControls(base, methodId) {
    const baseIdeal = {
      chicken: { temp: 385, time: 16, amount: 3 },
      steak: { temp: 430, time: 14, amount: 2 },
      fish: { temp: 330, time: 12, amount: 2 },
      tofu: { temp: 360, time: 13, amount: 3 },
      pasta: { temp: 375, time: 18, amount: 3 },
      ricebowl: { temp: 345, time: 15, amount: 3 },
      burger: { temp: 400, time: 13, amount: 3 },
      dessert: { temp: 320, time: 20, amount: 2 },
      pie: { temp: 350, time: 24, amount: 2 }
    };
    const methodMods = {
      grill: { temp: 20, time: -2 },
      saute: { temp: 0, time: 0 },
      fry: { temp: 10, time: -1 },
      braise: { temp: -20, time: 8 },
      steam: { temp: -30, time: 2 },
      smoke: { temp: 15, time: 4 },
      bake: { temp: 10, time: 4 }
    };
    const ideal = Object.assign({ temp: 375, time: 18, amount: 3 }, baseIdeal[base.id] || {});
    const mod = methodMods[methodId] || { temp: 0, time: 0 };
    return {
      temp: ideal.temp + mod.temp,
      time: ideal.time + mod.time,
      amount: ideal.amount
    };
  }

  function controlScore(base, player) {
    const ideal = idealCookControls(base, player.method);
    const tempDiff = Math.abs((player.temp || 375) - ideal.temp);
    const timeDiff = Math.abs((player.time || 18) - ideal.time);
    const amountDiff = Math.abs((player.amount || 3) - ideal.amount);
    let score = 100;
    score -= tempDiff * 0.55;
    score -= timeDiff * 2.5;
    score -= amountDiff * 6;
    return clamp(Math.round(score), 10, 100);
  }

  function controlStatus(base, player) {
    const ideal = idealCookControls(base, player);
    const score = controlScore(base, player);
    const tempDiff = (player.temp || 375) - ideal.temp;
    const timeDiff = (player.time || 18) - ideal.time;
    return {
      ideal,
      score,
      tempDiff,
      timeDiff,
      doneness: score >= 88 ? "Perfect" : score >= 72 ? "Good" : score >= 55 ? "Shaky" : "Bad",
      control: score >= 88 ? "Locked" : score >= 70 ? "Stable" : score >= 50 ? "Shaky" : "Off",
      risk: score >= 82 ? "Low" : score >= 62 ? "Med" : "High"
    };
  }

  function scoreBalance(stats) {
    let score = 56;
    const depth = Math.min(stats.umami, 18) * 1.2;
    const freshness = Math.min(stats.fresh, 15) * 0.88;
    const texture = Math.min(stats.texture, 16) * 0.72;
    score += depth + freshness + texture;
    if (stats.salty >= 5 && stats.salty <= 13) score += 8;
    else if (stats.salty > 17) score -= 14;
    if (stats.sour >= 3 && stats.sour <= 11) score += 7;
    else if (stats.sour > 15) score -= 11;
    if (stats.sweet >= 2 && stats.sweet <= 11) score += 5;
    else if (stats.sweet > 17) score -= 13;
    if (stats.heat >= 2 && stats.heat <= 11) score += 5;
    else if (stats.heat > 15) score -= 12;
    if (stats.bitter > 9) score -= (stats.bitter - 9) * 2.5;
    const spread = [stats.sweet, stats.salty, stats.sour, stats.bitter, stats.umami, stats.heat, stats.fresh, stats.texture].filter((n) => n > 0);
    if (spread.length >= 4) score += 6;
    else if (spread.length <= 2) score -= 4;
    return score;
  }

  function scoreCreativity(picks, stats) {
    const rarity = picks.reduce((sum, id) => sum + (byId(data.INGREDIENTS, id)?.rarity || 0), 0);
    const categories = new Set(picks.map((id) => byId(data.INGREDIENTS, id)?.category || "wild")).size;
    let score = 50 + rarity * 1.8 + categories * 3.9;
    if (stats.sweet > 8 && stats.heat > 6) score += 8;
    if (stats.umami > 18) score += 5;
    if (picks.length >= 4) score += 3;
    if (picks.length <= 2) score -= 2;
    return score;
  }

  function scorePresentation(player, stats) {
    let score = 58;
    score += Math.min(stats.fresh, 14) * 1.3;
    score += Math.min(stats.texture, 15) * 0.7;
    if (player.plate === "fine") score += 10;
    if (player.plate === "street") score += 3;
    if (player.plate === "fusion") score += 5;
    if (stats.bitter > 12) score -= 6;
    return score;
  }

  function makeDishName(player, base, picks) {
    const lead = byId(data.INGREDIENTS, picks[0])?.name || base.name;
    const tail = picks.length > 2 ? byId(data.INGREDIENTS, picks[picks.length - 1])?.name : null;
    if (player.plate === "fine") return `${base.name} ${lead} Signature`;
    if (player.plate === "street") return `${lead} ${base.name} Stack`;
    if (player.plate === "fusion") return `${lead} Fusion ${tail ? tail : base.name}`;
    return `${base.name} Comfort Plate`;
  }

  function makeJudgeComment(player, total, stats, notes, plate, method) {
    const first = total >= 88
      ? "That plate came out dangerous in the best way."
      : total >= 75
        ? "Strong dish. The flavors know where they are going."
        : total >= 60
          ? "There is an idea here, but the execution is shaky."
          : "This plate walked into the kitchen with confidence and left in handcuffs.";
    let statLine = "";
    if (stats.salty > 18) statLine = "The salt level is bullying the whole dish.";
    else if (stats.bitter > 12) statLine = "That bitterness is too loud on the back end.";
    else if (stats.umami > 18) statLine = "The umami is deep, rich, and built for the judges.";
    else if (stats.fresh > 14) statLine = "Freshness is carrying the plate.";
    else statLine = "The flavor profile is readable, which matters.";
    return `${first} ${statLine} The ${plate.comment} and ${method.name.toLowerCase()} technique gave it personality. ${notes[0] || ""}`;
  }

  function pickReaction(bucket, fallback) {
    const pool = data.REACTIONS?.[bucket] || [];
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : fallback;
  }

  function makePerformanceReaction(total) {
    if (total >= 88) {
      return {
        bucket: "excellent",
        crowd: pickReaction("excellent", "That plate landed with authority."),
        judge: pickReaction("win", "That is a trophy-level plate."),
        sound: "win"
      };
    }
    if (total >= 75) {
      return {
        bucket: "strong",
        crowd: pickReaction("strong", "Solid cook. The judges are nodding."),
        judge: pickReaction("strong", "That one has real restaurant energy."),
        sound: "good"
      };
    }
    if (total >= 60) {
      return {
        bucket: "shaky",
        crowd: pickReaction("shaky", "The judges can taste the pressure."),
        judge: pickReaction("lose", "A brave attempt, but the polish was not there."),
        sound: "judge"
      };
    }
    return {
      bucket: "disaster",
      crowd: pickReaction("disaster", "The kitchen winced."),
      judge: pickReaction("lose", "The concept was there. The execution wasn't."),
      sound: "fail"
    };
  }

  function makeBattleReaction(r1, r2) {
    const diff = Math.abs(r1.total - r2.total);
    if (diff === 0) {
      return {
        bucket: "tie",
        crowd: pickReaction("tie", "Dead heat."),
        judge: "Both chefs showed up with real pressure control.",
        sound: "judge"
      };
    }
    const leader = r1.total >= r2.total ? r1 : r2;
    if (diff < 6) {
      return {
        bucket: "close",
        crowd: pickReaction("close", "One clean move changed everything."),
        judge: "The judges needed the replay to call it.",
        sound: "judge"
      };
    }
    if (leader.total >= 88) {
      return {
        bucket: "excellent",
        crowd: pickReaction("excellent", "That plate landed with authority."),
        judge: pickReaction("win", "That is a trophy-level plate."),
        sound: "win"
      };
    }
    if (leader.total >= 75) {
      return {
        bucket: "strong",
        crowd: pickReaction("strong", "Solid cook. The judges are nodding."),
        judge: pickReaction("win", "That was a clean win."),
        sound: "good"
      };
    }
    return {
      bucket: "shaky",
      crowd: pickReaction("shaky", "The judges can taste the pressure."),
      judge: pickReaction("lose", "A brave attempt, but the polish was not there."),
      sound: "judge"
    };
  }

  function evaluateDish(state, key) {
    const player = state[key];
    const base = state.base;
    const method = byId(data.METHODS, player.method) || data.METHODS[1];
    const plate = data.PLATES[player.plate] || data.PLATES.street;
    const picks = player.picks.slice();
    const stats = statBlock();
    let flavor = base.umami * 6 + base.salty * 4 + base.sweet * 2 + base.fresh * 2;
    let technique = 48 + base.texture * 4 + base.umami * 2;
    let creativity = 42;
    let presentation = 45 + (player.plate === "fine" ? 8 : 0);
    const notes = [];

    picks.forEach((id) => {
      const item = byId(data.INGREDIENTS, id);
      if (!item) return;
      for (const stat of Object.keys(stats)) {
        stats[stat] += item[stat] || 0;
      }
      flavor += (item.umami || 0) * 2 + (item.salty || 0) * 0.8 + (item.sweet || 0) * 0.5 + (item.fresh || 0) * 0.5;
      creativity += (item.rarity || 0) * 4;
      presentation += (item.fresh || 0) * 0.3;
    });

    for (const stat of Object.keys(stats)) {
      stats[stat] += base[stat] || 0;
    }
    flavor += scoreBalance(stats) * 0.22;
    creativity += scoreCreativity(picks, stats) * 0.18;
    presentation += scorePresentation(player, stats) * 0.22;
    technique += (method.mod?.texture || 0) * 5 + (method.mod?.umami || 0) * 3 + (method.mod?.fresh || 0) * 2;

    data.COMBOS.forEach((combo) => {
      if (includesAll(picks, combo.ids)) {
        notes.push(`Combo hit: ${combo.label} +${combo.points}`);
        flavor += combo.points * 0.3;
        creativity += combo.points * 0.35;
        presentation += combo.points * 0.12;
      }
    });

    data.BAD_COMBOS.forEach((combo) => {
      if (includesAll(picks, combo.ids)) {
        notes.push(`Bad pairing: ${combo.label} ${combo.points}`);
        flavor += combo.points * 0.35;
        technique += combo.points * 0.2;
      }
    });

    const control = controlStatus(base, player);
    const controlBonus = Math.round((control.score - 70) / 3);
    technique += controlBonus;
    if (control.score >= 88) {
      notes.push(`Tech control locked: ${player.temp}°F, ${player.time} min, ${player.amount} portions`);
      presentation += 4;
    } else if (control.score < 55) {
      notes.push(`Tech control shaky: ${control.doneness} cook risk`);
      flavor -= 5;
      presentation -= 3;
    }

    const commandBonus = Math.min(8, (player.commands || []).length * 2);
    technique += commandBonus;
    presentation += (player.commands || []).includes("plate") ? 3 : 0;

    const actionKey = key;
    if (state.actionBonuses?.[actionKey]) {
      const bonus = state.actionBonuses[actionKey];
      flavor += bonus.flavor || 0;
      technique += bonus.technique || 0;
      creativity += bonus.creativity || 0;
      presentation += bonus.presentation || 0;
      const totalBonus = Math.round((bonus.flavor || 0) + (bonus.technique || 0) + (bonus.creativity || 0) + (bonus.presentation || 0));
      if (totalBonus !== 0) notes.push(`Action cook-off bonus: ${totalBonus > 0 ? "+" : ""}${totalBonus}`);
    }

    if (state.actionLog?.[actionKey]?.length) {
      notes.push(`Action log: ${state.actionLog[actionKey].slice(0, 3).join(" • ")}`);
    }

    flavor = clamp(flavor, 20, 100);
    creativity = clamp(creativity, 20, 100);
    technique = clamp(technique, 20, 100);
    presentation = clamp(presentation, 20, 100);

    const plateFlavorMod = plate.mult?.flavor || 1;
    const ingredientCountMod = 1 + Math.min(0.08, picks.length * 0.01);
    const total = Math.round(
      flavor * 0.37 * plateFlavorMod * ingredientCountMod +
      technique * 0.25 +
      creativity * 0.18 * (plate.mult?.creativity || 1) +
      presentation * 0.20 * (plate.mult?.presentation || 1)
    );

    if (notes.length === 0) notes.push("No major combo triggered. The judges focused on balance.");

    return {
      total,
      flavor: Math.round(flavor),
      technique: Math.round(technique),
      creativity: Math.round(creativity),
      presentation: Math.round(presentation),
      stats,
      notes,
      comment: makeJudgeComment(player, total, stats, notes, plate, method),
      reaction: makePerformanceReaction(total),
      dish: makeDishName(player, base, picks),
      base: base.id,
      plate: plate.name,
      method: method.name,
      control
    };
  }

  function scoreOpenKitchenDish(state, key = "p1") {
    const result = evaluateDish(state, key);
    return {
      ...result,
      sandbox: true,
      judgeMode: "openKitchen"
    };
  }

  function battleNote(r1, r2) {
    const diff = Math.abs(r1.total - r2.total);
    if (diff === 0) return "A dead-even plate battle. Different ideas, same pressure.";
    const strong = r1.total > r2.total ? r1 : r2;
    if (diff < 6) return "Close fight. One cleaner combo or tighter plating could have flipped the round.";
    if (strong.flavor >= strong.technique && strong.flavor >= strong.creativity) return "Flavor synergy decided this one.";
    if (strong.technique >= strong.creativity) return "Technique and method control separated the winner.";
    return "Creativity made the winner stand out.";
  }

  ns.scoring = {
    clamp,
    includesAll,
    idealCookControls,
    controlStatus,
    scoreBalance,
    scoreCreativity,
    scorePresentation,
    makeDishName,
    makeJudgeComment,
    makePerformanceReaction,
    makeBattleReaction,
    evaluateDish,
    scoreOpenKitchenDish,
    battleNote
  };
})();
