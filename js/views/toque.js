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
import { kitTheme, putLogo, flash, themeRow, pieceAt } from '../kids/kit-theme.js';

const KEY = 'setting-toque';
const conf = () => ({ bpm: 80, left: false, count: true, click: true, grid: true, ...(store.get(KEY) ? store.get(KEY).data : {}) });
const setConf = (p) => store.upsert('setting', KEY, p);
// teclas do computador (no iPhone é só tocar na bateria): cada letra uma peça
const KEYS = { u: 'cr', i: 'rd', j: 'hh', h: 'ho', k: 'tt', o: 'mt', f: 'sn', l: 'ft', ' ': 'bd' };

export function mount(host) {
  let rec = null; let take = null; let loop = null; let last = null; let metro = null; let tempoRun = null; let loopOn = true; let listening = false; const timers = [];
  const kit = h('div', { class: 'tk-kit tk-svgkit', role: 'group', 'aria-label': 'Bateria' });
  const panel = h('div');
  const status = h('p', { class: 'tr-status', 'aria-live': 'polite' });

  const hit = (id, perfMs) => {
    const c = audio(); VOICE[id](c.currentTime, 1); // o som primeiro: nada pode atrasar a batida
    flash(kit.querySelector(`[data-p="${id}"]`));
    if (rec) rec.hits.push({ t: perfToCtx(perfMs) - rec.t0, id });
  };
  // a bateria é o mesmo desenho do "explorar a bateria": cada dedo vale um toque, então dá pra tocar com vários ao mesmo tempo
  const drawKit = () => {
    const c = conf();
    kit.classList.toggle('left', !!c.left);
    const art = svgEl(kitMarkup(), 'tk-art'); putLogo(art);
    kit.dataset.kitTheme = kitTheme();
    art.addEventListener('pointerdown', (e) => { const g = pieceAt(art, e); if (!g) return; e.preventDefault(); hit(g.dataset.p, e.timeStamp || performance.now()); });
    kit.replaceChildren(art, themeRow(drawKit));
  };
  const onKey = (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
    const id = KEYS[e.key.toLowerCase()]; if (!id) return;
    e.preventDefault(); hit(id, e.timeStamp || performance.now());
  };
  document.addEventListener('keydown', onKey);

  const MAX = 30; // segundos de gravação, no máximo
  const stopMetro = () => { if (metro) { metro.forEach((o) => { try { o.stop(); } catch { /* já parou */ } }); metro = null; } };
  const fmt = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
  const prog = h('i', { class: 'tk-prog' }); const progBox = h('div', { class: 'tk-progress', 'aria-hidden': 'true' }, prog);
  const stopLoop = () => { if (loop) { loop.run.stop(); cancelAnimationFrame(loop.raf); loop = null; prog.style.width = '0'; } };
  const cancelRec = () => { if (rec) { clearTimeout(rec.timer); clearInterval(rec.tick); rec = null; } kit.classList.remove('rec'); };

  /** Gravar: conta 4 (se ligado) e grava até 30 s com o clique. Parou (ou deu 30 s)? Já toca em loop, sem esperar. */
  const record = () => {
    stopAll(); stopMetro(); stopTempo(); stopLoop(); cancelRec(); listening = false; timers.forEach(clearTimeout); timers.length = 0; take = null; last = null;
    const c = conf(); const ac = audio(); const q = 60 / c.bpm; const lead = c.count ? 4 * q : 0.2;
    const t0 = ac.currentTime + 0.3 + lead;
    metro = [];
    if (c.count) for (let i = 0; i < 4; i++) metro.push(click(t0 - (4 - i) * q, i === 0 ? 2 : 1));
    if (c.click) for (let b = 0; b * q < MAX + q; b++) metro.push(click(t0 + b * q, b % 4 === 0 ? 2 : 1, 0.5));
    rec = { t0, hits: [] };
    kit.clock = () => perfToCtx(performance.now()) - t0; // segundos desde o 1º tempo (para quem testa tocando por script)
    status.className = 'tr-status tk-count';
    if (c.count) for (let i = 0; i < 4; i++) timers.push(setTimeout(() => { status.textContent = String(i + 1); }, (t0 - (4 - i) * q - ac.currentTime) * 1000));
    status.textContent = c.count ? '…' : `● gravando 0:00 / ${fmt(MAX)}`;
    prog.style.width = '0';
    rec.tick = setInterval(() => { let el = perfToCtx(performance.now()) - t0; if (el < 0) { if (c.count) return; el = 0; } status.className = 'tr-status'; status.textContent = `● gravando ${fmt(el)} / ${fmt(MAX)}`; prog.style.width = `${Math.min(100, (el / MAX) * 100)}%`; }, 120);
    rec.timer = setTimeout(finishRec, (t0 - ac.currentTime + MAX) * 1000);
    kit.classList.add('rec'); drawPanel();
  };
  /** Parou a gravação (botão ou 30 s): ajusta ao compasso (se ligado) e começa o loop na hora. */
  function finishRec() {
    const r = rec; if (!r) return;
    clearTimeout(r.timer); clearInterval(r.tick); rec = null; stopMetro(); kit.classList.remove('rec'); timers.forEach(clearTimeout); timers.length = 0; prog.style.width = '0';
    const c = conf(); const q = 60 / c.bpm; const bar4 = 4 * q; const el = Math.min(MAX, perfToCtx(performance.now()) - r.t0);
    const hits = r.hits.filter((x) => x.t > -0.08 && x.t <= MAX).map((x) => ({ ...x, t: Math.max(0, x.t) }));
    status.className = 'tr-status';
    if (!hits.length || el <= 0.2) { status.textContent = el <= 0.2 ? 'gravação cancelada.' : 'não peguei nenhum toque. tenta de novo!'; drawPanel(); return; }
    let len; let bars = 0;
    if (c.grid) { const maxBars = Math.max(1, Math.floor(MAX / bar4)); bars = Math.min(maxBars, Math.max(1, Math.ceil((el - 0.05) / bar4))); len = bars * bar4; } else len = Math.max(0.5, el);
    const kept = hits.filter((x) => x.t < len);
    take = c.grid && [1, 2, 4].includes(bars) ? { ...quantize(kept, { bpm: c.bpm, bars }), bpm: c.bpm, raw: kept.length } : null; // partitura só quando cabe em 1, 2 ou 4 compassos
    last = { len, hits: kept };
    FB.win(kit, { paul: false });
    startLoop();
  }
  /** Toca o que você gravou em loop (as peças acendem junto). */
  const startLoop = () => {
    if (!last) return; stopLoop(); stopAll(); stopTempo(); listening = false;
    const c = conf(); const ac = audio(); const q = 60 / c.bpm; const { len, hits } = last;
    const evs = hits.map((x) => ({ t: x.t, id: x.id }));
    if (c.click) for (let b = 0; b * q < len - 0.01; b++) evs.push({ t: b * q, click: b % 4 === 0 ? 2 : 1 });
    evs.sort((x, y) => x.t - y.t); const n = evs.length; const start = ac.currentTime + 0.12;
    const run = scheduler((i) => { const e = evs[i % n]; return { at: Math.floor(i / n) * len + e.t, play: (t) => { if (e.click) click(t, e.click, 0.5); else VOICE[e.id](t, 1); }, ui: e.id ? () => flash(kit.querySelector(`[data-p="${e.id}"]`)) : undefined }; });
    loop = { run, len, raf: 0 };
    const frame = () => { if (!loop) return; prog.style.width = `${((((ac.currentTime - start) % len) + len) % len / len) * 100}%`; loop.raf = requestAnimationFrame(frame); }; frame();
    status.className = 'tr-status'; status.textContent = `em loop · ${fmt(len)} · ${hits.length} toques`;
    drawPanel();
  };
  const cancel = () => { cancelRec(); stopMetro(); stopTempo(); stopLoop(); timers.forEach(clearTimeout); timers.length = 0; status.className = 'tr-status'; };
  /** "Ouvir o tempo": o clique do andamento escolhido em loop (1 mais forte), pra sentir antes de gravar. */
  const stopTempo = () => { if (tempoRun) { tempoRun.stop(); tempoRun = null; } };
  const toggleTempo = () => {
    if (tempoRun) { stopTempo(); drawPanel(); return; }
    if (rec) return; stopAll(); stopLoop(); audio(); const bpm = conf().bpm;
    tempoRun = scheduler((i) => ({ at: (i * 60) / bpm, play: (t) => click(t, i % 4 === 0 ? 2 : 1, 0.7) }));
    drawPanel();
  };

  const drawPanel = () => {
    const c = conf();
    const setBpm = (v) => setConf({ bpm: clampBpm(v) }).then(drawPanel);
    const doc = take && { title: 'Toquei na bateria de toque', bpm: take.bpm, bars: take.bars };
    const chip = (key, label) => h('button', { type: 'button', class: `lib-tab${c[key] ? ' on' : ''}`, 'aria-pressed': String(!!c[key]), onclick: () => setConf({ [key]: !c[key] }).then(drawPanel) }, label);
    const mainBtns = rec ? [h('button', { class: 'btn primary tk-big', type: 'button', onclick: finishRec }, icon('stop', 16), ' parar'), h('button', { class: 'btn', type: 'button', onclick: () => { cancel(); status.textContent = 'gravação cancelada.'; drawPanel(); } }, 'cancelar')]
      : loop ? [h('button', { class: 'btn primary tk-big', type: 'button', onclick: () => { stopLoop(); status.textContent = 'parado.'; drawPanel(); } }, icon('stop', 16), ' parar'), h('button', { class: 'btn tk-big', type: 'button', onclick: record }, '↺ recomeçar')]
      : last ? [h('button', { class: 'btn primary tk-big', type: 'button', onclick: startLoop }, icon('play', 16), ' tocar em loop'), h('button', { class: 'btn tk-big', type: 'button', onclick: record }, '↺ recomeçar')]
      : [h('button', { class: 'btn primary tk-big tk-rec', type: 'button', onclick: record }, h('i', { class: 'tk-dot' }), ` gravar (até ${MAX} s)`)];
    panel.replaceChildren(...[
      h('section', { class: 'card pad tk-panel' },
        h('div', { class: 'row tk-line tk-ctrls' }, ...mainBtns),
        rec || loop ? progBox : null,
        h('div', { class: 'bl-tempo' },
          h('button', { class: 'bl-step', type: 'button', 'aria-label': 'menos 5 BPM', onclick: () => setBpm(c.bpm - 5) }, '−'), h('output', { class: 'bl-bpm' }, String(c.bpm)),
          h('button', { class: 'bl-step', type: 'button', 'aria-label': 'mais 5 BPM', onclick: () => setBpm(c.bpm + 5) }, '+'),
          h('span', { class: 'tp-lab' }, 'BPM')),
        h('div', { class: 'chips lib-tabs tk-opts', role: 'group', 'aria-label': 'Opções da gravação' }, chip('count', 'contagem'), chip('click', 'clique'), chip('grid', 'ao compasso')),
        h('div', { class: 'row tk-line' }, h('button', { class: `btn small${tempoRun ? ' primary' : ''}`, type: 'button', 'aria-pressed': String(!!tempoRun), onclick: toggleTempo }, tempoRun ? '■ parar o tempo' : '🔊 ouvir o tempo'),
          h('button', { class: 'btn small', type: 'button', 'aria-pressed': String(!!c.left), onclick: () => setConf({ left: !c.left }).then(() => { drawKit(); drawPanel(); }) }, c.left ? 'canhota ✓' : 'canhota'))),
      status,
      take ? h('section', { class: 'card pad tk-take' },
        h('p', { class: 'muted' }, `${countNotes(take.bars)} notas em ${take.bars.length === 1 ? '1 compasso' : `${take.bars.length} compassos`} · ${take.bpm} BPM`),
        ...take.bars.map((b) => { const f = h('figure', { class: 'cb-bar' }); f.innerHTML = N.toSVG(N.layout(b, { width: 340, full: true })); return f; }),
        h('div', { class: 'row tk-actions' },
          h('button', { class: `btn${listening ? ' primary' : ''}`, type: 'button', onclick: () => { if (listening) { stopAll(); listening = false; drawPanel(); return; } stopLoop(); listening = true; playDoc(doc, { loop: loopOn, withClick: true, onEnd: () => { listening = false; drawPanel(); } }); drawPanel(); } }, icon(listening ? 'stop' : 'play', 14), listening ? ' parar' : ' ouvir na partitura'),
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
    h('p', { class: 'pad-x lib-note' }, 'dá pra tocar com vários dedos ao mesmo tempo. “ouvir o tempo” liga o clique no andamento escolhido; “gravar” conta 4 e grava até 30 segundos; ao parar, o que você tocou fica em loop (parar / recomeçar). no computador: U prato, I condução, J chimbal, H aberto, K tom 1, O tom 2, F caixa, L surdo, espaço bumbo. no iPhone o som pode atrasar um pouquinho: é do aparelho. o loop toca do jeitinho que você tocou; a partitura (quando cabe em 1, 2 ou 4 compassos) arredonda pra semicolcheia mais perto: confere antes de usar em aula.'));
  drawKit(); drawPanel(); tipBox(host, 'toque');
  return () => { cancel(); stopAll(); stopTempo(); document.removeEventListener('keydown', onKey); };
}
