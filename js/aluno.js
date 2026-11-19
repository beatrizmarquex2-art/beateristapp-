// Área do aluno (aluno.html): sem login. O aluno escolhe um nome, joga os Jogos de ritmo e o Kids e aparece no ranking que todos veem.
// Tudo que ele faz fica só no aparelho dele (armazenamento separado do app da Bea); só o nome e as pontuações vão pro ranking.
import './polyfills.js'; // iPhones antigos (sem crypto.randomUUID, .at etc.): tem que ser o PRIMEIRO import
import { h, icon, uid } from './util.js';
import { soundButton, musicButton } from './sound-btn.js';
import { iconeTopo } from './top-icons.js';
import { atualizarButton } from './atualizar-btn.js';
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
import { cartoesDosTemas, sessaoPorId, estrelasTema } from './kids/teoria.js';
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
import { AULAS } from './kids/aulas-paul.js';
const TERMS_QTD = TERMS.length;
import { previa, previaDaRota, tituloDaPrevia } from './previas.js';
import { tipList } from './tipbox.js';
import * as kids from './views/kids.js';
import * as paulta from './paulta/view.js';
import { initMusica } from './jogos/musica.js';
initMusica(); // música de fundo dos jogos (escolhida pela Bea)
import * as PL from './paulta/save.js';
import * as ritmo from './views/jogos-ritmo.js';
import * as toque from './views/toque.js';
import * as piano from './views/piano.js';
import * as violao from './views/violao.js';
import * as xilofone from './views/xilofone.js';
import * as roleta from './views/roleta.js';
import * as parceria from './views/parceria.js';
import * as metronome from './views/metronome.js';
import * as ouvido from './views/ouvido.js';
import * as focus from './views/focus.js';
import { deckView } from './views/tocar-deck.js';
import './ipad-fit.js';
import * as jogos from './views/jogos.js';
import * as album from './views/album-aluno.js';
import { pending as FRpend } from './figurinhas/rewards.js'; // quantos giros/pacotes esperando (bolinha vermelha na aba roleta)
import * as perfil from './views/perfil.js';
import * as inicio from './views/inicio.js';
import { LOJA_ABERTA } from './loja-config.js';
import { banner, closeSheets, confirmSheet, sheet, toast } from './ui.js';
import * as CONTAS from './contas.js';
import { listaCurta } from './lista-curta.js';
import * as ALBUMACESSO from './figurinhas/acesso.js';
import { silence } from './audio.js';
import { startScroller } from './scroller.js';
import { startPaul } from './paul-talk.js';
import { TERMO_DE_USO } from './termo-de-uso.js';
import { entradaNova } from './entrada.js';
import * as PROG from './progresso-nuvem.js';
import { corSrc, stkSrc } from './paul-cor.js';
import { arteDoPaul } from './paul-dicas.js';

const app = document.getElementById('app');
const NAME_KEY = 'beaterista-aluno-nome';
// aba INÍCIO (prévia): só aparece pra quem abriu o app com ?inicio=1 (fica guardado no aparelho; ?inicio=0 desliga). A barra de sempre não muda.
const INICIO_ON = (() => { try { if (/[?&]inicio=1\b/.test(location.search)) localStorage.setItem('bt-inicio', '1'); if (/[?&]inicio=0\b/.test(location.search)) localStorage.removeItem('bt-inicio'); return localStorage.getItem('bt-inicio') === '1'; } catch { return false; } })();
const NAV = [...(INICIO_ON ? [['#/inicio', 'home', 'Início']] : []), ['#/jogos', 'bulb', 'Jogos'], ['#/estudos', 'study', 'Estudos'], ['#/tocar', 'nota', 'Palco'], ['#/album', 'gallery', 'Álbum'], ['#/lojinha', 'bag', 'Lojinha']]; // lâmpada, livro, nota musical, galeria e sacola (o Perfil mora junto do Álbum)
const TAB_OF = { nagano: 'tocar', perfil: 'album', toque: 'tocar', piano: 'tocar', violao: 'tocar', xilofone: 'tocar', roleta: 'tocar', metronomo: 'tocar', ouvido: 'tocar', foco: 'tocar', kids: 'jogos', ritmo: 'jogos', dicionario: 'estudos', paulta: 'jogos', dicas: 'estudos', erros: 'estudos' };
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
    try { if (await CODE.entrar(inp.value)) return done(); msg.textContent = CODE.msgFalha(); } catch { msg.textContent = 'sem internet agora. tente de novo.'; }
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
  aulas: { href: '#/estudos/aulas', titulo: 'Robôterista ensina', sub: 'bateria, teclado, violão e as figuras rítmicas', dentro: ['4 aulas curtinhas: bateria (peças, levada de rock e postura), teclado (notas, escala e acordes), violão (cordas, acorde e batida) e as figuras rítmicas', 'em cada passo o Paul fala e você ouve o som', 'no fim, a aula leva pro instrumento na aba Tocar'], dev: 'ler, ouvir e tocar com base', tempo: '10 min por aula', amostra: () => `${GRATIS.aulinha} passos de cada` },
  curiosidades: { href: '#/estudos/curiosidades', titulo: 'Curiosidades de músicos', sub: 'histórias de quem tocou antes de você', dentro: ['bateristas, pianistas, guitarristas e compositores', 'uma curiosidade por vez, com “outra” pra seguir', 'conta pra meta do dia'], dev: 'repertório e inspiração', tempo: '1 min', aberto: true },
  dicionario: { href: '#/dicionario', titulo: 'Dicionário musical', sub: 'busca, explicação e exemplo tocando', dentro: [`${TERMS_QTD} termos de bateria, teclado, violão, teoria e vida de banda, em 12 temas: tempo, duração, levadas, técnica, som, forma, notas, teclado, violão, banda e palco, estúdio e o jeito de falar dos músicos`, 'cada termo tem explicação simples, e os de bateria têm exemplo tocando', 'busca rápida pelo nome'], dev: 'falar a língua dos músicos', tempo: '5 min', amostra: () => `${GRATIS.termos} termos` },
  dicas: { href: '#/estudos/dicas', titulo: 'Dicas do método', sub: 'as dicas da professora Bea pra estudar com calma', dentro: ['dicas curtas, uma por cartão, de como a Bea estuda e ensina', 'errar sem desistir, treinar o corpo todo, respeitar a música original', 'depois dá pra treinar tudo no jogo Letras'], dev: 'estudar melhor em menos tempo', tempo: '3 min por dica' },
  erros: { href: '#/erros', titulo: '5 erros', sub: 'material em PDF da professora Bea', dentro: ['PDF pra ler e baixar', 'os 5 erros mais comuns de quem está começando e como evitar cada um'], dev: 'evitar vícios desde o começo', tempo: '5 min', aberto: true },
  ensinam: { href: '#/jogos/relatorio', titulo: 'Jogos Ensinam', sub: 'o que cada jogo desenvolve, aberto pra pais e responsáveis', dentro: ['uma folha por jogo: o que a criança faz e o que desenvolve', 'serve pra mostrar pra família por que brincar também é estudar'], dev: 'entender o que cada jogo treina', tempo: '5 min', aberto: true },
};
const TRILHA = ['aulas', 'curiosidades', 'dicionario', 'dicas', 'erros', 'ensinam'];
const VISTOS = 'beaterista-estudos-vistos';
const vistos = () => { try { return JSON.parse(localStorage.getItem(VISTOS) || '[]'); } catch { return []; } };
const marcarVisto = (id) => { try { const v = vistos(); if (!v.includes(id)) localStorage.setItem(VISTOS, JSON.stringify([...v, id])); } catch { /* sem armazenamento: só não lembra */ } };

/** Aba Estudos = "Hoje": o Paul conta quantas coisinhas faltam, a meta do dia vira um anel e as 3 missões (dica, aula, curiosidade) ficam em cartões grandes; o resto dos estudos fica em "explorar". */
const EXPLORAR = [
  ['#/estudos/aulas', '📚', 'aulas do Paul', 'aulas'], ['#/estudos/ritmos', '🥁', 'ritmos', null], ['#/estudos/acordes/violao', '🎸', 'acordes', null], ['#/dicionario', '📖', 'dicionário musical', 'dicionario'],
  ['#/estudos/basica/figuras', '🎼', 'teoria', null], ['#/estudos/dicas', '🧠', 'dicas', 'dicas'], ['#/estudos/curiosidades', '💡', 'curiosidades', 'curiosidades'], ['#/jogos/relatorio', '👨‍👩‍👧', 'jogos ensinam', 'ensinam']];
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
function estudosView(view) {
  // Pedido da Bea (15/nov/2026): sem "meta do dia". 4 cartões na ordem dela (dicionário · robôterista ensina · acordes e ritmos · jogos ensinam)
  // e o Paul já chega falando: toda vez que abre Estudos ele conta uma dica ou uma curiosidade de músico (uma de cada, alternando).
  const v = vistos(); const lock = (href) => AC.trancado(href);
  const ALT = 'beaterista-estudos-fala'; let vez = 0; try { vez = Number(localStorage.getItem(ALT) || 0) || 0; localStorage.setItem(ALT, String(vez + 1)); } catch { /* sem armazenamento */ }
  let tipo = vez % 2 === 0 ? 'dica' : 'curiosidade'; let di = dicaDeHoje() + Math.floor(vez / 2); let ci = curiosidadeDeHoje() + Math.floor(vez / 2);
  const tag = h('small', { class: 'hj-fala-tag' }); const txt = h('p', { class: 'hj-fala-txt' }); // sem botão "li!" (a Bea tirou: a criança só clicava sem ler); estrela de estudo vem de quiz (Teoria)
  const desenha = () => {
    if (tipo === 'dica') { const [tema, t] = DICAS_MUSICAIS[di % DICAS_MUSICAIS.length]; tag.textContent = `dica do Paul · ${tema}`; txt.textContent = t; }
    else { const [quem, toca, t] = CURIOSIDADES[ci % CURIOSIDADES.length]; tag.textContent = `curiosidade de músico · ${quem} (${toca})`; txt.textContent = t; }
  };
  const outra = h('button', { type: 'button', class: 'btn small ghost', onclick: () => { if (tipo === 'dica') { tipo = 'curiosidade'; ci++; } else { tipo = 'dica'; di++; } desenha(); } }, 'outra ›');
  desenha();
  const hero = h('div', { class: 'hj-hero hj-fala' }, h('img', { src: corSrc('professor'), alt: '', draggable: 'false' }),
    h('div', { class: 'hj-bub', role: 'status', 'aria-live': 'polite' }, tag, txt, h('div', { class: 'hj-dica-b' }, outra)));
  const tile = (href, pose, nome, sub, vid) => h('a', { class: `hj-tile${lock(href) ? ' locked' : ''}`, href, onclick: () => { if (vid) marcarVisto(vid); }, 'aria-label': lock(href) ? `${nome}, só pra alunos com código` : nome },
    h('img', { class: 'hj-tp', src: corSrc(pose), alt: '', draggable: 'false', decoding: 'async' }), h('b', {}, nome, lock(href) ? ' 🔒' : '', vid && v.includes(vid) ? ' ✓' : ''), h('small', {}, sub));
  const duplo = h('div', { class: 'hj-tile hj-duplo', role: 'group', 'aria-label': 'acordes e ritmos' }, h('img', { class: 'hj-tp', src: corSrc('guitarra'), alt: '', draggable: 'false', decoding: 'async' }), h('b', {}, 'acordes e ritmos'),
    h('span', { class: 'hj-duplo-b' }, h('a', { href: '#/estudos/acordes/violao' }, 'acordes'), h('a', { href: '#/estudos/ritmos' }, 'ritmos')));
  const chips = h('div', { class: 'hj-exp' }, h('h2', {}, 'estude agora'),
    h('div', { class: 'hj-big' }, tile('#/dicionario', 'lendo-partitura', 'dicionário musical', 'busque um termo', 'dicionario'), tile('#/estudos/aulas', 'professor', 'robôterista ensina', 'teoria, bateria, teclado e violão', 'aulas'), duplo, tile('#/jogos/relatorio', 'oculos', 'jogos ensinam', 'pra que serve cada jogo', 'ensinam')),
    h('div', { class: 'hj-chips' }, ...[['#/estudos/dicas', 'todas as dicas'], ['#/estudos/curiosidades', 'todas as curiosidades']].map(([href, nome]) => h('a', { class: `hj-chip${lock(href) ? ' locked' : ''}`, href, 'aria-label': lock(href) ? `${nome}, só pra alunos com código` : nome }, `${nome}${lock(href) ? ' 🔒' : ''}`))));
  const sorte = h('div', { class: 'hj-roleta' }, h('span', { 'aria-hidden': 'true' }, '🎡'), h('b', { class: 'hj-rt' }, 'a cada 15 ★ você ganha um giro na roleta'));
  view.append(h('div', { class: 'pad-x hj', style: 'display:grid;gap:11px' }, h('div', { class: 'hj-top' }, h('h1', {}, 'ESTUDOS'), h('span', {}, `${DIAS[new Date().getDay()]}, bora?`)), hero, chips, sorte));
  import('./figurinhas/estrelas.js').then(async (E) => { try { const P = await import('./kids/progress.js'); const me = P.active(); if (!me) return; const f = E.faltamParaRoleta(E.estrelasTotais(me.id)); const el = sorte.querySelector('.hj-rt'); if (el && f) el.textContent = `faltam ${f} ★ pra roleta`; } catch { /* sem o álbum */ } }).catch(() => {});
}

/** Aulas do Paul: lista das 4 aulas (as 3 novas e a das figuras rítmicas). */
/** Botão fixo "‹ jogos" (embaixo, à esquerda) dentro de qualquer jogo: volta sempre pra lista. Some nas telas de jogo cheias (rz-lock) pelo CSS. */
function voltarJogos(on) {
  let b = document.getElementById('voltar-jogos');
  if (!on) { if (b) b.hidden = true; return; }
  if (!b) { b = h('a', { id: 'voltar-jogos', class: 'voltar-jogos', href: '#/jogos', 'aria-label': 'voltar pra lista de jogos' }, '‹ jogos'); document.body.append(b); }
  b.hidden = false;
}
function aulasView(view) {
  const lk = (href, t, sub, tempo, cor, pose, adv) => h('a', { class: `al-aula al-aula-${cor}`, href }, h('img', { class: 'al-aula-paul', src: corSrc(pose), alt: '', draggable: 'false' }), adv ? h('img', { class: 'al-aula-adv', src: stkSrc(adv), alt: '', draggable: 'false' }) : null,
    h('span', { class: 'al-aula-txt' }, h('b', {}, t), h('small', {}, `${sub} · ${tempo}`), !AC.liberado() ? h('em', {}, 'grátis: a 1ª fase') : null), h('i', { class: 'al-aula-go', 'aria-hidden': 'true' }, '▶'));
  // Pedido da Bea (15/nov/2026): "teoria" (5 temas × 30 aulinhas) e uma aula de 30 aulinhas pra cada instrumento (bateria, teclado, violão), tudo AQUI.
  const inst = ['bateria', 'teclado', 'violao'].map((id) => { const a = AULAS[id]; const [tem, max] = estrelasTema(sessaoPorId(id)); return lk(`#/estudos/aulas/${id}`, a.titulo, '30 aulinhas · 6 fases', `★ ${tem}/${max}`, a.cor, a.pose, a.adesivos[0]); });
  view.append(banner('Robôterista ensina', 'ouça, entenda e toque'), h('div', { class: 'pad-x', style: 'display:grid;gap:14px' }, h('a', { class: 'jg-link', href: '#/estudos' }, '‹ estudos'),
    h('h2', { class: 'al-sec' }, 'teoria · 150 aulinhas'), ...cartoesDosTemas(),
    h('h2', { class: 'al-sec' }, 'instrumentos · 90 aulinhas'), ...inst));
}
/** Curiosidades de músicos: uma por vez, com "outra" e "anterior". Conta pra meta do dia. */
/** Pergunta rápida depois de ler a curiosidade: "que instrumento essa pessoa toca?" (1 ★, uma vez por curiosidade). */
async function perguntaCuriosidade(i) {
  const n = CURIOSIDADES.length; const k = ((i % n) + n) % n; const [quem, ins] = CURIOSIDADES[k]; const P = await import('./views/estudos-prova.js');
  const outros = P.sorteia([...new Set(CURIOSIDADES.map((x) => x[1]).filter((x) => x !== ins))]).slice(0, 3);
  P.abrirProva({ chave: `curio|${k}`, titulo: 'curiosidade', max: 1, rodadas: [{ enun: `${quem} toca o quê?`, opcoes: [ins, ...outros].map((x) => ({ rot: x, ok: x === ins })) }] });
}
function curiosidadesView(view) {
  let i = curiosidadeDeHoje();
  const nome = h('h2', { class: 'tag' }); const inst = h('p', { class: 'es-tag' }); const txt = h('p', { class: 'es-dica' }); const pos = h('small', { class: 'muted' });
  const draw = () => { const [n, ins, t] = CURIOSIDADES[((i % CURIOSIDADES.length) + CURIOSIDADES.length) % CURIOSIDADES.length]; nome.textContent = n; inst.textContent = ins; txt.textContent = t; pos.textContent = `${(((i % CURIOSIDADES.length) + CURIOSIDADES.length) % CURIOSIDADES.length) + 1} de ${CURIOSIDADES.length}`; marcarEstudo('curiosidade'); marcarVisto('curiosidades'); };
  view.append(banner('Curiosidades de músicos', 'quem tocou antes de você'), h('div', { class: 'pad-x', style: 'display:grid;gap:12px' }, h('a', { class: 'jg-link', href: '#/estudos' }, '‹ estudos'),
    h('article', { class: 'card pad es-cur' }, inst, nome, txt, pos),
    h('div', {}, h('button', { type: 'button', class: 'btn small', onclick: () => perguntaCuriosidade(i) }, '🎯 pergunta rápida · 1 ★')),
    h('div', { class: 'row', style: 'gap:8px' }, h('button', { type: 'button', class: 'btn', onclick: () => { i--; draw(); } }, '‹ anterior'), h('button', { type: 'button', class: 'btn primary', style: 'flex:1', onclick: () => { i++; draw(); } }, 'outra curiosidade ›'))));
  draw();
}

/** Dicas do método pra estudar (só com código): a lista inteira, uma por cartão. Os jogos com elas ficam na aba Jogos > Letras. */
/** Pergunta rápida da dica: completa a frase com a palavra que falta (1 ★, uma vez por dica). */
async function perguntaDica(num) {
  const [P, M, T] = await Promise.all([import('./views/estudos-prova.js'), import('./views/dicas.js'), import('./tips.js')]); const its = M._duelo.items(); const idx = its.findIndex((x) => x.n === num);
  if (idx < 0) { toast('essa dica não tem pergunta ainda'); return; }
  const q = T.question(its, 'blank', () => (idx + 0.5) / its.length);
  P.abrirProva({ chave: `dica|${num}`, titulo: `dica ${num}`, max: 1, rodadas: [{ enun: h('span', {}, 'que palavra completa a dica?', h('em', { style: 'font-weight:600;font-style:normal;display:block;margin-top:6px' }, q.prompt)), opcoes: q.options.map((o) => ({ rot: o.label, ok: o.id === q.ans })) }] });
}
function dicasEstudoView(view) {
  const box = h('div', { class: 'pad-x', style: 'display:grid;gap:10px' }, h('p', { class: 'muted' }, 'carregando as dicas…'));
  view.append(banner('Dicas do método', 'pra estudar com calma'), box); let dead = false;
  DA.carregar(CODE.saved()).finally(() => {
    if (dead) return; const list = tipList();
    box.replaceChildren(h('a', { class: 'jg-link', href: '#/estudos' }, '‹ estudos'),
      ...(list.length ? list.map((t) => h('article', { class: 'card pad dc-tipbox' }, h('p', { class: 'dc-n' }, `dica ${t.n} de ${list.length}`), h('p', { class: 'dc-text' }, t.text), h('button', { type: 'button', class: 'btn small', onclick: () => perguntaDica(t.n) }, '🎯 pergunta rápida · 1 ★'))) : [h('p', { class: 'muted' }, 'as dicas ainda não chegaram. abra o app com internet e volte aqui.')]),
      h('a', { class: 'btn small', href: '#/dicas' }, 'jogar com as dicas (Letras)'));
  });
  return () => { dead = true; };
}

/** Lojinha (em construção): exercícios, atividades pra imprimir e o código de acesso. Por enquanto avisa que vem aí e deixa digitar um código que já tem. */
function lojinhaView(view, parts = []) {
  // os depoimentos (só texto) aparecem com a lojinha aberta (LOJA_ABERTA em js/loja-config.js)
  const aba = LOJA_ABERTA && parts[0] === 'depoimentos' ? parts[0] : 'loja';
  const secaoLoja = ['cards', 'ensina', 'evoluir'].includes(parts[0]) ? parts[0] : ''; // `#/lojinha/<seção>` abre os produtos daquela seção
  const abas = h('div', { class: 'al-subnav lj-abas', role: 'tablist', 'aria-label': 'Lojinha' }, ...[['loja', '#/lojinha', 'lojinha'], ['depoimentos', '#/lojinha/depoimentos', 'depoimentos']].map(([k, href, t]) => h('a', { href, role: 'tab', 'aria-selected': String(aba === k), class: `chip-btn${aba === k ? ' on' : ''}` }, t)));
  if (aba !== 'loja') { const box = h('div', { class: 'pad-x' }); view.append(banner('Lojinha', 'quem já estuda com a Beaterista'), abas, box); import('./views/lojinha-prova.js').then((m) => box.replaceChildren(m.depoimentos())); return () => {}; }
  let gone = false; const msg = h('p', { class: 'al-lock-msg', role: 'status', 'aria-live': 'polite' });
  const inp = h('input', { class: 'field al-cod', type: 'text', maxlength: 14, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'CÓDIGO DE ACESSO', 'aria-label': 'Código de acesso' });
  const entrar = async () => { msg.textContent = 'conferindo…'; try { if (await CODE.entrar(inp.value)) { AC.definir(true); msg.textContent = 'liberado! 🎉'; setTimeout(() => { if (!gone) location.hash = '#/jogos'; }, 700); } else msg.textContent = CODE.msgFalha(); } catch { msg.textContent = 'sem internet agora. tente de novo.'; } };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') entrar(); });
  // enquanto a lojinha não abre: a aluna ainda pode pedir um código pra professora Bea cadastrar (aparece nas telas trancadas e no Perfil)
  const pedido = h('div', { class: 'al-pedido' });
  const drawPedido = () => { const c = CODE.pendente(); pedido.replaceChildren(c ? h('div', {}, h('p', { class: 'al-lock-l' }, 'seu código'), h('div', { class: 'al-lock-code' }, c), h('p', { class: 'al-lock-t' }, 'informe a professora Bea')) : h('button', { class: 'btn small ghost', type: 'button', onclick: () => { CODE.pedir(); drawPedido(); } }, 'pedir o código pra professora Bea')); };
  drawPedido();
  const vitrineBox = h('div');
  if (LOJA_ABERTA) import('./views/lojinha-vitrine.js').then((m) => { if (!gone) vitrineBox.replaceChildren(m.vitrine(secaoLoja)); });
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
  view.append(banner('Palco', 'bateria, cordas, teclas e percussão'), h('div', { class: 'pad-x' }, deckView()));
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
        if (!(await CODE.verificar(c))) { err.textContent = CODE.msgFalha(); return; }
        CONTAS.ativar({ nome: n, code: c }); try { await ALBUMACESSO.entrar(c); } catch { /* o álbum confere de novo na próxima vez */ }
        CONTAS.guardarConta({ nome: n, code: c }); toast(`${n} conectado`); close(); location.reload();
      } catch { err.textContent = 'sem internet agora. tente de novo.'; } finally { b.disabled = false; }
    }
    return h('div', { class: 'sheet-body' },
      atual.nome ? h('p', { class: 'muted' }, `agora: ${atual.nome}`) : null,
      contas.length ? h('div', {}, h('b', {}, 'voltar pra'), listaCurta(contas.map((c) => h('div', { class: 'row', style: 'gap:8px;margin:6px 0' },
        h('button', { type: 'button', class: 'btn primary', style: 'flex:1', onclick: () => ir(c) }, c.nome),
        h('button', { type: 'button', class: 'btn small ghost', 'aria-label': `Tirar ${c.nome} da lista`, onclick: async (ev) => { if (await confirmSheet('tirar da lista?', `${c.nome} some daqui; o código dele continua valendo.`, 'tirar')) { CONTAS.esquecer(c.code); ev.target.closest('.row').remove(); } } }, '✕'))))) : null,
      h('b', {}, 'conectar outro código'), h('p', { class: 'muted' }, 'um aluno novo neste aparelho: nome e código. cada um fica com as suas figurinhas e a sua foto.'), nome, cod,
      h('button', { type: 'button', class: 'btn primary wide', onclick: conectar }, 'conectar'), err,
      h('button', { type: 'button', class: 'btn ghost wide', onclick: async () => { if (!(await confirmSheet('entrar com outro nome?', 'o código deste aparelho sai e quem entrar precisa pedir um código. dá pra voltar pra este aluno depois pela lista.', 'continuar'))) return; CONTAS.semConta(); close(); location.reload(); } }, 'entrar com outro nome (ainda sem código)'));
  });
}

/** Compartilhar o jogo (o link da área dos alunos): folha de compartilhar do celular; sem ela, copia o link. Nada do aluno vai junto (nem nome, nem código). */
const LINK_JOGO = 'https://jogos.beaterista.com.br';
async function compartilharJogo() {
  const texto = 'jogos de música pra aprender brincando, da Beaterista escola de música: bora jogar?';
  try { if (navigator.share) { await navigator.share({ title: 'Beaterista · jogos de música', text: texto, url: LINK_JOGO }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(`${texto} ${LINK_JOGO}`); toast('link copiado! cole e mande pra quem você quiser.'); } catch { toast(LINK_JOGO, { ms: 6000 }); }
}
/** Sair: este aparelho esquece o nome e o código (a vaga do código é liberada). Dá pra voltar depois pela lista do "trocar aluno". */
async function sairDoApp() {
  if (!(await confirmSheet('sair?', 'este aparelho esquece o nome e o código. pra voltar é só escolher o seu nome na lista do "trocar aluno" ou digitar o código de novo.', 'sair'))) return;
  CONTAS.semConta(); location.reload();
}
/** Opções do topo: trocar aluno · compartilhar jogo · sair, com o nome e o código de quem está jogando. */
function opcoes(name) {
  sheet('opções', (close) => {
    const code = CODE.saved();
    const bt = (rot, fn, cls = 'btn wide') => h('button', { type: 'button', class: cls, onclick: () => { close(); fn(); } }, rot);
    return h('div', { class: 'sheet-body al-opcoes' },
      h('p', { class: 'al-quem' }, h('b', {}, name), code ? h('span', {}, `código ${CODE.mascarar(code)}`) : h('span', {}, 'ainda sem código')),
      bt('👤 trocar aluno', trocarAluno), bt('↗ compartilhar jogo', compartilharJogo, 'btn wide primary'),
      code ? null : bt('🔑 tenho código', abrirCodigo),
      bt('🚪 sair', sairDoApp, 'btn wide ghost'),
      h('small', { class: 'muted al-termo' }, TERMO_DE_USO),
      code ? h('small', { class: 'muted' }, 'o seu nome e o código ficam salvos neste aparelho: da próxima vez você entra direto. por segurança o código nunca aparece inteiro na tela.') : null);
  });
}

/** "tenho código": folha rápida (aberta do topo de qualquer tela) pra digitar o código de acesso sem procurar a Lojinha. */
function abrirCodigo() {
  sheet('já tenho meu código', (close) => {
    const msg = h('p', { class: 'al-lock-msg', role: 'status', 'aria-live': 'polite' });
    const inp = h('input', { class: 'field al-cod', type: 'text', maxlength: 14, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'CÓDIGO DE ACESSO', 'aria-label': 'Código de acesso' });
    const entrar = async () => { msg.textContent = 'conferindo…'; try { if (await CODE.entrar(inp.value)) { AC.definir(true); msg.textContent = 'liberado! 🎉'; setTimeout(close, 700); } else msg.textContent = CODE.msgFalha(); } catch { msg.textContent = 'sem internet agora. tente de novo.'; } };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') entrar(); });
    return h('div', { class: 'sheet-body' }, h('p', { class: 'muted' }, 'digite o código que a professora Bea te passou.'), h('div', { class: 'al-lock-row' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: entrar }, 'liberar')), msg,
      h('p', { class: 'muted' }, 'ainda não tem? ', h('a', { href: '#/lojinha', onclick: close }, 'veja a Lojinha')));
  });
}

function shell(name) {
  const view = h('main', { id: 'view', tabindex: '-1' });
  const nav = h('nav', { class: 'bottom-nav', 'data-n': NAV.length, style: `grid-template-columns: repeat(${NAV.length}, 1fr)`, 'aria-label': 'Navegação' });
  const tenhoCodigo = h('button', { type: 'button', class: 'btn small al-tenho', onclick: abrirCodigo, hidden: AC.liberado(), 'aria-label': 'tenho código de acesso', title: 'tenho código' }, iconeTopo('chave'));
  document.addEventListener('aluno-acesso', (ev) => { tenhoCodigo.hidden = !!(ev.detail); });
  if (!window.__salvarLigado) { window.__salvarLigado = true; SALVAR.ligar({ nome: () => { try { return localStorage.getItem(NAME_KEY) || ''; } catch { return window.__alunoNome || ''; } } }); }
  // código no topo: só a 1ª e a última letra; o olhinho mostra o código inteiro por uns segundos e volta a esconder (pedido da Bea, 19/nov/2026)
  const codigoTopo = h('small', { class: 'al-cod-top' }); let verCodigo = false; let tmCodigo = 0;
  const olhoCodigo = h('button', { type: 'button', class: 'cod-olho', onclick: () => { verCodigo = !verCodigo; clearTimeout(tmCodigo); if (verCodigo) tmCodigo = setTimeout(() => { verCodigo = false; pintaCodigo(); }, 8000); pintaCodigo(); } });
  function pintaCodigo() {
    const c = CODE.saved();
    if (!c) { codigoTopo.replaceChildren('sem código'); return; }
    olhoCodigo.replaceChildren(iconeTopo(verCodigo ? 'olhoOff' : 'olho')); olhoCodigo.setAttribute('aria-pressed', String(verCodigo)); olhoCodigo.setAttribute('aria-label', verCodigo ? 'esconder o código' : 'mostrar o código inteiro'); olhoCodigo.title = verCodigo ? 'esconder o código' : 'ver o código';
    codigoTopo.replaceChildren(h('span', { class: 'cod-txt' }, `código ${verCodigo ? c : CODE.mascarar(c)}`), olhoCodigo);
  }
  pintaCodigo(); document.addEventListener('aluno-acesso', () => { verCodigo = false; pintaCodigo(); });
  // a foto que a pessoa pôs no Perfil (só neste aparelho); sem foto, o Paul. Tocar nela abre a aba Perfil.
  const fotoTopo = h('img', { src: corSrc('ouvindo'), alt: '', width: 46, height: 46, draggable: 'false' });
  const avatarTopo = h('a', { class: 'top-av', href: '#/perfil', 'aria-label': 'meu perfil: ver e trocar a minha foto', title: 'meu perfil' }, fotoTopo);
  let urlFotoTopo = '';
  const pintaFotoTopo = async () => {
    try {
      const D = await import('./figurinhas/dono.js'); const b = await D.metaLer('perfil-foto');
      if (urlFotoTopo) { URL.revokeObjectURL(urlFotoTopo); urlFotoTopo = ''; }
      if (b) { urlFotoTopo = URL.createObjectURL(b); fotoTopo.src = urlFotoTopo; avatarTopo.classList.add('com-foto'); } else { fotoTopo.src = corSrc('ouvindo'); avatarTopo.classList.remove('com-foto'); }
    } catch { /* sem foto: fica o Paul */ }
  };
  pintaFotoTopo(); window.addEventListener('bt-foto-perfil', pintaFotoTopo);
  const head = h('header', { class: 'top top-a' }, // topo da Bea (opção A, 19/nov/2026): Paul, etiqueta amarela com o nome e botões redondos de ícone de linha
    avatarTopo,
    h('div', { class: 'ws', style: 'flex:1' }, h('span', { class: 'on al-quem-top', style: 'padding:5px 12px' }, h('span', {}, (() => { const me = P.profiles().find((p) => p.name.toLowerCase() === name.toLowerCase()); const t = me ? PL.titleOf(me.id) : ''; return t ? `${name} · ${t}` : name; })()), codigoTopo)),
    tenhoCodigo,
    soundButton({ linha: true }), musicButton('icon-btn top-snd top-mus', { linha: true }), atualizarButton({ linha: true }),
    h('button', { type: 'button', class: 'btn small ghost al-opt', 'aria-label': 'opções: trocar aluno, compartilhar jogo, sair', title: 'opções', onclick: () => opcoes(name) }, iconeTopo('engrenagem')));
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch { /* sem pedido de armazenamento fixo */ } // pede pro navegador não apagar o nome e o código salvos
  app.replaceChildren(h('div', { class: 'topwrap' }, head), view, nav);

  // "voltar para ___": quem sai de uma área sem querer (toca na barra de baixo, num atalho...) vê no topo o caminho de volta pro lugar onde estava
  let atual = null; let voltarA = null; let voltouNaFaixa = false;
  function go() {
    cleanup && cleanup(); cleanup = null; closeSheets(); silence(); view.replaceChildren();
    const r = route(); view.dataset.page = r.name; inicio.marcaDia();
    { const tab = tabOf(r); const jg = (() => { try { return jogos.jogoDoEndereco(location.hash); } catch { return null; } })(); const nome = jg ? jg[1] : (NAV.find(([hr]) => hr === `#/${tab}`) || [])[2] || 'o app';
      if (voltouNaFaixa) { voltouNaFaixa = false; voltarA = null; } // tocou em "voltar para": chegou lá, a faixa some (não fica indo e voltando)
      else if (atual && atual.hash !== location.hash) { if (atual.tab !== tab) voltarA = { hash: atual.hash, nome: atual.nome, tab: atual.tab }; else if (voltarA && voltarA.hash === location.hash) voltarA = null; }
      if (voltarA && voltarA.tab === tab) voltarA = null; atual = { hash: location.hash, tab, nome }; }
    { let t = ''; try { t = localStorage.getItem('beaterista-album-tema') || 'holo'; } catch { t = 'holo'; } if (r.name === 'album') document.documentElement.dataset.alb = ['neon', 'prata', 'holo', 'ouro', 'gelo'].includes(t) ? t : 'holo'; else delete document.documentElement.dataset.alb; document.documentElement.classList.toggle('perfil-pass', r.name === 'perfil'); } // aba Álbum com visual próprio (css/album-tema.css); o PERFIL tem o visual "carteirinha de backstage" (css/perfil-passe.css), escolhido pela Bea em 15/nov/2026
    // Dentro de um jogo a barra de baixo some (um toque perto da borda caía na Lojinha ou em outra aba sem querer). A lista de jogos e as outras telas continuam com a barra.
    { const emJogo = /^#\/(jogos\/[^/?]+|ritmo|paulta|kids\/[^/?]+|dicas\/[^/?]+)/.test(location.hash) && !/^#\/jogos\/?(\?|$)/.test(location.hash); document.documentElement.classList.toggle('em-jogo', emJogo); voltarJogos(emJogo); }
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
    else if (r.name === 'nagano') c = parceria.mount(view);
    else if (r.name === 'metronomo') c = metronome.mount(view);
    else if (r.name === 'ouvido') c = ouvido.mount(view);
    else if (r.name === 'foco') c = focus.mount(view);
    else if (r.name === 'tocar') tocarView(view);
    else if (r.name === 'estudos' && r.parts[0] === 'basica') c = teoriaBasica.mount(view, r.parts.slice(1), { aoFim: () => marcarEstudo('aula') });
    else if (r.name === 'estudos' && r.parts[0] === 'acordes') acordesView(view, r.parts.slice(1));
    else if (r.name === 'estudos' && r.parts[0] === 'ritmos') c = ritmosView(view);
    else if (r.name === 'estudos' && r.parts[0] === 'dicas') c = dicasEstudoView(view);
    else if (r.name === 'estudos' && r.parts[0] === 'aulas') c = r.parts[1] ? (AULAS[r.parts[1]] ? teoriaBasica.mount(view, [r.parts[1]], { aoFim: () => marcarVisto('aulas') }) : (location.hash = '#/estudos/aulas', null)) : aulasView(view);
    else if (r.name === 'estudos' && r.parts[0] === 'curiosidades') curiosidadesView(view);
    else if (r.name === 'estudos') { estudosView.reabrir = () => { view.replaceChildren(); estudosView(view); }; estudosView(view); }
    else if (r.name === 'erros') c = errosView(view);
    else if (r.name === 'inicio' && INICIO_ON) c = inicio.mount(view, { nome: getName() });
    else if (r.name === 'lojinha') c = lojinhaView(view, r.parts);
    else if (r.name === 'ritmo') c = ritmo.mount(view, { student: true, name: getName, parts: r.parts });
    else { location.hash = '#/jogos'; return; }
    if (r.name === 'album' && !(r.parts && r.parts[0] === 'Pacotes')) view.prepend(arteDoPaul('arte-album', 'jogue. colecione. complete seu álbum.', 'conheça as figurinhas da Beaterista', 'o Paul com uma figurinha na mão e o álbum aberto: jogue, colecione, complete seu álbum'));
    if (r.name === 'album' || r.name === 'perfil') { // 3 abas: ÁLBUM · ROLETA · PERFIL (a roleta é a aba "Pacotes" do álbum; o perfil mora junto)
      const roleta = r.name === 'album' && r.parts && r.parts[0] === 'Pacotes';
      let pend = 0; try { pend = FRpend() || 0; } catch { pend = 0; }
      const aba = (href, nome, on, ic, badge) => h('a', { href, role: 'tab', 'aria-selected': String(on), class: `chip-btn${on ? ' on' : ''}`, 'aria-label': badge ? `${nome}, ${badge} pra abrir` : nome }, h('span', { class: 'al-ic', 'aria-hidden': 'true' }, ic), nome, badge ? h('span', { class: 'al-badge', 'aria-hidden': 'true' }, String(badge)) : null);
      view.prepend(h('div', { class: 'al-subnav', role: 'tablist', 'aria-label': 'Álbum, stars e perfil' }, aba('#/album', 'álbum', r.name === 'album' && !roleta, '📔'), aba('#/album/Pacotes', 'stars', roleta, '⭐️', pend), aba('#/perfil', 'perfil', r.name === 'perfil', '📸')));
    }
    if (voltarA && !/^#\/(jogos\/[^/?]+|ritmo|paulta|kids\/[^/?]+|dicas\/[^/?]+)/.test(location.hash)) { const vA = voltarA; view.prepend(h('a', { class: 'al-voltar', href: vA.hash, onclick: () => { voltouNaFaixa = true; } }, `‹ voltar para ${vA.nome}`)); } // dentro de um jogo já existe o botão flutuante "‹ jogos"
    cleanup = typeof c === 'function' ? c : null;
    window.scrollTo(0, 0);
  }
  addEventListener('hashchange', go);
  // Voltar arrastando: no app instalado na tela inicial do iPhone NÃO existe o gesto de voltar do navegador. Arrastar do cantinho esquerdo pra direita = voltar uma tela
  // (só se começar bem na borda e for um arrasto reto, pra não atrapalhar quem arrasta peças, notas ou palavras).
  { let g0 = null; const emBorda = (t) => t.clientX <= 22;
    document.addEventListener('touchstart', (e) => { const t = e.touches && e.touches[0]; g0 = e.touches.length === 1 && t && emBorda(t) ? { x: t.clientX, y: t.clientY, ok: true } : null; }, { passive: true });
    document.addEventListener('touchend', (e) => { if (!g0) return; const t = e.changedTouches && e.changedTouches[0]; const dx = t ? t.clientX - g0.x : 0, dy = t ? Math.abs(t.clientY - g0.y) : 99; g0 = null; if (dx > 70 && dy < 50 && history.length > 1 && !document.querySelector('dialog[open], .sheet-back')) history.back(); }, { passive: true }); }
  // tocar na aba em que a pessoa JÁ está (mesmo endereço) não dispara hashchange: recarrega a tela, senão o botão parece quebrado (ex.: voltar da roleta pro álbum)
  document.addEventListener('click', (ev) => { const a = ev.target && ev.target.closest ? ev.target.closest('a[href^="#/"]') : null; if (a && a.getAttribute('href') === location.hash && (nav.contains(a) || a.closest('.al-subnav'))) go(); });
  document.addEventListener('aluno-acesso', () => go());
  go();
}

function askName() {
  document.documentElement.classList.add('en-on'); // fundo escuro da entrada nova (js/entrada.js)
  const pedido = h('div', { class: 'en-pedido', role: 'status' });
  const drawPedido = () => { const c = CODE.pendente(); pedido.replaceChildren(...(c ? [h('p', {}, 'seu código: ', h('b', {}, c)), h('p', { class: 'muted' }, 'informe à professora. você já pode entrar agora.')] : [])); };
  drawPedido();
  let indo = false;
  // comCodigo = true: "já sou aluno" (confere o código); false: "experimentar grátis" (só o nome, modo livre)
  const entrar = async (nomeV, codV, comCodigo, err) => { if (indo) return; indo = true; try {
    const n = cleanName(nomeV);
    if (n.length < 2) { err.textContent = 'escreva pelo menos 2 letras.'; return; }
    const modo = (comCodigo && CODE.norm(codV).length >= 4) || CODE.pendente() ? 'codigo' : 'sem código';
    if (comCodigo && modo !== 'codigo') { err.textContent = 'digite o seu código de aluno (4 a 12 letras e números).'; return; }
    if (modo === 'codigo') {
      if (!CODE.pendente()) {
        err.textContent = 'conferindo o código…';
        try { if (!(await CODE.entrar(codV))) { err.textContent = CODE.msgFalha(); return; } } catch { err.textContent = 'sem internet agora. tente de novo.'; return; }
      }
      err.textContent = '';
    }
    const o = modo === 'codigo' ? (CODE.pendente() ? 'pediu código de acesso' : 'aluno beaterista (código de acesso)') : 'não informou';
    try { localStorage.setItem(ORIGEM_KEY, o); } catch { window.__alunoOrigem = o; }
    logVisit(n); if (modo === 'codigo' && !CODE.pendente()) { SALVAR.agendar(); CONTAS.guardarConta({ nome: n, code: CODE.saved() }); }
    try { localStorage.setItem(NAME_KEY, n); } catch { window.__alunoNome = n; }
    start();
  } catch (ex) { err.textContent = `deu erro: ${String((ex && ex.message) || ex).slice(0, 140)}`; console.error(ex); } finally { indo = false; } };
  // Lojinha clicável já na entrada: entra como visitante (nada é guardado) e abre a aba Lojinha
  const lojinha = () => { window.__alunoNome = 'visitante'; location.hash = '#/lojinha'; start(); };
  const E = entradaNova({ links: LINKS, pedido, onExperimentar: (nome, err) => entrar(nome, '', false, err), onEntrar: (nome, cod, err) => entrar(nome, cod, true, err), onLojinha: lojinha });
  app.replaceChildren(h('main', { class: 'login al-entry en-main' }, E.el));
  window.scrollTo(0, 0);
}

/** Ao abrir: o código guardado (ou o pedido que a professora já cadastrou) ainda vale? */
async function refreshAccess() {
  try { let ok = await CODE.revalidar(); if (!ok && CODE.pendente()) ok = await CODE.conferirPedido().catch(() => false); AC.definir(ok); } catch { AC.definir(false); }
}

async function start() {
  document.documentElement.classList.remove('en-on');
  const name = getName() || window.__alunoNome || '';
  if (!name) { askName(); return; }
  await ensureKidsPlayer(name);
  logVisit(name);
  await refreshAccess();
  if (CODE.saved()) { await PROG.puxar(); PROG.iniciar(); } // progresso na nuvem: traz o de outro aparelho ANTES de desenhar as telas (js/progresso-nuvem.js)
  try { if (AC.liberado()) CONTAS.guardarAtual(); } catch { /* ok */ } // quem entrou direto já fica salvo na lista de alunos do aparelho
  shell(name);
  sendScores();
  store.subscribe((i) => { if (!i.kind || i.kind === 'setting') sendScores(); });
}

(async () => {
  if ('serviceWorker' in navigator) {
    // Versão nova do app: quando o service worker novo assume, recarrega sozinho (fora de um jogo; dentro de um jogo espera sair), e procura versão nova sempre que o app volta pra tela.
    const tinha = !!navigator.serviceWorker.controller; let recarregar = false;
    const atualizar = () => { try { sessionStorage.setItem('bt-atualizou', '1'); } catch { /* ok */ } location.reload(); };
    const tenta = () => { if (!recarregar) return; if (document.documentElement.classList.contains('em-jogo')) return; atualizar(); };
    // pedido da Bea: quando tem coisa nova o app AVISA o aluno e mostra o botão "atualizar" (ao trocar de tela fora de um jogo ele também atualiza sozinho)
    const avisaNovidade = () => { if (document.querySelector('.atualiza-bar')) return; document.body.append(h('div', { class: 'atualiza-bar', role: 'status', 'aria-live': 'polite' }, h('span', {}, 'tem coisa nova no app!'), h('button', { class: 'btn small primary', type: 'button', onclick: atualizar }, 'atualizar'))); };
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (tinha) { recarregar = true; avisaNovidade(); } });
    try { if (sessionStorage.getItem('bt-atualizou') === '1') { sessionStorage.removeItem('bt-atualizou'); setTimeout(() => toast('app atualizado! tem novidade pra você ✨', { ms: 4500 }), 1200); } } catch { /* ok */ }
    addEventListener('hashchange', () => setTimeout(tenta, 300));
    navigator.serviceWorker.register('sw.js').then((reg) => { document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); }); }).catch(() => {});
  }
  try { await store.init(); } catch {
    app.replaceChildren(h('main', { class: 'login' }, h('div', { class: 'login-card' }, h('h1', {}, 'Armazenamento indisponível'), h('p', {}, 'Este navegador bloqueou o armazenamento local (modo privado?). Abra no Safari normal.')))); return;
  }
  // Link "reinicia a entrada" (jogos.beaterista.com.br/?entrar): quem só tinha EXPERIMENTAR (nome, sem código) sai do modo experimento e vê a tela de entrada limpa;
  // quem já é aluno (tem código guardado ou pedido) NUNCA é desconectado e cai direto na aba principal (Jogos). Em qualquer caso, depois de entrar o destino é a aba principal.
  try {
    const q = new URLSearchParams(location.search);
    if (q.has('entrar')) {
      if (!CODE.saved() && !CODE.pendente()) { try { localStorage.removeItem(NAME_KEY); localStorage.removeItem(ORIGEM_KEY); } catch { /* ok */ } window.__alunoNome = ''; }
      q.delete('entrar'); const resto = q.toString();
      history.replaceState(null, '', `${location.pathname}${resto ? `?${resto}` : ''}#/jogos`);
    }
  } catch { /* link comum: segue normal */ }
  startScroller();
  // a nuvem só aparece nas abas e na escolha de jogo; dentro de jogo, aula ou instrumento não (cobria botões como o STOP)
  startPaul({ first: 7000, allowed: () => !document.querySelector('.al-entry, .login') && /^(#\/?(inicio|estudos|tocar|album|lojinha|perfil)\/?)$/.test(location.hash) });
  start();
})();
