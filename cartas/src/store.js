/* Cartas de Groove · PROGRESSO LOCAL (localStorage, só neste aparelho; sem login).
   Favoritos, histórico, cartas já vistas, sorteio sem repetir, recordes dos jogos e BPM preferido de cada carta. */
(function (root) {
  'use strict';
  var KEY = 'cartas-de-groove-v1';
  var blank = function () { return { favs: [], history: [], seen: {}, bags: {}, best: {}, bpm: {}, sound: true }; };
  var state = blank();
  try { var raw = root.localStorage && root.localStorage.getItem(KEY); if (raw) state = Object.assign(blank(), JSON.parse(raw)); } catch (e) { /* aba anônima ou armazenamento bloqueado: segue sem salvar */ }
  var subs = [];
  function save() { try { root.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* idem */ } subs.forEach(function (f) { f(state); }); }
  var api = {
    get: function () { return state; },
    subscribe: function (f) { subs.push(f); return function () { subs = subs.filter(function (x) { return x !== f; }); }; },
    toggleFav: function (id) { var i = state.favs.indexOf(id); if (i >= 0) state.favs.splice(i, 1); else state.favs.unshift(id); save(); },
    isFav: function (id) { return state.favs.indexOf(id) >= 0; },
    saw: function (id) { state.seen[id] = (state.seen[id] || 0) + 1; state.history = [{ id: id, at: Date.now() }].concat(state.history.filter(function (h) { return h.id !== id; })).slice(0, 40); save(); },
    bag: function (key) { return state.bags[key] || []; },
    setBag: function (key, bag) { state.bags[key] = bag; save(); },
    bpmOf: function (card) { return state.bpm[card.id] || card.bpm; },
    setBpm: function (id, v) { state.bpm[id] = v; save(); },
    best: function (key) { return state.best[key] || null; },
    record: function (key, time, tries) {
      var b = state.best[key]; var isNew = !b || tries < b.tries || (tries === b.tries && time < b.time);
      state.best[key] = { time: b ? Math.min(b.time, time) : time, tries: b ? Math.min(b.tries, tries) : tries, plays: (b ? b.plays : 0) + 1 }; save(); return isNew;
    },
    setSound: function (on) { state.sound = !!on; save(); },
    reset: function () { state = blank(); save(); },
  };
  root.CGStore = api;
})(typeof window !== 'undefined' ? window : globalThis);
