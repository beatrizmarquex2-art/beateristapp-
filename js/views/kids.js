// Área Kids: jogos curtos e grandes pra usar com a criança na aula (celular ou tablet).
// explorar a bateria tocando, "que peça é essa?" (desenho ou som), onde mora na pauta, qual figura dura mais,
// monte seu ritmo com comidas (pão = semínima, bo-lo = colcheias, cho-co-la-te = semicolcheias) e quantos bumbos.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as B from '../beats.js';
import * as N from '../notation.js';
import { audio, click } from '../audio.js';
import { banner, stars } from '../ui.js';
import { VOICE } from './beatlab.js';
import { layoutRhythm } from '../reading.js';
import { PIECES, FIGURES, FOODS, nameOf, pieceQuestion, figurePair, bumboBar, randomFoods, sameRhythm, cellOf } from '../kids-logic.js';

const KEY = 'setting-kids';
const starsN = () => (store.get(KEY) ? store.get(KEY).data.stars || 0 : 0);
const addStar = (el) => { store.upsert('setting', KEY, { stars: starsN() + 1 }); if (el) stars(el); };
const GAMES = [
  ['explorar', 'Explorar a bateria', 'toca e descobre o nome', '🥁'],
  ['pecas', 'Que peça é essa?', 'pelo desenho ou pelo som', '👀'],
  ['pauta', 'Onde mora na pauta?', 'cada peça tem a sua casinha', '🎼'],
  ['figuras', 'Qual dura mais?', 'semibreve, mínima, semínima…', '⏳'],
  ['ritmo', 'Monte seu ritmo', 'pão, bo-lo, cho-co-la-te', '🍫'],
  ['bumbos', 'Quantos bumbos?', 'escuta e conta', '👂'],
];
const EMOJI = { pao: '🍞', bolo: '🎂', chocolate: '🍫', shh: '🤫' };
const play = (id) => { const c = audio(); VOICE[id](c.currentTime + 0.01, 1); };
const svgEl = (markup, cls) => { const d = h('div', { class: cls }); d.innerHTML = markup; return d; }; // só desenho nosso, sem texto de fora

/* ---------- desenhos ---------- */
function kitMarkup(hl, hide) {
  const c = (id) => (hide ? '#d9d2c7' : B.COLORS[id]); const on = (id) => (hl === id ? ' hl' : '');
  const drum = (id, x, y, w, hh) => `<g class="kp${on(id)}" data-p="${id}"><rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="${c(id)}" stroke="#1b1818" stroke-width="3"/><ellipse cx="${x + w / 2}" cy="${y}" rx="${w / 2}" ry="${hh / 5}" fill="#fffdf8" stroke="#1b1818" stroke-width="3"/></g>`;
  const cym = (id, x, y, rx, two) => `<g class="kp${on(id)}" data-p="${id}"><line x1="${x}" y1="${y}" x2="${x}" y2="${y + 120}" stroke="#1b1818" stroke-width="3"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx / 5}" fill="${c(id)}" stroke="#1b1818" stroke-width="3"/>${two ? `<ellipse cx="${x}" cy="${y + 10}" rx="${rx}" ry="${rx / 5}" fill="${c(id)}" stroke="#1b1818" stroke-width="3"/>` : ''}</g>`;
  return `<svg viewBox="0 0 420 300" role="img" aria-label="Bateria">${cym('cr', 85, 45, 62)}${cym('rd', 340, 55, 66)}${cym('hh', 42, 120, 40, true)}
    ${drum('tt', 140, 95, 64, 44)}${drum('mt', 222, 95, 64, 44)}${drum('sn', 80, 175, 86, 38)}${drum('ft', 300, 165, 90, 90)}
    <g class="kp${on('bd')}" data-p="bd"><circle cx="210" cy="215" r="74" fill="${c('bd')}" stroke="#1b1818" stroke-width="3"/><circle cx="210" cy="215" r="58" fill="#fffdf8" stroke="#1b1818" stroke-width="2"/><text x="210" y="223" text-anchor="middle" font-family="Permanent Marker, cursive" font-size="22" fill="#b5162b">Beaterista</text></g></svg>`;
}
/** Pauta com uma nota na casinha da peça (cabeça em x nos pratos e no chimbal). */
function staffMarkup(id) {
  const top = 40, gap = 16, x = 170; const y = top + (N.POS[id] * gap) / 2; const xh = ['cr', 'rd', 'hh', 'ho', 'hf'].includes(id);
  const lines = [0, 1, 2, 3, 4].map((i) => `<line x1="20" y1="${top + i * gap}" x2="300" y2="${top + i * gap}" stroke="#1b1818" stroke-width="2"/>`).join('');
  const ledger = N.POS[id] <= -2 ? `<line x1="${x - 18}" y1="${top - gap}" x2="${x + 18}" y2="${top - gap}" stroke="#1b1818" stroke-width="2"/>` : '';
  const head = xh ? `<path d="M${x - 9} ${y - 9}l18 18M${x + 9} ${y - 9}l-18 18" stroke="#b5162b" stroke-width="4"/>` : `<ellipse cx="${x}" cy="${y}" rx="11" ry="8" transform="rotate(-20 ${x} ${y})" fill="#b5162b"/>`;
  return `<svg viewBox="0 0 320 150" role="img" aria-label="Pauta com uma nota">${lines}<rect x="30" y="${top + gap}" width="6" height="${gap * 2}" fill="#1b1818"/><rect x="40" y="${top + gap}" width="6" height="${gap * 2}" fill="#1b1818"/>${ledger}${head}<line x1="${x + 10}" y1="${y}" x2="${x + 10}" y2="${y - 50}" stroke="#b5162b" stroke-width="3"/></svg>`;
}
function figureMarkup(id) {
  const open = id === 'semibreve' || id === 'minima'; const stem = id !== 'semibreve'; const flags = { colcheia: 1, semicolcheia: 2 }[id] || 0;
  const head = `<ellipse cx="40" cy="100" rx="17" ry="12" transform="rotate(-20 40 100)" fill="${open ? '#fffdf8' : '#1b1818'}" stroke="#1b1818" stroke-width="5"/>`;
  const st = stem ? '<line x1="55" y1="96" x2="55" y2="20" stroke="#1b1818" stroke-width="5"/>' : '';
  const fl = Array.from({ length: flags }, (_, i) => `<path d="M55 ${22 + i * 18}c6 12 26 14 22 40" stroke="#1b1818" stroke-width="5" fill="none"/>`).join('');
  return `<svg viewBox="0 0 110 130" role="img" aria-label="${(FIGURES.find((f) => f.id === id) || {}).name || id}">${head}${st}${fl}</svg>`;
}
const tone = (beats, bpm = 60) => { const c = audio(); const o = c.createOscillator(); const g = c.createGain(); const t = c.currentTime + 0.02; const d = (60 / bpm) * beats;
  o.type = 'triangle'; o.frequency.value = 523; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.02); g.gain.setValueAtTime(0.3, t + d - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.05); };

/* ---------- jogos ---------- */
function feedback(el, ok, text) { el.className = `kd-fb ${ok ? 'ok' : 'no'}`; el.textContent = text; }

function explorar(box) {
  const name = h('p', { class: 'kd-big' }, 'toca numa peça!');
  const kit = svgEl(kitMarkup(), 'kd-kit');
  kit.addEventListener('pointerdown', (e) => { const g = e.target.closest('[data-p]'); if (!g) return; const id = g.dataset.p; play(id); name.textContent = nameOf(id);
    kit.querySelectorAll('.kp').forEach((x) => x.classList.toggle('hl', x.dataset.p === id)); });
  box.replaceChildren(kit, name);
}

function pecas(box) {
  let mode = 'ver', level = 1, q = null, tries = 0;
  const fb = h('p', { class: 'kd-fb' });
  const draw = () => {
    if (!q) { q = pieceQuestion(Math.random, level, level === 1 ? 3 : 4); tries = 0; fb.textContent = ''; fb.className = 'kd-fb'; if (mode === 'ouvir') setTimeout(() => play(q.ans), 250); }
    const kit = svgEl(kitMarkup(mode === 'ver' ? q.ans : null, mode === 'ouvir'), 'kd-kit');
    box.replaceChildren(
      h('div', { class: 'row kd-modes' }, ...[['ver', '👀 ver'], ['ouvir', '👂 ouvir']].map(([k, t]) => h('button', { type: 'button', class: `kd-chip${mode === k ? ' on' : ''}`, onclick: () => { mode = k; q = null; draw(); } }, t)),
        ...[[1, 'fácil'], [2, 'todas']].map(([k, t]) => h('button', { type: 'button', class: `kd-chip${level === k ? ' on' : ''}`, onclick: () => { level = k; q = null; draw(); } }, t))),
      kit, mode === 'ouvir' ? h('button', { class: 'kd-btn kd-listen', type: 'button', onclick: () => play(q.ans) }, '▶ ouvir de novo') : h('p', { class: 'kd-q' }, 'qual é a peça pintada?'),
      h('div', { class: 'kd-opts' }, ...q.options.map((id) => h('button', { type: 'button', class: 'kd-btn kd-opt', 'data-c': B.COLORS[id], onclick: (e) => {
        play(id);
        if (id === q.ans) { feedback(fb, true, `isso! é ${nameOf(id)} ⭐`); addStar(e.currentTarget); q = null; setTimeout(draw, 1300); }
        else { tries++; e.currentTarget.classList.add('shake'); feedback(fb, false, tries > 1 ? `era ${nameOf(q.ans)}!` : 'quase! tenta de novo'); if (tries > 1) { q = null; setTimeout(draw, 1600); } }
      } }, nameOf(id)))), fb);
    box.querySelectorAll('.kd-opt[data-c]').forEach((b) => b.style.setProperty('--c', b.dataset.c));
  };
  draw();
}

function pauta(box) {
  let level = 1, q = null;
  const fb = h('p', { class: 'kd-fb' });
  const draw = () => {
    if (!q) { q = pieceQuestion(Math.random, level, level === 1 ? 3 : 4); fb.textContent = ''; fb.className = 'kd-fb'; }
    box.replaceChildren(
      h('div', { class: 'row kd-modes' }, ...[[1, 'bumbo, caixa, chimbal'], [2, 'todas as peças']].map(([k, t]) => h('button', { type: 'button', class: `kd-chip${level === k ? ' on' : ''}`, onclick: () => { level = k; q = null; draw(); } }, t))),
      svgEl(staffMarkup(q.ans), 'kd-staff'), h('p', { class: 'kd-q' }, 'quem mora nessa casinha?'),
      h('div', { class: 'kd-opts' }, ...q.options.map((id) => h('button', { type: 'button', class: 'kd-btn kd-opt', onclick: (e) => {
        play(id);
        if (id === q.ans) { feedback(fb, true, `isso! ${nameOf(id)} ⭐`); addStar(e.currentTarget); q = null; setTimeout(draw, 1300); }
        else { e.currentTarget.classList.add('shake'); feedback(fb, false, `essa casinha é do ${nameOf(q.ans)}`); q = null; setTimeout(draw, 1800); }
      } }, nameOf(id)))), fb,
      h('details', { class: 'kd-help' }, h('summary', {}, 'ver todas as casinhas'), svgEl(PIECES.map((p) => `<figure>${staffMarkup(p.id)}<figcaption>${p.name}</figcaption></figure>`).join(''), 'kd-all')));
  };
  draw();
}

function figuras(box) {
  let q = null; let answered = false;
  const fb = h('p', { class: 'kd-fb' });
  const draw = () => {
    if (!q) { q = figurePair(); answered = false; fb.textContent = ''; fb.className = 'kd-fb'; }
    const card = (id) => { const f = FIGURES.find((x) => x.id === id); return h('button', { type: 'button', class: `kd-fig${answered && id === q.ans ? ' right' : ''}`, onclick: (e) => {
      tone(f.beats);
      if (answered) return; answered = true;
      if (id === q.ans) { feedback(fb, true, `isso! ${f.name} dura ${f.beats >= 1 ? `${f.beats} tempo${f.beats > 1 ? 's' : ''}` : f.beats === 0.5 ? 'meio tempo' : '¼ de tempo'} ⭐`); addStar(e.currentTarget); }
      else { const r = FIGURES.find((x) => x.id === q.ans); feedback(fb, false, `a ${r.name} dura mais!`); }
      draw();
    } }, svgEl(figureMarkup(id), 'kd-fig-svg'), answered ? h('b', {}, f.name) : null); };
    box.replaceChildren(h('p', { class: 'kd-q' }, 'qual dura mais tempo? (toca pra ouvir)'), h('div', { class: 'kd-pair' }, card(q.pair[0]), card(q.pair[1])), fb,
      answered ? h('button', { class: 'kd-btn', type: 'button', onclick: () => { q = null; draw(); } }, 'próxima →') : null,
      h('details', { class: 'kd-help' }, h('summary', {}, 'a árvore das figuras'), h('ul', { class: 'kd-tree' }, ...FIGURES.map((f) => h('li', {}, svgEl(figureMarkup(f.id), 'kd-fig-mini'), h('span', {}, `${f.name} · ${f.beats >= 1 ? `${f.beats} tempo${f.beats > 1 ? 's' : ''}` : f.beats === 0.5 ? '½ tempo' : '¼ de tempo'}`))))));
  };
  draw();
}

function ritmo(box) {
  let mode = 'criar'; let slots = []; let secret = null; let cur = -1;
  const fb = h('p', { class: 'kd-fb' });
  const playBar = (ids, mark) => {
    const c = audio(); const q = 60 / 80; const t0 = c.currentTime + 0.15 + q * 4;
    for (let i = 0; i < 4; i++) click(t0 - (4 - i) * q, i === 0 ? 2 : 1, 0.5);
    ids.forEach((id, b) => { [...cellOf(id)].forEach((x, k) => { if (x === '1') VOICE.sn(t0 + b * q + (k * q) / 4, 0.85); }); click(t0 + b * q, b === 0 ? 2 : 1, 0.35);
      if (mark) setTimeout(() => { cur = b; mark(); }, (t0 + b * q - c.currentTime) * 1000); });
    if (mark) setTimeout(() => { cur = -1; mark(); }, (t0 + 4 * q - c.currentTime) * 1000);
  };
  const draw = () => {
    const full = slots.length === 4;
    const score = full ? svgEl(N.toSVG(layoutRhythm(slots.map(cellOf), { width: 360 })), 'kd-score') : null;
    const slotEls = Array.from({ length: 4 }, (_, i) => { const id = slots[i]; const f = FOODS.find((x) => x.id === id);
      return h('button', { type: 'button', class: `kd-slot${cur === i ? ' now' : ''}${id ? ' full' : ''}`, 'aria-label': id ? `Tirar ${f.word}` : `Tempo ${i + 1} vazio`, onclick: () => { if (id) { slots = slots.slice(0, i); draw(); } } },
        id ? [h('span', { class: 'kd-emoji' }, EMOJI[id]), h('small', {}, f.syl.join('-'))] : h('small', {}, String(i + 1))); });
    box.replaceChildren(
      h('div', { class: 'row kd-modes' }, ...[['criar', '🎨 criar'], ['adivinha', '🕵️ adivinha']].map(([k, t]) => h('button', { type: 'button', class: `kd-chip${mode === k ? ' on' : ''}`, onclick: () => { mode = k; slots = []; secret = k === 'adivinha' ? randomFoods() : null; fb.textContent = ''; draw(); } }, t))),
      mode === 'adivinha' ? h('button', { class: 'kd-btn kd-listen', type: 'button', onclick: () => playBar(secret) }, '▶ ouvir o ritmo secreto') : h('p', { class: 'kd-q' }, 'monta 4 tempos e toca!'),
      h('div', { class: 'kd-slots' }, ...slotEls),
      h('div', { class: 'kd-foods' }, ...FOODS.map((f) => h('button', { type: 'button', class: 'kd-food', disabled: full, onclick: () => { if (slots.length < 4) { slots = [...slots, f.id]; draw(); } } }, h('span', { class: 'kd-emoji' }, EMOJI[f.id]), h('b', {}, f.syl.join('-')), h('small', {}, f.fig)))),
      score,
      h('div', { class: 'row kd-modes' },
        full ? h('button', { class: 'kd-btn', type: 'button', onclick: () => playBar(slots, () => box.querySelectorAll('.kd-slot').forEach((s, i) => s.classList.toggle('now', i === cur))) }, '▶ tocar') : null,
        mode === 'adivinha' && full ? h('button', { class: 'kd-btn', type: 'button', onclick: (e) => { if (sameRhythm(slots, secret)) { feedback(fb, true, 'acertou o ritmo secreto! ⭐'); addStar(e.currentTarget); secret = randomFoods(Math.random, 2); slots = []; setTimeout(draw, 1500); } else feedback(fb, false, 'quase! ouve de novo e troca uma carta'); } }, 'conferir') : null,
        slots.length ? h('button', { class: 'kd-chip', type: 'button', onclick: () => { slots = []; draw(); } }, 'limpar') : null),
      fb);
  };
  draw();
}

function bumbos(box) {
  let n = null; let answered = false;
  const fb = h('p', { class: 'kd-fb' });
  const playN = () => { const bar = bumboBar(n); const c = audio(); const dt = 60 / 70 / 2; const t0 = c.currentTime + 0.15;
    for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) for (const p of ['hh', 'sn', 'bd']) if (bar.rows[p][i]) VOICE[p](t0 + (r * 8 + i) * dt, p === 'hh' ? 0.6 : 1); };
  const draw = () => {
    if (n == null) { n = 1 + Math.floor(Math.random() * 3); answered = false; fb.textContent = ''; fb.className = 'kd-fb'; setTimeout(playN, 250); }
    const full = { ...bumboBar(n), rows: Object.fromEntries(B.ROWS.map((r) => [r.id, bumboBar(n).rows[r.id] || Array(8).fill(0)])) };
    box.replaceChildren(
      h('button', { class: 'kd-btn kd-listen', type: 'button', onclick: playN }, '▶ ouvir de novo'), h('p', { class: 'kd-q' }, 'quantos bumbos tem em cada compasso?'),
      h('div', { class: 'kd-opts kd-nums' }, ...[1, 2, 3].map((k) => h('button', { type: 'button', class: 'kd-btn kd-opt', onclick: (e) => {
        if (answered) return; answered = true;
        if (k === n) { feedback(fb, true, `isso! ${n} bumbo${n > 1 ? 's' : ''} ⭐`); addStar(e.currentTarget); } else feedback(fb, false, `eram ${n} bumbo${n > 1 ? 's' : ''}! olha na partitura`);
        draw();
      } }, String(k)))), fb,
      answered ? svgEl(N.toSVG(N.layout(full, { width: 340, full: true, color: true })), 'kd-score') : null,
      answered ? h('button', { class: 'kd-btn', type: 'button', onclick: () => { n = null; draw(); } }, 'próxima →') : null);
  };
  draw();
}

const RUN = { explorar, pecas, pauta, figuras, ritmo, bumbos };

/** Mais jogos: os do app e os do site jogosdemusica.com.br (esses abrem em outra aba). */
const EXTERNAL = [['#/treinos/montar', 'Monte o ditado', 'ouvir e montar com as células', '🧩'], ['https://jogosdemusica.com.br/JOGOS/Ditado_ritmico/jogo/', 'Ditado rítmico', 'ouvir e escrever o ritmo', '🎧']];

export function mount(host, parts = []) {
  const game = parts[0] && RUN[parts[0]] ? parts[0] : null;
  const starEl = h('span', { class: 'kd-stars', 'aria-live': 'polite' });
  const paint = () => { starEl.textContent = `⭐ ${starsN()}`; };
  if (!game) {
    host.append(banner('Beaterista Kids', 'aprender brincando'), h('div', { class: 'row between pad-x' }, h('small', { class: 'muted' }, 'estrelas da turma'), starEl),
      h('div', { class: 'kd-grid' }, ...GAMES.map(([k, t, s, e]) => h('a', { class: 'kd-card', href: `#/kids/${k}` }, h('span', { class: 'kd-emoji' }, e), h('b', {}, t), h('small', {}, s)))),
      h('h2', { class: 'tag pad-x kd-ext-t' }, 'mais jogos'),
      h('div', { class: 'kd-grid kd-ext' }, ...EXTERNAL.map(([url, t, s, e]) => h('a', /^https?:/.test(url) ? { class: 'kd-card', href: url, target: '_blank', rel: 'noopener noreferrer' } : { class: 'kd-card', href: url }, h('span', { class: 'kd-emoji' }, e), h('b', {}, t, /^https?:/.test(url) ? ' ↗' : ''), h('small', {}, s)))),
      h('p', { class: 'pad-x lib-note' }, 'pra usar junto com a criança na aula. cada acerto vale uma estrela. o som sai daqui do aparelho, sem internet.'),
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => store.upsert('setting', KEY, { stars: 0 }) }, 'zerar estrelas'));
  } else {
    const g = GAMES.find((x) => x[0] === game); const box = h('div', { class: 'kd-game' });
    host.append(banner(g[1], g[2]), h('div', { class: 'row between pad-x' }, h('a', { class: 'btn small ghost', href: '#/kids' }, '‹ jogos'), starEl), box);
    RUN[game](box);
  }
  paint();
  return store.subscribe((i) => { if (i.id === KEY || !i.kind) paint(); });
}
