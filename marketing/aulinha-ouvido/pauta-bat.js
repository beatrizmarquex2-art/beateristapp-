// Pauta de bateria "de verdade" (notação original) em SVG preto e branco: duas vozes (mãos com haste pra cima, pés pra baixo),
// pausas de semínima, colcheia e semicolcheia, ligaduras de colcheias/semicolcheias por tempo, quiálteras (tercinas),
// acentos, fantasmas, chimbal aberto, aro, cúpula e pivô (flam), letras da baquetagem e linha de contagem.
// Cada peça é uma linha de texto com 1 caractere por passo: x normal · a acento · f fantasma (caixa) · o chimbal aberto · r aro (caixa) · c cúpula (ride) · p flam · '.' vazio.

const K = '#000';
export const POS = { cr: -3, rd: 0, hh: -1, tt: 1, mt: 2, sn: 3, ft: 5, bd: 7, hf: 9 };
const MAOS = ['cr', 'rd', 'hh', 'tt', 'mt', 'sn', 'ft']; const PES = ['bd', 'hf'];
const XHEAD = new Set(['cr', 'rd', 'hh', 'hf']);
const G = 10; // distância entre linhas

/** Divide os passos de um tempo em notas e pausas. Devolve [{ t: 'n'|'r', d: 'q'|'e'|'s', k: passo no tempo, ocup: boolean }]. */
function tempoItens(occ, per) {
  const out = []; if (!occ.some(Boolean)) return [{ t: 'r', d: 'q', k: 0 }];
  if (per === 4) {
    if (occ[0] && !occ[1] && !occ[2] && !occ[3]) return [{ t: 'n', d: 'q', k: 0 }];
    let k = 0;
    while (k < 4) {
      if (occ[k]) { const e = k % 2 === 0 && !occ[k + 1] && (k + 2 >= 4 || occ[k + 2]); out.push({ t: 'n', d: e ? 'e' : 's', k }); k += e ? 2 : 1; }
      else if (k % 2 === 0 && !occ[k + 1]) { out.push({ t: 'r', d: 'e', k }); k += 2; }
      else { out.push({ t: 'r', d: 's', k }); k += 1; }
    }
    return out;
  }
  if (per === 3) { if (occ[0] && !occ[1] && !occ[2]) return [{ t: 'n', d: 'q', k: 0 }]; return occ.map((o, k) => ({ t: o ? 'n' : 'r', d: 'e', k })); }
  if (occ[0] && !occ[1]) return [{ t: 'n', d: 'q', k: 0 }]; // per === 2
  return occ.map((o, k) => ({ t: o ? 'n' : 'r', d: 'e', k }));
}

const restPath = (t, x, y) => {
  if (t === 'q') return `<path d="M${x - 2} ${y - 12}l6 7-5 5 6 8c-5-3-8 0-4 4" stroke="${K}" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`;
  if (t === 'e') return `<circle cx="${x - 2}" cy="${y - 4}" r="2.6" fill="${K}"/><path d="M${x - 2} ${y - 2}q4 1 6-3l-5 13" stroke="${K}" stroke-width="1.7" fill="none"/>`;
  return `<circle cx="${x - 2}" cy="${y - 7}" r="2.4" fill="${K}"/><circle cx="${x - 4}" cy="${y}" r="2.4" fill="${K}"/><path d="M${x - 2} ${y - 5}q4 1 6-3M${x - 4} ${y + 2}q4 1 6-3M${x + 4} ${y - 8}l-7 18" stroke="${K}" stroke-width="1.5" fill="none"/>`;
};

/**
 * Um compasso de bateria. `rows` = { hh: 'x.x.…', sn: '....a...', bd: 'x.......' } (1 caractere por passo).
 * `maos` = letras D/E por passo (mostradas em cima), `conta` = true escreve a contagem embaixo.
 */
function compassoSvg({ steps, rows, maos = '', conta = false, x0, w, top, nopausa = false }) {
  const per = steps / 4; const sw = (w - 14) / steps; const xOf = (i) => x0 + sw * i + sw / 2; const y = (pos) => top + (pos * G) / 2;
  const yUp = top - 30; const yDn = top + 4 * G + 28; let s = '';
  const at = (id, i) => (rows[id] || '')[i] || '.'; const on = (id, i) => at(id, i) !== '.' && at(id, i) !== ' ';
  const voz = (ids, up) => {
    const usada = ids.some((id) => Array.from({ length: steps }, (_, i) => on(id, i)).some(Boolean)); if (!usada) return;
    for (let b = 0; b < 4; b++) {
      const occ = Array.from({ length: per }, (_, k) => ids.some((id) => on(id, b * per + k))); const itens = tempoItens(occ, per); const notas = [];
      for (const it of itens) {
        const i = b * per + it.k; const x = xOf(i);
        if (it.t === 'r') { if (nopausa) continue; const rx = it.d === 'q' ? xOf(b * per + per / 2 - 0.5) : x; s += restPath(it.d, rx, up ? top + 2 * G : top + 4 * G + 18); continue; }
        const hs = ids.filter((id) => on(id, i)); const ys = hs.map((id) => y(POS[id])); const sx = up ? x + 5.6 : x - 5.6;
        for (const id of hs) {
          const c = at(id, i); const yy = y(POS[id]);
          if (POS[id] <= -2) s += `<line x1="${x - 9}" y1="${y(-2)}" x2="${x + 9}" y2="${y(-2)}" stroke="${K}" stroke-width="1.2"/>`;
          if (c === 'c') s += `<path d="M${x} ${yy - 5.6}l5.6 5.6-5.6 5.6-5.6-5.6z" fill="none" stroke="${K}" stroke-width="1.9"/>`;
          else if (XHEAD.has(id) || c === 'r') s += `<path d="M${x - 4.6} ${yy - 4.6}l9.2 9.2M${x + 4.6} ${yy - 4.6}l-9.2 9.2" stroke="${K}" stroke-width="1.9"/>`;
          else s += `<ellipse cx="${x}" cy="${yy}" rx="5.9" ry="4.3" transform="rotate(-20 ${x} ${yy})" fill="${K}"/>`;
          if (c === 'f') s += `<text x="${x - 14}" y="${yy + 5}" font-size="15" font-family="Hanken Grotesk">(</text><text x="${x + 7}" y="${yy + 5}" font-size="15" font-family="Hanken Grotesk">)</text>`;
          if (c === 'o') s += `<circle cx="${x + 1}" cy="${yy - 11}" r="3.4" fill="none" stroke="${K}" stroke-width="1.5"/>`;
          if (c === 'r' && id === 'sn') s += `<text x="${x + 8}" y="${yy + 3}" font-size="8" font-weight="800" font-family="Hanken Grotesk">aro</text>`;
          if (c === 'p') s += `<ellipse cx="${x - 13}" cy="${yy}" rx="3.9" ry="2.9" transform="rotate(-20 ${x - 13} ${yy})" fill="${K}"/><path d="M${x - 9.5} ${yy - 1}V${yy - 17}M${x - 13} ${yy - 12}l7 -3" stroke="${K}" stroke-width="1.3" fill="none"/>`;
          if (c === 'a') s += `<path d="M${x - 5} ${(up ? yUp - 14 : yDn + 14) - 4}L${x + 5} ${up ? yUp - 14 : yDn + 14}L${x - 5} ${(up ? yUp - 14 : yDn + 14) + 4}" stroke="${K}" stroke-width="1.8" fill="none"/>`;
        }
        if (it.d !== 'q' || true) { const ya = up ? Math.max(...ys) - 1 : Math.min(...ys) + 1; s += `<line x1="${sx}" y1="${ya}" x2="${sx}" y2="${up ? yUp : yDn}" stroke="${K}" stroke-width="1.6"/>`; }
        notas.push({ ...it, x: sx });
      }
      // ligaduras e bandeirolas
      const ns = notas.filter((n) => n.d !== 'q'); const dir = up ? 1 : -1; const yb = up ? yUp : yDn;
      if (ns.length >= 2) {
        s += `<rect x="${ns[0].x - 0.8}" y="${up ? yb : yb - 4}" width="${ns[ns.length - 1].x - ns[0].x + 1.6}" height="4" fill="${K}"/>`;
        ns.forEach((n, j) => { if (n.d !== 's') return; const nxt = ns[j + 1]; const prv = ns[j - 1]; const yy = up ? yb + 6.4 : yb - 10.4;
          if (nxt && nxt.d === 's' && nxt.k - n.k <= per) s += `<rect x="${n.x - 0.8}" y="${yy}" width="${nxt.x - n.x + 1.6}" height="3.4" fill="${K}"/>`;
          else if (!(prv && prv.d === 's' && n.k - prv.k <= per)) { const tow = nxt && (!prv || nxt.x - n.x < n.x - prv.x) ? 1 : -1; s += `<rect x="${tow > 0 ? n.x - 0.8 : n.x - 8}" y="${yy}" width="8.8" height="3.4" fill="${K}"/>`; } });
        if (per === 3) { const xa = ns[0].x; const xb = ns[ns.length - 1].x; s += `<path d="M${xa} ${yb - 12 * dir}V${yb - 17 * dir}H${(xa + xb) / 2 - 7}M${(xa + xb) / 2 + 7} ${yb - 17 * dir}H${xb}V${yb - 12 * dir}" fill="none" stroke="${K}" stroke-width="1.2"/><text x="${(xa + xb) / 2}" y="${yb - 14 * dir}" text-anchor="middle" font-size="10.5" font-weight="800" font-family="Hanken Grotesk">3</text>`; }
      } else if (ns.length === 1) { const n = ns[0]; const fl = n.d === 's' ? 2 : 1; for (let q = 0; q < fl; q++) s += `<path d="M${n.x} ${yb + q * 7 * dir * 1}c2 ${5 * dir} 9 ${6 * dir} 7 ${14 * dir}" stroke="${K}" stroke-width="2" fill="none"/>`; }
    }
  };
  voz(MAOS, true); voz(PES, false);
  if (maos) for (let i = 0; i < steps; i++) { const c = maos[i]; if (c && c !== '.' && c !== ' ') s += `<text x="${xOf(i) - 3.5}" y="${yUp - 24}" font-size="11.5" font-weight="800" font-family="Hanken Grotesk">${c}</text>`; }
  if (conta) { const sub = per === 4 ? ['e', '&', 'a'] : per === 3 ? ['e', 'a'] : ['&']; for (let i = 0; i < steps; i++) { const t = i % per === 0 ? String(i / per + 1) : sub[(i % per) - 1]; s += `<text x="${xOf(i)}" y="${yDn + 24}" text-anchor="middle" font-size="${i % per === 0 ? 13 : 11}" font-weight="${i % per === 0 ? 800 : 600}" font-family="Hanken Grotesk">${t}</text>`; } }
  return s;
}

/**
 * Pauta de bateria. `compassos` = lista de { steps, rows, maos } (1 a 4 compassos na mesma linha).
 * `w` = largura do desenho (px do viewBox), `conta` = escreve a contagem, `clave` = mostra clave de percussão e fórmula de compasso (só no 1º sistema).
 */
export function pautaBat({ compassos, w = 640, conta = false, clave = true, titulo = '' }) {
  const temLetras = compassos.some((c) => c.maos && /[DEde]/.test(c.maos)); const top = temLetras ? 70 : 56; const H = top + 4 * G + (conta ? 64 : 48); const x0 = clave ? 52 : 18; const n = compassos.length; const wm = (w - x0 - 12) / n;
  let s = `<svg class="batsvg" viewBox="0 0 ${w} ${H}" role="img" aria-label="${titulo || 'pauta de bateria'}">`;
  for (let i = 0; i < 5; i++) s += `<line x1="8" y1="${top + i * G}" x2="${w - 8}" y2="${top + i * G}" stroke="${K}" stroke-width="1.2"/>`;
  s += `<line x1="8" y1="${top}" x2="8" y2="${top + 4 * G}" stroke="${K}" stroke-width="1.6"/>`;
  if (clave) s += `<rect x="14" y="${top + G}" width="4" height="${2 * G}" fill="${K}"/><rect x="21" y="${top + G}" width="4" height="${2 * G}" fill="${K}"/><text x="33" y="${top + 2 * G - 1}" font-size="19" font-weight="800" font-family="Hanken Grotesk">4</text><text x="33" y="${top + 4 * G - 1}" font-size="19" font-weight="800" font-family="Hanken Grotesk">4</text>`;
  compassos.forEach((c, k) => { s += `<g>${compassoSvg({ ...c, conta, x0: x0 + k * wm, w: wm, top })}</g><line x1="${x0 + (k + 1) * wm - 1}" y1="${top}" x2="${x0 + (k + 1) * wm - 1}" y2="${top + 4 * G}" stroke="${K}" stroke-width="${k === n - 1 ? 3 : 1.4}"/>`; });
  return `${s}</svg>`;
}
