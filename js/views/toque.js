// Bateria de toque: kit na tela com vários dedos ao mesmo tempo (e teclado no computador).
// Modo gravar: conta 4, você toca N compassos com o clique e o app arredonda pra grade de semicolcheias
// (vira ritmo do Beat Lab ou partitura). É um rascunho do que você tocou, não transcrição perfeita.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as B from '../beats.js';
import * as N from '../notation.js';
import { clampBpm } from '../music.js';
import { audio, click, perfToCtx } from '../audio.js';
import { banner, toast, stars } from '../ui.js';
import { VOICE } from './beatlab.js';
import { playDoc, stopAll } from './partitura.js';
import { quantize, countNotes } from '../touchkit.js';
import { kitMarkup, svgEl } from '../kids/art.js';
import * as FB from '../feedback.js';
import { tipBox } from '../tipbox.js';
import { scheduler } from '../audio.js';

const KEY = 'setting-toque';
const conf = () => ({ bpm: 80, bars: 2, left: false, ...(store.get(KEY) ? store.get(KEY).data : {}) });
const setConf = (p) => store.upsert('setting', KEY, p);
// teclas do computador (no iPhone é só tocar na bateria): cada letra uma peça
const KEYS = { u: 'cr', i: 'rd', j: 'hh', h: 'ho', k: 'tt', o: 'mt', f: 'sn', l: 'ft', ' ': 'bd' };

export function mount(host) {
  let rec = null; let take = null; let metro = null; let tempoRun = null; let loopOn = true; let listening = false; const timers = [];
  const kit = h('div', { class: 'tk-kit tk-svgkit', role: 'group', 'aria-label': 'Bateria' });
  const panel = h('div');
  const status = h('p', { class: 'tr-status', 'aria-live': 'polite' });

  const hit = (id, perfMs) => {
    const c = audio(); VOICE[id](c.currentTime, 1);
    const el = kit.querySelector(`[data-p="${id}"]`) || kit.querySelector(`[data-pad="${id}"]`); if (el) { el.classList.remove('hit'); void el.getBoundingClientRect(); el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 200); }
    if (rec) rec.hits.push({ t: perfToCtx(perfMs) - rec.t0, id });
  };
  // a bateria é o mesmo desenho do "explorar a bateria": cada dedo vale um toque, então dá pra tocar com vários ao mesmo tempo
  const drawKit = () => {
    const c = conf();
    kit.classList.toggle('left', !!c.left);
    const art = svgEl(kitMarkup(), 'tk-art');
    art.addEventListener('pointerdown', (e) => { const g = e.target.closest('[data-p]'); if (!g) return; e.preventDefault(); hit(g.dataset.p, e.timeStamp || performance.now()); });
    const open = h('button', { type: 'button', class: 'tk-open', 'data-pad': 'ho', 'aria-label': 'Chimbal aberto', onpointerdown: (e) => { e.preventDefault(); hit('ho', e.timeStamp || performance.now()); } }, 'chimbal aberto', h('small', {}, 'H'));
    kit.replaceChildren(art, open);
  };
  const onKey = (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
    const id = KEYS[e.key.toLowerCase()]; if (!id) return;
    e.preventDefault(); hit(id, e.timeStamp || performance.now());
  };
  document.addEventListener('keydown', onKey);

  const stopMetro = () => { if (metro) { metro.forEach((o) => { try { o.stop(); } catch { /* já parou */ } }); metro = null; } };
  const record = () => {
    stopAll(); stopMetro(); stopTempo(); listening = false; timers.forEach(clearTimeout); timers.length = 0; const c = conf(); const ac = audio(); const q = 60 / c.bpm;
    const t0 = ac.currentTime + 0.3 + 4 * q; const beats = c.bars * 4;
    metro = [];
    for (let i = 0; i < 4; i++) metro.push(click(t0 - (4 - i) * q, i === 0 ? 2 : 1));
    for (let b = 0; b < beats; b++) metro.push(click(t0 + b * q, b % 4 === 0 ? 2 : 1, 0.6));
    rec = { t0, hits: [] }; take = null;
    kit.clock = () => perfToCtx(performance.now()) - t0; // segundos desde o 1º tempo (para quem testa tocando por script)
    // conta 4 grande na tela, junto com os cliques
    status.className = 'tr-status tk-count'; for (let i = 0; i < 4; i++) timers.push(setTimeout(() => { status.textContent = String(i + 1); }, (t0 - (4 - i) * q - ac.currentTime) * 1000));
    timers.push(setTimeout(() => { status.className = 'tr-status'; status.textContent = `toca! ${c.bars === 1 ? '1 compasso' : `${c.bars} compassos`}…`; }, (t0 - ac.currentTime) * 1000));
    status.textContent = '…';
    kit.classList.add('rec'); drawPanel();
    rec.timer = setTimeout(() => {
      const r = rec; rec = null; metro = null; kit.classList.remove('rec');
      take = { ...quantize(r.hits, { bpm: c.bpm, bars: c.bars }), bpm: c.bpm, raw: r.hits.length };
      FB.win(kit, { paul: false });
      status.textContent = take.dropped ? `${take.dropped} toque(s) longe da grade ficaram de fora.` : 'pronto! confere a partitura.';
      drawPanel();
    }, (t0 - ac.currentTime + beats * q + 0.35) * 1000);
  };
  const cancel = () => { if (rec) { clearTimeout(rec.timer); rec = null; } stopMetro(); stopTempo(); timers.forEach(clearTimeout); timers.length = 0; kit.classList.remove('rec'); status.className = 'tr-status'; };
  /** "Ouvir o tempo": o clique do andamento escolhido em loop (1 mais forte), pra sentir antes de gravar. */
  const stopTempo = () => { if (tempoRun) { tempoRun.stop(); tempoRun = null; } };
  const toggleTempo = () => {
    if (tempoRun) { stopTempo(); drawPanel(); return; }
    if (rec) return; stopAll(); audio(); const bpm = conf().bpm;
    tempoRun = scheduler((i) => ({ at: (i * 60) / bpm, play: (t) => click(t, i % 4 === 0 ? 2 : 1, 0.7) }));
    drawPanel();
  };

  const drawPanel = () => {
    const c = conf();
    const setBpm = (v) => setConf({ bpm: clampBpm(v) }).then(drawPanel);
    const doc = take && { title: 'Toquei na bateria de toque', bpm: take.bpm, bars: take.bars };
    panel.replaceChildren(...[
      h('section', { class: 'card pad tk-panel' },
        h('div', { class: 'row tk-line' }, h('span', { class: 'tp-lab' }, 'gravar compassos'),
          h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'Compassos' }, ...[1, 2, 4].map((n) => h('button', { type: 'button', class: `lib-tab${c.bars === n ? ' on' : ''}`, role: 'radio', 'aria-checked': String(c.bars === n), onclick: () => setConf({ bars: n }).then(drawPanel) }, String(n))))),
        h('div', { class: 'bl-tempo' },
          h('button', { class: 'bl-step', type: 'button', 'aria-label': 'menos 5 BPM', onclick: () => setBpm(c.bpm - 5) }, '−'), h('output', { class: 'bl-bpm' }, String(c.bpm)),
          h('button', { class: 'bl-step', type: 'button', 'aria-label': 'mais 5 BPM', onclick: () => setBpm(c.bpm + 5) }, '+'),
          rec ? h('button', { class: 'bl-play on', type: 'button', 'aria-label': 'Cancelar gravação', onclick: () => { cancel(); status.textContent = 'gravação cancelada.'; drawPanel(); } }, icon('stop', 26))
            : h('button', { class: 'bl-play tk-rec', type: 'button', 'aria-label': 'Gravar', onclick: record }, h('i', { class: 'tk-dot' }))),
        h('div', { class: 'row tk-line' }, h('button', { class: `btn small${tempoRun ? ' primary' : ''}`, type: 'button', 'aria-pressed': String(!!tempoRun), onclick: toggleTempo }, tempoRun ? '■ parar o tempo' : '🔊 ouvir o tempo')),
        h('button', { class: 'btn small', type: 'button', 'aria-pressed': String(!!c.left), onclick: () => setConf({ left: !c.left }).then(() => { drawKit(); drawPanel(); }) }, c.left ? 'canhota ✓' : 'canhota')),
      status,
      take ? h('section', { class: 'card pad tk-take' },
        h('p', { class: 'muted' }, `${countNotes(take.bars)} notas em ${take.bars.length === 1 ? '1 compasso' : `${take.bars.length} compassos`} · ${take.bpm} BPM`),
        ...take.bars.map((b) => { const f = h('figure', { class: 'cb-bar' }); f.innerHTML = N.toSVG(N.layout(b, { width: 340, full: true })); return f; }),
        h('div', { class: 'row tk-actions' },
          h('button', { class: `btn${listening ? ' primary' : ''}`, type: 'button', onclick: () => { if (listening) { stopAll(); listening = false; drawPanel(); return; } listening = true; playDoc(doc, { loop: loopOn, withClick: true, onEnd: () => { listening = false; drawPanel(); } }); drawPanel(); } }, icon(listening ? 'stop' : 'play', 14), listening ? ' parar' : ' ouvir'),
          h('button', { class: 'btn small', type: 'button', 'aria-pressed': String(loopOn), onclick: () => { loopOn = !loopOn; drawPanel(); } }, loopOn ? '↻ em loop ✓' : '↻ em loop'),
          take.bars.length === 1 ? h('button', { class: 'btn', type: 'button', onclick: async (e) => {
            const btn = e.currentTarget; const b = take.bars[0]; const beat = { id: 'novo', name: 'Toquei na bateria', style: 'Meus', bpm: take.bpm, steps: 16, kind: 'groove', rows: b.rows, mine: true };
            const r = await store.upsert('beat', null, { beat }); await store.upsert('beat', r.id, { beat: { ...beat, id: r.id, recId: r.id } });
            stars(btn); toast('salvo em Meus ritmos ✓', { action: 'abrir', onAction: () => { location.hash = '#/beatlab/meus'; } });
          } }, 'salvar em meus ritmos') : null,
          document.documentElement.classList.contains('aluno-on') ? null : h('button', { class: 'btn primary', type: 'button', onclick: async () => { stopAll(); const r = await store.upsert('partitura', null, { ...doc, created: Date.now() }); location.hash = `#/partitura/${r.id}`; } }, 'abrir na partitura'))) : null,
    ].filter(Boolean));
  };

  host.append(banner('Bateria de Toque', 'toca com os dedos'), kit, panel,
    h('p', { class: 'pad-x lib-note' }, 'dá pra tocar com vários dedos ao mesmo tempo. “ouvir o tempo” liga o clique no andamento escolhido; “gravar” conta 4 e grava 1, 2 ou 4 compassos. no computador: U prato, I condução, J chimbal, H aberto, K tom 1, O tom 2, F caixa, L surdo, espaço bumbo. no iPhone o som pode atrasar um pouquinho: é do aparelho. “gravar” arredonda o que você tocou pra semicolcheia mais perto: confere a partitura antes de usar em aula.'));
  drawKit(); drawPanel(); tipBox(host, 'toque');
  return () => { cancel(); stopAll(); stopTempo(); document.removeEventListener('keydown', onKey); };
}
