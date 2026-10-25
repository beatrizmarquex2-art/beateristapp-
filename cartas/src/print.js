/* Cartas de Groove · IMPRESSÃO A4 (frente e verso). Monta as folhas com os MESMOS dados e a MESMA notação do app.
   Abre com #print-figuras, #print-rockpop, #print-rudimentos ou #print-mem-<jogo>. Cada frente é seguida do seu verso,
   com as colunas espelhadas: imprime frente e verso virando pela borda longa e os versos caem atrás das cartas certas. */
(function () {
  'use strict';
  var M = window.CGMusic, R = window.CGRender, I = window.CGIllus;
  var tok = (location.hash || '').slice(1); if (tok.indexOf('print-') !== 0) return;
  document.documentElement.classList.add('printing');
  var root = document.getElementById('root');
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  var LV = M.LEVEL_NAMES;

  function crop(card) { ['tl', 'tr', 'bl', 'br'].forEach(function (k) { card.append(el('i', 'crop ' + k)); }); }
  function back(kind, label) {
    var b = el('div', 'pc back ' + kind); crop(b);
    b.append(el('div', 'pb-in', '<span class="pb-top">cartas de</span><span class="pb-big">GROOVE</span><span class="pb-lab">' + label + '</span><span class="pb-brand">Beaterista — Escola de Música</span>'));
    return b;
  }
  function pages(items, perRow, perPage, kind, backLabel) {
    for (var i = 0; i < items.length; i += perPage) {
      var chunk = items.slice(i, i + perPage);
      var front = el('section', 'sheet ' + kind); var grid = el('div', 'sgrid'); front.append(grid);
      chunk.forEach(function (make) { grid.append(make()); });
      for (var k = chunk.length; k < perPage; k++) grid.append(el('div', 'pc empty'));
      var rear = el('section', 'sheet back-sheet ' + kind); var g2 = el('div', 'sgrid'); rear.append(g2);
      // verso: mesma linha, colunas trocadas (espelho pela borda longa)
      var rows = perPage / perRow;
      for (var r = 0; r < rows; r++) for (var c = perRow - 1; c >= 0; c--) { var idx = r * perRow + c; g2.append(idx < chunk.length ? back(kind, backLabel) : el('div', 'pc empty')); }
      root.append(front, rear);
    }
  }

  function deckCard(c) {
    return function () {
      var d = M.DECKS[c.deck]; var same = d.cards.filter(function (x) { return x.level === c.level; }); var n = same.indexOf(c) + 1;
      var card = el('div', 'pc front deck-' + c.deck); crop(card);
      card.append(el('div', 'pc-head', '<span>baralho ' + d.no + ' · ' + d.title + '</span><span class="stamp lv' + c.level + '">' + LV[c.level] + '</span>'));
      var sub = c.deck === 'figuras' ? M.rhythmTitle(c) : c.en;
      card.append(el('div', 'pc-title', '<h2>' + (c.name || 'Leitura rítmica') + (sub ? ' <small>' + sub + '</small>' : '') + '</h2>'));
      var sc = el('div', 'pc-score'); card.append(sc);
      (c.deck === 'figuras' ? R.rhythm : c.deck === 'rockpop' ? R.groove : R.rudiment)(sc, c, { narrow: true, width: 340 }); // largura menor = notas maiores no papel
      if (c.deck === 'rockpop') card.append(el('p', 'pc-legend', '× chimbal · o aberto · caixa no 3º espaço · ( ) ghost · bumbo embaixo · > acento'));
      if (c.deck === 'rudimentos') card.append(el('p', 'pc-legend', 'D mão direita · E mão esquerda · > acento'));
      if (c.tip) card.append(el('p', 'pc-tip', c.tip));
      card.append(el('div', 'pc-foot', '<span>' + c.bpm + ' BPM</span><span>Beaterista</span>'));
      return card;
    };
  }

  function memCard(game, face, pairId, side) {
    return function () {
      var card = el('div', 'pc front mem'); crop(card);
      var body = el('div', 'mc-body'); card.append(body);
      if (face.type === 'illus') body.innerHTML = '<span class="mf-illus">' + I.svg(face.v) + '</span>';
      else if (face.type === 'text') body.innerHTML = '<span class="mf-text">' + (face.tag ? '<small>' + face.tag + '</small>' : '') + '<b>' + face.v + '</b>' + (face.sub ? '<small>' + face.sub + '</small>' : '') + '</span>';
      else if (face.type === 'sticking') body.innerHTML = '<span class="mf-stick">' + face.v.map(function (s) { var a = s[0] === '>'; return '<span class="' + (a ? 'acc' : '') + '"><i>' + (a ? '>' : '') + '</i>' + (a ? s.slice(1) : s) + '</span>'; }).join('') + '</span>';
      else { var sc = el('span', 'mf-score'); body.append(sc); if (face.type === 'figure') R.figure(sc, face.v); else if (face.type === 'rest') R.rest(sc, face.v); else R.drumPiece(sc, face.v); }
      card.append(el('span', 'mc-id', game.name));
      return card;
    };
  }

  if (tok.indexOf('print-mem-') === 0) {
    var g = M.MEMORY.find(function (x) { return x.id === tok.slice(10); });
    var items = []; g.pairs.forEach(function (p, i) { items.push(memCard(g, p.a, String(i + 1).padStart(2, '0'), 'a')); items.push(memCard(g, p.b, String(i + 1).padStart(2, '0'), 'b')); });
    root.append(el('section', 'sheet cover', '<h1>Memória de Groove</h1><h2>' + g.name + '</h2><p>' + g.kind + ' · ' + g.pairs.length + ' pares (' + g.pairs.length * 2 + ' cartas)</p>' +
      (g.id === 'pecas' ? '<p>legenda da pauta: bumbo 1º espaço · surdo 2º espaço · caixa 3º espaço · tom 1 4º espaço · ride na 5ª linha (x) · chimbal acima da pauta (x; + fechado, o aberto) · crash na linha suplementar (x). algumas posições variam entre métodos.</p>' : '') +
      (g.conflicts ? '<p>Nirvana e Foo Fighters não entram no mesmo jogo: o Dave Grohl tocou nas duas bandas.</p>' : '') +
      '<p>imprima em A4, frente e verso virando pela borda longa, em escala 100% (sem “ajustar à página”). corte nas marcas. (o gabarito dos pares está no app, em Memória de Groove).</p><p class="cv-brand">Cartas de Groove · Beaterista — Escola de Música</p>'));
    root.append(el('section', 'sheet blank')); // verso da capa em branco: assim cada frente cai com o seu verso
    pages(items, 3, 12, 'mem', g.name);
  } else {
    var d = M.DECKS[tok.slice(6)];
    root.append(el('section', 'sheet cover', '<h1>Cartas de Groove</h1><h2>Baralho ' + d.no + ' · ' + d.title + '</h2><p>' + d.cards.length + ' cartas · ' + [1, 2, 3].filter(function (l) { return d.cards.some(function (c) { return c.level === l; }); }).map(function (l) { return d.cards.filter(function (c) { return c.level === l; }).length + ' ' + LV[l]; }).join(' · ') + '</p>' +
      '<p>imprima em A4, frente e verso virando pela borda longa, em escala 100%. as marcas nos cantos mostram onde cortar. as cartas são as mesmas do app.</p><p class="cv-brand">Cartas de Groove · Beaterista — Escola de Música</p>'));
    root.append(el('section', 'sheet blank'));
    pages(d.cards.map(deckCard), 2, 4, 'deck', d.title);
  }
  window.__printReady = true;
})();
