// Junta os números do aluno (mundos, fases, figurinhas, estudos, Eco do Paul) e manda pro ranking. Só quem tem CÓDIGO de aluno e deixou "aparecer no ranking" ligado.
// Manda só o nome público ("Ana C.") e os números; nada mais sai do aparelho. Falha em silêncio (sem internet manda depois). Contas em ranking-dados.js.
import * as RK from './ranking.js';
import * as CODE from './codigo.js';
import * as D from './figurinhas/dono.js';
import { jogosParaNuvem } from './jogos/base.js';
import * as P from './kids/progress.js';
import * as ESTRELAS from './figurinhas/estrelas.js';
import { nomePublico, mesDe, quadro, progressoDeJogos, contaEstudos, baseDoMes, sequenciaDeDias, CATEGORIAS } from './ranking-dados.js';

const K_NOME = 'beaterista-aluno-nome'; const K_ON = 'bt-rank-aparecer'; const K_BASE = 'bt-rank-base';
const ls = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };
const json = (k) => { try { return JSON.parse(ls(k) || 'null'); } catch { return null; } };

export const temCodigo = () => !!CODE.saved();
export const aparecer = () => ls(K_ON) !== '0';
export const ligarAparecer = (on) => { lsSet(K_ON, on ? '1' : '0'); if (on) agendar(0); };
export const nomeDoAluno = () => nomePublico(ls(K_NOME) || window.__alunoNome || '');

/** Os números de agora: { mundos, longe, figurinhas, estudos, estrelas, dias, eco, mes: { figurinhas, estudos, estrelas } }. */
export function coletar(agora = new Date()) {
  const jogos = jogosParaNuvem().games || {}; const pj = progressoDeJogos(jogos);
  let figurinhas = 0; try { const st = D.albumDados(); figurinhas = new Set([...Object.keys(st.pasted || {}), ...Object.keys(st.inv || {}).filter((c) => st.inv[c] > 0)]).size; } catch { /* sem álbum */ }
  const estudos = contaEstudos(['beaterista-teoria-feitas', 'beaterista-estudos-vistos', 'beaterista-caminhos-feitos'].map(json));
  const recs = (jogos.genius && jogos.genius.recs) || {}; const eco = Math.max(0, ...Object.values(recs).map(Number).filter(Number.isFinite));
  let estrelas = 0; try { const me = P.active(); if (me) estrelas = ESTRELAS.estrelasTotais(me.id) || 0; } catch { /* sem perfil */ }
  const dias = sequenciaDeDias(json('bt-inicio-dias'), agora);
  const m = baseDoMes(json(K_BASE), mesDe(agora), { figurinhas, estudos, estrelas }); lsSet(K_BASE, JSON.stringify(m.base));
  return { mundos: pj.mundos, longe: pj.fases, figurinhas, estudos, estrelas, dias, eco, mes: m.mes };
}
/** Valor do aluno em cada quadro (pra mostrar "você: 7"). */
export const meu = (n, catId, periodo) => (periodo === 'mes' ? (n.mes[catId] ?? 0) : (n[catId] ?? 0));

let t = 0;
export function agendar(ms = 4000) {
  clearTimeout(t);
  t = setTimeout(() => {
    if (!temCodigo() || !aparecer()) return; const nome = nomeDoAluno(); if (!nome) return; const n = coletar(); const agora = new Date();
    for (const c of CATEGORIAS) {
      const geral = meu(n, c.id, 'geral'); if (geral > 0) RK.add(quadro(c.id, 'geral', agora), nome, geral);
      if (c.mensal) { const mes = meu(n, c.id, 'mes'); if (mes > 0) RK.add(quadro(c.id, 'mes', agora), nome, mes); }
    }
  }, ms);
}
