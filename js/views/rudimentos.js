// Rudimentos e treino de mãos: escreva a manulação (D, E, B), veja na pauta, toque junto com clique e guarde o BPM limpo.
// A partitura e o som saem do mesmo compasso (toBar), igual ao resto do app.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as N from '../notation.js';
import { clampBpm } from '../music.js';
import { audio, click, snare, kick, scheduler } from '../audio.js';
import { banner, toast, stars, confirmSheet, sheet } from '../ui.js';
import { SUBS, VEL, parse, toText, swap, flatten, toBar, PRESETS } from '../rudiments.js';

const KEY = 'setting-rudimentos';
const conf = () => ({ pick: 'preset:paradiddle', stick: PRESETS[3].stick, sub: 4, bpm: 70, left: false, click: true, prog: false, ...(store.get(KEY) ? store.get(KEY).data : {}) });
const setConf = (p) => store.upsert('setting', KEY, p);
const mine = () => store.list('rudiment').sort((a, b) => a.data.name.localeCompare(b.data.name, 'pt-BR'));
const logKey = (c) => (c.pick && c.pick !== 'livre' ? c.pick : `livre:${toText(parse(c.stick))}`);

export function mount(host) {
  let run = null; let curStep = -1; let liveBpm = null;
  const body = h('div');
  const notesOf = (c) => { const n = flatten(parse(c.stick)); return c.left ? swap(n) : n; };
  const stop = () => { if (run) { run.stop(); run = null; } curStep = -1; liveBpm = null; };
  const start = () => {
    stop(); audio(); const c = conf(); const notes = notesOf(c); if (!notes.length) { toast('escreve a manulação com D, E e B'); return; }
    const per = c.sub; const steps = per * 4; let bpm = c.bpm; let t = 0; let bar = 0;
    run = scheduler((i) => {
      if (i > 0 && i % steps === 0) { bar++; if (c.prog && bar % 4 === 0) bpm = clampBpm(bpm + 5); }
      const at = t; t += 60 / bpm / per;
      const n = notes[i % notes.length]; const k = i % steps; const b = bpm;
      return {
        at,
        play: (tt) => { if (n.who === 'B') kick(tt, n.dyn === 'ghost' ? 0.4 : 0.9); else snare(tt, VEL[n.dyn]); if (c.click && k % per === 0) click(tt, k === 0 ? 2 : 1, 0.5); },
        ui: () => { curStep = k; liveBpm = b; paint(); },
      };
    });
    draw();
  };
  const paint = () => {
    body.querySelectorAll('.rd-stick span').forEach((s) => s.classList.toggle('now', Number(s.dataset.i) === curStep));
    const o = body.querySelector('.bl-bpm'); if (o && liveBpm) o.textContent = String(liveBpm);
  };
  const restart = () => { if (run) start(); else draw(); };

  const draw = () => {
    const c = conf(); const notes = notesOf(c); const bar = toBar(notes, c.sub);
    const best = store.list('rudlog').filter((r) => r.data.key === logKey(c)).reduce((m, r) => Math.max(m, r.data.bpm), 0);
    const opts = [...PRESETS.map((p) => [`preset:${p.id}`, p.name]), ...mine().map((r) => [`mine:${r.id}`, `${r.data.name} · meu`]), ['livre', 'escrever o meu…']];
    const choose = (v) => {
      const [kind, id] = v.split(':'); let patch = { pick: v };
      if (kind === 'preset') { const p = PRESETS.find((x) => x.id === id); patch = { ...patch, stick: p.stick, sub: p.sub }; }
      if (kind === 'mine') { const r = store.get(id); if (r) patch = { ...patch, stick: r.data.stick, sub: r.data.sub }; }
      setConf(patch).then(restart);
    };
    const input = h('input', { type: 'text', class: 'rd-input', value: c.stick, maxlength: 64, autocapitalize: 'off', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Manulação' });
    input.addEventListener('change', () => setConf({ stick: input.value, pick: 'livre' }).then(restart));
    const svg = h('figure', { class: 'cb-bar rd-score' }); svg.innerHTML = N.toSVG(N.layout(bar, { width: 340, full: bar.rows.bd.some(Boolean) }));
    const per = c.sub;
    const stickRow = h('div', { class: 'rd-stick', style: { gridTemplateColumns: `repeat(${per * 4}, 1fr)` } }, ...bar.seq.map((n, i) => h('span', { 'data-i': String(i), class: `${n.dyn}${n.who === 'B' ? ' kick' : ''}${i % per === 0 ? ' beat' : ''}` }, n.dyn === 'ghost' ? `(${n.who})` : n.who)));
    const setBpm = (v) => setConf({ bpm: clampBpm(v) }).then(restart);
    body.replaceChildren(
      h('section', { class: 'card pad rd-card' },
        h('label', { class: 'field' }, h('span', {}, 'rudimento'), h('select', { 'aria-label': 'Rudimento', onchange: (e) => choose(e.target.value) }, ...opts.map(([v, t]) => h('option', { value: v, selected: v === c.pick }, t)))),
        h('label', { class: 'field' }, h('span', {}, 'manulação (D direita · E esquerda · B bumbo · MAIÚSCULA = acento · (x) = fantasma)'), input),
        h('div', { class: 'row tk-line' }, h('span', { class: 'tp-lab' }, 'figura'),
          h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'Figura' }, ...Object.entries(SUBS).map(([k, t]) => h('button', { type: 'button', class: `lib-tab${c.sub === Number(k) ? ' on' : ''}`, role: 'radio', 'aria-checked': String(c.sub === Number(k)), onclick: () => setConf({ sub: Number(k) }).then(restart) }, t)))),
        h('div', { class: 'row rd-toggles' },
          h('button', { class: 'btn small', type: 'button', 'aria-pressed': String(!!c.left), onclick: () => setConf({ left: !c.left }).then(restart) }, c.left ? 'começa com a esquerda ✓' : 'começar com a esquerda'),
          h('button', { class: 'btn small', type: 'button', 'aria-pressed': String(!!c.click), onclick: () => setConf({ click: !c.click }).then(restart) }, c.click ? 'clique ✓' : 'sem clique'),
          h('button', { class: 'btn small', type: 'button', 'aria-pressed': String(!!c.prog), onclick: () => setConf({ prog: !c.prog }).then(restart) }, c.prog ? '+5 BPM a cada 4 compassos ✓' : 'subir +5 BPM a cada 4 compassos'))),
      h('div', { class: 'pad-x' }, svg, stickRow),
      h('div', { class: 'pad-x' }, h('div', { class: 'bl-tempo' },
        h('button', { class: 'bl-step', type: 'button', 'aria-label': 'menos 5 BPM', onclick: () => setBpm(c.bpm - 5) }, '−'), h('output', { class: 'bl-bpm' }, String(liveBpm || c.bpm)),
        h('button', { class: 'bl-step', type: 'button', 'aria-label': 'mais 5 BPM', onclick: () => setBpm(c.bpm + 5) }, '+'),
        h('button', { class: `bl-play${run ? ' on' : ''}`, type: 'button', 'aria-label': run ? 'Parar' : 'Tocar rudimento', onclick: () => (run ? (stop(), draw()) : start()) }, icon(run ? 'stop' : 'play', 28)))),
      h('section', { class: 'card pad rd-log' },
        h('p', {}, best ? h('b', {}, `seu melhor limpo: ${best} BPM`) : 'ainda sem BPM limpo registrado aqui.'),
        h('div', { class: 'row rd-toggles' },
          h('button', { class: 'btn primary', type: 'button', onclick: async (e) => {
            const btn = e.currentTarget; const bpm = liveBpm || c.bpm; const name = (opts.find(([v]) => v === c.pick) || [0, toText(parse(c.stick))])[1];
            await store.upsert('rudlog', null, { key: logKey(c), name, stick: toText(parse(c.stick)), sub: c.sub, bpm, left: !!c.left, at: Date.now() });
            stars(btn); toast(`${bpm} BPM limpo registrado ✓`, { ms: 1600 });
          } }, `consegui limpo a ${liveBpm || c.bpm} BPM ✓`),
          h('button', { class: 'btn', type: 'button', onclick: () => sheet('Salvar rudimento', (close) => {
            const name = h('input', { type: 'text', maxlength: 50, placeholder: 'ex.: paradiddle com bumbo', 'aria-label': 'Nome do exercício' });
            return h('div', { class: 'sheet-body' }, h('label', { class: 'field' }, h('span', {}, 'nome'), name), h('button', { class: 'btn primary', type: 'button', onclick: async () => {
              const n = name.value.trim(); if (!n) return;
              const r = await store.upsert('rudiment', null, { name: n, stick: toText(parse(c.stick)), sub: c.sub });
              close(); await setConf({ pick: `mine:${r.id}` }); toast('guardado nos seus rudimentos ✓', { ms: 1500 });
            } }, 'salvar'));
          }) }, 'salvar como meu'),
          c.pick.startsWith('mine:') ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Apagar meu rudimento', onclick: async () => { const id = c.pick.slice(5); if (await confirmSheet('Apagar rudimento?', (store.get(id) || { data: {} }).data.name || '', 'Apagar')) { await store.remove(id); await setConf({ pick: 'livre' }); } } }, icon('trash', 18)) : null),
        history(c)),
      h('p', { class: 'pad-x lib-note' }, 'escreve do jeito do método: “Dede” é acento na 1ª semicolcheia, “(e)” é nota fantasma, B é bumbo. a pauta e o som saem da mesma escrita. o BPM limpo fica guardado por exercício, pra você ver a evolução.'));
    paint();
  };
  const history = (c) => {
    const recs = store.list('rudlog').filter((r) => r.data.key === logKey(c)).sort((a, b) => b.data.at - a.data.at).slice(0, 5);
    if (!recs.length) return null;
    const fmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short' });
    return h('ul', { class: 'rd-hist' }, ...recs.map((r) => h('li', {}, h('b', {}, `${r.data.bpm} BPM`), ` · ${fmt.format(new Date(r.data.at))}${r.data.left ? ' · começando com a esquerda' : ''}`)));
  };
  host.append(banner('Rudimentos', 'treino de mãos'), body);
  draw();
  const off = store.subscribe((i) => { if (i.kind === 'rudlog' || i.kind === 'rudiment' || (i.kind === 'setting' && i.id === KEY && !run)) draw(); });
  return () => { stop(); off(); };
}
