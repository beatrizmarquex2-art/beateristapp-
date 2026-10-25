// Guia de afinação (aba do Estúdio de Ouvido): tambor por tambor, parafusos em estrela, quanto girar,
// conferência parafuso a parafuso com o microfone e checklist da sessão. Usa a mesma leitura ao vivo do afinador.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as P from '../pitch.js';
import * as G from '../tuning-guide.js';
import { toast, stars } from '../ui.js';

const SET = 'setting-tuneguide';
const cfg = () => ({ drum: 'caixa', lugs: {}, ...(store.get(SET) ? store.get(SET).data : {}) });
const save = (p) => store.upsert('setting', SET, p);
const svgEl = (tag, attrs = {}) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const myTarget = (piece) => { const r = store.list('tuning').filter((x) => x.data.piece === piece).sort((a, b) => b.data.at - a.data.at)[0]; return r ? r.data.freq : null; };

/** Desenho da pele vista de cima: parafusos numerados na ordem da estrela, o da vez em destaque. */
function headSvg(n, order, cur, marks = {}) {
  const S = 220, c = S / 2, R = 88;
  const svg = svgEl('svg', { viewBox: `0 0 ${S} ${S}`, class: 'tg-head', role: 'img', 'aria-label': `Pele com ${n} parafusos. Ordem em estrela: ${order.join(', ')}` });
  svg.append(svgEl('circle', { cx: c, cy: c, r: R + 10, class: 'tg-rim' }), svgEl('circle', { cx: c, cy: c, r: R - 6, class: 'tg-skin' }));
  // linhas da estrela até o parafuso da vez
  const pos = (lug) => { const a = -Math.PI / 2 + ((lug - 1) / n) * 2 * Math.PI; return [c + R * Math.cos(a), c + R * Math.sin(a)]; };
  for (let i = 1; i <= Math.min(cur + 1, order.length) - 1; i++) { const [x1, y1] = pos(order[i - 1]); const [x2, y2] = pos(order[i]); svg.append(svgEl('line', { x1, y1, x2, y2, class: 'tg-path' })); }
  for (let lug = 1; lug <= n; lug++) {
    const [x, y] = pos(lug); const step = order.indexOf(lug); const m = marks[lug];
    const cls = step === cur ? 'tg-lug now' : step < cur ? 'tg-lug done' : 'tg-lug';
    svg.append(svgEl('circle', { cx: x, cy: y, r: step === cur ? 15 : 12, class: `${cls}${m ? ` ${m.hint}` : ''}` }));
    const t = svgEl('text', { x, y: y + 4.5, class: 'tg-num' }); t.textContent = String(step + 1); svg.append(t);
  }
  const mid = svgEl('text', { x: c, y: c + 5, class: 'tg-mid' }); mid.textContent = cur >= 0 && cur < order.length ? `parafuso ${order[cur]}` : 'em estrela'; svg.append(mid);
  return svg;
}

export function guideTab(mic) {
  let drum = cfg().drum; let step = 0; let lugStep = 0; let perLug = {};
  const done = {}; // checklist da sessão: tambor → passos feitos
  const readings = []; let last = null; let pendingAt = 0;
  const onset = P.onsetDetector({ ratio: 3, floor: 0.02, gap: 0.35 });
  const el = h('section', { class: 'ov-pane tg' });
  const lugsOf = () => cfg().lugs[drum] || G.LUGS[drum];
  const target = () => myTarget(drum) || G.SUGGEST[drum];
  const live = h('div', { class: 'tg-live', 'aria-live': 'polite' });

  function paintLive() {
    if (!last) { live.replaceChildren(h('small', { class: 'muted' }, 'bate uma vez e deixa soar…')); return; }
    const tg = target(); const cents = P.centsBetween(last, tg); const t = G.turnHint(cents);
    live.replaceChildren(h('strong', { class: `tg-read ${t.dir === 0 ? 'ok' : t.dir > 0 ? 'low' : 'high'}` }, `${P.noteOf(last).label} · ${Math.round(last)} Hz`),
      h('span', {}, `${cents > 0 ? '+' : ''}${cents} cents do alvo`), h('b', { class: 'tg-turn' }, t.text));
  }
  function draw() {
    const n = lugsOf(); const order = G.starOrder(n); const tg = target(); const mine = !!myTarget(drum);
    const stepId = G.STEPS[step][0];
    const marks = stepId === 'igualar' ? G.evenness(perLug) : {};
    const d = done[drum] || [];
    el.replaceChildren(
      h('div', { class: 'chips lib-tabs ov-pieces' }, ...P.PIECES.map((p) => h('button', { type: 'button', class: `lib-tab${p.id === drum ? ' on' : ''}${(done[p.id] || []).length === G.STEPS.length ? ' ok' : ''}`, 'aria-pressed': String(p.id === drum), onclick: () => { drum = p.id; save({ drum }); step = 0; lugStep = 0; perLug = {}; last = null; readings.length = 0; draw(); } }, `${(done[p.id] || []).length === G.STEPS.length ? '✓ ' : ''}${p.label}`))),
      h('div', { class: 'card pad tg-card' },
        h('div', { class: 'tg-top' },
          h('div', {}, h('small', { class: 'lib-kicker' }, mine ? 'alvo do seu kit' : 'alvo sugerido'), h('strong', { class: 'tg-target' }, `${P.noteOf(tg).label} · ${Math.round(tg)} Hz`)),
          h('label', { class: 'tg-lugs' }, h('span', {}, 'parafusos'), h('select', { onchange: (e) => { save({ lugs: { ...cfg().lugs, [drum]: +e.target.value } }).then(draw); } }, ...[4, 6, 8, 10, 12].map((x) => h('option', { value: x, selected: x === n }, String(x)))))),
        headSvg(n, order, stepId === 'igualar' ? lugStep : stepId === 'baixo' || stepId === 'cima' ? order.length : -1, marks), // nos passos de volta igual, a estrela inteira acende
        h('ol', { class: 'tg-steps' }, ...G.STEPS.map(([id, txt], i) => h('li', { class: `${i === step ? 'now' : ''}${d.includes(id) ? ' ok' : ''}` },
          h('button', { type: 'button', class: 'tg-check', role: 'checkbox', 'aria-checked': String(d.includes(id)), 'aria-label': `Feito: ${txt}`, onclick: () => { done[drum] = d.includes(id) ? d.filter((x) => x !== id) : [...d, id]; if (!d.includes(id)) step = Math.min(i + 1, G.STEPS.length - 1); draw(); } }, d.includes(id) ? '✓' : ''),
          h('button', { type: 'button', class: 'tg-step-txt', onclick: () => { step = i; draw(); } }, txt)))),
        stepId === 'fino' || stepId === 'igualar' ? live : null,
        stepId === 'igualar' ? h('div', { class: 'tg-lugbar' },
          h('span', {}, `bate a 3 dedos do parafuso ${order[lugStep]} (${lugStep + 1} de ${n})`),
          h('button', { class: 'btn small', type: 'button', disabled: !last, onclick: () => { perLug = { ...perLug, [order[lugStep]]: last }; last = null; readings.length = 0; lugStep = Math.min(lugStep + 1, n - 1); draw(); } }, 'anotar e próximo'),
          h('button', { class: 'btn small ghost', type: 'button', onclick: () => { perLug = {}; lugStep = 0; draw(); } }, 'recomeçar')) : null,
        stepId === 'igualar' && Object.keys(marks).length ? h('p', { class: 'tg-hint' }, Object.entries(marks).filter(([, m]) => m.hint !== 'ok').map(([lug, m]) => `parafuso ${lug}: ${m.hint} (${m.cents > 0 ? '+' : ''}${m.cents})`).join(' · ') || 'todos iguais ✓') : null,
        h('div', { class: 'bl-actions' },
          step > 0 ? h('button', { class: 'btn small ghost', type: 'button', onclick: () => { step--; draw(); } }, 'voltar') : null,
          step < G.STEPS.length - 1 ? h('button', { class: 'btn small', type: 'button', onclick: () => { step++; draw(); } }, 'próximo passo') : null,
          stepId === 'fino' || stepId === 'igualar' ? h('button', { class: 'btn small primary', type: 'button', onclick: finish }, 'salvar como alvo') : null)),
      sessionCard(),
      h('p', { class: 'pad-x lib-note' }, 'a quantidade de volta é uma estimativa: muda com a pele e o tamanho do tambor. abafa os outros tambores e bate sempre com a mesma força.'));
    paintLive();
  }
  async function finish(e) {
    if (!last) { toast('bate no tambor primeiro.'); return; }
    const btn = e.currentTarget;
    await store.upsert('tuning', null, { piece: drum, freq: +last.toFixed(2), note: P.noteOf(last).label, at: Date.now() });
    done[drum] = [...new Set([...(done[drum] || []), ...G.STEPS.map((x) => x[0])])];
    stars(btn); toast(`${P.PIECES.find((p) => p.id === drum).label} afinado e salvo no seu kit ✓`); draw();
  }
  function sessionCard() {
    const any = Object.values(done).some((x) => x.length);
    return h('section', { class: 'card pad tg-session' }, h('h2', { class: 'tag' }, 'sessão de afinação'),
      h('ul', { class: 'tg-sess' }, ...P.PIECES.map((p) => { const n = (done[p.id] || []).length; return h('li', { class: n === G.STEPS.length ? 'ok' : '' }, h('span', {}, n === G.STEPS.length ? '✓' : `${n}/${G.STEPS.length}`), p.label); })),
      any ? h('button', { class: 'btn small', type: 'button', onclick: async () => { await store.upsert('tuning-session', null, { at: Date.now(), done }); toast('sessão guardada ✓'); } }, 'guardar sessão') : null);
  }
  draw();
  el.frame = (buf, t) => {
    const stepId = G.STEPS[step][0];
    if (stepId !== 'fino' && stepId !== 'igualar') return;
    const tail = buf.subarray(buf.length - 1024);
    if (onset(P.rms(tail), t)) pendingAt = t + 0.18;
    if (pendingAt && t >= pendingAt) {
      pendingAt = 0; const p = P.PIECES.find((x) => x.id === drum);
      const r = P.drumPitch(buf, mic.sr, { min: p.min, max: p.max });
      if (r && r.clarity > 0.15) { readings.push(r.freq); if (readings.length > 3) readings.shift(); last = P.steady(readings); paintLive(); const b = el.querySelector('.tg-lugbar .btn'); if (b) b.disabled = false; }
    }
  };
  return el;
}
