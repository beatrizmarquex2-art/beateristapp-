// Jogos "de verdade" (o aluno toca no instrumento e o app ouve): regras puras, sem tela e sem áudio.
// Copia Aí (melodia que cresce), pauLta ao Vivo (ler a nota e tocar), Eco de Groove (repetir a levada) e Clique Fantasma (segurar o tempo sem o clique).
// Testes em tests/vivo-logic.test.mjs.

/* ---------- notas ---------- */
const SOLFA = ['dó', 'dó#', 'ré', 'ré#', 'mi', 'fá', 'fá#', 'sol', 'sol#', 'lá', 'lá#', 'si'];
/** Nome da nota (sem oitava): 60 → "dó". */
export const nomeNota = (midi) => SOLFA[((midi % 12) + 12) % 12];
/** Mesma nota em qualquer oitava (o violão soa uma oitava abaixo do teclado; a voz e o microfone também erram a oitava). */
export const mesmaNota = (a, b) => (((a - b) % 12) + 12) % 12 === 0;
/** Teclas brancas de dó4 (60) em diante. */
export const BRANCAS = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79];
export const ehPreta = (midi) => [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
/** Todas as teclas (brancas e pretas) entre duas notas. */
export const faixa = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

/** Estrelas no jeito da pauLta: 60% = 1, 80% = 2, 100% = 3. */
export const estrelasPct = (pct) => (pct >= 100 ? 3 : pct >= 80 ? 2 : pct >= 60 ? 1 : 0);

/* ---------- Copia Aí ---------- */
/** Níveis do sorteio: quais notas podem cair. */
export const NIVEIS_COPIA = [
  { id: 'n3', nome: '3 notas', notas: [60, 62, 64] },
  { id: 'n5', nome: '5 notas', notas: [60, 62, 64, 65, 67] },
  { id: 'n8', nome: '8 notas', notas: [60, 62, 64, 65, 67, 69, 71, 72] },
];
const N = { 'dó': 60, 'ré': 62, mi: 64, 'fá': 65, sol: 67, 'lá': 69, si: 71, 'dó2': 72 };
const M = (txt) => txt.trim().split(/\s+/).map((s) => N[s]);
/** Melodias de domínio público (tradicionais e clássicas), todas em dó, só teclas brancas. */
export const MELODIAS = [
  { id: 'brilha', nome: 'Brilha, brilha estrelinha', notas: M('dó dó sol sol lá lá sol fá fá mi mi ré ré dó') },
  { id: 'carneirinho', nome: 'Maria tinha um carneirinho', notas: M('mi ré dó ré mi mi mi ré ré ré mi sol sol') },
  { id: 'joao', nome: 'Frei João', notas: M('dó ré mi dó dó ré mi dó mi fá sol mi fá sol') },
  { id: 'alegria', nome: 'Ode à Alegria', notas: M('mi mi fá sol sol fá mi ré dó dó ré mi mi ré ré') },
  { id: 'sinos', nome: 'Bate o sino', notas: M('mi mi mi mi mi mi mi sol dó ré mi') },
];
export const MAX_SORTEIO = 10; export const VIDAS = 3;
/** Sequência sorteada: nunca 3 notas iguais seguidas. */
export function sorteio(notas, n, rnd = Math.random) {
  const out = [];
  while (out.length < n) { const x = notas[Math.floor(rnd() * notas.length)]; const k = out.length; if (k >= 2 && out[k - 1] === x && out[k - 2] === x) continue; out.push(x); }
  return out;
}
/** Tamanho do trecho em cada rodada (1, 2, 3…): o sorteio começa com 2 notas e ganha 1 por rodada; a melodia começa com 3 e ganha 2. */
export const tamanhoRodada = (tipo, rodada, total) => Math.min(total, tipo === 'melodia' ? 3 + (rodada - 1) * 2 : 2 + (rodada - 1));
/** Estrelas do Copia Aí. `feitas` = notas do maior trecho copiado inteiro; `total` = tamanho final; `erros` = vidas perdidas. */
export function estrelasCopia(tipo, feitas, total, erros) {
  if (tipo === 'melodia') return feitas >= total ? (erros === 0 ? 3 : 2) : feitas >= Math.ceil(total / 2) ? 1 : 0;
  return feitas >= 8 ? 3 : feitas >= 6 ? 2 : feitas >= 4 ? 1 : 0;
}

/**
 * Transforma a leitura contínua do microfone (uma nota ou nada a cada ~45 ms) em "tocou a nota X" uma vez por ataque.
 * A nota só vale depois de ficar `estavel` leituras iguais; pra repetir a mesma nota precisa de silêncio ou de um novo ataque (o volume sobe de novo).
 */
export function rastreador({ estavel = 3, ataque = 1.8 } = {}) {
  let cand = null; let n = 0; let ultimo = null; let armado = true; let minimo = Infinity; let sil = 0;
  return {
    push(midi, nivel = 1) {
      if (midi == null) { sil++; if (sil >= 2) { armado = true; ultimo = null; cand = null; n = 0; } return null; }
      sil = 0;
      if (midi === cand) n++; else { cand = midi; n = 1; }
      if (!armado && midi === ultimo) { minimo = Math.min(minimo, nivel); if (nivel > minimo * ataque) armado = true; else return null; }
      if (n >= estavel && (armado || midi !== ultimo)) { ultimo = midi; armado = false; minimo = nivel; return midi; }
      return null;
    },
  };
}

/* ---------- pauLta ao Vivo ---------- */
/** Níveis: notas da clave de sol que podem cair (em MIDI). */
export const NIVEIS_PAUTA = [
  { id: 'p3', nome: 'dó ré mi', notas: [60, 62, 64] },
  { id: 'p5', nome: 'dó a sol', notas: [60, 62, 64, 65, 67] },
  { id: 'p8', nome: 'dó a dó', notas: [60, 62, 64, 65, 67, 69, 71, 72] },
  { id: 'p12', nome: 'até o sol agudo', notas: [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79] },
];
export const NOTAS_RODADA = 10;
/** Rodada de leitura: `n` notas sem repetir a mesma duas vezes seguidas. */
export function rodadaPauta(notas, n = NOTAS_RODADA, rnd = Math.random) {
  const out = [];
  while (out.length < n) { const x = notas[Math.floor(rnd() * notas.length)]; if (out.length && out[out.length - 1] === x) continue; out.push(x); }
  return out;
}
/** MIDI → posição diatônica usada pelos desenhos da pauLta (oitava × 7 + letra). Só notas naturais. */
export function diatonica(midi) { const oct = Math.floor(midi / 12) - 1; const letra = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][midi % 12]; return oct * 7 + letra; }

/* ---------- Eco de Groove ---------- */
export const PECAS = { h: 'chimbal', c: 'caixa', b: 'bumbo' };
/** Cada compasso = 4 semínimas; cada tempo é um conjunto de peças juntas ('' = pausa). h = chimbal, c = caixa, b = bumbo. */
export const FASES_GROOVE = [
  { n: 1, nome: 'só o bumbo', bars: [['b', 'b', 'b', 'b'], ['b', 'b', 'b', 'b'], ['b', 'b', 'b', 'b']] },
  { n: 2, nome: 'só a caixa', bars: [['c', 'c', 'c', 'c'], ['c', 'c', 'c', 'c'], ['c', 'c', 'c', 'c']] },
  { n: 3, nome: 'só o chimbal', bars: [['h', 'h', 'h', 'h'], ['h', 'h', 'h', 'h'], ['h', 'h', 'h', 'h']] },
  { n: 4, nome: 'uma peça com pausa', bars: [['b', 'b', '', 'b'], ['c', '', 'c', 'c'], ['h', 'h', 'h', '']] },
  { n: 5, nome: 'bumbo e caixa', bars: [['b', 'c', 'b', 'c'], ['b', 'c', 'b', 'c'], ['b', 'c', 'b', 'c']] },
  { n: 6, nome: 'bumbo e caixa misturados', bars: [['b', 'b', 'c', 'b'], ['b', 'c', 'c', 'b'], ['b', 'b', 'c', 'c']] },
  { n: 7, nome: 'chimbal e bumbo juntos', bars: [['hb', 'hb', 'hb', 'hb'], ['hb', 'hb', 'hb', 'hb'], ['hb', 'h', 'hb', 'h']] },
  { n: 8, nome: 'chimbal e bumbo juntos, e caixa', bars: [['hb', 'c', 'hb', 'c'], ['hb', 'c', 'hb', 'c'], ['hb', 'hb', 'c', 'hb']] },
  { n: 9, nome: 'levada de rock', bars: [['hb', 'hc', 'hb', 'hc'], ['hb', 'hc', 'hb', 'hc'], ['hb', 'hc', 'hb', 'hc']] },
  { n: 10, nome: 'desafio com pausa', bars: [['hb', 'hc', '', 'hc'], ['hb', '', 'hb', 'hc'], ['hb', 'hc', 'hb', '']] },
];
export const TEMPOS_GROOVE = [60, 80, 100];
export const MIN_GROOVE = 60;
/** Folga de acerto (s): 30% do tempo, no máximo 180 ms. */
export const folgaGroove = (bpm) => Math.min(0.3 * (60 / bpm), 0.18);
const junta = (ts, gap = 0.06) => { const o = []; for (const t of ts.slice().sort((a, b) => a - b)) if (!o.length || t - o[o.length - 1] > gap) o.push(t); return o; };
/**
 * Na TELA: confere peça e tempo. `taps` = [{ t, p }] com t em segundos desde o 1º tempo do compasso.
 * Devolve { hits, esperado, extras, tempos: [true|false por tempo] }. Toque sobrando (peça errada ou fora de hora) conta como erro.
 */
export function julgaGroove(bar, taps, q, win) {
  const usado = new Set(); let hits = 0; let esperado = 0; const tempos = [];
  bar.forEach((s, i) => {
    let ok = true;
    for (const p of s) {
      esperado++; let best = -1; let bd = Infinity;
      taps.forEach((tp, k) => { if (usado.has(k) || tp.p !== p) return; const d = Math.abs(tp.t - i * q); if (d <= win && d < bd) { bd = d; best = k; } });
      if (best >= 0) { usado.add(best); hits++; } else ok = false;
    }
    if (!s && taps.some((tp) => Math.abs(tp.t - i * q) <= win)) ok = false; // tocou na pausa
    tempos.push(ok);
  });
  return { hits, esperado, extras: taps.length - usado.size, tempos };
}
/** No MICROFONE: só o tempo (o microfone não separa as peças). Batida num tempo com nota = certo; batida na pausa ou fora de hora = erro. */
export function julgaGrooveMic(bar, onsets, q, win) {
  const os = junta(onsets); let hits = 0; let esperado = 0; let extras = 0; const tempos = [];
  bar.forEach((s, i) => { const tem = os.some((t) => Math.abs(t - i * q) <= win); if (s) { esperado++; if (tem) hits++; } tempos.push(s ? tem : !tem); });
  for (const t of os) { const i = Math.round(t / q); const perto = i >= 0 && i < bar.length && Math.abs(t - i * q) <= win; if (!perto || !bar[i]) extras++; }
  return { hits, esperado, extras, tempos };
}
/** Junta os compassos numa nota de 0 a 100. */
export function notaGroove(res) { const h = res.reduce((s, r) => s + r.hits, 0); const t = res.reduce((s, r) => s + r.esperado + r.extras, 0); return t ? Math.round((h / t) * 100) : 0; }
/** A fase abre com 1 estrela (60%) na anterior. */
export const grooveLiberada = (est, n) => n <= 1 || (est[n - 1] || 0) >= MIN_GROOVE;

/* ---------- Clique Fantasma ---------- */
export const TEMPOS_FANTASMA = [60, 80, 100, 120];
/** Quantos tempos o clique some. */
export const NIVEIS_FANTASMA = [{ id: 'f4', nome: '1 compasso', mudo: 4 }, { id: 'f8', nome: '2 compassos', mudo: 8 }, { id: 'f16', nome: '4 compassos', mudo: 16 }];
export const JUNTO = 8; export const VOLTA = 4;
/** Folga (s): 16% do tempo, entre 70 e 120 ms. */
export const folgaFantasma = (bpm) => Math.max(0.07, Math.min(0.12, 0.16 * (60 / bpm)));
const mediana = (a) => { const s = a.slice().sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const perto = (os, alvo, raio) => { let best = null; for (const t of os) { const d = t - alvo; if (Math.abs(d) <= raio && (best == null || Math.abs(d) < Math.abs(best))) best = d; } return best; };
/**
 * `onsets` = segundos desde o 1º tempo COM clique. Os últimos 4 tempos com clique viram a referência da pessoa (desconta o atraso do microfone
 * e o jeito dela de tocar); nos tempos sem clique mede quanto cada batida saiu dessa referência.
 * Devolve { pct, media (ms; negativo = adiantou), veredito: 'cravou' | 'correu' | 'atrasou' | 'parou', pontos: [ms | null], base (ms) }.
 */
export function julgaFantasma(onsets, { q, mudo, win, junto = JUNTO }) {
  const os = junta(onsets);
  const refs = []; for (let k = junto - 4; k < junto; k++) { const d = perto(os, k * q, 0.3 * q); if (d != null) refs.push(d); }
  const base = refs.length >= 2 ? Math.max(-0.08, Math.min(0.2, mediana(refs))) : 0;
  const pontos = []; let ok = 0; let soma = 0; let tocados = 0;
  for (let k = junto; k < junto + mudo; k++) { const d = perto(os, k * q + base, 0.45 * q); if (d == null) { pontos.push(null); continue; } tocados++; soma += d; if (Math.abs(d) <= win) ok++; pontos.push(Math.round(d * 1000)); }
  const media = tocados ? Math.round((soma / tocados) * 1000) : 0; const lim = win * 1000 * 0.35;
  const veredito = tocados < mudo / 2 ? 'parou' : media < -lim ? 'correu' : media > lim ? 'atrasou' : 'cravou';
  return { pct: Math.round((ok / mudo) * 100), media, veredito, pontos, base: Math.round(base * 1000) };
}
