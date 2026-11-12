// Treinos de leitura e de escuta: células rítmicas de 1 tempo, sorteio por nível, avaliação dos toques e desenho numa linha só.
// Puro (sem tela nem áudio), testado em tests/reading.test.mjs. O desenho gera os mesmos "ops" do notation.js (toSVG).

/** Cada célula = 4 semicolcheias do tempo (1 = nota começa ali). Nível em que entra e o nome que a Bea fala na aula. */
export const CELLS = [
  { p: '1000', lv: 1, name: 'semínima' },
  { p: '0000', lv: 1, name: 'pausa de semínima' },
  { p: '1010', lv: 1, name: 'duas colcheias' },
  { p: '1111', lv: 2, name: 'quatro semicolcheias' },
  { p: '1011', lv: 2, name: 'colcheia + duas semis' },
  { p: '1110', lv: 2, name: 'duas semis + colcheia' },
  { p: '0010', lv: 2, name: 'pausa de colcheia + colcheia' },
  { p: '1001', lv: 3, name: 'colcheia pontuada + semi' },
  { p: '1100', lv: 3, name: 'semi + colcheia pontuada' },
  { p: '1101', lv: 3, name: 'semi, colcheia, semi' },
  { p: '0111', lv: 3, name: 'pausa de semi + três semis' },
];
export const LEVEL_NAMES = { 1: 'nível 1 · semínima e colcheia', 2: 'nível 2 · semicolcheias', 3: 'nível 3 · pontuadas e síncopes' };
/** Os 3 modos da leitura. Cada modo tem 12 fases (as mesmas pra todo mundo). */
export const TIERS = [{ id: 'ini', name: 'iniciante', lv: 1, about: 'semínima, pausa e colcheias' }, { id: 'int', name: 'intermediário', lv: 2, about: 'semicolcheias' }, { id: 'ava', name: 'avançado', lv: 3, about: 'pontuadas, síncopes e variações' }];
const BARS = {
  ini: [['1000', '1000', '1000', '1000'], ['1000', '1000', '1000', '0000'], ['1000', '1000', '0000', '1000'], ['1000', '1010', '1000', '1000'], ['1010', '1000', '1010', '1000'], ['1000', '1010', '1010', '1000'],
    ['1010', '1010', '1000', '0000'], ['1010', '1000', '0000', '1010'], ['1000', '0000', '1010', '1000'], ['1010', '1010', '1010', '1000'], ['1010', '0000', '1010', '1000'], ['1010', '1010', '1010', '1010']],
  int: [['1000', '1111', '1000', '1000'], ['1010', '1111', '1010', '1000'], ['1111', '1000', '1111', '1000'], ['1011', '1000', '1011', '1000'], ['1000', '0010', '1010', '1000'], ['1110', '1000', '1110', '1000'],
    ['1111', '1011', '1110', '1010'], ['1011', '1110', '1011', '1110'], ['1010', '0010', '1111', '1000'], ['1111', '1111', '1000', '1010'], ['1110', '1011', '0010', '1000'], ['1111', '1010', '1111', '1010']],
  ava: [['1001', '1000', '1001', '1000'], ['1100', '1000', '1100', '1000'], ['1101', '1010', '1101', '1000'], ['0111', '1000', '0111', '1000'], ['1001', '1100', '1101', '1000'], ['1101', '0111', '1001', '1100'],
    ['1001', '1001', '1001', '1001'], ['1100', '1100', '1100', '1100'], ['1101', '1011', '1001', '1000'], ['0111', '1101', '0111', '1000'], ['1001', '1111', '1100', '1010'], ['1111', '1101', '0111', '1001']],
};
export const PATH = TIERS.flatMap((t) => BARS[t.id].map((bar, i) => ({ tier: t.id, lv: t.lv, n: i + 1, of: BARS[t.id].length, bar })));
export const PASS_SCORE = 60; // 60% passa (1 ★); 80% = 2 ★; 100% = 3 ★ (igual à pauLta; no microfone vale mais, ver toca-estrelas.js)
export const cellsFor = (lv) => CELLS.filter((c) => c.lv <= lv);

/** Notas de uma célula: [{ pos, dur }] em semicolcheias (a última vai até o fim do tempo). */
export function cellNotes(p) {
  const on = [...p].map((c, i) => (c === '1' ? i : -1)).filter((i) => i >= 0);
  return on.map((pos, k) => ({ pos, dur: (k + 1 < on.length ? on[k + 1] : 4) - pos }));
}

/** Gerador simples e repetível (mesma semente = mesmo exercício). */
export function rng(seed = Date.now()) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

/** Um compasso de 4 tempos. Garante pelo menos uma célula "nova" do nível e não deixa o compasso vazio. */
export function genBar(lv, rnd = Math.random, beats = 4) {
  const pool = cellsFor(lv); const fresh = pool.filter((c) => c.lv === lv);
  for (;;) {
    const bar = Array.from({ length: beats }, () => pool[Math.floor(rnd() * pool.length)].p);
    if (bar[0] === '0000') continue; // começar com pausa de semínima confunde na contagem: evita
    if (lv > 1 && !bar.some((p) => fresh.some((c) => c.p === p))) continue;
    if (bar.filter((p) => p === '0000').length > 1) continue;
    return bar;
  }
}

/** Instantes (s) das notas a partir do 1º tempo, com o índice global de cada nota. */
export function onsets(bars, bpm) {
  const q = 60 / bpm; const out = [];
  bars.forEach((p, b) => cellNotes(p).forEach((n) => out.push({ t: b * q + (n.pos * q) / 4, beat: b, pos: n.pos })));
  return out;
}

/**
 * Compara os toques com as notas. Janela folgada (ver `avaliar`).
 * Cada nota: 'ok' (até ~50 ms), 'cedo'/'tarde' (dentro da janela), 'faltou'. Toque fora de qualquer nota = extra.
 */
export function evaluate(taps, expected, bpm, { mic = false } = {}) {
  const r = avaliar(taps, expected, bpm, { mic });
  // Microfone: o som demora pra chegar (ar + aparelho: 50 a 200 ms no iPhone/iPad) e isso é o MESMO atraso em todas as batidas. Procura o atraso que melhor encaixa
  // (de -80 a +200 ms) e desconta, pra quem toca certo não ser punido pelo aparelho. Só vale se ele melhora bem a nota e os toques ficam consistentes.
  if (mic && taps.length >= 2) {
    const mad = (x) => { const d = x.notes.filter((n) => n.ms != null).map((n) => Math.abs(n.ms)); return d.length ? d.reduce((a, b) => a + b, 0) / d.length : 1e9; }; // desvio médio: desempata o ajuste
    const melhor = (a, b) => (b.r.score > a.r.score || (b.r.score === a.r.score && mad(b.r) < mad(a.r)) ? b : a);
    let best = null;
    for (let sh = -80; sh <= 200; sh += 10) { const c = { sh, r: avaliar(taps.map((t) => t - sh / 1000), expected, bpm, { mic }) }; best = best ? melhor(best, c) : c; }
    if (best && best.sh !== 0 && (best.r.score >= r.score + 8 || (best.r.score >= r.score && mad(best.r) + 25 < mad(r)))) {
      for (let sh = best.sh - 8; sh <= best.sh + 8; sh += 2) best = melhor(best, { sh, r: avaliar(taps.map((t) => t - sh / 1000), expected, bpm, { mic }) }); // afina de 2 em 2 ms
      return { ...best.r, ajuste: best.sh };
    }
  }
  // Andamento rápido (>= 130 BPM): quem toca certinho mas SEMPRE atrasado/adiantado por causa do atraso do aparelho (tela, som, bluetooth) não pode ser punido.
  // Se os toques acertados têm um desvio médio constante (>= 25 ms), desconta esse atraso (até 90 ms) e avalia de novo. O resultado mostra o ajuste.
  if (bpm >= 130 && r.hits >= 3) {
    const ds = r.notes.filter((n) => n.ms != null).map((n) => n.ms).sort((a, b) => a - b); const med = ds[Math.floor(ds.length / 2)];
    const sd = Math.sqrt(ds.reduce((t, x) => t + (x - med) ** 2, 0) / ds.length);
    if (Math.abs(med) >= 25 && sd <= 35) { const shift = Math.max(-90, Math.min(90, med)); const r2 = avaliar(taps.map((t) => t - shift / 1000), expected, bpm, { mic }); if (r2.score >= r.score) return { ...r2, ajuste: shift }; }
  }
  return r;
}
function avaliar(taps, expected, bpm, { mic = false } = {}) {
  // Janela de cada nota: nos andamentos lentos ~0,11 s; nos rápidos (turbo 170 BPM) a semicolcheia dura só 88 ms, então a janela nunca cai abaixo de 0,075 s
  // (toque na tela tem ~50 a 80 ms de atraso no iPad). Cada toque vai pra nota MAIS PRÓXIMA, então janela maior não confunde as notas.
  const sub = 60 / bpm / 4; const win = mic ? Math.min(0.2, Math.max(sub * 0.8, 0.12)) : Math.max(Math.min(0.15, sub * 0.6), 0.09); // folgada de propósito (pedido da Bea)
  const okMs = mic ? 70 : Math.round(Math.min(70, Math.max(50, sub * 1000 * 0.5))); // 'no tempo': até 35 ms (lento) ou ~44 ms (turbo); microfone tem mais folga
  const used = new Set(); const res = expected.map(() => ({ st: 'faltou', ms: null }));
  let extra = 0;
  for (const t of [...taps].sort((a, b) => a - b)) {
    let best = -1, bd = Infinity;
    expected.forEach((e, i) => { const d = Math.abs(t - e.t); if (!used.has(i) && d < bd) { bd = d; best = i; } });
    if (best < 0 || bd > win) { extra++; continue; }
    used.add(best); const ms = Math.round((t - expected[best].t) * 1000);
    res[best] = { st: Math.abs(ms) <= okMs ? 'ok' : ms < 0 ? 'cedo' : 'tarde', ms };
  }
  const n = expected.length || 1;
  const pts = res.reduce((s, r) => s + (r.st === 'ok' ? 1 : r.st === 'faltou' ? 0 : 0.6), 0);
  const score = Math.max(0, Math.round((pts / n) * 100 - extra * 8));
  return { notes: res, extra, score, hits: res.filter((r) => r.st !== 'faltou').length, total: expected.length };
}

/** Ditado de montar: confere tempo a tempo (null = espaço ainda vazio). */
export const checkCells = (ans, guess) => ans.map((p, i) => guess[i] === p);

/** 3 compassos diferentes do certo (mudando 1 ou 2 tempos) pro ditado de escolha. */
export function distractors(bar, lv, rnd = Math.random, k = 3) {
  const pool = cellsFor(lv).map((c) => c.p); const seen = new Set([bar.join()]); const out = [];
  for (let guard = 0; out.length < k && guard < 500; guard++) {
    const b = bar.slice(); const changes = 1 + (rnd() < 0.4 ? 1 : 0);
    for (let c = 0; c < changes; c++) { const i = Math.floor(rnd() * b.length); const alt = pool.filter((p) => p !== b[i]); b[i] = alt[Math.floor(rnd() * alt.length)]; }
    if (b[0] === '0000' || seen.has(b.join())) continue;
    seen.add(b.join()); out.push(b);
  }
  return out;
}
export function shuffle(a, rnd = Math.random) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

const COUNT = ['', 'e', '&', 'a'];
/**
 * Desenho numa linha (percussão sem altura): hastes pra cima, barras por tempo, pausas, ponto de aumento e contagem embaixo.
 * `marks[i]` pinta a nota i (ordem de `onsets`) com uma cor; `count` mostra "1 e & a".
 */
export function layoutRhythm(bars, { width = 360, marks = [], count = true, clef = true } = {}) {
  const left = clef ? 40 : 8, right = 10, line = 46, top = 12; const ops = [];
  const beats = bars.length; const bw = (width - left - right) / beats; const sw = bw / 4;
  ops.push({ t: 'line', x1: 6, y1: line, x2: width - right, y2: line, w: 1.2 });
  if (clef) ops.push({ t: 'rect', x: 12, y: line - 10, w: 3.5, h: 20 }, { t: 'rect', x: 18, y: line - 10, w: 3.5, h: 20 }); // clave de percussão
  for (let b = 4; b < beats; b += 4) ops.push({ t: 'line', x1: left + b * bw - sw * 0.6, y1: line - 12, x2: left + b * bw - sw * 0.6, y2: line + 12, w: 1.4 });
  ops.push({ t: 'line', x1: width - right, y1: line - 12, x2: width - right, y2: line + 12, w: 2 });
  const stemTop = top + 2; let idx = 0;
  bars.forEach((p, b) => {
    const notes = cellNotes(p); const x0 = left + b * bw + sw * 0.5; const xOf = (pos) => x0 + pos * sw;
    if (count) for (let k = 0; k < 4; k++) ops.push({ t: 'text', x: xOf(k) - (k ? 3 : 4), y: line + 30, s: k ? COUNT[k] : String((b % 4) + 1), size: k ? 11 : 13, weight: k ? 400 : 700, color: k ? null : 'accent' });
    if (!notes.length) { ops.push({ t: 'rest', x: xOf(1.5), y: line }); return; }
    if (notes[0].pos > 0) ops.push({ t: notes[0].pos === 1 ? 'rest16' : 'rest8', x: xOf(0) + 2, y: line });
    const stems = notes.map((n) => {
      const x = xOf(n.pos); const c = marks[idx++] || null;
      ops.push({ t: 'head', x, y: line, kind: 'n', c });
      const sx = x + 5.5; ops.push({ t: 'line', x1: sx, y1: line - 1, x2: sx, y2: stemTop, w: 1.6, c });
      if (n.dur === 3) ops.push({ t: 'dot', x: x + 10, y: line - 2 });
      return sx;
    });
    if (notes.length === 1) {
      const n = notes[0];
      if (n.pos === 0 && n.dur === 4) return; // semínima
      ops.push({ t: 'flag', x: stems[0], y: stemTop, down: false });
      if (n.dur === 1) ops.push({ t: 'flag', x: stems[0], y: stemTop + 7, down: false });
      return;
    }
    ops.push({ t: 'beam', x1: stems[0], x2: stems[stems.length - 1], y: stemTop });
    // segunda barra: liga semis vizinhas; semi sozinha ganha um tracinho virado pro vizinho
    const y2 = stemTop + 6;
    notes.forEach((n, k) => {
      if (n.dur !== 1) return;
      const nx = notes[k + 1];
      if (nx && nx.dur === 1) ops.push({ t: 'beam', x1: stems[k], x2: stems[k + 1], y: y2 });
      else if (!(k > 0 && notes[k - 1].dur === 1)) ops.push({ t: 'beam', x1: k === notes.length - 1 ? stems[k] - 8 : stems[k], x2: k === notes.length - 1 ? stems[k] : stems[k] + 8, y: y2 });
    });
  });
  return { w: width, h: line + (count ? 40 : 20), ops };
}
