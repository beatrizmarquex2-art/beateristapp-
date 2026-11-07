// Busca da turma (modo professora): lógica pura, sem tela.
/** minúsculas e sem acento, pra "jose" achar "José" */
export const plano = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
/** Filtra a turma pelo que foi digitado (qualquer pedaço do nome, cada palavra). */
export function filtrar(turma, q) {
  const ws = plano(q).split(/\s+/).filter(Boolean);
  const l = (turma || []).filter((a) => { const n = plano(a.nome); return ws.every((w) => n.includes(w)); });
  return l.sort((a, b) => plano(a.nome).localeCompare(plano(b.nome)));
}
