// Acesso do aluno (aluno.html): sem código vale só o modo livre; com código (dado pela Bea) vale tudo.
// Este módulo só guarda o estado e as regras de quais telas ficam trancadas. O código em si está em codigo.js.
let ok = false;
const ESC_KEY = 'beaterista-aluno-escopo';
/** Passe com escopo: lista de telas liberadas (prefixos de endereço, ex.: '#/jogos/cartas'). null = código completo (tudo). */
export const escopo = () => { try { const e = JSON.parse(localStorage.getItem(ESC_KEY) || 'null'); return Array.isArray(e) && e.length ? e.map(String) : null; } catch { return null; } };
/** Vale tudo (código de aluno, professora ou test drive)? Passe de um jogo só NÃO conta: estrelas, álbum e o resto seguem trancados. */
export const liberado = () => ok && !escopo();
/** Tem algum código válido (mesmo que só de um jogo)? */
export const comCodigo = () => ok;
const noEscopo = (hash) => { const e = escopo(); const h = String(hash || ''); return !!e && e.some((p) => (p === '/aventura' ? h.includes('/aventura') : h === p || h.startsWith(`${p}/`) || h.startsWith(`${p}?`))); };
export function definir(v) { v = !!v; if (v !== ok) { ok = v; try { document.dispatchEvent(new CustomEvent('aluno-acesso', { detail: v })); } catch { /* sem DOM */ } } }

// telas do modo livre dentro do Kids (as outras são o modo aventura: fases, estrelas e figurinhas)
const KIDS_LIVRES = new Set(['explorar', 'memoria', 'ritmo', 'relatorio-jogos']);
/** O endereço (#/...) está trancado para quem não tem código? */
export function trancado(hash) {
  if (ok && (!escopo() || noEscopo(hash))) return false; // código completo, ou a tela que o passe libera
  if (/\/aventura(\/|$)/.test(String(hash || ''))) return true; // Modo Aventura (mapas, missões, estrelas e medalhas) só com código; o Modo Livre de cada jogo fica aberto
  const m = /^#\/([^/?]+)(?:\/([^/?]*))?/.exec(String(hash || '')); if (!m) return false;
  const [, a, b] = m;
  if (['ranking', 'album', 'ritmo', 'paulta'].includes(a)) return true; // o ritmo todo (Beat Hero, Piano Hero, músicas) e a pauLta só com código. Dicionário, Letras e a aulinha abrem com AMOSTRA grátis (js/amostra.js)
  if (a === 'estudos' && b === 'dicas') return true; // a lista de dicas do método pra estudar: só com código
  if (a === 'jogos' && (b === 'toca' || b === 'cartas' || b === 'un' || b === 'quizuno' || b === 'figurix')) return true; // Toca Aqui, Uno Musical, UN🚫 e Figurix (figuras rítmicas) ensinam de verdade: só com código
  if (a === 'kids' && b === 'figuras' && /^#\/kids\/figuras\/aula(\/|$)/.test(String(hash || ''))) return false; // aulinha do Paul: amostra grátis
  if (a === 'kids') return !(b && KIDS_LIVRES.has(b)); // #/kids sozinho (fases e estrelas) e as fases ficam trancados
  return false; // jogos, ritmo (trava por dentro), tocar, toque, piano, relatório
}
