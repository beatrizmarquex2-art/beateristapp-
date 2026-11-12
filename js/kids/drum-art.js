// Desenhos de tambor pros botões de tocar (no lugar da palavra "toque"): caixa, tambor, bumbo e chimbal. Só cores da escola.
const INK = '#142036'; const CREME = '#fbf7ee'; const VINHO = '#8a1a30'; const PET = '#1f6f78'; const CINZA = '#b9bec8';
const W = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

const lugs = (x0, x1, y0, y1, n) => Array.from({ length: n }, (_, i) => { const x = x0 + ((x1 - x0) * (i + 0.5)) / n; return `<rect x="${x - 2}" y="${y0}" width="4" height="${y1 - y0}" rx="1.5" fill="${CINZA}" ${W} stroke-width="1.6"/>`; }).join('');
const sticks = `<g ${W}><path d="M30 6 L70 38" fill="none" stroke-width="5"/><path d="M90 6 L50 38" fill="none" stroke-width="5"/><circle cx="30" cy="6" r="4" fill="${CREME}"/><circle cx="90" cy="6" r="4" fill="${CREME}"/></g>`;
const cilindro = (cor, extra = '') => `<path d="M14 44 V78 Q14 92 60 92 Q106 92 106 78 V44" fill="${cor}" ${W}/>${lugs(22, 98, 52, 86, 6)}<ellipse cx="60" cy="44" rx="46" ry="14" fill="${CREME}" ${W}/>${extra}`;

const ART = {
  // PROVISÓRIO (pedido da Bea): só o contorno da caixa, até ela escolher o desenho definitivo. É só trocar este bloco.
  caixa: () => `<g fill="none" ${W}><path d="M14 44V80Q14 92 60 92Q106 92 106 80V44"/><ellipse cx="60" cy="44" rx="46" ry="14"/><path d="M30 6L70 38M90 6L50 38" stroke-width="5"/></g>`,
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

/* ---------- discos de velocidade e ícones de traço (no lugar dos emojis) ---------- */
const DISCO = { devagar: '#8a1a30', normal: '#d99a2b', 'rápido': '#1f6f78', turbo: '#4a79b4', super: '#8a1a30' };
/** Disco de vinil da velocidade `k` (devagar, normal, rápido, turbo, super). */
export function vinil(k, cls = 'vinil') {
  const d = document.createElement('span'); d.className = cls; d.setAttribute('aria-hidden', 'true');
  d.innerHTML = `<svg viewBox="0 0 48 48" width="100%" height="100%" focusable="false"><circle cx="24" cy="24" r="22" fill="#1b0a10" stroke="#fbf7ee" stroke-width="2"/><circle cx="24" cy="24" r="15" fill="none" stroke="#fbf7ee" stroke-opacity=".25" stroke-width="1"/><circle cx="24" cy="24" r="9" fill="${DISCO[k] || '#8a1a30'}"/><circle cx="24" cy="24" r="2.4" fill="#fbf7ee"/></svg>`; return d;
}
const ICO = {
  play: '<path d="M7 4l13 8-13 8z" fill="currentColor" stroke="none"/>',
  ouvir: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 010 7"/>',
  fone: '<path d="M4 14v-2a8 8 0 0116 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
  tela: '<rect x="6" y="3" width="12" height="18" rx="3"/><path d="M10 17h4"/>',
  mic: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>',
  outro: '<path d="M4 8h12l-3-3M20 16H8l3 3"/>',
};
/** Ícone de traço (play, ouvir, fone, tela, mic, outro) com a cor do texto. */
export function icone(nome, cls = 'ico') {
  const d = document.createElement('span'); d.className = cls; d.setAttribute('aria-hidden', 'true');
  d.innerHTML = `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" focusable="false">${ICO[nome] || ''}</svg>`; return d;
}
