// Beat Lab: grade de bateria (passos × peças) e a biblioteca de ritmos prontos. Lógica pura, sem tela, testada em tests/beats.test.mjs.
// ordem de cima pra baixo, igual à pauta. as de `basic` aparecem sempre; as outras na "pauta completa" ou quando têm nota.
export const ROWS = [
  { id: 'cr', label: 'Prato' },
  { id: 'rd', label: 'Condução' },
  { id: 'hh', label: 'Chimbal', basic: true },
  { id: 'ho', label: 'Chimbal aberto', short: 'Ch. aberto' },
  { id: 'sn', label: 'Caixa', basic: true },
  { id: 'tt', label: 'Tom 1' },
  { id: 'mt', label: 'Tom 2' },
  { id: 'ft', label: 'Surdo' },
  { id: 'bd', label: 'Bumbo', basic: true },
  { id: 'hf', label: 'Chimbal (pé)', short: 'Ch. pé' },
];
/** Cores do modo colorido (tela e exportação): bumbo verde, caixa vermelha, chimbal azul… */
export const COLORS = { cr: '#d4a017', rd: '#0e9aa7', hh: '#1f6fd1', ho: '#5aa2ff', sn: '#d1182e', tt: '#ef7d10', mt: '#b85c00', ft: '#7b3fb8', bd: '#1f9d4a', hf: '#2c4a8a' };
/** Resoluções: passos por compasso de 4/4 e quantos passos cabem num tempo. */
export const GRIDS = { 8: { perBeat: 2, name: 'colcheias' }, 12: { perBeat: 3, name: 'tercinas' }, 16: { perBeat: 4, name: 'semicolcheias' } };
export const STYLES = ['Rock', 'Pop', 'Funk', 'Gospel', 'Shuffle', 'Brasil', 'Viradas'];
export const LEVELS = { 1: 'iniciante', 2: 'intermediário', 3: 'avançado' };

const on = (n, steps) => Array.from({ length: n }, (_, i) => (steps.includes(i) ? 1 : 0));
const all = (n, every = 1, from = 0) => Array.from({ length: n }, (_, i) => (i >= from && (i - from) % every === 0 ? 1 : 0));
const beat = (name, style, bpm, steps, rows, kind = 'groove') => ({ id: name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), name, style, bpm, steps, kind,
  rows: Object.fromEntries(ROWS.map((r) => [r.id, rows[r.id] || on(steps, [])])) });

/** Padrões de domínio público (grooves de referência de qualquer método). Os 22 ritmos do método Beaterista entram depois, revisados pela Bea. */
export const PRESETS = [
  beat('Rock Básico', 'Rock', 100, 8, { hh: all(8), sn: on(8, [2, 6]), bd: on(8, [0, 4]) }),
  beat('Rock 2', 'Rock', 100, 8, { hh: all(8), sn: on(8, [2, 6]), bd: on(8, [0, 4, 5]) }),
  beat('Rock com semicolcheia no bumbo', 'Rock', 90, 16, { hh: all(16, 2), sn: on(16, [4, 12]), bd: on(16, [0, 7, 8, 10]) }),
  beat('Rock Balada', 'Rock', 72, 16, { hh: all(16, 2), sn: on(16, [4, 12]), bd: on(16, [0, 6, 8]) }),
  beat('Rock Meio-tempo (pesado)', 'Rock', 140, 8, { hh: all(8), sn: on(8, [4]), bd: on(8, [0, 1]) }),
  beat('Rock Galope', 'Rock', 110, 16, { hh: all(16, 2), sn: on(16, [4, 12]), bd: on(16, [0, 2, 3, 8, 10, 11]) }),
  beat('Rock Tribal (no surdo)', 'Rock', 100, 16, { ft: all(16, 2), sn: on(16, [4, 12]), bd: on(16, [0, 8, 10]) }),
  beat('Punk (skank beat)', 'Rock', 170, 8, { hh: all(8, 2), sn: on(8, [1, 3, 5, 7]), bd: all(8, 2) }),
  beat('Pop 1', 'Pop', 95, 8, { hh: all(8), sn: on(8, [2, 6]), bd: on(8, [0, 3, 4]) }),
  beat('Pop 2', 'Pop', 105, 8, { hh: all(8), sn: on(8, [2, 6]), bd: on(8, [0, 1, 4, 5]) }),
  beat('Disco (4 no chão)', 'Pop', 118, 16, { hh: all(16, 4), ho: all(16, 4, 2), sn: on(16, [4, 12]), bd: all(16, 4) }),
  beat('Pop Balada', 'Pop', 70, 16, { hh: all(16, 2), sn: on(16, [4, 12]), bd: on(16, [0, 10]) }),
  beat('Motown (caixa nos 4)', 'Pop', 120, 8, { hh: all(8), sn: all(8, 2), bd: on(8, [0, 4]) }),
  beat('Pop Moderno', 'Pop', 100, 16, { hh: all(16), sn: on(16, [4, 12]), bd: on(16, [0, 3, 8, 11]) }),
  beat('Reggaeton (dembow)', 'Pop', 95, 16, { hh: all(16, 2), sn: on(16, [3, 6, 11, 14]), bd: all(16, 4) }),
  beat('Funk Groove', 'Funk', 100, 16, { hh: all(16, 2), sn: on(16, [4, 12]), bd: on(16, [0, 3, 6, 10]) }),
  beat('Funk semicolcheias', 'Funk', 92, 16, { hh: all(16), sn: on(16, [4, 12]), bd: on(16, [0, 2, 7, 10]) }),
  beat('Funk estilo James Brown', 'Funk', 100, 16, { hh: all(16, 2), sn: on(16, [4, 7, 9, 12, 15]), bd: on(16, [0, 2, 6, 10]) }),
  beat('Funk com ghost notes', 'Funk', 92, 16, { hh: all(16, 2), sn: on(16, [4, 7, 9, 12, 14]), bd: on(16, [0, 6, 10]) }),
  beat('Funk Linear', 'Funk', 95, 16, { hh: on(16, [1, 2, 5, 7, 8, 9, 11, 13, 14, 15]), sn: on(16, [4, 12]), bd: on(16, [0, 3, 6, 10]) }),
  beat('Funk Rock', 'Funk', 100, 16, { hh: all(16, 2), sn: on(16, [4, 12, 15]), bd: on(16, [0, 3, 8, 10, 11]) }),
  beat('Funk Carioca (base)', 'Funk', 130, 16, { hh: all(16, 2), sn: on(16, [4, 12]), bd: on(16, [0, 3, 7, 10]) }),
  beat('Louvor 4/4 (pop worship)', 'Gospel', 72, 16, { hh: all(16, 2), sn: on(16, [4, 12]), bd: on(16, [0, 6, 8]) }),
  beat('Louvor Balada 6/8', 'Gospel', 60, 12, { rd: all(12), sn: on(12, [6]), bd: on(12, [0, 5]) }),
  beat('Gospel Groove (ghost na caixa)', 'Gospel', 88, 16, { hh: all(16, 2), sn: on(16, [3, 4, 9, 12, 14]), bd: on(16, [0, 7, 10]) }),
  beat('Gospel Shuffle', 'Gospel', 105, 12, { hh: on(12, [0, 2, 3, 5, 6, 8, 9, 11]), sn: on(12, [3, 5, 9, 11]), bd: on(12, [0, 2, 6, 8]) }),
  beat('Gospel Up (semicolcheias)', 'Gospel', 120, 16, { hh: all(16), sn: on(16, [4, 12]), bd: on(16, [0, 3, 6, 8, 10]) }),
  beat('Shuffle', 'Shuffle', 120, 12, { hh: on(12, [0, 2, 3, 5, 6, 8, 9, 11]), sn: on(12, [3, 9]), bd: on(12, [0, 6]) }),
  beat('Shuffle Meio-tempo (estilo Purdie)', 'Shuffle', 80, 12, { hh: on(12, [0, 2, 3, 5, 6, 8, 9, 11]), sn: on(12, [1, 4, 6, 7, 10]), bd: on(12, [0, 8]) }),
  beat('Blues Shuffle (bumbo nos 4)', 'Shuffle', 110, 12, { hh: on(12, [0, 2, 3, 5, 6, 8, 9, 11]), sn: on(12, [3, 9]), bd: all(12, 3) }),
  beat('Jazz Swing (condução)', 'Shuffle', 140, 12, { rd: on(12, [0, 3, 5, 6, 9, 11]), hf: on(12, [3, 9]), bd: all(12, 3) }),
  beat('Tercinas cheias', 'Shuffle', 100, 12, { hh: all(12), sn: on(12, [3, 9]), bd: on(12, [0, 6]) }),
  beat('Balada 12/8', 'Shuffle', 60, 12, { hh: all(12), sn: on(12, [6]), bd: on(12, [0, 8]) }),
  beat('Baião', 'Brasil', 90, 16, { hh: all(16), bd: on(16, [0, 6, 8]), sn: on(16, [8]) }),
  beat('Samba', 'Brasil', 100, 16, { sn: on(16, [2, 5, 7, 10, 12, 15]), bd: on(16, [0, 3, 4, 7, 8, 11, 12, 15]) }),
  beat('Bossa Nova', 'Brasil', 130, 16, { rd: all(16, 2), hf: on(16, [4, 12]), sn: on(16, [0, 3, 6, 10, 13]), bd: on(16, [0, 3, 4, 7, 8, 11, 12, 15]) }),
  beat('Xote', 'Brasil', 80, 16, { hh: all(16, 2), sn: on(16, [4, 12]), bd: on(16, [0, 7, 8]) }),
  beat('Samba-reggae', 'Brasil', 100, 16, { hh: all(16, 2), sn: on(16, [0, 3, 6, 10, 12]), ft: on(16, [0, 8]), bd: on(16, [4, 12]) }),
  beat('Frevo', 'Brasil', 150, 16, { sn: all(16), bd: on(16, [0, 6, 8, 14]) }),
  beat('Maracatu', 'Brasil', 90, 16, { sn: all(16, 2), ft: on(16, [0, 3, 6, 10, 12]), bd: on(16, [0, 8]) }),
  beat('Virada Simples', 'Viradas', 90, 16, { hh: on(16, [0, 2, 4, 6]), sn: on(16, [4, 8, 9, 10, 11, 12, 13, 14, 15]), bd: on(16, [0]) }, 'virada'),
  beat('Virada Intermediária', 'Viradas', 90, 16, { hh: on(16, [0, 2, 4, 6]), sn: on(16, [4, 8, 9, 10, 11]), tt: on(16, [12, 13]), ft: on(16, [14, 15]), bd: on(16, [0]) }, 'virada'),
  beat('Virada de Colcheias (iniciante)', 'Viradas', 90, 8, { sn: on(8, [0, 1, 2, 3]), tt: on(8, [4, 5]), ft: on(8, [6, 7]), bd: on(8, [0]) }, 'virada'),
  beat('Virada Descendo nos Toms', 'Viradas', 95, 16, { cr: on(16, [0]), sn: on(16, [1, 2, 3]), tt: on(16, [4, 5, 6, 7]), mt: on(16, [8, 9, 10, 11]), ft: on(16, [12, 13, 14, 15]), bd: on(16, [0]) }, 'virada'),
  beat('Virada de Tercinas', 'Viradas', 90, 12, { sn: on(12, [0, 1, 2, 9, 10, 11]), tt: on(12, [3, 4, 5]), ft: on(12, [6, 7, 8]), bd: on(12, [0]) }, 'virada'),
  beat('Virada Mão-Mão-Pé', 'Viradas', 85, 16, { sn: on(16, [0, 1, 3, 4, 6, 7, 9, 10, 12, 13]), ft: on(16, [15]), bd: on(16, [2, 5, 8, 11, 14]) }, 'virada'),
  beat('Virada Sincopada (com espaço)', 'Viradas', 95, 16, { hh: on(16, [0, 2, 4]), sn: on(16, [6, 7]), tt: on(16, [10, 11]), ft: on(16, [14]), bd: on(16, [0, 8, 15]) }, 'virada'),
];

/** Nível de cada ritmo pronto (o que a Bea ensina primeiro = 1). */
const HARD = ['funk-estilo-james-brown', 'funk-com-ghost-notes', 'funk-linear', 'shuffle-meio-tempo-estilo-purdie', 'frevo', 'maracatu', 'gospel-groove-ghost-na-caixa', 'gospel-shuffle', 'gospel-up-semicolcheias', 'virada-mao-mao-pe', 'virada-sincopada-com-espaco', 'jazz-swing-conducao', 'samba-reggae'];
const EASY = ['rock-basico', 'rock-2', 'pop-1', 'pop-2', 'rock-balada', 'pop-balada', 'motown-caixa-nos-4', 'punk-skank-beat', 'rock-meio-tempo-pesado', 'virada-simples', 'virada-de-colcheias-iniciante', 'louvor-4-4-pop-worship', 'disco-4-no-chao', 'balada-12-8', 'tercinas-cheias'];
export const levelOf = (b) => b.level || (EASY.includes(b.id) ? 1 : HARD.includes(b.id) ? 3 : 2);

export const emptyBeat = (steps = 8) => beat('Meu ritmo', '', 100, steps, {});
export const clone = (b) => JSON.parse(JSON.stringify(b));

/** Liga/desliga uma célula sem mexer no original. */
export function toggle(b, row, i) {
  const n = clone(b); if (!n.rows[row]) n.rows[row] = Array(b.steps).fill(0); // ritmo salvo antes das peças novas
  n.rows[row][i] = n.rows[row][i] ? 0 : 1; return n;
}
export const clear = (b) => ({ ...clone(b), rows: Object.fromEntries(ROWS.map((r) => [r.id, Array(b.steps).fill(0)])) });

/** Troca a resolução mantendo as notas que caem no mesmo lugar do tempo (8 ↔ 16; tercinas recomeçam vazias). */
export function resize(b, steps) {
  if (!GRIDS[steps] || steps === b.steps) return clone(b);
  const n = { ...clone(b), steps };
  for (const r of ROWS) {
    const src = b.rows[r.id] || []; const out = Array(steps).fill(0);
    if (b.steps !== 12 && steps !== 12) src.forEach((v, i) => { const pos = i * steps / b.steps; if (v && Number.isInteger(pos)) out[pos] = 1; });
    n.rows[r.id] = out;
  }
  return n;
}

/** Duração de um passo em segundos. */
export const stepSec = (bpm, steps) => 60 / bpm / GRIDS[steps].perBeat;
/** Peças que tocam no passo i. */
export const hitsAt = (b, i) => ROWS.filter((r) => (b.rows[r.id] || [])[i % b.steps]).map((r) => r.id);
/** Rótulo de contagem embaixo da grade: 1 e 2 e… / 1 e a… / 1 e & a… */
export function countLabels(steps) {
  const per = GRIDS[steps].perBeat; const sub = per === 2 ? ['e'] : per === 3 ? ['e', 'a'] : ['e', '&', 'a'];
  return Array.from({ length: steps }, (_, i) => (i % per === 0 ? String(i / per + 1) : sub[(i % per) - 1]));
}
export const isEmpty = (b) => ROWS.every((r) => !(b.rows[r.id] || []).some(Boolean));
/** Peças usadas: as vazias somem da grade compacta (Tom e Surdo só aparecem quando a virada usa). */
export const usedRows = (b, full = false) => ROWS.filter((r) => full || r.basic || (b.rows[r.id] || []).some(Boolean));
/** Valor de uma célula (0 para peça que o ritmo ainda não tinha). */
export const cell = (b, row, i) => ((b.rows[row] || [])[i] ? 1 : 0);
