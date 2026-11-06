// Área do aluno (aluno.html): sem login. O aluno escolhe um nome, joga os Jogos de ritmo e o Kids e aparece no ranking que todos veem.
// Tudo que ele faz fica só no aparelho dele (armazenamento separado do app da Bea); só o nome e as pontuações vão pro ranking.
import { h, icon } from './util.js';
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
import * as perfil from './views/perfil.js';
import { banner, closeSheets, confirmSheet, sheet, toast } from './ui.js';
import * as CONTAS from './contas.js';
import * as ALBUMACESSO from './figurinhas/acesso.js';
import { silence } from './audio.js';
import { startScroller } from './scroller.js';
import { startPaul } from './paul-talk.js';

const app = document.getElementById('app');
const NAME_KEY = 'beaterista-aluno-nome';
const NAV = [['#/jogos', 'bulb', 'Jogos'], ['#/estudos', 'study', 'Estudos'], ['#/tocar', 'nota', 'Tocar'], ['#/album', 'gallery', 'Álbum'], ['#/perfil', 'id', 'Perfil']]; // lâmpada, livro, nota musical, galeria e carteirinha
const TAB_OF = { toque: 'tocar', piano: 'tocar', violao: 'tocar', xilofone: 'tocar', roleta: 'tocar', kids: 'jogos', ritmo: 'jogos', dicionario: 'estudos', paulta: 'jogos', dicas: 'estudos', erros: 'estudos' };
/** Aba que acende pra tela atual: a aulinha do Paul e o relatório "Jogos Ensinam" moram em Estudos. */
const tabOf = (r) => ((r.name === 'kids' && r.parts[0] === 'figuras' && r.parts[1] === 'aula') || (r.name === 'jogos' && r.parts[0] === 'relatorio') ? 'estudos' : (TAB_OF[r.name] || r.name)); // telas que acendem outra aba (todos os jogos moram na aba Jogos)
let cleanup = null;
document.documentElement.classList.add('aluno-on');

const ID_KEY = 'beaterista-aluno-id';
const visitorId = () => { try { let v = localStorage.getItem(ID_KEY); if (!v) { v = crypto.randomUUID(); localStorage.setItem(ID_KEY, v); } return v; } catch { return crypto.randomUUID(); } };
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
function lockView(view, what) {
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
        : [h('button', { class: 'btn primary wide', type: 'button', onclick: () => { CODE.pedir(); draw(); start(); } }, 'gerar meu código')]),
      msg, h('details', { class: 'al-lock-have' }, h('summary', {}, 'já tenho um código'), h('div', { class: 'al-lock-row' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: enter }, 'liberar'))));
  };
  const start = () => { clearInterval(timer); if (CODE.pendente()) timer = setInterval(() => { if (!gone && !document.hidden) check(true); }, 8000); };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') enter(); });
  draw(); start();
  view.append(banner('Só pra alunos', 'libere com o seu código de acesso'), h('div', { class: 'pad-x' }, box));
  return () => { gone = true; clearInterval(timer); };
}
const NOMES_TELA = { ritmo: 'o Beat Hero', ranking: 'o Ranking', album: 'o Álbum', kids: 'o modo aventura (fases e estrelas)', dicionario: 'o Dicionário da bateria', dicas: 'o Quiz e Letras', paulta: 'a pauLta' };

/** Aba Estudos: 5 erros (aberto), Dicionário, Quiz e Letras e Aulinha do Paul (com código). */
function estudosView(view) {
  const item = (href, title, sub) => { const lk = AC.trancado(href); return h('a', { class: `card pad al-card${lk ? ' locked' : ''}`, href, 'aria-label': lk ? `${title}, só pra alunos com código` : null }, h('h2', { class: 'tag' }, lk ? '🔒 ' : '', title), h('p', { class: 'muted' }, sub)); };
  view.append(banner('Estudos', 'aprender com calma'), h('div', { class: 'pad-x', style: 'display:grid;gap:12px' },
    item('#/erros', '5 erros', 'material em PDF da professora Bea, aberto pra todo mundo'),
    item('#/dicionario', 'Dicionário musical', 'busca, explicação e exemplo tocando'),
    item('#/dicas/quiz', 'Quiz e Letras', 'quiz, caça-palavras e cruzadinha das dicas do método'),
    item('#/kids/figuras/aula', 'Aulinha do Paul', 'as figuras rítmicas, passo a passo')));
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

function shell(name) {
  const view = h('main', { id: 'view', tabindex: '-1' });
  const nav = h('nav', { class: 'bottom-nav', 'data-n': NAV.length, style: `grid-template-columns: repeat(${NAV.length}, 1fr)`, 'aria-label': 'Navegação' });
  const head = h('header', { class: 'top' },
    h('img', { src: 'assets/icons/tambor-menu.png', alt: '', width: 40, height: 40 }),
    h('div', { class: 'ws', style: 'flex:1' }, h('span', { class: 'on', style: 'padding:6px 12px' }, (() => { const me = P.profiles().find((p) => p.name.toLowerCase() === name.toLowerCase()); const t = me ? PL.titleOf(me.id) : ''; return t ? `oi, ${name} · ${t}` : `oi, ${name}!`; })())),
    soundButton(),
    h('button', { type: 'button', class: 'btn small ghost', onclick: trocarAluno }, 'trocar aluno'));
  app.replaceChildren(h('div', { class: 'topwrap' }, head), view, nav);

  function go() {
    cleanup && cleanup(); cleanup = null; closeSheets(); silence(); view.replaceChildren();
    const r = route(); view.dataset.page = r.name;
    nav.replaceChildren(...NAV.map(([href, ic, label]) => { const lk = AC.trancado(href); return h('a', { href, class: `nav-item${('#/' + tabOf(r)) === href ? ' on' : ''}${lk ? ' locked' : ''}`, 'aria-current': ('#/' + tabOf(r)) === href ? 'page' : null, 'aria-label': lk ? `${label} (com código)` : null }, icon(ic, 24), h('span', {}, label), lk ? h('i', { class: 'nav-lock', 'aria-hidden': 'true' }, '🔒') : null); }));
    let c;
    if (AC.trancado(location.hash)) c = lockView(view, NOMES_TELA[r.name] || (/^#\/jogos\/toca/.test(location.hash) ? 'o Toca Aqui' : 'esta parte'));
    else if (r.name === 'dicionario') c = dicionario.mount(view, r.parts);
    else if (r.name === 'dicas') { // Quiz e Letras: baixa as 30 dicas (só com código) e abre
      const box = h('div'); view.append(box); let inner = null; let dead = false;
      DA.carregar(CODE.saved()).finally(() => { if (!dead) inner = dicas.mount(box, r.parts); });
      c = () => { dead = true; if (typeof inner === 'function') inner(); };
    }
    else if (r.name === 'kids') c = kids.mount(view, r.parts);
    else if (r.name === 'paulta') c = paulta.mount(view, r.parts);
    else if (r.name === 'ranking') c = rankingView(view);
    else if (r.name === 'jogos') c = jogos.mount(view, r.parts);
    else if (r.name === 'album') c = album.mount(view, r.parts);
    else if (r.name === 'perfil') c = perfil.mount(view);
    else if (r.name === 'toque') c = toque.mount(view);
    else if (r.name === 'piano') c = piano.mount(view);
    else if (r.name === 'violao') c = violao.mount(view);
    else if (r.name === 'xilofone') c = xilofone.mount(view);
    else if (r.name === 'roleta') c = roleta.mount(view);
    else if (r.name === 'tocar') tocarView(view);
    else if (r.name === 'estudos') estudosView(view);
    else if (r.name === 'erros') c = errosView(view);
    else if (r.name === 'ritmo') c = ritmo.mount(view, { student: true, name: getName, parts: r.parts });
    else { location.hash = '#/jogos'; return; }
    cleanup = typeof c === 'function' ? c : null;
    window.scrollTo(0, 0);
  }
  addEventListener('hashchange', go);
  document.addEventListener('aluno-acesso', () => go());
  go();
}

function askName() {
  const input = h('input', { class: 'field', type: 'text', maxlength: 20, autocomplete: 'given-name', autocapitalize: 'words', required: true, 'aria-label': 'Seu nome', placeholder: 'seu nome' });
  const pose = pickPose();
  const err = h('p', { class: 'form-err', role: 'alert' });
  const sel = h('select', { required: true, 'aria-label': 'Como você chegou aqui?' }, h('option', { value: '', disabled: true, selected: true }, 'escolha uma opção'), ...ORIGENS.map(([v, t]) => h('option', { value: v }, t)));
  const outro = h('input', { class: 'field', type: 'text', maxlength: 40, 'aria-label': 'Outro: qual?', placeholder: 'outro: escreva aqui', hidden: true });
  const cod = h('input', { class: 'field al-cod', type: 'text', maxlength: 14, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Código de acesso', placeholder: 'CÓDIGO DE ACESSO' });
  const pedido = h('div', { class: 'al-pedido', role: 'status' });
  const gen = h('button', { class: 'btn small ghost', type: 'button', onclick: () => { CODE.pedir(); drawPedido(); } }, 'não tenho: gerar meu código');
  const codBox = h('div', { class: 'al-codbox', hidden: true }, cod, gen, pedido);
  function drawPedido() { const c = CODE.pendente(); gen.hidden = !!c; cod.hidden = !!c; pedido.replaceChildren(...(c ? [h('p', { class: 'al-lock-l' }, 'seu código'), h('div', { class: 'al-lock-code' }, c), h('p', { class: 'al-lock-t' }, 'informe a professora Bea'), h('p', { class: 'muted' }, 'pode entrar agora: quando ela cadastrar, libera sozinho.')] : [])); }
  drawPedido();
  sel.addEventListener('change', () => { outro.hidden = sel.value !== 'outro'; codBox.hidden = sel.value !== 'codigo'; if (!outro.hidden) outro.focus(); if (!codBox.hidden && !cod.hidden) cod.focus(); });
  const form = h('form', { class: 'login-card', onsubmit: async (e) => {
    e.preventDefault(); const n = cleanName(input.value);
    if (n.length < 2) { err.textContent = 'escreva pelo menos 2 letras.'; return; }
    if (!sel.value) { err.textContent = 'escolha como você chegou aqui.'; return; }
    if (sel.value === 'codigo') { // código de acesso: libera tudo que a professora liberou pra quem é aluno (vale 1 ano neste aparelho)
      if (!CODE.pendente()) { // digitou um código que a professora já deu: confere
        if (CODE.norm(cod.value).length < 4) { err.textContent = 'digite o seu código de acesso ou toque em "gerar meu código".'; return; }
        err.textContent = 'conferindo o código…';
        try { if (!(await CODE.entrar(cod.value))) { err.textContent = 'não achei esse código. confira com a sua professora.'; return; } } catch { err.textContent = 'sem internet agora. tente de novo.'; return; }
      }
      err.textContent = '';
    }
    const o = sel.value === 'outro' ? `outro: ${cleanName(outro.value) || '—'}` : sel.value === 'codigo' ? (CODE.pendente() ? 'pediu código de acesso' : 'aluno beaterista (código de acesso)') : sel.value;
    try { localStorage.setItem(ORIGEM_KEY, o); } catch { window.__alunoOrigem = o; }
    logVisit(n);
    try { localStorage.setItem(NAME_KEY, n); } catch { /* sem armazenamento: vale só nesta sessão */ window.__alunoNome = n; }
    start();
  } },
    h('div', { class: 'al-hero' },
      h('div', { class: 'al-paulbox' },
        h('img', { class: 'al-paul-img', src: `assets/aluno/paul-${pose[0]}.webp`, alt: `Paul, o robôterista, ${pose[1]}` }),
        // o Paul fica parado; o que se mexe são os rabiscos em volta dele
        ...[['estrela-ouro', 'a'], ['nota-vermelha', 'b'], ['coracao', 'c'], ['raio', 'd'], ['estrela-azul-p', 'e'], ['nota-preta', 'f']].map(([n, k]) => h('img', { class: `al-el el-${k}`, src: `assets/paul/el/${n}.webp`, alt: '', 'aria-hidden': 'true', draggable: 'false' }))),
      h('div', { class: 'al-hero-txt' },
        h('img', { class: 'al-robo', src: 'assets/robo-logo.png', alt: 'Robôterista', width: 900, height: 326 }),
        h('p', { class: 'al-bubble' }, 'oi! sou o paul,', h('br'), 'assistente da bea,', h('br'), 'vamos jogar juntos', h('br'), 'e aprender!'))),
    h('label', { class: 'field' }, h('span', {}, 'nome'), input),
    h('label', { class: 'field' }, h('span', {}, 'como você chegou aqui?'), sel), outro, codBox, err,
    h('button', { class: 'btn primary wide', type: 'submit' }, 'entrar'),
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
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  try { await store.init(); } catch {
    app.replaceChildren(h('main', { class: 'login' }, h('div', { class: 'login-card' }, h('h1', {}, 'Armazenamento indisponível'), h('p', {}, 'Este navegador bloqueou o armazenamento local (modo privado?). Abra no Safari normal.')))); return;
  }
  startScroller();
  startPaul({ first: 7000 });
  start();
})();
