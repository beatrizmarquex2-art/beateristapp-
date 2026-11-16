// Teoria · tema FIGURAS: 30 aulinhas em 6 fases de 5 (pedido da Bea, 15/nov/2026: "umas 30 aulinhas de cada tema", com a figura desenhada em cada uma).
// Cada aulinha = { t: título, ic: () => desenho, txt: explicação curta, som: () => toca o que está escrito }. Cada fase fecha com um mini quiz.
// Este arquivo é o MODELO: os outros temas (pausas, claves, tempo, leitura) ganham as suas 30 no mesmo formato depois que a Bea aprovar este.
import { audio, click } from '../audio.js';
import { epiano } from '../synth.js';

const NSV = 'http://www.w3.org/2000/svg';
/**
 * Desenha figuras de verdade (sem depender de fonte de música). `spec` = símbolos separados por espaço:
 *  w semibreve · h mínima · q semínima · x semínima com cabeça em X (prato) · e colcheia · s semicolcheia · f fusa
 *  ee / ssss = grupo com barra (colcheias / semicolcheias) · eee3 / ssssss6 = quiáltera com o número em cima
 *  ponto no fim (q. h.) = ponto de aumento · ~ = ligadura até a próxima nota · = e + = sinais escritos
 */
export function notas(spec) {
  const y = 50; const top = 18; let x = 16; let s = ''; let ligar = null;
  const cabeca = (cx, cheia, emX) => (emX ? `<path d="M${cx - 7} ${y - 7}L${cx + 7} ${y + 7}M${cx - 7} ${y + 7}L${cx + 7} ${y - 7}" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/>`
    : `<ellipse cx="${cx}" cy="${y}" rx="9" ry="6.5" transform="rotate(-20 ${cx} ${y})" ${cheia ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="3.2"'}/>`);
  const haste = (cx) => `<line x1="${cx + 8}" y1="${y - 2}" x2="${cx + 8}" y2="${top}" stroke="currentColor" stroke-width="2.8"/>`;
  const colchetes = (cx, n) => Array.from({ length: n }, (_, k) => `<path d="M${cx + 8} ${top + k * 9}q11 5 8 19" fill="none" stroke="currentColor" stroke-width="3"/>`).join('');
  const barra = (x1, x2, n) => Array.from({ length: n }, (_, k) => `<rect x="${x1 + 6.6}" y="${top + k * 8}" width="${x2 - x1 + 2.8}" height="5" fill="currentColor"/>`).join('');
  const liga = (cx) => { if (ligar != null) { s += `<path d="M${ligar} ${y + 12}Q${(ligar + cx) / 2} ${y + 24} ${cx} ${y + 12}" fill="none" stroke="currentColor" stroke-width="2.6"/>`; ligar = null; } };
  let ultima = 0;
  for (const bruto of String(spec).split(' ').filter(Boolean)) {
    const ponto = bruto.length > 1 && bruto.endsWith('.'); const t = ponto ? bruto.slice(0, -1) : bruto;
    if (t === '~') { ligar = ultima; continue; }
    if (t === '=' || t === '+') { s += `<text x="${x + 4}" y="${y + 7}" font-size="26" font-weight="800" text-anchor="middle" fill="currentColor">${t}</text>`; x += 28; continue; }
    const grupo = /^([esf]{2,})(\d?)$/.exec(t);
    if (grupo) {
      const k = grupo[1].length; const nb = grupo[1][0] === 'e' ? 1 : grupo[1][0] === 's' ? 2 : 3; const x1 = x;
      for (let i = 0; i < k; i++) { const cx = x1 + i * 22; if (i === 0) liga(cx); s += cabeca(cx, true) + haste(cx); ultima = cx; }
      s += barra(x1, x1 + (k - 1) * 22, nb);
      if (grupo[2]) s += `<text x="${x1 + 8 + (k - 1) * 11}" y="12" font-size="15" font-weight="800" text-anchor="middle" fill="currentColor">${grupo[2]}</text>`;
      x = x1 + k * 22 + 12;
    } else {
      liga(x);
      if (t === 'w') s += cabeca(x, false); else if (t === 'h') s += cabeca(x, false) + haste(x); else if (t === 'q') s += cabeca(x, true) + haste(x); else if (t === 'x') s += cabeca(x, true, true) + haste(x);
      else if (t === 'e') s += cabeca(x, true) + haste(x) + colchetes(x, 1); else if (t === 's') s += cabeca(x, true) + haste(x) + colchetes(x, 2); else if (t === 'f') s += cabeca(x, true) + haste(x) + colchetes(x, 3);
      ultima = x; if (ponto) s += `<circle cx="${x + 15}" cy="${y}" r="3.2" fill="currentColor"/>`;
      x += 'esf'.includes(t) ? 36 : 32;
    }
  }
  const e = document.createElementNS(NSV, 'svg'); e.setAttribute('viewBox', `0 0 ${x} 70`); e.setAttribute('class', 'tf-sym'); e.setAttribute('aria-hidden', 'true'); e.innerHTML = s; return e;
}

/** Toca o ritmo escrito: `durs` em tempos (1 = semínima). Um clique marca cada tempo por baixo, pra criança ouvir quanto a nota dura. */
export function ritmo(durs, { bpm = 84, nota = 67, pulso = true } = {}) {
  const c = audio(); const q = 60 / bpm; let t = c.currentTime + 0.06; const t0 = t; let total = 0;
  for (const d of durs) { epiano(t, [nota], Math.max(0.12, d * q * 0.95), 1); t += d * q; total += d; }
  if (pulso) for (let i = 0; i < Math.ceil(total - 0.001); i++) click(t0 + i * q, i === 0 ? 2 : 1, 0.45);
}
const R = (...d) => () => ritmo(d);
const N = (spec) => () => notas(spec);
const T = 1 / 3; const S6 = 1 / 6;

export const FASES_FIGURAS = [
  { nome: 'as 5 figuras', paul: 'cada figura mostra quanto tempo o som dura. toca em cada uma pra ouvir!', cards: [
    { t: 'Semibreve', ic: N('w'), txt: 'a nota mais longa: dura 4 tempos. a gente conta 1, 2, 3, 4 segurando o som.', som: R(4) },
    { t: 'Mínima', ic: N('h'), txt: 'dura 2 tempos: metade da semibreve. conta 1, 2 segurando o som.', som: R(2, 2) },
    { t: 'Semínima', ic: N('q'), txt: 'dura 1 tempo. é a nota que a gente conta: 1, 2, 3, 4.', som: R(1, 1, 1, 1) },
    { t: 'Colcheia', ic: N('e'), txt: 'dura meio tempo: duas colcheias cabem em 1 tempo. conta "1 e 2 e".', som: R(0.5, 0.5, 0.5, 0.5) },
    { t: 'Semicolcheia', ic: N('s'), txt: 'dura um quarto de tempo: quatro cabem em 1 tempo. conta "1 e & a".', som: R(0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25) }],
    quiz: [
      { q: 'quantos tempos dura uma semínima?', ops: ['1 tempo', '2 tempos', 'meio tempo'], ok: 0 },
      { q: 'quantas colcheias cabem em 1 tempo?', ops: ['2', '4', '1'], ok: 0 },
      { q: 'qual figura dura 4 tempos?', ops: ['semibreve', 'mínima', 'colcheia'], ok: 0 },
      { q: 'quantas semicolcheias cabem em 1 tempo?', ops: ['4', '2', '8'], ok: 0 },
      { q: 'duas mínimas somam quantos tempos?', ops: ['4', '2', '1'], ok: 0 },
      { q: 'qual é a MAIS curta?', ops: ['semicolcheia', 'colcheia', 'semínima'], ok: 0 }] },
  { nome: 'as partes da figura', paul: 'toda figura é montada com pecinhas. olha só cada uma!', cards: [
    { t: 'Cabeça', ic: N('q'), txt: 'é a bolinha da nota. ela pode ser cheia (pintada) ou vazia (só o contorno), e isso muda quanto a nota dura.', som: R(1) },
    { t: 'Haste', ic: N('h'), txt: 'é o risquinho em pé preso na cabeça. a semibreve é a única figura que não tem haste.', som: R(2) },
    { t: 'Colchete', ic: N('e'), txt: 'é a bandeirinha na ponta da haste. 1 colchete é colcheia, 2 colchetes é semicolcheia. cada colchete deixa a nota 2 vezes mais rápida.', som: R(0.5, 0.5) },
    { t: 'Barra', ic: N('ee'), txt: 'quando as colcheias ficam juntas, os colchetes viram uma barra ligando as hastes. cada grupinho vale 1 tempo e fica mais fácil de ler.', som: R(0.5, 0.5, 0.5, 0.5) },
    { t: 'Cheia ou vazia', ic: N('h q'), txt: 'cabeça vazia dura mais: é a mínima, 2 tempos. cabeça cheia dura menos: é a semínima, 1 tempo.', som: R(2, 1, 1) }],
    quiz: [
      { q: 'qual figura NÃO tem haste?', ops: ['semibreve', 'mínima', 'semínima'], ok: 0 },
      { q: 'quantos colchetes tem a semicolcheia?', ops: ['2', '1', '3'], ok: 0 },
      { q: 'a barra que junta as colcheias fica no lugar…', ops: ['dos colchetes', 'da cabeça', 'da pausa'], ok: 0 },
      { q: 'cabeça vazia com haste é a…', ops: ['mínima', 'semínima', 'colcheia'], ok: 0 },
      { q: 'cada colchete deixa a nota…', ops: ['2 vezes mais rápida', '2 vezes mais lenta', 'mais forte'], ok: 0 }] },
  { nome: 'uma vale duas', paul: 'o segredo das figuras: cada uma vale duas da próxima!', cards: [
    { t: '1 semibreve = 2 mínimas', ic: N('w = h h'), txt: '4 tempos é o mesmo que 2 + 2. a semibreve dura o mesmo que duas mínimas seguidas.', som: R(2, 2) },
    { t: '1 mínima = 2 semínimas', ic: N('h = q q'), txt: '2 tempos é o mesmo que 1 + 1. uma mínima dura o mesmo que duas semínimas.', som: R(1, 1) },
    { t: '1 semínima = 2 colcheias', ic: N('q = ee'), txt: '1 tempo dividido em 2 pedaços iguais. conta "1 e".', som: R(0.5, 0.5) },
    { t: '1 colcheia = 2 semicolcheias', ic: N('e = ss'), txt: 'meio tempo dividido em 2. as semicolcheias passam bem rapidinho.', som: R(0.25, 0.25) },
    { t: '1 tempo = 4 semicolcheias', ic: N('q = ssss'), txt: 'por isso 1 semibreve vale 16 semicolcheias! cada degrau da escadinha é o dobro de notas.', som: R(0.25, 0.25, 0.25, 0.25) }],
    quiz: [
      { q: 'quantas mínimas cabem numa semibreve?', ops: ['2', '4', '1'], ok: 0 },
      { q: 'uma semínima vale quantas colcheias?', ops: ['2', '4', '8'], ok: 0 },
      { q: 'quantas semínimas cabem numa mínima?', ops: ['2', '3', '4'], ok: 0 },
      { q: 'quantas colcheias cabem numa mínima?', ops: ['4', '2', '8'], ok: 0 },
      { q: 'cada figura vale quantas da próxima (mais rápida)?', ops: ['2', '3', '4'], ok: 0 }] },
  { nome: 'contando em voz alta', paul: 'ler ritmo é falar o ritmo. fala junto comigo!', cards: [
    { t: '1, 2, 3, 4', ic: N('q q q q'), txt: 'quatro semínimas: uma em cada tempo. conta "1, 2, 3, 4" batendo palma.', som: R(1, 1, 1, 1) },
    { t: '1 e 2 e 3 e 4 e', ic: N('ee ee ee ee'), txt: 'oito colcheias: duas em cada tempo. o "e" é a notinha do meio.', som: R(0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5) },
    { t: '1 e & a', ic: N('ssss ssss'), txt: 'semicolcheias: quatro em cada tempo. fala "1 e & a, 2 e & a" sem correr.', som: R(0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25) },
    { t: 'tá, ti-ti', ic: N('q ee q ee'), txt: 'semínima é "tá" e duas colcheias são "ti-ti". aqui fica: tá, ti-ti, tá, ti-ti.', som: R(1, 0.5, 0.5, 1, 0.5, 0.5) },
    { t: 'pão, bolo, chocolate', ic: N('q ee ssss q'), txt: 'palavra também é ritmo! "pão" é 1 nota, "bo-lo" são 2 e "cho-co-la-te" são 4. é assim no Monte seu ritmo e no Detetive Note.', som: R(1, 0.5, 0.5, 0.25, 0.25, 0.25, 0.25, 1) }],
    quiz: [
      { q: 'como a gente conta as colcheias?', ops: ['1 e 2 e', '1, 2, 3, 4', '1 e & a'], ok: 0 },
      { q: '"cho-co-la-te" tem o ritmo de…', ops: ['4 semicolcheias', '2 colcheias', '1 semínima'], ok: 0 },
      { q: '"bo-lo" tem o ritmo de…', ops: ['2 colcheias', '1 semínima', '4 semicolcheias'], ok: 0 },
      { q: '"pão" tem o ritmo de…', ops: ['1 semínima', '2 colcheias', '1 semibreve'], ok: 0 },
      { q: 'no "tá, ti-ti", o "tá" é uma…', ops: ['semínima', 'colcheia', 'mínima'], ok: 0 }] },
  { nome: 'ponto e ligadura', paul: 'dois truques pra fazer a nota durar mais!', cards: [
    { t: 'Ponto de aumento', ic: N('q.'), txt: 'o pontinho do lado da nota soma metade do valor dela. é um jeito de esticar o som.', som: R(1.5) },
    { t: 'Mínima pontuada', ic: N('h.'), txt: 'a mínima vale 2. metade de 2 é 1. então 2 + 1 = 3 tempos.', som: R(3) },
    { t: 'Semínima pontuada', ic: N('q. e'), txt: 'vale 1 tempo e meio. quase sempre vem com uma colcheia depois, pra fechar 2 tempos.', som: R(1.5, 0.5) },
    { t: 'Ligadura', ic: N('q ~ q'), txt: 'a curvinha junta duas notas iguais: você toca só a primeira e segura o som pelas duas.', som: R(2) },
    { t: 'Som bem comprido', ic: N('w ~ h'), txt: 'com a ligadura o som pode passar de um compasso pro outro: 4 + 2 = 6 tempos sem parar.', som: R(6) }],
    quiz: [
      { q: 'o ponto de aumento soma…', ops: ['metade do valor da nota', 'o dobro da nota', '1 tempo sempre'], ok: 0 },
      { q: 'quantos tempos dura a mínima pontuada?', ops: ['3', '2', '4'], ok: 0 },
      { q: 'na ligadura, a gente toca…', ops: ['só a primeira nota e segura', 'as duas notas', 'nenhuma das duas'], ok: 0 },
      { q: 'quanto dura a semínima pontuada?', ops: ['1 tempo e meio', '2 tempos', 'meio tempo'], ok: 0 },
      { q: 'pra que servem o ponto e a ligadura?', ops: ['pra nota durar mais', 'pra nota ficar mais forte', 'pra nota ficar mais aguda'], ok: 0 }] },
  { nome: 'grupos especiais', paul: 'agora as figuras mais diferentes. você já consegue!', cards: [
    { t: 'Tercina', ic: N('eee3'), txt: 'são 3 notas iguais dentro de 1 tempo, no lugar de 2. tem um 3 em cima. fala "mo-ran-go".', som: R(T, T, T, T, T, T) },
    { t: 'Sextina', ic: N('ssssss6'), txt: 'são 6 notas iguais dentro de 1 tempo. é como duas tercinas coladas: "mo-ran-go-mo-ran-go".', som: R(S6, S6, S6, S6, S6, S6) },
    { t: 'Fusa', ic: N('f'), txt: 'tem 3 colchetes e é rapidíssima: 8 fusas cabem em 1 tempo.', som: R(0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125) },
    { t: 'Cabeça em X', ic: N('x x x x'), txt: 'na bateria, a nota com X é prato (o chimbal, por exemplo). ela dura igual à figura normal: aqui são 4 semínimas.', som: () => { const c = audio(); const t = c.currentTime + 0.06; for (let i = 0; i < 4; i++) click(t + i * (60 / 84), 2, 0.7); } },
    { t: 'Compasso cheio', ic: N('h q ee'), txt: 'num compasso 4/4 as figuras têm que somar 4 tempos. aqui: 2 + 1 + 1 (duas colcheias) = 4.', som: R(2, 1, 0.5, 0.5) }],
    quiz: [
      { q: 'a tercina põe quantas notas em 1 tempo?', ops: ['3', '2', '4'], ok: 0 },
      { q: 'a sextina põe quantas notas em 1 tempo?', ops: ['6', '3', '8'], ok: 0 },
      { q: 'na bateria, a nota com X é…', ops: ['um prato', 'o bumbo', 'uma pausa'], ok: 0 },
      { q: 'num compasso 4/4 as figuras somam…', ops: ['4 tempos', '2 tempos', '8 tempos'], ok: 0 },
      { q: 'quantos colchetes tem a fusa?', ops: ['3', '2', '1'], ok: 0 }] },
];
