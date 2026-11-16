// Aulas do Paul por instrumento: BATERIA, TECLADO e VIOLÃO, 30 aulinhas cada, em 6 fases de 5 (pedido da Bea, 15/nov/2026).
// Mesmo formato da Teoria (teoria-figuras.js / teoria-temas.js): { t, ic: () => desenho, txt, som? } e um mini quiz por fase.
// Regras da Bea: frase curta, sempre ligada a algo musical, básico bem reforçado antes de assunto avançado.
// Conteúdo escrito pelo Claude: A BEA VALIDA a parte musical e de técnica.
import { h } from '../util.js';
import { audio, click, kick, snare, hihat, cymbal, tom } from '../audio.js';
import { epiano, guitar } from '../synth.js';
import { pauta } from './teoria-temas.js';
import { diagrama, VIOLAO } from '../views/estudos-som.js';

const NSV = 'http://www.w3.org/2000/svg';
const svg = (w, hh, inner) => { const e = document.createElementNS(NSV, 'svg'); e.setAttribute('viewBox', `0 0 ${w} ${hh}`); e.setAttribute('class', 'tf-sym'); e.setAttribute('aria-hidden', 'true'); e.innerHTML = inner; return e; };
const txt = (t, peq) => h('b', { class: `tf-big${peq ? ' small' : ''}` }, t);
const fila = (...els) => h('span', { class: 'tf-fila' }, ...els.map((e) => (typeof e === 'string' ? h('b', {}, e) : e)));
const agora = () => audio().currentTime + 0.06;
const L = (c = 'currentColor') => `stroke="${c}" fill="none" stroke-linecap="round" stroke-linejoin="round"`;

/* ===================== desenhos: bateria ===================== */
const PECAS = {
  bumbo: `<circle cx="40" cy="30" r="24" ${L()} stroke-width="4"/><circle cx="40" cy="30" r="13" ${L()} stroke-width="3"/><circle cx="40" cy="30" r="3.5" fill="currentColor"/><rect x="35" y="54" width="10" height="6" rx="2" fill="currentColor"/>`,
  caixa: `<ellipse cx="40" cy="20" rx="28" ry="8" ${L()} stroke-width="3.6"/><path d="M12 20v22a28 8 0 0 0 56 0V20" ${L()} stroke-width="3.6"/><path d="M20 30v14M30 33v14M40 34v14M50 33v14M60 30v14" ${L()} stroke-width="1.6" opacity=".5"/>`,
  chimbal: `<g transform="rotate(-6 40 14)"><ellipse cx="40" cy="15" rx="31" ry="6.4" fill="currentColor"/><ellipse cx="40" cy="13.6" rx="23" ry="4" ${L('var(--tf-papel,#fffdf7)')} stroke-width="1.3" opacity=".6"/><ellipse cx="40" cy="12.6" rx="6" ry="2.3" fill="var(--tf-papel,#fffdf7)" opacity=".5"/></g><ellipse cx="40" cy="24" rx="31" ry="6.4" fill="currentColor" opacity=".7"/><ellipse cx="40" cy="23" rx="22" ry="3.6" ${L('var(--tf-papel,#fffdf7)')} stroke-width="1.2" opacity=".5"/><line x1="40" y1="30" x2="40" y2="54" ${L()} stroke-width="3.4"/><path d="M40 46L26 58M40 46L54 58" ${L()} stroke-width="3"/><path d="M48 58h22l-4 5H44z" fill="currentColor" opacity=".9"/><path d="M40 52L56 58" ${L()} stroke-width="2.4" opacity=".7"/>`,
  tom: `<path d="M14 18v23a26 8.5 0 0 0 52 0V18z" fill="currentColor" opacity=".92"/><path d="M22 21v20M31 23v22M40 24v23M49 23v22M58 21v20" ${L('var(--tf-papel,#fffdf7)')} stroke-width="1.7" opacity=".5"/><ellipse cx="40" cy="43" rx="26" ry="8.5" fill="none" stroke="currentColor" stroke-width="3.4"/><ellipse cx="40" cy="18" rx="26" ry="8.5" fill="currentColor"/><ellipse cx="40" cy="18" rx="21" ry="6.4" fill="var(--tf-papel,#fffdf7)"/><ellipse cx="40" cy="18" rx="13" ry="3.8" ${L('currentColor')} stroke-width="1.3" opacity=".3"/><path d="M24 15q8 -4 20 -3.4" ${L('currentColor')} stroke-width="1.6" opacity=".25"/><path d="M40 50v8" ${L()} stroke-width="4"/><rect x="32" y="56" width="16" height="5" rx="2.4" fill="currentColor"/>`,
  surdo: `<path d="M8 18v27a32 9.5 0 0 0 64 0V18z" fill="currentColor" opacity=".92"/><path d="M16 21v24M26 23v27M36 24v29M44 24v29M54 23v27M64 21v24" ${L('var(--tf-papel,#fffdf7)')} stroke-width="1.8" opacity=".5"/><ellipse cx="40" cy="46" rx="32" ry="9.5" fill="none" stroke="currentColor" stroke-width="3.6"/><ellipse cx="40" cy="18" rx="32" ry="9.5" fill="currentColor"/><ellipse cx="40" cy="18" rx="26" ry="7.2" fill="var(--tf-papel,#fffdf7)"/><ellipse cx="40" cy="18" rx="16" ry="4.3" ${L('currentColor')} stroke-width="1.4" opacity=".3"/><path d="M20 14q10 -5 26 -4.4" ${L('currentColor')} stroke-width="1.8" opacity=".25"/><path d="M14 52l-5 9M66 52l5 9M40 56v5" ${L()} stroke-width="4"/><path d="M5 61h8M67 61h8" ${L()} stroke-width="3.4"/>`,
  prato: `<g transform="rotate(-9 40 24)"><ellipse cx="40" cy="28" rx="36" ry="10" fill="currentColor" opacity=".6"/><ellipse cx="40" cy="24" rx="36" ry="10" fill="currentColor"/><ellipse cx="40" cy="24" rx="28" ry="7" ${L('var(--tf-papel,#fffdf7)')} stroke-width="1.5" opacity=".55"/><ellipse cx="40" cy="24" rx="19" ry="4.6" ${L('var(--tf-papel,#fffdf7)')} stroke-width="1.3" opacity=".4"/><ellipse cx="40" cy="21.5" rx="9" ry="4" fill="var(--tf-papel,#fffdf7)" opacity=".45"/><ellipse cx="40" cy="20.5" rx="4.4" ry="2" fill="currentColor"/><path d="M10 20q8 -6 20 -8" ${L('var(--tf-papel,#fffdf7)')} stroke-width="2.4" opacity=".8"/></g><line x1="40" y1="31" x2="40" y2="57" ${L()} stroke-width="3.4"/><path d="M40 48L26 60M40 48L54 60" ${L()} stroke-width="3"/><path d="M6 8l5 3M74 8l-5 3M3 17l6 0M77 17l-6 0" ${L()} stroke-width="2.6"/>`,
  baquetas: `<line x1="14" y1="54" x2="62" y2="10" ${L()} stroke-width="5"/><line x1="66" y1="54" x2="18" y2="10" ${L()} stroke-width="5"/><circle cx="62" cy="10" r="4.5" fill="currentColor"/><circle cx="18" cy="10" r="4.5" fill="currentColor"/>`,
  banco: `<rect x="14" y="20" width="52" height="12" rx="6" fill="currentColor"/><path d="M24 32l-6 26M56 32l6 26M40 32v26" ${L()} stroke-width="4"/>`,
};
export const peca = (id, extra = '') => svg(80, 64, PECAS[id] + extra);
/** Grade de levada: linhas [nome, bits]; cada coluna é uma batida (1 e 2 e…). */
export function grade(linhas, cols = 8, nomes = null) {
  const W = 22; const x0 = 56; const w = x0 + cols * W + 4; let s = '';
  const cont = nomes || (cols === 8 ? ['1', 'e', '2', 'e', '3', 'e', '4', 'e'] : Array.from({ length: cols }, (_, i) => String(i + 1)));
  cont.forEach((c, i) => { s += `<text x="${x0 + i * W + W / 2}" y="12" font-size="12" font-weight="800" text-anchor="middle" fill="currentColor" opacity="${/\d/.test(c) ? 1 : .55}">${c}</text>`; });
  linhas.forEach(([nome, bits], r) => { const y = 24 + r * 22; s += `<text x="2" y="${y + 13}" font-size="12.5" font-weight="800" fill="currentColor">${nome}</text>`; bits.forEach((b, i) => { s += b ? `<circle cx="${x0 + i * W + W / 2}" cy="${y + 9}" r="7.4" fill="currentColor"/>` : `<circle cx="${x0 + i * W + W / 2}" cy="${y + 9}" r="3" fill="currentColor" opacity=".25"/>`; }); });
  const e = svg(w, 28 + linhas.length * 22, s); e.classList.add('tf-grade'); return e;
}
const ROCK = { chimbal: [1, 1, 1, 1, 1, 1, 1, 1], caixa: [0, 0, 1, 0, 0, 0, 1, 0], bumbo: [1, 0, 0, 0, 1, 0, 0, 0] };
const gr = (o, nomes) => () => grade(Object.entries(o).map(([k, v]) => [k, v]), o.chimbal ? 8 : Object.values(o)[0].length, nomes);

/* ===================== sons: bateria ===================== */
/** Toca uma levada de 8 passos (colcheias). `p` = { chimbal, caixa, bumbo, aberto? }; `comp` compassos; `bpm`. */
const levada = (p, comp = 2, bpm = 80) => () => {
  const t0 = agora(); const q = 60 / bpm / 2;
  for (let c = 0; c < comp; c++) for (let i = 0; i < 8; i++) { const t = t0 + (c * 8 + i) * q; if (i % 2 === 0) click(t, i === 0 ? 2 : 1, 0.25); if (p.chimbal && p.chimbal[i]) hihat(t, 0.6, !!(p.aberto && p.aberto[i])); if (p.caixa && p.caixa[i]) snare(t, 0.9); if (p.bumbo && p.bumbo[i]) kick(t, 0.9); }
};
const ROCK_P = ROCK;
const D = (fn) => () => fn(agora(), 0.5);

/* ===================== desenhos: teclado ===================== */
const BR = [0, 2, 4, 5, 7, 9, 11]; const NOM = { 0: 'dó', 2: 'ré', 4: 'mi', 5: 'fá', 7: 'sol', 9: 'lá', 11: 'si' };
/** Teclado desenhado. de/ate = notas MIDI (brancas nas pontas), marca = teclas coloridas, nomes = escreve dó ré mi…, dedos = { midi: número }. */
export function teclado({ de = 60, ate = 72, marca = [], nomes = false, dedos = {} } = {}) {
  const W = 24; let br = ''; let pr = ''; let n = 0; const pos = [];
  for (let m = de; m <= ate; m++) if (BR.includes(m % 12)) { pos.push(m); const x = n * W; const on = marca.includes(m);
    br += `<rect x="${x + 1}" y="2" width="${W - 2}" height="88" rx="3" fill="${on ? 'currentColor' : '#fffdf7'}" fill-opacity="${on ? 0.4 : 1}" stroke="#14111a" stroke-width="1.8"/>`;
    if (nomes) br += `<text x="${x + W / 2}" y="84" font-size="9.5" font-weight="800" text-anchor="middle" fill="#14111a">${NOM[m % 12]}</text>`;
    if (dedos[m]) br += `<circle cx="${x + W / 2}" cy="64" r="8" fill="currentColor"/><text x="${x + W / 2}" y="68" font-size="11" font-weight="800" text-anchor="middle" fill="#fff">${dedos[m]}</text>`;
    n++; }
  for (let m = de; m <= ate; m++) if (!BR.includes(m % 12)) { const wi = pos.filter((x) => x < m).length; const on = marca.includes(m); pr += `<rect x="${wi * W - 7}" y="2" width="14" height="52" rx="2.5" fill="${on ? 'currentColor' : '#14111a'}"/>`; }
  return svg(n * W + 2, 94, br + pr);
}
const TK = (o) => () => teclado(o);
const maos = () => svg(150, 56, [0, 1, 2, 3, 4].map((i) => { const x = 18 + i * 28; const alt = [28, 18, 12, 18, 28][i]; return `<rect x="${x - 7}" y="${alt}" width="14" height="${50 - alt}" rx="7" fill="currentColor" opacity=".35"/><circle cx="${x}" cy="${alt + 2}" r="9" fill="currentColor"/><text x="${x}" y="${alt + 6}" font-size="12" font-weight="800" text-anchor="middle" fill="#fff">${[1, 2, 3, 4, 5][i]}</text>`; }).join('') + '<text x="75" y="55" font-size="9" font-weight="800" text-anchor="middle" fill="currentColor">mão direita (visto de cima)</text>');
const maoCurva = () => svg(120, 64, `<path d="M10 52q10 -44 50 -44t50 44" ${L()} stroke-width="5"/><rect x="6" y="52" width="108" height="10" rx="3" fill="currentColor" opacity=".35"/>`);

/* ===================== sons: teclado ===================== */
const seq = (ms, d = 0.4, len = 0.5) => () => { const t = agora(); ms.forEach((m, i) => epiano(t + i * d, [m], len, 1)); };
const acordeT = (ms, len = 1.4) => () => epiano(agora(), ms, len, 1);
const sequencia = (acordes, d = 1.0) => () => { const t = agora(); acordes.forEach((a, i) => epiano(t + i * d, a, d * 0.95, 1)); };
const batidas = (n, bpm = 90) => { const t = agora(); for (let i = 0; i < n; i++) click(t + (i * 60) / bpm, i % 4 === 0 ? 2 : 1, 0.4); };

/* ===================== desenhos e sons: violão ===================== */
const ABERTAS = [40, 45, 50, 55, 59, 64]; const NCORDA = ['mi', 'lá', 'ré', 'sol', 'si', 'mi']; // 6ª → 1ª
const corda = (m, t) => guitar(t, [m + 12], 1.1, 1); // guitar() toca uma oitava abaixo do que se pede
const solta = (i) => () => corda(ABERTAS[i], agora());
const cordasSoltas = (ord = [0, 1, 2, 3, 4, 5], d = 0.4) => () => { const t = agora(); ord.forEach((i, k) => corda(ABERTAS[i], t + k * d)); };
const nota = (cordaN, casa, t) => corda(ABERTAS[6 - cordaN] + casa, t); // cordaN: 1ª (fina) a 6ª (grossa)
const notas = (lista, d = 0.5) => () => { const t = agora(); lista.forEach(([c, f], i) => nota(c, f, t + i * d)); };
const acordeV = (frets, t = agora(), dir = 1, len = 1) => { const ordem = frets.map((f, i) => [f, i]).filter(([f]) => f >= 0); if (dir < 0) ordem.reverse(); ordem.forEach(([f, i], k) => corda(ABERTAS[i] + f, t + k * 0.03)); void len; };
const acorde = (frets) => () => acordeV(frets);
const cifra = (c) => VIOLAO.find((x) => x[0] === c)[2];
const DIAG = (c) => () => { const e = diagrama(cifra(c)); e.setAttribute('class', 'tf-sym tf-diag'); e.setAttribute('aria-hidden', 'true'); e.removeAttribute('role'); return e; };
/** As 6 cordas desenhadas (1ª em cima, 6ª embaixo), com nomes. `marca` = índices (0 = 6ª) destacados. */
export function cordasSVG(marca = []) {
  let s = ''; for (let k = 0; k < 6; k++) { const i = 5 - k; const y = 10 + k * 11; const on = marca.includes(i);
    s += `<line x1="36" x2="136" y1="${y}" y2="${y}" stroke="currentColor" stroke-width="${1 + k * 0.45}" ${on ? '' : 'opacity=".7"'}/>` + (on ? `<circle cx="140" cy="${y}" r="3.4" fill="currentColor"/>` : '') + `<text x="2" y="${y + 3.5}" font-size="10" font-weight="800" fill="currentColor">${k + 1}ª ${NCORDA[i]}</text>`; }
  return svg(148, 72, s);
}
/** Braço visto de lado: 6 cordas e 5 casas; pontos = [[corda 1..6, casa, dedo?]]. */
export function braco(pontos = [], { numeros = false } = {}) {
  let s = ''; const x0 = 22; const W = 30;
  for (let f = 0; f <= 5; f++) s += `<line x1="${x0 + f * W}" x2="${x0 + f * W}" y1="8" y2="60" stroke="currentColor" stroke-width="${f === 0 ? 5 : 2}" opacity="${f === 0 ? 1 : .6}"/>` + (numeros && f > 0 ? `<text x="${x0 + f * W - W / 2}" y="73" font-size="9.5" font-weight="800" text-anchor="middle" fill="currentColor">casa ${f}</text>` : '');
  for (let k = 0; k < 6; k++) s += `<line x1="${x0}" x2="${x0 + 5 * W}" y1="${10 + k * 10}" y2="${10 + k * 10}" stroke="currentColor" stroke-width="${1 + k * 0.4}" opacity=".8"/>`;
  pontos.forEach(([c, f, d]) => { const cx = x0 + (f - 0.5) * W; const cy = 10 + (c - 1) * 10; s += `<circle cx="${cx}" cy="${cy}" r="6.2" fill="currentColor"/>` + (d ? `<text x="${cx}" y="${cy + 3.6}" font-size="10" font-weight="800" text-anchor="middle" fill="#fff">${d}</text>` : ''); });
  return svg(x0 + 5 * W + 8, numeros ? 78 : 66, s);
}
/** Tablatura: 6 linhas (1ª em cima) e os números das casas, uma nota por coluna. */
export function tab(lista) {
  let s = ''; for (let k = 0; k < 6; k++) s += `<line x1="22" x2="${30 + lista.length * 26}" y1="${12 + k * 11}" y2="${12 + k * 11}" stroke="currentColor" stroke-width="1.6" opacity=".75"/>`;
  s += '<text x="2" y="34" font-size="13" font-weight="800" fill="currentColor">T</text><text x="2" y="47" font-size="13" font-weight="800" fill="currentColor">A</text><text x="2" y="60" font-size="13" font-weight="800" fill="currentColor">B</text>';
  lista.forEach(([c, f], i) => { const x = 40 + i * 26; const y = 12 + (c - 1) * 11; s += `<rect x="${x - 8}" y="${y - 7}" width="16" height="14" rx="3" fill="var(--tf-papel,#fffdf7)"/><text x="${x}" y="${y + 4.5}" font-size="13" font-weight="800" text-anchor="middle" fill="currentColor">${f}</text>`; });
  return svg(34 + lista.length * 26, 78, s);
}
const violaoDesenho = () => svg(120, 64, `<path d="M18 36c0-8 8-10 12-14c4-6 10-8 16-3c4 4 10 3 14 7c6 6 4 16-2 20c-6 4-14 3-20 4c-8 1-20-2-20-14z" fill="currentColor" opacity=".85"/><circle cx="40" cy="38" r="6" fill="var(--tf-papel,#fffdf7)"/><line x1="60" y1="24" x2="106" y2="8" ${L()} stroke-width="7" /><rect x="102" y="2" width="14" height="12" rx="3" fill="currentColor" transform="rotate(-18 109 8)"/>`);
const setas = (padrao) => () => txt(padrao, true);
/** Batida: lista de [tempo em batidas, direção]. 1 batida = 0.5 s. */
const batida = (frets, passos, bpm = 100) => () => { const t = agora(); const q = 60 / bpm; passos.forEach(([o, d], i) => acordeV(frets, t + o * q, d)); for (let i = 0; i < 4; i++) click(t + i * q, i === 0 ? 2 : 1, 0.2); };
const EM = [0, 2, 2, 0, 0, 0];

/* ============================ BATERIA ============================ */
export const FASES_BATERIA = [
  { nome: 'as peças', paul: 'a bateria é um monte de instrumentos juntos. toca em cada peça pra ouvir!', cards: [
    { t: 'Bumbo', ic: () => peca('bumbo'), txt: 'o tambor grande e grave, tocado com o pé no pedal. ele marca o chão do ritmo.', som: D((t) => { kick(t, 1); kick(t + 0.6, 1); }) },
    { t: 'Caixa', ic: () => peca('caixa'), txt: 'o tambor do meio, com um som seco e estalado. é tocado com a baqueta e marca o 2 e o 4 no rock.', som: D((t) => { snare(t, 1); snare(t + 0.6, 1); }) },
    { t: 'Chimbal', ic: () => peca('chimbal'), txt: 'são dois pratos que fecham um sobre o outro. com o pé você abre e fecha, e com a baqueta faz o "tchi tchi".', som: D((t) => { hihat(t, 0.9); hihat(t + 0.3, 0.9); hihat(t + 0.7, 0.9, true); }) },
    { t: 'Tom-tom e surdo', ic: () => fila(peca('tom'), peca('surdo')), txt: 'tambores que ficam em cima e no chão. o menor é mais agudo e o surdo é bem grave.', som: D((t) => { tom(t, 240, 0.9); tom(t + 0.4, 180, 0.9); tom(t + 0.8, 120, 0.9); }) },
    { t: 'Pratos', ic: () => peca('prato'), txt: 'o prato de ataque faz um "tchaaa" forte pra marcar começos e finais. o de condução faz um som contínuo.', som: D((t) => { cymbal(t, false, 0.9); cymbal(t + 1.4, true, 0.8); cymbal(t + 1.7, true, 0.8); cymbal(t + 2, true, 0.8); }) }],
    quiz: [
      { q: 'qual peça a gente toca com o pé?', ops: ['o bumbo', 'a caixa', 'o tom-tom'], ok: 0 },
      { q: 'o som da caixa é…', ops: ['seco e estalado', 'grave e longo', 'chiado de prato'], ok: 0 },
      { q: 'o chimbal é formado por…', ops: ['dois pratos', 'um tambor só', 'duas baquetas'], ok: 0 },
      { q: 'qual é a peça mais grave?', ops: ['o bumbo', 'o chimbal', 'a caixa'], ok: 0 },
      { q: 'o prato de ataque serve pra…', ops: ['marcar começos e finais', 'afinar a bateria', 'segurar a baqueta'], ok: 0 }] },
  { nome: 'baquetas e postura', paul: 'antes do som, o corpo. postura boa é metade do som!', cards: [
    { t: 'Segurando a baqueta', ic: () => peca('baquetas'), txt: 'segure entre o polegar e o indicador, a mais ou menos um terço do fim. os outros dedos envolvem sem apertar.' },
    { t: 'Sentado certo', ic: () => peca('banco'), txt: 'costas retas, ombros soltos e pés apoiados. o banco fica numa altura em que as coxas descem um pouquinho.' },
    { t: 'O ponto de toque', ic: () => peca('caixa', '<circle cx="40" cy="20" r="4" fill="currentColor"/>'), txt: 'bata no meio da pele da caixa. perto da borda, o som fica fraco e sem corpo.', som: D((t) => { snare(t, 1); snare(t + 0.5, 0.4); }) },
    { t: 'O rebote', ic: () => peca('baquetas'), txt: 'a baqueta bate e volta sozinha. você não empurra pra baixo: deixa ela quicar com o pulso solto.', som: D((t) => { for (let i = 0; i < 8; i++) snare(t + i * 0.12, 0.8); }) },
    { t: 'O pé no pedal', ic: () => peca('bumbo'), txt: 'o pedal bate no bumbo e volta. toque leve, sem pisar com força: o som sai bonito mesmo assim.', som: D((t) => { kick(t, 1); kick(t + 0.5, 1); kick(t + 1, 1); }) }],
    quiz: [
      { q: 'onde bater na caixa?', ops: ['no meio da pele', 'na borda de metal', 'embaixo do tambor'], ok: 0 },
      { q: 'rebote é quando a baqueta…', ops: ['quica sozinha depois de bater', 'bate com muita força', 'fica parada na pele'], ok: 0 },
      { q: 'como segurar a baqueta?', ops: ['entre polegar e indicador, sem apertar', 'com o punho fechado e forte', 'só com a ponta dos dedos'], ok: 0 },
      { q: 'na postura, as costas ficam…', ops: ['retas', 'curvadas', 'deitadas'], ok: 0 },
      { q: 'o bumbo se toca com…', ops: ['o pé, no pedal', 'a mão', 'a boca'], ok: 0 }] },
  { nome: 'contar e levada', paul: 'antes de tocar, a gente conta. depois montamos a levada peça por peça.', cards: [
    { t: 'Pulso: 1, 2, 3, 4', ic: gr({ pulso: [1, 1, 1, 1] }, ['1', '2', '3', '4']), txt: 'quatro batidas formam um compasso. conte "1, 2, 3, 4" em voz alta. o 1 é o mais forte.', som: () => batidas(8, 80) },
    { t: 'Só o bumbo', ic: gr({ bumbo: [1, 0, 1, 0] }, ['1', '2', '3', '4']), txt: 'toque o bumbo no 1 e no 3, contando em voz alta. é a base de tudo.', som: D((t) => { for (let i = 0; i < 4; i++) { click(t + i * 0.6, i === 0 ? 2 : 1, 0.3); if (i % 2 === 0) kick(t + i * 0.6, 1); } }) },
    { t: 'Caixa no 2 e no 4', ic: gr({ caixa: [0, 1, 0, 1], bumbo: [1, 0, 1, 0] }, ['1', '2', '3', '4']), txt: 'agora a caixa no 2 e no 4. o bumbo chama e a caixa responde: "tum, tá, tum, tá".', som: D((t) => { for (let i = 0; i < 8; i++) { click(t + i * 0.55, i % 4 === 0 ? 2 : 1, 0.3); if (i % 2 === 0) kick(t + i * 0.55, 1); else snare(t + i * 0.55, 0.9); } }) },
    { t: 'Chimbal em colcheias', ic: gr({ chimbal: [1, 1, 1, 1, 1, 1, 1, 1] }), txt: 'o chimbal toca oito vezes por compasso: "1 e 2 e 3 e 4 e". ele é o relógio da levada.', som: levada({ chimbal: [1, 1, 1, 1, 1, 1, 1, 1] }, 2, 80) },
    { t: 'A levada de rock', ic: gr(ROCK), txt: 'junte tudo: chimbal sempre, caixa no 2 e no 4, bumbo no 1 e no 3. é a levada mais famosa do rock!', som: levada(ROCK_P, 3, 80) }],
    quiz: [
      { q: 'quantos tempos tem um compasso 4/4?', ops: ['4', '2', '8'], ok: 0 },
      { q: 'na levada de rock, a caixa bate nos tempos…', ops: ['2 e 4', '1 e 3', 'só no 1'], ok: 0 },
      { q: 'o bumbo bate nos tempos…', ops: ['1 e 3', '2 e 4', 'em nenhum'], ok: 0 },
      { q: 'o chimbal na levada toca…', ops: ['em todas as colcheias', 'só no 1', 'só no 2 e 4'], ok: 0 },
      { q: 'o 1 do compasso é…', ops: ['o mais forte', 'o mais fraco', 'uma pausa'], ok: 0 }] },
  { nome: 'mãos e pés juntos', paul: 'tocar bateria é fazer cada parte do corpo cuidar de uma coisa.', cards: [
    { t: 'Mão direita: chimbal', ic: () => peca('chimbal'), txt: 'pra quem toca destro, a mão direita cuida do chimbal. treine ela sozinha, firme e sempre igual.', som: levada({ chimbal: [1, 1, 1, 1, 1, 1, 1, 1] }, 2, 70) },
    { t: 'Mão esquerda: caixa', ic: () => peca('caixa'), txt: 'a mão esquerda cuida da caixa. treine só ela: 2, 4, 2, 4, com o pulso soltinho.', som: levada({ caixa: [0, 0, 1, 0, 0, 0, 1, 0] }, 2, 70) },
    { t: 'Pé direito: bumbo', ic: () => peca('bumbo'), txt: 'o pé cuida do bumbo, no 1 e no 3. treine batendo o pé no chão enquanto conta.', som: levada({ bumbo: [1, 0, 0, 0, 1, 0, 0, 0] }, 2, 70) },
    { t: 'Duas coisas juntas', ic: gr({ chimbal: ROCK.chimbal, bumbo: ROCK.bumbo }), txt: 'junte só duas partes: chimbal com bumbo. quando estiver firme, acrescente a caixa.', som: levada({ chimbal: ROCK.chimbal, bumbo: ROCK.bumbo }, 2, 70) },
    { t: 'Tudo junto, devagar', ic: gr(ROCK), txt: 'toque tudo junto bem devagar, a 60 batidas por minuto. só acelere quando estiver limpinho.', som: levada(ROCK_P, 2, 60) }],
    quiz: [
      { q: 'qual peça a mão direita toca na levada?', ops: ['o chimbal', 'o bumbo', 'o surdo'], ok: 0 },
      { q: 'o pé toca…', ops: ['o bumbo', 'a caixa', 'o prato'], ok: 0 },
      { q: 'qual é o melhor jeito de treinar?', ops: ['devagar, depois acelerar', 'o mais rápido possível', 'sem contar'], ok: 0 },
      { q: 'se você errar, o melhor é…', ops: ['voltar pro pulso e continuar', 'parar tudo', 'tocar mais forte'], ok: 0 },
      { q: 'qual peça marca o 2 e o 4?', ops: ['a caixa', 'o bumbo', 'o chimbal'], ok: 0 }] },
  { nome: 'variando a levada', paul: 'a mesma levada pode ganhar um tempero. olha só!', cards: [
    { t: 'Um bumbo a mais', ic: gr({ chimbal: ROCK.chimbal, caixa: ROCK.caixa, bumbo: [1, 0, 0, 0, 1, 1, 0, 0] }), txt: 'um bumbo extra no "e" do 3 deixa a levada mais balançada. conte "1, 2, 3 e, 4".', som: levada({ chimbal: ROCK.chimbal, caixa: ROCK.caixa, bumbo: [1, 0, 0, 0, 1, 1, 0, 0] }, 3, 80) },
    { t: 'Quatro bumbos', ic: gr({ chimbal: ROCK.chimbal, caixa: ROCK.caixa, bumbo: [1, 0, 1, 0, 1, 0, 1, 0] }), txt: 'bumbo em todos os tempos, com a caixa no 2 e no 4. é a base de muita música pop e de dançar.', som: levada({ chimbal: ROCK.chimbal, caixa: ROCK.caixa, bumbo: [1, 0, 1, 0, 1, 0, 1, 0] }, 3, 100) },
    { t: 'Chimbal aberto', ic: () => peca('chimbal'), txt: 'no "e" do 4, solte o pedal e deixe o chimbal abrir: "tsss". ele dá um empurrãozinho pro compasso seguinte.', som: levada({ chimbal: ROCK.chimbal, caixa: ROCK.caixa, bumbo: ROCK.bumbo, aberto: [0, 0, 0, 0, 0, 0, 0, 1] }, 3, 80) },
    { t: 'Devagar e rápido', ic: () => txt('60 → 110', true), txt: 'a mesma levada muda de cara com o andamento: lenta fica pesada, rápida fica animada.', som: () => { levada(ROCK_P, 2, 60)(); setTimeout(levada(ROCK_P, 3, 110), 4300); } },
    { t: 'A virada', ic: () => fila(peca('caixa'), peca('tom'), peca('surdo')), txt: 'virada é passar pelos tambores pra avisar que a música vai mudar. uma simples: caixa, tom, tom, surdo.', som: D((t) => { snare(t, 1); tom(t + 0.25, 240, 1); tom(t + 0.5, 180, 1); tom(t + 0.75, 120, 1); cymbal(t + 1, false, 0.9); kick(t + 1, 1); }) }],
    quiz: [
      { q: 'o que é uma virada?', ops: ['passar pelos tambores pra marcar uma mudança', 'trocar de baqueta', 'parar de tocar'], ok: 0 },
      { q: 'a levada pop tem bumbo em…', ops: ['todos os tempos', 'só no 1', 'só no 4'], ok: 0 },
      { q: 'o chimbal aberto soa…', ops: ['mais longo e chiado', 'mais seco e curto', 'igual ao bumbo'], ok: 0 },
      { q: 'o andamento é…', ops: ['a velocidade da música', 'o volume da música', 'o nome da música'], ok: 0 },
      { q: 'onde cai o bumbo extra?', ops: ['no "e" do 3', 'no 2', 'no 4'], ok: 0 }] },
  { nome: 'lendo e tocando música', paul: 'agora é ler a partitura da bateria e juntar com os jogos!', cards: [
    { t: 'A pauta da bateria', ic: () => pauta({ clave: 'perc', notas: [[1, 'bumbo'], [5, 'caixa'], [9, 'chimbal', 'x']] }), txt: 'cada linha ou espaço é uma peça: embaixo o bumbo, no meio a caixa e em cima o chimbal, com X.', som: D((t) => { kick(t, 1); snare(t + 0.5, 1); hihat(t + 1, 1); }) },
    { t: 'Lendo uma levada', ic: () => pauta({ clave: 'perc', notas: [[1, 'bumbo'], [9, 'chimbal', 'x'], [5, 'caixa'], [9, 'chimbal', 'x']] }), txt: 'leia da esquerda pra direita: bumbo, chimbal, caixa, chimbal. aqui tocamos um de cada vez, bem devagar.', som: D((t) => { kick(t, 1); hihat(t + 0.5, 1); snare(t + 1, 1); hihat(t + 1.5, 1); }) },
    { t: 'Forte e fraco', ic: () => txt('f  p', true), txt: 'tocar mais forte ou mais fraco dá vida à música. ouça a mesma caixa com duas forças.', som: D((t) => { snare(t, 1); snare(t + 0.5, 1); snare(t + 1, 0.3); snare(t + 1.5, 0.3); }) },
    { t: 'Final com prato', ic: () => fila(peca('prato'), peca('bumbo')), txt: 'pra acabar a música, toque o prato de ataque junto com o bumbo no último tempo: é o "tchan!" final.', som: D((t) => { levada(ROCK_P, 1, 90)(); cymbal(t + 1.4, false, 1); kick(t + 1.4, 1); }) },
    { t: 'Treine nos jogos', ic: () => peca('baquetas'), txt: 'no Toca Aqui você lê e toca; no Rudimentix treina as duas mãos; no Detetive Note ouve e monta o ritmo.', som: levada(ROCK_P, 2, 80) }],
    quiz: [
      { q: 'na pauta da bateria, a nota de baixo é o…', ops: ['bumbo', 'chimbal', 'prato'], ok: 0 },
      { q: 'a cabeça em X é…', ops: ['um prato', 'o bumbo', 'uma pausa'], ok: 0 },
      { q: 'tocar mais forte ou mais fraco se chama…', ops: ['dinâmica', 'compasso', 'virada'], ok: 0 },
      { q: 'o jogo em que você lê e toca é o…', ops: ['Toca Aqui', 'Bingo', 'Quebra-cabeça'], ok: 0 },
      { q: 'pra terminar a música, usa-se…', ops: ['o prato de ataque com o bumbo', 'só o chimbal', 'só a caixa'], ok: 0 }] },
];

/* ============================ TECLADO ============================ */
const C = 60; const DO = [60, 64, 67]; const FA = [65, 69, 72]; const SOL = [67, 71, 74]; const LAm = [69, 72, 76];
export const FASES_TECLADO = [
  { nome: 'conhecendo o teclado', paul: 'o teclado tem teclas brancas e pretas. vamos descobrir como se achar nele!', cards: [
    { t: 'Brancas e pretas', ic: TK({ de: 60, ate: 72 }), txt: 'as teclas brancas dão as 7 notas, e as pretas ficam no meio, como notas extras.', som: seq([60, 61, 62], 0.5) },
    { t: 'Agudo e grave', ic: TK({ de: 48, ate: 72, marca: [48, 72] }), txt: 'quanto mais pra direita, mais agudo (fino) o som. quanto mais pra esquerda, mais grave (grosso).', som: seq([48, 60, 72], 0.7, 0.7) },
    { t: 'Grupos de 2 e 3', ic: TK({ de: 60, ate: 83 }), txt: 'as teclas pretas aparecem em grupos de 2 e de 3. isso ajuda a não se perder no teclado.', som: seq([61, 63, 66, 68, 70], 0.35) },
    { t: 'Achando o dó', ic: TK({ de: 60, ate: 72, marca: [60, 72], nomes: true }), txt: 'o dó é a tecla branca logo antes do grupo de 2 pretas. ache o grupo e o dó fica à esquerda.', som: seq([60, 72], 0.7, 0.7) },
    { t: 'As 7 notas', ic: TK({ de: 60, ate: 72, nomes: true }), txt: 'dó, ré, mi, fá, sol, lá, si. depois do si, volta o dó, mais agudo.', som: seq([60, 62, 64, 65, 67, 69, 71, 72], 0.4) }],
    quiz: [
      { q: 'as teclas pretas aparecem em grupos de…', ops: ['2 e 3', 'só 4', 'só 1'], ok: 0 },
      { q: 'o dó fica antes do grupo de…', ops: ['2 pretas', '3 pretas', '4 pretas'], ok: 0 },
      { q: 'indo pra direita, o som fica…', ops: ['mais agudo', 'mais grave', 'mais forte'], ok: 0 },
      { q: 'quantas notas diferentes existem?', ops: ['7', '5', '12'], ok: 0 },
      { q: 'depois do si, volta qual nota?', ops: ['dó', 'lá', 'fá'], ok: 0 }] },
  { nome: 'as notas nas teclas', paul: 'cada tecla branca tem o seu nome. vamos decorar com os grupos de pretas!', cards: [
    { t: 'Dó e ré', ic: TK({ de: 60, ate: 64, marca: [60, 62], nomes: true }), txt: 'o dó fica antes das 2 pretas. o ré fica entre elas, bem no meio do grupo.', som: seq([60, 62], 0.6, 0.7) },
    { t: 'Mi', ic: TK({ de: 60, ate: 65, marca: [64], nomes: true }), txt: 'o mi vem logo depois da 2ª preta do grupo de 2. ele é vizinho do fá, sem preta no meio.', som: seq([64], 0.6, 0.9) },
    { t: 'Fá e sol', ic: TK({ de: 65, ate: 71, marca: [65, 67], nomes: true }), txt: 'o fá fica antes do grupo de 3 pretas. o sol fica entre a 1ª e a 2ª preta desse grupo.', som: seq([65, 67], 0.6, 0.7) },
    { t: 'Lá e si', ic: TK({ de: 67, ate: 72, marca: [69, 71], nomes: true }), txt: 'o lá fica entre a 2ª e a 3ª preta do grupo de 3. o si é a última branca antes do dó.', som: seq([69, 71], 0.6, 0.7) },
    { t: 'O dó de cima', ic: TK({ de: 60, ate: 72, marca: [60, 72], nomes: true }), txt: 'do dó até o próximo dó são 8 notas. por isso essa distância se chama oitava.', som: seq([60, 72], 0.8, 0.8) }],
    quiz: [
      { q: 'o ré fica…', ops: ['entre as 2 pretas', 'antes do grupo de 3', 'depois do si'], ok: 0 },
      { q: 'o fá fica…', ops: ['antes do grupo de 3 pretas', 'antes do grupo de 2', 'no meio das 2 pretas'], ok: 0 },
      { q: 'mi e fá são vizinhas…', ops: ['sem preta no meio', 'com 2 pretas no meio', 'com 1 preta no meio'], ok: 0 },
      { q: 'o lá fica entre…', ops: ['a 2ª e a 3ª preta do grupo de 3', 'as 2 pretas do grupo de 2', 'o dó e o ré'], ok: 0 },
      { q: 'do dó ao próximo dó é uma…', ops: ['oitava', 'pausa', 'clave'], ok: 0 }] },
  { nome: 'dedos e postura', paul: 'os dedos têm números e as mãos têm um jeito certo de ficar.', cards: [
    { t: 'Numerando os dedos', ic: maos, txt: 'polegar é 1, indicador 2, médio 3, anelar 4 e mindinho 5. as duas mãos usam os mesmos números.' },
    { t: 'Posição de dó', ic: TK({ de: 60, ate: 67, nomes: true, dedos: { 60: 1, 62: 2, 64: 3, 65: 4, 67: 5 } }), txt: 'mão direita: o polegar no dó e cada dedo numa tecla seguinte: dó, ré, mi, fá, sol.', som: seq([60, 62, 64, 65, 67], 0.45) },
    { t: 'A mão esquerda', ic: TK({ de: 48, ate: 55, nomes: true, dedos: { 48: 5, 50: 4, 52: 3, 53: 2, 55: 1 } }), txt: 'na mão esquerda, o mindinho fica no dó e o polegar no sol. os números vão ao contrário.', som: seq([48, 50, 52, 53, 55], 0.45) },
    { t: 'Mão curvada', ic: maoCurva, txt: 'dedos curvados, como se segurassem uma bolinha. pulso solto e ombros relaxados. nada de dedo reto e duro.', som: seq([60, 64, 67], 0.5, 0.8) },
    { t: 'Tocando devagar', ic: TK({ de: 60, ate: 67, nomes: true, dedos: { 60: 1, 62: 2, 64: 3, 65: 4, 67: 5 } }), txt: 'toque dó, ré, mi, fá, sol e volte, uma nota por batida. primeiro certo e devagar, depois rápido.', som: () => { batidas(10, 70); seq([60, 62, 64, 65, 67, 65, 64, 62, 60], 60 / 70, 0.5)(); } }],
    quiz: [
      { q: 'qual dedo é o número 1?', ops: ['o polegar', 'o mindinho', 'o indicador'], ok: 0 },
      { q: 'na posição de dó, o polegar direito fica…', ops: ['no dó', 'no sol', 'no si'], ok: 0 },
      { q: 'a mão deve ficar…', ops: ['curvada e relaxada', 'reta e dura', 'fechada'], ok: 0 },
      { q: 'o dedo 5 é o…', ops: ['mindinho', 'polegar', 'médio'], ok: 0 },
      { q: 'qual é o melhor jeito de treinar?', ops: ['devagar e certo primeiro', 'o mais rápido possível', 'sem olhar as teclas nem contar'], ok: 0 }] },
  { nome: 'a escala de dó', paul: 'a escala é a escadinha das notas. vamos subir e descer!', cards: [
    { t: 'Escala de dó maior', ic: TK({ de: 60, ate: 72, nomes: true }), txt: 'só teclas brancas, do dó até o dó de cima: 8 notas subindo em ordem.', som: seq([60, 62, 64, 65, 67, 69, 71, 72], 0.4) },
    { t: 'Passando o polegar', ic: TK({ de: 60, ate: 72, nomes: true, dedos: { 60: 1, 62: 2, 64: 3, 65: 1, 67: 2, 69: 3, 71: 4, 72: 5 } }), txt: 'depois do dedo 3, o polegar passa por baixo da mão e cai no fá. assim a mão alcança as 8 teclas.', som: seq([60, 62, 64, 65, 67, 69, 71, 72], 0.45) },
    { t: 'Descendo a escada', ic: TK({ de: 60, ate: 72, nomes: true, dedos: { 72: 5, 71: 4, 69: 3, 67: 2, 65: 1, 64: 3, 62: 2, 60: 1 } }), txt: 'pra descer, é o caminho de volta: dedos 5, 4, 3, 2, 1 e depois o 3 passa por cima do polegar.', som: seq([72, 71, 69, 67, 65, 64, 62, 60], 0.45) },
    { t: 'Tom e meio tom', ic: TK({ de: 60, ate: 72, marca: [64, 65, 71, 72], nomes: true }), txt: 'entre mi e fá, e entre si e dó, não tem tecla preta no meio: é um meio tom. nas outras vizinhas é um tom inteiro.', som: seq([64, 65, 71, 72], 0.5, 0.6) },
    { t: 'Duas mãos', ic: TK({ de: 48, ate: 72, marca: [48, 60] }), txt: 'a mão esquerda faz a mesma escala uma oitava abaixo. no começo, uma mão de cada vez.', som: seq([48, 50, 52, 53, 55, 57, 59, 60], 0.4) }],
    quiz: [
      { q: 'a escala de dó maior usa só teclas…', ops: ['brancas', 'pretas', 'as duas misturadas'], ok: 0 },
      { q: 'quantas notas tem a escala, com o dó de cima?', ops: ['8', '5', '12'], ok: 0 },
      { q: 'depois do dedo 3, o polegar…', ops: ['passa por baixo da mão', 'fica parado', 'sai do teclado'], ok: 0 },
      { q: 'entre mi e fá o intervalo é de…', ops: ['meio tom', 'um tom inteiro', 'uma oitava'], ok: 0 },
      { q: 'descendo, a mão direita começa com o dedo…', ops: ['5', '1', '3'], ok: 0 }] },
  { nome: 'acordes', paul: 'acorde é quando várias notas soam juntas. fica lindo no teclado!', cards: [
    { t: 'O que é acorde', ic: TK({ de: 60, ate: 67, marca: DO }), txt: 'acorde é um grupo de notas tocadas ao mesmo tempo. com 3 notas já temos um acorde.', som: acordeT(DO) },
    { t: 'Dó maior', ic: TK({ de: 60, ate: 67, nomes: true, marca: DO, dedos: { 60: 1, 64: 3, 67: 5 } }), txt: 'dó, mi e sol juntos: pula uma tecla branca, toca a próxima, pula de novo. dedos 1, 3 e 5.', som: acordeT(DO) },
    { t: 'Fá maior', ic: TK({ de: 65, ate: 72, nomes: true, marca: FA, dedos: { 65: 1, 69: 3, 72: 5 } }), txt: 'fá, lá e dó. é o mesmo desenho do dó maior, só que começando no fá.', som: acordeT(FA) },
    { t: 'Sol maior', ic: TK({ de: 67, ate: 74, nomes: true, marca: SOL, dedos: { 67: 1, 71: 3, 74: 5 } }), txt: 'sol, si e ré. de novo o mesmo desenho: pula uma, toca; pula uma, toca.', som: acordeT(SOL) },
    { t: 'Lá menor', ic: TK({ de: 69, ate: 76, nomes: true, marca: LAm, dedos: { 69: 1, 72: 3, 76: 5 } }), txt: 'lá, dó e mi. este é um acorde menor: o som fica mais sério, mais triste que o maior.', som: acordeT(LAm) }],
    quiz: [
      { q: 'acorde é…', ops: ['notas tocadas juntas', 'uma nota bem longa', 'um silêncio'], ok: 0 },
      { q: 'o dó maior tem as notas…', ops: ['dó, mi e sol', 'fá, lá e dó', 'sol, si e ré'], ok: 0 },
      { q: 'o fá maior tem as notas…', ops: ['fá, lá e dó', 'dó, mi e sol', 'lá, dó e mi'], ok: 0 },
      { q: 'o acorde de som mais triste é o…', ops: ['menor', 'maior', 'nenhum'], ok: 0 },
      { q: 'o sol maior tem…', ops: ['sol, si e ré', 'sol, lá e si', 'dó, mi e sol'], ok: 0 }] },
  { nome: 'tocando música', paul: 'juntando tudo, já dá pra tocar música de verdade!', cards: [
    { t: 'Três acordes', ic: () => txt('C  F  G'), txt: 'com dó, fá e sol já dá pra tocar muita música. ouça a sequência dó, fá, sol, dó.', som: sequencia([DO, FA, SOL, DO], 1.1) },
    { t: 'Duas mãos, duas tarefas', ic: TK({ de: 48, ate: 67, marca: [48, 60, 64, 67] }), txt: 'a mão esquerda toca a nota grave do acorde e a direita toca o acorde inteiro. é o começo de acompanhar.', som: () => { const t = agora(); epiano(t, [48], 1.6, 1); epiano(t, DO, 1.6, 1); epiano(t + 1.8, [53], 1.6, 1); epiano(t + 1.8, FA, 1.6, 1); } },
    { t: 'Acorde no pulso', ic: () => fila(txt('1 2 3 4', true)), txt: 'toque o acorde uma vez por batida: 1, 2, 3, 4. segure o pulso firme e o resto vem depois.', som: () => { batidas(4, 80); const t = agora(); for (let i = 0; i < 4; i++) epiano(t + i * 0.75, DO, 0.6, 1); } },
    { t: 'Uma melodia', ic: () => pauta({ clave: 'sol', notas: [[0, 'mi'], [0, 'mi'], [1, 'fá'], [2, 'sol'], [2, 'sol'], [1, 'fá'], [0, 'mi'], [-1, 'ré']] }), txt: 'a "Ode à Alegria" começa assim: mi, mi, fá, sol, sol, fá, mi, ré. só usa 5 notas vizinhas!', som: seq([64, 64, 65, 67, 67, 65, 64, 62], 0.45, 0.5) },
    { t: 'Teclas pretas', ic: TK({ de: 60, ate: 64, marca: [61, 63], nomes: true }), txt: 'as pretas são os sustenidos (♯, sobem meio tom) e os bemóis (♭, descem meio tom). a mesma preta tem dois nomes.', som: seq([60, 61, 62, 63, 64], 0.4) }],
    quiz: [
      { q: 'três acordes que tocam muita música são…', ops: ['dó, fá e sol', 'só dó', 'só fá'], ok: 0 },
      { q: 'a mão esquerda no acompanhamento toca…', ops: ['a nota grave do acorde', 'a melodia aguda', 'nada'], ok: 0 },
      { q: 'a melodia da "Ode à Alegria" começa com…', ops: ['mi, mi, fá, sol', 'dó, ré, mi, fá', 'sol, lá, si, dó'], ok: 0 },
      { q: 'o sustenido (♯) faz a nota…', ops: ['subir meio tom', 'descer meio tom', 'ficar mais longa'], ok: 0 },
      { q: 'segurar o pulso é tocar…', ops: ['sempre no tempo certo', 'o mais rápido possível', 'sem olhar'], ok: 0 }] },
];

/* ============================ VIOLÃO ============================ */
export const FASES_VIOLAO = [
  { nome: 'conhecendo o violão', paul: 'o violão tem 6 cordas. vamos conhecer cada parte!', cards: [
    { t: 'As partes', ic: violaoDesenho, txt: 'o corpo é a caixa que faz o som, o braço é onde apertamos as cordas e a cabeça é onde afinamos.', som: solta(0) },
    { t: 'As 6 cordas', ic: () => cordasSVG(), txt: 'da mais grossa (grave) à mais fina (aguda): mi, lá, ré, sol, si, mi. dica: "mi lá ré sol si mi".', som: cordasSoltas() },
    { t: 'Grossa é grave', ic: () => cordasSVG([0, 5]), txt: 'a 6ª corda é a mais grossa e grave. a 1ª é a mais fina e aguda. as duas se chamam mi.', som: cordasSoltas([0, 5], 0.8) },
    { t: 'Trastes e casas', ic: () => braco([], { numeros: true }), txt: 'traste é a barrinha de metal no braço. o espaço entre dois trastes é uma casa, contada a partir da cabeça.' },
    { t: 'Afinação', ic: () => cordasSVG([0, 1, 2, 3, 4, 5]), txt: 'antes de tocar, afine as cordas num afinador (aparelho ou app). violão desafinado soa estranho, mesmo tocando certo.', som: cordasSoltas() }],
    quiz: [
      { q: 'quantas cordas tem o violão?', ops: ['6', '4', '8'], ok: 0 },
      { q: 'qual é a corda mais grossa?', ops: ['a 6ª, o mi grave', 'a 1ª, o mi agudo', 'a 3ª, o sol'], ok: 0 },
      { q: 'as cordas soltas, da grave pra aguda, são…', ops: ['mi, lá, ré, sol, si, mi', 'dó, ré, mi, fá, sol, lá', 'sol, si, ré, fá, lá, dó'], ok: 0 },
      { q: 'a barrinha de metal no braço se chama…', ops: ['traste', 'cavalete', 'palheta'], ok: 0 },
      { q: 'antes de tocar, a gente…', ops: ['afina o violão', 'troca a corda', 'bate no corpo'], ok: 0 }] },
  { nome: 'mãos e postura', paul: 'cada mão tem um trabalho. e o corpo precisa estar confortável!', cards: [
    { t: 'Sentado com o violão', ic: () => peca('banco'), txt: 'coluna reta, o corpo do violão apoiado na perna e o braço um pouco inclinado pra cima.' },
    { t: 'A mão esquerda', ic: () => braco([[2, 1, 1], [4, 2, 2], [3, 3, 3]]), txt: 'a mão esquerda aperta as cordas no braço. o polegar fica atrás do braço, fazendo apoio.' },
    { t: 'Dedos numerados', ic: () => braco([[1, 1, 1], [2, 2, 2], [3, 3, 3], [4, 4, 4]]), txt: 'na mão esquerda: indicador é 1, médio 2, anelar 3 e mindinho 4. o polegar não ganha número.' },
    { t: 'Apertando bem', ic: () => braco([[3, 2, 1]]), txt: 'aperte com a ponta do dedo, perto do traste. se a corda chiar, chegue mais pertinho dele.', som: notas([[3, 2]], 0.5) },
    { t: 'A mão direita', ic: () => cordasSVG(), txt: 'a mão direita toca as cordas com a palheta ou com os dedos, perto do buraco do violão, com o pulso solto.', som: acorde(EM) }],
    quiz: [
      { q: 'qual dedo é o número 1 na mão esquerda?', ops: ['o indicador', 'o polegar', 'o mindinho'], ok: 0 },
      { q: 'o polegar da mão esquerda fica…', ops: ['atrás do braço, fazendo apoio', 'em cima das cordas', 'solto no ar'], ok: 0 },
      { q: 'pra apertar a corda, usamos…', ops: ['a ponta do dedo', 'a barriga do dedo', 'a unha'], ok: 0 },
      { q: 'a mão direita toca perto…', ops: ['do buraco do violão', 'da cabeça', 'do traste 12'], ok: 0 },
      { q: 'se a corda chia, a gente…', ops: ['aperta mais perto do traste', 'aperta com mais força', 'troca de violão'], ok: 0 }] },
  { nome: 'primeiras notas', paul: 'tablatura é um jeito fácil de ler música no violão.', cards: [
    { t: 'Lendo a tablatura', ic: () => tab([[1, 0], [1, 1], [1, 3]]), txt: 'as 6 linhas são as cordas. o número diz qual casa apertar, e o 0 quer dizer corda solta.', som: notas([[1, 0], [1, 1], [1, 3]], 0.5) },
    { t: 'Mi, lá e ré soltos', ic: () => tab([[6, 0], [5, 0], [4, 0]]), txt: 'as três cordas mais grossas soltas: mi, lá e ré. é só soltar a corda e ouvir.', som: cordasSoltas([0, 1, 2], 0.5) },
    { t: 'Sol, si e mi soltos', ic: () => tab([[3, 0], [2, 0], [1, 0]]), txt: 'as três cordas mais finas soltas: sol, si e mi. juntas com as outras, formam as 6 do violão.', som: cordasSoltas([3, 4, 5], 0.5) },
    { t: 'O dó na corda lá', ic: () => tab([[5, 3]]), txt: 'na 5ª corda (lá), aperte a casa 3 com o dedo 3 e sai o dó. cada casa sobe meio tom.', som: notas([[5, 0], [5, 3]], 0.7) },
    { t: 'Mi, fá e sol', ic: () => tab([[1, 0], [1, 1], [1, 3]]), txt: 'na corda mais fina: solta, casa 1 e casa 3. saem mi, fá e sol, três notas de uma melodia.', som: notas([[1, 0], [1, 1], [1, 3], [1, 1], [1, 0]], 0.45) }],
    quiz: [
      { q: 'as linhas da tablatura são…', ops: ['as cordas', 'as casas', 'os compassos'], ok: 0 },
      { q: 'o número 0 na tablatura quer dizer…', ops: ['corda solta', 'não tocar', 'casa 10'], ok: 0 },
      { q: 'a corda lá é a…', ops: ['5ª', '1ª', '3ª'], ok: 0 },
      { q: 'na corda lá, a casa 3 dá a nota…', ops: ['dó', 'ré', 'mi'], ok: 0 },
      { q: 'cada casa que a gente sobe, o som…', ops: ['sobe meio tom', 'desce meio tom', 'fica igual'], ok: 0 }] },
  { nome: 'primeiros acordes', paul: 'um acorde é apertar várias cordas e tocar todas juntas!', cards: [
    { t: 'Mi menor (Em)', ic: DIAG('Em'), txt: 'dedo 2 na casa 2 da corda lá e dedo 3 na casa 2 da corda ré. as outras cordas ficam soltas.', som: acorde(cifra('Em')) },
    { t: 'Lá menor (Am)', ic: DIAG('Am'), txt: 'dedo 1 na casa 1 da corda si, dedo 2 na casa 2 da ré e dedo 3 na casa 2 da sol. começa na 5ª corda.', som: acorde(cifra('Am')) },
    { t: 'Mi maior (E)', ic: DIAG('E'), txt: 'igual ao Em, mas com o dedo 1 na casa 1 da corda sol. esse dedinho muda o acorde de menor pra maior.', som: acorde(cifra('E')) },
    { t: 'Lá maior (A)', ic: DIAG('A'), txt: 'dedos 1, 2 e 3 na casa 2, nas cordas ré, sol e si. toque a partir da 5ª corda.', som: acorde(cifra('A')) },
    { t: 'Ré maior (D)', ic: DIAG('D'), txt: 'só as 4 cordas mais finas: dedo 1 na casa 2 da sol, dedo 2 na casa 2 da mi agudo e dedo 3 na casa 3 da si.', som: acorde(cifra('D')) }],
    quiz: [
      { q: 'Em e Am são acordes…', ops: ['menores', 'maiores', 'de bateria'], ok: 0 },
      { q: 'no Em, as outras cordas ficam…', ops: ['soltas', 'apertadas', 'sem tocar'], ok: 0 },
      { q: 'no acorde A (lá maior), a gente não toca…', ops: ['a 6ª corda', 'a 1ª corda', 'a 3ª corda'], ok: 0 },
      { q: 'o D (ré maior) usa as cordas…', ops: ['mais finas', 'mais grossas', 'todas as 6'], ok: 0 },
      { q: 'o acorde menor soa…', ops: ['mais sério e triste', 'mais alegre', 'mais agudo'], ok: 0 }] },
  { nome: 'mais acordes e trocas', paul: 'agora é trocar de acorde sem parar a música!', cards: [
    { t: 'Dó maior (C)', ic: DIAG('C'), txt: 'dedo 1 na casa 1 da corda si, dedo 2 na casa 2 da ré e dedo 3 na casa 3 da lá. começa na 5ª corda.', som: acorde(cifra('C')) },
    { t: 'Sol maior (G)', ic: DIAG('G'), txt: 'dedo 2 na casa 3 da corda mi grave, dedo 1 na casa 2 da lá e dedo 3 na casa 3 da mi agudo.', som: acorde(cifra('G')) },
    { t: 'Trocando de acorde', ic: () => fila(DIAG('C')(), DIAG('G')()), txt: 'treine trocar devagar, sem parar o pulso: levante os dedos juntos e coloque todos juntos no próximo acorde.', som: () => { const t = agora(); [cifra('C'), cifra('G'), cifra('C'), cifra('G')].forEach((f, i) => { acordeV(f, t + i * 1.2); click(t + i * 1.2, 2, 0.3); }); } },
    { t: 'Quatro acordes', ic: () => txt('C  G  Am  Em', true), txt: 'dó, sol, lá menor e mi menor acompanham muita música. toque um acorde por compasso.', som: () => { const t = agora(); ['C', 'G', 'Am', 'Em'].forEach((c, i) => acordeV(cifra(c), t + i * 1.2)); } },
    { t: 'Contando a troca', ic: () => txt('1 2 3 4', true), txt: 'conte 1, 2, 3, 4 em cada acorde e já pense no dedo do próximo antes de acabar.', som: () => { batidas(8, 80); const t = agora(); acordeV(cifra('C'), t); acordeV(cifra('G'), t + 4 * 0.75); } }],
    quiz: [
      { q: 'o acorde C é o…', ops: ['dó maior', 'sol maior', 'lá menor'], ok: 0 },
      { q: 'ao trocar de acorde, mantenha o…', ops: ['pulso', 'volume no máximo', 'silêncio'], ok: 0 },
      { q: 'o G é o acorde de…', ops: ['sol maior', 'dó maior', 'mi menor'], ok: 0 },
      { q: 'a sequência C, G, Am, Em usa…', ops: ['quatro acordes', 'uma nota só', 'só acordes maiores'], ok: 0 },
      { q: 'pra trocar mais fácil, treine…', ops: ['devagar', 'bem rápido', 'sem os dedos'], ok: 0 }] },
  { nome: 'batida e música', paul: 'a mão direita faz a batida. é ela que dá o ritmo à música!', cards: [
    { t: 'Pra baixo, no pulso', ic: setas('↓   ↓   ↓   ↓'), txt: 'a batida mais simples: passe a mão pra baixo (↓) uma vez em cada tempo: 1, 2, 3, 4.', som: batida(EM, [[0, 1], [1, 1], [2, 1], [3, 1]], 90) },
    { t: 'Pra baixo e pra cima', ic: setas('↓↑ ↓↑ ↓↑ ↓↑'), txt: 'a mão desce no tempo e sobe no "e": conte "1 e 2 e 3 e 4 e". a mão não para nunca.', som: batida(EM, [[0, 1], [0.5, -1], [1, 1], [1.5, -1], [2, 1], [2.5, -1], [3, 1], [3.5, -1]], 90) },
    { t: 'Uma batida famosa', ic: setas('↓  ↓↑  ↑↓↑'), txt: 'a batida ↓ ↓↑ ↑↓↑ é muito usada. conte "1, 2 e, e 4 e". comece bem devagar.', som: batida(EM, [[0, 1], [1, 1], [1.5, -1], [2.5, -1], [3, 1], [3.5, -1]], 80) },
    { t: 'Cantar e tocar', ic: () => txt('♪ + ♫', true), txt: 'cante uma música que você conhece e acompanhe com um acorde por compasso. a voz e o violão andam juntos.', som: () => { const t = agora(); [cifra('C'), cifra('G'), cifra('Am'), cifra('Em')].forEach((f, i) => acordeV(f, t + i * 1.2)); } },
    { t: 'Treino todo dia', ic: () => peca('baquetas'), txt: 'dez minutinhos por dia valem mais que uma hora só no fim de semana. depois, vá pra aba Tocar e toque junto.', som: acorde(cifra('G')) }],
    quiz: [
      { q: 'a batida mais simples é…', ops: ['pra baixo em cada tempo', 'só pra cima', 'sem mexer a mão'], ok: 0 },
      { q: 'a seta ↑ quer dizer…', ops: ['passar a mão pra cima nas cordas', 'parar de tocar', 'tocar mais alto'], ok: 0 },
      { q: 'o melhor jeito de treinar é…', ops: ['um pouco todo dia', 'só uma vez por mês', 'só no fim de semana'], ok: 0 },
      { q: 'a batida famosa começa com…', ops: ['↓ ↓↑ ↑↓↑', '↑ ↑ ↑ ↑', 'só uma ↓'], ok: 0 },
      { q: 'antes de acelerar, a gente toca…', ops: ['devagar', 'sem contar', 'só uma corda'], ok: 0 }] },
];

export const INSTRUMENTOS = { bateria: FASES_BATERIA, teclado: FASES_TECLADO, violao: FASES_VIOLAO };
void C;
