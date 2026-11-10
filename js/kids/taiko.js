// Monte seu ritmo, modo taiko: as notas descem em duas colunas, esquerda = agudo, direita = grave. Toque no lado certo na hora certa.
import { h } from '../util.js';
import { audio, click, tom, perfToCtx } from '../audio.js';
import { foodOf, cellOf } from '../kids-logic.js';
import { buildChart, judgeTap, sweep, summary, LADO_AGUDO, LADO_GRAVE } from './taiko-logic.js';

const LOOK = 1.7; // s que a nota leva pra descer
const COR = { agudo: '#1f6f78', grave: '#8a1a30' }; // petróleo e vinho (sem rosa, amarelo ou roxo)
const BARS = 4;
const soa = (side, t, v = 0.95) => (side === LADO_GRAVE ? tom(t, 95, v) : tom(t, 330, v * 0.85));

/** `ids`: 4 tempos do Monte seu ritmo. Devolve { el, dispose }. */
export function mountTaiko({ ids, bpm }) {
  const cells = ids.map(cellOf); let chart = []; let raf = 0; let t0 = 0; let state = 'idle'; let endAt = 0; let pop = null; const timers = [];
  const cv = h('canvas', { class: 'tk-cv', 'aria-label': 'Notas descendo: esquerda é agudo, direita é grave' });
  const pads = [LADO_AGUDO, LADO_GRAVE].map((s) => h('button', { type: 'button', class: `tk-pad ${s}`, 'aria-label': `${s} (${s === LADO_AGUDO ? 'esquerda' : 'direita'})`, 'data-side': s },
    h('b', {}, s), h('small', {}, s === LADO_AGUDO ? '◀ esquerda' : 'direita ▶')));
  const info = h('p', { class: 'kd-q tk-info', 'aria-live': 'polite' }, 'esquerda = som agudo · direita = som grave');
  const go = h('button', { class: 'kd-btn', type: 'button' }, '▶ jogar');
  const res = h('div', { class: 'tk-res', hidden: true });
  const food = h('p', { class: 'tk-food' }, ...ids.map((id) => h('span', {}, foodOf(id).emoji)));
  const el = h('div', { class: 'tk' }, food, info, h('div', { class: 'tk-wrap' }, cv), h('div', { class: 'tk-pads' }, ...pads), go, res);

  const size = () => { const r = cv.getBoundingClientRect(); const d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); return d; };
  const draw = () => {
    raf = requestAnimationFrame(draw); const g = cv.getContext('2d'); if (!g) return;
    { const r = cv.getBoundingClientRect(); const d = Math.min(2, window.devicePixelRatio || 1); if (r.width && (cv.width !== Math.round(r.width * d) || cv.height !== Math.round(r.height * d))) size(); } const W = cv.width, H = cv.height, now = audio(false).currentTime; const hitY = H * 0.84;
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, 0, W / 2, H); g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(W / 2, 0, W / 2, H);
    g.strokeStyle = '#fbf7ee'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, hitY); g.lineTo(W, hitY); g.stroke();
    for (const [i, s] of [LADO_AGUDO, LADO_GRAVE].entries()) { g.strokeStyle = COR[s]; g.lineWidth = 4; g.beginPath(); g.arc(W * (i ? 0.75 : 0.25), hitY, W * 0.09, 0, 7); g.stroke(); }
    if (state === 'play') {
      sweep(chart, now - t0);
      for (const n of chart) {
        if (n.res && n.res !== 'faltou' && n.res !== 'lado') continue; const dt = n.t + t0 - now; if (dt > LOOK || dt < -0.4) continue;
        const y = hitY - (dt / LOOK) * hitY; const x = W * (n.side === LADO_AGUDO ? 0.25 : 0.75); const r = W * (n.side === LADO_GRAVE ? 0.085 : 0.065);
        g.globalAlpha = n.res ? 0.35 : 1; g.fillStyle = COR[n.side]; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.lineWidth = 4; g.strokeStyle = '#fbf7ee'; g.stroke(); g.globalAlpha = 1;
      }
      if (pop && now - pop.at < 0.6) { g.fillStyle = '#fbf7ee'; g.font = `800 ${W * 0.07}px system-ui,sans-serif`; g.textAlign = 'center'; g.fillText(pop.txt, W / 2, hitY - W * 0.14 - (now - pop.at) * 40); }
      if (now - t0 > (chart.length ? chart[chart.length - 1].t : 0) + 0.7) finish();
    }
  };
  const finish = () => {
    state = 'idle'; const s = summary(chart);
    res.hidden = false; res.replaceChildren(h('b', {}, `${s.acc}%`), h('p', {}, `${s.hits} de ${s.total} notas certas`), h('small', {}, `perfeito ${s.perfeito} · bom ${s.bom} · lado trocado ${s.lado} · faltou ${s.faltou}`));
    info.textContent = s.acc >= 90 ? 'muito bom! ⭐' : s.acc >= 70 ? 'quase lá! de novo?' : 'bora de novo, devagar também vale';
    go.textContent = '↻ jogar de novo'; go.disabled = false;
  };
  const start = () => {
    const c = audio(); const q = 60 / bpm; chart = buildChart(cells, bpm, BARS); res.hidden = true; pop = null; state = 'play';
    t0 = c.currentTime + 0.2 + 4 * q; for (let i = 0; i < 4; i++) click(t0 - (4 - i) * q, i === 0 ? 2 : 1, 0.5);
    for (let b = 0; b < BARS * 4; b++) click(t0 + b * q, b % 4 === 0 ? 2 : 1, 0.22);
    info.textContent = 'contando… esquerda agudo, direita grave'; go.disabled = true;
  };
  const tap = (side, ts) => {
    if (state !== 'play') { const c = audio(); soa(side, c.currentTime + 0.01); return; }
    const c = audio(); soa(side, c.currentTime + 0.005); const now = c.currentTime;
    const t = (ts ? perfToCtx(ts) : now) - t0; const r = judgeTap(chart, Math.abs(t - (now - t0)) > 0.25 ? now - t0 : t, side);
    pop = { at: now, txt: r.kind === 'perfeito' ? 'perfeito!' : r.kind === 'bom' ? 'bom' : r.kind === 'lado' ? 'outro lado!' : '' };
  };
  for (const p of pads) p.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(p.dataset.side, e.timeStamp); p.classList.add('hit'); setTimeout(() => p.classList.remove('hit'), 90); });
  const onKey = (e) => { if (e.repeat || /input|textarea|select/i.test(e.target.tagName)) return; const k = e.key.toLowerCase(); const s = ['arrowleft', 'f', 'a'].includes(k) ? LADO_AGUDO : ['arrowright', 'j', 'l'].includes(k) ? LADO_GRAVE : null; if (s) { e.preventDefault(); tap(s, e.timeStamp); } };
  document.addEventListener('keydown', onKey);
  go.addEventListener('click', () => { audio(); start(); });
  window.__taiko = { get chart() { return chart; }, tap, get t0() { return t0; } }; // só pra teste
  raf = requestAnimationFrame(draw);
  return { el, dispose() { cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); timers.forEach(clearTimeout); state = 'idle'; delete window.__taiko; } };
}
