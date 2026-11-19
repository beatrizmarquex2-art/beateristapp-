// Banco de conteúdo VERIFICADO: perguntas e termos tirados, trecho por trecho, dos PDFs da Bea (cartas do dicionário, cartas de instrumentos, livros Robôterista).
// Os arquivos vêm de scripts/gera-banco.mjs → assets/jogos/banco/<assunto>.json. Aqui só se carrega (sob demanda, funciona offline pelo SW) e se converte
// pro formato que os jogos já usam. Item: { i, a: assunto, t: 'definicao'|'lacuna'|'vf', n: 'f'|'m'|'d', q, r, o: [3 erradas], f: [pdf, página], c: âncora, k? }.
import { norm } from './tips.js';

export const ASSUNTOS_BANCO = ['ritmo', 'teoria', 'cordas', 'dicionario'];
export const NIVEIS = { facil: 'f', medio: 'm', dificil: 'd' };
const cache = new Map(); // assunto → itens
let pendente = null;

/** Carrega (uma vez) os arquivos do banco. Sem rede e sem cache, devolve o que houver (nunca quebra). `ler(assunto)` troca o jeito de ler (testes). */
export function carregaBanco(assuntos = ASSUNTOS_BANCO, ler = null) {
  const falta = assuntos.filter((a) => !cache.has(a)); if (!falta.length) return Promise.resolve(bancoCarregado(assuntos));
  const leitor = ler || ((a) => fetch(new URL(`../assets/jogos/banco/${a}.json`, import.meta.url).href).then((r) => (r.ok ? r.json() : [])));
  pendente = Promise.all(falta.map((a) => Promise.resolve().then(() => leitor(a)).then((l) => cache.set(a, Array.isArray(l) ? l : [])).catch(() => {}))).then(() => bancoCarregado(assuntos));
  return pendente;
}
export const bancoCarregado = (assuntos = ASSUNTOS_BANCO) => assuntos.flatMap((a) => cache.get(a) || []);
/** Só pros testes: põe itens direto no cache. */
export function _poeNoBanco(assunto, itens) { cache.set(assunto, itens); }
export function _limpaBanco() { cache.clear(); }

const LETRAS_OK = /^[A-Z]{4,11}$/;
/** Itens do banco no formato das dicas (`{ n, text, w, shown, cands, termo, assunto, nivel, banco }`) que o quiz, a caça-palavras e a cruzadinha já entendem.
 *  Entram: definição → termo (de uma palavra só, 4 a 11 letras) e lacuna (a frase volta inteira, com a palavra no lugar). */
export function comoDicas(itens = bancoCarregado()) {
  const out = [];
  itens.forEach((it, idx) => {
    if (it.t === 'vf' || it.k === 'ingles' || it.k === 'vale') return;
    const w = norm(it.r).replace(/\s+/g, ''); if (/\s/.test(it.r) || !LETRAS_OK.test(w)) return;
    const text = it.t === 'lacuna' ? it.q.replace('_____', it.r) : it.q;
    out.push({ n: 900000 + idx, text, w, shown: it.r, cands: [], termo: true, assunto: it.a, nivel: it.n, banco: true, fonte: it.f, o: it.o });
  });
  return out;
}
/** Os mesmos itens, mas já filtrados por assunto e nível (`niveis`: ['f','m','d']). */
export function doBanco({ assuntos = null, niveis = null, tipos = null } = {}) {
  return bancoCarregado().filter((it) => (!assuntos || assuntos.includes(it.a)) && (!niveis || niveis.includes(it.n)) && (!tipos || tipos.includes(it.t)));
}
/** Pares (carta A ↔ carta B) pra memória, só com texto curto e vindos do banco: termo ↔ nome em inglês e figura ↔ valor. `area`: ritmo | teoria | cordas. */
export function paresDoBanco(area, itens = bancoCarregado()) {
  const vistos = new Set(); const out = [];
  for (const it of itens) {
    if (it.a !== area || (it.k !== 'ingles' && it.k !== 'vale')) continue;
    let a; let b = it.r;
    if (it.k === 'ingles') { const m = /“(.+)”/.exec(it.q); a = m && m[1]; } else { const m = /^quanto vale a (.+)\?$/.exec(it.q); a = m && m[1]; }
    if (!a || !b || a.length > 24 || b.length > 24 || vistos.has(a) || vistos.has(b)) continue; vistos.add(a); vistos.add(b); out.push({ a, b, banco: true });
  }
  return out;
}
/** Perguntas curtas pra pesca e mira: `{ area, certo, q }` com a resposta ≤ 28 letras e o enunciado ≤ 100. */
export function qaDoBanco(itens = bancoCarregado()) {
  return itens.filter((it) => it.t === 'definicao' && !it.k && ['ritmo', 'teoria', 'cordas'].includes(it.a) && it.q.length <= 100 && it.r.length <= 28).map((it) => ({ area: it.a, certo: it.r, q: it.q, banco: true }));
}
