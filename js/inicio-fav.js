// Bandas e cantores favoritos do aluno (aba Início). Ficam no aparelho (um conjunto por nome) e, pra quem tem código, vão pra nuvem junto com o progresso
// (js/progresso-nuvem.js), então aparecem em qualquer celular do aluno. Formato: { a: [até 3 nomes], t: quando mudou }. Em conflito vale o mais recente.
const KEY = 'bt-inicio-favoritos';
import { chave as chaveAluno } from './chave-aluno.js';
const chave = () => chaveAluno(KEY);
const lsLer = () => { try { return localStorage.getItem(chave()); } catch { return null; } };
const lsGravar = (v) => { try { localStorage.setItem(chave(), v); } catch { /* sem armazenamento */ } };
export const CHAVE_NUVEM = 'beaterista-inicio-fav';
const ler = () => {
  try { const v = JSON.parse(lsLer() || 'null'); if (Array.isArray(v)) return { a: v.slice(0, 6), t: 0 }; return v && Array.isArray(v.a) ? { a: v.a.slice(0, 6), t: Number(v.t) || 0 } : { a: [], t: 0 }; } catch { return { a: [], t: 0 }; }
};
export const favoritos = () => ler().a;
export function gravar(a) {
  lsGravar(JSON.stringify({ a: a.slice(0, 6), t: Date.now() }));
  import('./progresso-nuvem.js').then((m) => m.enviar()).catch(() => { /* sem internet: sobe depois */ });
}
/** O que vai pra nuvem (nada se o aluno nunca escolheu). */
export const paraNuvem = () => { const o = ler(); return o.a.length || o.t ? o : undefined; };
/** Chegou da nuvem: fica o mais recente. */
export function daNuvem(n) { if (!n || !Array.isArray(n.a)) return; const l = ler(); if ((Number(n.t) || 0) > l.t) lsGravar(JSON.stringify({ a: n.a.slice(0, 6), t: Number(n.t) })); }
