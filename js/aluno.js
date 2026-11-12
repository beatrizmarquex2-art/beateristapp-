// Área do aluno (aluno.html): sem login. O aluno escolhe um nome, joga os Jogos de ritmo e o Kids e aparece no ranking que todos veem.
// Tudo que ele faz fica só no aparelho dele (armazenamento separado do app da Bea); só o nome e as pontuações vão pro ranking.
import './polyfills.js'; // iPhones antigos (sem crypto.randomUUID, .at etc.): tem que ser o PRIMEIRO import
import { h, icon, uid } from './util.js';
import { soundButton } from './sound-btn.js';
import * as store from './store.js';
import * as P from './kids/progress.js';
import * as RK from './ranking.js';
import * as ESTRELAS from './figurinhas/estrelas.js';
import * as CODE from './codigo.js';
import * as AC from './acesso.js';
import * as dicas from './views/dicas.js';
import * as DA from './dicas-aluno.js';
import * as dicionario from './views/dicionario.js';
import { GRATIS } from './amostra.js';
import { TERMS } from './glossary.js';
import * as META from './estudos-meta.js';
import * as teoriaBasica from './kids/teoria.js';
import { acordesView, ritmosView } from './views/estudos-som.js';
import { ganhou as ganhouEstrela } from './jogos/estrelas-jogo.js';
/** Meta do dia dos Estudos: cada meta nova vale 1 ★ e fechar as 3 do dia vale +3 ★ (limite de 30 ★ por dia no jogo "estudos"; só com código). */
/** Rodapé do Perfil: mostra a versão do app e tem o botão "atualizar agora" (apaga a cópia guardada e baixa de novo; o código do aluno e o progresso ficam). */
function versaoApp() {
  const v = h('b', {}, '…'); const msg = h('p', { class: 'muted', role: 'status' });
  try { caches.keys().then((ks) => { const k = ks.filter((x) => /^beaterista-v\d+/.test(x)).sort().pop(); v.textContent = k ? k.replace('beaterista-', '') : 'sem cópia'; }); } catch { v.textContent = '?'; }
  const atualizar = async () => {
    msg.textContent = 'atualizando…';
    try { const regs = (await navigator.serviceWorker.getRegistrations()) || []; await Promise.all(regs.map((r) => r.unregister())); } catch { /* sem service worker */ }
    try { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); } catch { /* sem cache */ }
    location.reload();
  };
  return h('section', { class: 'card pad al-versao' }, h('p', {}, 'versão do app: ', v), h('button', { class: 'btn small', type: 'button', onclick: atualizar }, '🔄 atualizar agora'), msg);
}
function marcarEstudo(id) {
  const antes = META.ler().feitas.length; const s = META.marcar(id);
  if (s.feitas.length > antes) ganhouEstrela('estudos', 1 + (META.cumprida(s) ? 3 : 0));
  return s;
}
import * as SALVAR from './salvar-codigo.js';
import { DICAS_MUSICAIS, dicaDeHoje } from './estudos-dicas.js';
import { CURIOSIDADES, curiosidadeDeHoje } from './curiosidades.js';
import { AULAS, montarAula } from './kids/aulas-paul.js';
const TERMS_QTD = TERMS.length;
import { previa, previaDaRota, tituloDaPrevia } from './previas.js';
import { tipList } from './tipbox.js';
import * as kids from './views/kids.js';
import * as paulta from './paulta/view.js';
import * as PL from './paulta/save.js';
import * as ritmo from './views/jogos-ritmo.js';
import * as toque from './views/toque.js';
import * as piano from './views/piano.js';
import * as violao from './views/violao.js';
import * as xilofone from './views/xilofone.js';
import * as roleta from './views/roleta.js';
import './ipad-fit.js';
import * as jogos from './views/jogos.js';
import * as album from './views/album-aluno.js';
import { pending as FRpend } from './figurinhas/rewards.js'; // quantos giros/pacotes esperando (bolinha vermelha na aba roleta)
import * as perfil from './views/perfil.js';
import { LOJA_ABERTA } from './loja-config.js';
import { banner, closeSheets, confirmSheet, sheet, toast } from './ui.js';
import * as CONTAS from './contas.js';
import * as ALBUMACESSO from './figurinhas/acesso.js';
import { silence } from './audio.js';
import { startScroller } from './scroller.js';
import { startPaul } from './paul-talk.js';
import { arteDoPaul } from './paul-dicas.js';

const app = document.getElementById('app');
const NAME_KEY = 'beaterista-aluno-nome';
const NAV = [['#/jogos', 'bulb', 'Jogos'], ['#/estudos', 'study', 'Estudos'], ['#/tocar', 'nota', 'Tocar'], ['#/album', 'gallery', 'Álbum'], ['#/lojinha', 'bag', 'Lojinha']]; // lâmpada, livro, nota musical, galeria e sacola (o Perfil mora junto do Álbum)
const TAB_OF = { perfil: 'album', toque: 'tocar', piano: 'tocar', violao: 'tocar', xilofone: 'tocar', roleta: 'tocar', kids: 'jogos', ritmo: 'jogos', dicionario: 'estudos', paulta: 'jogos', dicas: 'estudos', erros: 'estudos' };
/** Aba que acende pra tela atual: a aulinha do Paul e o relatório "Jogos Ensinam" moram em Estudos. */
const tabOf = (r) => ((r.name === 'kids' && r.parts[0] === 'figuras' && r.parts[1] === 'aula') || (r.name === 'jogos' && r.parts[0] === 'relatorio') ? 'estudos' : (TAB_OF[r.name] || r.name)); // telas que acendem outra aba (todos os jogos moram na aba Jogos)
let cleanup = null;
document.documentElement.classList.add('aluno-on');

const ID_KEY = 'beaterista-aluno-id';
const visitorId = () => { try { let v = localStorage.getItem(ID_KEY); if (!v) { v = uid(); localStorage.setItem(ID_KEY, v); } return v; } catch { return uid(); } };
/** Conta 1 visita por sessão; atualiza o nome quando ele muda. */
function logVisit(name) {
  let novo = true; try { novo = !sessionStorage.getItem('bt-aluno-visita'); sessionStorage.setItem('bt-aluno-visita', '1'); } catch { /* ok */ }
  RK.visit(visitorId(), name, novo, getOrigem());
}
const ORIGEM_KEY = 'beaterista-aluno-origem';
const ORIGENS = [['aluno beaterista', 'aluno Beaterista'], ['aluno on-line', 'aluno on-line'], ['tik tok live', 'TikTok live'], ['youtube/instagram', 'YouTube/Instagram'], ['outro', 'outro'], ['codigo', 'CÓDIGO DE ACESSO']];
const getOrigem = () => { try { return localStorage.getItem(ORIGEM_KEY) || ''; } catch { return window.__alunoOrigem || ''; } };
const LINKS = [['Instagram', 'https://www.instagram.com/beaterista_/'], ['TikTok', 'https://www.tiktok.com/@beaterista'], ['YouTube', 'https://www.youtube.com/@beateristadrummer']];
const SVG = {
  Instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/>',
  TikTok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.4 2.6 2 4.3 5 4.5"/>',
  YouTube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.2v5.6l5-2.8z" fill="currentColor" stroke="none"/>',
};
/** Redes da Bea (ícones clicáveis) e marcas parceiras, pro rodapé. */
const brandEl = (cls = '') => h('div', { class: `al-brand ${cls}`.trim() },
  h('img', { class: 'login-logo', src: 'assets/logo-512.png', alt: 'Escola de Música Beaterista', width: 76, height: 76 }),
  h('h1', { class: 'login-title login-wordmark' }, h('img', { src: 'assets/logo-nome.png', alt: 'Beaterista, escola de música', width: 176, height: 59 })));
function socialRow(cls = '') {
  const svg = (n) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', '28'); s.setAttribute('height', '28'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = SVG[n]; return s; };
  return h('div', { class: `al-social ${cls}`.trim() }, ...LINKS.map(([n, href]) => h('a', { class: 'al-soc', href, target: '_blank', rel: 'noopener noreferrer', 'aria-label': n }, svg(n))));
}
function footerBlock() {
  return h('div', { class: 'al-foot' },
    h('aside', { class: 'partners', 'aria-label': 'Parceiros da Bea' },
      h('img', { class: 'partners-img', src: 'assets/parceiros-preto.png', alt: 'Pad Gorilla, Spark Cajons e Nagano Drums', width: 988, height: 237, decoding: 'async' }),
      h('span', { class: 'partners-label' }, 'parceiros da Bea')));
}
/** Poses do Paul: a cada vez que o app abre, sorteia uma (sem repetir a anterior). */
const POSES = [['paz', 'fazendo sinal de paz'], ['apontando', 'apontando'], ['bateria', 'tocando bateria'], ['skate', 'andando de skate'], ['violao', 'indo tocar violão'], ['selfie', 'tirando selfie']];
function pickPose() {
  let last = -1; try { last = Number(sessionStorage.getItem('bt-aluno-pose') ?? localStorage.getItem('beaterista-aluno-pose') ?? -1); } catch { /* ok */ }
  let i = Math.floor(Math.random() * POSES.length); if (POSES.length > 1 && i === last) i = (i + 1 + Math.floor(Math.random() * (POSES.length - 1))) % POSES.length;
  try { localStorage.setItem('beaterista-aluno-pose', String(i)); } catch { /* ok */ }
  return POSES[i];
}
const getName = () => { try { return localStorage.getItem(NAME_KEY) || window.__alunoNome || ''; } catch { return window.__alunoNome || ''; } };
const cleanName = (v) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, 20);
const route = () => { const [, a, ...rest] = (location.hash || '#/jogos').split('/'); return { name: a || 'jogos', parts: rest.filter(Boolean).map(decodeURIComponent) }; };

/** O Kids guarda o progresso por "jogador": cria/seleciona um com o nome do aluno. */
async function ensureKidsPlayer(name) {
  const mine = P.profiles().find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (mine) { if (P.active() && P.active().id !== mine.id) await P.setActive(mine.id); return; }
  await P.addProfile(name, 'b');
}

/** Manda as estrelas dos jogos e o XP dos jogos pro ranking (só sobe se for maior que o anterior). */
let sendT = 0;
function sendScores() {
  clearTimeout(sendT);
  sendT = setTimeout(() => {
    const name = getName(); if (!name) return;
    const me = P.profiles().find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (me) RK.add('kids|estrelas', name, ESTRELAS.estrelasTotais(me.id)); // Kids + ritmo + aventura (tudo que vale roleta)
    const xp = store.get('setting-xp'); if (xp && xp.data.total) RK.add('xp', name, xp.data.total);
  }, 3000);
}

function rankingView(view) {
  const me = getName().toLowerCase();
  const box = (title, sub, board, unit) => {
    const list = h('ol', { class: 'al-rank' }, h('li', { class: 'muted' }, 'carregando…'));
    RK.top(board, { fresh: true }).then((rows) => {
      list.replaceChildren(...(rows.length ? rows.map((r, i) => h('li', { class: r.name.toLowerCase() === me ? 'me' : '' }, h('span', { class: 'al-pos' }, `${i + 1}º`), h('span', { class: 'al-nm' }, r.name), h('b', {}, `${Number(r.score).toLocaleString('pt-BR')} ${unit}`)))
        : [h('li', { class: 'muted' }, 'ninguém ainda. seja o primeiro!')]));
    });
    return h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, title), h('p', { class: 'muted' }, sub), list);
  };
  view.append(banner('Ranking', 'os melhores da escola'),
    h('div', { class: 'pad-x', style: 'display:grid;gap:12px' },
      box('estrelas nos jogos', 'quem juntou mais estrelas nas fases', 'kids|estrelas', '★'),
      box('XP dos jogos', 'quem mais jogou e treinou o ritmo', 'xp', 'XP'),
      socialRow(),
      footerBlock(),
      h('p', { class: 'lib-note' }, 'o ranking de cada música aparece no fim do jogo de ritmo. só vale a sua melhor pontuação.')));
}

/** Tela de uma parte que só vale com código: gerar o código, contar pra professora e liberar sozinho. */
function lockView(view, what, pv) {
  let timer = 0; let gone = false;
  const msg = h('p', { class: 'al-lock-msg', role: 'status', 'aria-live': 'polite' });
  const inp = h('input', { class: 'field al-cod', type: 'text', maxlength: 14, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'CÓDIGO DE ACESSO', 'aria-label': 'Código de acesso' });
  const done = () => { AC.definir(true); go(); };
  const check = async (quiet) => {
    if (!CODE.pendente()) return;
    if (!quiet) msg.textContent = 'conferindo…';
    try { if (await CODE.conferirPedido()) return done(); if (!quiet) msg.textContent = 'ainda não liberou. fala o código pra professora Bea.'; } catch { if (!quiet) msg.textContent = 'sem internet agora. tente de novo.'; }
  };
  const enter = async () => {
    msg.textContent = 'conferindo…';
    try { if (await CODE.entrar(inp.value)) return done(); msg.textContent = 'não achei esse código. confira com a sua professora.'; } catch { msg.textContent = 'sem internet agora. tente de novo.'; }
  };
  const box = h('section', { class: 'card pad al-lock' });
  const draw = () => {
    const pend = CODE.pendente();
    box.replaceChildren(h('div', { class: 'al-lock-i', 'aria-hidden': 'true' }, '🔒'), h('h2', { class: 'hand' }, `${what} é pra alunos da Beaterista`),
      h('p', { class: 'muted' }, 'sem código você joga o modo livre dos jogos e usa a aba Tocar.'),
      ...(pend ? [h('p', { class: 'al-lock-l' }, 'seu código'), h('div', { class: 'al-lock-code', role: 'status', 'aria-label': `seu código ${pend.split('').join(' ')}` }, pend), h('p', { class: 'al-lock-t' }, 'informe a professora Bea'), h('p', { class: 'muted' }, 'quando ela cadastrar o seu código, isto libera sozinho.'), h('button', { class: 'btn', type: 'button', onclick: () => check(false) }, 'já liberou? conferir')]
        : [h('a', { class: 'btn primary wide', href: '#/lojinha' }, 'gerar meu código')]),
      msg, h('details', { class: 'al-lock-have' }, h('summary', {}, 'já tenho um código'), h('div', { class: 'al-lock-row' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: enter }, 'liberar'))));
  };
  const start = () => { clearInterval(timer); if (CODE.pendente()) timer = setInterval(() => { if (!gone && !document.hidden) check(true); }, 8000); };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') enter(); });
  draw(); start();
  view.append(banner(pv ? tituloDaPrevia(pv) : 'Só pra alunos', pv ? 'dá uma olhada antes de jogar' : 'libere com o seu código de acesso'), pv ? previa(pv) : null, h('div', { class: 'pad-x' }, box));
  return () => { gone = true; clearInterval(timer); };
}
const NOMES_TELA = { ritmo: 'o Beat Hero', ranking: 'o Ranking', album: 'o Álbum', kids: 'o modo aventura (fases e estrelas)', paulta: 'a pauLta' };

/** Conteúdo de cada item da aba Estudos: o que tem dentro (a prévia que aparece antes de abrir) e o que desenvolve. */
const ESTUDOS = {
  aulas: { href: '#/estudos/aulas', titulo: 'Aulas do Paul', sub: 'bateria, teclado, violão e as figuras rítmicas', dentro: ['4 aulas curtinhas: bateria (peças, levada de rock e postura), teclado (notas, escala e acordes), violão (cordas, acorde e batida) e as figuras rítmicas', 'em cada passo o Paul fala e você ouve o som', 'no fim, a aula leva pro instrumento na aba Tocar'], dev: 'ler, ouvir e tocar com base', tempo: '10 min por aula', amostra: () => `${GRATIS.aulinha} passos de cada` },
  curiosidades: { href: '#/estudos/curiosidades', titulo: 'Curiosidades de músicos', sub: 'histórias de quem tocou antes de você', dentro: ['bateristas, pianistas, guitarristas e compositores', 'uma curiosidade por vez, com “outra” pra seguir', 'conta pra meta do dia'], dev: 'repertório e inspiração', tempo: '1 min', aberto: true },
  dicionario: { href: '#/dicionario', titulo: 'Dicionário musical', sub: 'busca, explicação e exemplo tocando', dentro: [`${TERMS_QTD} termos da bateria em 6 temas: tempo, figuras, levadas, técnica, som e forma`, 'cada termo tem explicação simples e exemplo tocando', 'busca rápida pelo nome'], dev: 'falar a língua dos músicos', tempo: '5 min', amostra: () => `${GRATIS.termos} termos` },
  dicas: { href: '#/estudos/dicas', titulo: 'Dicas do método', sub: 'as dicas da professora Bea pra estudar com calma', dentro: ['dicas curtas, uma por cartão, de como a Bea estuda e ensina', 'errar sem desistir, treinar o corpo todo, respeitar a música original', 'depois dá pra treinar tudo no jogo Letras'], dev: 'estudar melhor em menos tempo', tempo: '3 min por dica' },
  erros: { href: '#/erros', titulo: '5 erros', sub: 'material em PDF da professora Bea', dentro: ['PDF pra ler e baixar', 'os 5 erros mais comuns de quem está começando e como evitar cada um'], dev: 'evitar vícios desde o começo', tempo: '5 min', aberto: true },
  ensinam: { href: '#/jogos/relatorio', titulo: 'Jogos Ensinam', sub: 'o que cada jogo desenvolve, aberto pra pais e responsáveis', dentro: ['uma folha por jogo: o que a criança faz e o que desenvolve', 'serve pra mostrar pra família por que brincar também é estudar'], dev: 'entender o que cada jogo treina', tempo: '5 min', aberto: true },
};
const TRILHA = ['aulas', 'curiosidades', 'dicionario', 'dicas', 'erros', 'ensinam'];
const VISTOS = 'beaterista-estudos-vistos';
const vistos = () => { try { return JSON.parse(localStorage.getItem(VISTOS) || '[]'); } catch { return []; } };
const marcarVisto = (id) => { try { const v = vistos(); if (!v.includes(id)) localStorage.setItem(VISTOS, JSON.stringify([...v, id])); } catch { /* sem armazenamento: só não lembra */ } };

/** Aba Estudos: 3 áreas coloridas (ritmo · melodia e harmonia · teoria) e, embaixo, os MODOS DE ESTUDO da área escolhida em cartões grandes com desenho. Sem textão: abre direto no que estudar. */
const AREAS = [
  ['ritmo', '🥁', 'ritmo', 'sinta o tempo e o groove', '#d3122f', '#fff', 'p-drum2.webp', [
    ['#/estudos/aulas/bateria', '🥁', 'Aula de bateria', 'peças, levada de rock e postura · 10 min', 'aulas'],
    ['#/kids/figuras/aula', '🎵', 'Figuras rítmicas', 'o tempo, as pausas e a tercina · 10 min', 'aulas'],
    ['#/estudos/ritmos', '🔊', 'Ritmos de bateria', 'rock, pop, funk, samba, reggae… veja e ouça', null],
    ['#/estudos/basica/figuras', '🎶', 'Figuras e pausas', 'cartões + mini quiz de 3 perguntas', null],
    ['#/estudos/basica/tempo', '⏱️', 'Tempo e compasso', 'pulso, BPM e fórmula de compasso', null]]],
  ['melodia', '🎹', 'melodia e harmonia', 'notas, escalas e acordes', '#17365B', '#fff', 'p-guitar.webp', [
    ['#/estudos/aulas/teclado', '🎹', 'Aula de teclado', 'teclas, notas, escala e acordes · 10 min', 'aulas'],
    ['#/estudos/aulas/violao', '🎸', 'Aula de violão', 'cordas, acorde e batida · 8 min', 'aulas'],
    ['#/estudos/acordes/violao', '🎸', 'Acordes de violão e guitarra', '16 acordes: veja onde pôr o dedo e ouça', null],
    ['#/estudos/acordes/teclado', '🎹', 'Acordes de teclado', 'as 12 notas em 5 tipos de acorde', null],
    ['#/estudos/basica/leitura', '🎼', 'Leitura de notas', 'dó ré mi fá sol lá si + mini quiz', null]]],
  ['teoria', '📖', 'teoria', 'ler, entender e conhecer', '#EBA332', '#142036', 'p-book.webp', [
    ['#/estudos/basica/figuras', '🎵', 'Figuras', 'quanto dura cada nota · mini quiz', null],
    ['#/estudos/basica/pausas', '🤫', 'Pausas', 'o silêncio também conta · mini quiz', null],
    ['#/estudos/basica/claves', '𝄞', 'Claves', 'sol, fá, dó e a bateria · mini quiz', null],
    ['#/estudos/basica/tempo', '⏱️', 'Tempo e compasso', 'pulso, BPM e compasso · mini quiz', null],
    ['#/estudos/basica/leitura', '🎼', 'Leitura de notas', 'os nomes das notas · mini quiz', null],
    ['#/dicionario', '📚', 'Dicionário musical', 'busque um termo e veja tocando', 'dicionario'],
    ['#/estudos/curiosidades', '💡', 'Curiosidades de músicos', 'histórias de quem tocou antes de você', 'curiosidades'],
    ['#/estudos/dicas', '🧠', 'Dicas do método', 'como a Bea estuda e ensina', 'dicas'],
    ['#/erros', '⚠️', '5 erros', 'os erros mais comuns de quem começa', 'erros'],
    ['#/jogos/relatorio', '👨‍👩‍👧', 'Jogos Ensinam', 'pra pais e responsáveis', 'ensinam']]],
];
function estudosView(view, parts = []) {
  const v = vistos();
  let area = AREAS.find((a) => a[0] === parts[0])?.[0] || (() => { try { return localStorage.getItem('beaterista-estudos-area') || 'ritmo'; } catch { return 'ritmo'; } })();
  if (!AREAS.some((a) => a[0] === area)) area = 'ritmo';
  marcarEstudo('dica'); // abrir os Estudos já conta a dica do dia
  const mt = META.ler(); const seq = META.sequencia(mt);
  const meta = h('div', { class: 'es-strip', 'aria-label': 'Meta de hoje' },
    h('span', { class: 'es-strip-t' }, META.cumprida(mt) ? '🎉 meta cumprida!' : 'meta de hoje'),
    h('span', { class: 'es-dots' }, ...META.METAS.map(([k, t]) => h('i', { class: mt.feitas.includes(k) ? 'ok' : '', title: t, 'aria-label': `${t}: ${mt.feitas.includes(k) ? 'feito' : 'falta'}` }, mt.feitas.includes(k) ? '★' : '☆'))),
    h('span', { class: 'es-strip-s' }, seq ? `🔥 ${seq}` : '★ +1 cada'));
  const topo = h('div', { class: 'es-areas', role: 'tablist', 'aria-label': 'Áreas de estudo' });
  const grade = h('div', { class: 'es-modos' });
  const desenha = () => {
    const A = AREAS.find((a) => a[0] === area);
    topo.replaceChildren(...AREAS.map(([id, ic, nome, , cor, fg]) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(id === area), class: `es-area${id === area ? ' on' : ''}`, style: `--c:${cor};--f:${fg}`, onclick: () => { area = id; try { localStorage.setItem('beaterista-estudos-area', id); } catch { /* ok */ } desenha(); } }, h('span', { class: 'es-ai', 'aria-hidden': 'true' }, ic), h('b', {}, nome))));
    grade.style.setProperty('--c', A[4]); grade.style.setProperty('--f', A[5]);
    grade.replaceChildren(h('div', { class: 'es-cab' }, h('img', { src: `assets/paul/${A[6]}`, alt: '', draggable: 'false', loading: 'lazy' }), h('div', {}, h('h2', {}, `${A[1]} ${A[2]}`), h('p', {}, A[3]))),
      ...A[7].map(([href, ic, titulo, sub, vid]) => { const lk = AC.trancado(href); const visto = vid && v.includes(vid);
        return h('a', { class: `es-modo${lk ? ' locked' : ''}`, href, onclick: () => { if (vid) marcarVisto(vid); }, 'aria-label': lk ? `${titulo}, só pra alunos com código` : titulo },
          h('span', { class: 'es-mi', 'aria-hidden': 'true' }, ic), h('span', { class: 'es-mt' }, h('b', {}, titulo, lk ? ' 🔒' : '', visto ? ' ✓' : ''), h('small', {}, sub)), h('span', { class: 'es-go', 'aria-hidden': 'true' }, '▶')); }));
  };
  desenha();
  // dica musical do dia (curtinha, no fim; "outra" mostra a próxima)
  let di = dicaDeHoje(); const dTag = h('p', { class: 'es-tag' }); const dTxt = h('p', { class: 'es-dica' });
  const desenhaDica = () => { const [tema, txt] = DICAS_MUSICAIS[di % DICAS_MUSICAIS.length]; dTag.textContent = `💡 dica do dia · ${tema}`; dTxt.textContent = txt; };
  desenhaDica();
  const dica = h('section', { class: 'card pad es-dica-box' }, dTag, dTxt, h('button', { type: 'button', class: 'btn small ghost', onclick: () => { di++; desenhaDica(); } }, 'outra dica'));
  view.append(banner('Estudos', 'aprender brincando'), h('div', { class: 'pad-x', style: 'display:grid;gap:12px' }, meta, topo, grade, dica));
}

/** Aulas do Paul: lista das 4 aulas (as 3 novas e a das figuras rítmicas). */
function aulasView(view) {
  const lk = (href, t, sub, tempo) => h('a', { class: 'card pad al-card', href }, h('h2', { class: 'tag' }, t, !AC.liberado() ? h('small', { class: 'al-am' }, ` · grátis: ${GRATIS.aulinha} passos`) : null), h('p', { class: 'muted' }, `${sub} · ${tempo}`));
  view.append(banner('Aulas do Paul', 'ouça, entenda e toque'), h('div', { class: 'pad-x', style: 'display:grid;gap:12px' }, h('a', { class: 'jg-link', href: '#/estudos' }, '‹ estudos'),
    ...Object.entries(AULAS).map(([id, a]) => lk(`#/estudos/aulas/${id}`, a.titulo, a.sub, a.tempo)),
    lk('#/kids/figuras/aula', 'Figuras rítmicas', 'o tempo, as pausas, a tercina e a sextina', '10 min')));
}
function aulaView(view, id) {
  if (!AULAS[id]) { location.hash = '#/estudos/aulas'; return () => {}; }
  view.append(banner(`Aula de ${AULAS[id].titulo.toLowerCase()}`, 'com o Paul'), h('div', { class: 'pad-x' }, h('a', { class: 'jg-link', href: '#/estudos/aulas' }, '‹ aulas')));
  const box = h('div', { class: 'pad-x' }); view.append(box);
  return montarAula(box, id, { onPasso: () => { marcarEstudo('aula'); marcarVisto('aulas'); } });
}

/** Curiosidades de músicos: uma por vez, com "outra" e "anterior". Conta pra meta do dia. */
function curiosidadesView(view) {
  let i = curiosidadeDeHoje();
  const nome = h('h2', { class: 'tag' }); const inst = h('p', { class: 'es-tag' }); const txt = h('p', { class: 'es-dica' }); const pos = h('small', { class: 'muted' });
  const draw = () => { const [n, ins, t] = CURIOSIDADES[((i % CURIOSIDADES.length) + CURIOSIDADES.length) % CURIOSIDADES.length]; nome.textContent = n; inst.textContent = ins; txt.textContent = t; pos.textContent = `${(((i % CURIOSIDADES.length) + CURIOSIDADES.length) % CURIOSIDADES.length) + 1} de ${CURIOSIDADES.length}`; marcarEstudo('curiosidade'); marcarVisto('curiosidades'); };
  view.append(banner('Curiosidades de músicos', 'quem tocou antes de você'), h('div', { class: 'pad-x', style: 'display:grid;gap:12px' }, h('a', { class: 'jg-link', href: '#/estudos' }, '‹ estudos'),
    h('article', { class: 'card pad es-cur' }, inst, nome, txt, pos),
    h('div', { class: 'row', style: 'gap:8px' }, h('button', { type: 'button', class: 'btn', onclick: () => { i--; draw(); } }, '‹ anterior'), h('button', { type: 'button', class: 'btn primary', style: 'flex:1', onclick: () => { i++; draw(); } }, 'outra curiosidade ›'))));
  draw();
}

/** Dicas do método pra estudar (só com código): a lista inteira, uma por cartão. Os jogos com elas ficam na aba Jogos > Letras. */
function dicasEstudoView(view) {
  const box = h('div', { class: 'pad-x', style: 'display:grid;gap:10px' }, h('p', { class: 'muted' }, 'carregando as dicas…'));
  view.append(banner('Dicas do método', 'pra estudar com calma'), box); let dead = false;
  DA.carregar(CODE.saved()).finally(() => {
    if (dead) return; const list = tipList();
    box.replaceChildren(h('a', { class: 'jg-link', href: '#/estudos' }, '‹ estudos'),
      ...(list.length ? list.map((t) => h('article', { class: 'card pad dc-tipbox' }, h('p', { class: 'dc-n' }, `dica ${t.n} de ${list.length}`), h('p', { class: 'dc-text' }, t.text))) : [h('p', { class: 'muted' }, 'as dicas ainda não chegaram. abra o app com internet e volte aqui.')]),
      h('a', { class: 'btn small', href: '#/dicas' }, 'jogar com as dicas (Letras)'));
  });
  return () => { dead = true; };
}

/** Lojinha (em construção): exercícios, atividades pra imprimir e o código de acesso. Por enquanto avisa que vem aí e deixa digitar um código que já tem. */
function lojinhaView(view, parts = []) {
  // os depoimentos (só texto) aparecem com a lojinha aberta (LOJA_ABERTA em js/loja-config.js)
  const aba = LOJA_ABERTA && parts[0] === 'depoimentos' ? parts[0] : 'loja';
  const abas = h('div', { class: 'al-subnav lj-abas', role: 'tablist', 'aria-label': 'Lojinha' }, ...[['loja', '#/lojinha', 'lojinha'], ['depoimentos', '#/lojinha/depoimentos', 'depoimentos']].map(([k, href, t]) => h('a', { href, role: 'tab', 'aria-selected': String(aba === k), class: `chip-btn${aba === k ? ' on' : ''}` }, t)));
  if (aba !== 'loja') { const box = h('div', { class: 'pad-x' }); view.append(banner('Lojinha', 'quem já estuda com a Beaterista'), abas, box); import('./views/lojinha-prova.js').then((m) => box.replaceChildren(m.depoimentos())); return () => {}; }
  let gone = false; const msg = h('p', { class: 'al-lock-msg', role: 'status', 'aria-live': 'polite' });
  const inp = h('input', { class: 'field al-cod', type: 'text', maxlength: 14, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'CÓDIGO DE ACESSO', 'aria-label': 'Código de acesso' });
  const entrar = async () => { msg.textContent = 'conferindo…'; try { if (await CODE.entrar(inp.value)) { AC.definir(true); msg.textContent = 'liberado! 🎉'; setTimeout(() => { if (!gone) location.hash = '#/jogos'; }, 700); } else msg.textContent = 'não achei esse código. confira e tente de novo.'; } catch { msg.textContent = 'sem internet agora. tente de novo.'; } };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') entrar(); });
  // enquanto a lojinha não abre: a aluna ainda pode pedir um código pra professora Bea cadastrar (aparece nas telas trancadas e no Perfil)
  const pedido = h('div', { class: 'al-pedido' });
  const drawPedido = () => { const c = CODE.pendente(); pedido.replaceChildren(c ? h('div', {}, h('p', { class: 'al-lock-l' }, 'seu código'), h('div', { class: 'al-lock-code' }, c), h('p', { class: 'al-lock-t' }, 'informe a professora Bea')) : h('button', { class: 'btn small ghost', type: 'button', onclick: () => { CODE.pedir(); drawPedido(); } }, 'pedir o código pra professora Bea')); };
  drawPedido();
  const vitrineBox = h('div');
  if (LOJA_ABERTA) import('./views/lojinha-vitrine.js').then((m) => { if (!gone) vitrineBox.replaceChildren(m.vitrine()); });
  view.append(banner('Lojinha', 'exercícios, atividades pra imprimir e o seu código'), LOJA_ABERTA ? abas : null, h('div', { class: 'pad-x', style: 'display:grid;gap:12px' },
    LOJA_ABERTA ? vitrineBox : h('section', { class: 'card pad al-lock' }, h('div', { class: 'al-lock-i', 'aria-hidden': 'true' }, '🛍️'), h('h2', { class: 'hand' }, 'a lojinha vem em breve!'),
      h('p', { class: 'muted' }, 'aqui vão ficar os materiais da Beaterista: exercícios, atividades pra imprimir e o código de acesso.')),
    LOJA_ABERTA ? null : arteDoPaul('arte-por-que-paul', 'por que Paul?', 'a homenagem do nome do robozinho', 'por que Paul? o nome é uma homenagem ao Paul McCartney, um dos músicos favoritos da Bea'),
    h('section', { class: 'card pad' }, h('b', {}, 'já tem um código?'), h('div', { class: 'al-lock-row' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: entrar }, 'liberar')), msg),
    h('section', { class: 'card pad' }, h('b', {}, 'ou peça pra professora Bea'), pedido)));
  return () => { gone = true; };
}

/** "5 erros": PDF da professora (aberto, sem código). Enquanto o arquivo não existe, avisa que vem aí. */
const PDF_ERROS = 'assets/5-erros.pdf';
const PDF_ERROS_DRIVE = 'https://drive.google.com/file/d/1FJ7dLVD2EOg2eFIvt14kkFA8vFEnNokn/view'; // enquanto o PDF não está dentro do app (precisa estar como "qualquer pessoa com o link")
function errosView(view) {
  const box = h('section', { class: 'card pad' }, h('p', { class: 'muted' }, 'carregando…'));
  view.append(banner('5 erros', 'material da professora Bea'), h('div', { class: 'pad-x', style: 'display:grid;gap:12px' }, h('a', { class: 'jg-link', href: '#/estudos' }, '‹ estudos'), box));
  let gone = false;
  fetch(PDF_ERROS, { method: 'HEAD', cache: 'no-store' }).then((r) => {
    if (gone) return;
    box.replaceChildren(h('h2', { class: 'tag' }, '5 erros'), h('p', {}, 'toque pra abrir o material. dá pra ler e baixar.'), h('a', { class: 'btn primary wide', href: r.ok ? PDF_ERROS : PDF_ERROS_DRIVE, target: '_blank', rel: 'noopener' }, 'abrir o PDF'));
  }).catch(() => { if (!gone) box.replaceChildren(h('p', { class: 'muted' }, 'sem internet agora. tente de novo.')); });
  return () => { gone = true; };
}

function tocarView(view) {
  const card = (href, title, sub) => h('a', { class: 'card pad al-card', href }, h('h2', { class: 'tag' }, title), h('p', { class: 'muted' }, sub));
  view.append(banner('Tocar', 'bateria, piano, violão, xilofone e roleta musical'), h('div', { class: 'pad-x', style: 'display:grid;gap:12px' },
    card('#/toque', 'Bateria', 'toque nas peças com vários dedos e grave um ritmo'),
    card('#/violao', 'Violão', 'escolha o acorde e passe o dedo nas cordas'),
    card('#/piano', 'Piano', 'teclado na tela, com notas e acordes'),
    card('#/xilofone', 'Xilofone', 'barras coloridas: nenhuma nota soa errada na pentatônica'),
    card('#/roleta', 'Roleta Musical', 'gire os rolos e descubra de qual artista você vai tocar uma música')));
}

/** Trocar de aluno no mesmo aparelho: voltar a uma conta já conectada, conectar outro código ou entrar com outro nome. */
function trocarAluno() {
  CONTAS.guardarAtual(); const atual = CONTAS.atual();
  sheet('trocar de aluno', (close) => {
    const err = h('p', { class: 'muted', role: 'status' });
    const nome = h('input', { class: 'field', type: 'text', maxlength: 20, placeholder: 'nome do aluno', autocomplete: 'off', 'aria-label': 'Nome do aluno' });
    const cod = h('input', { class: 'field', type: 'text', maxlength: 12, placeholder: 'código', autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Código do aluno' });
    const ir = (c) => { CONTAS.ativar(c); close(); location.reload(); };
    const contas = CONTAS.lista().filter((x) => x.code !== CODE.norm(atual.code || ''));
    async function conectar(ev) {
      const b = ev.currentTarget; const n = nome.value.replace(/\s+/g, ' ').trim(), c = CODE.norm(cod.value);
      if (!n) { err.textContent = 'escreva o nome do aluno.'; return; } if (c.length < 4) { err.textContent = 'escreva o código.'; return; }
      b.disabled = true; err.textContent = 'conferindo…';
      try {
        if (!(await CODE.verificar(c))) { err.textContent = 'não achei esse código. confira com a sua professora.'; return; }
        CONTAS.ativar({ nome: n, code: c }); try { await ALBUMACESSO.entrar(c); } catch { /* o álbum confere de novo na próxima vez */ }
        CONTAS.guardarConta({ nome: n, code: c }); toast(`${n} conectado`); close(); location.reload();
      } catch { err.textContent = 'sem internet agora. tente de novo.'; } finally { b.disabled = false; }
    }
    return h('div', { class: 'sheet-body' },
      atual.nome ? h('p', { class: 'muted' }, `agora: ${atual.nome}`) : null,
      contas.length ? h('div', {}, h('b', {}, 'voltar pra'), ...contas.map((c) => h('div', { class: 'row', style: 'gap:8px;margin:6px 0' },
        h('button', { type: 'button', class: 'btn primary', style: 'flex:1', onclick: () => ir(c) }, c.nome),
        h('button', { type: 'button', class: 'btn small ghost', 'aria-label': `Tirar ${c.nome} da lista`, onclick: async (ev) => { if (await confirmSheet('tirar da lista?', `${c.nome} some daqui; o código dele continua valendo.`, 'tirar')) { CONTAS.esquecer(c.code); ev.target.closest('.row').remove(); } } }, '✕')))) : null,
      h('b', {}, 'conectar outro código'), h('p', { class: 'muted' }, 'um aluno novo neste aparelho: nome e código. cada um fica com as suas figurinhas e a sua foto.'), nome, cod,
      h('button', { type: 'button', class: 'btn primary wide', onclick: conectar }, 'conectar'), err,
      h('button', { type: 'button', class: 'btn ghost wide', onclick: async () => { if (!(await confirmSheet('entrar com outro nome?', 'o código deste aparelho sai e quem entrar precisa pedir um código. dá pra voltar pra este aluno depois pela lista.', 'continuar'))) return; CONTAS.semConta(); close(); location.reload(); } }, 'entrar com outro nome (ainda sem código)'));
  });
}

/** "tenho código": folha rápida (aberta do topo de qualquer tela) pra digitar o código de acesso sem procurar a Lojinha. */
function abrirCodigo() {
  sheet('já tenho meu código', (close) => {
    const msg = h('p', { class: 'al-lock-msg', role: 'status', 'aria-live': 'polite' });
    const inp = h('input', { class: 'field al-cod', type: 'text', maxlength: 14, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'CÓDIGO DE ACESSO', 'aria-label': 'Código de acesso' });
    const entrar = async () => { msg.textContent = 'conferindo…'; try { if (await CODE.entrar(inp.value)) { AC.definir(true); msg.textContent = 'liberado! 🎉'; setTimeout(close, 700); } else msg.textContent = 'não achei esse código. confira e tente de novo.'; } catch { msg.textContent = 'sem internet agora. tente de novo.'; } };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') entrar(); });
    return h('div', { class: 'sheet-body' }, h('p', { class: 'muted' }, 'digite o código que a professora Bea te passou.'), h('div', { class: 'al-lock-row' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: entrar }, 'liberar')), msg,
      h('p', { class: 'muted' }, 'ainda não tem? ', h('a', { href: '#/lojinha', onclick: close }, 'veja a Lojinha')));
  });
}

function shell(name) {
  const view = h('main', { id: 'view', tabindex: '-1' });
  const nav = h('nav', { class: 'bottom-nav', 'data-n': NAV.length, style: `grid-template-columns: repeat(${NAV.length}, 1fr)`, 'aria-label': 'Navegação' });
  const tenhoCodigo = h('button', { type: 'button', class: 'btn small al-tenho', onclick: abrirCodigo, hidden: AC.liberado(), 'aria-label': 'tenho código de acesso' }, '🔑 código');
  document.addEventListener('aluno-acesso', (ev) => { tenhoCodigo.hidden = !!(ev.detail); });
  if (!window.__salvarLigado) { window.__salvarLigado = true; SALVAR.ligar({ nome: () => { try { return localStorage.getItem(NAME_KEY) || ''; } catch { return window.__alunoNome || ''; } } }); }
  const head = h('header', { class: 'top' },
    h('img', { src: 'assets/icons/tambor-menu.png', alt: '', width: 40, height: 40 }),
    h('div', { class: 'ws', style: 'flex:1' }, h('span', { class: 'on', style: 'padding:6px 12px' }, (() => { const me = P.profiles().find((p) => p.name.toLowerCase() === name.toLowerCase()); const t = me ? PL.titleOf(me.id) : ''; return t ? `oi, ${name} · ${t}` : `oi, ${name}!`; })())),
    soundButton(),
    tenhoCodigo,
    h('button', { type: 'button', class: 'btn small ghost', onclick: trocarAluno }, 'trocar aluno'));
  app.replaceChildren(h('div', { class: 'topwrap' }, head), view, nav);

  function go() {
    cleanup && cleanup(); cleanup = null; closeSheets(); silence(); view.replaceChildren();
    const r = route(); view.dataset.page = r.name;
    // Dentro de um jogo a barra de baixo some (um toque perto da borda caía na Lojinha ou em outra aba sem querer). A lista de jogos e as outras telas continuam com a barra.
    { const emJogo = /^#\/(jogos\/[^/?]+|ritmo|paulta|kids\/[^/?]+|dicas\/[^/?]+)/.test(location.hash) && !/^#\/jogos\/?(\?|$)/.test(location.hash); document.documentElement.classList.toggle('em-jogo', emJogo); }
    nav.replaceChildren(...NAV.map(([href, ic, label]) => { const lk = AC.trancado(href); return h('a', { href, class: `nav-item${('#/' + tabOf(r)) === href ? ' on' : ''}${lk ? ' locked' : ''}`, 'aria-current': ('#/' + tabOf(r)) === href ? 'page' : null, 'aria-label': lk ? `${label} (com código)` : null }, icon(ic, 24), h('span', {}, label), lk ? h('i', { class: 'nav-lock', 'aria-hidden': 'true' }, '🔒') : null); }));
    let c;
    if (AC.trancado(location.hash)) c = lockView(view, NOMES_TELA[r.name] || (/^#\/estudos\/dicas/.test(location.hash) ? 'as dicas do método' : /^#\/jogos\/toca/.test(location.hash) ? 'o Toca Aqui' : /^#\/jogos\/cartas/.test(location.hash) ? 'o Uno Musical' : 'esta parte'), previaDaRota(r));
    else if (r.name === 'dicionario') c = dicionario.mount(view, r.parts);
    else if (r.name === 'dicas') { // Letras: baixa as 30 dicas (só com código) e abre
      const box = h('div'); view.append(box); let inner = null; let dead = false;
      if (AC.liberado()) DA.carregar(CODE.saved()).finally(() => { if (!dead) inner = dicas.mount(box, r.parts); }); // com código: baixa as dicas
      else inner = dicas.mount(box, r.parts); // sem código: amostra (caça-palavras com palavras do dicionário), nada é baixado
      c = () => { dead = true; if (typeof inner === 'function') inner(); };
    }
    else if (r.name === 'kids') c = kids.mount(view, r.parts);
    else if (r.name === 'paulta') c = paulta.mount(view, r.parts);
    else if (r.name === 'ranking') c = rankingView(view);
    else if (r.name === 'jogos') c = jogos.mount(view, r.parts);
    else if (r.name === 'album') c = album.mount(view, r.parts);
    else if (r.name === 'perfil') { c = perfil.mount(view); view.append(versaoApp()); }
    else if (r.name === 'toque') c = toque.mount(view);
    else if (r.name === 'piano') c = piano.mount(view);
    else if (r.name === 'violao') c = violao.mount(view);
    else if (r.name === 'xilofone') c = xilofone.mount(view);
    else if (r.name === 'roleta') c = roleta.mount(view);
    else if (r.name === 'tocar') tocarView(view);
    else if (r.name === 'estudos' && r.parts[0] === 'basica') c = teoriaBasica.mount(view, r.parts.slice(1), { aoFim: () => marcarEstudo('aula') });
    else if (r.name === 'estudos' && r.parts[0] === 'acordes') acordesView(view, r.parts.slice(1));
    else if (r.name === 'estudos' && r.parts[0] === 'ritmos') c = ritmosView(view);
    else if (r.name === 'estudos' && r.parts[0] === 'dicas') c = dicasEstudoView(view);
    else if (r.name === 'estudos' && r.parts[0] === 'aulas') c = r.parts[1] ? aulaView(view, r.parts[1]) : aulasView(view);
    else if (r.name === 'estudos' && r.parts[0] === 'curiosidades') curiosidadesView(view);
    else if (r.name === 'estudos') estudosView(view, r.parts);
    else if (r.name === 'erros') c = errosView(view);
    else if (r.name === 'lojinha') c = lojinhaView(view, r.parts);
    else if (r.name === 'ritmo') c = ritmo.mount(view, { student: true, name: getName, parts: r.parts });
    else { location.hash = '#/jogos'; return; }
    if (r.name === 'album') view.prepend(arteDoPaul('arte-album', 'jogue. colecione. complete seu álbum.', 'conheça as figurinhas da Beaterista', 'o Paul com uma figurinha na mão e o álbum aberto: jogue, colecione, complete seu álbum'));
    if (r.name === 'album' || r.name === 'perfil') { // 3 abas: ÁLBUM · ROLETA · PERFIL (a roleta é a aba "Pacotes" do álbum; o perfil mora junto)
      const roleta = r.name === 'album' && r.parts && r.parts[0] === 'Pacotes';
      let pend = 0; try { pend = FRpend() || 0; } catch { pend = 0; }
      const aba = (href, nome, on, ic, badge) => h('a', { href, role: 'tab', 'aria-selected': String(on), class: `chip-btn${on ? ' on' : ''}`, 'aria-label': badge ? `${nome}, ${badge} pra abrir` : nome }, h('span', { class: 'al-ic', 'aria-hidden': 'true' }, ic), nome, badge ? h('span', { class: 'al-badge', 'aria-hidden': 'true' }, String(badge)) : null);
      view.prepend(h('div', { class: 'al-subnav', role: 'tablist', 'aria-label': 'Álbum, roleta e perfil' }, aba('#/album', 'álbum', r.name === 'album' && !roleta, '🃏'), aba('#/album/Pacotes', 'roleta', roleta, '🎡', pend), aba('#/perfil', 'perfil', r.name === 'perfil', '👤')));
    }
    cleanup = typeof c === 'function' ? c : null;
    window.scrollTo(0, 0);
  }
  addEventListener('hashchange', go);
  document.addEventListener('aluno-acesso', () => go());
  go();
}

function askName() {
  const input = h('input', { class: 'field', type: 'text', name: 'username', maxlength: 20, autocomplete: 'username', autocapitalize: 'words', required: true, 'aria-label': 'Seu nome', placeholder: 'seu nome' });
  const pose = pickPose();
  const err = h('p', { class: 'form-err', role: 'alert' });
  const sel = h('select', { required: true, 'aria-label': 'Como você chegou aqui?' }, h('option', { value: '', disabled: true, selected: true }, 'escolha uma opção'), ...ORIGENS.filter(([v]) => v !== 'codigo').map(([v, t]) => h('option', { value: v }, t)));
  const outro = h('input', { class: 'field', type: 'text', maxlength: 40, 'aria-label': 'Outro: qual?', placeholder: 'outro: escreva aqui', hidden: true });
  const cod = h('input', { class: 'field al-cod', type: 'password', name: 'password', maxlength: 14, autocomplete: 'current-password', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Código de acesso', placeholder: 'CÓDIGO DE ACESSO' }); // tipo senha: o aparelho oferece guardar e preencher o código
  const ver = h('label', { class: 'al-ver' }, h('input', { type: 'checkbox', onchange: (e) => { cod.type = e.target.checked ? 'text' : 'password'; } }), ' mostrar o código');
  const pedido = h('div', { class: 'al-pedido', role: 'status' });
  const gen = h('button', { class: 'btn small ghost', type: 'button', onclick: () => { CODE.pedir(); drawPedido(); } }, 'não tenho: gerar meu código');
  const codBox = h('div', { class: 'al-codbox' }, h('p', { class: 'al-lock-l' }, 'já tem código de aluno? coloque aqui'), cod, ver, gen, pedido);
  const temCodigoDigitado = () => CODE.norm(cod.value).length >= 4;
  cod.addEventListener('input', () => { sel.required = !temCodigoDigitado(); });
  function drawPedido() { const c = CODE.pendente(); ver.hidden = !!c; sel.required = !c && !temCodigoDigitado(); gen.hidden = !!c; cod.hidden = !!c; pedido.replaceChildren(...(c ? [h('p', { class: 'al-lock-l' }, 'seu código'), h('div', { class: 'al-lock-code' }, c), h('p', { class: 'al-lock-t' }, 'informe a professora Bea'), h('p', { class: 'muted' }, 'pode entrar agora: quando ela cadastrar, libera sozinho.')] : [])); }
  drawPedido();
  sel.addEventListener('change', () => { outro.hidden = sel.value !== 'outro'; if (!outro.hidden) outro.focus(); });
  let indo = false;
  const entrarAgora = async () => { if (indo) return; indo = true; try {
    const n = cleanName(input.value);
    if (n.length < 2) { err.textContent = 'escreva pelo menos 2 letras.'; return; }
    const modo = temCodigoDigitado() || CODE.pendente() ? 'codigo' : sel.value; // digitou o código? já vale, sem precisar escolher a opção
    if (!modo) { err.textContent = 'escolha como você chegou aqui.'; return; }
    if (modo === 'codigo') { // código de acesso: libera tudo que a professora liberou pra quem é aluno (vale 1 ano neste aparelho)
      if (!CODE.pendente()) { // digitou um código que a professora já deu: confere
        if (CODE.norm(cod.value).length < 4) { err.textContent = 'digite o seu código de acesso ou toque em "gerar meu código".'; return; }
        err.textContent = 'conferindo o código…';
        try { if (!(await CODE.entrar(cod.value))) { err.textContent = 'não achei esse código. confira com a sua professora.'; return; } } catch { err.textContent = 'sem internet agora. tente de novo.'; return; }
      }
      err.textContent = '';
    }
    const o = modo === 'outro' ? `outro: ${cleanName(outro.value) || '—'}` : modo === 'codigo' ? (CODE.pendente() ? 'pediu código de acesso' : 'aluno beaterista (código de acesso)') : modo;
    try { localStorage.setItem(ORIGEM_KEY, o); } catch { window.__alunoOrigem = o; }
    logVisit(n); if (modo === 'codigo' && !CODE.pendente()) SALVAR.agendar();
    try { localStorage.setItem(NAME_KEY, n); } catch { /* sem armazenamento: vale só nesta sessão */ window.__alunoNome = n; }
    start();
  } catch (ex) { err.textContent = `deu erro: ${String((ex && ex.message) || ex).slice(0, 140)}`; console.error(ex); } finally { indo = false; } };
  for (const campo of [input, cod]) campo.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); entrarAgora(); } }); // sem botão "submit", o Enter precisa ser tratado aqui
  const form = h('form', { class: 'login-card', noValidate: true, onsubmit: (e) => { e.preventDefault(); entrarAgora(); } },
    h('div', { class: 'al-hero' },
      h('div', { class: 'al-paulbox' },
        h('img', { class: 'al-paul-img', src: `assets/aluno/paul-${pose[0]}.webp`, alt: `Paul, o robôterista, ${pose[1]}` }),
        // o Paul fica parado; o que se mexe são os rabiscos em volta dele
        ...[['estrela-ouro', 'a'], ['nota-vermelha', 'b'], ['coracao', 'c'], ['raio', 'd'], ['estrela-azul-p', 'e'], ['nota-preta', 'f']].map(([n, k]) => h('img', { class: `al-el el-${k}`, src: `assets/paul/el/${n}.webp`, alt: '', 'aria-hidden': 'true', draggable: 'false' }))),
      h('div', { class: 'al-hero-txt' },
        h('img', { class: 'al-robo', src: 'assets/robo-logo.png', alt: 'Robôterista', width: 900, height: 326 }),
        h('p', { class: 'al-bubble' }, 'oi! sou o paul,', h('br'), 'assistente da bea,', h('br'), 'vamos jogar juntos', h('br'), 'e aprender!'))),
    h('label', { class: 'field' }, h('span', {}, 'nome'), input),
    codBox, h('label', { class: 'field' }, h('span', {}, 'ou, se não tem código: como você chegou aqui?'), sel), outro, err,
    h('button', { class: 'btn primary wide', type: 'button', onclick: () => entrarAgora() }, 'entrar'), // botão comum (não 'submit'): no Safari do iPad o envio de formulário falhava; o Enter no teclado continua enviando
    h('p', { class: 'muted center al-note' }, 'seu nome aparece no ranking e a escola registra a entrada'));
    app.replaceChildren(h('main', { class: 'login al-entry' },
    h('div', { class: 'al-top' }, brandEl(), socialRow('al-mini')), form, footerBlock()));
  setTimeout(() => input.focus(), 100);
}

/** Ao abrir: o código guardado (ou o pedido que a professora já cadastrou) ainda vale? */
async function refreshAccess() {
  try { let ok = await CODE.revalidar(); if (!ok && CODE.pendente()) ok = await CODE.conferirPedido().catch(() => false); AC.definir(ok); } catch { AC.definir(false); }
}

async function start() {
  const name = getName() || window.__alunoNome || '';
  if (!name) { askName(); return; }
  await ensureKidsPlayer(name);
  logVisit(name);
  await refreshAccess();
  shell(name);
  sendScores();
  store.subscribe((i) => { if (!i.kind || i.kind === 'setting') sendScores(); });
}

(async () => {
  if ('serviceWorker' in navigator) {
    // Versão nova do app: quando o service worker novo assume, recarrega sozinho (fora de um jogo; dentro de um jogo espera sair), e procura versão nova sempre que o app volta pra tela.
    const tinha = !!navigator.serviceWorker.controller; let recarregar = false;
    const tenta = () => { if (!recarregar) return; if (document.documentElement.classList.contains('em-jogo')) return; location.reload(); };
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (tinha) { recarregar = true; tenta(); } });
    addEventListener('hashchange', () => setTimeout(tenta, 300));
    navigator.serviceWorker.register('sw.js').then((reg) => { document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); }); }).catch(() => {});
  }
  try { await store.init(); } catch {
    app.replaceChildren(h('main', { class: 'login' }, h('div', { class: 'login-card' }, h('h1', {}, 'Armazenamento indisponível'), h('p', {}, 'Este navegador bloqueou o armazenamento local (modo privado?). Abra no Safari normal.')))); return;
  }
  startScroller();
  startPaul({ first: 7000, allowed: () => !document.querySelector('.al-entry, .login') && !/^#\/(jogos|dicas|ritmo|paulta|kids|piano|violao|xilofone)\/./.test(location.hash) }); // dentro de um jogo a nuvem não aparece: ela cobria botões como o STOP */; // na tela de entrada o balão do Paul cobria o botão "entrar"
  start();
})();
