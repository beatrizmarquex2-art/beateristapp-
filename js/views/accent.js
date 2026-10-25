// Acentuação matemática (método Beaterista): 4 tempos × 4 semicolcheias, um acento por tempo.
// Três modos: Aleatório, Desafio e Criação. Partitura (SVG) e som são gerados dos MESMOS eventos (music.js).
import { h, icon } from '../util.js';
import * as store from '../store.js';
import { banner, toast, stars, sheet, confirmSheet } from '../ui.js';
import * as M from '../music.js';
import { audio, click, snare, scheduler } from '../audio.js';

const KEY = 'setting-accent';
const DEF = { mode: 'aleatorio', bpm: 80, reps: 4, distinct: false, clickOn: true, countIn: true, perm: 0, seq: [1, 2, 3, 4] };
const cfg = () => ({ ...DEF, ...(store.get(KEY) ? store.get(KEY).data : {}) });
const save = (p) => store.upsert('setting', KEY, { ...cfg(), ...p });

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); kids.forEach((k) => e.append(k)); return e; };

/** Pauta de UM tempo: 4 semicolcheias de caixa (3º espaço), duas barras de ligação, acento (>) na nota certa e D/E embaixo. */
export function beatSvg(template, beat) {
  const X = [26, 58, 90, 122], Y = 58; // cabeça de nota na caixa
  const g = s('svg', { viewBox: '0 0 150 118', class: 'acc-svg', role: 'img', 'aria-label': `tempo ${beat + 1}: quatro semicolcheias, acento na ${template}ª (${M.TEMPLATE_NAMES[template]})` });
  for (let i = 0; i < 5; i++) g.append(s('line', { x1: 4, x2: 146, y1: 38 + i * 10, y2: 38 + i * 10, class: 'acc-staff' }));
  if (beat === 0) g.append(s('rect', { x: 6, y: 48, width: 3, height: 20, class: 'acc-ink' }), s('rect', { x: 12, y: 48, width: 3, height: 20, class: 'acc-ink' }));
  g.append(s('line', { x1: 146, x2: 146, y1: 38, y2: 78, class: beat === 3 ? 'acc-bar end' : 'acc-staff' }));
  X.forEach((x, pos) => {
    const on = pos === template - 1;
    const note = s('g', { class: `acc-note${on ? ' acc-on' : ''}`, 'data-pos': pos });
    note.append(s('ellipse', { cx: x, cy: Y, rx: 6.2, ry: 4.4, transform: `rotate(-20 ${x} ${Y})`, class: 'acc-ink' }),
      s('line', { x1: x + 5.6, x2: x + 5.6, y1: Y - 2, y2: 18, class: 'acc-stem' }));
    if (on) note.append(s('path', { d: `M ${x - 5} 4 L ${x + 6} 8 L ${x - 5} 12`, class: 'acc-mark' }));
    const t = s('text', { x: x + 2, y: 104, 'text-anchor': 'middle', class: `acc-hand${on ? ' on' : ''}` }); t.textContent = on ? M.STICKING[pos] : M.STICKING[pos].toLowerCase();
    note.append(t); g.append(note);
  });
  g.append(s('rect', { x: X[0] + 4.6, y: 16, width: X[3] - X[0] + 2, height: 4.2, class: 'acc-ink' }), s('rect', { x: X[0] + 4.6, y: 25, width: X[3] - X[0] + 2, height: 4.2, class: 'acc-ink' }));
  return g;
}

export function mount(host) {
  let run = null;
  const grid = h('div', { class: 'acc-grid' });
  const modeBox = h('div');
  const status = h('p', { class: 'acc-status', 'aria-live': 'polite' });
  const playBtn = h('button', { class: 'met-play', type: 'button', 'aria-label': 'Tocar' }, '▶');

  function drawGrid() {
    const c = cfg(); const editable = c.mode === 'criacao';
    grid.replaceChildren(...c.seq.map((t, b) => {
      const kids = [h('div', { class: 'acc-head' }, h('span', {}, `tempo ${b + 1}`), h('strong', {}, M.TEMPLATE_NAMES[t])), beatSvg(t, b)];
      return editable
        ? h('button', { type: 'button', class: 'acc-card edit', 'aria-label': `Tempo ${b + 1}: acento na ${t}ª. Toque para mudar.`, onclick: () => { const seq = [...cfg().seq]; seq[b] = (seq[b] % 4) + 1; save({ seq }); drawGrid(); } }, kids, h('small', {}, 'toque para mudar'))
        : h('div', { class: 'acc-card' }, kids);
    }));
  }
  function playhead(step) { grid.querySelectorAll('.acc-note').forEach((n, i) => n.classList.toggle('now', i === step)); }

  function drawMode() {
    const c = cfg();
    let body;
    if (c.mode === 'aleatorio') {
      body = h('div', { class: 'row' },
        h('button', { class: 'btn primary', type: 'button', onclick: () => { stop(); save({ seq: M.randomChallenge({ distinct: cfg().distinct }) }); drawGrid(); } }, 'sortear 4 tempos'),
        h('label', { class: 'row acc-opt' }, h('input', { type: 'checkbox', class: 'switch', checked: c.distinct, onchange: (e) => save({ distinct: e.target.checked }) }), h('span', {}, 'só modelos diferentes')));
    } else if (c.mode === 'desafio') {
      const perms = M.permutations24();
      body = h('div', {},
        h('p', { class: 'muted' }, `desafio ${c.perm + 1} de 24 (as permutações da p. 17): toque, repita até sair limpo e marque.`),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', type: 'button', onclick: async (e) => { const btn = e.currentTarget; await store.upsert('practice', null, { kind: 'acentuacao', seq: cfg().seq, bpm: cfg().bpm, at: Date.now() }); stars(btn); toast(`desafio ${cfg().perm + 1} limpo a ${cfg().bpm} BPM ✓`); } }, 'consegui ✓'),
          h('button', { class: 'btn', type: 'button', onclick: () => { stop(); const p = (cfg().perm + 1) % 24; save({ perm: p, seq: perms[p] }); drawGrid(); drawMode(); } }, 'próximo desafio')));
      if (c.seq.join() !== perms[c.perm].join()) { save({ seq: perms[c.perm] }); }
    } else {
      const saved = store.list('exercise').filter((r) => r.data.kind === 'acentuacao').sort((a, b) => b.updated_at - a.updated_at);
      body = h('div', {},
        h('p', { class: 'muted' }, 'toque em cada tempo para escolher onde fica o acento (1, 2, 3 ou 4).'),
        h('button', { class: 'btn primary', type: 'button', onclick: () => sheet('Salvar exercício', (close) => {
          const name = h('input', { type: 'text', placeholder: 'nome (ex.: aquecimento 3-1-4-2)', maxlength: 60, 'aria-label': 'Nome do exercício' });
          return h('div', { class: 'sheet-body' }, h('label', { class: 'field' }, h('span', {}, 'nome'), name),
            h('div', { class: 'row end' }, h('button', { class: 'btn primary', type: 'button', onclick: async () => { await store.upsert('exercise', null, { kind: 'acentuacao', title: name.value.trim() || cfg().seq.join('-'), seq: cfg().seq, bpm: cfg().bpm, source: 'baseado no método Beaterista · Ebook 2 BM, p. 15–19' }); close(); toast('exercício salvo ✓'); drawMode(); } }, 'salvar')));
        }) }, 'salvar exercício'),
        saved.length ? h('ul', { class: 'acc-saved' }, saved.map((r) => h('li', {},
          h('button', { class: 'link', type: 'button', onclick: () => { stop(); save({ seq: r.data.seq, bpm: r.data.bpm || cfg().bpm }); drawGrid(); } }, `${r.data.title} · ${r.data.seq.join('-')}`),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Apagar ${r.data.title}`, onclick: async () => { if (await confirmSheet('Apagar exercício?', r.data.title, 'Apagar')) { await store.remove(r.id); drawMode(); } } }, icon('trash', 18))))) : null);
    }
    modeBox.replaceChildren(body);
  }

  function start() {
    audio(); const c = cfg(); const ev = M.challengeEvents(c.seq); const sx = M.beatSec(c.bpm) / 4;
    const lead = c.countIn ? 16 : 0; const total = lead + c.reps * 16;
    run = scheduler((i) => {
      if (i >= total) return null;
      const at = i * sx;
      if (i < lead) return { at, play: i % 4 === 0 ? (t) => click(t, i === 0 ? 2 : 1) : null, ui: i % 4 === 0 ? () => { status.textContent = `contagem: ${i / 4 + 1}…`; } : null };
      const e = ev[(i - lead) % 16]; const rep = Math.floor((i - lead) / 16);
      return { at, play: (t) => { snare(t, e.vel); if (c.clickOn && e.pos === 0) click(t, e.beat === 0 ? 2 : 1, 0.6); },
        ui: () => { playhead(e.step); if (e.step === 0) status.textContent = `repetição ${rep + 1} de ${c.reps} · ${c.bpm} BPM`; } };
    }, { onEnd: () => { stop(); status.textContent = 'fim. de novo?'; } });
    playBtn.textContent = '■'; playBtn.setAttribute('aria-label', 'Parar'); playBtn.classList.add('on');
  }
  function stop() { run && run.stop(); run = null; playhead(-1); playBtn.textContent = '▶'; playBtn.setAttribute('aria-label', 'Tocar'); playBtn.classList.remove('on'); }
  playBtn.addEventListener('click', () => (run ? stop() : start()));

  const bpm = h('input', { type: 'number', inputmode: 'numeric', min: M.BPM_MIN, max: M.BPM_MAX, value: cfg().bpm, 'aria-label': 'BPM', onchange: (e) => { const v = M.clampBpm(e.target.value); e.target.value = v; save({ bpm: v }); if (run) { stop(); start(); } } });
  const reps = h('input', { type: 'number', inputmode: 'numeric', min: 1, max: 16, value: cfg().reps, 'aria-label': 'repetições', onchange: (e) => save({ reps: Math.max(1, Math.min(16, Number(e.target.value) || 1)) }) });
  const tabs = h('div', { class: 'seg', role: 'tablist' });
  const drawTabs = () => tabs.replaceChildren(...[['aleatorio', 'Aleatório'], ['desafio', 'Desafio'], ['criacao', 'Criação']].map(([m, t]) =>
    h('button', { type: 'button', role: 'tab', class: cfg().mode === m ? 'on' : '', 'aria-selected': String(cfg().mode === m), onclick: async () => { stop(); await save({ mode: m }); drawTabs(); drawMode(); drawGrid(); } }, t)));

  host.append(
    banner('Acentuação 4×4', 'baseado no método Beaterista · Ebook 2, p. 15–19'),
    h('div', { class: 'card pad' }, tabs, modeBox),
    grid,
    h('section', { class: 'card pad acc-ctrl' },
      h('div', { class: 'grid2' }, h('label', { class: 'field' }, h('span', {}, 'BPM'), bpm), h('label', { class: 'field' }, h('span', {}, 'repetições'), reps)),
      h('label', { class: 'row between met-sw' }, h('span', {}, 'clique do metrônomo junto'), h('input', { type: 'checkbox', class: 'switch', checked: cfg().clickOn, onchange: (e) => save({ clickOn: e.target.checked }) })),
      h('label', { class: 'row between met-sw' }, h('span', {}, '1 compasso de contagem antes'), h('input', { type: 'checkbox', class: 'switch', checked: cfg().countIn, onchange: (e) => save({ countIn: e.target.checked }) })),
      h('div', { class: 'row met-row' }, status, playBtn)),
    h('p', { class: 'pad-x lib-note' }, 'D = direita, E = esquerda. maiúscula = acento (forte), minúscula = nota fraca. o som segue exatamente o que está escrito.'));
  drawTabs(); drawMode(); drawGrid();
  return () => stop();
}
