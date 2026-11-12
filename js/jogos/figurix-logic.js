// Figurix (regras puras, sem tela): 12 fases com as ideias da Bea sobre as figuras rítmicas. Testado em tests/figurix.test.mjs.
import { FIGS, FIG_BY } from '../kids/figs.js';

/** As 12 primeiras fases (a ordem é a da lista de ideias da Bea) e mais 50 no mesmo estilo, com a dificuldade (`nivel`) subindo de 10 em 10. */
const BASE = [
  { n: 1, tipo: 'rapida', nivel: 1, titulo: 'qual é a mais rápida?' },
  { n: 2, tipo: 'lenta', nivel: 1, titulo: 'qual é a mais lenta?' },
  { n: 3, tipo: 'monte', nivel: 1, titulo: 'monte a figura' },
  { n: 4, tipo: 'ligar', nivel: 1, k: 3, titulo: 'ligue as 3 figuras' },
  { n: 5, tipo: 'ligar', nivel: 1, k: 5, titulo: 'ligue as 5 figuras' },
  { n: 6, tipo: 'memoria', nivel: 1, titulo: 'memória das pausas' },
  { n: 7, tipo: 'quiz', nivel: 1, titulo: 'quiz' },
  { n: 8, tipo: 'caca', nivel: 1, titulo: 'caça-palavras' },
  { n: 9, tipo: 'notas', nivel: 1, titulo: 'monte as notas' },
  { n: 10, tipo: 'tetris', nivel: 1, titulo: 'tetris do Roboterista' },
  { n: 11, tipo: 'quiz', nivel: 2, titulo: 'quiz difícil' },
  { n: 12, tipo: 'tetris', nivel: 2, titulo: 'tetris rápido' },
];
export const CICLO = ['rapida', 'lenta', 'monte', 'ligar', 'memoria', 'quiz', 'caca', 'notas', 'tetris', 'quiz'];
const TITULOS = { rapida: 'qual é a mais rápida?', lenta: 'qual é a mais lenta?', monte: 'monte a figura', ligar: 'ligue', memoria: 'memória', quiz: 'quiz', caca: 'caça-palavras', notas: 'monte as notas', tetris: 'tetris do Roboterista' };
export const PHASES = [...BASE, ...Array.from({ length: 50 }, (_, i) => { const tipo = CICLO[i % 10]; return { n: 13 + i, tipo, nivel: 3 + Math.floor(i / 10), titulo: TITULOS[tipo] }; })];
export const FASES = PHASES.length; // 62
export const ids = FIGS.map((f) => f.id);
const shuffle = (a, rnd = Math.random) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export { shuffle };
const pick = (a, n, rnd) => shuffle(a, rnd).slice(0, n);

/** "qual é a mais rápida/lenta?": 3 figuras com valores diferentes. A 1ª pergunta de cada fase é a da Bea (semínima/colcheia/semicolcheia; mínima/semibreve/semínima). */
export function rapidaLenta(tipo, i, rnd = Math.random) {
  const fixa = tipo === 'rapida' ? ['seminima', 'colcheia', 'semicolcheia'] : ['minima', 'semibreve', 'seminima'];
  const figs = i === 0 ? fixa : pick(ids.slice(0, i < 3 ? 5 : 7), 3, rnd);
  const ordem = figs.slice().sort((a, b) => FIG_BY[a].beats - FIG_BY[b].beats); // mais curta primeiro
  return { figs: i === 0 ? shuffle(fixa, rnd) : figs, ok: tipo === 'rapida' ? ordem[0] : ordem[2] }; // rápida = a que dura MENOS; lenta = a que dura MAIS
}
/** "monte a figura": cada rodada pede uma figura; o aluno escolhe a cabeça, a haste e os colchetes. A 1ª é a colcheia (ideia da Bea). */
export const MONTES = ['colcheia', 'seminima', 'minima', 'semicolcheia', 'semibreve'];
export const peçasDe = (id) => ({ cabeca: FIG_BY[id].open ? 'vazia' : 'cheia', haste: FIG_BY[id].stem, colchetes: FIG_BY[id].flags });
export const confereMonte = (id, m) => { const p = peçasDe(id); return { cabeca: m.cabeca === p.cabeca, haste: m.haste === p.haste, colchetes: m.colchetes === p.colchetes }; };
/** "ligar": k figuras de um lado e os nomes embaralhados do outro. */
export function paresLigar(k, rnd = Math.random) { const fs = pick(ids, k, rnd); return { figs: fs, nomes: shuffle(fs, rnd) }; }
/** "memória das pausas": k pares figura ↔ pausa dela (as 4 pausas que mais aparecem primeiro). */
export function paresPausa(k = 4, rnd = Math.random) {
  const f = pick(['seminima', 'colcheia', 'semicolcheia', 'minima', 'semibreve'], k, rnd);
  const cartas = f.flatMap((id) => [{ id, tipo: 'fig', par: id }, { id, tipo: 'pausa', par: id }]);
  return shuffle(cartas, rnd).map((c, i) => ({ ...c, k: i }));
}
export const mesmoPar = (a, b) => a.k !== b.k && a.par === b.par && a.tipo !== b.tipo;
/** Quiz: valor (quanto vale), nome (qual é o nome) e pausa (qual é a pausa dela). */
export function quizQ(nivel, rnd = Math.random) {
  const pool = nivel === 1 ? ids.slice(0, 5) : ids; const tipo = pick(nivel === 1 ? ['valor', 'nome'] : ['valor', 'nome', 'pausa'], 1, rnd)[0]; const fig = pick(pool, 1, rnd)[0];
  if (tipo === 'nome') return { tipo, fig, opcoes: shuffle([fig, ...pick(pool.filter((x) => x !== fig), 2, rnd)], rnd), ok: fig };
  if (tipo === 'pausa') return { tipo, fig, opcoes: shuffle([fig, ...pick(pool.filter((x) => x !== fig), 2, rnd)], rnd), ok: fig }; // mostra a pausa; escolhe de qual figura ela é
  const valores = [...new Set(pool.map((x) => FIG_BY[x].beats))]; const ok = FIG_BY[fig].beats;
  return { tipo, fig, opcoes: shuffle([ok, ...pick(valores.filter((v) => v !== ok), 2, rnd)], rnd), ok };
}
/** "monte as notas" (árvore): quantas figuras de cada cabem em UMA semibreve. A semibreve e a mínima já vêm certas. */
export const ARVORE = ['semibreve', 'minima', 'seminima', 'colcheia', 'semicolcheia'].map((id) => ({ id, cabem: 4 / FIG_BY[id].beats, pronto: id === 'semibreve' || id === 'minima' }));
export function opcoesArvore(cabem, rnd = Math.random) { const base = [1, 2, 4, 8, 16, 32]; return shuffle([cabem, ...pick(base.filter((v) => v !== cabem), 3, rnd)], rnd).sort((a, b) => a - b); }
/** Caça-palavras da fase 8. */
export const PALAVRAS = ['fusa', 'semifusa', 'silencio', 'pausa', 'oito', 'minima'];
/** Tetris do Roboterista: a figura cai, de um lado o nome certo e do outro um errado. */
export function itensTetris(nivel, n = 8, rnd = Math.random) {
  const pool = nivel === 1 ? ids.slice(0, 4) : ids; const out = [];
  for (let i = 0; i < n; i++) { const fig = pick(pool, 1, rnd)[0]; const outro = pick(pool.filter((x) => x !== fig), 1, rnd)[0]; const certoEsq = rnd() < 0.5; out.push({ fig, esq: certoEsq ? fig : outro, dir: certoEsq ? outro : fig, ok: certoEsq ? 'esq' : 'dir' }); }
  return out;
}
export const SEG_QUEDA = { 1: 6, 2: 3.6 }; // segundos que cada figura leva pra cair
/** Estrelas da fase: terminou = 1; até 2 erros = 2; sem erros = 3. */
export const estrelasFigurix = (erros) => (erros <= 0 ? 3 : erros <= 2 ? 2 : 1);

/* ================= variações por nível (fases 13 a 62) ================= */
const NOMES_VAL = [1, 2, 4, 8, 16, 32, 64];
/** Quantas perguntas tem cada fase de escolher cartões (rápida, lenta, quiz). */
export const totalRL = (nivel) => 5 + (nivel >= 4 ? 1 : 0) + (nivel >= 6 ? 1 : 0);
export const totalQuiz = (nivel) => 8 + (nivel >= 4 ? 2 : 0) + (nivel >= 6 ? 2 : 0);
/** rápida/lenta por nível: mais figuras no jogo e mais opções (3, 4 ou 5). */
export function rapidaLentaN(tipo, i, nivel, rnd = Math.random) {
  if (nivel <= 2) return rapidaLenta(tipo, i, rnd);
  const no = nivel >= 6 ? 5 : nivel >= 4 ? 4 : 3; const figs = pick(ids, no, rnd); const ord = figs.slice().sort((a, b) => FIG_BY[a].beats - FIG_BY[b].beats);
  return { figs, ok: tipo === 'rapida' ? ord[0] : ord[ord.length - 1] };
}
/** "monte a figura": quais figuras pedir em cada nível. */
export const montesDe = (nivel) => ({ 1: ['colcheia', 'seminima', 'minima'], 2: ['seminima', 'colcheia', 'semicolcheia', 'minima'], 3: ['semicolcheia', 'semibreve', 'colcheia', 'fusa'], 4: ['fusa', 'semicolcheia', 'minima', 'semifusa'], 5: ['semifusa', 'fusa', 'semibreve', 'colcheia', 'semicolcheia'] }[Math.min(5, nivel)] || ['semifusa', 'fusa', 'semicolcheia', 'colcheia', 'seminima', 'minima', 'semibreve']);
export const maxColchetes = (nivel) => (nivel >= 3 ? 4 : 2);
/** "ligar" por nível: quantos pares e o que liga com o quê (nome, valor em tempos, pausa↔nome, figura↔pausa). */
export function ligarCfg(p) {
  if (p.nivel <= 1) return { k: p.k || 3, tipo: 'nome' };
  return { 2: { k: 4, tipo: 'nome' }, 3: { k: 5, tipo: 'valor' }, 4: { k: 5, tipo: 'pausa' }, 5: { k: 6, tipo: 'figpausa' }, 6: { k: 7, tipo: 'valor' } }[Math.min(6, p.nivel)];
}
/** Pares do "ligar": esquerda = desenho (figura ou pausa), direita = o que combina (nome, valor, pausa). Cada item tem `id` (o mesmo nos dois lados quando combinam). */
export function paresLigarN(k, tipo, rnd = Math.random) {
  const fs = pick(ids, k, rnd);
  const esq = fs.map((id) => ({ id, face: tipo === 'pausa' ? 'pausa' : 'fig' }));
  const dir = shuffle(fs, rnd).map((id) => ({ id, face: tipo === 'valor' ? 'valor' : tipo === 'figpausa' ? 'pausa' : 'nome' }));
  return { esq, dir };
}
/** Memória por nível: o que casa com o quê e quantos pares (figura↔pausa, figura↔valor, pausa↔nome, figura↔nome). */
export function memCfg(nivel) { return { k: 4 + (nivel >= 4 ? 1 : 0) + (nivel >= 6 ? 1 : 0), modo: ['fp', 'fp', 'fp', 'fv', 'pn', 'fn'][Math.min(6, Math.max(1, nivel)) - 1] }; }
export function paresMem(k, modo, rnd = Math.random) {
  const pool = modo === 'fp' && k <= 5 ? ['seminima', 'colcheia', 'semicolcheia', 'minima', 'semibreve', 'fusa'] : ids; const f = pick(pool, k, rnd);
  const lados = { fp: ['fig', 'pausa'], fv: ['fig', 'valor'], pn: ['pausa', 'nome'], fn: ['fig', 'nome'] }[modo];
  return shuffle(f.flatMap((id) => [{ id, par: id, tipo: lados[0], lado: 0 }, { id, par: id, tipo: lados[1], lado: 1 }]), rnd).map((c, i) => ({ ...c, k: i }));
}
export const mesmoParN = (a, b) => a.k !== b.k && a.par === b.par && a.lado !== b.lado;
/** Quiz por nível: nível 3 inclui "metade", nível 4+ inclui "quantas cabem", nível 6 tem 4 opções. */
export function quizN(nivel, rnd = Math.random) {
  if (nivel <= 2) return quizQ(nivel, rnd);
  const tipos = ['valor', 'nome', 'pausa', 'metade', ...(nivel >= 4 ? ['cabem'] : [])]; const tipo = pick(tipos, 1, rnd)[0]; const no = nivel >= 6 ? 4 : 3;
  if (tipo === 'metade') { const i = 1 + Math.floor(rnd() * (ids.length - 1)); const base = ids[i - 1]; const ok = ids[i]; return { tipo, fig: base, opcoes: shuffle([ok, ...pick(ids.filter((x) => x !== ok), no - 1, rnd)], rnd), ok }; }
  if (tipo === 'cabem') { const i = Math.floor(rnd() * 3); const grande = ids[i]; const j = i + 1 + Math.floor(rnd() * Math.min(4, ids.length - 1 - i)); const peq = ids[Math.min(j, ids.length - 1)]; const ok = FIG_BY[grande].beats / FIG_BY[peq].beats; return { tipo, fig: grande, peq, opcoes: shuffle([ok, ...pick(NOMES_VAL.filter((v) => v !== ok), no - 1, rnd)], rnd), ok }; }
  const q = quizQ(2, rnd); if (no === 4 && q.opcoes.length === 3) { const extra = tipo === 'valor' ? pick([...new Set(ids.map((x) => FIG_BY[x].beats))].filter((v) => !q.opcoes.includes(v)), 1, rnd)[0] : pick(ids.filter((x) => !q.opcoes.includes(x)), 1, rnd)[0]; if (extra != null) q.opcoes = shuffle([...q.opcoes, extra], rnd); }
  return q;
}
/** Caça-palavras: uma lista de 6 palavras por nível, grade maior e (a partir do nível 3) também na diagonal. */
export const LISTAS = {
  1: PALAVRAS_BASE(), 2: ['colcheia', 'semibreve', 'seminima', 'tempo', 'pulso', 'compasso'], 3: ['ritmo', 'batida', 'bateria', 'caixa', 'bumbo', 'chimbal'],
  4: ['partitura', 'pauta', 'clave', 'nota', 'figura', 'valor'], 5: ['semicolcheia', 'tercina', 'sextina', 'ponto', 'ligadura', 'silencio'], 6: ['groove', 'andamento', 'compasso', 'metronomo', 'acento', 'fantasma'],
};
function PALAVRAS_BASE() { return ['fusa', 'semifusa', 'silencio', 'pausa', 'oito', 'minima']; }
export const palavrasDe = (nivel) => LISTAS[Math.min(6, Math.max(1, nivel))];
export const grandeCaca = (nivel) => (nivel <= 3 ? 10 : nivel === 4 ? 11 : 12);
/** "monte as notas" por nível: quantas figuras de cada cabem numa figura-base (semibreve, mínima ou semínima). */
export function arvore(nivel) {
  const cfg = { 1: ['semibreve', ['semibreve', 'minima', 'seminima', 'colcheia', 'semicolcheia'], 2], 2: ['semibreve', ids, 2], 3: ['minima', ['minima', 'seminima', 'colcheia', 'semicolcheia', 'fusa'], 2], 4: ['seminima', ['seminima', 'colcheia', 'semicolcheia', 'fusa', 'semifusa'], 1], 5: ['semibreve', ['semibreve', 'minima', 'seminima', 'colcheia', 'semicolcheia', 'fusa'], 1] }[Math.min(5, nivel)] || ['semibreve', ids, 1];
  const [base, lista, prontos] = cfg; return { base, linhas: lista.map((id, i) => ({ id, cabem: FIG_BY[base].beats / FIG_BY[id].beats, pronto: i < prontos })) };
}
export const opcoesCabem = (cabem, rnd = Math.random) => shuffle([cabem, ...pick(NOMES_VAL.filter((v) => v !== cabem), 3, rnd)], rnd).sort((a, b) => a - b);
/** Tetris por nível: velocidade, quantidade e o jeito (nome, valor em tempos, ou uma PAUSA caindo). */
export function tetrisCfg(nivel) { return { itens: 8 + (nivel >= 4 ? 2 : 0) + (nivel >= 6 ? 2 : 0), queda: [6, 3.6, 3.4, 3.1, 2.8, 2.5][Math.min(6, Math.max(1, nivel)) - 1], jeito: nivel <= 2 ? 'nome' : ['nome', 'valor', 'pausa', 'valor', 'pausa'][(nivel - 3) % 5] }; }
export function itensTetrisN(nivel, rnd = Math.random) {
  const c = tetrisCfg(nivel); const pool = nivel <= 1 ? ids.slice(0, 4) : ids; const out = [];
  for (let i = 0; i < c.itens; i++) {
    const f = pick(pool, 1, rnd)[0]; const outro = pick(pool.filter((x) => x !== f), 1, rnd)[0]; const certoEsq = rnd() < 0.5;
    out.push({ fig: f, face: c.jeito === 'pausa' ? 'pausa' : 'fig', rot: c.jeito === 'valor' ? 'valor' : 'nome', esq: certoEsq ? f : outro, dir: certoEsq ? outro : f, ok: certoEsq ? 'esq' : 'dir' });
  }
  return { itens: out, queda: c.queda, jeito: c.jeito };
}

/* ================= os 4 mundos ================= */
const R = (id, name, sub, decor) => ({ id, name, sub, decor });
/** 4 mundos do Figurix: cada um é um mapa com cenário próprio; as 62 fases se repartem entre eles. Todos abertos (a Bea escolhe por onde começar). */
export const MUNDOS = [
  { id: 'floresta', nome: 'Floresta das Semínimas', curto: 'floresta', sub: 'onde tudo começa', de: 1, ate: 15, regioes: [
    R('clareira', 'Clareira do Pulso', 'a semínima manda', [['tree', 'l', 0.05], ['pine', 'r', 0.1], ['tree', 'r', 0.2], ['bush', 'l', 0.27], ['pine', 'l', 0.36], ['tree', 'r', 0.45], ['flower', 'l', 0.52], ['pine', 'r', 0.6], ['tree', 'l', 0.7], ['bush', 'r', 0.78], ['tree', 'r', 0.86], ['pine', 'l', 0.94]]),
    R('trilha', 'Trilha das Figuras', 'quem é quem', [['pine', 'l', 0.05], ['tree', 'r', 0.12], ['tree', 'l', 0.2], ['pine', 'r', 0.3], ['bush', 'l', 0.38], ['tree', 'r', 0.47], ['pine', 'l', 0.55], ['flower', 'r', 0.62], ['tree', 'l', 0.7], ['pine', 'r', 0.78], ['tree', 'r', 0.87], ['bush', 'l', 0.94]])] },
  { id: 'deserto', nome: 'Deserto das Pausas', curto: 'deserto', sub: 'o silêncio também conta', de: 16, ate: 31, regioes: [
    R('dunas', 'Dunas do Silêncio', 'pausa também é música', [['cactus', 'l', 0.2], ['vaso', 'r', 0.45], ['star', 'l', 0.75]]),
    R('oasis', 'Oásis dos Valores', 'quanto vale cada uma', [['cactus', 'r', 0.2], ['bush', 'l', 0.5], ['cactus', 'r', 0.85]])] },
  { id: 'mar', nome: 'Mar das Colcheias', curto: 'mar', sub: 'tudo mais rápido', de: 32, ate: 47, regioes: [
    R('praia', 'Praia das Colcheias', 'ondas de duas em duas', [['wave', 'l', 0.05], ['fish', 'r', 0.12], ['wave', 'l', 0.2], ['fish2', 'l', 0.3], ['wave', 'r', 0.4], ['wave', 'r', 0.48], ['fish', 'l', 0.58], ['wave', 'l', 0.68], ['fish2', 'r', 0.76], ['wave', 'l', 0.84], ['wave', 'r', 0.93]]),
    R('recife', 'Recife das Semicolcheias', 'quatro por tempo', [['fish2', 'l', 0.05], ['wave', 'r', 0.13], ['fish', 'r', 0.22], ['wave', 'l', 0.3], ['wave', 'l', 0.4], ['fish', 'l', 0.5], ['fish2', 'r', 0.6], ['wave', 'r', 0.68], ['wave', 'r', 0.77], ['fish', 'r', 0.86], ['wave', 'l', 0.94]])] },
  { id: 'espaco', nome: 'Espaço das Semifusas', curto: 'espaço', sub: 'o mais rápido de todos', de: 48, ate: 62, regioes: [
    R('orbita', 'Órbita das Fusas', 'rápido como um foguete', [['star', 'l', 0.08], ['planet', 'r', 0.2], ['star', 'r', 0.32], ['moon', 'l', 0.45], ['star', 'l', 0.58], ['rocket', 'r', 0.7], ['star', 'r', 0.82], ['planet', 'l', 0.93]]),
    R('estacao', 'Estação do Ritmo', 'só quem treinou chega', [['moon', 'r', 0.08], ['star', 'l', 0.2], ['rocket', 'l', 0.33], ['star', 'r', 0.45], ['planet', 'r', 0.58], ['star', 'l', 0.7], ['moon', 'l', 0.83], ['star', 'r', 0.94]])] },
];
export const mundoDe = (n) => MUNDOS.find((m) => n >= m.de && n <= m.ate) || MUNDOS[0];
