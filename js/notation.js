// Partitura de bateria a partir da grade do Beat Lab, com o kit completo e duas vozes como na escrita padrão:
// mãos (pratos, chimbal, caixa, toms) com haste para cima; pés (bumbo, chimbal no pé) com haste para baixo.
// Gera uma lista de traços que vira SVG na tela e desenho no canvas na exportação, então as duas saídas são idênticas.
// Simplificação honesta: nota sozinha no começo do tempo vira semínima; tempo que começa vazio ganha uma pausa antes da 1ª nota;
// fora isso, cada tempo é escrito na subdivisão da grade (sem pausas no meio do tempo).
import { GRIDS, ROWS, COLORS, cell, isAcc } from './beats.js';

// altura de cada peça (0 = linha de cima, cada 1 = meio espaço). Padrão de notação de bateria (PAS/Weinberg).
export const POS = { cr: -3, rd: 0, hh: -1, ho: -1, tt: 1, mt: 2, sn: 3, ft: 5, bd: 7, hf: 9 };
const X_HEAD = new Set(['cr', 'rd', 'hh', 'ho', 'hf']);
const FEET = new Set(['bd', 'hf']);
const GAP = 10; // distância entre as linhas da pauta

/** Desenha a grade como pauta. `color` pinta cada peça com a sua cor. Devolve { w, h, ops }. */
export function layout(beat, { width = 360, title = '', color = false, full = true } = {}) {
  const per = GRIDS[beat.steps].perBeat;
  const top = (title ? 54 : 22) + 14 + (beat.acc && beat.acc.some(Boolean) ? 14 : 0), left = 52, right = 10; // acento precisa de espaço em cima
  const lineY = (i) => top + i * GAP;
  const posY = (p) => top + (p * GAP) / 2;
  const sw = (width - left - right) / beat.steps;
  const ops = [];
  const tint = (id) => (color ? COLORS[id] : null);
  if (title) ops.push({ t: 'text', x: 8, y: 26, s: title, size: 20, weight: 700, color: 'accent' });
  for (let i = 0; i < 5; i++) ops.push({ t: 'line', x1: 6, y1: lineY(i), x2: width - right, y2: lineY(i), w: 1 });
  ops.push({ t: 'rect', x: 10, y: lineY(1), w: 3.5, h: GAP * 2 }, { t: 'rect', x: 16, y: lineY(1), w: 3.5, h: GAP * 2 });
  ops.push({ t: 'text', x: 27, y: lineY(2) - 1, s: '4', size: 19, weight: 800 }, { t: 'text', x: 27, y: lineY(4) - 1, s: '4', size: 19, weight: 800 });
  ops.push({ t: 'line', x1: width - right, y1: lineY(0), x2: width - right, y2: lineY(4), w: 2 });
  const xOf = (i) => left + i * sw + sw / 2;
  const upTop = top - GAP * 2.6, downBot = lineY(4) + GAP * 3.4;
  // completa: duas vozes (mãos pra cima, pés pra baixo). simples: tudo numa voz, hastes pra cima (mais fácil de ler pra iniciante).
  const voices = full ? [
    { ids: ROWS.map((r) => r.id).filter((id) => !FEET.has(id)), up: true },
    { ids: ROWS.map((r) => r.id).filter((id) => FEET.has(id)), up: false },
  ] : [{ ids: ROWS.map((r) => r.id), up: true }];
  for (const v of voices) {
    for (let b = 0; b < beat.steps / per; b++) {
      const stems = []; let firstK = -1;
      for (let k = 0; k < per; k++) {
        const i = b * per + k;
        const on = v.ids.filter((id) => cell(beat, id, i));
        if (!on.length) continue;
        const x = xOf(i); const sx = v.up ? x + 5.5 : x - 5.5;
        for (const id of on) {
          const y = posY(POS[id]);
          if (POS[id] <= -2) ops.push({ t: 'line', x1: x - 9, y1: lineY(0) - GAP, x2: x + 9, y2: lineY(0) - GAP, w: 1 }); // linha suplementar do prato
          ops.push({ t: 'head', x, y, kind: X_HEAD.has(id) ? 'x' : 'n', c: tint(id) });
          if (id === 'ho') ops.push({ t: 'circle', x, y: upTop - 8, r: 3.6, c: tint(id) }); // "o" = chimbal aberto
          if (id === 'cr' && color) ops.push({ t: 'circle', x, y, r: 7, c: tint(id), ring: true });
        }
        const ys = on.map((id) => posY(POS[id]));
        const one = on.length === 1 ? tint(on[0]) : null; // haste da cor da peça quando é uma só
        ops.push(v.up ? { t: 'line', x1: sx, y1: Math.max(...ys) - 1, x2: sx, y2: upTop, w: 1.6, c: one } : { t: 'line', x1: sx, y1: Math.min(...ys) + 1, x2: sx, y2: downBot, w: 1.6, c: one });
        stems.push(sx); if (firstK < 0) firstK = k;
      }
      const y0 = v.up ? upTop : downBot - 4; const dy = v.up ? 6 : -6;
      if (!stems.length) { if (v.up) ops.push({ t: 'rest', x: xOf(b * per) + (sw * (per - 1)) / 2, y: lineY(2) }); continue; }
      if (firstK > 0 && v.up) ops.push({ t: 'rest8', x: xOf(b * per), y: lineY(2) }); // o tempo começa com pausa: mostra antes da nota
      const beams = per === 4 ? 2 : 1;
      if (stems.length > 1) for (let j = 0; j < beams; j++) ops.push({ t: 'beam', x1: stems[0], x2: stems[stems.length - 1], y: y0 + j * dy });
      else if (firstK === 0) { /* nota sozinha no começo do tempo = semínima: sem bandeirola */ }
      else for (let j = 0; j < beams; j++) ops.push({ t: 'flag', x: stems[0], y: (v.up ? upTop : downBot) + j * (v.up ? 7 : -7), down: !v.up });
      if (per === 3 && v.up && stems.length > 1) ops.push({ t: 'text', x: (stems[0] + stems[stems.length - 1]) / 2 - 4, y: upTop - 5, s: '3', size: 12, weight: 700 });
    }
  }
  // acentos (>) em cima de tudo, na coluna do passo
  for (let i = 0; i < beat.steps; i++) if (isAcc(beat, i)) ops.push({ t: 'acc', x: xOf(i), y: upTop - (per === 3 ? 20 : 10) });
  return { w: width, h: full ? downBot + 10 : lineY(4) + 26, ops };
}

/** Legenda de cores (só das peças que aparecem no ritmo). */
export const legend = (beat) => ROWS.filter((r) => (beat.rows[r.id] || []).some(Boolean)).map((r) => [r.label, COLORS[r.id]]);

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** SVG em texto (para a tela). Sem cor: tinta = currentColor. */
export function toSVG({ w, h, ops }) {
  const ink = (o) => o.c || 'currentColor';
  const out = ops.map((o) => {
    switch (o.t) {
      case 'line': return `<line x1="${o.x1}" y1="${o.y1}" x2="${o.x2}" y2="${o.y2}" stroke="${ink(o)}" stroke-width="${o.w}"/>`;
      case 'rect': return `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="currentColor"/>`;
      case 'circle': return `<circle cx="${o.x}" cy="${o.y}" r="${o.r}" fill="none" stroke="${ink(o)}" stroke-width="${o.ring ? 1.4 : 1.6}"/>`;
      case 'head': return o.kind === 'x'
        ? `<path d="M${o.x - 4.5} ${o.y - 4.5}l9 9M${o.x + 4.5} ${o.y - 4.5}l-9 9" stroke="${ink(o)}" stroke-width="${o.c ? 2.4 : 1.8}"/>`
        : `<ellipse cx="${o.x}" cy="${o.y}" rx="5.8" ry="4.2" transform="rotate(-20 ${o.x} ${o.y})" fill="${ink(o)}"/>`;
      case 'beam': return `<rect x="${o.x1 - 0.8}" y="${o.y}" width="${o.x2 - o.x1 + 1.6}" height="4" fill="currentColor"/>`;
      case 'flag': return `<path d="M${o.x} ${o.y}c2 ${o.down ? -5 : 5} 9 ${o.down ? -6 : 6} 7 ${o.down ? -14 : 14}" stroke="currentColor" stroke-width="2" fill="none"/>`;
      case 'acc': return `<path d="M${o.x - 5} ${o.y - 4}L${o.x + 5} ${o.y}L${o.x - 5} ${o.y + 4}" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="miter" class="acc"/>`;
      case 'rest8': return `<circle cx="${o.x - 2}" cy="${o.y - 4}" r="2.6" fill="currentColor"/><path d="M${o.x - 2} ${o.y - 2}q4 1 6-3l-5 13" stroke="currentColor" stroke-width="1.6" fill="none"/>`;
      case 'rest16': return `<circle cx="${o.x - 2}" cy="${o.y - 6}" r="2.4" fill="currentColor"/><circle cx="${o.x - 4}" cy="${o.y + 1}" r="2.4" fill="currentColor"/><path d="M${o.x - 2} ${o.y - 4}q4 1 6-3M${o.x - 4} ${o.y + 3}q4 1 6-3M${o.x + 4} ${o.y - 7}l-5 18" stroke="currentColor" stroke-width="1.5" fill="none"/>`;
      case 'dot': return `<circle cx="${o.x}" cy="${o.y}" r="2.2" fill="currentColor"/>`;
      case 'rest': return `<path d="M${o.x - 2} ${o.y - 12}l6 7-5 5 6 8c-5-3-8 0-4 4" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`;
      case 'text': return `<text x="${o.x}" y="${o.y}" font-size="${o.size}" font-weight="${o.weight || 400}" font-family="Hanken Grotesk, sans-serif" fill="${o.color === 'accent' ? 'var(--accent, #b5162b)' : 'currentColor'}">${esc(o.s)}</text>`;
      default: return '';
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" role="img">${out.join('')}</svg>`;
}

/** Mesmo desenho num canvas 2D (para exportar PNG). */
export function draw(g, { ops }, { ink = '#1b1b1b', accent = '#b5162b', scale = 1 } = {}) {
  g.save(); g.scale(scale, scale); g.lineCap = 'butt';
  for (const o of ops) {
    const c = o.c || ink; g.strokeStyle = c; g.fillStyle = c;
    g.beginPath();
    switch (o.t) {
      case 'line': g.lineWidth = o.w; g.moveTo(o.x1, o.y1); g.lineTo(o.x2, o.y2); g.stroke(); break;
      case 'rect': g.fillStyle = ink; g.fillRect(o.x, o.y, o.w, o.h); break;
      case 'circle': g.lineWidth = o.ring ? 1.4 : 1.6; g.arc(o.x, o.y, o.r, 0, Math.PI * 2); g.stroke(); break;
      case 'head':
        if (o.kind === 'x') { g.lineWidth = o.c ? 2.4 : 1.8; g.moveTo(o.x - 4.5, o.y - 4.5); g.lineTo(o.x + 4.5, o.y + 4.5); g.moveTo(o.x + 4.5, o.y - 4.5); g.lineTo(o.x - 4.5, o.y + 4.5); g.stroke(); }
        else { g.ellipse(o.x, o.y, 5.8, 4.2, -20 * Math.PI / 180, 0, Math.PI * 2); g.fill(); }
        break;
      case 'beam': g.fillStyle = ink; g.fillRect(o.x1 - 0.8, o.y, o.x2 - o.x1 + 1.6, 4); break;
      case 'flag': { const d = o.down ? -1 : 1; g.strokeStyle = ink; g.lineWidth = 2; g.moveTo(o.x, o.y); g.bezierCurveTo(o.x + 2, o.y + 5 * d, o.x + 9, o.y + 6 * d, o.x + 7, o.y + 14 * d); g.stroke(); break; }
      case 'acc': g.strokeStyle = ink; g.lineWidth = 1.8; g.moveTo(o.x - 5, o.y - 4); g.lineTo(o.x + 5, o.y); g.lineTo(o.x - 5, o.y + 4); g.stroke(); break;
      case 'rest8': g.fillStyle = ink; g.arc(o.x - 2, o.y - 4, 2.6, 0, Math.PI * 2); g.fill(); g.beginPath(); g.strokeStyle = ink; g.lineWidth = 1.6; g.moveTo(o.x - 2, o.y - 2); g.quadraticCurveTo(o.x + 2, o.y - 1, o.x + 4, o.y - 5); g.lineTo(o.x - 1, o.y + 8); g.stroke(); break;
      case 'rest': g.strokeStyle = ink; g.lineWidth = 2.2; g.moveTo(o.x - 2, o.y - 12); g.lineTo(o.x + 4, o.y - 5); g.lineTo(o.x - 1, o.y); g.lineTo(o.x + 5, o.y + 8); g.bezierCurveTo(o.x, o.y + 5, o.x - 3, o.y + 8, o.x + 1, o.y + 12); g.stroke(); break;
      case 'text': g.fillStyle = o.color === 'accent' ? accent : ink; g.font = `${o.weight || 400} ${o.size}px "Hanken Grotesk", sans-serif`; g.fillText(o.s, o.x, o.y); break;
      default: break;
    }
  }
  g.restore();
}
