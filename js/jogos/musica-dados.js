// Músicas de fundo dos jogos (as opções que a Bea escolheu na página de audição). Puro: só dados e a regra "qual música toca em qual tela".
// Cada linha tem 16 passos: número = semitons acima da nota base, "." = pausa. Drums: 'x' = bate. A música é sintetizada no aparelho (sem arquivos).
const T = (s) => s.trim().split(/\s+/);
const D = (k, s, h) => ({ k, s, h });
/** { bpm, root (nota MIDI base), lead: [onda, volume, passos], bass: [onda, volume, oitavas em semitons, passos], dr: {k, s, h}, vh: volume do chimbal } */
export const TRACKS = {
  uno: { nome: 'funk eletrônico animado', bpm: 118, root: 57, lead: ['square', 0.10, T('0 0 . 3 . 5 . 3 0 . 7 . 5 . 3 .')], bass: ['sawtooth', 0.16, -24, T('0 . 0 . 3 . 0 . 5 . 5 . 3 . 0 .')], dr: D('x.....x..x......', '....x.......x...', 'x.x.x.x.x.x.x.x.'), vh: 1 },
  bingo: { nome: 'salão retrô anos 70', bpm: 100, root: 55, lead: ['sawtooth', 0.07, T('0 . 4 . 7 . 4 . 5 . 9 . 7 . 4 .')], bass: ['triangle', 0.30, -24, T('0 . . 0 . . 0 . 5 . . 5 . . 7 .')], dr: D('x.......x.......', '....x.......x...', '..x...x...x...x.'), vh: 0.7 },
  velha: { nome: 'suspense bem-humorado', bpm: 92, root: 52, lead: ['triangle', 0.22, T('0 . . 1 . . 0 . . 3 . . 1 . . .')], bass: ['sine', 0.34, -12, T('0 . . . . . . . 7 . . . . . . .')], dr: D('x.......x.......', '................', '..x...x...x...x.'), vh: 0.35 },
  quebra: { nome: 'caixinha de música', bpm: 88, root: 72, lead: ['sine', 0.26, T('0 4 7 12 7 4 0 . 2 5 9 14 9 5 2 .')], bass: ['sine', 0.24, -24, T('0 . . . . . . . 7 . . . . . . .')], dr: D('................', '................', '................'), vh: 0 },
  cara: { nome: 'mistério de detetive', bpm: 100, root: 52, lead: ['triangle', 0.22, T('0 . 1 . 0 . 3 . 7 . 6 . 3 . 1 .')], bass: ['sine', 0.34, -12, T('0 . . . 0 . . . 7 . . . 6 . . .')], dr: D('x.......x.......', '................', '..x...x...x...x.'), vh: 0.4 },
  memoria: { nome: 'harpa suave', bpm: 80, root: 60, lead: ['sine', 0.30, T('0 4 7 12 7 4 0 4 5 9 12 17 12 9 5 9')], bass: ['sine', 0.30, -24, T('0 . . . . . . . 5 . . . . . . .')], dr: D('................', '................', '................'), vh: 0 },
  toca: { duck: true, nome: 'groove de bateria suave', bpm: 96, root: 55, lead: ['sine', 0.18, T('0 . . . 3 . . . 5 . . . 3 . . .')], bass: ['triangle', 0.32, -24, T('0 . . 0 . . 3 . 0 . . 0 . 5 . .')], dr: D('x.....x...x.....', '....x.......x...', 'x.x.x.x.x.x.x.x.'), vh: 0.8 },
  beat: { duck: true, parar: 'rz-lock', nome: 'rock pesado', bpm: 140, root: 52, lead: ['square', 0.07, T('0 . 0 3 . 0 . 5 . 5 7 . 5 . 3 .')], bass: ['square', 0.10, -24, T('0 0 . 0 0 . 0 0 5 5 . 5 5 . 7 7')], dr: D('x.x...x.x.x...x.', '....x.......x...', 'x.x.x.x.x.x.x.x.'), vh: 0.9 },
  figuras: { duck: true, nome: 'bossa nova leve', bpm: 118, root: 57, lead: ['triangle', 0.22, T('0 . 4 . 7 . 11 . 9 . 7 . 4 . 2 .')], bass: ['sine', 0.34, -24, T('0 . . 0 . . 7 . 0 . . 0 . . 7 .')], dr: D('x..x..x..x..x...', '................', '..x.x.x...x.x.x.'), vh: 0.5 },
  paulta: { duck: true, nome: 'cordas em pizzicato', bpm: 96, root: 62, lead: ['triangle', 0.30, T('0 . 4 . 7 . 4 . 9 . 7 . 4 . 2 .')], bass: ['triangle', 0.28, -24, T('0 . . . 5 . . . 7 . . . 5 . . .')], dr: D('................', '................', '..x...x...x...x.'), vh: 0.3 },
};
/** Qual música toca em cada tela (endereço). `duck`: abaixa enquanto o jogo toca ritmo ou nota (Figuras, pauLta, Toca Aqui, Beat Hero). `parar`: classe do <body> que cala a música (Beat Hero durante a música). */
export const ROTAS = [
  [/^#\/jogos\/(cartas|un)(\/|$|\?)/, 'uno'],
  [/^#\/jogos\/bingo(\/|$|\?)/, 'bingo'],
  [/^#\/jogos\/velha(\/|$|\?)/, 'velha'],
  [/^#\/jogos\/quebra(\/|$|\?)/, 'quebra'],
  [/^#\/jogos\/cara(\/|$|\?)/, 'cara'],
  [/^#\/(jogos\/memart|kids\/memoria)(\/|$|\?)/, 'memoria'],
  [/^#\/kids\/figuras(\/|$|\?)/, 'figuras'],
  [/^#\/paulta(\/|$|\?)/, 'paulta'],
  [/^#\/jogos\/toca(\/|$|\?)/, 'toca'],
  [/^#\/ritmo(\?|$)/, 'beat'], // só o Beat Hero (o duelo em sala fica sem)
];
export const trackDe = (hash) => { const r = ROTAS.find(([re]) => re.test(String(hash || ''))); return r ? r[1] : ''; };
