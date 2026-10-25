/* Cartas de Groove · ÁUDIO (Web Audio, tudo sintetizado: funciona offline e sem arquivo de som).
   Toca exatamente as notas da carta: o agendador lê os mesmos eventos (ticks) que a partitura desenha.
   O som só liga depois de um toque (regra do iPhone). */
(function (root) {
  'use strict';
  var M = root.CGMusic;
  var ctx = null, master = null, noise = null;

  function ensure() {
    if (!ctx) {
      var AC = root.AudioContext || root.webkitAudioContext; if (!AC) return null;
      ctx = new AC({ latencyHint: 'interactive' });
      master = ctx.createGain(); master.gain.value = 0.85; master.connect(ctx.destination);
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      var d = noise.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function out(pan) { // mão direita um pouco à direita, esquerda à esquerda (pra ouvir a alternância)
    if (!pan || !ctx.createStereoPanner) return master;
    var p = ctx.createStereoPanner(); p.pan.value = pan; p.connect(master); return p;
  }
  function env(g, t, peak, len) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + len); }
  function noiseHit(t, hp, peak, len, pan, bp) {
    var s = ctx.createBufferSource(); s.buffer = noise; s.loop = true;
    var f = ctx.createBiquadFilter(); f.type = bp ? 'bandpass' : 'highpass'; f.frequency.value = hp; if (bp) f.Q.value = 0.8;
    var g = ctx.createGain(); env(g, t, peak, len); s.connect(f).connect(g).connect(out(pan)); s.start(t, Math.random() * 0.5); s.stop(t + len + 0.03);
  }
  var V = {
    snare: function (t, vel, pan) { vel = vel == null ? 1 : vel; noiseHit(t, 1800, 0.05 + 0.75 * vel * vel, 0.1 + 0.08 * vel, pan);
      var o = ctx.createOscillator(); var g = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(230, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.07); env(g, t, 0.05 + 0.4 * vel * vel, 0.09); o.connect(g).connect(out(pan)); o.start(t); o.stop(t + 0.12); },
    kick: function (t, vel) { vel = vel == null ? 1 : vel; var o = ctx.createOscillator(); var g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); env(g, t, 0.95 * vel, 0.3); o.connect(g).connect(master); o.start(t); o.stop(t + 0.34); },
    hat: function (t, vel, open) { vel = vel == null ? 1 : vel; noiseHit(t, 7500, 0.3 * vel, open ? 0.32 : 0.045, 0.25); },
    click: function (t, strong) { var o = ctx.createOscillator(); var g = ctx.createGain(); o.type = 'square'; o.frequency.value = strong ? 1760 : 1175; env(g, t, strong ? 0.22 : 0.14, 0.035); o.connect(g).connect(master); o.start(t); o.stop(t + 0.05); },
    pop: function (t, ok) { var o = ctx.createOscillator(); var g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(ok ? 660 : 300, t); o.frequency.exponentialRampToValueAtTime(ok ? 990 : 220, t + 0.12); env(g, t, 0.18, 0.16); o.connect(g).connect(master); o.start(t); o.stop(t + 0.2); },
  };

  /* ---------- o que tocar em cada carta (eventos em ticks: 96 = semínima) ---------- */
  function eventsOf(card) {
    if (card.deck === 'figuras') return M.rhythmEvents(card).map(function (e, i) { return { at: e.at, i: i, play: e.rest ? null : function (t) { V.snare(t, 0.85); } }; });
    if (card.deck === 'rockpop') return M.grooveHits(card).map(function (hits, k) { return { at: k * 24, i: k, play: hits.length ? function (t) { hits.forEach(function (h) {
      if (h.p === 'bd') V.kick(t); else if (h.p === 'hh') V.hat(t, h.acc ? 1 : 0.6); else if (h.p === 'ho') V.hat(t, 0.8, true); else if (h.p === 'sn') V.snare(t, h.ghost ? 0.22 : h.acc ? 1 : 0.85);
    }); } : null }; });
    if (card.deck === 'rudimentos') return M.rudimentEvents(card).map(function (e, i) { return { at: e.at, i: i, hand: e.hand, play: function (t) { V.snare(t, e.acc ? 1 : 0.42, e.hand === 'D' ? 0.45 : -0.45); } }; });
    return [];
  }

  /* ---------- tocador: agenda à frente no relógio do áudio (nunca setInterval tocando som direto) ---------- */
  var current = null;
  function stop() { if (current) { current.stopped = true; clearInterval(current.timer); cancelAnimationFrame(current.raf); var c = current; current = null; c.onStop && c.onStop(); } }
  function play(card, opts) {
    opts = opts || {}; stop(); if (!ensure()) return null;
    var evs = eventsOf(card); var bpm = opts.bpm || card.bpm; var loop = !!opts.loop; var clickOn = !!opts.click;
    var tick = 60 / bpm / 96; var bar = 384 * tick; var countIn = opts.countIn ? 4 : 0;
    var t0 = ctx.currentTime + 0.12; var me = { stopped: false, onStop: opts.onStop, visual: [] };
    var barN = 0, idx = 0, beatsDone = 0, totalBars = loop ? Infinity : 1;
    function sched() {
      var horizon = ctx.currentTime + 0.2;
      while (beatsDone < countIn) { var tc = t0 + beatsDone * 96 * tick; if (tc > horizon) return; V.click(tc, beatsDone === 0); me.visual.push([tc, -1, null, 'count', beatsDone]); beatsDone++; }
      var base = t0 + countIn * 96 * tick;
      while (barN < totalBars) {
        var bt = base + barN * bar; if (bt > horizon) return;
        if (clickOn && me.clickedBar !== barN) { me.clickedBar = barN; for (var b = 0; b < 4; b++) V.click(bt + b * 96 * tick, b === 0); } // metrônomo junto: os 4 tempos do compasso
        while (idx < evs.length) { var e = evs[idx]; var at = bt + e.at * tick; if (at > horizon) return; if (e.play) e.play(at); me.visual.push([at, e.i, e.hand, 'note']); idx++; }
        idx = 0; barN++;
      }
      if (!loop && !me.ending) { me.ending = base + bar; }
    }
    function draw() {
      if (me.stopped) return; var now = ctx.currentTime;
      while (me.visual.length && me.visual[0][0] <= now) { var v = me.visual.shift(); opts.onEvent && opts.onEvent(v[1], v[2], v[3], v[4]); }
      if (me.ending && now > me.ending + 0.05) { stop(); return; }
      me.raf = requestAnimationFrame(draw);
    }
    sched(); me.timer = setInterval(sched, 40); me.raf = requestAnimationFrame(draw);
    current = me; return me;
  }

  /* metrônomo avulso (ferramenta da tela inicial) */
  var metro = null;
  function metronome(bpm, onBeat) {
    if (metro) { clearInterval(metro.timer); cancelAnimationFrame(metro.raf); metro = null; return false; }
    if (!ensure()) return false;
    var beat = 60 / bpm; var t0 = ctx.currentTime + 0.1; var n = 0; var vis = [];
    metro = {};
    metro.timer = setInterval(function () { while (t0 + n * beat < ctx.currentTime + 0.2) { var t = t0 + n * beat; V.click(t, n % 4 === 0); vis.push([t, n % 4]); n++; } }, 40);
    var draw = function () { if (!metro) return; while (vis.length && vis[0][0] <= ctx.currentTime) { var v = vis.shift(); onBeat && onBeat(v[1]); } metro.raf = requestAnimationFrame(draw); };
    metro.raf = requestAnimationFrame(draw);
    return true;
  }
  function feedback(ok) { if (ensure()) V.pop(ctx.currentTime + 0.01, ok); }

  root.CGAudio = { ensure: ensure, play: play, stop: stop, eventsOf: eventsOf, metronome: metronome, metronomeOn: function () { return !!metro; }, feedback: feedback, isPlaying: function () { return !!current; } };
})(typeof window !== 'undefined' ? window : globalThis);
