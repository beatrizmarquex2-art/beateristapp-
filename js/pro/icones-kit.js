// As peças do kit ilustrado do jogo (js/kids/kit-modelos.js), recortadas uma a uma pra usar como "cabeças de nota" na partitura de bateria
// (pauta com peças desenhadas, quadros do kit, faixa de peças). Precisa do navegador (mede cada peça com getBBox); sem DOM devolve null.
import { arte } from '../kids/kit-modelos.js';

const cache = {};
/** Peças que não têm desenho próprio no kit usam o da parente mais parecida. */
const PARECIDA = { ho: 'hh', hf: 'hh', cr: 'cr', rd: 'rd' };
/** Provider do modelo ('acustica' | 'eletronica' | 'cajon'): { defs, art: {x,y,w,h}, pecas: { id: {cx,cy,w,h} }, tem(p), icone(p, cx, cy, larg), usa(p) } ou null. */
export function icones(modelo = 'acustica') {
  if (cache[modelo]) return cache[modelo]; if (typeof document === 'undefined') return null;
  const host = document.createElement('div'); host.setAttribute('aria-hidden', 'true'); host.style.cssText = 'position:absolute;left:-9999px;top:0;width:400px;visibility:hidden;pointer-events:none';
  host.innerHTML = arte(modelo); document.body.append(host);
  try {
    const svg = host.querySelector('svg'); if (!svg) return null; const vb = svg.viewBox.baseVal; const defsEl = svg.querySelector('defs'); const defs = defsEl ? defsEl.outerHTML : '';
    const pecas = {}; const marcas = {};
    for (const g of svg.querySelectorAll('g.kp')) { const p = g.dataset.p; const b = g.getBBox(); if (!b.width || !b.height) continue; pecas[p] = { cx: b.x + b.width / 2, cy: b.y + b.height / 2, w: b.width, h: b.height, x: b.x, y: b.y }; marcas[p] = g.outerHTML; }
    if (!Object.keys(pecas).length) return null;
    const alvo = (p) => (pecas[p] ? p : pecas[PARECIDA[p]] ? PARECIDA[p] : pecas.sn ? 'sn' : Object.keys(pecas)[0]);
    const prov = {
      defs, art: { x: vb.x, y: vb.y, w: vb.width, h: vb.height }, pecas,
      tem: (p) => !!pecas[p], usa: alvo,
      /** A peça `p` desenhada com o centro em (cx, cy) e `larg` px de largura (a altura segue a proporção). */
      icone(p, cx, cy, larg) { const id = alvo(p); const b = pecas[id]; const pad = 3; const h = (larg * b.h) / b.w; return `<svg x="${(cx - larg / 2).toFixed(1)}" y="${(cy - h / 2).toFixed(1)}" width="${larg.toFixed(1)}" height="${h.toFixed(1)}" viewBox="${(b.x - pad).toFixed(1)} ${(b.y - pad).toFixed(1)} ${(b.w + 2 * pad).toFixed(1)} ${(b.h + 2 * pad).toFixed(1)}" overflow="visible">${marcas[id]}</svg>`; },
    };
    cache[modelo] = prov; return prov;
  } catch { return null; } finally { host.remove(); }
}
