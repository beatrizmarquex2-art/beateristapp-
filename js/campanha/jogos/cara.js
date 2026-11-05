// Modo Aventura do Cara a Cara Musical ("Cidade dos Personagens"): desafios de dedução sobre os instrumentos já existentes.
// O jogo real é js/jogos/cara.js (mount com opts.mission). Aqui ficam o spec, a avaliação pura e as medalhas.
//
// Só usa o que cara-data.js já representa: os 12 instrumentos e as 15 perguntas (atributos) existentes. Cada missão restringe o tabuleiro a um
// subconjunto dessas cartas (params.pool). Eficiência = o que o jogo registra de verdade: nº de perguntas feitas e nº de chutes errados (3 vidas).
// Metas provadas nos testes: para cada tabuleiro, o mínimo de perguntas que SEMPRE basta (pior caso, busca minimax) é D; a meta de 3 estrelas é
// exatamente D perguntas (e os chutes que o pior caso exige). Guitarra e baixo têm respostas idênticas em todas as 15 perguntas (limitação dos dados):
// quando os dois estão no tabuleiro, pode sobrar um chute entre os dois, por isso as metas desses tabuleiros aceitam 1 chute errado.
import * as mod from '../../jogos/cara.js';

const ID = 'cara';
const N = (n) => String(n).padStart(2, '0');
const plural = (n, a, b) => (n === 1 ? a : b);
export const MAX_Q = 15; // total de perguntas que o jogo oferece

const P = {
  p4a: ['violao', 'violino', 'flauta', 'pandeiro'],
  p4b: ['bateria', 'violao', 'trompete', 'teclado'],
  p6a: ['violao', 'teclado', 'trompete', 'bateria', 'violino', 'acordeao'],
  p6b: ['violao', 'violino', 'trompete', 'saxofone', 'flauta', 'pandeiro'],
  p8a: ['violao', 'teclado', 'trompete', 'saxofone', 'flauta', 'violino', 'bateria', 'acordeao'],
  p8b: ['violao', 'guitarra', 'teclado', 'trompete', 'saxofone', 'violino', 'bateria', 'triangulo'],
  p10: ['violao', 'guitarra', 'teclado', 'trompete', 'saxofone', 'flauta', 'violino', 'bateria', 'pandeiro', 'acordeao'],
  p11: ['violao', 'guitarra', 'teclado', 'trompete', 'saxofone', 'flauta', 'violino', 'bateria', 'pandeiro', 'triangulo', 'acordeao'],
  p12: ['violao', 'guitarra', 'baixo', 'teclado', 'trompete', 'saxofone', 'flauta', 'violino', 'bateria', 'pandeiro', 'triangulo', 'acordeao'],
};

/** Cada nível de estrela: vencer com no máximo q perguntas e w chutes errados. Em ordem crescente (cada um mais exigente que o anterior). */
const T = (q1, q2, q3, w1, w2, w3) => [{ q: q1, w: w1 }, { q: q2, w: w2 }, { q: q3, w: w3 }];
// def: [título, tag, pool, manual, tiers, dica]    (q3 = D do tabuleiro; ver testes)
const DEFS = [
  ['Primeiras pistas', '4 cartas', P.p4a, false, T(MAX_Q, 3, 2, 2, 1, 0), 'faça perguntas de sim ou não: cada resposta tira as cartas que não combinam. Sobrou uma? chute!'],
  ['Quatro instrumentos', '4 cartas', P.p4b, false, T(MAX_Q, 4, 3, 2, 1, 0), 'escolha perguntas que separem as cartas em grupos parecidos.'],
  ['Seis cartas', '6 cartas', P.p6a, false, T(MAX_Q, 4, 3, 2, 1, 0), 'compare as famílias: cordas, teclas, sopro e percussão.'],
  ['Com limite de perguntas', '6 cartas', P.p6b, false, T(6, 4, 3, 2, 1, 0), 'agora vale a meta: descubra com poucas perguntas.'],
  ['Oito cartas', '8 cartas', P.p8a, false, T(7, 5, 4, 2, 1, 0), 'cada pergunta boa elimina cerca de metade das cartas.'],
  ['Eliminando à mão', 'manual', P.p8b, true, T(7, 5, 4, 2, 1, 0), 'no modo manual você vira as cartas sozinho: confira cada resposta antes de virar.'],
  ['Dez cartas', '10 cartas', P.p10, false, T(7, 5, 4, 2, 1, 0), 'mais cartas, mais combinações: a guitarra aparece junto com o violão e o violino.'],
  ['Onze cartas', '11 cartas', P.p11, false, T(8, 6, 5, 2, 1, 0), 'quase o baralho todo, só o baixo ficou de fora.'],
  ['Os gêmeos', 'guitarra e baixo', P.p12, false, T(8, 6, 5, 1, 1, 1), 'guitarra e baixo respondem igual a TODAS as perguntas do jogo: se sobrarem os dois, é um chute entre eles (um erro é normal).'],
  ['Dedução final', 'manual · 12', P.p12, true, T(7, 6, 5, 1, 1, 1), 'as 12 cartas, tudo à mão: ache o instrumento com poucas perguntas.'],
];

const tierText = (t, first) => `${first && t.q >= MAX_Q ? 'acertar o instrumento' : `acertar com no máximo ${t.q} ${plural(t.q, 'pergunta', 'perguntas')}`}${t.w === 0 ? ' e nenhum chute errado' : t.w >= 2 ? '' : ` e no máximo ${t.w} chute errado`}`;
export const meets = (t, r) => !!r.win && r.questions <= t.q && r.wrong <= t.w;
export function starsFor(tiers, r) { let s = 0; tiers.forEach((t, i) => { if (meets(t, r)) s = i + 1; }); return s; }
const clean = (r) => ({ win: !!(r && r.win), questions: Math.max(0, Math.floor(Number(r && r.questions) || 0)), wrong: Math.max(0, Math.floor(Number(r && r.wrong) || 0)) });

function build([title, tag, pool, manual, tiers, tip], i) {
  const D = tiers[2].q;
  return {
    id: `cara-${N(i)}`, title, tag, goal: `descubra o instrumento escondido entre ${pool.length} cartas${tiers[0].q < MAX_Q ? ` com até ${tiers[0].q} perguntas` : ''}`,
    params: { pool, manual }, tiers,
    rules: [`o Paul escolheu um instrumento em segredo. Tabuleiro de ${pool.length} cartas, ${manual ? 'modo manual (você vira as cartas)' : 'modo automático'}.`, 'você tem 3 chutes: perder os 3 encerra a missão.', tip],
    stars: tiers.map((t, k) => `${'★'.repeat(k + 1)}: ${tierText(t, k === 0)}`),
    evaluate(res) {
      const r = clean(res); const stars = starsFor(tiers, r); const done = stars >= 1;
      const summary = [r.win ? `acertou com ${r.questions} ${plural(r.questions, 'pergunta', 'perguntas')} e ${r.wrong} ${plural(r.wrong, 'chute errado', 'chutes errados')}` : `acabaram os chutes (${r.questions} ${plural(r.questions, 'pergunta', 'perguntas')} feitas)`];
      if (r.win && done && stars < 3) summary.push(`pra 3 estrelas: ${tierText(tiers[2])} (com as perguntas certas, ${D} sempre bastam)`);
      if (r.win && !done) summary.push(`pra concluir: ${tierText(tiers[0])}`);
      return { done, stars, summary, label: r.win ? `${r.questions}p ${r.wrong}c` : undefined };
    },
  };
}
const missions = DEFS.map(build);
const st = (g, i) => (g.m[`cara-${N(i)}`] || {}).s || 0;
const threeRun = (g, n) => { let run = 0; for (let i = 0; i < missions.length; i++) { run = st(g, i) >= 3 ? run + 1 : 0; if (run >= n) return true; } return false; };

export const spec = {
  id: ID, title: 'Cara a Cara Musical', theme: 'cara', missions,
  medals: [
    { id: 'cara-eficiente', title: 'Dedução eficiente', desc: 'consiga 3 estrelas (mínimo de perguntas) em 3 missões', icon: '🔎', test: (g) => missions.filter((m, i) => st(g, i) >= 3).length >= 3 },
    { id: 'cara-seguidas', title: 'Três certeiras', desc: 'consiga 3 estrelas em 3 missões seguidas', icon: '🎯', test: (g) => threeRun(g, 3) },
    { id: 'cara-mesa', title: 'Mestre das cartas pequenas', desc: 'consiga 3 estrelas nas 4 primeiras missões', icon: '🃏', test: (g) => [0, 1, 2, 3].every((i) => st(g, i) >= 3) },
    { id: 'cara-manual', title: 'Mão firme', desc: 'conclua as duas missões do modo manual (5 e 9)', icon: '✋', test: (g) => st(g, 5) >= 1 && st(g, 9) >= 1 },
    { id: 'cara-gemeos', title: 'Detetive dos gêmeos', desc: 'consiga 3 estrelas na missão dos gêmeos (guitarra e baixo)', icon: '🎸', test: (g) => st(g, 8) >= 3 },
  ],
};

export function mount(body, opts) { return mod.mount(body, opts); }
export default { spec, mount };
