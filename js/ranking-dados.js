// Ranking dos alunos (pedido da Bea, nov/2026): quadros com setinhas pro lado; pódio 1º, 2º e 3º com o nome. Aqui só as contas (puras, testadas em tests/ranking-dados.test.mjs).
// Sem mexer no servidor: usa os quadros livres do ranking que já existe (js/ranking.js: ranking_top / ranking_add, fica a melhor pontuação de cada nome).
// Quadro do mês = o mês faz parte do nome do quadro, então ele "zera" sozinho todo dia 1.

/** Cada quadro. `mensal`: tem versão "este mês" (quem mais juntou NESTE mês). `unidade`: como aparece ao lado do número. */
export const CATEGORIAS = [
  { id: 'mundos', titulo: 'Mundos terminados', sub: 'quem já fechou mundos inteiros', emoji: '🌎', unidade: ['mundo', 'mundos'], mensal: false },
  { id: 'longe', titulo: 'Chegou mais longe', sub: 'fases vencidas nos jogos de mapa', emoji: '🚀', unidade: ['fase', 'fases'], mensal: false },
  { id: 'estrelas', titulo: 'Mais estrelas', sub: 'estrelas ganhas nos jogos e nas fases', emoji: '', unidade: ['estrela', 'estrelas'], mensal: true },
  { id: 'figurinhas', titulo: 'Mais figurinhas', sub: 'quem tem mais figurinhas no álbum', emoji: '🃏', unidade: ['figurinha', 'figurinhas'], mensal: true },
  { id: 'estudos', titulo: 'Quem mais estudou', sub: 'aulas, dicas e caminhos de estudo feitos', emoji: '📚', unidade: ['estudo', 'estudos'], mensal: true },
  { id: 'dias', titulo: 'Dias seguidos', sub: 'maior sequência de dias treinando', emoji: '', unidade: ['dia', 'dias'], mensal: false },
  { id: 'eco', titulo: 'Eco do Paul', sub: 'mais notas decoradas de uma vez', emoji: '🥁', unidade: ['nota', 'notas'], mensal: false },
];
export const categoriaPorId = (id) => CATEGORIAS.find((c) => c.id === id) || CATEGORIAS[0];
export const textoUnidade = (cat, n) => `${n} ${cat.unidade[n === 1 ? 0 : 1]}`;

/** "Maria Clara Souza" → "Maria S." (primeiro nome + inicial do último; um nome só fica como está). Nunca o nome completo. */
export function nomePublico(nome) {
  const p = String(nome || '').replace(/[^\p{L}\p{N} '’-]/gu, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean); if (!p.length) return '';
  const cap = (s) => s.charAt(0).toLocaleUpperCase('pt-BR') + s.slice(1).toLocaleLowerCase('pt-BR');
  const primeiro = cap(p[0]).slice(0, 14); return p.length === 1 ? primeiro : `${primeiro} ${p[p.length - 1].charAt(0).toLocaleUpperCase('pt-BR')}.`;
}
/** "2026-11" */
export const mesDe = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
/** Nome do quadro no servidor. */
export const quadro = (catId, periodo, d = new Date()) => `rk|${catId}|${periodo === 'mes' ? mesDe(d) : 'geral'}`;

/**
 * Das chaves dos jogos (getGame(x).est = { "mundo:fase": estrelas }) tira: fases vencidas (≥1 ★) e mundos terminados (as 12 fases).
 * `games` = { fuga, figurix, toca, detetive, … } (o que jogosParaNuvem().games devolve).
 */
export function progressoDeJogos(games, fasesPorMundo = 12) {
  let fases = 0; let mundos = 0;
  for (const jogo of ['fuga', 'figurix', 'toca', 'detetive']) {
    const est = games && games[jogo] && games[jogo].est; if (!est || typeof est !== 'object') continue;
    const por = {};
    for (const [k, v] of Object.entries(est)) { const m = /^(.+):(\d+)$/.exec(k); if (!m || !(Number(v) >= 1)) continue; const n = Number(m[2]); if (n < 1 || n > fasesPorMundo) continue; (por[m[1]] ||= new Set()).add(n); }
    for (const s of Object.values(por)) { fases += s.size; if (s.size >= fasesPorMundo) mundos++; }
  }
  return { fases, mundos };
}
/** Conta estudos feitos: valores guardados (lista = tamanho; objeto = nº de chaves; número = ele mesmo). */
export function contaEstudos(valores) {
  return (valores || []).reduce((t, v) => t + (Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : Number(v) > 0 ? Math.floor(Number(v)) : 0), 0);
}
/** Dias seguidos até hoje (se hoje ainda não entrou, conta até ontem). `dias` = lista "AAAA-MM-DD" dos dias de uso. */
export function sequenciaDeDias(dias, hoje = new Date()) {
  const f = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const set = new Set(Array.isArray(dias) ? dias : []); const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()); let n = 0; if (!set.has(f(d))) d.setDate(d.getDate() - 1);
  while (set.has(f(d))) { n++; d.setDate(d.getDate() - 1); } return n;
}
/** Ponto de partida do mês: guarda as contagens de quando o mês começou a ser visto; "este mês" = agora − essa contagem (nunca negativo). `atual` = { figurinhas, estudos, estrelas }. */
export function baseDoMes(base, mes, atual) {
  const chaves = Object.keys(atual); const b = base && base.mes === mes ? { ...atual, ...base } : { mes, ...atual };
  const feito = {}; for (const k of chaves) feito[k] = Math.max(0, (Number(atual[k]) || 0) - (Number(b[k]) || 0));
  return { base: b, mes: feito };
}
/** Pódio: 1º, 2º, 3º (com medalha) e o resto 4º a 10º. */
export const MEDALHAS = ['🥇', '🥈', '🥉'];
export function podio(rows) {
  const l = (rows || []).filter((r) => r && r.name && Number(r.score) > 0).slice(0, 10);
  return { top3: l.slice(0, 3).map((r, i) => ({ pos: i + 1, medalha: MEDALHAS[i], nome: r.name, pontos: Number(r.score) })), resto: l.slice(3).map((r, i) => ({ pos: i + 4, nome: r.name, pontos: Number(r.score) })) };
}
/** Próxima categoria andando `d` (+1/−1) com volta. */
export const anda = (i, d, n = CATEGORIAS.length) => (((i + d) % n) + n) % n;
