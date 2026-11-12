// Uno Musical: tela, animações e som. Regras em cartas-logic.js, figuras em cartas-simbolos.js, efeitos em cartas-sfx.js.
// As figuras rítmicas são só categorias de associação (cor ou figura). Nenhuma nota musical é tocada.
import { h } from '../util.js';
import { confirmSheet } from '../ui.js';
import * as C from './cartas-logic.js';
import { SYMS, SYM_NAME, SYM_SHORT, SYM_LEARN, symbolEl, actionEl } from './cartas-simbolos.js';
import { getGame, setGame, soundOn, setSound, reduced } from './base.js';
import * as S from './cartas-sfx.js';
import { lobby, linkBadge, salaAutoPara } from './online.js';
import { bq } from './bonequinhos.js';
const MESA = { vitoria: (j, n) => import('../figurinhas/mesa.js').then((M) => M.vitoria(j, n)).catch(() => 0) }; // carrega só quando alguém ganha (mantém o jogo testável fora do navegador)

const ID = 'cartas';
const NS = 'http://www.w3.org/2000/svg';
const NAMES = ['paul', 'lia', 'teo']; // adversários controlados pelo computador
const hash = (s) => [...String(s)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
const KIND_ORDER = ['pular', 'inverter', 'mais2', 'curinga', 'mais4'];
const sortKey = (c) => (c.color ? C.COLORS.indexOf(c.color) * 100 : 400) + (c.kind === 'fig' ? SYMS.indexOf(c.sym) : 20 + KIND_ORDER.indexOf(c.kind));
const sortHand = (hand) => hand.slice().sort((a, b) => sortKey(a) - sortKey(b));

const svgIcon = (inner, cls, vb = '0 0 24 24') => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', vb); s.setAttribute('class', cls); s.setAttribute('aria-hidden', 'true'); s.innerHTML = inner; return s; };
const ICON = {
  on: '<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  off: '<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  help: '<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.4a2.9 2.9 0 115 1.9c-1 .9-2 1.3-2 2.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12.2" cy="17.3" r="1.2" fill="currentColor"/>',
  dir: '<path d="M5 12a7 7 0 0112-4.9M19 12a7 7 0 01-12 4.9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M17.4 3.5v4.2h-4.2M6.6 20.5v-4.2h4.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
};

/* ---------- cartas ---------- */
function bigOf(c) {
  if (c.kind === 'fig') return symbolEl(c.sym, 'cx-sym');
  if (c.kind === 'mais2') return h('b', { class: 'cx-plus' }, '+2');
  if (c.kind === 'mais4') return h('span', { class: 'cx-p4' }, actionEl('mais4', 'cx-sym'), h('b', { class: 'cx-plus s' }, '+4'));
  return actionEl(c.kind, 'cx-sym');
}
function miniOf(c) {
  if (c.kind === 'fig') return symbolEl(c.sym, 'cx-mini');
  if (c.kind === 'mais2' || c.kind === 'mais4') return h('b', {}, c.kind === 'mais2' ? '+2' : '+4');
  return actionEl(c.kind, 'cx-mini');
}
/** Carta virada pra cima: cantos pequenos, figura grande e centralizada num oval branco. */
export function cardEl(c) {
  return h('span', { class: `cx-card c-${c.color || 'curinga'}${c.kind === 'fig' ? '' : ' act'}`, 'data-id': c.id, 'aria-hidden': 'true' },
    h('i', { class: 'cx-co tl' }, miniOf(c)), h('span', { class: 'cx-oval' }, bigOf(c)), c.kind === 'fig' ? h('b', { class: 'cx-lbl' }, SYM_SHORT[c.sym]) : null, h('i', { class: 'cx-co br' }, miniOf(c)));
}
export const backEl = () => h('span', { class: 'cx-card back', 'aria-hidden': 'true' }, h('span', { class: 'cx-oval' }, symbolEl('colcheia', 'cx-sym')));

export function mount(host, opts) {
  // Modo Aventura (opts.mission): partida contra UM computador montada pelos params da missão, sem ler nem gravar o Modo Livre.
  const adv = opts && opts.mission ? opts : null; const mp = adv ? (adv.mission.params || {}) : {};
  const UN = !!(opts && opts.un) && !adv; // UN🚫: variante com regras próprias (cartas iguais juntas, UNO silencioso, +2/+4 acumulam)
  const ID = UN ? 'un' : 'cartas'; const TITLE = UN ? 'UN🚫' : 'Uno Musical';
  const rnd = adv ? C.seededRnd(mp.seed) : Math.random; const stats = C.newStats(); let reported = false;
  const NAMES = adv ? [String(mp.oppName || 'Paul').toLowerCase()] : ['paul', 'lia', 'teo']; // sombra do nome do módulo: na aventura o adversário tem o nome do estilo
  let gone = false; let busy = false; let cpuTimer = 0;
  const timers = new Set(); const anims = new Set();
  const saved = adv ? {} : getGame(ID);
  const prefs = adv ? { mode: 'paul', opps: 1, hint: mp.hint === false ? 'sem' : 'com', help: true, sfx: true } : {
    mode: ['paul', 'local', 'online'].includes(saved.mode) ? saved.mode : 'paul', opps: [1, 2, 3].includes(saved.opps) ? saved.opps : 1,
    hint: 'com', help: true, sfx: saved.sfx !== false, learn: false, names: true, // sempre jogo normal (nunca pausa), as cartas que servem sempre brilham e o nome da figura sempre aparece: // o nome da figura aparece sempre em todas as cartas
  };
  if (!adv && salaAutoPara(ID)) prefs.mode = 'online'; // veio de "tenho um código de sala"
  const dica = () => !UN && prefs.hint !== 'sem'; // com dica: cartas que servem ficam destacadas
  const rec = () => ({ w: 0, l: 0, e: 0, ...(saved.rec || {}) });
  let dup = null; let settleT = 0; let g = null; let hidden = false; let picking = null; let recorded = false; let viewer = 0; let queued = null; let flashT = 0;
  let conn = null; let lob = null; const badge = linkBadge();
  let stage = null; let handEl = null; let deckEl = null; let pileEl = null; let tip = null; let tipT = 0; let ro = null; let lastW = 0;
  const root = h('div', { class: 'jg jg-cartas cx' }); host.replaceChildren(root); root.classList.toggle('cx-names', !!prefs.names);

  /* ----- utilidades ----- */
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!gone) fn(); }, ms); timers.add(id); return id; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers.clear(); clearTimeout(cpuTimer); cpuTimer = 0; };
  const snd = (kind, n) => { S.setOn(prefs.sfx && soundOn()); S.play(kind, n); };
  const fast = () => reduced();
  const me0 = () => (conn ? conn.me : 0);
  const meIdx = () => (!g ? 0 : g.mode === 'paul' ? 0 : g.mode === 'online' ? me0() : viewer);
  const isCpu = (p) => g && g.mode === 'paul' && p !== 0;
  const PL = (p) => (g.mode === 'paul' ? (p === 0 ? 'você' : NAMES[p - 1]) : g.mode === 'online' ? (p === me0() ? 'você' : 'o outro') : `jogador ${p + 1}`);
  const human = () => !!g && !g.over && !busy && !hidden && g.turn === meIdx() && !(g.mode === 'local' && g.turn !== viewer);
  const persist = () => { if (adv || (g && g.mode === 'online')) return; setGame(ID, { ...prefs, game: g && !g.over ? g : null, rec: saved.rec }); };
  const leave = () => { if (conn) { conn.close(); conn = null; } if (lob) { lob.close(); lob = null; } };
  const keepPrefs = () => { if (!adv) setGame(ID, { ...prefs }); };

  function anim(el, frames, opts) {
    if (!el || fast() || !el.animate) return null;
    const a = el.animate(frames, { fill: 'backwards', easing: 'cubic-bezier(.22,.8,.24,1)', ...opts });
    anims.add(a); const done = () => anims.delete(a); a.finished.then(done, done); return a;
  }
  const rel = (el) => {
    const s = stage.getBoundingClientRect(); const r = el.getBoundingClientRect();
    return { x: r.left - s.left, y: r.top - s.top, w: el.offsetWidth || r.width, h: el.offsetHeight || r.height, cx: r.left - s.left + r.width / 2, cy: r.top - s.top + r.height / 2 };
  };
  /** Anima um elemento que já está no destino, como se viesse de `from` (retângulo relativo à mesa). */
  function flipFrom(el, from, { rot = 0, delay = 0, dur = 380 } = {}) {
    if (!el || !from || !stage) return;
    const to = rel(el); if (!to.w) return;
    anim(el, [{ translate: `${from.cx - to.cx}px ${from.cy - to.cy}px`, scale: from.w / to.w, rotate: `${rot}deg` }, { translate: '0px 0px', scale: 1, rotate: '0deg' }], { duration: dur, delay });
  }
  /** Carta voadora (cópia) que sai de `from`, chega em `to` e some. */
  function fly(from, to, { card = null, delay = 0, dur = 380, rot = 0 } = {}) {
    if (fast() || !stage) return;
    const el = card ? cardEl(card) : backEl(); el.classList.add('cx-fly'); el.style.setProperty('--cw', `${to.w}px`);
    el.style.left = `${to.x}px`; el.style.top = `${to.y}px`; stage.append(el);
    const a = anim(el, [{ translate: `${from.cx - to.cx}px ${from.cy - to.cy}px`, scale: from.w / to.w, rotate: `${rot}deg`, opacity: 1 }, { translate: '0px 0px', scale: 0.9, rotate: '0deg', opacity: 0.2 }], { duration: dur, delay, easing: 'cubic-bezier(.3,.7,.3,1)' });
    if (a) a.finished.then(() => el.remove(), () => el.remove()); else el.remove();
  }
  const seatEl = (p) => (stage && stage.querySelector(`.cx-seat[data-p="${p}"]`)) || null;
  const seatRect = (p) => { const el = p === meIdx() ? handEl : (seatEl(p) && seatEl(p).querySelector('.cx-minis')) || seatEl(p); return el ? rel(el) : null; };
  const deckRect = () => (deckEl ? rel(deckEl.querySelector('.cx-card')) : null);
  function shake(el) { anim(el, [{ translate: '0 0' }, { translate: '-6px 0' }, { translate: '6px 0' }, { translate: '-4px 0' }, { translate: '0 0' }], { duration: 320, easing: 'ease-in-out' }); }

  /* ----- dica de nome (segurar a carta) ----- */
  function showTip(anchor, text, ms = 1700) {
    if (gone || !anchor.isConnected) return; // a carta pode ter saído da mão enquanto o mouse esperava
    if (!tip) { tip = h('div', { class: 'cx-tip', role: 'status' }); root.append(tip); }
    clearTimeout(tipT); tip.textContent = text; tip.classList.add('on');
    const r = anchor.getBoundingClientRect(); const rr = root.getBoundingClientRect();
    const w = tip.offsetWidth; const x = Math.max(4, Math.min(rr.width - w - 4, r.left - rr.left + r.width / 2 - w / 2));
    tip.style.left = `${x}px`; tip.style.top = `${Math.max(2, r.top - rr.top - tip.offsetHeight - 6)}px`;
    tipT = setTimeout(() => { if (tip) tip.classList.remove('on'); }, ms);
  }
  /** Segurar (ou deixar o mouse parado) numa carta mostra o nome da figura sem jogar. `consume()` diz se o toque foi uma "segurada" (e então não joga). */
  function holdable(btn, text) {
    let t = 0; let held = false;
    const clear = () => { clearTimeout(t); t = 0; };
    const arm = (ms) => { clear(); t = setTimeout(() => { held = true; showTip(btn, text, 1800); }, ms); };
    btn.addEventListener('pointerdown', () => { held = false; arm(420); });
    btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { held = false; arm(650); } });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => btn.addEventListener(ev, clear));
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
    return { consume: () => { const was = held; held = false; return was; } };
  }

  /* ----- tela inicial ----- */
  function intro() {
    clearTimers(); busy = false; leave(); g = null; picking = null; stage = null; handEl = null; deckEl = null; pileEl = null; tip = null; S.stopAll();
    const resume = C.validGame(saved.game) && !saved.game.over ? saved.game : null; const r = rec();
    const seg = (name, opts, cur, on) => h('div', { class: 'jg-seg', role: 'radiogroup', 'aria-label': name }, ...opts.map(([v, l, ic]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(cur === v), 'aria-label': ic ? l : null, title: ic ? l : null, class: `${cur === v ? 'on' : ''}${ic ? ' jg-ic' : ''}`, onclick: () => { on(v); intro(); } }, ic ? bq(ic) : l)));
    const legend = h('div', { class: 'cx-legend', role: 'list', 'aria-label': 'as dez figuras das cartas' }, ...SYMS.map((s, i) => {
      const card = cardEl({ id: `lg${i}`, color: C.COLORS[i % 4], kind: 'fig', sym: s });
      const b = h('button', { type: 'button', class: 'cx-leg', role: 'listitem', 'aria-label': SYM_NAME[s], onclick: () => { snd('tap'); showTip(b, SYM_NAME[s], 1500); } }, card, h('small', {}, SYM_NAME[s]));
      return b;
    }));
    root.replaceChildren(...[
      h('h2', { class: 'jg-h hand' }, TITLE),
      h('p', { class: 'jg-p' }, 'jogue a carta da mesma cor ou da mesma figura. reconhecer as figuras é o segredo!'),
      h('p', { class: 'jg-lab' }, 'as 10 figuras (toque pra ver o nome)'), legend,
      h('p', { class: 'jg-lab' }, 'contra quem?'),
      seg('modo', [['paul', 'contra o robô (1 a 3)', 'paul'], ['local', 'no mesmo celular (2 a 4 pessoas)', 'dois'], ['online', '2 celulares (código)', 'celular']], prefs.mode, (v) => { prefs.mode = v; keepPrefs(); }),
      prefs.mode === 'paul' ? h('p', { class: 'jg-lab' }, 'quantos adversários?') : null,
      prefs.mode === 'paul' ? seg('adversários', [[1, '1'], [2, '2'], [3, '3']], prefs.opps, (v) => { prefs.opps = v; keepPrefs(); }) : null,
      prefs.mode === 'local' ? h('p', { class: 'jg-lab' }, 'quantas pessoas?') : null,
      prefs.mode === 'local' ? seg('pessoas', [[2, '2'], [3, '3'], [4, '4']], prefs.opps + 1, (v) => { prefs.opps = v - 1; keepPrefs(); }) : null,
      ...(UN ? [] : [h('details', { class: 'jg-rules' }, h('summary', {}, 'regras rápidas'), h('ul', {},
        h('li', {}, 'cada um começa com 7 cartas. jogue uma carta da mesma cor ou da mesma figura da carta da mesa.'),
        h('li', {}, 'tem carta que serve? tem que jogar. não tem? compre uma: se servir, jogue ou passe; se não servir, passa sozinho.'),
        h('li', {}, 'pular: o próximo perde a vez. inverter: muda o sentido (com 2 jogadores, vale como pular). +2: o próximo compra 2 e perde a vez.'),
        h('li', {}, 'curinga muda a cor. curinga +4: muda a cor e o próximo compra 4 e perde a vez, mas só vale se você não tiver a cor da mesa.'),
        h('li', {}, 'ficou com uma carta? aperte UNO! contra o computador, esquecer custa 2 cartas.'),
        h('li', {}, 'dica: segure uma carta (ou deixe o mouse parado nela) pra ver o nome da figura sem jogar.')))]),
      ...(UN ? [h('details', { class: 'jg-rules', open: true }, h('summary', {}, 'regras do UN🚫'), h('ul', {},
        h('li', {}, 'cartas iguais (mesma cor e mesma figura) podem ser jogadas juntas.'),
        h('li', {}, 'sem carta que sirva? compre até achar uma que dá pra jogar.'),
        h('li', {}, 'o +2 acumula com outro +2 e o +4 com outro +4: quem recebe responde com o mesmo ou compra tudo e perde a vez. o +4 sai quando você quiser.'),
        h('li', {}, 'ficou com uma carta? aperte UNO. ninguém avisa: se você esquecer e outro apertar “pegou!” antes da próxima jogada, você compra 2. mas se acusar sem ninguém ter esquecido, quem acusou compra 2.'),
        h('li', {}, 'nada brilha: você descobre quais cartas servem.')))] : []),
      prefs.mode === 'online' ? (lob = lobby({ jogo: ID, makeState: () => C.newGame({ mode: 'online', un: UN }), onStart: startOnline })).el
        : h('div', { class: 'jg-actions' }, resume ? h('button', { class: 'btn primary', type: 'button', onclick: () => begin(resume, true) }, 'continuar partida') : null,
          h('button', { class: resume ? 'btn' : 'btn primary', type: 'button', onclick: () => begin(C.newGame({ mode: prefs.mode, players: prefs.opps + 1, un: UN })) }, resume ? 'nova partida' : 'iniciar')),
      r.w + r.l + r.e ? h('p', { class: 'jg-p muted' }, `contra o computador: ${r.w} vitória${r.w === 1 ? '' : 's'} · ${r.l} derrota${r.l === 1 ? '' : 's'} · ${r.e} empate${r.e === 1 ? '' : 's'}`) : null,
    ].filter(Boolean));
  }

  function startOnline(c, state) {
    conn = c; lob = null; badge.set(true);
    c.on.link = (v) => badge.set(v);
    c.on.state = (st) => incoming(st);
    begin(state);
  }
  /** estado novo vindo do outro celular */
  function incoming(st) {
    if (gone || !g) return;
    if (busy) { queued = st; return; }
    const prev = g; picking = null; hidden = false;
    if (st.ev && st.ev.t === 'start') { begin(st); return; } // partida nova do outro celular
    g = st;
    if (!st.over && st.seq !== prev.seq) runEvent(prev, null);
    else { paint(); if (st.over) finishUp(); }
  }
  /** manda a jogada pro outro celular (só no modo 2 celulares) */
  function sync() { if (conn && g.mode === 'online') conn.push(g).then((ok) => { if (!ok && !gone) flash('o outro celular jogou ao mesmo tempo, veja a mesa'); }); }
  function again() { const ng = C.newGame({ mode: prefs.mode, players: prefs.opps + 1, un: UN }); if (prefs.mode === 'online') { begin(ng); sync(); } else begin(ng); }

  /* ----- começo de partida: embaralhar e distribuir ----- */
  function begin(game, resume = false) {
    clearTimers(); S.stopAll(); g = game; recorded = false; picking = null; queued = null; viewer = g.mode === 'local' ? g.turn : 0; hidden = false;
    if (resume) { busy = false; if (g.mode === 'local') hidden = true; paint(); afterTurn(); return; }
    busy = true; paint({ pre: true }); persist();
    const pre = fast() ? 120 : 850;
    if (!fast()) { shuffleAnim(); snd('shuffle'); }
    later(() => {
      if (g.mode === 'local') { busy = false; hidden = true; paint(); return; } // 2 jogadores no aparelho: ninguém vê a mão do outro
      stage.classList.remove('cx-pre'); const ms = dealAnim();
      later(() => { busy = false; paint(); if (queued) { const q = queued; queued = null; incoming(q); } else afterTurn(); }, ms);
    }, pre);
  }
  function shuffleAnim() {
    const d = deckRect(); if (!d) return;
    for (let i = 0; i < 8; i++) {
      const el = backEl(); el.classList.add('cx-fly'); el.style.setProperty('--cw', `${d.w}px`); el.style.left = `${d.x}px`; el.style.top = `${d.y}px`; stage.append(el);
      const dir = i % 2 ? 1 : -1; const away = d.w * (0.95 + (i % 4) * 0.12);
      const a = anim(el, [{ translate: '0 0', rotate: '0deg' }, { translate: `${dir * away}px ${-6 + (i % 3) * 5}px`, rotate: `${dir * 9}deg`, offset: 0.42 }, { translate: `${dir * d.w * 0.25}px 0`, rotate: `${-dir * 3}deg`, offset: 0.75 }, { translate: '0 0', rotate: '0deg' }], { duration: 760, delay: i * 30, easing: 'ease-in-out' });
      if (a) a.finished.then(() => el.remove(), () => el.remove()); else el.remove();
    }
  }
  function dealAnim() {
    const d = deckRect(); if (!d) return 0;
    const me = meIdx(); const step = g.n >= 3 ? 52 : 70; const mine = [...handEl.querySelectorAll('.cx-hc')];
    for (let r = 0; r < C.HAND; r++) {
      for (let p = 0; p < g.n; p++) {
        const idx = r * g.n + p; const target = p === me ? mine[r] : (seatEl(p) ? seatEl(p).querySelectorAll('.cx-mb')[r] : null);
        flipFrom(target, d, { delay: idx * step, dur: 380 });
        if (idx % 3 === 0) later(() => snd('draw'), idx * step);
      }
    }
    return C.HAND * g.n * step + 460;
  }

  /* ----- desenho da mesa ----- */
  function seat(p) {
    const k = g.hands[p].length; const minis = Math.min(k, 7); const cpu = isCpu(p); // no UN🚫 o número de cartas aparece, mas ninguém avisa quando alguém fica com UNO
    const on = !g.over && g.turn === p;
    return h('div', { class: `cx-seat${on ? ' on' : ''}${!UN && g.unoSaid === p && k === 1 ? ' uno' : ''}`, 'data-p': p, 'aria-label': `${PL(p)}: ${k} carta${k === 1 ? '' : 's'}${on ? ', jogando' : ''}` },
      h('span', { class: 'cx-minis', 'aria-hidden': 'true' }, ...Array.from({ length: minis }, () => h('i', { class: 'cx-mb' }))),
      h('span', { class: 'cx-sname' }, h('b', {}, g.mode === 'paul' ? NAMES[p - 1] : PL(p)), h('em', {}, String(k))),
      h('span', { class: 'cx-sstate' }, !UN && g.unoSaid === p && k === 1 ? 'UNO!' : on ? (cpu ? 'pensando…' : 'jogando') : ''));
  }
  function paint(opt = {}) {
    if (!g) return;
    const me = meIdx(); const opps = Array.from({ length: g.n - 1 }, (_, i) => (me + 1 + i) % g.n);
    const top = C.topOf(g); const canMove = human();
    const legal = new Set(canMove && dica() ? C.legalCards(g, me).map((c) => c.id) : []);
    const mine = hidden ? [] : sortHand(g.hands[me]);
    const turnTxt = g.over ? '' : g.mode === 'paul' ? (g.turn === 0 ? 'sua vez' : `vez do ${NAMES[g.turn - 1]}`) : g.mode === 'online' ? (g.turn === me ? 'sua vez' : 'vez do outro celular…') : `vez do ${PL(g.turn)}`;
    const canD = canMove && C.canDraw(g); const canP = canMove && C.canPass(g);
    const under = [...g.discard].slice(-4, -1); // cartas de baixo (só enfeite)
    const prevTurn = stage ? stage.dataset.turn : ''; const turnChanged = String(prevTurn) !== String(g.turn);
    const wasPre = opt.pre || (stage && stage.classList.contains('cx-pre') && opt.keepPre);
    deckEl = h('button', { type: 'button', class: `cx-deck${canD && dica() ? ' fit' : ''}`, disabled: !human() || undefined, 'aria-label': `comprar uma carta (restam ${C.available(g)})`, onclick: draw1 },
      h('span', { class: 'cx-stack' }, backEl(), backEl(), backEl()), h('small', {}, g.pend ? `comprar ${g.pend.n}` : `comprar · ${C.available(g)}`));
    pileEl = h('div', { class: 'cx-pile', role: 'img', 'aria-label': `mesa: ${C.cardName(top)}. cor ativa: ${C.COLOR_NAME[g.color]}`, style: { '--ac': `var(--k-${g.color})` } },
      ...under.map((c) => { const e = cardEl(c); e.style.transform = `rotate(${(hash(c.id) % 41) - 20}deg)`; return e; }),
      (() => { const e = cardEl(top); e.classList.add('top'); e.style.transform = `rotate(${(hash(top.id) % 17) - 8}deg)`; return e; })());
    handEl = h('div', { class: 'cx-hand', role: 'group', 'aria-label': hidden ? 'mão oculta' : 'sua mão' },
      ...mine.map((c) => {
        const ok = legal.has(c.id);
        let hold = null;
        const b = h('button', { type: 'button', class: `cx-hc${ok ? ' fit' : ''}${picking === c.id ? ' sel' : ''}${canMove ? '' : ' off'}`, 'data-id': c.id, 'aria-label': C.cardName(c) + (ok ? ', pode jogar' : ''), onclick: () => { if (hold && hold.consume()) return; pick(c); } }, cardEl(c));
        hold = holdable(b, C.cardName(c)); return b;
      }));
    const mustUno = !hidden && C.mustUno(g, me);
    const dupEl = () => (dup && !hidden ? h('div', { class: 'cx-pick', role: 'group', 'aria-label': 'jogar cartas iguais' }, h('b', {}, 'você tem duas iguais'),
      h('div', { class: 'cx-pick-row' }, h('button', { type: 'button', class: 'btn small', onclick: () => humanPlay(dup.id) }, 'só esta'), h('button', { type: 'button', class: 'btn small primary', onclick: () => humanMany(dup.ids) }, 'as duas juntas')),
      h('button', { type: 'button', class: 'btn small ghost', onclick: () => { dup = null; paint(); } }, 'cancelar')) : null);
    const pickEl = picking ? h('div', { class: 'cx-pick', role: 'group', 'aria-label': 'escolha a cor' }, h('b', {}, 'escolha a cor'),
      h('div', { class: 'cx-pick-row' }, ...C.COLORS.map((k) => h('button', { type: 'button', class: `cx-pc c-${k}`, onclick: () => humanPlay(picking, k) }, h('span', { class: 'cx-dot' }), C.COLOR_NAME[k]))),
      h('button', { type: 'button', class: 'btn small ghost', onclick: () => { picking = null; paint(); } }, 'cancelar')) : null;
    stage = h('div', { class: `cx-stage${wasPre ? ' cx-pre' : ''}${busy ? ' cx-busy' : ''}`, 'data-turn': String(g.turn) },
      h('div', { class: 'cx-board' },
        h('div', { class: `cx-opps n${opps.length}` }, ...opps.map(seat)),
        h('div', { class: 'cx-table' }, deckEl,
          h('div', { class: 'cx-mid' }, pileEl,
            prefs.help ? h('p', { class: 'cx-name', 'aria-live': 'polite' }, C.cardName(top)) : null),
          h('div', { class: 'cx-side' },
            h('div', { class: `cx-ac c-${g.color}`, 'aria-label': `cor ativa: ${C.COLOR_NAME[g.color]}` }, h('span', { class: 'cx-dot' }), h('b', {}, C.COLOR_NAME[g.color])),
            svgIcon(ICON.dir, `cx-dir${g.dir === -1 ? ' rev' : ''}`), toolbar(),
            UN ? h('button', { class: 'cx-uno sm', type: 'button', disabled: hidden || undefined, onclick: uno }, 'UNO') : (mustUno ? h('button', { class: 'cx-uno sm', type: 'button', onclick: uno }, 'UNO!') : null))),
        h('p', { class: 'cx-msg', 'aria-live': 'polite' }, g.over ? '' : msgFor(g.ev))),
      adv ? h('p', { class: 'jg-p muted cx-advinfo', role: 'status', style: 'font-size:12px;margin:2px 0;text-align:center' }, `adversário: ${mp.oppName || 'Paul'} · rodada ${Math.max(1, stats.rounds)} · compras ${stats.draws} · especiais jogadas ${stats.specials}`) : null,
      h('div', { class: 'cx-me' },
        h('p', { class: `cx-turn${g.over ? '' : ' on'}${turnChanged ? ' pop' : ''}${g.turn === me && !g.over ? ' mine' : ''}`, 'aria-live': 'polite' }, hidden ? '' : turnTxt),
        h('div', { class: 'cx-btns' },
          h('button', { class: 'btn small', type: 'button', disabled: !canP || undefined, onclick: pass1 }, 'passar'),
          UN ? h('button', { class: 'btn small', type: 'button', disabled: hidden || !human() || undefined, onclick: pegou }, 'pegou!') : null)),
      handEl, pickEl, dupEl(),
      !g.over && g.mode === 'local' && hidden ? h('div', { class: 'cx-cover', role: 'dialog', 'aria-label': 'passe o aparelho' },
        h('p', { class: 'hand' }, `passe o aparelho para o ${PL(g.turn)}`), h('p', { class: 'muted' }, 'as cartas estão escondidas'),
        h('button', { class: 'btn primary', type: 'button', onclick: () => { hidden = false; viewer = g.turn; snd('flip'); paint(); } }, `sou o ${PL(g.turn)}, mostrar minha mão`)) : null,
      g.over && !busy ? result() : null);
    root.replaceChildren(...[g.mode === 'online' ? badge.el : null, stage].filter(Boolean));
    if (tip) root.append(tip);
    observe(); layoutHand();
    const cv = root.querySelector('.cx-cover button'); if (cv) cv.focus();
  }
  function toolbar() {
    const sOn = prefs.sfx && soundOn();
    return h('div', { class: 'cx-tools' },
      h('button', { type: 'button', class: `cx-tb${prefs.help ? ' on' : ''}`, 'aria-pressed': String(prefs.help), 'aria-label': 'ajuda: mostrar o nome da carta da mesa', title: 'ajuda dos nomes', onclick: () => { prefs.help = !prefs.help; keepPrefs(); snd('tap'); paint(); } }, svgIcon(ICON.help, 'cx-ti')),
      h('button', { type: 'button', class: `cx-tb${sOn ? ' on' : ''}`, 'aria-pressed': String(sOn), 'aria-label': sOn ? 'desligar efeitos sonoros' : 'ligar efeitos sonoros', title: sOn ? 'som ligado' : 'som desligado', onclick: toggleSfx }, svgIcon(sOn ? ICON.on : ICON.off, 'cx-ti')));
  }
  function toggleSfx() {
    const now = prefs.sfx && soundOn();
    if (now) { prefs.sfx = false; S.setOn(false); } else { prefs.sfx = true; if (!soundOn() && !adv) { setSound(true); const b = document.querySelector('.jg-snd'); if (b) { b.textContent = '🔊'; b.setAttribute('aria-pressed', 'true'); b.setAttribute('aria-label', 'desligar som'); } } S.setOn(true); }
    keepPrefs(); if (prefs.sfx) snd('tap'); paint();
  }

  /** leque adaptável: cabe sempre na largura; com muitas cartas vira duas fileiras */
  function layoutHand() {
    if (!handEl) return;
    const cards = [...handEl.querySelectorAll('.cx-hc')]; const n = cards.length;
    if (!n) { handEl.style.height = '0px'; return; }
    const pad = 14; const W = Math.max(0, handEl.clientWidth - pad * 2); const cw = cards[0].offsetWidth; const ch = cards[0].offsetHeight;
    lastW = handEl.clientWidth; if (!cw) return;
    let rows = 1; let per = n;
    if (n > 1 && (W - cw) / (n - 1) < Math.max(24, cw * 0.36)) { rows = 2; per = Math.ceil(n / 2); }
    const rowDy = ch * 0.52;
    cards.forEach((c, i) => {
      const row = rows === 2 && i >= per ? 1 : 0; const k = row ? i - per : i; const m = rows === 2 ? (row ? n - per : per) : n;
      const step = m > 1 ? Math.min(cw * 0.8, (W - cw) / (m - 1)) : 0; const x0 = pad + (W - (cw + step * (m - 1))) / 2;
      const d = k - (m - 1) / 2; const rot = m > 1 ? d * Math.min(3.6, 20 / (m - 1)) : 0; const arc = Math.min(18, d * d * (rows === 2 ? 0.5 : 0.8));
      c.style.setProperty('--x', `${Math.round(x0 + step * k)}px`); c.style.setProperty('--y', `${Math.round(26 + row * rowDy + arc)}px`); c.style.setProperty('--r', `${rot.toFixed(2)}deg`);
      c.style.zIndex = String(10 + k + row * 40);
    });
    handEl.style.height = `${Math.round(ch + 26 + (rows - 1) * rowDy + 22)}px`;
  }
  function observe() {
    if (!ro && typeof ResizeObserver === 'function') { ro = new ResizeObserver(() => { if (handEl && handEl.clientWidth !== lastW) layoutHand(); }); ro.observe(root); }
  }

  function msgFor(ev) {
    if (!ev || !g) return '';
    const top = C.topOf(g);
    if (ev.t === 'play') {
      const who = PL(ev.by); const card = C.cardName(top);
      if (ev.kind === 'pular') return `${who}: ${card}. ${PL(ev.victim)} perde a vez`;
      if (ev.kind === 'inverter') return g.n === 2 ? `${who}: inverter. ${PL(ev.victim)} perde a vez` : `${who}: inverter. o sentido mudou`;
      if (ev.pend) return `${who}: ${ev.kind === 'mais2' ? '+2' : '+4'} acumulado (${ev.pend}). ${PL(ev.victim)}: jogue outro ${ev.kind === 'mais2' ? '+2' : '+4'} ou compre ${ev.pend}`;
      if (ev.kind === 'mais2' || ev.kind === 'mais4') return `${who}: ${ev.kind === 'mais2' ? '+2' : '+4'}. ${PL(ev.victim)} compra ${ev.n} e perde a vez`;
      if (ev.kind === 'curinga') return `${who}: curinga. a cor agora é ${C.COLOR_NAME[g.color]}`;
      return ev.many > 1 ? `${who} jogou ${ev.many} cartas iguais: ${card}` : `${who} jogou ${card}`;
    }
    if (ev.t === 'draw' && ev.pend) return `${PL(ev.by)} comprou ${ev.n} e perdeu a vez`;
    if (ev.t === 'draw' && UN && ev.n > 1) return ev.fits && ev.by === meIdx() && g.mode !== 'local' ? `você comprou ${ev.n} até achar uma que serve: jogue ou passe` : `${PL(ev.by)} comprou ${ev.n} cartas${ev.fits ? ' até achar uma que serve' : ' e passou'}`;
    if (ev.t === 'draw') return ev.fits && ev.by === meIdx() && g.mode !== 'local' ? 'a carta comprada serve: jogue ou passe' : ev.fits ? `${PL(ev.by)} comprou uma carta que serve` : `${PL(ev.by)} comprou uma carta e passou`;
    if (ev.t === 'pass') return `${PL(ev.by)} passou`;
    if (ev.t === 'uno') return UN ? '' : `${PL(ev.by)}: UNO!`; // no UN🚫 ninguém avisa
    if (ev.t === 'wrong') return `${PL(ev.by)} acusou sem ninguém ter esquecido o UNO e comprou ${ev.n}`;
    if (ev.t === 'catch') return `${PL(ev.by)} esqueceu o UNO e comprou ${ev.n}`;
    return '';
  }
  function flash(text, ms = 1800) {
    const m = root.querySelector('.cx-msg'); if (!m) return; clearTimeout(flashT); m.textContent = text; m.classList.add('bad');
    flashT = setTimeout(() => { const m2 = root.querySelector('.cx-msg'); if (m2 && g) { m2.classList.remove('bad'); m2.textContent = g.over ? '' : msgFor(g.ev); } }, ms);
  }

  /* ----- jogadas ----- */
  function pick(c) {
    if (!human()) return;
    const legal = C.legalCards(g, g.turn);
    if (!legal.some((x) => x.id === c.id)) {
      snd('bad'); const b = handEl.querySelector(`.cx-hc[data-id="${c.id}"]`); if (b) shake(b.firstElementChild);
      flash(g.drawn ? 'só a carta que você comprou pode ser jogada' : c.kind === 'mais4' ? 'o +4 só vale se você não tiver a cor da mesa e ainda sobrarem 2 cartas depois dele' : dica() ? `essa não serve: a mesa é ${C.cardName(C.topOf(g))}` : 'essa carta não serve');
      return;
    }
    if (C.isWild(c)) { picking = c.id; snd('tap'); paint(); return; }
    const tw = UN ? C.twins(g, g.turn, c) : [c];
    if (tw.length >= 2) { dup = { id: c.id, ids: tw.map((x) => x.id) }; snd('tap'); paint(); return; }
    humanPlay(c.id);
  }
  function humanMany(ids) {
    if (!human()) return; const who = g.turn; picking = null; dup = null;
    let next; try { next = C.applyPlayMany(g, who, ids); } catch { flash('jogada inválida'); snd('bad'); paint(); return; }
    commit(next);
  }
  function humanPlay(id, color) {
    if (!human()) return; const who = g.turn; picking = null; dup = null;
    let next; try { next = C.applyPlay(g, who, id, color, rnd); } catch { flash('jogada inválida'); snd('bad'); paint(); return; }
    if (adv) C.track(stats, g, next, { type: 'play', id }, 0);
    commit(next);
  }
  function draw1() {
    if (!human()) { if (g && !g.over && !busy && !hidden && g.turn !== meIdx()) flash('espere a sua vez'); return; }
    if (!C.canDraw(g)) { snd('bad'); flash(g.drawn ? 'jogue a carta comprada ou passe' : UN ? 'não dá pra comprar agora' : 'você tem carta que serve: jogue uma'); return; }
    const nd = C.applyDraw(g, g.turn, rnd); if (adv) C.track(stats, g, nd, { type: 'draw' }, 0);
    commit(nd);
  }
  function pass1() { if (!human() || !C.canPass(g)) return; const np = C.applyPass(g, g.turn); if (adv) C.track(stats, g, np, { type: 'pass' }, 0); commit(np); }
  function uno() { if (gone || !g) return; if (!C.mustUno(g, meIdx())) { if (UN) { snd('tap'); flash('você não precisa de UNO agora', 1200); } return; } commit(C.callUno(g, meIdx()), { fromBusy: true }); }
  /** UN🚫: “pegou!”. Acertou = o outro compra 2; errou = quem acusou compra 2. */
  function pegou() {
    if (gone || !g || !UN || !human() || busy) return; const me = meIdx(); const t = C.catchable(g, me);
    commit(t != null ? C.catchUno(g, t, rnd) : C.wrongCatch(g, me, rnd));
  }

  /** Aplica um estado novo: pinta, anima o que aconteceu e só libera a próxima jogada quando a animação acaba. */
  function commit(next, { fromBusy = false } = {}) {
    if (busy && !fromBusy) return;
    const prev = g; const rects = grab(); g = next; picking = null; busy = true;
    persist(); sync();
    const t0 = C.topOf(prev); const t1 = C.topOf(next);
    if (prefs.learn && !adv && prefs.mode !== 'online' && t1 && t1.kind === 'fig' && (!t0 || t0.id !== t1.id)) aprender(t1, () => { if (!gone) runEvent(prev, rects); });
    else runEvent(prev, rects);
  }
  /** Modo aprender: o jogo PAUSA (busy) e mostra a figura jogada, o nome e o que ela significa, até a pessoa tocar em "entendi". */
  function aprender(c, done) {
    const old = root.querySelector('.cx-learn'); if (old) old.remove();
    const ok = h('button', { type: 'button', class: 'btn primary wide', onclick: () => { box.remove(); done(); } }, 'entendi, continuar');
    const box = h('div', { class: 'cx-learn', role: 'dialog', 'aria-label': `figura jogada: ${SYM_NAME[c.sym]}` },
      h('div', { class: 'cx-learn-in' }, h('p', { class: 'jg-lab' }, 'figura jogada'), h('div', { class: 'cx-learn-card' }, cardEl(c)), h('h3', { class: 'hand' }, c.sym === 'fantasma' ? 'nota fantasma' : c.sym === 'acento' ? 'acento' : SYM_NAME[c.sym]), h('p', {}, SYM_LEARN[c.sym]), ok));
    root.append(box); try { ok.focus(); } catch { /* sem foco */ }
  }
  function grab() {
    const out = { cards: {} }; if (!handEl) return out;
    handEl.querySelectorAll('.cx-hc').forEach((b) => { out.cards[b.dataset.id] = rel(b.firstElementChild); }); return out;
  }
  function runEvent(prev, rects) {
    clearTimeout(flashT); busy = true; if (!rects) rects = { cards: {} };
    paint({ keepPre: false });
    const ms = animateEv(prev, g.ev, rects); const hold = g.mode === 'local' && g.unoPending != null && !g.over ? 1500 : 0;
    clearTimeout(settleT); settleT = later(() => settle(), ms + hold); // um só "acabou" por vez: uma jogada nova (ex.: UNO) assume o lugar da anterior
  }
  /** acabou a animação: libera a mesa e decide o que vem agora */
  function settle() {
    busy = false;
    if (queued) { const q = queued; queued = null; g = q; picking = null; hidden = false; paint(); if (g.over) finishUp(); return; }
    if (g.over) return finishUp();
    if (g.mode === 'local' && g.turn !== viewer) { hidden = true; paint(); return; }
    if (g.mode === 'paul' && g.unoPending > 0 && C.mustUno(g, g.unoPending) && !(UN && Math.random() < 0.3)) { busy = true; paint(); later(() => commit(C.callUno(g, g.unoPending), { fromBusy: true }), 380); return; } // o computador sempre avisa UNO
    paint(); afterTurn();
  }

  function afterTurn() {
    clearTimeout(cpuTimer); cpuTimer = 0;
    if (!g || g.over || gone || busy || document.hidden || !isCpu(g.turn)) return;
    const pending = g.mode === 'paul' && C.mustUno(g, 0);
    cpuTimer = setTimeout(cpuStep, fast() ? 300 : pending ? 2400 : 750 + Math.random() * 450); // com UNO pendente a gente dá tempo de apertar o botão
  }
  function cpuStep() {
    cpuTimer = 0; if (gone || !g || g.over || busy || document.hidden || !isCpu(g.turn)) return;
    const p = g.turn;
    if (C.mustUno(g, 0) && (!UN || Math.random() < 0.85)) { if (adv) stats.caught++; commit(C.catchUno(g, 0, rnd)); return; } // esqueceu o UNO: compra 2
    const mv = adv ? C.aiMove(g, p, mp.style, rnd) : C.paulMove(g, p);
    if (mv.type === 'play') commit(C.applyPlay(g, p, mv.id, mv.color, rnd));
    else if (mv.type === 'draw') commit(C.applyDraw(g, p, rnd));
    else commit(C.applyPass(g, p));
  }

  /* ----- animações e sons de cada acontecimento ----- */
  function pileTop() { return pileEl ? pileEl.querySelector('.cx-card.top') : null; }
  function bigFx(cls, content, ms = 950) {
    if (!stage || fast()) return;
    const el = h('div', { class: `cx-fx ${cls}`, 'aria-hidden': 'true' }, content); stage.append(el); later(() => el.remove(), ms);
  }
  function gain(p, n, delay, dur = 360, step = 120) {
    const d = deckRect(); if (!d) return;
    if (p === meIdx() && handEl) {
      const cards = [...handEl.querySelectorAll('.cx-hc')]; const fresh = cards.filter((b) => g.hands[p].slice(-n).some((c) => c.id === b.dataset.id));
      fresh.forEach((b, i) => flipFrom(b, d, { delay: delay + i * step, dur }));
    } else { const to = seatRect(p); if (to) for (let i = 0; i < n; i++) fly(d, { ...to, w: d.w * 0.7, x: to.cx - d.w * 0.35, y: to.cy - d.h * 0.35, h: d.h * 0.7 }, { delay: delay + i * step, dur }); }
  }
  /** devolve a duração (ms) até a mesa poder receber outra jogada */
  function animateEv(prev, ev, rects) {
    if (!ev) return 0;
    const q = fast() ? 0 : 1; const me = meIdx();
    if (prev && g.shuf !== prev.shuf && !fast()) { shuffleAnim(); later(() => snd('shuffle'), 200); }
    if (ev.t === 'play') {
      const from = ev.by === me && rects.cards[ev.id] ? rects.cards[ev.id] : seatRect(ev.by);
      const sign = hash(ev.id) % 2 ? 1 : -1; const spin = sign * (14 + (hash(ev.id) % 16));
      flipFrom(pileTop(), from, { rot: spin, dur: 400 * q });
      later(() => snd('place'), 260 * q);
      const sp = ev.kind;
      if (sp === 'pular') { later(() => { snd('special'); bigFx('pular', actionEl('pular', 'cx-fxsym')); const s = ev.victim != null ? seatEl(ev.victim) : null; if (s) shake(s); }, 360 * q); return 1050 * q; }
      if (sp === 'inverter') { later(() => { snd('special'); bigFx('inverter', actionEl('inverter', 'cx-fxsym')); const d = stage && stage.querySelector('.cx-dir'); if (d) anim(d, [{ rotate: '0deg', scale: 1.5 }, { rotate: '360deg', scale: 1 }], { duration: 700 }); }, 360 * q); return 1000 * q; }
      if (ev.pend) { later(() => { snd('special'); bigFx(`mais ${sp}`, h('b', {}, `+${ev.pend}`)); const s = seatEl(ev.victim); if (s) shake(s); }, 340 * q); return 1000 * q; }
      if (sp === 'mais2' || sp === 'mais4') {
        later(() => { snd('special'); bigFx(`mais ${sp}`, h('b', {}, sp === 'mais2' ? '+2' : '+4')); const s = seatEl(ev.victim); if (s) shake(s); }, 340 * q);
        if (sp === 'mais4') later(() => bigFx(`ring c-${g.color}`, null, 900), 380 * q);
        later(() => snd('draw', ev.n), 800 * q); gain(ev.victim, ev.n, 780 * q);
        return (780 + ev.n * 120 + 520) * q;
      }
      if (sp === 'curinga') { later(() => { snd('special'); bigFx(`ring c-${g.color}`, null, 900); }, 340 * q); return 950 * q; }
      return 560 * q;
    }
    if (ev.t === 'draw') {
      const k = Math.max(1, ev.n || 1); later(() => snd('draw', k), 40 * q); gain(ev.by, k, 0, 420 * q, 90); return (560 + (k - 1) * 90) * q;
    }
    if (ev.t === 'pass') { snd('tap'); return 320 * q; }
    if (ev.t === 'uno' && UN) return 120 * q; // sem anúncio
    if (ev.t === 'wrong') { later(() => snd('bad'), 0); later(() => snd('draw', ev.n), 200 * q); bigFx('catchfx', h('b', {}, 'acusou errado! +2'), 1200); gain(ev.by, ev.n, 200 * q); return 1300 * q; }
    if (ev.t === 'uno') { snd('uno'); bigFx('unofx', h('b', {}, 'UNO!'), 1100); return 950 * q; }
    if (ev.t === 'catch') { later(() => snd('bad'), 0); later(() => snd('draw', ev.n), 200 * q); bigFx('catchfx', h('b', {}, 'esqueceu o UNO! +2'), 1200); gain(ev.by, ev.n, 200 * q); return 1300 * q; }
    return 300 * q;
  }

  /* ----- fim de partida ----- */
  function finishUp() {
    if (!g || !g.over) return;
    if (!recorded) {
      recorded = true;
      if (adv) { // aventura: nada vai pro Modo Livre; só avisa o resultado real, uma vez
        const w = g.result.winner; hidden = false; paint(); snd(w == null ? 'tie' : w === 0 ? 'win' : 'lose'); if (w === 0) confetti();
        if (!reported) { reported = true; adv.onResult(C.matchResult(g, stats, 0)); }
        return;
      }
      if (g.mode !== 'online' && g.mode === 'paul') { const r = rec(); const w = g.result.winner; if (w === 0) r.w++; else if (w == null) r.e++; else r.l++; saved.rec = r; }
      if (g.mode !== 'online') setGame(ID, { ...prefs, game: null, rec: saved.rec });
      const w = g.result.winner; const mineWin = g.mode === 'paul' ? w === 0 : g.mode === 'online' ? w === me0() : w != null;
      if ((g.mode === 'paul' && w === 0) || (g.mode === 'online' && w === me0())) MESA.vitoria('cartas', 3); // ganhou do computador ou do colega (2 celulares): 3 ★
      hidden = false; paint();
      snd(w == null ? 'tie' : mineWin ? 'win' : 'lose');
      if (mineWin) confetti();
      return;
    }
    hidden = false; paint();
  }
  function confetti() {
    if (!stage) return; const cols = ['#C1122F', '#F2B01E', '#1B4FA0', '#1E8A44', '#fffdf7'];
    if (fast()) return;
    const box = h('div', { class: 'cx-confetti', 'aria-hidden': 'true' }); stage.append(box);
    for (let i = 0; i < 34; i++) {
      const p = h('i', {}); p.style.setProperty('--x', `${Math.round(Math.random() * 100)}%`); p.style.setProperty('--dx', `${Math.round(Math.random() * 120 - 60)}px`);
      p.style.setProperty('--d', `${Math.round(Math.random() * 600)}ms`); p.style.setProperty('--t', `${1500 + Math.round(Math.random() * 1100)}ms`); p.style.setProperty('--r', `${Math.round(Math.random() * 720 - 360)}deg`); p.style.background = cols[i % cols.length];
      box.append(p);
    }
    later(() => box.remove(), 3200);
  }
  function result() {
    const r = g.result; const w = r.winner;
    const title = w == null ? 'empate' : g.mode === 'paul' ? (w === 0 ? 'você venceu!' : `${NAMES[w - 1]} venceu`) : `${PL(w)} venceu!`;
    return h('div', { class: `cx-result${w === 0 && g.mode === 'paul' ? ' win' : ''}`, role: 'status' }, h('h3', { class: 'hand' }, title),
      h('p', {}, w == null ? 'jogo travado com o mesmo número de cartas' : r.reason === 'mao-vazia' ? `${PL(w)} descartou a última carta` : `jogo travado: ${PL(w)} ficou com menos cartas`),
      h('p', { class: 'muted' }, `cartas restantes: ${r.counts.map((n, i) => `${PL(i)} ${n}`).join(' · ')}`),
      adv ? null : h('div', { class: 'jg-actions row' }, h('button', { class: 'btn primary', type: 'button', onclick: again }, 'jogar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: intro }, 'voltar às opções')));
  }

  /* ----- ciclo de vida ----- */
  const onVis = () => { if (document.hidden) { clearTimeout(cpuTimer); cpuTimer = 0; S.stopAll(); } else afterTurn(); };
  document.addEventListener('visibilitychange', onVis);
  // sem zoom por duplo toque: dois toques rápidos seguidos na mesa não viram zoom
  let lastTouch = 0;
  const noZoom = (e) => { const t = Date.now(); if (t - lastTouch < 320) e.preventDefault(); lastTouch = t; };
  root.addEventListener('touchend', noZoom, { passive: false });
  if (adv) begin(C.newGame({ mode: 'paul', players: 2, rnd })); else intro();
  return {
    inProgress: () => !!(g && !g.over),
    restart: async () => { if (g && !g.over && !(await confirmSheet('começar nova partida?', 'a partida atual será perdida.', 'nova partida'))) return; intro(); },
    destroy() {
      gone = true; clearTimers(); clearTimeout(tipT); clearTimeout(flashT); leave(); S.stopAll();
      anims.forEach((a) => { try { a.cancel(); } catch { /* já acabou */ } }); anims.clear();
      if (ro) { ro.disconnect(); ro = null; }
      document.removeEventListener('visibilitychange', onVis); root.removeEventListener('touchend', noZoom);
    },
  };
}
