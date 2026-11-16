// Teoria · temas PAUSAS, CLAVES, TEMPO E COMPASSO e LEITURA DE NOTAS: 30 aulinhas cada, em 6 fases de 5 (pedido da Bea, 15/nov/2026).
// Mesmo formato do tema Figuras (teoria-figuras.js): { t, ic: () => desenho, txt, som? } e um mini quiz por fase.
// Regra de texto da Bea: frase curta, sempre ligada a algo musical, sem jargão solto. Conteúdo escrito pelo Claude: A BEA VALIDA a parte musical.
import { h } from '../util.js';
import { audio, click, kick, snare, hihat } from '../audio.js';
import { epiano } from '../synth.js';
import { SYM_SVG, symbolEl } from '../jogos/cartas-simbolos.js';
import { notas } from './teoria-figuras.js';

const NSV = 'http://www.w3.org/2000/svg';
const svg = (w, hh, inner) => { const e = document.createElementNS(NSV, 'svg'); e.setAttribute('viewBox', `0 0 ${w} ${hh}`); e.setAttribute('class', 'tf-sym'); e.setAttribute('aria-hidden', 'true'); e.innerHTML = inner; return e; };
const sym = (id) => symbolEl(id, 'tf-sym');
const txt = (t, peq) => h('b', { class: `tf-big${peq ? ' small' : ''}` }, t);
/** Vários desenhos lado a lado (ex.: figura = pausa). Texto solto vira sinal grande. */
const fila = (...els) => h('span', { class: 'tf-fila' }, ...els.map((e) => (typeof e === 'string' ? h('b', {}, e) : e)));

/* ---------- pauta ---------- */
const NOMES = ['dó', 'ré', 'mi', 'fá', 'sol', 'lá', 'si']; const SEMI = [0, 2, 4, 5, 7, 9, 11];
const BASE = { sol: 30, fa: 18 }; // degrau da 1ª linha: mi4 na clave de sol, sol2 na clave de fá
/** Nota (nome e MIDI) de uma posição da pauta: p = 0 é a 1ª linha, 1 o 1º espaço, 2 a 2ª linha… */
export const notaDe = (clave, p) => { const n = (BASE[clave] ?? 30) + p; return { nome: NOMES[((n % 7) + 7) % 7], midi: 12 * (Math.floor(n / 7) + 1) + SEMI[((n % 7) + 7) % 7] }; };
const Y = (p) => 64 - p * 5;
/**
 * Desenha uma pauta de 5 linhas. cfg = { clave: 'sol'|'fa'|'do'|'perc'|'', notas: [[p, rótulo?, 'x'|'o'|'n'?]], barras?: [tipo], nums?: true (numera as linhas), esp?: true (numera os espaços) }
 * 'x' = cabeça em X (prato), 'o' = vazia, sem 3º item = cheia. O rótulo sai embaixo da nota.
 */
export function pauta(cfg = {}) {
  const ns = cfg.notas || []; const x0 = cfg.clave ? 44 : 14; /* nome comprido embaixo da nota precisa de mais espaço */ const rotLongo = ns.some((n) => n[1] && n[1].length > 3); const passo = rotLongo ? 44 : ns.length > 6 ? 22 : 28; const W = Math.max(96, x0 + Math.max(ns.length, 1) * passo + 12 + (cfg.barras ? 24 : 0)); let s = '';
  for (let l = 0; l < 5; l++) s += `<line x1="4" x2="${W - 4}" y1="${Y(l * 2)}" y2="${Y(l * 2)}" stroke="currentColor" stroke-width="1.8"/>`;
  if (cfg.clave === 'sol') s += `<svg x="2" y="8" width="42" height="72" viewBox="0 0 48 64">${SYM_SVG.clave_sol}</svg>`;
  else if (cfg.clave === 'fa') s += `<svg x="4" y="14" width="38" height="54" viewBox="0 0 48 64">${SYM_SVG.clave_fa}</svg>`;
  else if (cfg.clave === 'perc') s += '<rect x="14" y="34" width="5" height="20" fill="currentColor"/><rect x="24" y="34" width="5" height="20" fill="currentColor"/>';
  else if (cfg.clave === 'do') s += '<rect x="8" y="24" width="5" height="40" fill="currentColor"/><rect x="16" y="24" width="2" height="40" fill="currentColor"/><path d="M20 44q10 -2 10 -10t-8 -9M20 44q10 2 10 10t-8 9" fill="none" stroke="currentColor" stroke-width="4"/>';
  // números das linhas (à esquerda de cada linha, que fica mais curta) e dos espaços (no meio), pequenos pra não encostar um no outro
  if (cfg.nums) for (let l = 0; l < 5; l++) s += `<rect x="0" y="${Y(l * 2) - 5}" width="22" height="10" fill="var(--tf-papel,#fffdf7)"/><text x="11" y="${Y(l * 2) + 3.2}" font-size="9" font-weight="800" text-anchor="middle" fill="currentColor">${l + 1}ª</text>`;
  if (cfg.esp) for (let l = 0; l < 4; l++) s += `<text x="${W / 2}" y="${Y(l * 2 + 1) + 2.8}" font-size="8" font-weight="800" text-anchor="middle" fill="currentColor">${l + 1}º</text>`;
  ns.forEach(([p, rot, tipo], i) => {
    const cx = x0 + i * passo + 10; const y = Y(p);
    for (let q = -2; q >= p; q -= 2) s += `<line x1="${cx - 13}" x2="${cx + 13}" y1="${Y(q)}" y2="${Y(q)}" stroke="currentColor" stroke-width="1.8"/>`;
    for (let q = 10; q <= p; q += 2) s += `<line x1="${cx - 13}" x2="${cx + 13}" y1="${Y(q)}" y2="${Y(q)}" stroke="currentColor" stroke-width="1.8"/>`;
    if (tipo === 'x') s += `<path d="M${cx - 6} ${y - 6}L${cx + 6} ${y + 6}M${cx - 6} ${y + 6}L${cx + 6} ${y - 6}" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>`;
    else s += `<ellipse cx="${cx}" cy="${y}" rx="7.5" ry="5.2" transform="rotate(-20 ${cx} ${y})" ${tipo === 'o' ? 'fill="none" stroke="currentColor" stroke-width="2.6"' : 'fill="currentColor"'}/>`;
    if (rot) s += `<text x="${cx}" y="90" font-size="12.5" font-weight="800" text-anchor="middle" fill="currentColor">${rot}</text>`;
  });
  (cfg.barras || []).forEach((b) => { const x = W - 10; if (b === 'fim') s += `<line x1="${x - 7}" x2="${x - 7}" y1="24" y2="64" stroke="currentColor" stroke-width="2"/><rect x="${x - 3}" y="24" width="6" height="40" fill="currentColor"/>`; else if (b === 'dupla') s += `<line x1="${x - 6}" x2="${x - 6}" y1="24" y2="64" stroke="currentColor" stroke-width="2"/><line x1="${x}" x2="${x}" y1="24" y2="64" stroke="currentColor" stroke-width="2"/>`; else s += `<line x1="${W / 2}" x2="${W / 2}" y1="24" y2="64" stroke="currentColor" stroke-width="2.4"/>`; });
  const e = svg(W, 94, s); e.classList.add('tf-pt'); return e;
}
/** Pausa de semibreve (pendurada na 4ª linha) ou de mínima (em cima da 3ª linha), na pauta. */
const pausaGrande = (qual) => svg(96, 94, [0, 1, 2, 3, 4].map((l) => `<line x1="4" x2="92" y1="${Y(l * 2)}" y2="${Y(l * 2)}" stroke="currentColor" stroke-width="1.8"/>`).join('') + (qual === 'semibreve' ? `<rect x="36" y="${Y(6)}" width="24" height="6" fill="currentColor"/>` : `<rect x="36" y="${Y(4) - 6}" width="24" height="6" fill="currentColor"/>`));
const fermata = () => svg(60, 60, '<path d="M10 40a20 20 0 0 1 40 0" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="30" cy="36" r="4" fill="currentColor"/>');
const P = (cfg) => () => pauta(cfg);
const PN = (clave, ps, tipo) => P({ clave, notas: ps.map((p) => [p, notaDe(clave, p).nome, tipo]) });

/* ---------- sons ---------- */
/** Toca as notas das posições `ps` (uma depois da outra). */
const tons = (clave, ps, d = 0.42) => () => { const c = audio(); const t = c.currentTime + 0.05; ps.forEach((p, i) => epiano(t + i * d, [notaDe(clave, p).midi], d * 1.2, 1)); };
const midis = (ms, d = 0.4) => () => { const c = audio(); const t = c.currentTime + 0.05; ms.forEach((m, i) => epiano(t + i * d, [m], d * 1.2, 1)); };
/** Cliques do pulso: níveis 2 (forte), 1 (normal) ou 0 (silêncio), um por tempo. */
const pulso = (niveis, bpm = 90) => () => { const c = audio(); const t = c.currentTime + 0.05; niveis.forEach((v, i) => { if (v) click(t + (i * 60) / bpm, v, v === 2 ? 1 : 0.55); }); };
/** Ritmo com pausas: duração em tempos; número NEGATIVO = silêncio. O pulso toca baixinho por baixo. */
const rit = (durs, bpm = 84) => () => { const c = audio(); const q = 60 / bpm; let t = c.currentTime + 0.06; const t0 = t; let tot = 0; for (const d of durs) { const a = Math.abs(d); if (d > 0) epiano(t, [67], Math.max(0.12, a * q * 0.9), 1); t += a * q; tot += a; } for (let i = 0; i < Math.ceil(tot - 0.001); i++) click(t0 + i * q, i === 0 ? 2 : 1, 0.35); };
const bateria = (fn) => () => { const c = audio(); fn(c.currentTime + 0.06, 60 / 90); };

/* ======================= PAUSAS ======================= */
export const FASES_PAUSAS = [
  { nome: 'as 5 pausas', paul: 'o silêncio também tem tamanho! cada pausa dura um tanto.', cards: [
    { t: 'Pausa de semínima', ic: () => sym('p_seminima'), txt: 'silêncio de 1 tempo. a gente conta o tempo, mas não toca.', som: rit([1, -1, 1, -1]) },
    { t: 'Pausa de colcheia', ic: () => sym('p_colcheia'), txt: 'silêncio de meio tempo. o desenho parece um "7".', som: rit([-0.5, 0.5, -0.5, 0.5]) },
    { t: 'Pausa de semicolcheia', ic: () => sym('p_semicolcheia'), txt: 'silêncio de um quarto de tempo. tem dois ganchinhos.', som: rit([-0.25, 0.25, 0.25, 0.25, -0.25, 0.25, 0.25, 0.25]) },
    { t: 'Pausa de mínima', ic: () => pausaGrande('minima'), txt: 'silêncio de 2 tempos. é um retângulo sentado EM CIMA da 3ª linha, como um chapéu.', som: rit([1, 1, -2]) },
    { t: 'Pausa de semibreve', ic: () => pausaGrande('semibreve'), txt: 'silêncio de 4 tempos. é um retângulo PENDURADO embaixo da 4ª linha.', som: rit([-4]) }],
    quiz: [
      { q: 'o que é uma pausa?', ops: ['um silêncio que tem duração', 'uma nota bem forte', 'o fim da música'], ok: 0 },
      { q: 'uma pausa de semínima dura…', ops: ['1 tempo', '2 tempos', '4 tempos'], ok: 0 },
      { q: 'qual pausa parece um "7"?', ops: ['a de colcheia', 'a de semibreve', 'a de mínima'], ok: 0 },
      { q: 'a pausa de mínima fica…', ops: ['em cima da linha, como um chapéu', 'pendurada embaixo da linha', 'fora da pauta'], ok: 0 },
      { q: 'a pausa de semibreve dura…', ops: ['4 tempos', '1 tempo', 'meio tempo'], ok: 0 }] },
  { nome: 'cada figura tem a sua pausa', paul: 'pra cada som existe um silêncio do mesmo tamanho.', cards: [
    { t: 'Silêncio é música', ic: () => fila(notas('q'), sym('p_seminima')), txt: 'música é feita de som E de silêncio. sem pausa, a música não respira.', som: rit([1, -1, 1, -1]) },
    { t: 'Semínima e sua pausa', ic: () => fila(notas('q'), '=', sym('p_seminima')), txt: 'as duas duram 1 tempo. uma soa, a outra cala.', som: rit([1, -1]) },
    { t: 'Colcheia e sua pausa', ic: () => fila(notas('e'), '=', sym('p_colcheia')), txt: 'as duas duram meio tempo.', som: rit([0.5, -0.5, 0.5, -0.5]) },
    { t: 'Mínima e sua pausa', ic: () => fila(notas('h'), '=', pausaGrande('minima')), txt: 'as duas duram 2 tempos.', som: rit([2, -2]) },
    { t: 'Semibreve e sua pausa', ic: () => fila(notas('w'), '=', pausaGrande('semibreve')), txt: 'as duas duram 4 tempos: um compasso inteiro no 4/4.', som: rit([4, -4]) }],
    quiz: [
      { q: 'a pausa de colcheia dura o mesmo que…', ops: ['uma colcheia', 'uma semibreve', 'uma mínima'], ok: 0 },
      { q: 'quanto dura a pausa de mínima?', ops: ['2 tempos', '1 tempo', '4 tempos'], ok: 0 },
      { q: 'música é feita de…', ops: ['som e silêncio', 'só som', 'só silêncio'], ok: 0 },
      { q: 'a pausa que dura 1 tempo é a de…', ops: ['semínima', 'mínima', 'semibreve'], ok: 0 }] },
  { nome: 'como reconhecer', paul: 'uns truques pra nunca mais confundir as pausas!', cards: [
    { t: 'O chapéu', ic: () => pausaGrande('minima'), txt: 'a pausa de mínima fica EM CIMA da linha, igual a um chapéu na cabeça. vale 2 tempos.', som: rit([1, 1, -2]) },
    { t: 'A pendurada', ic: () => pausaGrande('semibreve'), txt: 'a pausa de semibreve fica PENDURADA embaixo da linha. vale 4 tempos.', som: rit([-4]) },
    { t: 'O truque do peso', ic: () => fila(pausaGrande('semibreve'), pausaGrande('minima')), txt: 'a de 4 tempos é mais "pesada" e cai pra baixo da linha. a de 2 tempos é leve e fica em cima.' },
    { t: 'O "7"', ic: () => sym('p_colcheia'), txt: 'a pausa de colcheia parece um 7 com uma bolinha. meio tempo de silêncio.', som: rit([-0.5, 0.5, -0.5, 0.5]) },
    { t: 'Os ganchinhos', ic: () => fila(sym('p_colcheia'), sym('p_semicolcheia'), sym('p_fusa')), txt: 'cada ganchinho a mais deixa a pausa 2 vezes mais curta: 1 gancho é colcheia, 2 é semicolcheia, 3 é fusa.' }],
    quiz: [
      { q: 'qual pausa fica pendurada embaixo da linha?', ops: ['a de semibreve', 'a de mínima', 'a de colcheia'], ok: 0 },
      { q: 'quantos ganchinhos tem a pausa de semicolcheia?', ops: ['2', '1', '3'], ok: 0 },
      { q: 'a pausa que parece um chapéu vale…', ops: ['2 tempos', '4 tempos', 'meio tempo'], ok: 0 },
      { q: 'cada ganchinho a mais deixa a pausa…', ops: ['mais curta', 'mais longa', 'mais forte'], ok: 0 }] },
  { nome: 'contando com pausa', paul: 'na pausa a gente continua contando. o tempo não para!', cards: [
    { t: 'toca, cala, toca, cala', ic: () => fila(notas('q'), sym('p_seminima'), notas('q'), sym('p_seminima')), txt: 'você toca no 1 e no 3, e fica em silêncio no 2 e no 4. conta "1, (2), 3, (4)".', som: rit([1, -1, 1, -1]) },
    { t: 'Pausa no 1', ic: () => fila(sym('p_seminima'), notas('q q q')), txt: 'o silêncio vem primeiro: "(1), 2, 3, 4". é difícil esperar, mas dá um balanço legal.', som: rit([-1, 1, 1, 1]) },
    { t: 'A caixa do rock', ic: () => fila(sym('p_seminima'), notas('q'), sym('p_seminima'), notas('q')), txt: 'silêncio no 1 e no 3, toque no 2 e no 4. é onde a caixa da bateria bate no rock!', som: bateria((t, q) => { for (let i = 0; i < 4; i++) { click(t + i * q, i === 0 ? 2 : 1, 0.3); if (i % 2) snare(t + i * q, 0.9); } }) },
    { t: 'Só no "e"', ic: () => fila(sym('p_colcheia'), notas('e'), sym('p_colcheia'), notas('e')), txt: 'pausa de colcheia no tempo e nota no "e". isso se chama contratempo: é a batida do reggae.', som: rit([-0.5, 0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5]) },
    { t: 'Conte por dentro', ic: () => fila(sym('p_seminima'), sym('p_seminima')), txt: 'na pausa, pense o número ou mexa o pé. quem para de contar na pausa volta fora do tempo.', som: rit([1, -1, -1, 1]) }],
    quiz: [
      { q: 'o que a gente faz numa pausa?', ops: ['conta o tempo e não toca', 'toca bem baixinho', 'para de contar'], ok: 0 },
      { q: 'no rock, a caixa bate em quais tempos?', ops: ['2 e 4', '1 e 3', 'só no 1'], ok: 0 },
      { q: 'tocar só no "e" se chama…', ops: ['contratempo', 'compasso', 'fermata'], ok: 0 },
      { q: 'por que contar durante a pausa?', ops: ['pra voltar no tempo certo', 'pra tocar mais forte', 'pra acabar logo'], ok: 0 }] },
  { nome: 'pausas grandes', paul: 'às vezes o silêncio dura bastante. olha como se escreve!', cards: [
    { t: 'Compasso em silêncio', ic: () => pausaGrande('semibreve'), txt: 'a pausa de semibreve também serve pra dizer "este compasso inteiro é silêncio".', som: pulso([2, 1, 1, 1]) },
    { t: 'Vários compassos', ic: () => txt('▬ 8 ▬', true), txt: 'um número em cima da pausa diz quantos compassos esperar. "8" quer dizer: conte 8 compassos sem tocar.' },
    { t: 'Pausa pontuada', ic: () => fila(sym('p_seminima'), '.'), txt: 'o ponto também vale pra pausa: soma metade. pausa de semínima com ponto dura 1 tempo e meio.', som: rit([-1.5, 0.5, 1, 1]) },
    { t: 'Fermata', ic: fermata, txt: 'o arco com um pontinho manda segurar o som ou o silêncio por mais tempo. quem decide é o maestro ou a banda.' },
    { t: 'Respiração', ic: () => svg(60, 60, '<path d="M34 14a9 9 0 1 1 -9 9q0 14 -10 22q16 -4 19 -22z" fill="currentColor"/>'), txt: 'uma vírgula em cima da pauta mostra onde quem canta ou toca instrumento de sopro deve respirar.' }],
    quiz: [
      { q: 'um "8" em cima da pausa quer dizer…', ops: ['espere 8 compassos', 'toque 8 notas', 'toque mais forte'], ok: 0 },
      { q: 'a pausa de semínima com ponto dura…', ops: ['1 tempo e meio', '2 tempos', 'meio tempo'], ok: 0 },
      { q: 'a fermata manda…', ops: ['segurar por mais tempo', 'tocar mais rápido', 'repetir tudo'], ok: 0 },
      { q: 'a vírgula em cima da pauta mostra onde…', ops: ['respirar', 'bater palma', 'acabar a música'], ok: 0 }] },
  { nome: 'a pausa na prática', paul: 'saber ficar em silêncio é coisa de músico bom!', cards: [
    { t: 'Pausa de fusa', ic: () => sym('p_fusa'), txt: 'três ganchinhos: é a pausa mais curtinha daqui. dura um oitavo de tempo.' },
    { t: 'Na bateria', ic: () => fila(notas('x'), sym('p_seminima')), txt: 'pausa na bateria é baqueta parada no ar. deixar a nota "respirar" faz a levada ficar limpa.', som: bateria((t, q) => { hihat(t, 0.7); hihat(t + 2 * q, 0.7); click(t + q, 1, 0.25); click(t + 3 * q, 1, 0.25); }) },
    { t: 'Na banda', ic: () => fila(sym('p_seminima'), notas('ee')), txt: 'a sua pausa é a hora de ouvir os outros. no PaulBox dá pra sentir: quando um Paul sai, os outros aparecem.' },
    { t: 'Suspense', ic: () => fila(notas('q q'), sym('p_seminima'), notas('q')), txt: 'um silêncio antes do refrão deixa todo mundo esperando. a pausa dá emoção à música.', som: rit([1, 1, -1, 1]) },
    { t: 'Som curto', ic: () => fila(notas('e'), sym('p_colcheia')), txt: 'nota curta seguida de pausa deixa o som sequinho e saltitante. os músicos chamam de staccato.', som: rit([0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, -0.5]) }],
    quiz: [
      { q: 'quantos ganchinhos tem a pausa de fusa?', ops: ['3', '2', '1'], ok: 0 },
      { q: 'na banda, a pausa é a hora de…', ops: ['ouvir os outros', 'afinar o instrumento', 'conversar'], ok: 0 },
      { q: 'um silêncio antes do refrão dá…', ops: ['suspense', 'sono', 'mais velocidade'], ok: 0 },
      { q: 'nota curta seguida de pausa deixa o som…', ops: ['sequinho e saltitante', 'grave', 'comprido'], ok: 0 }] },
];

/* ======================= CLAVES ======================= */
export const FASES_CLAVES = [
  { nome: 'a pauta', paul: 'a pauta é a casa das notas. vamos conhecer os cômodos!', cards: [
    { t: '5 linhas', ic: P({ nums: true }), txt: 'a pauta tem 5 linhas. a gente conta de baixo pra cima: 1ª, 2ª, 3ª, 4ª e 5ª.' },
    { t: '4 espaços', ic: P({ esp: true }), txt: 'entre as linhas ficam 4 espaços, também contados de baixo pra cima.' },
    { t: 'Na linha ou no espaço', ic: P({ notas: [[0], [1], [2], [3], [4]] }), txt: 'a nota mora na linha (a linha passa no meio dela) ou no espaço (entre duas linhas).', som: tons('sol', [0, 1, 2, 3, 4]) },
    { t: 'Subiu, ficou agudo', ic: P({ notas: [[0], [4], [8]] }), txt: 'quanto mais alta a nota na pauta, mais agudo (fino) é o som. quanto mais baixa, mais grave (grosso).', som: tons('sol', [0, 4, 8], 0.5) },
    { t: 'Linhas extras', ic: P({ notas: [[-2], [10]] }), txt: 'quando a nota não cabe na pauta, ela ganha uma linha só dela: a linha suplementar.', som: tons('sol', [-2, 10], 0.6) }],
    quiz: [
      { q: 'quantas linhas tem a pauta?', ops: ['5', '4', '6'], ok: 0 },
      { q: 'quantos espaços tem a pauta?', ops: ['4', '5', '3'], ok: 0 },
      { q: 'as linhas são contadas…', ops: ['de baixo pra cima', 'de cima pra baixo', 'do meio pra fora'], ok: 0 },
      { q: 'nota mais alta na pauta tem som mais…', ops: ['agudo', 'grave', 'longo'], ok: 0 },
      { q: 'a linha suplementar serve pra…', ops: ['nota que não cabe na pauta', 'separar compassos', 'marcar a pausa'], ok: 0 }] },
  { nome: 'clave de sol', paul: 'a clave de sol é a chave das notas agudas.', cards: [
    { t: 'Nasceu do G', ic: P({ clave: 'sol' }), txt: 'a clave de sol nasceu da letra G, que é como se escreve "sol" em vários países.' },
    { t: 'Marca o sol', ic: P({ clave: 'sol', notas: [[2, 'sol']] }), txt: 'a espiral dela abraça a 2ª linha. é ali que mora a nota SOL.', som: tons('sol', [2], 0.8) },
    { t: 'Notas das linhas', ic: PN('sol', [0, 2, 4, 6, 8]), txt: 'nas 5 linhas, de baixo pra cima: mi, sol, si, ré, fá.', som: tons('sol', [0, 2, 4, 6, 8]) },
    { t: 'Notas dos espaços', ic: PN('sol', [1, 3, 5, 7]), txt: 'nos 4 espaços, de baixo pra cima: fá, lá, dó, mi.', som: tons('sol', [1, 3, 5, 7]) },
    { t: 'Quem usa', ic: P({ clave: 'sol', notas: [[4], [6], [8]] }), txt: 'voz, violino, flauta, guitarra, violão e a mão direita do piano leem na clave de sol.', som: tons('sol', [4, 6, 8]) }],
    quiz: [
      { q: 'a clave de sol marca a nota sol em qual linha?', ops: ['2ª linha', '4ª linha', '1ª linha'], ok: 0 },
      { q: 'a clave de sol nasceu de qual letra?', ops: ['G', 'F', 'C'], ok: 0 },
      { q: 'a clave de sol é boa pra notas…', ops: ['agudas', 'graves', 'de bateria'], ok: 0 },
      { q: 'na clave de sol, as notas dos espaços são…', ops: ['fá, lá, dó, mi', 'mi, sol, si, ré', 'dó, ré, mi, fá'], ok: 0 },
      { q: 'qual instrumento lê na clave de sol?', ops: ['violino', 'baixo', 'tuba'], ok: 0 }] },
  { nome: 'clave de fá', paul: 'agora a chave das notas graves: a clave de fá.', cards: [
    { t: 'Nasceu do F', ic: P({ clave: 'fa' }), txt: 'a clave de fá nasceu da letra F, que é como se escreve "fá" em vários países.' },
    { t: 'Marca o fá', ic: P({ clave: 'fa', notas: [[6, 'fá']] }), txt: 'os dois pontinhos ficam em volta da 4ª linha. é ali que mora a nota FÁ.', som: tons('fa', [6], 0.8) },
    { t: 'Notas das linhas', ic: PN('fa', [0, 2, 4, 6, 8]), txt: 'nas 5 linhas, de baixo pra cima: sol, si, ré, fá, lá.', som: tons('fa', [0, 2, 4, 6, 8]) },
    { t: 'Notas dos espaços', ic: PN('fa', [1, 3, 5, 7]), txt: 'nos 4 espaços, de baixo pra cima: lá, dó, mi, sol.', som: tons('fa', [1, 3, 5, 7]) },
    { t: 'Quem usa', ic: P({ clave: 'fa', notas: [[0], [2], [4]] }), txt: 'baixo, contrabaixo, tuba, trombone e a mão esquerda do piano leem na clave de fá.', som: tons('fa', [0, 2, 4]) }],
    quiz: [
      { q: 'a clave de fá marca a nota fá em qual linha?', ops: ['4ª linha', '2ª linha', '5ª linha'], ok: 0 },
      { q: 'qual clave é a das notas GRAVES?', ops: ['fá', 'sol', 'percussão'], ok: 0 },
      { q: 'qual instrumento lê na clave de fá?', ops: ['baixo', 'flauta', 'violino'], ok: 0 },
      { q: 'na clave de fá, as notas das linhas são…', ops: ['sol, si, ré, fá, lá', 'mi, sol, si, ré, fá', 'fá, lá, dó, mi'], ok: 0 }] },
  { nome: 'o dó do meio', paul: 'tem um dó que liga as duas claves. olha onde ele mora!', cards: [
    { t: 'Dó central (sol)', ic: P({ clave: 'sol', notas: [[-2, 'dó']] }), txt: 'na clave de sol, o dó do meio fica numa linha extra ABAIXO da pauta.', som: tons('sol', [-2], 0.8) },
    { t: 'Dó central (fá)', ic: P({ clave: 'fa', notas: [[10, 'dó']] }), txt: 'na clave de fá, o mesmo dó fica numa linha extra ACIMA da pauta. é o mesmo som!', som: tons('fa', [10], 0.8) },
    { t: 'Pauta dupla', ic: () => fila(pauta({ clave: 'sol' }), pauta({ clave: 'fa' })), txt: 'o piano usa as duas claves juntas: a de sol pra mão direita e a de fá pra mão esquerda.' },
    { t: 'Mesma linha, outro nome', ic: () => fila(pauta({ clave: 'sol', notas: [[2, 'sol']] }), pauta({ clave: 'fa', notas: [[2, 'si']] })), txt: 'a mesma linha muda de nome conforme a clave. na 2ª linha mora o sol (clave de sol) ou o si (clave de fá).', som: () => { tons('sol', [2], 0.6)(); setTimeout(tons('fa', [2], 0.6), 700); } },
    { t: 'Saindo do dó', ic: PN('sol', [-2, -1, 0]), txt: 'o dó do meio é o ponto de partida. subindo de vizinha em vizinha vem o ré e depois o mi.', som: tons('sol', [-2, -1, 0], 0.5) }],
    quiz: [
      { q: 'na clave de sol, o dó central fica…', ops: ['numa linha extra abaixo da pauta', 'na 5ª linha', 'no 1º espaço'], ok: 0 },
      { q: 'o piano usa…', ops: ['as duas claves juntas', 'só a clave de sol', 'só a de percussão'], ok: 0 },
      { q: 'a mesma linha da pauta pode ter outro nome quando muda…', ops: ['a clave', 'o andamento', 'a pausa'], ok: 0 },
      { q: 'saindo do dó central e subindo, a próxima nota é…', ops: ['ré', 'si', 'fá'], ok: 0 }] },
  { nome: 'clave de percussão', paul: 'a bateria tem a clave dela. cada linha é uma peça!', cards: [
    { t: 'Dois traços', ic: P({ clave: 'perc' }), txt: 'a clave de percussão são dois traços em pé. aqui a pauta não mostra notas: mostra PEÇAS da bateria.' },
    { t: 'Bumbo', ic: P({ clave: 'perc', notas: [[1, 'bumbo']] }), txt: 'o bumbo mora no 1º espaço, lá embaixo. é o som mais grave, tocado com o pé.', som: bateria((t, q) => { kick(t, 0.95); kick(t + q, 0.95); }) },
    { t: 'Caixa', ic: P({ clave: 'perc', notas: [[5, 'caixa']] }), txt: 'a caixa mora no 3º espaço, no meio da pauta.', som: bateria((t, q) => { snare(t, 0.9); snare(t + q, 0.9); }) },
    { t: 'Chimbal', ic: P({ clave: 'perc', notas: [[9, 'chimbal', 'x']] }), txt: 'o chimbal fica em cima da pauta e tem cabeça em X, porque é prato.', som: bateria((t, q) => { for (let i = 0; i < 4; i++) hihat(t + i * q / 2, 0.7); }) },
    { t: 'Tudo junto', ic: P({ clave: 'perc', notas: [[9, '', 'x'], [5], [1]] }), txt: 'pratos em cima, caixa no meio, bumbo embaixo: igual à bateria de verdade. é assim que a pauLta ensina.', som: bateria((t, q) => { for (let i = 0; i < 8; i++) hihat(t + i * q / 2, i % 2 ? 0.5 : 0.8); kick(t, 0.95); snare(t + q, 0.9); kick(t + 2 * q, 0.95); snare(t + 3 * q, 0.9); }) }],
    quiz: [
      { q: 'na bateria, cada linha da pauta representa…', ops: ['uma peça', 'uma nota de piano', 'um acorde'], ok: 0 },
      { q: 'onde mora o bumbo?', ops: ['no 1º espaço, embaixo', 'em cima da pauta', 'na 5ª linha'], ok: 0 },
      { q: 'por que o chimbal tem cabeça em X?', ops: ['porque é prato', 'porque é grave', 'porque é pausa'], ok: 0 },
      { q: 'a caixa mora…', ops: ['no 3º espaço', 'no 1º espaço', 'abaixo da pauta'], ok: 0 }] },
  { nome: 'pra que serve a clave', paul: 'por que existe mais de uma clave? eu te conto!', cards: [
    { t: 'Sem clave, sem nome', ic: P({ notas: [[2, '?']] }), txt: 'sem a clave no começo ninguém sabe o nome da nota. ela é a chave que abre a pauta.' },
    { t: 'Cada um no seu lugar', ic: () => fila(pauta({ clave: 'sol', notas: [[6]] }), pauta({ clave: 'fa', notas: [[2]] })), txt: 'instrumento agudo usa clave de sol e instrumento grave usa clave de fá. assim as notas cabem dentro da pauta.' },
    { t: 'Menos linhas extras', ic: P({ clave: 'sol', notas: [[-6], [-4], [-2]] }), txt: 'sem a clave certa, a nota grave ia precisar de um monte de linhas extras. ficaria difícil de ler.', som: tons('sol', [-6, -4, -2]) },
    { t: 'Truque dos espaços', ic: PN('sol', [1, 3, 5, 7]), txt: 'pra lembrar os espaços da clave de sol, fale de baixo pra cima: FÁ, LÁ, DÓ, MI.', som: tons('sol', [1, 3, 5, 7]) },
    { t: 'Treino na pauLta', ic: P({ clave: 'sol', notas: [[0], [2], [4]] }), txt: 'no jogo pauLta você treina as três: clave de sol, clave de fá e a da bateria.', som: tons('sol', [0, 2, 4]) }],
    quiz: [
      { q: 'pra que serve a clave?', ops: ['pra dar nome às notas da pauta', 'pra marcar a velocidade', 'pra enfeitar'], ok: 0 },
      { q: 'instrumento grave costuma usar a clave de…', ops: ['fá', 'sol', 'percussão'], ok: 0 },
      { q: 'os espaços da clave de sol, de baixo pra cima, são…', ops: ['fá, lá, dó, mi', 'sol, si, ré, fá', 'dó, mi, sol, si'], ok: 0 },
      { q: 'a clave fica onde na pauta?', ops: ['no começo', 'no fim', 'no meio'], ok: 0 }] },
];

/* ======================= TEMPO E COMPASSO ======================= */
export const FASES_TEMPO = [
  { nome: 'o pulso', paul: 'o pulso é o coração da música: bate sempre igual!', cards: [
    { t: 'Pulso', ic: () => notas('q q q q'), txt: 'é a batida constante da música, igual ao coração. é nele que a gente bate o pé.', som: pulso([1, 1, 1, 1, 1, 1, 1, 1], 80) },
    { t: 'BPM', ic: () => txt('♩= 60', true), txt: 'BPM quer dizer batidas por minuto. 60 BPM é uma batida por segundo, igual ao relógio.', som: pulso([1, 1, 1, 1], 60) },
    { t: 'Compasso', ic: P({ notas: [[4], [4], [4], [4]], barras: ['fim'] }), txt: 'é um grupinho de tempos. as barrinhas em pé separam um compasso do outro.', som: pulso([2, 1, 1, 1, 2, 1, 1, 1]) },
    { t: 'Fórmula 4/4', ic: () => txt('4/4'), txt: 'o número de CIMA diz quantos tempos tem o compasso. o de BAIXO diz qual figura vale 1 tempo (4 é a semínima).', som: pulso([2, 1, 1, 1]) },
    { t: 'Tempo forte', ic: () => txt('1 2 3 4', true), txt: 'no 4/4 o tempo 1 é o mais forte. por isso a gente sente quando o compasso recomeça.', som: pulso([2, 1, 1, 1, 2, 1, 1, 1]) }],
    quiz: [
      { q: 'o que é o pulso?', ops: ['a batida constante da música', 'a nota mais aguda', 'o nome da música'], ok: 0 },
      { q: 'no compasso 4/4 quantos tempos tem cada compasso?', ops: ['4', '2', '3'], ok: 0 },
      { q: 'BPM quer dizer…', ops: ['batidas por minuto', 'bateria pra música', 'bem pouco movimento'], ok: 0 },
      { q: 'o número de cima da fórmula de compasso diz…', ops: ['quantos tempos tem o compasso', 'a velocidade', 'a clave'], ok: 0 },
      { q: 'no 4/4, qual tempo é o mais forte?', ops: ['o 1', 'o 2', 'o 4'], ok: 0 }] },
  { nome: 'andamento', paul: 'andamento é a velocidade da música. ouve a diferença!', cards: [
    { t: 'Devagar', ic: () => txt('60', false), txt: '60 BPM é lento, bom pra aprender uma música nova sem errar.', som: pulso([2, 1, 1, 1], 60) },
    { t: 'Médio', ic: () => txt('90'), txt: '90 BPM é um passo de caminhada. muita música pop fica por aqui.', som: pulso([2, 1, 1, 1], 90) },
    { t: 'Rápido', ic: () => txt('140'), txt: '140 BPM já é corrida. rock rápido e música de dançar usam andamentos assim.', som: pulso([2, 1, 1, 1, 2, 1, 1, 1], 140) },
    { t: 'Metrônomo', ic: () => txt('tic tac', true), txt: 'é o aparelho (ou app) que marca o pulso certinho. treinar com ele deixa o seu tempo firme.', som: pulso([2, 1, 1, 1], 100) },
    { t: 'Palavras italianas', ic: () => txt('Allegro', true), txt: 'na partitura o andamento vem em italiano: Adagio é devagar, Andante é andando e Allegro é rápido e alegre.' }],
    quiz: [
      { q: 'andamento é…', ops: ['a velocidade da música', 'o volume da música', 'o nome da nota'], ok: 0 },
      { q: '120 BPM é…', ops: ['mais rápido que 60 BPM', 'mais devagar que 60 BPM', 'igual a 60 BPM'], ok: 0 },
      { q: 'pra que serve o metrônomo?', ops: ['pra marcar o pulso certinho', 'pra afinar o violão', 'pra gravar a voz'], ok: 0 },
      { q: '"Allegro" quer dizer…', ops: ['rápido e alegre', 'bem devagar', 'em silêncio'], ok: 0 }] },
  { nome: 'tipos de compasso', paul: 'nem toda música conta até 4. olha os outros jeitos!', cards: [
    { t: 'Barra de compasso', ic: P({ notas: [[4], [4]], barras: ['meio'] }), txt: 'o risco em pé que separa os compassos. ajuda o olho a não se perder na partitura.' },
    { t: 'Barra final', ic: P({ notas: [[4]], barras: ['fim'] }), txt: 'uma barra fina e uma grossa juntas dizem: a música acabou aqui.' },
    { t: '2/4', ic: () => txt('2/4'), txt: 'dois tempos por compasso: FORTE, fraco. é a contagem da marcha e de muito samba.', som: pulso([2, 1, 2, 1, 2, 1, 2, 1], 100) },
    { t: '3/4', ic: () => txt('3/4'), txt: 'três tempos por compasso: FORTE, fraco, fraco. é a contagem da valsa.', som: pulso([2, 1, 1, 2, 1, 1], 110) },
    { t: '4/4', ic: () => txt('4/4'), txt: 'quatro tempos por compasso. é o mais usado no rock e no pop.', som: pulso([2, 1, 1, 1, 2, 1, 1, 1], 100) }],
    quiz: [
      { q: 'o compasso da valsa é o…', ops: ['3/4', '4/4', '2/4'], ok: 0 },
      { q: 'a barra fina com a grossa quer dizer…', ops: ['a música acabou', 'repita tudo', 'toque mais forte'], ok: 0 },
      { q: 'quantos tempos tem o compasso 2/4?', ops: ['2', '4', '3'], ok: 0 },
      { q: 'qual compasso é o mais usado no rock?', ops: ['4/4', '3/4', '2/4'], ok: 0 }] },
  { nome: 'contando junto', paul: 'banda boa conta junto. vem contar comigo!', cards: [
    { t: 'A contagem', ic: () => txt('1, 2, 3, 4!', true), txt: 'antes de começar, o baterista conta "1, 2, 3, 4" batendo as baquetas. assim a banda toda entra junto.', som: pulso([2, 2, 2, 2], 100) },
    { t: 'Forte e fraco', ic: () => txt('1 2 3 4', true), txt: 'no 4/4: o 1 é forte, o 3 é meio forte, e o 2 e o 4 são fracos.', som: pulso([2, 1, 2, 1], 90) },
    { t: 'O 2 e o 4', ic: () => notas('q x q x'), txt: 'no rock e no pop a caixa bate no 2 e no 4. bata palma só neles pra sentir o balanço.', som: bateria((t, q) => { for (let i = 0; i < 4; i++) { if (i % 2) snare(t + i * q, 0.9); else kick(t + i * q, 0.9); } }) },
    { t: 'O "e"', ic: () => notas('ee ee'), txt: 'entre um tempo e outro existe o "e". contando "1 e 2 e" você divide cada tempo em 2.', som: pulso([2, 1, 2, 1, 2, 1, 2, 1], 160) },
    { t: 'Bater o pé', ic: () => notas('q q q q'), txt: 'bater o pé no pulso enquanto toca é o jeito mais simples de não correr nem atrasar.', som: pulso([1, 1, 1, 1], 90) }],
    quiz: [
      { q: 'pra que serve a contagem "1, 2, 3, 4"?', ops: ['pra banda entrar junto', 'pra afinar', 'pra acabar a música'], ok: 0 },
      { q: 'no rock, a caixa costuma bater no…', ops: ['2 e no 4', '1 e no 3', 'só no 1'], ok: 0 },
      { q: 'o "e" fica…', ops: ['entre um tempo e outro', 'antes do 1', 'depois do compasso'], ok: 0 },
      { q: 'bater o pé ajuda a…', ops: ['não correr nem atrasar', 'tocar mais agudo', 'ler as notas'], ok: 0 }] },
  { nome: 'sinais do caminho', paul: 'a partitura tem placas de trânsito. olha as principais!', cards: [
    { t: 'Ritornelo', ic: () => sym('ritornelo'), txt: 'os dois pontinhos junto da barra mandam repetir o trecho. toca tudo de novo!', som: pulso([2, 1, 1, 1, 2, 1, 1, 1]) },
    { t: 'Casa 1 e casa 2', ic: () => txt('1.   2.', true), txt: 'na primeira vez você toca a casa 1. na repetição, pula a casa 1 e toca a casa 2.' },
    { t: 'Do começo', ic: () => txt('D.C.'), txt: 'D.C. é "da capo", italiano pra "do começo". quando aparece, volte lá pro início da música.' },
    { t: 'Fermata', ic: fermata, txt: 'segure a nota (ou a pausa) por mais tempo que o normal. o pulso espera você.' },
    { t: 'Seguindo a partitura', ic: P({ notas: [[4], [4], [4], [4]], barras: ['fim'] }), txt: 'leia da esquerda pra direita, um compasso de cada vez. se errar, continue: o pulso não espera ninguém.', som: pulso([2, 1, 1, 1, 2, 1, 1, 1]) }],
    quiz: [
      { q: 'o ritornelo manda…', ops: ['repetir o trecho', 'parar de tocar', 'tocar mais rápido'], ok: 0 },
      { q: 'D.C. quer dizer…', ops: ['volte pro começo', 'acabou', 'toque baixinho'], ok: 0 },
      { q: 'na repetição, qual casa a gente toca?', ops: ['a casa 2', 'a casa 1', 'nenhuma'], ok: 0 },
      { q: 'se você errar no meio da música, o melhor é…', ops: ['continuar no pulso', 'parar e começar tudo de novo', 'tocar mais rápido'], ok: 0 }] },
  { nome: 'mudando o tempo', paul: 'o tempo também pode mudar no meio da música!', cards: [
    { t: 'Acelerando', ic: () => txt('accel.', true), txt: '"accelerando" manda ir ficando cada vez mais rápido, aos poucos.', som: () => { const c = audio(); let t = c.currentTime + 0.05; let d = 0.7; for (let i = 0; i < 8; i++) { click(t, 1, 0.6); t += d; d *= 0.86; } } },
    { t: 'Ralentando', ic: () => txt('rit.', true), txt: '"ritardando" manda ir ficando cada vez mais devagar. é muito usado no fim da música.', som: () => { const c = audio(); let t = c.currentTime + 0.05; let d = 0.32; for (let i = 0; i < 8; i++) { click(t, 1, 0.6); t += d; d *= 1.16; } } },
    { t: 'A tempo', ic: () => txt('a tempo', true), txt: 'depois de acelerar ou ralentar, "a tempo" manda voltar pra velocidade normal.' },
    { t: 'Devagar primeiro', ic: () => txt('60 → 90', true), txt: 'pra tocar rápido, comece devagar. só aumente o andamento quando sair sem erro.', som: () => { pulso([2, 1, 1, 1], 60)(); setTimeout(pulso([2, 1, 1, 1], 90), 4300); } },
    { t: 'Segurar o tempo', ic: () => notas('q q q q'), txt: 'músico bom mantém o tempo mesmo sem ouvir o clique. é o que você treina no Beat Hero e no Rudimentix.', som: pulso([2, 1, 0, 0, 2, 1, 0, 0], 100) }],
    quiz: [
      { q: '"accelerando" manda…', ops: ['ir ficando mais rápido', 'ir ficando mais devagar', 'parar'], ok: 0 },
      { q: '"ritardando" é muito usado…', ops: ['no fim da música', 'na contagem', 'na afinação'], ok: 0 },
      { q: '"a tempo" manda…', ops: ['voltar pra velocidade normal', 'tocar mais forte', 'repetir'], ok: 0 },
      { q: 'pra conseguir tocar rápido, o melhor é…', ops: ['começar devagar e ir aumentando', 'começar já bem rápido', 'tocar sem contar'], ok: 0 }] },
];

/* ======================= LEITURA DE NOTAS ======================= */
export const FASES_LEITURA = [
  { nome: 'as 7 notas', paul: 'sete nomes e um ciclo que se repete: dó ré mi fá sol lá si!', cards: [
    { t: 'As 7 notas', ic: PN('sol', [-2, -1, 0, 1, 2, 3, 4]), txt: 'são só 7 nomes: dó, ré, mi, fá, sol, lá, si. depois do si, volta o dó.', som: tons('sol', [-2, -1, 0, 1, 2, 3, 4, 5], 0.32) },
    { t: 'A ordem não muda', ic: PN('sol', [0, 1, 2]), txt: 'a ordem é sempre a mesma. se você sabe uma nota, a de cima é a próxima da fila.', som: tons('sol', [0, 1, 2]) },
    { t: 'Linha, espaço, linha', ic: P({ clave: 'sol', notas: [[0], [1], [2], [3]] }), txt: 'subindo de vizinha em vizinha, a nota alterna: linha, espaço, linha, espaço.', som: tons('sol', [0, 1, 2, 3]) },
    { t: 'Agudo e grave', ic: P({ clave: 'sol', notas: [[-2], [8]] }), txt: 'nota no alto da pauta é aguda (fina). nota embaixo é grave (grossa).', som: tons('sol', [-2, 8], 0.6) },
    { t: 'Oitava', ic: PN('sol', [-2, 5]), txt: 'de um dó até o próximo dó são 8 notas. por isso essa distância se chama oitava.', som: tons('sol', [-2, 5], 0.6) }],
    quiz: [
      { q: 'qual nota vem depois do MI?', ops: ['fá', 'ré', 'sol'], ok: 0 },
      { q: 'quantos nomes de nota existem?', ops: ['7', '5', '12'], ok: 0 },
      { q: 'depois do SI volta qual nota?', ops: ['dó', 'lá', 'fá'], ok: 0 },
      { q: 'de um dó até o próximo dó é uma…', ops: ['oitava', 'pausa', 'clave'], ok: 0 },
      { q: 'quanto mais alta a nota na pauta, mais…', ops: ['agudo é o som', 'grave é o som', 'longo é o som'], ok: 0 }] },
  { nome: 'linhas da clave de sol', paul: 'uma nota de cada vez. começando pelas linhas!', cards: [
    { t: 'Mi', ic: PN('sol', [0]), txt: 'o mi mora na 1ª linha, a de baixo.', som: tons('sol', [0], 0.8) },
    { t: 'Sol', ic: PN('sol', [2]), txt: 'o sol mora na 2ª linha, a que a clave de sol abraça.', som: tons('sol', [2], 0.8) },
    { t: 'Si', ic: PN('sol', [4]), txt: 'o si mora na 3ª linha, bem no meio da pauta.', som: tons('sol', [4], 0.8) },
    { t: 'Ré', ic: PN('sol', [6]), txt: 'o ré mora na 4ª linha.', som: tons('sol', [6], 0.8) },
    { t: 'Fá', ic: PN('sol', [8]), txt: 'o fá mora na 5ª linha, a de cima. juntando tudo: mi, sol, si, ré, fá.', som: tons('sol', [0, 2, 4, 6, 8]) }],
    quiz: [
      { q: 'na clave de sol, qual nota mora na 1ª linha?', ops: ['mi', 'sol', 'fá'], ok: 0 },
      { q: 'qual nota mora na 3ª linha (meio da pauta)?', ops: ['si', 'ré', 'mi'], ok: 0 },
      { q: 'qual nota mora na 2ª linha?', ops: ['sol', 'si', 'lá'], ok: 0 },
      { q: 'as notas das linhas, de baixo pra cima, são…', ops: ['mi, sol, si, ré, fá', 'fá, lá, dó, mi', 'dó, ré, mi, fá, sol'], ok: 0 }] },
  { nome: 'espaços da clave de sol', paul: 'agora as notas que moram nos espaços.', cards: [
    { t: 'Fá', ic: PN('sol', [1]), txt: 'o fá mora no 1º espaço.', som: tons('sol', [1], 0.8) },
    { t: 'Lá', ic: PN('sol', [3]), txt: 'o lá mora no 2º espaço. é a nota que as orquestras usam pra afinar.', som: tons('sol', [3], 0.8) },
    { t: 'Dó', ic: PN('sol', [5]), txt: 'o dó mora no 3º espaço.', som: tons('sol', [5], 0.8) },
    { t: 'Mi', ic: PN('sol', [7]), txt: 'o mi agudo mora no 4º espaço. juntando tudo: fá, lá, dó, mi.', som: tons('sol', [1, 3, 5, 7]) },
    { t: 'Dó e ré de baixo', ic: PN('sol', [-2, -1]), txt: 'abaixo da pauta: o dó central na linha extra e o ré encostado embaixo da 1ª linha.', som: tons('sol', [-2, -1], 0.6) }],
    quiz: [
      { q: 'na clave de sol, qual nota mora no 1º espaço?', ops: ['fá', 'mi', 'lá'], ok: 0 },
      { q: 'qual nota mora no 2º espaço?', ops: ['lá', 'dó', 'sol'], ok: 0 },
      { q: 'as notas dos espaços, de baixo pra cima, são…', ops: ['fá, lá, dó, mi', 'mi, sol, si, ré', 'sol, si, ré, fá'], ok: 0 },
      { q: 'o dó central, na clave de sol, fica…', ops: ['numa linha extra embaixo', 'no 3º espaço', 'na 5ª linha'], ok: 0 }] },
  { nome: 'notas na clave de fá', paul: 'na clave de fá os nomes mudam de lugar. vem ver!', cards: [
    { t: 'Sol', ic: PN('fa', [0]), txt: 'na clave de fá, o sol mora na 1ª linha.', som: tons('fa', [0], 0.8) },
    { t: 'Si', ic: PN('fa', [2]), txt: 'o si mora na 2ª linha.', som: tons('fa', [2], 0.8) },
    { t: 'Ré', ic: PN('fa', [4]), txt: 'o ré mora na 3ª linha, no meio.', som: tons('fa', [4], 0.8) },
    { t: 'Fá', ic: PN('fa', [6]), txt: 'o fá mora na 4ª linha, entre os dois pontinhos da clave.', som: tons('fa', [6], 0.8) },
    { t: 'Lá', ic: PN('fa', [8]), txt: 'o lá mora na 5ª linha. juntando tudo: sol, si, ré, fá, lá.', som: tons('fa', [0, 2, 4, 6, 8]) }],
    quiz: [
      { q: 'na clave de fá, qual nota mora na 4ª linha?', ops: ['fá', 'sol', 'ré'], ok: 0 },
      { q: 'na clave de fá, qual nota mora na 1ª linha?', ops: ['sol', 'mi', 'lá'], ok: 0 },
      { q: 'as linhas da clave de fá, de baixo pra cima, são…', ops: ['sol, si, ré, fá, lá', 'mi, sol, si, ré, fá', 'fá, lá, dó, mi'], ok: 0 },
      { q: 'a clave de fá serve pra notas…', ops: ['graves', 'agudas', 'de prato'], ok: 0 }] },
  { nome: 'subindo e descendo', paul: 'ler música é ver o desenho: sobe, desce, pula!', cards: [
    { t: 'Passo', ic: PN('sol', [2, 3]), txt: 'da linha pro espaço vizinho é um passo: vai pra nota seguinte da fila.', som: tons('sol', [2, 3], 0.5) },
    { t: 'Salto', ic: PN('sol', [2, 4]), txt: 'de uma linha pra linha de cima você pula uma nota. isso é um salto.', som: tons('sol', [2, 4], 0.5) },
    { t: 'Subindo', ic: PN('sol', [-2, -1, 0, 1, 2]), txt: 'notas subindo em escadinha: o som vai ficando mais agudo.', som: tons('sol', [-2, -1, 0, 1, 2], 0.3) },
    { t: 'Descendo', ic: PN('sol', [2, 1, 0, -1, -2]), txt: 'notas descendo em escadinha: o som vai ficando mais grave.', som: tons('sol', [2, 1, 0, -1, -2], 0.3) },
    { t: 'Nota repetida', ic: PN('sol', [2, 2, 2]), txt: 'notas na mesma altura são a mesma nota, tocada de novo.', som: tons('sol', [2, 2, 2], 0.4) }],
    quiz: [
      { q: 'da linha pro espaço vizinho é um…', ops: ['passo', 'salto', 'compasso'], ok: 0 },
      { q: 'de uma linha pra linha de cima é um…', ops: ['salto', 'passo', 'ponto'], ok: 0 },
      { q: 'notas subindo na pauta deixam o som mais…', ops: ['agudo', 'grave', 'fraco'], ok: 0 },
      { q: 'notas na mesma altura são…', ops: ['a mesma nota repetida', 'notas diferentes', 'pausas'], ok: 0 }] },
  { nome: 'sinais e letras', paul: 'pra fechar: os sinais que mudam a nota e as letras da cifra.', cards: [
    { t: 'Sustenido', ic: () => h('b', { class: 'tf-big tf-acid' }, '♯'), txt: 'o sustenido sobe a nota meio tom. no piano, é a tecla preta logo à direita.', som: midis([60, 61], 0.6) },
    { t: 'Bemol', ic: () => h('b', { class: 'tf-big tf-acid' }, '♭'), txt: 'o bemol desce a nota meio tom. no piano, é a tecla preta logo à esquerda.', som: midis([64, 63], 0.6) },
    { t: 'Teclas pretas', ic: () => h('b', { class: 'tf-big tf-acid' }, '♯ ♭'), txt: 'as teclas pretas do piano são os sustenidos e os bemóis. a mesma tecla tem dois nomes: dó sustenido ou ré bemol.', som: midis([60, 61, 62], 0.5) },
    { t: 'Vizinhas coladas', ic: PN('sol', [0, 1]), txt: 'mi e fá são coladinhas, e si e dó também: entre elas não tem tecla preta no piano.', som: midis([64, 65, 71, 72], 0.5) },
    { t: 'Letras da cifra', ic: () => txt('C D E F G A B', true), txt: 'as notas também têm letras: C é dó, D é ré, E é mi, F é fá, G é sol, A é lá e B é si. é o que aparece nos acordes.', som: midis([60, 62, 64, 65, 67, 69, 71], 0.3) }],
    quiz: [
      { q: 'o que o sustenido (♯) faz?', ops: ['sobe meio tom', 'desce meio tom', 'segura a nota'], ok: 0 },
      { q: 'o que o bemol (♭) faz?', ops: ['desce meio tom', 'sobe meio tom', 'repete a nota'], ok: 0 },
      { q: 'na cifra, a letra C é a nota…', ops: ['dó', 'lá', 'si'], ok: 0 },
      { q: 'as teclas pretas do piano são…', ops: ['os sustenidos e os bemóis', 'as notas mais graves', 'as pausas'], ok: 0 },
      { q: 'quais notas são vizinhas coladas (sem tecla preta no meio)?', ops: ['mi e fá', 'dó e ré', 'sol e lá'], ok: 0 }] },
];
