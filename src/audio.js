(function () {
  const ns = window.ChefClash = window.ChefClash || {};
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      ctx = new AudioContext();
    }
    return ctx;
  }

  function tone(freq, duration = 0.08, type = "sine", gain = 0.025) {
    const ac = getCtx();
    if (!ac) return;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.value = gain;
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration);
  }

  function chord(notes, duration = 0.18, type = "triangle", gain = 0.02) {
    notes.forEach((freq, index) => {
      window.setTimeout(() => tone(freq, duration, type, gain), index * 18);
    });
  }

  function sweep(start, end, duration = 0.12, type = "sawtooth", gain = 0.018) {
    const ac = getCtx();
    if (!ac) return;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(start, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, end), ac.currentTime + duration);
    amp.gain.setValueAtTime(gain, ac.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration);
  }

  function cue(kind = "tap") {
    const map = {
      tap: [540, 0.05, "square", 0.025],
      good: [660, 0.08, "triangle", 0.03],
      win: [820, 0.16, "sine", 0.04],
      fail: [160, 0.12, "sawtooth", 0.03],
      fire: [260, 0.08, "square", 0.03],
      chop: [720, 0.04, "square", 0.022],
      stir: [220, 0.07, "triangle", 0.026],
      plate: [940, 0.09, "sine", 0.03],
      sizzle: [180, 0.11, "sawtooth", 0.02],
      sparkle: [1320, 0.05, "triangle", 0.018],
      judge: [400, 0.09, "sine", 0.022],
      crowd: [300, 0.15, "triangle", 0.03],
      serve: [780, 0.11, "triangle", 0.028],
      knife: [980, 0.04, "square", 0.02],
      steam: [150, 0.1, "sine", 0.018],
      combo: [1120, 0.07, "triangle", 0.022],
      oil: [210, 0.05, "sine", 0.018],
      fanfare: [523.25, 0.12, "triangle", 0.03]
    };
    if (kind === "win") {
      chord([523.25, 659.25, 783.99], 0.14, "triangle", 0.03);
      window.setTimeout(() => sweep(659.25, 1046.5, 0.18, "sine", 0.02), 80);
      return;
    }
    if (kind === "fail") {
      chord([196, 164.81, 130.81], 0.14, "sawtooth", 0.02);
      return;
    }
    if (kind === "judge") {
      chord([392, 493.88, 587.33], 0.1, "triangle", 0.02);
      return;
    }
    if (kind === "crowd") {
      sweep(220, 330, 0.18, "triangle", 0.025);
      return;
    }
    if (kind === "fanfare") {
      chord([523.25, 659.25, 783.99, 1046.5], 0.16, "triangle", 0.028);
      window.setTimeout(() => sweep(523.25, 1318.5, 0.24, "sine", 0.02), 70);
      window.setTimeout(() => tone(1318.5, 0.08, "sine", 0.018), 180);
      return;
    }
    const args = map[kind] || map.tap;
    tone(...args);
  }

  ns.audio = { tone, chord, sweep, cue };
})();
