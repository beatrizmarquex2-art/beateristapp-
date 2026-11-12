// Vários alunos no mesmo aparelho: cada "conta" é um nome + um código. Trocar de conta só troca o nome e o código ativos;
// foto do perfil, coleção e figurinhas ficam separadas por nome/código (veja figurinhas/dono.js). Nada disso sobe pro servidor.
import * as CODE from './codigo.js';
const KEY = 'beaterista-aluno-contas', NOME = 'beaterista-aluno-nome', ALBUM = 'beaterista-album-code';
const get = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const set = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* ok */ } };
const clean = (n) => String(n || '').replace(/\s+/g, ' ').trim().slice(0, 20);
export function lista() { try { const l = JSON.parse(get(KEY) || '[]'); return Array.isArray(l) ? l.filter((x) => x && x.nome && x.code) : []; } catch { return []; } }
const grava = (l) => set(KEY, JSON.stringify(l));
export const atual = () => ({ nome: get(NOME), code: CODE.saved() || get(ALBUM) });
/** Põe (ou atualiza) uma conta na lista. */
export function guardarConta({ nome, code }) {
  const n = clean(nome), c = CODE.norm(code); if (!n || !c) return;
  grava([{ nome: n, code: c }, ...lista().filter((x) => x.code !== c && x.nome.toLowerCase() !== n.toLowerCase())]);
}
/** A conta que está ativa agora entra na lista (pra dar pra voltar a ela). */
export function guardarAtual() { const a = atual(); if (a.nome && a.code) guardarConta(a); }
export function esquecer(code) { grava(lista().filter((x) => x.code !== CODE.norm(code))); CODE.liberarAparelho(code); /* libera a vaga (máx. 2 aparelhos por código) */ }
/** Liga a conta: nome + código ativos (Beat Hero e álbum). Quem chama recarrega a tela. */
export function ativar({ nome, code }) { const c = CODE.norm(code); set(NOME, clean(nome)); CODE.guardar(c); set(ALBUM, c); window.__alunoNome = clean(nome); }
/** Sem conta: só esquece o código deste aparelho (o nome vai ser digitado de novo). */
export function semConta() { guardarAtual(); const c0 = CODE.saved(); if (c0) CODE.liberarAparelho(c0); set(NOME, ''); CODE.sair(); set(ALBUM, ''); set('beaterista-aluno-codigo-pendente', ''); window.__alunoNome = ''; window.__alunoCodigo = ''; window.__alunoCodigoPend = ''; }
