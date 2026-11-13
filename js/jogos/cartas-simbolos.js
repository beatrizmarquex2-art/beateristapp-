// Uno Musical: as 10 figuras (categorias das cartas) e os ícones das cartas especiais, todos em SVG vetorial (sem emoji, sem fonte).
// Tudo desenhado em 48×64 com currentColor, então a mesma figura serve na carta grande, no canto e na legenda.
const NS = 'http://www.w3.org/2000/svg';

// 12 figuras no baralho. A nota fantasma saiu das cartas (continua desenhada aqui porque o jogo da velha usa o desenho dela).
export const SYMS = ['seminima', 'colcheia', 'semicolcheia', 'fusa', 'p_seminima', 'p_colcheia', 'p_semicolcheia', 'p_fusa', 'acento', 'clave_sol', 'clave_fa', 'ritornelo'];
export const SYM_NAME = {
  seminima: 'semínima', colcheia: 'colcheia', semicolcheia: 'semicolcheia', fusa: 'fusa',
  p_seminima: 'pausa de semínima', p_colcheia: 'pausa de colcheia', p_semicolcheia: 'pausa de semicolcheia', p_fusa: 'pausa de fusa',
  acento: 'acento (>)', fantasma: 'nota fantasma (entre parênteses)', clave_sol: 'clave de sol', clave_fa: 'clave de fá', ritornelo: 'ritornelo (sinal de repetição)',
};

/** Nome curto (cabe em 2 linhas na carta) e o que a figura significa (tela de aprender). */
export const SYM_SHORT = { seminima: 'semínima', colcheia: 'colcheia', semicolcheia: 'semi-colcheia', fusa: 'fusa', p_seminima: 'pausa semínima', p_colcheia: 'pausa colcheia', p_semicolcheia: 'pausa semi-colcheia', p_fusa: 'pausa fusa', acento: 'acento', fantasma: 'fantasma', clave_sol: 'clave de sol', clave_fa: 'clave de fá', ritornelo: 'ritornelo' };
export const SYM_LEARN = {
  seminima: 'dura 1 tempo. é a nota que a gente conta: 1, 2, 3, 4.',
  colcheia: 'dura meio tempo: duas colcheias cabem em 1 tempo ("1 e").',
  semicolcheia: 'dura um quarto de tempo: quatro semicolcheias cabem em 1 tempo.',
  fusa: 'dura um oitavo de tempo: oito fusas cabem em 1 tempo. são rapidinhas!',
  p_seminima: 'é um silêncio que dura 1 tempo, igual à semínima. a gente conta, mas não toca.',
  p_colcheia: 'é um silêncio de meio tempo, igual à colcheia.',
  p_semicolcheia: 'é um silêncio de um quarto de tempo, igual à semicolcheia.',
  p_fusa: 'é um silêncio de um oitavo de tempo, igual à fusa.',
  acento: 'o sinal ">" quer dizer: toque essa nota mais forte!',
  fantasma: 'nota fantasma (entre parênteses): toque bem baixinho, quase sem som.',
  clave_sol: 'a clave de sol marca as notas mais agudas. ela abre a pauta de melodias, como a do violão e a do piano (mão direita).',
  clave_fa: 'a clave de fá marca as notas mais graves. ela abre a pauta do baixo e da mão esquerda do piano.',
  ritornelo: 'o ritornelo (dois pontinhos e as barras) quer dizer: repita o trecho! volte pro começo e toque de novo.',
};

const f1 = (n) => Math.round(n * 10) / 10;

/** Cabeça preenchida + haste (+ bandeirolas). `x` é o centro da cabeça; flags = 0..3. */
function note(x, flags) {
  const top = flags >= 3 ? 4 : flags === 2 ? 6 : 8; const sx = x + 8.6; // haste na lateral direita da cabeça
  let s = `<ellipse cx="${x}" cy="49" rx="9.4" ry="6.6" transform="rotate(-24 ${x} 49)" fill="currentColor"/>`;
  s += `<path d="M${sx} 47V${top}" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" fill="none"/>`;
  for (let i = 0; i < flags; i++) {
    const y = top + i * 9.5;
    s += `<path d="M${f1(sx - 1.4)} ${y}c0 8 14.5 10.5 12.5 24c-2.6-8-7.4-10.2-12.5-11.2z" fill="currentColor"/>`;
  }
  return s;
}

/** Pausa de colcheia/semicolcheia/fusa: haste diagonal com 1, 2 ou 3 bolinhas (cada uma com sua curva). */
function restBalls(k) {
  const len = 36 + k * 6.5; const x0 = 33; const y0 = 4; const slope = 0.3; // haste desce para a esquerda
  const sx = (y) => f1(x0 - (y - y0) * slope);
  let s = `<path d="M${x0} ${y0}L${sx(y0 + len)} ${y0 + len}" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" fill="none"/>`;
  for (let i = 0; i < k; i++) {
    const y = 12 + i * 12.5; const cx = f1(sx(y + 5) - 15); const cy = y + 7;
    s += `<circle cx="${cx}" cy="${cy}" r="4.9" fill="currentColor"/>`;
    s += `<path d="M${f1(cx + 2)} ${f1(cy + 4.4)}Q${f1(cx + 13)} ${f1(cy + 5.4)} ${sx(y)} ${y}" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" fill="none"/>`;
  }
  return s;
}

// clave de sol, clave de fá e ritornelo: traços simples (48×64, currentColor), na mesma espessura das outras figuras
const CLAVE_SOL = '<path d="M26 6V52C26 58 20 60 19 56" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><circle cx="19" cy="57" r="2.9" fill="currentColor"/><path d="M26 8C32 2 36 10 32 18C28 26 12 32 13 43C14 52 26 55 32 47C36 41 31 34 25 36C20 38 20 44 25 44" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>';
const CLAVE_FA = '<path d="M11 24C11 14 21 10 28 12C37 14 39 25 35 36C32 44 25 51 14 56" fill="none" stroke="currentColor" stroke-width="3.8" stroke-linecap="round"/><circle cx="12" cy="24" r="5.2" fill="currentColor"/><circle cx="42" cy="21" r="2.9" fill="currentColor"/><circle cx="42" cy="34" r="2.9" fill="currentColor"/>';
const RITORNELO = '<circle cx="11" cy="25" r="3.2" fill="currentColor"/><circle cx="11" cy="39" r="3.2" fill="currentColor"/><path d="M21 10V54" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M32 10V54" stroke="currentColor" stroke-width="7" stroke-linecap="butt"/>';

export const SYM_SVG = {
  seminima: note(22, 0),
  colcheia: note(18, 1),
  semicolcheia: note(18, 2),
  fusa: note(18, 3),
  // pausa de semínima: zigue-zague grosso e o gancho de baixo
  p_seminima: '<path d="M21 5L32 18L19 33" stroke="currentColor" stroke-width="6.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M19 33C32 37 34 47 25 56" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" fill="none"/><circle cx="19" cy="52" r="5.4" fill="currentColor"/>',
  p_colcheia: restBalls(1),
  p_semicolcheia: restBalls(2),
  p_fusa: restBalls(3),
  acento: '<path d="M7 17L40 32L7 47" stroke="currentColor" stroke-width="7.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  // nota fantasma: semínima entre parênteses
  clave_sol: CLAVE_SOL,
  clave_fa: CLAVE_FA,
  ritornelo: RITORNELO,
  fantasma: `${note(24, 0)}<path d="M11 13Q-1 32 11 55M37 13Q49 32 37 55" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" fill="none"/>`,
};

// ícones das cartas especiais (cores próprias onde fizer sentido)
export const ACT_SVG = {
  pular: '<circle cx="24" cy="32" r="17" fill="none" stroke="currentColor" stroke-width="6.5"/><path d="M12 44L36 20" stroke="currentColor" stroke-width="6.5" stroke-linecap="round"/>',
  inverter: '<path d="M6 22H34M26 11L38 22L26 33M42 43H14M22 32L10 43L22 54" fill="none" stroke="currentColor" stroke-width="5.6" stroke-linecap="round" stroke-linejoin="round"/>',
  curinga: '<path d="M24 32V10a22 22 0 0122 22z" fill="#C1122F"/><path d="M24 32h22a22 22 0 01-22 22z" fill="#1B4FA0"/><path d="M24 32v22A22 22 0 012 32z" fill="#1E8A44"/><path d="M24 32H2A22 22 0 0124 10z" fill="#F2B01E"/><circle cx="24" cy="32" r="22" fill="none" stroke="#142036" stroke-width="2.4"/>',
  mais2: '<rect x="8" y="22" width="22" height="31" rx="3.5" transform="rotate(-10 19 37)" fill="none" stroke="currentColor" stroke-width="4"/><rect x="19" y="14" width="22" height="31" rx="3.5" transform="rotate(8 30 29)" fill="currentColor"/>',
  mais4: '<rect x="3" y="26" width="15" height="22" rx="2.6" transform="rotate(-18 10 37)" fill="#C1122F"/><rect x="11" y="20" width="15" height="22" rx="2.6" transform="rotate(-6 18 31)" fill="#F2B01E"/><rect x="21" y="18" width="15" height="22" rx="2.6" transform="rotate(6 28 29)" fill="#1E8A44"/><rect x="29" y="22" width="15" height="22" rx="2.6" transform="rotate(18 36 33)" fill="#1B4FA0"/>',
};
export const ACT_LABEL = { mais2: '+2', mais4: '+4' };

function mk(inner, cls) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 48 64'); s.setAttribute('class', cls); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
  s.innerHTML = inner; return s;
}
/** SVG de uma figura (id de SYMS). */
export const symbolEl = (id, cls = 'cx-sym') => mk(SYM_SVG[id], cls);
/** SVG de uma carta especial (pular, inverter, curinga, mais2, mais4). */
export const actionEl = (kind, cls = 'cx-sym') => mk(ACT_SVG[kind], cls);
