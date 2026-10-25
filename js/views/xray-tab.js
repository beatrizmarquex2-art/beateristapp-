// Raio-x do groove (fase M4, aba do Juiz de Tempo). Dois jeitos:
// com metrônomo (contagem + 8/16/32 compassos): nota, correu/arrastou compasso a compasso, mapa de calor por subdivisão;
// livre (tocando junto de uma música): curva de BPM ao longo do tempo.
// Os dois geram a "impressão digital rítmica", uma arte única feita do jeito de tocar, pra compartilhar.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as T from '../timing.js';
import * as X from '../xray.js';
import { tempoOf } from '../pitch.js';
import { toast } from '../ui.js';
import { parts as P } from './tempo.js';

const KIND = 'xray';
const MAX_FREE = 180; // segundos

export function xrayTab(mic, listen) {
  const el = h('section', { class: 'tp-pane xr' });
  let run = null;
  const x = () => ({ xmode: 'metro', xbars: 16, ...P.cfg() });

  function draw() {
    const c = x(); const lat = P.latOf(c);
    const who = h('select', { 'aria-label': 'Quem vai tocar', onchange: (e) => P.save({ who: e.target.value }) },
      h('option', { value: '' }, 'eu (Bea)'), ...P.students().map((s) => h('option', { value: s.id, selected: c.who === s.id }, `aluno: ${s.data.name}`)));
    const metro = c.xmode === 'metro';
    el.replaceChildren(
      h('div', { class: 'card pad tp-setup' },
        P.line('modo', P.chips([['metro', 'com metrônomo'], ['livre', 'livre (música)']], c.xmode, (v) => P.save({ xmode: v }).then(draw), 'Modo do raio-x')),
        metro ? P.bpmRow(c, (v) => P.save({ bpm: P.clampBpm(v) }).then(draw)) : null,
        metro ? P.line('notas', P.chips([[1, 'semín.', 'semínimas'], [2, 'colch.', 'colcheias'], [4, 'semic.', 'semicolcheias'], [3, 'terc.', 'tercinas']], c.sub, (v) => P.save({ sub: v }).then(draw), 'Subdivisão')) : null,
        metro ? P.line('compassos', P.chips([[8, '8', '8 compassos'], [16, '16', '16 compassos'], [32, '32', '32 compassos']], c.xbars, (v) => P.save({ xbars: v }).then(draw), 'Compassos')) : null,
        metro ? P.line('clique', P.chips([[false, 'alto-falante'], [true, 'fone']], c.fone, (v) => P.save({ fone: v }).then(draw), 'Como ouvir o clique')) : null,
        P.line('quem', who),
        h('p', { class: 'tp-hint' }, metro ? `${T.SUBS[c.sub]} · ${c.xbars} compassos (${Math.round((c.xbars * 4 * 60) / c.bpm)} s) · ${c.fone ? 'clique no fone' : 'clique só na contagem'}` : 'dá play numa música (em outro aparelho ou caixinha) e toca junto. até 3 minutos. no fim: se correu ou arrastou.'),
        h('div', { class: 'tp-foot' },
          metro ? h('button', { class: 'tp-cal', type: 'button', onclick: () => P.calibrate(mic, listen, draw) }, icon('mic', 15), lat ? ` calibrado ${lat.ms} ms` : ' calibrar meu iPhone') : h('span'),
          h('button', { class: 'bl-play tp-go', type: 'button', 'aria-label': 'Começar raio-x', onclick: metro ? startMetro : startFree }, icon('play', 26)))),
      history());
  }

  function startMetro() {
    const c = x(); const lat = P.latOf(c); const latS = lat ? lat.ms / 1000 : 0;
    const beatsTotal = 4 + c.xbars * 4;
    const cl = P.clicks(mic.ctx, { bpm: c.bpm, beats: beatsTotal, audibleBeats: c.fone ? beatsTotal : 4 });
    const exStart = cl.start + 4 * (60 / c.bpm); const slots = T.grid(exStart, c.bpm, c.xbars, c.sub); const step = 60 / c.bpm / c.sub;
    const got = []; const light = h('div', { class: 'tp-light', 'aria-hidden': 'true' });
    const msg = h('p', { class: 'tp-live' }, 'contagem…'); const count = h('small', { class: 'muted' }, ''); const barEl = h('small', { class: 'muted' }, '');
    el.replaceChildren(h('div', { class: 'card pad tp-running' }, light, msg, barEl, count, h('button', { class: 'btn', type: 'button', onclick: () => { run && run.cancel(); listen(null); draw(); } }, 'parar')));
    listen((ev) => { if (ev.t - latS < exStart - step * 0.45) return; got.push(ev.t); count.textContent = `${got.length} batidas`; });
    const stopPulse = P.pulse(mic.ctx, cl.times, light, finish, 60 / c.bpm + 0.2);
    const tick = setInterval(() => { const t = mic.ctx.currentTime; if (t >= exStart) { msg.textContent = c.fone ? 'toca junto!' : 'segura o tempo!'; barEl.textContent = `compasso ${Math.min(c.xbars, Math.floor((t - exStart) / (240 / c.bpm)) + 1)} de ${c.xbars}`; } }, 120);
    run = { cancel: () => { clearInterval(tick); cl.cancel(); stopPulse(); } };
    async function finish() {
      clearInterval(tick); listen(null); run = null;
      const r = T.judge(got, slots, { latency: latS, step }); const devs = r.hits.map((hh) => (hh.dev == null ? null : Math.round(hh.dev)));
      const dr = X.barDrift(devs, 4 * c.sub);
      const rec = { mode: 'metro', at: Date.now(), bpm: c.bpm, sub: c.sub, bars: c.xbars, who: c.who || '', calibrated: !!lat, score: r.score, mean: r.mean, sd: r.sd, missed: r.missed, total: r.total, devs, slope: Math.round(dr.slope * 100) / 100 };
      await store.upsert(KIND, null, rec); show(rec);
    }
  }

  function startFree() {
    const c = x(); const got = []; const t0 = mic.ctx.currentTime;
    const big = h('strong', { class: 'tp-score' }, '—'); const sub = h('small', { class: 'muted' }, 'tocando… o BPM aparece depois de uns compassos');
    const clock = h('p', { class: 'tp-live' }, '0:00');
    el.replaceChildren(h('div', { class: 'card pad tp-running' }, clock, big, h('span', { class: 'tp-of' }, 'BPM agora'), sub,
      h('button', { class: 'btn primary', type: 'button', onclick: () => finish() }, 'terminar')));
    listen((ev) => { got.push(ev.t); const w = got.filter((t) => ev.t - t < 6); const r = tempoOf(w); if (r && r.confidence >= 50) { big.textContent = String(r.bpm); } sub.textContent = `${got.length} batidas ouvidas`; });
    const tick = setInterval(() => { const s = Math.floor(mic.ctx.currentTime - t0); clock.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; if (s >= MAX_FREE) finish(); }, 250);
    run = { cancel: () => clearInterval(tick) };
    async function finish() {
      if (!run) return; clearInterval(tick); listen(null); run = null;
      const tc = X.tempoCurve(got);
      if (!tc.points.length) { toast('preciso de mais batidas pra ver a curva (toca uns 20 segundos).'); draw(); return; }
      // "desvio" no modo livre: quanto cada intervalo fugiu do pulso daquele trecho (vira a impressão digital)
      const devs = []; for (let i = 1; i < got.length; i++) { const w = got.filter((t) => Math.abs(t - got[i]) < 3); const r = tempoOf(w); if (r) { const beat = 60 / r.exact; const ioi = got[i] - got[i - 1]; const units = Math.max(1, Math.round(ioi / (beat / 2))); devs.push(Math.round((ioi - units * beat / 2) * 1000)); } }
      const rec = { mode: 'livre', at: Date.now(), who: c.who || '', dur: Math.round(got[got.length - 1] - got[0]), hits: got.length, start: Math.round(tc.start), end: Math.round(tc.end), slopePerMin: Math.round(tc.slopePerMin * 10) / 10, points: tc.points.map((p) => [Math.round(p.t * 10) / 10, Math.round(p.bpm * 10) / 10]), devs: devs.slice(0, 256) };
      await store.upsert(KIND, null, rec); show(rec);
    }
  }

  /* ---------- resultado ---------- */
  function show(d) {
    const metro = d.mode === 'metro'; const per = metro ? 4 * d.sub : 8;
    const name = d.who ? (store.get(d.who) ? store.get(d.who).data.name : 'aluno') : 'você';
    const drift = metro ? X.driftText(d.slope, d.bars) : X.bpmDriftText(d.slopePerMin, d.dur);
    el.replaceChildren(
      h('div', { class: 'card pad tp-result xr-result' },
        h('div', { class: 'tp-head' },
          metro ? h('div', { class: 'tp-scorebox' }, h('strong', { class: 'tp-score' }, String(d.score)), h('span', { class: 'tp-of' }, '/100'))
            : h('div', { class: 'tp-scorebox' }, h('strong', { class: 'tp-score' }, String(d.end)), h('span', { class: 'tp-of' }, 'BPM')),
          h('div', {}, h('small', { class: 'lib-kicker' }, metro ? `${d.bpm} BPM · ${T.SUBS[d.sub]} · ${d.bars} comp.` : `livre · ${Math.floor(d.dur / 60)}:${String(d.dur % 60).padStart(2, '0')} · ${d.hits} batidas`),
            h('p', { class: 'tp-summary' }, metro ? `${name} ${P.tend(d.mean)} · ±${d.sd} ms` : `${name} começou em ${d.start} e terminou em ${d.end} BPM`),
            h('span', { class: `xr-drift ${drift.kind}` }, drift.kind === 'firme' ? '● ' : drift.kind === 'correu' ? '▲ ' : '▼ ', drift.text))),
        h('h3', { class: 'xr-h' }, metro ? 'compasso a compasso' : 'andamento ao longo da música'),
        metro ? driftChart(d) : bpmChart(d),
        metro ? h('h3', { class: 'xr-h' }, 'mapa de calor: onde cada parte do tempo cai') : null,
        metro ? heat(d) : null,
        h('h3', { class: 'xr-h' }, 'impressão digital rítmica'),
        art(d, per),
        !metro || d.calibrated ? null : h('p', { class: 'tp-hint' }, 'sem calibração: os números incluem o atraso do aparelho.'),
        h('div', { class: 'bl-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: draw }, 'de novo'),
          h('button', { class: 'btn', type: 'button', onclick: () => shareArt(d, per) }, icon('photo', 16), ' compartilhar arte'))),
      history());
  }

  function driftChart(d) {
    const dr = X.barDrift(d.devs, 4 * d.sub); const W = 320, H = 110, mid = H / 2, max = 40; const n = dr.bars.length;
    const svg = P.svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'tp-chart', role: 'img', 'aria-label': `Desvio médio por compasso. ${X.driftText(dr.slope, n).text}` });
    const X0 = 30, xs = (i) => X0 + (i + 0.5) * ((W - X0 - 4) / n), ys = (v) => mid - (Math.max(-max, Math.min(max, v)) / max) * (mid - 10);
    for (const [v, t] of [[0, '0'], [20, '+20'], [-20, '−20']]) { svg.append(P.svgEl('line', { x1: X0 - 4, x2: W, y1: ys(v), y2: ys(v), class: v === 0 ? 'tp-axis' : 'tp-grid' })); const tx = P.svgEl('text', { x: 0, y: ys(v) + 4, class: 'tp-ax' }); tx.textContent = t; svg.append(tx); }
    dr.bars.forEach((v, i) => { if (v == null) return; svg.append(P.svgEl('rect', { x: xs(i) - 3, y: Math.min(ys(v), mid), width: 6, height: Math.abs(ys(v) - mid) || 1, fill: X.devColor(v) })); });
    svg.append(P.svgEl('line', { x1: xs(0), y1: ys(dr.icpt), x2: xs(n - 1), y2: ys(dr.icpt + dr.slope * (n - 1)), class: 'xr-trend' }));
    return h('figure', { class: 'tp-fig' }, svg, h('figcaption', {}, '↑ atrasou · ↓ adiantou · cada barra é um compasso · linha tracejada = tendência'));
  }
  function bpmChart(d) {
    const pts = d.points; const W = 320, H = 120; const bs = pts.map((p) => p[1]); const lo = Math.floor(Math.min(...bs) - 3), hi = Math.ceil(Math.max(...bs) + 3);
    const tmax = Math.max(...pts.map((p) => p[0]), 1); const X0 = 32;
    const xs = (t) => X0 + (t / tmax) * (W - X0 - 6), ys = (b) => H - 14 - ((b - lo) / Math.max(hi - lo, 1)) * (H - 26);
    const svg = P.svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'tp-chart', role: 'img', 'aria-label': `Curva de BPM de ${d.start} a ${d.end}` });
    for (const b of [lo, Math.round((lo + hi) / 2), hi]) { svg.append(P.svgEl('line', { x1: X0 - 4, x2: W, y1: ys(b), y2: ys(b), class: 'tp-grid' })); const tx = P.svgEl('text', { x: 0, y: ys(b) + 4, class: 'tp-ax' }); tx.textContent = String(b); svg.append(tx); }
    svg.append(P.svgEl('polyline', { points: pts.map((p) => `${xs(p[0])},${ys(p[1])}`).join(' '), class: 'xr-curve' }));
    const tr = X.trend(pts.map((p) => p[0]), bs); svg.append(P.svgEl('line', { x1: xs(pts[0][0]), y1: ys(tr.icpt + tr.slope * pts[0][0]), x2: xs(pts[pts.length - 1][0]), y2: ys(tr.icpt + tr.slope * pts[pts.length - 1][0]), class: 'xr-trend' }));
    const tl = P.svgEl('text', { x: W - 4, y: H - 2, class: 'tp-ax', 'text-anchor': 'end' }); tl.textContent = `${Math.round(tmax)} s`; svg.append(tl);
    return h('figure', { class: 'tp-fig' }, svg, h('figcaption', {}, 'BPM medido a cada trecho de 6 s · linha tracejada = tendência'));
  }
  function heat(d) {
    const per = 4 * d.sub; const rows = X.heatmap(d.devs, per); const labels = T.POS_LABELS[d.sub];
    const g = h('div', { class: 'xr-heat', role: 'table', 'aria-label': 'Mapa de calor do desvio por posição' });
    g.style.setProperty('--cols', per);
    g.append(h('span', { class: 'xr-hl' }), ...Array.from({ length: per }, (_, k) => h('span', { class: `xr-hc${k % d.sub === 0 ? ' beat' : ''}` }, k % d.sub === 0 ? String(k / d.sub + 1) : labels[k % d.sub])));
    rows.forEach((r) => {
      g.append(h('span', { class: 'xr-hl' }, r.from === r.to ? `c.${r.from}` : `c.${r.from}–${r.to}`));
      r.cells.forEach((cel) => g.append(h('span', { class: 'xr-cell', style: { background: X.devColor(cel.dev), opacity: cel.hit ? 0.35 + 0.65 * cel.hit : 1 }, title: cel.dev == null ? 'sem batida' : `${cel.dev > 0 ? '+' : ''}${cel.dev} ms` }, cel.dev == null ? '×' : Math.abs(cel.dev) >= 10 ? (cel.dev > 0 ? '+' : '−') + Math.abs(cel.dev) : '')));
    });
    return h('div', { class: 'xr-heatwrap' }, g, h('p', { class: 'tp-hint' }, 'verde = no tempo · azul = adiantou · vermelho = atrasou · número = ms quando passa de 10 · × = não tocou'));
  }
  function art(d, per) {
    const fp = X.fingerprint(d.devs, per, { size: 320, seed: X.seedOf(d.devs) });
    const svg = P.svgEl('svg', { viewBox: `0 0 ${fp.size} ${fp.size}`, class: 'xr-art', role: 'img', 'aria-label': 'Impressão digital rítmica: arte feita com as batidas' });
    svg.append(P.svgEl('rect', { x: 0, y: 0, width: fp.size, height: fp.size, fill: '#f3f0e8' }));
    fp.rings.forEach((r, i) => svg.append(P.svgEl('circle', { cx: fp.c, cy: fp.c, r, fill: 'none', stroke: '#1b1818', 'stroke-opacity': i === 0 || i === fp.rings.length - 1 ? 0.5 : 0.08 })));
    fp.spokes.forEach((s) => svg.append(P.svgEl('line', { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, stroke: s.beat ? '#b5162b' : '#1b1818', 'stroke-opacity': s.beat ? 0.45 : 0.08 })));
    if (fp.path.length > 1) svg.append(P.svgEl('polyline', { points: fp.path.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '), fill: 'none', stroke: '#1b1818', 'stroke-opacity': 0.25, 'stroke-width': 0.8 }));
    fp.pts.forEach((p) => svg.append(P.svgEl('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: p.r.toFixed(1), fill: p.miss ? 'none' : p.color, stroke: p.miss ? '#b5162b' : 'none', 'stroke-width': 1 })));
    return h('figure', { class: 'xr-artbox' }, svg, h('figcaption', {}, 'cada ponto é uma batida: a volta é o compasso (o 1 em cima), cada anel um compasso. pra fora = atrasou, pra dentro = adiantou. ninguém toca igual.'));
  }
  function shareArt(d, per) {
    const S = 1080; const fp = X.fingerprint(d.devs, per, { size: 920, seed: X.seedOf(d.devs) });
    const c = document.createElement('canvas'); c.width = S; c.height = S + 160; const g = c.getContext('2d');
    g.fillStyle = '#f3f0e8'; g.fillRect(0, 0, c.width, c.height); g.translate((S - fp.size) / 2, 110);
    fp.rings.forEach((r, i) => { g.beginPath(); g.arc(fp.c, fp.c, r, 0, Math.PI * 2); g.strokeStyle = `rgba(27,24,24,${i === 0 || i === fp.rings.length - 1 ? 0.5 : 0.08})`; g.lineWidth = 2; g.stroke(); });
    fp.spokes.forEach((s) => { g.beginPath(); g.moveTo(s.x1, s.y1); g.lineTo(s.x2, s.y2); g.strokeStyle = s.beat ? 'rgba(181,22,43,.45)' : 'rgba(27,24,24,.08)'; g.lineWidth = 2; g.stroke(); });
    if (fp.path.length > 1) { g.beginPath(); fp.path.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.strokeStyle = 'rgba(27,24,24,.25)'; g.lineWidth = 2; g.stroke(); }
    fp.pts.forEach((p) => { g.beginPath(); g.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2); if (p.miss) { g.strokeStyle = '#b5162b'; g.lineWidth = 2; g.stroke(); } else { g.fillStyle = p.color; g.fill(); } });
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#b5162b'; g.font = '700 54px "Permanent Marker", "Hanken Grotesk", sans-serif'; g.fillText('IMPRESSÃO DIGITAL RÍTMICA', 60, 82);
    g.fillStyle = '#1b1818'; g.font = '600 30px "Hanken Grotesk", sans-serif';
    g.fillText(d.mode === 'metro' ? `${d.bpm} BPM · ${T.SUBS[d.sub]} · ${d.bars} compassos · nota ${d.score}` : `livre · de ${d.start} a ${d.end} BPM`, 60, S + 120);
    g.fillText('Beaterista', S - 230, S + 120);
    c.toBlob(async (blob) => {
      const file = new File([blob], 'impressao-digital-ritmica.png', { type: 'image/png' });
      try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Impressão digital rítmica' }); return; } } catch { return; }
      const a = h('a', { href: URL.createObjectURL(blob), download: file.name }); document.body.append(a); a.click(); a.remove();
    }, 'image/png');
  }

  function history() {
    const all = store.list(KIND).sort((a, b) => b.data.at - a.data.at);
    if (!all.length) return h('p', { class: 'pad-x lib-note' }, 'raio-x é pra tocar mais tempo: 16 ou 32 compassos com o metrônomo, ou uma música inteira no modo livre. funciona melhor com o celular perto e em lugar quieto.');
    const nm = (id) => (id ? (store.get(id) ? store.get(id).data.name : 'aluno') : 'eu');
    return h('section', { class: 'card pad tp-hist' }, h('h2', { class: 'tag' }, 'raio-x anteriores'),
      ...all.slice(0, 10).map((r) => { const d = r.data; const dr = d.mode === 'metro' ? X.driftText(d.slope, d.bars) : X.bpmDriftText(d.slopePerMin, d.dur);
        return h('button', { class: 'tp-row', type: 'button', onclick: () => { show(d); scrollTo({ top: 0, behavior: 'smooth' }); } },
          h('strong', {}, d.mode === 'metro' ? String(d.score) : String(d.end)),
          h('span', {}, `${nm(d.who)} · ${d.mode === 'metro' ? `${d.bpm} BPM · ${d.bars} comp.` : 'livre'}`, h('small', {}, `${P.when(d.at)} · ${dr.kind}`))); }));
  }

  draw();
  el.stop = () => run && run.cancel();
  return el;
}
