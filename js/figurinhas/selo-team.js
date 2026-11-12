// Nas figurinhas do criador do Perfil o selo de raridade (COMUM / RARA / EXCLUSIVA) foi apagado da arte (modelos2/limpo) e no lugar vai escrito BEATERISTA TEAM.
// Posições em coordenadas do cartão (360 x 475): centro, largura máxima, ângulo e cor de cada plaquinha.
export const TEXTO_TEAM = 'BEATERISTA TEAM';
export const SELO_TEAM = {
  M1: { cx: 180.2, cy: 438, w: 90, ang: -2.9, cor: '#e9dfc8' },
  M2: { cx: 178.5, cy: 439, w: 88, ang: 0, cor: '#f1e3c6' },
  M3: { cx: 179.8, cy: 439.5, w: 88, ang: 0, cor: '#ebe4d2' },
  M4: { cx: 192.3, cy: 440, w: 92, ang: 0, cor: '#f1e6c9' },
  M5: { cx: 183.2, cy: 430.5, w: 84, ang: 0, cor: '#f1e3c6' },
  M6: { cx: 180.1, cy: 430, w: 80, ang: -2.8, cor: '#e3c6f0' },
  M7: { cx: 177.3, cy: 425, w: 140, ang: -0.8, cor: '#1a160e' },
  M8: { cx: 171.1, cy: 414.5, w: 112, ang: -5, cor: '#e6c274' },
};
const FONTE = "'Hanken Grotesk', system-ui, sans-serif";
/** Escreve BEATERISTA TEAM no canvas (ctx já na escala do cartão 360 x 475). */
export function selosTeamCanvas(ctx, id, texto = TEXTO_TEAM) {
  const s = SELO_TEAM[id]; if (!s) return;
  ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate((s.ang * Math.PI) / 180); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = s.cor;
  let size = 12; ctx.font = `800 ${size}px ${FONTE}`; if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0.6px';
  const w = ctx.measureText(texto).width; if (w > s.w) { size = Math.max(6, size * (s.w / w)); ctx.font = `800 ${size}px ${FONTE}`; }
  ctx.fillText(texto, 0, 0.5); ctx.restore();
}
/** O mesmo em SVG (texto ajustado pela largura). */
export function seloTeamSVG(id, texto = TEXTO_TEAM) {
  const s = SELO_TEAM[id]; if (!s) return '';
  return `<g transform="translate(${s.cx} ${s.cy}) rotate(${s.ang})"><text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-family="${FONTE.replace(/"/g, "'")}" font-weight="800" font-size="10.5" letter-spacing="0.6" fill="${s.cor}" textLength="${Math.min(s.w, Math.round(texto.length * 7.4))}" lengthAdjust="spacingAndGlyphs">${texto}</text></g>`;
}
