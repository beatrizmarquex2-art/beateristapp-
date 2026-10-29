// Temas do jogo da memória (só imagens). Cada item vira um par de cartas: `a` e `b` (se não tiver `b`, as duas cartas são iguais).
// Uma face é { svg } (desenho nosso), { img } (arquivo em assets/memoria/…) ou { photo } (foto de artista, vem do Wikimedia).
// Imagens novas entram por assets/memoria/manifest.json (sem mexer no código): { "tema": [{ "id", "name", "img", "img2"? }] }.
import { INSTRUMENTS } from './instruments.js';
import { gameIcon } from './icons.js';
import { kitMarkup, staffMarkup, figureMarkup, restMarkup, symbolMarkup } from './art.js';
import { FIGURES, PIECES } from '../kids-logic.js';
import { CARDS } from './album-data.js';

export const SIZES = [4, 8, 12];

const svg = (s) => ({ svg: s });
const FIG_NAMES = { semibreve: 'semibreve', minima: 'mínima', seminima: 'semínima', colcheia: 'colcheia', semicolcheia: 'semicolcheia', fusa: 'fusa' };
const figs = [...FIGURES.map((f) => f.id), 'fusa'];

export const THEMES = [
  { id: 'bandas', title: 'Bandas e artistas', emoji: '🎸', blurb: 'bandas, artistas e músicas',
    items: CARDS.map((c) => ({ id: c.id, name: c.name, a: { photo: c } })) },
  { id: 'instrumentos', title: 'Instrumentos musicais', emoji: '🥁', blurb: 'bateria, guitarra, teclado…',
    items: [...INSTRUMENTS.map((x) => ({ id: x.id, name: x.name, a: svg(x.art) })), { id: 'pandeiro', name: 'pandeiro', a: svg(gameIcon('pandeiro')) }, { id: 'flauta', name: 'flauta', a: svg(gameIcon('flauta')) }] },
  { id: 'figuras', title: 'Figuras rítmicas', emoji: '🎵', blurb: 'figuras e as suas pausas',
    items: [...figs.map((id) => ({ id, name: FIG_NAMES[id], a: svg(figureMarkup(id)) })), ...figs.map((id) => ({ id: `p-${id}`, name: `pausa de ${FIG_NAMES[id]}`, a: svg(restMarkup(id)) }))] },
  { id: 'partitura', title: 'Partitura e peças', emoji: '🎼', blurb: 'a peça e a casinha dela na pauta',
    items: [...PIECES.map((p) => ({ id: p.id, name: p.name, a: svg(kitMarkup(null, false, p.id)), b: svg(staffMarkup(p.id)) })),
      ...[['clave', 'clave de percussão'], ['formula', 'fórmula de compasso 4/4'], ['final', 'barra final'], ['acento', 'acento']].map(([id, name]) => ({ id, name, a: svg(symbolMarkup(id)) }))] },
];
export const themeById = Object.fromEntries(THEMES.map((t) => [t.id, t]));

/** Junta as imagens enviadas (assets/memoria/manifest.json) nos temas. Sem o arquivo, segue só com os desenhos do app. */
let loaded = null;
export function loadExtras() {
  if (loaded) return loaded;
  loaded = fetch('assets/memoria/manifest.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((m) => {
    for (const [tid, list] of Object.entries(m || {})) {
      const th = themeById[tid]; if (!th || !Array.isArray(list)) continue;
      for (const it of list) { if (!it || !it.img || th.items.some((x) => x.id === it.id)) continue; th.items.push({ id: it.id, name: it.name || it.id, a: { img: it.img }, b: it.img2 ? { img: it.img2 } : undefined }); }
    }
  });
  return loaded;
}
