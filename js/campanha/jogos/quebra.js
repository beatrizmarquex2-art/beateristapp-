// Modo Aventura do Quebra-cabeça Musical. Só usa o que o jogo já tem: grades de 6, 12 e 24 peças e a imagem existente (assets/jogos/palco.webp).
// Conclusão = TODAS as peças encaixadas (o motor do jogo só termina assim). Jogadas = encaixes certos (= nº de peças) + tentativas erradas; mínimo teórico = nº de peças.
// Estrelas: ★1 montar tudo · ★2 com poucas tentativas erradas · ★3 sem dicas, com no máximo `perfect` erros e, se a missão DECLARAR um tempo (`timeMs`), dentro dele.
// O tempo é só bônus opcional da ★3: nunca é preciso cumpri-lo para concluir nem para destravar a próxima missão (só ★1 destrava).
import { mount as mountGame, IMAGES } from '../../jogos/quebra.js';
import { fmtTime } from '../../jogos/quebra-logic.js';

const ORDEM = ['palco', 'guitarra', 'baixo', 'teclado', 'sax', 'praca', 'terraco']; // a imagem gira de missão em missão (7 imagens no jogo)
const imgDe = (i) => { const id = ORDEM[i % ORDEM.length]; return IMAGES.some((x) => x.id === id) ? id : IMAGES[0].id; };
// [título, tag, peças, maxErr (★2), perfect (★3), timeMs (bônus ★3, opcional)]
const PLAN = [
  ['Aquecimento', '6 peças', 6, 3, 0, null],
  ['Primeiro ensaio', '6 peças', 6, 2, 0, 60000],
  ['Passagem de som', '6 · rápido', 6, 1, 0, 45000],
  ['Montando o palco', '12 peças', 12, 4, 1, 150000],
  ['Luz e cortina', '12 peças', 12, 3, 1, 120000],
  ['Banda completa', '12 · firme', 12, 2, 0, 100000],
  ['Show de 12', '12 · rápido', 12, 2, 0, 85000],
  ['Palco grande', '24 peças', 24, 8, 2, 300000],
  ['Turnê longa', '24 peças', 24, 6, 2, 250000],
  ['Olho de artista', '24 · firme', 24, 4, 1, 210000],
  ['Grande final', '24 · rápido', 24, 3, 0, 190000],
];
const when = (t) => (t ? ` Bônus opcional: terminar em até ${fmtTime(t)}.` : '');
const mk = ([title, tag, diff, maxErr, perfect, timeMs], i) => ({
  id: `quebra-${String(i).padStart(2, '0')}`, title, tag,
  goal: `monte o quebra-cabeça de ${diff} peças`,
  rules: [
    'toque numa peça da bandeja e depois no lugar dela no quadro (no computador, pode arrastar).',
    i === 0 ? 'errou? a peça volta pra bandeja. “dica” mostra o lugar; “ver imagem” mostra a figura pronta.' : 'só vale concluir com todas as peças encaixadas; tentar uma peça errada conta como tentativa errada.',
    timeMs ? `o tempo é um desafio opcional: passar dele não impede de concluir (${fmtTime(timeMs)}).` : 'nesta missão não há tempo: monte com calma.',
  ],
  stars: ['montar todas as peças', `${maxErr === 0 ? 'nenhuma' : `no máximo ${maxErr}`} tentativa${maxErr === 1 ? '' : 's'} errada${maxErr === 1 ? '' : 's'}`,
    `sem dicas, ${perfect === 0 ? 'sem nenhuma tentativa errada' : `com no máximo ${perfect} tentativa${perfect === 1 ? '' : 's'} errada${perfect === 1 ? '' : 's'}`}${timeMs ? ` e em até ${fmtTime(timeMs)} (bônus de tempo, opcional)` : ''}`],
  params: { diff, img: imgDe(i), maxErr, perfect, timeMs },
  evaluate(result, self) {
    const p = (self && self.params) || { diff, maxErr, perfect, timeMs };
    if (!result || result.won !== true || result.diff !== p.diff) return { done: false, stars: 0, summary: ['faltou encaixar todas as peças.'] };
    const errors = Math.max(0, result.errors | 0); const hints = Math.max(0, result.hints | 0); const el = Math.max(0, result.elapsed | 0); const moves = p.diff + errors;
    const e2 = errors <= p.maxErr; const inTime = p.timeMs == null || el <= p.timeMs; const e3 = hints === 0 && errors <= p.perfect && inTime;
    const stars = 1 + (e2 ? 1 : 0) + (e2 && e3 ? 1 : 0);
    const summary = [`${p.diff} de ${p.diff} peças encaixadas`, `${moves} jogadas (o mínimo possível é ${p.diff})`, `${errors} tentativa${errors === 1 ? '' : 's'} errada${errors === 1 ? '' : 's'} · ${hints} dica${hints === 1 ? '' : 's'}`, `tempo: ${fmtTime(el)}`];
    if (p.timeMs != null) summary.push(inTime ? `bônus de tempo ${hints === 0 && errors <= p.perfect && e2 ? 'conquistado' : 'dentro do limite, mas faltou a precisão da ★3'} (limite ${fmtTime(p.timeMs)})` : `bônus de tempo não alcançado (limite ${fmtTime(p.timeMs)}); a missão está concluída do mesmo jeito`);
    return { done: true, stars, summary, label: `${fmtTime(el)} · ${moves} jogadas` };
  },
});
const missions = PLAN.map(mk);
const s3 = (g, ids) => ids.every((id) => ((g.m[id] || {}).s || 0) >= 3);
const ids = (pred) => missions.filter((m) => pred(m.params)).map((m) => m.id);

export const spec = {
  id: 'quebra', title: 'Quebra-cabeça Musical', theme: 'quebra', missions,
  medals: [
    { id: 'quebra-mao-firme', title: 'Mão firme', desc: '3 estrelas nas missões de 6 peças', icon: '🧩', test: (g) => s3(g, ids((p) => p.diff === 6)) },
    { id: 'quebra-relogio', title: 'Contra o relógio', desc: 'bônus de tempo em 3 missões (3 estrelas nas que têm tempo)', icon: '⏱️', test: (g) => ids((p) => p.timeMs != null).filter((id) => ((g.m[id] || {}).s || 0) >= 3).length >= 3 },
    { id: 'quebra-gigante', title: 'Palco gigante', desc: 'conclua todas as missões de 24 peças', icon: '🖼️', test: (g) => ids((p) => p.diff === 24).every((id) => ((g.m[id] || {}).s || 0) >= 1) },
  ],
};
export function mount(body, opts) { return mountGame(body, opts); }
export default { spec, mount };
