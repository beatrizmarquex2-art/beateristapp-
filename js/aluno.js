// Área do aluno (aluno.html): sem login. O aluno escolhe um nome, joga os Jogos de ritmo e o Kids e aparece no ranking que todos veem.
// Tudo que ele faz fica só no aparelho dele (armazenamento separado do app da Bea); só o nome e as pontuações vão pro ranking.
import { h, icon } from './util.js';
import { soundButton } from './sound-btn.js';
import * as store from './store.js';
import * as P from './kids/progress.js';
import * as RK from './ranking.js';
import * as kids from './views/kids.js';
import * as ritmo from './views/jogos-ritmo.js';
import * as beatlab from './views/beatlab.js';
import * as toque from './views/toque.js';
import * as piano from './views/piano.js';
import * as jogos from './views/jogos.js';
import * as dicionario from './views/dicionario.js';
import * as dicasLista from './views/dicas-lista.js';
import { banner, closeSheets } from './ui.js';
import { silence } from './audio.js';
import { startScroller } from './scroller.js';
import { startPaul } from './paul-talk.js';
import * as Acesso from './acesso.js';
import * as Cloud from './kids/album-cloud.js';
import { normCode } from './kids/savegame-logic.js';

const app = document.getElementById('app');
const NAME_KEY = 'beaterista-aluno-nome';
// quem não tem código liberado vê só Jogos, Tocar e Ranking; com código liberado entra também o Beat Lab
const navItems = () => [['#/jogos', 'gamepad', 'Jogos'], ['#/estudos', 'bulb', 'Estudos'], ...(Acesso.liberado() ? [['#/beatlab', 'kit', 'Beat Lab']] : []), ['#/tocar', 'drummer', 'Tocar'], ['#/ranking', 'star', 'Ranking']];
const TAB_OF = { toque: 'tocar', piano: 'tocar', kids: 'jogos', ritmo: 'jogos', dicionario: 'estudos' }; // telas que acendem outra aba (todos os jogos moram na aba Jogos)
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
const ORIGENS = [['aluno beaterista', 'aluno Beaterista'], ['aluno on-line', 'aluno on-line'], ['tik tok live', 'TikTok live'], ['youtube/instagram', 'YouTube/Instagram'], ['outro', 'outro']];
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
    if (me) RK.add('kids|estrelas', name, P.totalStars(me.id));
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
      h('a', { class: 'card pad al-card', href: '#/kids' }, h('h2', { class: 'tag' }, '⭐ meu álbum e minhas estrelas'), h('p', { class: 'muted' }, 'fases, figurinhas e o código BEA pra guardar tudo')),
      box('estrelas nos jogos', 'quem juntou mais estrelas nas fases', 'kids|estrelas', '★'),
      box('XP dos jogos', 'quem mais jogou e treinou o ritmo', 'xp', 'XP'),
      socialRow(),
      footerBlock(),
      h('p', { class: 'lib-note' }, 'o ranking de cada música aparece no fim do jogo de ritmo. só vale a sua melhor pontuação.')));
}

function tocarView(view) {
  const card = (href, title, sub) => h('a', { class: 'card pad al-card', href }, h('h2', { class: 'tag' }, title), h('p', { class: 'muted' }, sub));
  view.append(banner('Tocar', 'bateria, pad e piano na tela'), h('div', { class: 'pad-x', style: 'display:grid;gap:12px' },
    card('#/toque', 'Bateria e pad', 'toque nas peças com vários dedos, grave um ritmo e salve no Beat Lab'),
    card('#/piano', 'Piano', 'teclado na tela, com notas e acordes')));
}

/** Aba Estudos: sem código só o relatório "Aprender jogando" (os pais leem); com código liberado abre aulinha do Paul, dicionário musical e as 30 dicas. */
function estudosView(view) {
  const item = (href, title, sub, trava) => {
    const lock = trava && Acesso.bloqueado(trava);
    return h('a', { class: `card pad al-card${lock ? ' locked' : ''}`, href, 'aria-label': lock ? `${title}, só pra alunos` : null, onclick: lock ? (e) => { e.preventDefault(); Acesso.promptCode(title); } : null },
      h('h2', { class: 'tag' }, lock ? '🔒 ' : '', title), h('p', { class: 'muted' }, sub));
  };
  const draw = () => view.replaceChildren(banner('Estudos', 'aprender com calma'), h('div', { class: 'pad-x', style: 'display:grid;gap:12px' },
    item('#/kids/figuras/aula', 'Aulinha do Paul', 'as figuras rítmicas, passo a passo', 'aulinha'),
    item('#/dicionario', 'Dicionário musical', 'busca, explicação e exemplo tocando', 'dicionario'),
    item('#/estudos/dicas', 'As 30 dicas', 'pequenas ideias pra estudar melhor', 'dicas'),
    item('#/jogos/relatorio', 'Aprender jogando', 'relatório aberto pra pais e responsáveis: o que cada jogo desenvolve')));
  draw(); const on = () => draw(); addEventListener('acesso', on); return () => removeEventListener('acesso', on);
}

function shell(name) {
  const view = h('main', { id: 'view', tabindex: '-1' });
  const nav = h('nav', { class: 'bottom-nav', 'aria-label': 'Navegação' });
  const head = h('header', { class: 'top' },
    h('img', { src: 'assets/icons/tambor-menu.png', alt: '', width: 40, height: 40 }),
    h('div', { class: 'ws', style: 'flex:1' }, h('span', { class: 'on', style: 'padding:6px 12px' }, `oi, ${name}!`)),
    soundButton(),
    h('button', { type: 'button', class: 'btn small ghost', onclick: () => { try { localStorage.removeItem(NAME_KEY); } catch { /* ok */ } location.reload(); } }, 'trocar nome'));
  app.replaceChildren(h('div', { class: 'topwrap' }, head), view, nav);

  function go() {
    cleanup && cleanup(); cleanup = null; closeSheets(); silence(); view.replaceChildren();
    const r = route(); view.dataset.page = r.name;
    // fases, estrelas e álbum moram na aba Ranking; os jogos das fases continuam na aba Jogos
    const tab = r.name === 'kids' && (!r.parts[0] || r.parts[0] === 'album') ? 'ranking'
      : (r.name === 'kids' && r.parts[0] === 'figuras' && r.parts[1] === 'aula') || (r.name === 'jogos' && r.parts[0] === 'relatorio') ? 'estudos' : (TAB_OF[r.name] || r.name);
    const NAV = navItems(); nav.style.gridTemplateColumns = `repeat(${NAV.length}, 1fr)`;
    nav.replaceChildren(...NAV.map(([href, ic, label]) => h('a', { href, class: `nav-item${('#/' + tab) === href ? ' on' : ''}`, 'aria-current': ('#/' + tab) === href ? 'page' : null }, icon(ic, 24), h('span', {}, label))));
    let c;
    const travado = r.name === 'estudos' && r.parts[0] === 'dicas' ? 'dicas' : { beatlab: 'beatlab', ritmo: 'ritmo', dicionario: 'dicionario' }[r.name];
    if (travado && Acesso.bloqueado(travado)) { location.replace(r.name === 'ritmo' || r.name === 'beatlab' ? '#/jogos' : '#/estudos'); Acesso.promptCode(Acesso.TRAVA[travado]); return; }
    if (r.name === 'kids') c = kids.mount(view, r.parts);
    else if (r.name === 'ranking') c = rankingView(view);
    else if (r.name === 'jogos') c = jogos.mount(view, r.parts);
    else if (r.name === 'beatlab') c = beatlab.mount(view, r.parts);
    else if (r.name === 'toque') c = toque.mount(view);
    else if (r.name === 'piano') c = piano.mount(view);
    else if (r.name === 'tocar') tocarView(view);
    else if (r.name === 'estudos') c = r.parts[0] === 'dicas' ? dicasLista.mount(view) : estudosView(view);
    else if (r.name === 'dicionario') c = dicionario.mount(view, r.parts);
    else if (r.name === 'ritmo') c = ritmo.mount(view, { student: true, name: getName });
    else { location.hash = '#/jogos'; return; }
    cleanup = typeof c === 'function' ? c : null;
    window.scrollTo(0, 0);
  }
  addEventListener('hashchange', go);
  addEventListener('acesso', go); // código liberado (ou tirado): refaz a barra e a tela
  go();
}

function askName() {
  const input = h('input', { class: 'field', type: 'text', maxlength: 20, autocomplete: 'given-name', autocapitalize: 'words', required: true, 'aria-label': 'Seu nome', placeholder: 'seu nome' });
  const pose = pickPose();
  const err = h('p', { class: 'form-err', role: 'alert' });
  const sel = h('select', { required: true, 'aria-label': 'Como você chegou aqui?' }, h('option', { value: '', disabled: true, selected: true }, 'escolha uma opção'), ...ORIGENS.map(([v, t]) => h('option', { value: v }, t)));
  const outro = h('input', { class: 'field', type: 'text', maxlength: 40, 'aria-label': 'Outro: qual?', placeholder: 'outro: escreva aqui', hidden: true });
  sel.addEventListener('change', () => { outro.hidden = sel.value !== 'outro'; if (!outro.hidden) outro.focus(); });
  const form = h('form', { class: 'login-card', onsubmit: async (e) => {
    e.preventDefault(); const n = cleanName(input.value);
    if (n.length < 2) { err.textContent = 'escreva pelo menos 2 letras.'; return; }
    if (!sel.value) { err.textContent = 'escolha como você chegou aqui.'; return; }
    const o = sel.value === 'outro' ? `outro: ${cleanName(outro.value) || '—'}` : sel.value;
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
    h('label', { class: 'field' }, h('span', {}, 'como você chegou aqui?'), sel), outro, err,
    h('button', { class: 'btn primary wide', type: 'submit' }, 'entrar'),
    h('button', { class: 'btn ghost wide', type: 'button', onclick: askCode }, 'já tenho meu código BEA'),
    h('p', { class: 'muted center al-note' }, 'seu nome aparece no ranking e a escola registra a entrada'));
    app.replaceChildren(h('main', { class: 'login al-entry' },
    h('div', { class: 'al-top' }, brandEl(), socialRow('al-mini')), form, footerBlock()));
  setTimeout(() => input.focus(), 100);
}

/** Entrar com o código BEA-0000: traz o nome, o álbum e (se a Bea liberou) abre o resto. */
function askCode() {
  const inp = h('input', { class: 'field', type: 'text', inputmode: 'numeric', maxlength: 8, autocomplete: 'off', 'aria-label': 'Seu código', placeholder: 'BEA-0000' });
  const err = h('p', { class: 'form-err', role: 'alert' });
  const form = h('form', { class: 'login-card', onsubmit: async (e) => {
    e.preventDefault(); const c = normCode(inp.value); if (!c) { err.textContent = 'digite os 4 números do código.'; return; }
    err.textContent = 'procurando…';
    let snap; try { snap = await Cloud.peek(c); } catch { err.textContent = 'sem internet. tente de novo.'; return; }
    if (!snap) { err.textContent = 'não achei esse código. confere os números.'; return; }
    const n = cleanName(snap.n) || 'Aluno';
    try { localStorage.setItem(ORIGEM_KEY, 'entrou com código'); } catch { window.__alunoOrigem = 'entrou com código'; }
    try { localStorage.setItem(NAME_KEY, n); } catch { window.__alunoNome = n; }
    await ensureKidsPlayer(n); const me = P.active(); if (me) await Cloud.adopt(me, c, snap);
    await Acesso.refresh(); start();
  } },
    h('h1', { class: 'login-title' }, 'entrar com meu código'), h('label', { class: 'field' }, h('span', {}, 'código'), inp), err,
    h('button', { class: 'btn primary wide', type: 'submit' }, 'entrar'),
    h('button', { class: 'btn ghost wide', type: 'button', onclick: askName }, '‹ voltar'),
    h('p', { class: 'muted center al-note' }, 'o código guarda seu álbum e seu ranking em qualquer celular. alunos da Bea abrem mais coisas com ele.'));
  app.replaceChildren(h('main', { class: 'login al-entry' }, h('div', { class: 'al-top' }, brandEl(), socialRow('al-mini')), form, footerBlock()));
  setTimeout(() => inp.focus(), 100);
}

async function start() {
  const name = getName() || window.__alunoNome || '';
  if (!name) { askName(); return; }
  await ensureKidsPlayer(name);
  logVisit(name);
  Acesso.refresh(); // confere no servidor se o código desse aluno está liberado (refaz as abas se mudar)
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
