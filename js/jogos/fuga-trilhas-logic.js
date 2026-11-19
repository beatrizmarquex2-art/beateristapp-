// TRILHAS da Fuga do Estúdio: o mesmo mapa (3 mundos × 12 fases + porta B) jogado de novo, cada vez com um ASSUNTO e conteúdo novo.
//  trilha 1 = geral (a Fuga de sempre: as chaves de progresso NÃO têm prefixo, nada se perde) · 2 = ritmo · 3 = teoria · 4 = cordas · 5 em diante = infinita (mistura tudo, sobe um pouquinho a cada volta).
//  Estrelas: nas trilhas 1, 2 e 3 cada porta paga como sempre (uma vez só, na vida, por chave); da 4 em diante as portas NÃO pagam: terminar a trilha inteira dá 1 ★ (uma vez por trilha).
//  Títulos: terminar uma trilha dá "Mestre das Portas I, II, III…" (sobe de nível) e, nas de assunto, o título do assunto. Lógica pura (testada em tests/fuga-trilhas.test.mjs).
import { MUNDOS, FASES, estOf } from './fuga-logic.js';

export const ASSUNTOS = ['ritmo', 'teoria', 'cordas'];
const FIXAS = [
  { n: 1, id: 'geral', nome: 'geral', sub: 'um pouco de tudo', assuntos: ASSUNTOS, paga: 'portas' },
  { n: 2, id: 'ritmo', nome: 'ritmo', sub: 'figuras, bateria e rudimentos', assuntos: ['ritmo'], paga: 'portas', titulo: 'Mestre do Ritmo' },
  { n: 3, id: 'teoria', nome: 'teoria', sub: 'notas, cifras, claves e intervalos', assuntos: ['teoria'], paga: 'portas', titulo: 'Mestre da Teoria' },
  { n: 4, id: 'cordas', nome: 'cordas', sub: 'violão, guitarra, violino e cia', assuntos: ['cordas'], paga: 'trilha', titulo: 'Mestre das Cordas' },
];
/** A trilha `n` (1, 2, 3…): nome, assuntos, quem paga ★ (`portas` | `trilha`) e, na infinita, o `extra` (quanto sobe a dificuldade, 1 a 3) e o `nivelShift`. */
export function trilhaInfo(n) {
  const k = Math.max(1, Math.floor(Number(n) || 1));
  if (k <= FIXAS.length) return { ...FIXAS[k - 1], extra: 0, nivelShift: 0 };
  const volta = k - FIXAS.length;
  return { n: k, id: 'infinita', nome: `infinita · volta ${volta}`, sub: 'mistura tudo, sempre novo', assuntos: ASSUNTOS, paga: 'trilha', extra: Math.min(3, volta), nivelShift: volta >= 3 ? 1 : 0, volta };
}
/** Que jogos trocam de lugar nas trilhas de teoria e cordas (montar/queda são de figuras rítmicas): os dois assuntos ganham jogos com notas, nomes e perguntas. */
export const SUBST = { teoria: { montar: 'caminho', queda: 'mira', queda4: 'genius', compasso: 'mira', intruso: 'pesca' }, cordas: { montar: 'caminho', queda: 'mira', queda4: 'genius', compasso: 'mira', intruso: 'pesca' } };
/** O que a lógica das fases (portasDaFase/faseCfg) precisa saber da trilha. */
export function trilhaCfg(n) {
  const t = trilhaInfo(n); const solo = t.assuntos.length === 1 ? t.assuntos[0] : null;
  return { trilha: t.n, assuntos: t.assuntos, extra: t.extra, nivelShift: t.nivelShift, subst: (solo && SUBST[solo]) || null, area: solo === 'ritmo' ? 'bateria' : solo ? 'notas' : null };
}

/* ---------- progresso por trilha ---------- */
/** Prefixo das chaves de progresso: trilha 1 = nenhum (as chaves de hoje), as outras = "t2:", "t3:"… */
export const prefixo = (n) => (n <= 1 ? '' : `t${n}:`);
/** A visão do progresso de UMA trilha, com as chaves sem prefixo (assim `estOf`, `faseAberta` etc. funcionam igual). */
export function estDaTrilha(all, n) {
  const p = prefixo(n); const out = {};
  for (const [k, v] of Object.entries(all || {})) { if (n <= 1) { if (!/^t\d+:/.test(k)) out[k] = v; } else if (k.startsWith(p)) out[k.slice(p.length)] = v; }
  return out;
}
/** Põe o prefixo da trilha nas chaves de um pedaço de progresso (pra gravar). */
export const paraTrilha = (patch, n) => Object.fromEntries(Object.entries(patch || {}).map(([k, v]) => [`${prefixo(n)}${k}`, v]));
/** Quantas das 36 fases (3 mundos × 12) já têm pelo menos 1 ★ nessa trilha. */
export const fasesFeitas = (all, n) => { const v = estDaTrilha(all, n); return MUNDOS.reduce((t, m) => t + Array.from({ length: FASES }, (_, i) => estOf(v, m.id, i + 1)).filter((x) => x >= 1).length, 0); };
export const FASES_TRILHA = MUNDOS.length * FASES;
/** Terminou a trilha = 1 ★ ou mais nas 36 fases (a porta B não é obrigatória). */
export const trilhaCompleta = (all, n) => fasesFeitas(all, n) >= FASES_TRILHA;
/** A trilha abre quando a anterior está completa (a 1ª sempre abre). */
export const trilhaLiberada = (all, n) => n <= 1 || trilhaCompleta(all, n - 1);
export const motivoTrilha = (n) => `termine a trilha ${n - 1} primeiro (1 ★ nas ${FASES_TRILHA} fases)`;
/** Recomeçar uma trilha: apaga só o progresso dela (as ★ que já foram pagas na vida continuam pagas, o pagamento é por chave). */
export function reiniciar(all, n) {
  const mantem = {}; const p = prefixo(n);
  for (const [k, v] of Object.entries(all || {})) { const dela = n <= 1 ? !/^t\d+:/.test(k) : k.startsWith(p); if (!dela) mantem[k] = v; }
  return mantem;
}

/* ---------- estrelas ---------- */
/** As portas dessa trilha pagam ★? (trilhas 1, 2 e 3: sim · da 4 em diante: não, paga a trilha inteira) */
export const pagaPorPorta = (n) => trilhaInfo(n).paga === 'portas';
/** ★ que terminar a trilha inteira dá (uma vez só): 1 da trilha 4 em diante. */
export const estrelasDaTrilha = (n) => (trilhaInfo(n).paga === 'trilha' ? 1 : 0);
/** A chave do pagamento (estrelas-jogo): trilha 1 mantém as chaves de sempre; as outras levam o "t<n>". */
export const chavePorta = (n, ...partes) => (n <= 1 ? ['fuga', ...partes] : ['fuga', `t${n}`, ...partes]).join('|');
export const chaveTrilha = (n) => `fuga|trilha|${n}`;

/* ---------- títulos ---------- */
export function romano(n) {
  const t = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let r = ''; let v = Math.max(1, Math.floor(n)); for (const [x, s] of t) while (v >= x) { r += s; v -= x; } return r;
}
/** Marca a trilha como concluída e dá os títulos (uma vez só por trilha). `g` = o estado do jogo ({ trilhasFeitas, titulos }). Devolve `{ g, novos, nova }`. */
export function concluirTrilha(g, n) {
  const feitas = Array.isArray(g && g.trilhasFeitas) ? g.trilhasFeitas.slice() : []; const titulos = Array.isArray(g && g.titulos) ? g.titulos.slice() : [];
  if (feitas.includes(n)) return { g: { ...g, trilhasFeitas: feitas, titulos }, novos: [], nova: false };
  feitas.push(n); const novos = []; const tem = (id) => titulos.some((t) => t.id === id);
  const idP = `portas-${feitas.length}`; if (!tem(idP)) novos.push({ id: idP, nome: `Mestre das Portas ${romano(feitas.length)}`, trilha: n });
  const info = trilhaInfo(n); if (info.titulo && !tem(`assunto-${info.id}`)) novos.push({ id: `assunto-${info.id}`, nome: info.titulo, trilha: n });
  return { g: { ...g, trilhasFeitas: feitas, titulos: [...titulos, ...novos] }, novos, nova: true };
}

/* ---------- conteúdo (dicas) por assunto ---------- */
const RE = {
  ritmo: /ritm|compasso|pulso|batida|bumbo|caixa|chimbal|bateria|baqueta|sem[ií]nima|colcheia|semicolcheia|figura|pausa|andamento|metr[ôo]nomo|rudiment|paradiddle|groove|prato|surdo|acento|s[ií]ncope|\btempo/i,
  teoria: /nota|escala|acorde|clave|pauta|intervalo|sustenido|bemol|harmonia|melodia|cifra|oitava|armadura|tr[ií]ade|\b(d[óo]|r[ée]|mi|f[áa]|sol|l[áa]|si)\b|maior|menor|tom\b|semitom/i,
  cordas: /corda|viol[ãa]o|guitarra|baixo|violino|cavaquinho|viola|harpa|violoncelo|afina|dedilhad|palheta|traste|bra[çc]o|\barco\b|ukulele|cavaco/i,
};
const textoDe = (it) => `${it.text || ''} ${it.w || ''} ${it.shown || ''}`;
/** Fica só com as dicas do assunto da trilha. Se sobrarem poucas (`min`), volta pro geral (nunca devolve lista vazia): `{ itens, fallback }`. */
export function filtraAssunto(itens, assuntos, min = 10) {
  const todos = !assuntos || !assuntos.length || ASSUNTOS.every((a) => assuntos.includes(a));
  if (todos) return { itens, fallback: false };
  const ok = itens.filter((it) => (it.banco ? assuntos.includes(it.assunto) : assuntos.some((a) => RE[a] && RE[a].test(textoDe(it))))); // itens do banco verificado já vêm com o assunto
  return ok.length >= min ? { itens: ok, fallback: false } : { itens, fallback: true };
}
/** Dicas que o aluno ainda não viu nessa trilha (se sobrarem menos de `min`, vale tudo de novo). */
export function semVistos(itens, vistos, min = 12) {
  const v = new Set(vistos || []); const novos = itens.filter((it) => !v.has(it.n)); return novos.length >= min ? novos : itens;
}
/** Guarda as dicas vistas (até 300 por trilha, as mais novas). */
export function registraVistos(g, n, ns) {
  const atual = { ...((g && g.vistos) || {}) }; const lista = Array.isArray(atual[n]) ? atual[n] : []; const nova = [...lista.filter((x) => !ns.includes(x)), ...ns].slice(-300); atual[n] = nova; return { ...g, vistos: atual };
}
