// Spec do Modo Aventura do Jogo da Memória (PURO: sem tela, testável no node). O jogo conta as tentativas (cada par de cartas virado = 1) e o tempo.
// Metas de tentativas: C (3★) = melhor que um jogador de memória perfeita faz no baralho da missão + 1; B (2★) e A (1★) são mais folgadas.
// Cada missão usa um baralho com SEMENTE (params.seed): o mesmo tema/pares/ordem sempre, então "dá pra cumprir" é verificável (tests/campanha-memoria.test.mjs).
// O desafio de tempo (params.secs) é opcional: dá o caminho alternativo pra 3★ com a meta B de tentativas; nunca é preciso pra concluir.
import { themeById } from '../../kids/memory-themes.js';

const M = (id, title, tag, theme, pairs, seed, goals, secs, blurb) => ({ id, title, tag, theme, pairs, seed, goals, secs, blurb });
// goals = [A (1★), B (2★), C (3★)] em tentativas
const G4 = [12, 8, 6]; const G8 = [22, 16, 12]; const G12 = [32, 24, 19];
const DEF = [
  M('memoria-00', 'Primeiras cartas', '4 pares', 'bandas', 4, 104, [99, 8, 6], 0, 'vire duas cartas por vez e ache os 4 pares de bandas'),
  M('memoria-01', 'Palco e estúdio', '4 pares', 'palco', 4, 201, G4, 0, 'ache os 4 pares do palco com poucas tentativas'),
  M('memoria-02', 'Quem faz a música', '4 pares · ⏱', 'profissoes', 4, 302, G4, 60, 'ache os 4 pares das profissões da música'),
  M('memoria-03', 'Partitura e peças', '8 pares', 'partitura', 8, 401, G8, 0, 'agora são 8 pares: lembre onde cada peça está'),
  M('memoria-04', 'Bandas de rock', '8 pares · ⏱', 'bandas', 8, 503, G8, 120, '8 pares de bandas e artistas'),
  M('memoria-05', 'Palco cheio', '8 pares', 'palco', 8, 604, G8, 0, '8 pares de palco e estúdio'),
  M('memoria-06', 'Instrumentos', '8 pares · ⏱', 'instrumentos', 8, 705, G8, 120, '8 pares de instrumentos musicais'),
  M('memoria-07', 'Figuras rítmicas', '12 pares', 'figuras', 12, 807, G12, 0, '12 pares de figuras, pausas e sinais'),
  M('memoria-08', 'Orquestra grande', '12 pares', 'instrumentos', 12, 900, G12, 0, '12 pares de instrumentos: o tabuleiro grande'),
  M('memoria-09', 'Tudo misturado', '8 pares · ⏱', 'misturado', 8, 1011, G8, 120, '8 pares com cartas de todos os temas'),
  M('memoria-10', 'Desafio final', '12 pares · ⏱', 'misturado', 12, 1102, G12, 180, '12 pares misturados: o desafio final'),
];
const plural = (n) => `${n} tentativa${n === 1 ? '' : 's'}`;
const secTxt = (s) => (s >= 60 ? `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ''}` : `${s} s`);

/** Nota (0..3) pelas tentativas e pelo tempo. Pura: usada pelo evaluate e pelos testes. */
export function starsFor(def, tries, ms) {
  const [A, B, C] = def.goals; if (!(tries >= def.pairs) || tries > A) return 0;
  if (tries <= C) return 3;
  if (def.secs && tries <= B && Number.isFinite(ms) && ms <= def.secs * 1000) return 3;
  return tries <= B ? 2 : 1;
}

function build(def) {
  const [A, B, C] = def.goals; const th = themeById[def.theme];
  const tutorial = A >= 99;
  return {
    id: def.id, title: def.title, tag: def.tag, goal: `${def.blurb} (tema: ${th.title.toLowerCase()}).`,
    rules: [
      `${def.pairs} pares de ${th.title.toLowerCase()}. Cada vez que você vira duas cartas conta 1 tentativa.`,
      tutorial ? 'Termine o tabuleiro: não há limite de tentativas nesta missão.' : `Termine o tabuleiro em até ${plural(A)}. O mínimo possível é ${def.pairs} (acertar todos de primeira).`,
      ...(def.secs ? [`Desafio opcional de tempo: ${secTxt(def.secs)}. Não precisa dele pra concluir.`] : []),
      'Dica: preste atenção nas cartas erradas, elas aparecem de novo!',
    ],
    stars: [
      tutorial ? 'achar todos os pares' : `achar todos os pares em até ${plural(A)}`,
      `até ${plural(B)}`,
      def.secs ? `até ${plural(C)}, ou até ${plural(B)} em ${secTxt(def.secs)} (desafio de tempo)` : `até ${plural(C)}`,
    ],
    params: { theme: def.theme, pairs: def.pairs, seed: def.seed, goalTries: C, maxTries: A, secs: def.secs || 0 },
    def,
    evaluate(r) {
      const tries = Number(r && r.tries); const ms = Number(r && r.ms);
      if (!r || !r.won || !Number.isFinite(tries) || r.pairs !== def.pairs) return { done: false, stars: 0, summary: ['a partida não terminou'] };
      const stars = starsFor(def, tries, ms); const secs = Number.isFinite(ms) ? Math.round(ms / 100) / 10 : null;
      const timeStar = def.secs && stars === 3 && tries > C;
      const summary = [`${def.pairs} pares em ${plural(tries)}${secs != null ? ` · ${secs.toString().replace('.', ',')} s` : ''}`];
      if (stars === 0) summary.push(`passou do limite de ${plural(A)}; tente de novo!`);
      else if (stars === 3) summary.push(timeStar ? `3 estrelas pelo desafio de tempo (${secTxt(def.secs)})!` : `meta de ${plural(C)} batida!`);
      else summary.push(`pra mais estrelas: ${stars === 1 ? `até ${plural(B)}` : `até ${plural(C)}${def.secs ? ` ou ${plural(B)} em ${secTxt(def.secs)}` : ''}`}`);
      return { done: stars >= 1, stars, summary, label: `${plural(tries)}` };
    },
  };
}

export const spec = {
  id: 'memoria', title: 'Jogo da Memória', theme: 'memoria',
  missions: DEF.map(build),
  medals: [
    { id: 'memoria-elefante', title: 'Memória de elefante', desc: '3 estrelas em todas as missões de 4 pares', icon: '🐘', test: (g) => ['memoria-00', 'memoria-01', 'memoria-02'].every((id) => ((g.m[id] || {}).s || 0) >= 3) },
    { id: 'memoria-doze', title: 'Tabuleiro grande', desc: 'conclua as duas missões só de 12 pares', icon: '🃏', test: (g) => ['memoria-07', 'memoria-08'].every((id) => ((g.m[id] || {}).s || 0) >= 1) },
    { id: 'memoria-mestre', title: 'Mestre da memória', desc: '3 estrelas no desafio final', icon: '🧠', test: (g) => ((g.m['memoria-10'] || {}).s || 0) >= 3 },
  ],
};
export default spec;
