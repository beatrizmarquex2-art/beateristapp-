// "Sobre mim" do passe (Início): instrumento, estilo favorito e meta. A pessoa escolhe em chips (sem digitar nada). Fica no aparelho (um conjunto por nome) e,
// pra quem tem código, vai pra nuvem junto com o progresso (js/progresso-nuvem.js). Formato: { i, e, m, t } (t = quando mudou; o mais recente ganha).
import { chave as chaveAluno } from './chave-aluno.js';
const KEY = 'bt-inicio-perfil';
export const CHAVE_NUVEM = 'beaterista-inicio-perfil';
/** Os campos e as opções de cada um. A primeira letra do campo (i, e, m) é a chave guardada. */
export const CAMPOS = [
  { k: 'i', nome: 'instrumento', opcoes: ['bateria', 'teclado', 'violão', 'voz', 'baixo', 'outro'] },
  { k: 'e', nome: 'estilo', opcoes: ['rock', 'pop', 'MPB', 'sertanejo', 'funk', 'gospel', 'jazz'] },
  { k: 'm', nome: 'meta', opcoes: ['tocar uma música inteira', 'entrar numa banda', 'perder a vergonha', 'aprender ritmos'] },
];
const valido = (k, v) => { const c = CAMPOS.find((x) => x.k === k); return c && c.opcoes.includes(v) ? v : ''; }; // nunca confia no que vem de fora
const limpa = (o) => { const r = { t: Number(o && o.t) || 0 }; for (const c of CAMPOS) r[c.k] = valido(c.k, o && o[c.k]); return r; };
const chave = () => chaveAluno(KEY);
const lsLer = () => { try { return localStorage.getItem(chave()); } catch { return null; } };
const lsGravar = (v) => { try { localStorage.setItem(chave(), v); } catch { /* sem armazenamento */ } };
const ler = () => { try { return limpa(JSON.parse(lsLer() || 'null')); } catch { return limpa(null); } };
/** { i, e, m } do aluno de agora ('' = ainda não escolheu). */
export const perfil = () => { const { t: _t, ...resto } = ler(); return resto; };
export function gravar(k, v) {
  const o = ler(); o[k] = valido(k, v); o.t = Date.now(); lsGravar(JSON.stringify(o));
  import('./progresso-nuvem.js').then((m) => m.enviar()).catch(() => { /* sem internet: sobe depois */ });
}
export const paraNuvem = () => { const o = ler(); return o.i || o.e || o.m || o.t ? o : undefined; };
export function daNuvem(n) { if (!n || typeof n !== 'object') return; const novo = limpa(n); if (novo.t > ler().t) lsGravar(JSON.stringify(novo)); }
