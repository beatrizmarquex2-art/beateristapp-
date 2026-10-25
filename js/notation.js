// Partitura de bateria simplificada a partir da grade do Beat Lab.
// Gera uma lista de traços (linhas, cabeças de nota, textos) que vira SVG na tela e desenho no canvas na exportação,
// assim as duas saídas são idênticas. Simplificações honestas: todas as hastes para cima, sem pausas dentro do tempo.
import { GRIDS, usedRows } from './beats.js';

// altura de cada peça na pauta (0 = linha de cima, cada 1 = meio espaço). Padrão de notação de bateria.
export const POS = { hh: -1, tt: 1, sn: 3, ft: 5, bd: 7 };
const GAP = 10; // distância entre as linhas da pauta

/** Desenha a grade como pauta. `width` em px; devolve { w, h, ops }. */
export function layout(beat, { width = 360, title = '' } = {}) {
  const per = GRIDS[beat.steps].perBeat;
  const top = title ? 54 : 22, left = 52, right = 10;
  const lineY = (i) => top + i * GAP;
  const posY = (p) => top + (p * GAP) / 2;
  const sw = (width - left - right) / beat.steps;
  const ops = [];
  if (title) ops.push({ t: 'text', x: 8, y: 26, s: title, size: 20, weight: 700, color: 'accent' });
  for (let i = 0; i < 5; i++) ops.push({ t: 'line', x1: 6, y1: lineY(i), x2: width - right, y2: lineY(i), w: 1 });
  // clave de percussão (duas barrinhas) e 4/4
  ops.push({ t: 'rect', x: 10, y: lineY(1), w: 3.5, h: GAP * 2 }, { t: 'rect', x: 16, y: lineY(1), w: 3.5, h: GAP * 2 });
  ops.push({ t: 'text', x: 27, y: lineY(2) - 1, s: '4', size: 19, weight: 800 }, { t: 'text', x: 27, y: lineY(4) - 1, s: '4', size: 19, weight: 800 });
  ops.push({ t: 'line', x1: width - right, y1: lineY(0), x2: width - right, y2: lineY(4), w: 2 });
  const rows = usedRows(beat);
  const stemTop = top - GAP * 2.2;
  const xOf = (i) => left + i * sw + sw / 2;
  for (let b = 0; b < beat.steps / per; b++) {
    const hits = [];
    for (let k = 0; k < per; k++) {
      const i = b * per + k;
      const on = rows.filter((r) => beat.rows[r.id][i]).map((r) => r.id);
      if (!on.length) continue;
      const x = xOf(i);
      for (const id of on) ops.push({ t: 'head', x, y: posY(POS[id]), kind: id === 'hh' ? 'x' : 'n' }); // hh no espaço de cima: sem linha suplementar
      const low = Math.max(...on.map((id) => posY(POS[id])));
      ops.push({ t: 'line', x1: x + 5.5, y1: low - 1, x2: x + 5.5, y2: stemTop, w: 1.6 });
      hits.push(x + 5.5);
    }
    if (!hits.length) { ops.push({ t: 'rest', x: xOf(b * per) + (sw * (per - 1)) / 2, y: lineY(2) }); continue; }
    const beams = per === 4 ? 2 : 1;
    if (hits.length > 1) for (let j = 0; j < beams; j++) ops.push({ t: 'beam', x1: hits[0], x2: hits[hits.length - 1], y: stemTop + j * 6 });
    else for (let j = 0; j < beams; j++) ops.push({ t: 'flag', x: hits[0], y: stemTop + j * 7 });
    if (per === 3) ops.push({ t: 'text', x: (hits[0] + hits[hits.length - 1]) / 2 - 4, y: stemTop - 5, s: '3', size: 12, weight: 700 });
  }
  return { w: width, h: lineY(4) + 22, ops };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** SVG em texto (para a tela). Cores: tinta e destaque vêm do CSS (currentColor e var(--accent)). */
export function toSVG({ w, h, ops }) {
  const out = ops.map((o) => {
    switch (o.t) {
      case 'line': return `<line x1="${o.x1}" y1="${o.y1}" x2="${o.x2}" y2="${o.y2}" stroke="currentColor" stroke-width="${o.w}"/>`;
      case 'rect': return `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="currentColor"/>`;
      case 'head': return o.kind === 'x'
        ? `<path d="M${o.x - 4.5} ${o.y - 4.5}l9 9M${o.x + 4.5} ${o.y - 4.5}l-9 9" stroke="currentColor" stroke-width="1.8"/>`
        : `<ellipse cx="${o.x}" cy="${o.y}" rx="5.8" ry="4.2" transform="rotate(-20 ${o.x} ${o.y})" fill="currentColor"/>`;
      case 'beam': return `<rect x="${o.x1 - 0.8}" y="${o.y}" width="${o.x2 - o.x1 + 1.6}" height="4" fill="currentColor"/>`;
      case 'flag': return `<path d="M${o.x} ${o.y}c2 5 9 6 7 14" stroke="currentColor" stroke-width="2" fill="none"/>`;
      case 'rest': return `<path d="M${o.x - 2} ${o.y - 12}l6 7-5 5 6 8c-5-3-8 0-4 4" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`;
      case 'text': return `<text x="${o.x}" y="${o.y}" font-size="${o.size}" font-weight="${o.weight || 400}" font-family="Hanken Grotesk, sans-serif" fill="${o.color === 'accent' ? 'var(--accent, #b5162b)' : 'currentColor'}">${esc(o.s)}</text>`;
      default: return '';
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" role="img">${out.join('')}</svg>`;
}

/** Mesmo desenho num canvas 2D (para exportar PNG). */
export function draw(g, { ops }, { ink = '#1b1b1b', accent = '#b5162b', scale = 1 } = {}) {
  g.save(); g.scale(scale, scale); g.strokeStyle = ink; g.fillStyle = ink; g.lineCap = 'butt';
  for (const o of ops) {
    g.beginPath();
    switch (o.t) {
      case 'line': g.lineWidth = o.w; g.moveTo(o.x1, o.y1); g.lineTo(o.x2, o.y2); g.stroke(); break;
      case 'rect': g.fillRect(o.x, o.y, o.w, o.h); break;
      case 'head':
        if (o.kind === 'x') { g.lineWidth = 1.8; g.moveTo(o.x - 4.5, o.y - 4.5); g.lineTo(o.x + 4.5, o.y + 4.5); g.moveTo(o.x + 4.5, o.y - 4.5); g.lineTo(o.x - 4.5, o.y + 4.5); g.stroke(); }
        else { g.ellipse(o.x, o.y, 5.8, 4.2, -20 * Math.PI / 180, 0, Math.PI * 2); g.fill(); }
        break;
      case 'beam': g.fillRect(o.x1 - 0.8, o.y, o.x2 - o.x1 + 1.6, 4); break;
      case 'flag': g.lineWidth = 2; g.moveTo(o.x, o.y); g.bezierCurveTo(o.x + 2, o.y + 5, o.x + 9, o.y + 6, o.x + 7, o.y + 14); g.stroke(); break;
      case 'rest': g.lineWidth = 2.2; g.moveTo(o.x - 2, o.y - 12); g.lineTo(o.x + 4, o.y - 5); g.lineTo(o.x - 1, o.y); g.lineTo(o.x + 5, o.y + 8); g.bezierCurveTo(o.x, o.y + 5, o.x - 3, o.y + 8, o.x + 1, o.y + 12); g.stroke(); break;
      case 'text': g.fillStyle = o.color === 'accent' ? accent : ink; g.font = `${o.weight || 400} ${o.size}px "Hanken Grotesk", sans-serif`; g.fillText(o.s, o.x, o.y); g.fillStyle = ink; break;
      default: break;
    }
  }
  g.restore();
}
