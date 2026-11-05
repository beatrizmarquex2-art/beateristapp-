// Acesso do aluno (aluno.html): sem código vale só o modo livre; com código (dado pela Bea) vale tudo.
// Este módulo só guarda o estado e as regras de quais telas ficam trancadas. O código em si está em codigo.js.
let ok = false;
export const liberado = () => ok;
export function definir(v) { v = !!v; if (v !== ok) { ok = v; try { document.dispatchEvent(new CustomEvent('aluno-acesso', { detail: v })); } catch { /* sem DOM */ } } }

// telas do modo livre dentro do Kids (as outras são o modo aventura: fases, estrelas e figurinhas)
const KIDS_LIVRES = new Set(['explorar', 'memoria', 'ritmo', 'relatorio-jogos']);
/** O endereço (#/...) está trancado para quem não tem código? */
export function trancado(hash) {
  if (ok) return false;
  if (/\/aventura(\/|$)/.test(String(hash || ''))) return true; // Modo Aventura (mapas, missões, estrelas e medalhas) só com código; o Modo Livre de cada jogo fica aberto
  const m = /^#\/([^/?]+)(?:\/([^/?]*))?/.exec(String(hash || '')); if (!m) return false;
  const [, a, b] = m;
  if (['ranking', 'album', 'ritmo', 'dicionario', 'dicas'].includes(a)) return true; // o ritmo todo (Beat Hero, Piano Hero, músicas) só com código
  if (a === 'kids') return !(b && KIDS_LIVRES.has(b)); // #/kids sozinho (fases e estrelas) e as fases ficam trancados
  return false; // jogos, ritmo (trava por dentro), tocar, toque, piano, relatório
}
