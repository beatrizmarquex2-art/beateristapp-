/* Cartas de Groove · NOTAÇÃO (VexFlow 4). Desenha a partir dos dados de music.js — app e PDF usam estas mesmas funções.
   Em tela estreita, o compasso quebra em 2 sistemas (tempos 1–2 e 3–4) pra partitura ficar legível sem zoom. */
(function (root) {
  'use strict';
  var M = root.CGMusic;
  function VF() { return root.Vex.Flow; }

  var INK = '#141414';
  // posições na pauta de bateria (legenda do baralho): bumbo F4 · surdo A4 · caixa C5 · tom 1 E5 · chimbal G5 (x) · ride F5 (x) · crash A5 (x)
  var KEY = { bd: 'f/4', ft: 'a/4', sn: 'c/5', t1: 'e/5', hh: 'g/5/x2', ho: 'g/5/x2', ride: 'f/5/x2', crash: 'a/5/x2' };

  function setup(el, w, h) {
    var F = VF(); el.innerHTML = '';
    var r = new F.Renderer(el, F.Renderer.Backends.SVG); r.resize(w, h);
    var ctx = r.getContext(); ctx.setFillStyle(INK); ctx.setStrokeStyle(INK);
    var svg = el.querySelector('svg'); svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svg.removeAttribute('width'); svg.removeAttribute('height');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet'); svg.style.width = '100%'; svg.style.height = 'auto'; svg.setAttribute('role', 'img');
    return ctx;
  }
  function addAccent(note) { var F = VF(); note.addModifier(new F.Articulation('a>').setPosition(F.Modifier.Position.ABOVE), 0); }
  function addText(note, txt, below, font) {
    var F = VF(); var a = new F.Annotation(txt);
    a.setFont(font || { family: 'Hanken Grotesk, Arial, sans-serif', size: 13, weight: 'bold' });
    a.setVerticalJustification(below ? F.Annotation.VerticalJustify.BOTTOM : F.Annotation.VerticalJustify.TOP);
    note.addModifier(a, 0);
  }
  function dot(note) { var F = VF(); if (F.Dot.buildAndAttach) F.Dot.buildAndAttach([note], { all: true }); else note.addDotToAll(); }

  /** Distribui notas de 4 tempos em sistemas; cada item tem .beat (0–3). */
  function systemsOf(narrow) { return narrow ? [[0, 1], [2, 3]] : [[0, 1, 2, 3]]; }

  /** Desenha N sistemas. build(beats) devolve { voices: [{notes, stem}], tuplets: [...], extras }. */
  function drawSystems(el, opts, build) {
    var F = VF(); var narrow = !!opts.narrow; var sys = systemsOf(narrow);
    var W = opts.width || (narrow ? 420 : 760); var lineH = opts.lineH || (opts.oneLine ? 104 : 132); var top = opts.top || 18;
    var ctx = setup(el, W, top + sys.length * lineH + 6);
    var noteEls = [];
    sys.forEach(function (beats, si) {
      var x = 8, y = top + si * lineH;
      var stave = new F.Stave(x, y, W - 16);
      if (opts.oneLine) { stave.setConfigForLines([0, 1, 2, 3, 4].map(function (i) { return { visible: i === 2 }; })); stave.setBegBarType(F.Barline.type.NONE); } // só ritmo: uma linha, sem pauta
      else stave.addClef('percussion');
      if (si === 0) stave.addTimeSignature('4/4');
      if (si === sys.length - 1) stave.setEndBarType(F.Barline.type.END);
      stave.setContext(ctx).draw();
      var b = build(beats);
      var voices = b.voices.map(function (v) {
        var voice = new F.Voice({ num_beats: beats.length, beat_value: 4 }); // estrito: o VexFlow recusa compasso incompleto
        voice.addTickables(v.notes); return voice;
      });
      var beams = [];
      b.voices.forEach(function (v) { beams = beams.concat(F.Beam.generateBeams(v.notes, { groups: [new F.Fraction(1, 4)], stem_direction: v.stem, beam_rests: false, maintain_stem_directions: true })); });
      var fmt = new F.Formatter(); fmt.joinVoices(voices).format(voices, stave.getNoteEndX() - stave.getNoteStartX() - 14);
      voices.forEach(function (v) { v.draw(ctx, stave); });
      beams.forEach(function (bm) { bm.setContext(ctx).draw(); });
      (b.tuplets || []).forEach(function (t) { t.setContext(ctx).draw(); });
      b.voices.forEach(function (v) { v.notes.forEach(function (n) { if (n.__ev != null) noteEls.push({ ev: n.__ev, el: n.getSVGElement && n.getSVGElement() }); }); });
    });
    return noteEls;
  }

  function tupletsFor(notes, evs) { // agrupa tercinas/sextinas por tempo
    var F = VF(); var out = []; var cur = null;
    evs.forEach(function (e, i) {
      if (!e.tup) { cur = null; return; }
      if (!cur || cur.beat !== e.beat || cur.tup !== e.tup) { cur = { beat: e.beat, tup: e.tup, notes: [] }; out.push(cur); }
      cur.notes.push(notes[i]);
    });
    return out.map(function (g) { return new F.Tuplet(g.notes, g.tup === 3 ? { num_notes: 3, notes_occupied: 2, ratioed: false, bracketed: g.notes.some(function (n) { return n.isRest(); }) } : { num_notes: 6, notes_occupied: 4, ratioed: false, bracketed: false }); });
  }

  /* ---------- baralho 01: figuras e pausas (pauta de percussão, notas na linha da caixa) ---------- */
  function rhythm(el, card, opts) {
    var F = VF(); var evs = M.rhythmEvents(card);
    return drawSystems(el, Object.assign({ oneLine: true }, opts || {}), function (beats) {
      var mine = evs.map(function (e, i) { e.i = i; return e; }).filter(function (e) { return beats.indexOf(e.beat) >= 0; });
      var notes = mine.map(function (e) {
        var n = new F.StaveNote({ keys: ['b/4'], duration: e.dur + (e.rest ? 'r' : ''), stem_direction: 1 });
        n.__ev = e.i; return n;
      });
      return { voices: [{ notes: notes, stem: 1 }], tuplets: tupletsFor(notes, mine) };
    });
  }

  /* ---------- baralho 02: grooves (mãos com haste pra cima, pés pra baixo) ---------- */
  function groove(el, g, opts) {
    var F = VF();
    var hands = M.grooveVoice(g, ['hh', 'ho', 'sn']); var feet = M.grooveVoice(g, ['bd']);
    return drawSystems(el, opts || {}, function (beats) {
      function mk(list, stem) {
        return list.filter(function (e) { return beats.indexOf(e.beat) >= 0; }).map(function (e) {
          var n;
          if (e.rest) n = new F.StaveNote({ keys: [stem > 0 ? 'e/5' : 'd/4'], duration: e.dur + 'r', stem_direction: stem });
          else {
            var keys = e.hits.map(function (h) { return KEY[h.p]; });
            n = new F.StaveNote({ keys: keys, duration: e.dur, stem_direction: stem });
            e.hits.forEach(function (h) {
              var idx = keys.indexOf(KEY[h.p]);
              // ghost: cabeça entre parênteses
              if (h.ghost) { var P = F.Parenthesis; if (P) { n.addModifier(new P(F.Modifier.Position.LEFT), idx); n.addModifier(new P(F.Modifier.Position.RIGHT), idx); } }
            });
            if (e.hits.some(function (h) { return h.acc; })) addAccent(n);
            if (e.hits.some(function (h) { return h.p === 'ho'; })) addText(n, 'o', false, { family: 'Hanken Grotesk, Arial, sans-serif', size: 12, weight: 'bold' });
            n.__ev = e.step;
          }
          if (e.dur.indexOf('d') > 0) dot(n); // '8d' já vale 3 semicolcheias; o ponto é o desenho
          return n;
        });
      }
      return { voices: [{ notes: mk(hands, 1), stem: 1 }, { notes: mk(feet, -1), stem: -1 }] };
    });
  }

  /* ---------- baralho 03: rudimentos (caixa, baqueteamento D/E embaixo, acentos em cima) ---------- */
  function rudiment(el, r, opts) {
    var F = VF(); var evs = M.rudimentEvents(r);
    return drawSystems(el, Object.assign({ lineH: 116, oneLine: true }, opts || {}), function (beats) {
      var mine = evs.map(function (e, i) { e.i = i; return e; }).filter(function (e) { return beats.indexOf(e.beat) >= 0; });
      var notes = mine.map(function (e) {
        var n = new F.StaveNote({ keys: ['b/4'], duration: e.dur, stem_direction: 1 });
        if (e.acc) addAccent(n);
        addText(n, e.hand, true, { family: 'Hanken Grotesk, Arial, sans-serif', size: 14, weight: e.acc ? '900' : 'bold' });
        n.__ev = e.i; return n;
      });
      return { voices: [{ notes: notes, stem: 1 }], tuplets: tupletsFor(notes, mine) };
    });
  }

  /* ---------- jogos: uma figura, uma pausa, uma peça da bateria ---------- */
  function single(el, spec) {
    var F = VF(); var W = 112, H = 118; var ctx = setup(el, W, H); // pauta curta = nota grande na carta
    var stave = new F.Stave(2, 26, W - 4); if (spec.clef) stave.addClef('percussion'); else { stave.setConfigForLines([0, 1, 2, 3, 4].map(function (i) { return { visible: i === 2 }; })); stave.setBegBarType(F.Barline.type.NONE); stave.setEndBarType(F.Barline.type.NONE); } stave.setContext(ctx).draw();
    var notes = spec.notes.map(function (s) {
      var n = new F.StaveNote({ keys: s.keys, duration: s.dur, stem_direction: s.stem || 1, align_center: !!s.center });
      if (s.text) addText(n, s.text, false, { family: 'Hanken Grotesk, Arial, sans-serif', size: 15, weight: 'bold' });
      return n;
    });
    var voice = new F.Voice({ num_beats: 4, beat_value: 4 }).setMode(F.Voice.Mode.SOFT); voice.addTickables(notes);
    new F.Formatter().joinVoices([voice]).format([voice], W - (spec.clef ? 56 : 30));
    voice.draw(ctx, stave);
  }
  function figure(el, dur) { single(el, { notes: [{ keys: ['b/4'], dur: dur, center: dur === 'w' }] }); }
  function rest(el, dur) { single(el, { notes: [{ keys: ['b/4'], dur: dur + 'r', center: dur === 'w' }] }); }
  var PIECE = { bumbo: { k: 'bd', stem: -1 }, caixa: { k: 'sn' }, hhf: { k: 'hh', text: '+' }, hha: { k: 'ho', text: 'o' }, ride: { k: 'ride' }, crash: { k: 'crash' }, tom1: { k: 't1' }, surdo: { k: 'ft' } };
  function drumPiece(el, id) { var p = PIECE[id]; single(el, { clef: true, notes: [{ keys: [KEY[p.k]], dur: 'q', stem: p.stem || 1, text: p.text }] }); }

  root.CGRender = { rhythm: rhythm, groove: groove, rudiment: rudiment, figure: figure, rest: rest, drumPiece: drumPiece, KEY: KEY };
})(typeof window !== 'undefined' ? window : globalThis);
