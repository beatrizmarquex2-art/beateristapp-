// Cards do Dicionário Musical (baralho em PDF, produto da Bea, 16/nov/2026): um card por termo do dicionário, com desenho, explicação e dica.
// Mesmo molde dos "Cards do Robôterista Paul". Usado por marketing/cards-paul/cards.html (?deck=dicionario).
import { TERMS, CATS } from '../glossary.js';
import { notas } from './teoria-figuras.js';
import { pauta } from './teoria-temas.js';
import { grade, peca, teclado, cordasSVG, braco, tab } from './teoria-instrumentos.js';

const NSV = 'http://www.w3.org/2000/svg';
const sinal = (t, tam = 58) => { const e = document.createElementNS(NSV, 'svg'); e.setAttribute('viewBox', '0 0 80 64'); e.setAttribute('class', 'tf-sym'); e.setAttribute('aria-hidden', 'true'); e.innerHTML = `<text x="40" y="${32 + tam * 0.34}" font-size="${tam}" font-weight="400" text-anchor="middle" fill="currentColor" font-family="Anton,Noto Music,DejaVu Sans,sans-serif">${t}</text>`; return e; };
const svg = (inner) => { const e = document.createElementNS(NSV, 'svg'); e.setAttribute('viewBox', '0 0 80 64'); e.setAttribute('class', 'tf-sym'); e.setAttribute('aria-hidden', 'true'); e.innerHTML = inner; return e; };
const K = 'stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"';
const metronomo = () => svg(`<path d="M26 58L33 8h14l7 50z" ${K} stroke-width="4"/><line x1="40" y1="50" x2="54" y2="14" ${K} stroke-width="3.4"/><rect x="46" y="22" width="10" height="7" rx="2" fill="currentColor" transform="rotate(21 51 25)"/><circle cx="40" cy="52" r="3" fill="currentColor"/>`);
const maos2 = () => svg(`<path d="M12 52l16-32M68 52l-16-32" ${K} stroke-width="5"/><circle cx="28" cy="20" r="5" fill="currentColor"/><circle cx="52" cy="20" r="5" fill="currentColor"/><text x="22" y="62" font-size="13" font-weight="800" fill="currentColor" font-family="Hanken Grotesk,sans-serif">E</text><text x="52" y="62" font-size="13" font-weight="800" fill="currentColor" font-family="Hanken Grotesk,sans-serif">D</text>`);
const NOME_LINHA = { hh: 'chimbal', ho: 'chimbal aberto', sn: 'caixa', bd: 'bumbo', rd: 'prato', cr: 'prato', fl: 'tom', ft: 'surdo', rm: 'aro', cb: 'cowbell' };
/** Desenho de um termo: a grade do exemplo tocando (se tiver) ou um emblema do assunto. */
export function desenhoDoTermo(x) {
  if (x.ex && x.ex.rows) {
    const linhas = Object.entries(x.ex.rows).filter(([, v]) => Array.isArray(v) && v.some(Boolean)).slice(0, 3).map(([k, v]) => [NOME_LINHA[k] || k, v]);
    if (linhas.length) return grade(linhas, x.ex.steps || linhas[0][1].length, x.ex.steps === 12 ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] : x.ex.steps === 16 ? ['1', 'e', '&', 'a', '2', 'e', '&', 'a', '3', 'e', '&', 'a', '4', 'e', '&', 'a'] : null);
  }
  const E = {
    pauta: () => pauta({ nums: true }), 'clave-sol': () => pauta({ clave: 'sol', notas: [[2, 'sol']] }), 'clave-fa': () => pauta({ clave: 'fa', notas: [[6, 'fá']] }),
    nota: () => pauta({ clave: 'sol', notas: [[-2], [-1], [0], [1], [2], [3], [4]] }), oitava: () => pauta({ clave: 'sol', notas: [[-2, 'dó'], [5, 'dó']] }),
    'agudo-grave': () => pauta({ clave: 'sol', notas: [[-2], [8]] }), 'tom-semitom': () => teclado({ de: 60, ate: 67, marca: [64, 65], nomes: true }),
    sustenido: () => sinal('♯'), bemol: () => sinal('♭'), escala: () => teclado({ de: 60, ate: 72, nomes: true }), melodia: () => pauta({ clave: 'sol', notas: [[0], [2], [1], [3], [2], [4]] }),
    ritmo: () => notas('q ee q q'),
    harmonia: () => teclado({ de: 60, ate: 67, marca: [60, 64, 67] }), timbre: () => peca('prato'),
    teclas: () => teclado({ de: 60, ate: 72 }), 'do-central': () => teclado({ de: 60, ate: 67, marca: [60], nomes: true }), dedilhado: () => teclado({ de: 60, ate: 67, nomes: true, dedos: { 60: 1, 62: 2, 64: 3, 65: 4, 67: 5 } }),
    'passar-polegar': () => teclado({ de: 60, ate: 72, nomes: true, dedos: { 60: 1, 62: 2, 64: 3, 65: 1, 67: 2, 69: 3, 71: 4, 72: 5 } }), acorde: () => teclado({ de: 60, ate: 67, nomes: true, marca: [60, 64, 67] }),
    'maior-menor': () => teclado({ de: 60, ate: 67, marca: [60, 63, 67] }), arpejo: () => teclado({ de: 60, ate: 72, marca: [60, 64, 67, 72] }), pedal: () => teclado({ de: 60, ate: 67 }),
    cordas: () => cordasSVG(), traste: () => braco([], { numeros: true }), afinacao: () => cordasSVG([0, 1, 2, 3, 4, 5]), palheta: () => braco([[3, 2, 1]]), pestana: () => braco([[1, 1, 1], [2, 1, 1], [3, 1, 1], [4, 1, 1], [5, 1, 1], [6, 1, 1]]),
    cifra: () => sinal('C·G'), tablatura: () => tab([[1, 0], [1, 1], [1, 3]]), 'batida-violao': () => sinal('↓↑'), capotraste: () => braco([[1, 2, 0], [2, 2, 0], [3, 2, 0], [4, 2, 0], [5, 2, 0], [6, 2, 0]]),
  };
  if (E[x.id]) return E[x.id]();
  const B = {
    bpm: () => sinal('120', 46), metronomo, formula: () => sinal('4/4', 46), microtempo: () => sinal('ms', 46), pocket: () => notas('q q q q'),
    pausa: () => notas('q ee'), contagem: () => sinal('1 e & a', 26), ostinato: () => grade([['padrão', [1, 0, 1, 1, 0, 1, 0, 0]]]), polirritmia: () => grade([['3', [1, 0, 0, 1, 0, 0, 1, 0]], ['2', [1, 0, 0, 0, 1, 0, 0, 0]]]),
    rudimento: maos2, 'toque-duplo': maos2, paradiddle: maos2, flam: () => notas('e q'), rebote: () => peca('baquetas'), independencia: () => grade([['mão', [1, 1, 1, 1, 1, 1, 1, 1]], ['pé', [1, 0, 0, 0, 1, 0, 0, 0]]]),
    ghost: () => grade([['caixa', [0, 0, 1, 0, 0, 0, 1, 0]]]), dinamica: () => sinal('p  f', 44), aro: () => peca('caixa'), 'cross-stick': () => peca('caixa'),
    forma: () => pauta({ notas: [[4], [4], [4], [4]], barras: ['fim'] }), convencao: () => peca('prato'), 'contagem-entrada': () => sinal('1·2·3·4', 30),
  };
  if (B[x.id]) return B[x.id]();
  const PORCAT = { tempo: () => notas('q q q q'), figuras: () => notas('q ee ssss'), levadas: () => peca('caixa'), tecnica: () => peca('baquetas'), som: () => peca('prato'), forma: () => pauta({ notas: [[4], [4], [4], [4]], barras: ['fim'] }) };
  return (PORCAT[x.cat] || (() => peca('baquetas')))();
}
const rotulo = (id) => (CATS.find((c) => c[0] === id) || [id, id])[1];
/** Grupos do baralho: [nome, sub, cor, fases, pose]; cada fase é uma categoria do dicionário e cada carta é um termo. */
export function gruposDoDicionario() {
  const grupo = (cats) => cats.map((c) => ({ nome: rotulo(c), paul: '', cards: TERMS.filter((x) => x.cat === c).map((x) => ({ t: x.t.replace(/\s*\(.*\)\s*$/, '').trim() || x.t, en: x.en || '', ic: () => desenhoDoTermo(x), txt: x.d, dica: x.dica || '' })) })).filter((f) => f.cards.length);
  return [
    ['Bateria', 'termos de quem toca bateria', '#8e1b22', grupo(['tempo', 'figuras', 'levadas', 'tecnica', 'som', 'forma']), 'bateria'],
    ['Teoria', 'notas, claves e escalas', '#6a35c9', grupo(['teoria']), 'lendo-partitura'],
    ['Teclado', 'teclas, dedos e acordes', '#17365B', grupo(['teclado']), 'teclado'],
    ['Violão', 'cordas, acordes e batida', '#b57a12', grupo(['violao']), 'guitarra'],
  ];
}
