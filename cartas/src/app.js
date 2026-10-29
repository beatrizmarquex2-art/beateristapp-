/* Cartas de Groove · APRESENTAÇÃO (React + htm). Lê os dados de music.js, desenha com render.js, toca com audio.js,
   guarda progresso com store.js. Nenhuma regra musical mora aqui. */
(function () {
  'use strict';
  var React = window.React, ReactDOM = window.ReactDOM;
  var html = window.htm.bind(React.createElement);
  var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef, useMemo = React.useMemo, useCallback = React.useCallback;
  var M = window.CGMusic, R = window.CGRender, A = window.CGAudio, S = window.CGStore, I = window.CGIllus;

  var ALL = {}; Object.keys(M.DECKS).forEach(function (d) { M.DECKS[d].cards.forEach(function (c) { ALL[c.id] = c; }); });
  var LV = M.LEVEL_NAMES;
  var DECK_LEVELS = { figuras: [1, 2, 3], rockpop: [1, 2, 3], rudimentos: [1, 2] };
  var DECK_BLURB = {
    figuras: 'semínima, colcheia, semicolcheia, pausas, tercina, sextina e fusa. sempre 4 tempos certinhos.',
    rockpop: 'grooves completos de bumbo, caixa e chimbal, do rock básico às ghost notes.',
    rudimentos: 'os rudimentos da caixa com baqueteamento D/E e acentos marcados.',
  };

  /* ---------- pedacinhos gráficos (desenhados à mão, sem ícone pronto) ---------- */
  function Doodle(p) {
    var d = {
      star: 'M12 2.5l2.6 6.4 6.9.4-5.3 4.4 1.8 6.8L12 16.8 6 20.5l1.8-6.8L2.5 9.3l6.9-.4z',
      bolt: 'M13.5 2L5 13.2h6.2L9.8 22l9-12.2h-6.1z',
      arrow: 'M3 15c4-6 9-8 16-6m0 0l-4-3.5m4 3.5l-4.5 3',
      crown: 'M3 18l1.6-10 4.8 4.6L12 5l2.6 7.6L19.4 8 21 18z',
      scribble: 'M2 14c3-6 5 4 8-2s4 5 7-1 3 3 5 1',
    }[p.k];
    return html`<svg className=${'doodle ' + (p.className || '')} viewBox="0 0 24 24" aria-hidden="true" style=${p.style}><path d=${d} fill=${p.fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth=${p.w || 1.6} strokeLinecap="round" strokeLinejoin="round"/></svg>`;
  }
  function Tape(p) { return html`<span className=${'tape ' + (p.className || '')} aria-hidden="true" style=${p.style}></span>`; }

  /* ---------- notação montada pelo VexFlow dentro de uma div ---------- */
  function Score(p) {
    var ref = useRef(null); var w = useWidth(ref);
    useEffect(function () {
      if (!ref.current || !w) return;
      var narrow = p.forceWide ? false : w < 520;
      var fn = p.card.deck === 'figuras' ? R.rhythm : p.card.deck === 'rockpop' ? R.groove : R.rudiment;
      var els = fn(ref.current, p.card, { narrow: narrow });
      p.onNotes && p.onNotes(els);
    }, [p.card.id, w < 520, !!w]);
    return html`<div className="score" ref=${ref} aria-label=${'Partitura: ' + (p.card.name || 'sequência ' + p.card.id)}></div>`;
  }
  function useWidth(ref) {
    var s = useState(0); var w = s[0], setW = s[1];
    useEffect(function () {
      if (!ref.current) return; setW(ref.current.clientWidth);
      var ro = new ResizeObserver(function (e) { setW(e[0].contentRect.width); }); ro.observe(ref.current);
      return function () { ro.disconnect(); };
    }, []);
    return w;
  }

  /* ---------- carta grande ---------- */
  var DECK_NO = { figuras: '01', rockpop: '02', rudimentos: '03' };
  function cardTitle(c) { return c.name || 'Leitura rítmica'; }
  function cardSub(c) { return c.deck === 'figuras' ? M.rhythmTitle(c) : c.en; }
  function CardFace(p) {
    var c = p.card; var deck = M.DECKS[c.deck];
    return html`<article className=${'gcard deck-' + c.deck + (p.flip ? ' flip-in' : '')} key=${c.id} data-card=${c.id} aria-label=${cardTitle(c)}>
      <${Tape} className="t1"/>
      <header className="gcard-head">
        <span className="gcard-pack">baralho ${DECK_NO[c.deck]} · ${deck.title}</span>
        <span className=${'stamp lv' + c.level}>${LV[c.level]}</span>
      </header>
      <div className="gcard-title">
        <h2>${cardTitle(c)}</h2>
        ${cardSub(c) ? html`<small className="gcard-en">${cardSub(c)}</small>` : null}
      </div>
      <${Score} card=${c} onNotes=${p.onNotes}/>
      ${c.deck === 'rockpop' ? html`<p className="legend"><b>×</b> chimbal · <b>o</b> aberto · <b>●</b> caixa (meio) · <b>( )</b> ghost · <b>●</b> bumbo (embaixo) · <b>></b> acento</p>` : null}
      ${c.deck === 'rudimentos' ? html`<p className="legend"><b>D</b> mão direita · <b>E</b> mão esquerda · <b>></b> acento</p>` : null}
      ${c.tip ? html`<p className="tip"><${Doodle} k="arrow"/> ${c.tip}</p>` : null}
      <footer className="gcard-foot"><span>${c.bpm} BPM sugerido</span><span className="brand">Beaterista</span></footer>
    </article>`;
  }

  /* ---------- ferramentas do topo: metrônomo e som ---------- */
  function TopBar(p) {
    var st = useState(90); var bpm = st[0], setBpm = st[1]; var on = useState(false); var beat = useState(-1);
    var snd = useState(S.get().sound);
    function toggle() { A.ensure(); var r = A.metronome(bpm, function (b) { beat[1](b); }); on[1](r); if (!r) beat[1](-1); }
    useEffect(function () { if (on[0]) { A.metronome(); A.metronome(bpm, function (b) { beat[1](b); }); } }, [bpm]);
    return html`<div className="topbar">
      <button className="brandmark" onClick=${function () { p.go('home'); }} aria-label="Início">
        <span className="bm-1">cartas de</span><span className="bm-2">GROOVE</span>
      </button>
      <div className="metro" role="group" aria-label="Metrônomo">
        <button className=${'chip' + (on[0] ? ' on' : '')} onClick=${toggle} aria-pressed=${on[0]}>
          <span className=${'beatdot' + (beat[0] >= 0 ? ' b' + beat[0] : '')} aria-hidden="true"></span>metrô</button>
        <button className="chip sq" aria-label="menos 5 BPM" onClick=${function () { setBpm(Math.max(40, bpm - 5)); }}>−</button>
        <output className="bpm-out" aria-live="polite">${bpm}</output>
        <button className="chip sq" aria-label="mais 5 BPM" onClick=${function () { setBpm(Math.min(220, bpm + 5)); }}>+</button>
      </div>
      <button className=${'chip sq snd' + (snd[0] ? ' on' : '')} aria-pressed=${snd[0]} aria-label=${snd[0] ? 'Efeitos sonoros ligados' : 'Efeitos sonoros desligados'} title="efeitos sonoros dos jogos" onClick=${function () { S.setSound(!snd[0]); snd[1](!snd[0]); }}>${snd[0] ? '♪' : '♪̸'}</button>
    </div>`;
  }

  /* ---------- tela inicial ---------- */
  function Pile(p) {
    var d = M.DECKS[p.deck]; var seen = d.cards.filter(function (c) { return S.get().seen[c.id]; }).length;
    return html`<button className=${'pile pile-' + p.deck} onClick=${function () { p.go(p.deck); }} aria-label=${'Abrir baralho ' + d.title}>
      <span className="pile-under u2" aria-hidden="true"></span><span className="pile-under u1" aria-hidden="true"></span>
      <span className="pile-top">
        <${Tape} className="t2"/>
        <span className="pile-no">${d.no}</span>
        <span className="pile-name">${d.title}</span>
        <span className="pile-mini" aria-hidden="true"><${Score} card=${d.cards[p.deck === 'figuras' ? 26 : p.deck === 'rockpop' ? 7 : 2]} forceWide=${true}/></span>
        <span className="pile-meta">${d.cards.length} cartas · ${seen ? seen + ' vistas' : 'nenhuma vista ainda'}</span>
        <span className="pile-blurb">${DECK_BLURB[p.deck]}</span>
      </span>
    </button>`;
  }
  function Home(p) {
    var st = S.get(); var leitura = p.mode === 'leitura';
    return html`<main className="home">
      <section className="hero">
        <p className="eyebrow">${leitura ? html`<a href="../#/kids/cartas" className="kidslink">‹ kids</a> · ` : null}Beaterista — Escola de Música</p>
        <h1><span className="h1a">Cartas</span><span className="h1b">de Groove</span></h1>
        <p className="lede">${leitura ? 'três baralhos de leitura pra ler, tocar e sortear em aula.' : 'três baralhos pra ler, tocar e sortear em aula, e cinco jogos da memória pra fixar.'}</p>
        <${Doodle} k="crown" className="d-crown"/><${Doodle} k="star" className="d-star" fill=${true}/><${Doodle} k="scribble" className="d-scr"/>
        <div className="fan" aria-hidden="true">
          ${[['figuras', 30], ['rockpop', 12], ['rudimentos', 8]].map(function (x, i) { var c = M.DECKS[x[0]].cards[x[1]]; return html`<div key=${i} className=${'fan-card f' + i}><${Tape} className="t1"/><span className="fan-no">${M.DECKS[x[0]].no}</span><span className="fan-t">${cardTitle(c)}</span><${Score} card=${c} forceWide=${true}/></div>`; })}
        </div>
      </section>
      <section className="piles" aria-label="Baralhos">
        <${Pile} deck="figuras" go=${p.go}/><${Pile} deck="rockpop" go=${p.go}/><${Pile} deck="rudimentos" go=${p.go}/>
        ${leitura ? null : html`<button className="pile pile-memo" onClick=${function () { p.go('memoria'); }} aria-label="Abrir jogos da memória">
          <span className="memo-grid" aria-hidden="true">${[0, 1, 2, 3, 4, 5].map(function (i) { return html`<i key=${i} className=${i === 4 ? 'up' : ''}>${i === 4 ? html`<span dangerouslySetInnerHTML=${{ __html: I.svg('agogo') }}></span>` : null}</i>`; })}</span>
          <span className="pile-name">Memória de Groove</span>
          <span className="pile-meta">5 jogos · ${Object.keys(st.best).length ? Object.keys(st.best).length + ' recordes' : 'sem recordes ainda'}</span>
        </button>`}
      </section>
      <section className="shelf">
        <${MiniList} title="favoritas" ids=${st.favs} empty="toca no ♥ de uma carta pra guardar aqui." go=${p.go}/>
        <${MiniList} title="últimas sorteadas" ids=${st.history.map(function (h) { return h.id; })} empty="as cartas que você tirar aparecem aqui." go=${p.go}/>
        <${Progress}/>
      </section>
    </main>`;
  }
  function MiniList(p) {
    return html`<div className="minilist"><h2 className="label">${p.title}</h2>
      ${p.ids.length ? html`<ul>${p.ids.slice(0, 8).map(function (id) { var c = ALL[id]; if (!c) return null; return html`<li key=${id}><button onClick=${function () { p.go(c.deck, id); }}><b>${M.DECKS[c.deck].short}</b> ${cardTitle(c)}${c.deck === 'figuras' ? ' · ' + M.rhythmTitle(c) : ''}</button></li>`; })}</ul>` : html`<p className="muted">${p.empty}</p>`}</div>`;
  }
  function Progress() {
    var st = S.get();
    return html`<div className="minilist"><h2 className="label">progresso</h2><ul className="prog">${Object.keys(M.DECKS).map(function (k) {
      var d = M.DECKS[k]; var n = d.cards.filter(function (c) { return st.seen[c.id]; }).length;
      return html`<li key=${k}><span>${d.short}</span><span className="bar"><i style=${{ width: (100 * n / d.cards.length) + '%' }}></i></span><b>${n}/${d.cards.length}</b></li>`;
    })}</ul></div>`;
  }

  /* ---------- baralho: sorteador + tocador ---------- */
  function Deck(p) {
    var deck = M.DECKS[p.deck];
    var lvS = useState(0); var level = lvS[0];
    var pool = deck.cards.filter(function (c) { return !level || c.level === level; });
    var start = p.cardId && ALL[p.cardId] && ALL[p.cardId].deck === p.deck ? p.cardId : null;
    var cs = useState(start); var cardId = cs[0], setCardId = cs[1];
    var card = cardId ? ALL[cardId] : null;
    var playing = useState(false); var loop = useState(true); var withClick = useState(false); var countIn = useState(false);
    var bpmS = useState(card ? S.bpmOf(card) : 80);
    var shake = useState(0); var view = useState('carta'); var hand = useState('');
    var notesRef = useRef([]); var tick = useState(0);
    useEffect(function () { return S.subscribe(function () { tick[1](function (x) { return x + 1; }); }); }, []);
    useEffect(function () { return function () { A.stop(); }; }, []);
    useEffect(function () { if (card) bpmS[1](S.bpmOf(card)); }, [cardId]);

    var bagKey = p.deck + ':' + level;
    function draw() {
      A.stop(); playing[1](false);
      var ids = pool.map(function (c) { return c.id; });
      var r = M.drawFrom(ids, S.bag(bagKey));
      for (var k = 0; k < 4 && r.id === cardId && ids.length > 1; k++) r = M.drawFrom(ids, r.bag); // nunca a mesma carta duas vezes seguidas
      S.setBag(bagKey, r.bag); S.saw(r.id); setCardId(r.id); shake[1](shake[0] + 1); view[1]('carta');
      if (S.get().sound) A.feedback(true);
    }
    function open(id) { A.stop(); playing[1](false); S.saw(id); setCardId(id); view[1]('carta'); }
    function mark(i, h, kind) {
      var els = notesRef.current; if (i < 0 || els.some(function (n) { return n.ev === i; })) els.forEach(function (n) { if (n.el) n.el.classList.toggle('now', n.ev === i); }); // semicolcheia sem nota: a última continua acesa
      if (h) hand[1](h);
    }
    function toggle() {
      if (playing[0]) { A.stop(); playing[1](false); return; }
      var r = A.play(card, { bpm: bpmS[0], loop: loop[0], click: withClick[0], countIn: countIn[0], onEvent: mark, onStop: function () { playing[1](false); mark(-1); hand[1](''); } });
      playing[1](!!r);
    }
    function setBpm(v) { v = Math.max(30, Math.min(200, v)); bpmS[1](v); S.setBpm(card.id, v); if (playing[0]) { A.stop(); setTimeout(function () { var r = A.play(card, { bpm: v, loop: loop[0], click: withClick[0], onEvent: mark, onStop: function () { playing[1](false); mark(-1); } }); playing[1](!!r); }, 30); } }
    var remaining = S.bag(bagKey).filter(function (x) { return pool.some(function (c) { return c.id === x; }); }).length;
    var fav = card && S.isFav(card.id);
    return html`<main className=${'deckview deck-' + p.deck}>
      <div className="deckhead">
        <button className="back" onClick=${function () { A.stop(); p.go('leitura'); }} aria-label="Voltar aos baralhos">‹ baralhos</button>
        <h1><span className="dno">${deck.no}</span>${deck.title}</h1>
        <div className="seg" role="radiogroup" aria-label="Nível">
          ${[0].concat(DECK_LEVELS[p.deck]).map(function (l) { return html`<button key=${l} role="radio" aria-checked=${level === l} className=${level === l ? 'on' : ''} onClick=${function () { lvS[1](l); }}>${l ? LV[l] : 'todos'}</button>`; })}
        </div>
      </div>
      <div className="deckgrid">
        <div className="stage">
          ${card ? html`<${CardFace} card=${card} flip=${true} key=${card.id + ':' + shake[0]} onNotes=${function (e) { notesRef.current = e; }}/>`
            : html`<div className="facedown" onClick=${draw}><span className="fd-logo">cartas de<b>GROOVE</b></span><span className="fd-sub">toca em sortear</span></div>`}
          ${card && p.deck === 'rudimentos' && playing[0] ? html`<div className=${'handflash ' + hand[0]} aria-live="off">${hand[0] === 'D' ? 'D · direita' : hand[0] === 'E' ? 'E · esquerda' : ''}</div>` : null}
        </div>
        <aside className="controls">
          <button className=${'draw' + (shake[0] ? ' shake s' + (shake[0] % 2) : '')} onClick=${draw}>
            <span className="draw-stack" aria-hidden="true"><i></i><i></i><i></i></span>
            <span>${card ? 'sortear outra carta' : 'sortear carta'}</span>
          </button>
          <p className="bagnote">${pool.length} cartas ${level ? LV[level] + 's' : 'no baralho'} · ${remaining ? remaining + ' ainda não saíram nesta volta' : 'volta completa: começa de novo'}</p>
          ${card ? html`<div className="player">
            <button className=${'play' + (playing[0] ? ' on' : '')} onClick=${toggle} aria-label=${playing[0] ? 'Pausar' : 'Tocar'}>${playing[0] ? '❚❚' : '▶'}</button>
            <div className="bpm">
              <button className="chip sq" aria-label="menos 4 BPM" onClick=${function () { setBpm(bpmS[0] - 4); }}>−</button>
              <label><output>${bpmS[0]}</output><small>BPM</small></label>
              <button className="chip sq" aria-label="mais 4 BPM" onClick=${function () { setBpm(bpmS[0] + 4); }}>+</button>
              <input type="range" min="30" max="200" value=${bpmS[0]} aria-label="BPM" onChange=${function (e) { setBpm(+e.target.value); }}/>
            </div>
            <div className="toggles">
              <button className=${'chip' + (loop[0] ? ' on' : '')} aria-pressed=${loop[0]} onClick=${function () { loop[1](!loop[0]); }}>↻ loop</button>
              <button className=${'chip' + (withClick[0] ? ' on' : '')} aria-pressed=${withClick[0]} onClick=${function () { withClick[1](!withClick[0]); }}>clique junto</button>
              <button className=${'chip' + (countIn[0] ? ' on' : '')} aria-pressed=${countIn[0]} onClick=${function () { countIn[1](!countIn[0]); }}>contar 4 antes</button>
              <button className=${'chip' + (fav ? ' on fav' : '')} aria-pressed=${fav} onClick=${function () { S.toggleFav(card.id); }}>${fav ? '♥ favorita' : '♡ favoritar'}</button>
              <button className="chip" onClick=${function () { A.stop(); playing[1](false); setTimeout(toggle, 40); }}>repetir</button>
            </div>
            <p className="muted small">${card.bpm} BPM sugerido. o som é sintetizado aqui no aparelho e segue exatamente o que está escrito.</p>
          </div>` : html`<p className="muted">sorteia uma carta pra ver a partitura, ouvir e praticar.</p>`}
          <div className="seg slim" role="tablist" aria-label="Ver">
            <button role="tab" aria-selected=${view[0] === 'carta'} className=${view[0] === 'carta' ? 'on' : ''} onClick=${function () { view[1]('carta'); }}>carta</button>
            <button role="tab" aria-selected=${view[0] === 'colecao'} className=${view[0] === 'colecao' ? 'on' : ''} onClick=${function () { view[1]('colecao'); }}>coleção (${pool.length})</button>
          </div>
          ${view[0] === 'colecao' ? html`<ul className="collection">${pool.map(function (c) {
            var seen = S.get().seen[c.id];
            return html`<li key=${c.id}><button className=${(c.id === cardId ? 'cur ' : '') + (seen ? 'seen' : '')} onClick=${function () { open(c.id); }}>
              <span>${c.deck === 'figuras' ? M.rhythmTitle(c) : cardTitle(c)}</span><small>${LV[c.level]}${S.isFav(c.id) ? ' · ♥' : ''}${seen ? ' · vista' : ''}</small></button></li>`;
          })}</ul>` : null}
        </aside>
      </div>
    </main>`;
  }

  /* ---------- memória de groove ---------- */
  function Face(p) {
    var f = p.face; var ref = useRef(null);
    useEffect(function () {
      if (!ref.current) return;
      if (f.type === 'figure') R.figure(ref.current, f.v); else if (f.type === 'rest') R.rest(ref.current, f.v); else if (f.type === 'drumnote') R.drumPiece(ref.current, f.v);
    }, [f.type, f.v]);
    if (f.type === 'illus') return html`<span className="mf-illus" dangerouslySetInnerHTML=${{ __html: I.svg(f.v) }}></span>`;
    if (f.type === 'text') return html`<span className="mf-text">${f.tag ? html`<small>${f.tag}</small>` : null}<b>${f.v}</b>${f.sub ? html`<small>${f.sub}</small>` : null}</span>`;
    if (f.type === 'sticking') return html`<span className="mf-stick">${f.v.map(function (s, i) { var acc = s[0] === '>'; return html`<span key=${i} className=${acc ? 'acc' : ''}><i>${acc ? '>' : ''}</i>${acc ? s.slice(1) : s}</span>`; })}</span>`;
    return html`<span className="mf-score" ref=${ref}></span>`;
  }
  function Memory(p) {
    var gS = useState(null); var game = gS[0] ? M.MEMORY.find(function (g) { return g.id === gS[0]; }) : null;
    var lS = useState(1);
    var board = useState(null); var flipped = useState([]); var matched = useState({}); var tries = useState(0);
    var t0 = useState(0); var now = useState(0); var done = useState(null); var lock = useRef(false); var wrong = useState([]);
    useEffect(function () { if (!t0[0] || done[0]) return; var id = setInterval(function () { now[1](Date.now()); }, 250); return function () { clearInterval(id); }; }, [t0[0], done[0]]);
    function start(g, l) { gS[1](g); lS[1](l); board[1](M.dealBoard(M.MEMORY.find(function (x) { return x.id === g; }), l)); flipped[1]([]); matched[1]({}); tries[1](0); t0[1](0); done[1](null); wrong[1]([]); lock.current = false; }
    function flip(c) {
      if (lock.current || matched[0][c.pair] || flipped[0].indexOf(c.key) >= 0) return;
      if (!t0[0]) t0[1](Date.now());
      var f = flipped[0].concat(c.key); flipped[1](f);
      if (f.length < 2) return;
      var a = board[0][f[0]], b = board[0][f[1]]; tries[1](tries[0] + 1); lock.current = true;
      if (a.pair === b.pair && a.side !== b.side) {
        var m = Object.assign({}, matched[0]); m[a.pair] = true;
        setTimeout(function () {
          matched[1](m); flipped[1]([]); lock.current = false; if (S.get().sound) A.feedback(true);
          if (Object.keys(m).length === board[0].length / 2) {
            var time = Math.round((Date.now() - (t0[0] || Date.now())) / 1000); var isNew = S.record(gS[0] + ':' + lS[0], time, tries[0] + 1);
            done[1]({ time: time, tries: tries[0] + 1, isNew: isNew });
          }
        }, 380);
      } else {
        wrong[1](f);
        setTimeout(function () { flipped[1]([]); wrong[1]([]); lock.current = false; if (S.get().sound) A.feedback(false); }, 950);
      }
    }
    var secs = t0[0] ? Math.round(((done[0] ? t0[0] + done[0].time * 1000 : now[0] || Date.now()) - t0[0]) / 1000) : 0;
    var mmss = function (s) { return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    if (!board[0]) {
      return html`<main className="memo">
        <div className="deckhead"><button className="back" onClick=${function () { A.stop(); window.location.href = '../#/kids/cartas'; }}>‹ kids</button><h1><span className="dno">04</span>Memória de Groove</h1></div>
        <p className="lede small">vira duas cartas e acha o par. em alguns jogos o par não é igual: é uma associação musical.</p>
        <div className="seg" role="radiogroup" aria-label="Dificuldade">${[1, 2, 3].map(function (l) { return html`<button key=${l} role="radio" aria-checked=${lS[0] === l} className=${lS[0] === l ? 'on' : ''} onClick=${function () { lS[1](l); }}>${M.MEM_LEVELS[l].name} · ${M.MEM_LEVELS[l].pairs} pares</button>`; })}</div>
        <ul className="games">${M.MEMORY.map(function (g, i) {
          var b = S.best(g.id + ':' + lS[0]);
          return html`<li key=${g.id}><button className="game" onClick=${function () { start(g.id, lS[0]); }}>
            <span className="g-no">${String(i + 1).padStart(2, '0')}</span><b>${g.name}</b><small>${g.kind} · ${Math.min(M.MEM_LEVELS[lS[0]].pairs, g.pairs.length)} pares</small>
            <em>${b ? 'recorde: ' + b.tries + ' tentativas · ' + mmss(b.time) : 'sem recorde ainda'}</em></button></li>`;
        })}</ul>
        ${game ? null : null}
      </main>`;
    }
    var n = board[0].length; var cols = n <= 8 ? 4 : n <= 12 ? 4 : 4;
    return html`<main className="memo playing">
      <div className="deckhead">
        <button className="back" onClick=${function () { board[1](null); }}>‹ jogos</button>
        <h1><span className="dno">${String(M.MEMORY.indexOf(game) + 1).padStart(2, '0')}</span>${game.name}</h1>
        <div className="hud" aria-live="polite"><span><b>${tries[0]}</b> tentativas</span><span><b>${mmss(secs)}</b></span><span><b>${Object.keys(matched[0]).length}/${n / 2}</b> pares</span></div>
      </div>
      <p className="muted small center">${game.kind}${game.id === 'pecas' ? ' · legenda: bumbo 1º espaço · surdo 2º espaço · caixa 3º espaço · tom 1 4º espaço · ride na 5ª linha (x) · chimbal acima da pauta (x; + fechado, o aberto) · crash na linha suplementar (x)' : ''}</p>
      <div className=${'board n' + n} style=${{ '--cols': cols }}>
        ${board[0].map(function (c) {
          var up = flipped[0].indexOf(c.key) >= 0 || matched[0][c.pair]; var isWrong = wrong[0].indexOf(c.key) >= 0;
          return html`<button key=${c.key} className=${'mcard' + (up ? ' up' : '') + (matched[0][c.pair] ? ' ok' : '') + (isWrong ? ' no' : '')} onClick=${function () { flip(c); }}
              aria-label=${up ? 'carta virada para cima' : 'carta virada para baixo'} aria-pressed=${up}>
            <span className="mc-in">
              <span className="mc-back" aria-hidden="true"><span>cartas de<b>GROOVE</b></span></span>
              <span className="mc-front" aria-hidden=${!up}><${Face} face=${c.face}/></span>
            </span></button>`;
        })}
      </div>
      <div className="memo-actions"><button className="chip" onClick=${function () { start(gS[0], lS[0]); }}>embaralhar de novo</button></div>
      ${done[0] ? html`<div className="win" role="dialog" aria-label="Fim de jogo">
        <div className="win-card"><${Doodle} k="star" fill=${true} className="win-star"/><h2>${done[0].isNew ? 'recorde!' : 'completou!'}</h2>
          <p><b>${done[0].tries}</b> tentativas · <b>${mmss(done[0].time)}</b></p>
          <p className="muted small">melhor neste nível: ${(function () { var b = S.best(gS[0] + ':' + lS[0]); return b.tries + ' tentativas · ' + mmss(b.time); })()}</p>
          <div className="row"><button className="chip on" onClick=${function () { start(gS[0], lS[0]); }}>jogar de novo</button><button className="chip" onClick=${function () { board[1](null); }}>outro jogo</button></div>
        </div></div>` : null}
    </main>`;
  }

  /* ---------- app ---------- */
  var ROUTES = ['home', 'leitura', 'figuras', 'rockpop', 'rudimentos', 'memoria'];
  function App() {
    var init = (location.hash || '').slice(1); var r = useState(ROUTES.indexOf(init) >= 0 ? init : 'home'); var cid = useState(null); var turn = useState(0);
    useEffect(function () { return S.subscribe(function () { turn[1](function (x) { return x + 1; }); }); }, []);
    function go(to, cardId) { A.stop(); r[1](to); cid[1](cardId || null); try { history.replaceState(null, '', to === 'home' ? location.pathname : '#' + to); } catch (e) { /* o visualizador não deixa mudar o endereço */ } window.scrollTo(0, 0); }
    var page = r[0] === 'home' || r[0] === 'leitura' ? html`<${Home} go=${go} mode=${r[0]}/>` : r[0] === 'memoria' ? html`<${Memory} go=${go}/>` : html`<${Deck} deck=${r[0]} cardId=${cid[0]} go=${go} key=${r[0] + (cid[0] || '')}/>`;
    return html`<div className=${'app route-' + r[0]}><${TopBar} go=${go}/><div className="page" key=${r[0]}>${page}</div>
      <footer className="sitefoot"><span>Cartas de Groove</span><span>Beaterista — Escola de Música</span><span>progresso salvo só neste aparelho</span></footer></div>`;
  }

  window.CGApp = { App: App, CardFace: CardFace, Doodle: Doodle, Tape: Tape, html: html };
  if (!/^#print-/.test(location.hash)) ReactDOM.createRoot(document.getElementById('root')).render(html`<${App}/>`);
})();
