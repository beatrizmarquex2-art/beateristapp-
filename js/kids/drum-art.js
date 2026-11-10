// Desenhos de tambor pros botões de tocar (no lugar da palavra "toque"): caixa, tambor, bumbo e chimbal. Só cores da escola.
const INK = '#142036'; const CREME = '#fbf7ee'; const VINHO = '#8a1a30'; const PET = '#1f6f78'; const CINZA = '#b9bec8';
const W = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

const lugs = (x0, x1, y0, y1, n) => Array.from({ length: n }, (_, i) => { const x = x0 + ((x1 - x0) * (i + 0.5)) / n; return `<rect x="${x - 2}" y="${y0}" width="4" height="${y1 - y0}" rx="1.5" fill="${CINZA}" ${W} stroke-width="1.6"/>`; }).join('');
const sticks = `<g ${W}><path d="M30 6 L70 38" fill="none" stroke-width="5"/><path d="M90 6 L50 38" fill="none" stroke-width="5"/><circle cx="30" cy="6" r="4" fill="${CREME}"/><circle cx="90" cy="6" r="4" fill="${CREME}"/></g>`;
const cilindro = (cor, extra = '') => `<path d="M14 44 V78 Q14 92 60 92 Q106 92 106 78 V44" fill="${cor}" ${W}/>${lugs(22, 98, 52, 86, 6)}<ellipse cx="60" cy="44" rx="46" ry="14" fill="${CREME}" ${W}/>${extra}`;

const ART = {
  caixa: () => cilindro(VINHO, `<ellipse cx="60" cy="44" rx="30" ry="8" fill="none" stroke="${CINZA}" stroke-width="2"/>`) + sticks,
  tambor: () => `<path d="M30 92 L22 100 M90 92 L98 100" ${W} fill="none"/>` + cilindro(PET) + sticks,
  bumbo: () => `<circle cx="60" cy="56" r="40" fill="${VINHO}" ${W}/><circle cx="60" cy="56" r="29" fill="${CREME}" ${W}/><circle cx="60" cy="56" r="9" fill="${INK}"/><path d="M60 16 V8 M60 96 V104 M20 56 H12 M100 56 H108" ${W} fill="none"/>`,
  chimbal: () => `<path d="M60 40 V102 M44 102 L60 90 L76 102" ${W} fill="none"/><ellipse cx="60" cy="52" rx="42" ry="9" fill="${CINZA}" ${W}/><ellipse cx="60" cy="38" rx="42" ry="9" fill="${CREME}" ${W}/><ellipse cx="60" cy="36" rx="9" ry="3" fill="${CINZA}" stroke="${INK}" stroke-width="1.5"/>`,
};
export const NOME = { caixa: 'caixa', tambor: 'tambor', bumbo: 'bumbo', chimbal: 'chimbal' };

/** SVG (como elemento) do instrumento; `kind` = caixa | tambor | bumbo | chimbal. */
export function drumSvg(kind = 'caixa', cls = 'drum-art') {
  const d = document.createElement('span'); d.className = cls; d.setAttribute('aria-hidden', 'true');
  d.innerHTML = `<svg viewBox="0 0 120 108" width="100%" height="100%" focusable="false">${(ART[kind] || ART.caixa)()}</svg>`; return d;
}
