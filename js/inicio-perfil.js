// "Sobre mim" do passe (Início): instrumento, estilo favorito e meta. A pessoa escolhe em chips (sem digitar nada). Fica no aparelho (um conjunto por nome) e,
// pra quem tem código, vai pra nuvem junto com o progresso (js/progresso-nuvem.js). Formato: { i, e, m, t } (t = quando mudou; o mais recente ganha).
import { chave as chaveAluno } from './chave-aluno.js';
import { bloqueada } from './palavras-bloqueadas.js';
const KEY = 'bt-inicio-perfil';
export const CHAVE_NUVEM = 'beaterista-inicio-perfil';
/** Os campos e as opções de cada um. A primeira letra do campo (i, e, m) é a chave guardada. */
export const CAMPOS = [
  { k: 'i', nome: 'instrumento', livre: true, max: 20, opcoes: ['bateria', 'teclado', 'violão', 'voz', 'baixo', 'outro'] },
  { k: 'e', nome: 'estilo', livre: true, max: 20, opcoes: ['rock', 'pop', 'MPB', 'sertanejo', 'funk', 'gospel', 'jazz'] },
  { k: 'm', nome: 'meta', livre: true, max: 30, opcoes: ['tocar uma música inteira', 'entrar numa banda', 'perder a vergonha', 'aprender ritmos'] },
];
/** Texto livre (chip "adicionar", em todos os campos): letras, números, espaço e & ' + . -, no máximo `max` caracteres. Palavras que não podem (js/palavras-bloqueadas.js) ficam de fora. */
const limpaTexto = (v, max) => String(v || '').replace(/[^\p{L}\p{N} &'+.-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, max);
export const limpaLivre = (v, max = 20) => { const t = limpaTexto(v, max); return t && !bloqueada(v) && !bloqueada(t) ? t : ''; };
/** Confere o que a pessoa escreveu no "adicionar": { valor, erro } (erro = o recado pra mostrar). */
export function checarLivre(k, raw) {
  const c = CAMPOS.find((x) => x.k === k); const t = limpaTexto(raw, (c && c.max) || 20);
  if (!t) return { valor: '', erro: 'escreva alguma coisa antes.' };
  if (bloqueada(raw) || bloqueada(t)) return { valor: '', erro: 'essa palavra não pode aqui. tente outra!' };
  return { valor: t, erro: '' };
}
/** O valor serve? Opções da lista sempre; texto livre nos campos `livre`. Nunca confia no que vem de fora. */
export const valido = (k, v) => { const c = CAMPOS.find((x) => x.k === k); if (!c) return ''; if (c.opcoes.includes(v)) return v; return c.livre ? limpaLivre(v, c.max) : ''; };
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
