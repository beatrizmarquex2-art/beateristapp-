// Meta do dia e sequência da aba Estudos (área dos alunos). Tudo fica só neste aparelho (localStorage).
// Meta de hoje = 3 coisinhas: ver uma dica musical, passar por um passo de aula do Paul e ler uma curiosidade de músico.
export const METAS = [['dica', 'dica musical do dia'], ['aula', 'um passo de aula do Paul'], ['curiosidade', 'curiosidade de músico']];
const KEY = 'beaterista-estudos-meta';
const dia = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const ontem = (d = new Date()) => { const o = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1); return dia(o); };

/** Lê o estado: { hoje: 'AAAA-MM-DD', feitas: [ids], seq: dias seguidos com meta cumprida, ultimo: último dia cumprido }. */
export function ler(store = globalThis.localStorage, d = new Date()) {
  let s = null; try { s = JSON.parse(store.getItem(KEY) || 'null'); } catch { s = null; }
  const hoje = dia(d);
  if (!s || typeof s !== 'object') s = { hoje, feitas: [], seq: 0, ultimo: '' };
  if (s.hoje !== hoje) s = { hoje, feitas: [], seq: s.ultimo === ontem(d) || s.ultimo === hoje ? Number(s.seq) || 0 : 0, ultimo: s.ultimo || '' };
  s.feitas = (Array.isArray(s.feitas) ? s.feitas : []).filter((x) => METAS.some(([k]) => k === x));
  return s;
}
/** Marca uma meta de hoje como feita (sem repetir). Ao fechar as 3, soma 1 na sequência (1x por dia). Devolve o estado novo. */
export function marcar(id, store = globalThis.localStorage, d = new Date()) {
  const s = ler(store, d);
  if (!METAS.some(([k]) => k === id) || s.feitas.includes(id)) return s;
  s.feitas = [...s.feitas, id];
  if (s.feitas.length === METAS.length && s.ultimo !== s.hoje) { s.seq = (s.ultimo === ontem(d) ? s.seq : 0) + 1; s.ultimo = s.hoje; }
  try { store.setItem(KEY, JSON.stringify(s)); } catch { /* sem armazenamento: só não lembra */ }
  return s;
}
export const cumprida = (s) => s.feitas.length >= METAS.length;
/** Sequência que vale mostrar hoje (se a meta de ontem foi cumprida e a de hoje ainda não, ela segue viva). */
export const sequencia = (s, d = new Date()) => (s.ultimo === s.hoje || s.ultimo === ontem(d) ? s.seq : 0);
