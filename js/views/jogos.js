// Jogos musicais: catálogo (3 por fileira) e cada jogo dentro da mesma moldura (voltar, som, nova partida).
import { h } from '../util.js';
import { banner, toast, confirmSheet } from '../ui.js';
import { paulDica } from '../paul-dicas.js';
import { think, NOVIDADES_JOGOS } from '../paul-talk.js';
import * as store from '../store.js';
import { dragSort } from '../dragsort.js';
import { attachFesta } from '../jogos/festa.js';
import { soundOn, setSound } from '../jogos/base.js';
import { silence } from '../audio.js';
import * as CODE from '../codigo.js';
import { listaCurta } from '../lista-curta.js';
import * as cartas from '../jogos/cartas.js';
import * as un from '../jogos/un.js';
import * as velha from '../jogos/velha.js';
import * as bingo from '../jogos/bingo.js';
import * as cara from '../jogos/cara.js';
import * as quebra from '../jogos/quebra.js';
import * as stop from '../jogos/stop.js';
import * as toca from '../jogos/toca.js';
import * as detetive from '../jogos/detetive-note.js';
import * as figurix from '../jogos/figurix.js';
import * as rudimentos from '../jogos/rudimentos.js';
import * as copia from '../jogos/copia.js';
import * as paultavivo from '../jogos/paulta-vivo.js';
import * as groove from '../jogos/groove.js';
import * as fantasma from '../jogos/fantasma.js';
import * as memart from '../jogos/memoria-artistas.js';
import * as quizuno from '../jogos/quizuno.js';
import { relatorio } from './jogos-relatorio.js';
import { hasAdventure, loadAdventure } from '../campanha/registry.js';
import { modeChooser, mountAdventure } from '../campanha/run.js';
import * as AC from '../acesso.js';
import { LETRAS } from '../letras-nomes.js';
import { acharJogoDaSala, definirSalaAuto, salaLembrada, JOGOS_SALA } from '../jogos/online.js';
import { setGame, getGame } from '../jogos/base.js';
import { musicaPausa, musicaVolta, sync as sincronizarMusica, fixarMusica } from '../jogos/musica.js';
import { musicButton } from '../sound-btn.js';
import { lembrar as lembrarUltimo, ultimoJogo } from '../ultimo-jogo.js';

const IMG = 'assets/jogos/icones/';
const ALUNO = () => document.documentElement.classList.contains('aluno-on');
const GAMES = [
  ['toca', 'Toca Aqui', 'toca2.svg', toca, 'toque as figuras no tempo · microfone vale mais ★'],
  ['detetive', 'Detetive Note', 'eco.svg', detetive, 'escute e monte o ritmo · comida, parque, corpo, animal'],
  ['figurix', 'Figurix', 'figuras.svg', figurix, 'figuras rítmicas em 12 fases'],
  ['rudimentos', 'Taiko', 'taiko.svg', rudimentos, 'toque os padrões das mãos: E e D · 11 fases'],
  ['copia', 'Copia Aí', 'copia.svg', copia, 'o Paul toca, você copia · a melodia cresce'],
  ['paultavivo', 'pauLta ao Vivo', 'pauta-vivo.svg', paultavivo, 'leia a nota e toque de verdade'],
  ['groove', 'Eco de Groove', 'groove.svg', groove, 'repita a levada do Paul · bumbo, caixa e chimbal'],
  ['fantasma', 'Clique Fantasma', 'fantasma.svg', fantasma, 'o clique some: você segura o tempo?'],
  ['cartas', 'Uno Musical', 'cartas.webp', cartas, 'figuras rítmicas · contra o computador ou 2 celulares'],
  ['un', 'UN🚫', 'cartas.webp', un, 'regras diferentes · robô, mesmo celular ou 2 celulares'],
  ['quizuno', 'Quiz Uno Musical', 'cartas.webp', quizuno, '5 perguntas · acerte todas e ganhe 1 giro da roleta'],
  ['bingo', 'Bingo', 'bingo.webp', bingo],
  ['velha', 'Jogo da velha', 'velha.webp', velha],
  ['quebra', 'Quebra-cabeça', 'quebra-cabeca.webp', quebra],
  ['cara', 'Cara a cara', 'cara-a-cara.webp', cara],
  ['stop', 'Stop', 'stop.webp', stop],
  ['memart', 'Jogo da memória', 'memoria.svg', memart, 'The Beatles, bandas, solo e profissões'],
];
const BY = Object.fromEntries(GAMES.map((g) => [g[0], g]));
// jogos abertos: abrem direto no jogo, sem escolher modo e sem Modo Aventura (pra ninguém, nem na Bea)
const SEM_AVENTURA = new Set(['copia', 'paultavivo', 'groove', 'fantasma', 'toca', 'detetive', 'figurix', 'rudimentos', 'memart', 'quizuno', 'cartas', 'un', 'bingo', 'velha', 'quebra', 'cara', 'stop']);
const inner = (id) => [id, BY[id][1], BY[id][2], BY[id][3], BY[id][4]];
// Tudo que é jogo mora aqui. Quem tem módulo próprio abre dentro desta tela (#/jogos/<id>); o resto leva à sua tela e volta pra cá.
const link = (href, title, img, sub, only) => [href, title, img, null, sub, href, only];
const SECTIONS = [
  ['Ritmo e bateria', [
    link('#/ritmo', 'Beat Hero', 'ritmo.svg', 'toca no tempo e ganha estrelas'),
    inner('toca'),
    inner('detetive'),
    inner('figurix'),
    inner('rudimentos'),
  ]],
  ['Tocar de verdade', [
    inner('copia'),
    inner('paultavivo'),
    inner('groove'),
    inner('fantasma'),
  ]],
  ['Leitura musical', [
    link('#/paulta', 'PauLta', 'pauta.svg', 'leitura musical: bateria, clave de sol e de fá'),
  ]],
  ['Cartas e tabuleiro', [
    inner('memart'),
    ...['cartas', 'velha', 'quebra', 'cara', 'stop'].map(inner), // UN🚫 ESCONDIDO (pedido da Bea em 13/nov/2026: precisa de conserto); o código e o endereço #/jogos/un continuam, é só pôr 'un' de volta nesta lista // o quiz do Uno (#/jogos/quizuno) não aparece aqui: ele é aberto no fim do Uno Musical; o bingo está INATIVO (ninguém joga): fora da lista, o código e o endereço #/jogos/bingo continuam no app pra voltar quando quiserem
  ]],
  ['Palavras e quiz', [
    link('#/dicas/caca', LETRAS.caca[0], 'caca.svg', `${LETRAS.caca[1]} · 2 partidas grátis`),
    link('#/dicas/cruzadinha', LETRAS.cruzadinha[0], 'cruza.svg', LETRAS.cruzadinha[1]),
    link('#/dicas/quiz', LETRAS.quiz[0], 'quiz.svg', LETRAS.quiz[1]),
  ]],
];

// ordem, jogos escondidos e favoritos: da Bea (e de cada aparelho). Só a Bea edita a ordem; os alunos só favoritam.
const PK = 'setting-jogos';
const prefs = () => ({ order: [], hidden: [], fav: [], ...(store.get(PK) ? store.get(PK).data : {}) });
const savePrefs = (p) => store.upsert('setting', PK, p);
/** salva e mostra "desfazer" por uns segundos */
const change = (next, msg) => { const prev = prefs(); savePrefs(next); toast(msg, { action: 'desfazer', onAction: () => savePrefs(prev), ms: 5000 }); };
const keyOf = (x) => x[5] || `#/jogos/${x[0]}`;
// fundo escuro: alguns jogos (de palco/noite) e, na Bea, todos
const DARK = new Set(['cara', 'quebra']);
const darkOn = (id) => document.documentElement.dataset.space === 'bea' || (id && DARK.has(id));

/** Atalho no topo da tela de Jogos: digite o código da sala (5 letras = jogo de 2 celulares; 6 = bingo) e o app abre o jogo certo já entrando na sala. */
const NOME_SALA = { velha: 'jogo da velha', cartas: 'Uno Musical', stop: 'stop', 'cara-musical': 'cara a cara', memoria: 'jogo da memória', beathero: 'Beat Hero (duelo)', letras: 'Letras (duelo)', quebra: 'quebra-cabeça (duelo)' };
function prepararEAbrir(id, rota, code, voltar) {
  if (id === 'cara-musical') { try { const g = getGame('cara'); setGame('cara', { tema: 'musical', musical: { ...(g.musical || {}), jogo: 'online' } }); } catch { /* segue */ } }
  definirSalaAuto(id, code, voltar); location.hash = rota;
}
/** Campo do código de aluno direto na aba Jogos (só na área dos alunos, enquanto ainda não tem código). */
function atalhoCodigoAluno() {
  if (!ALUNO() || AC.liberado()) return null;
  const msg = h('p', { class: 'jg-msg', role: 'status', 'aria-live': 'polite' });
  const inp = h('input', { type: 'text', class: 'jg-code-in jg-code-big', maxlength: 14, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'código de aluno', 'aria-label': 'código de aluno',
    onkeydown: (e) => { if (e.key === 'Enter') ir(); } });
  async function ir() {
    msg.textContent = 'conferindo…';
    try { if (await CODE.entrar(inp.value)) { AC.definir(true); msg.textContent = 'liberado! 🎉'; } else msg.textContent = CODE.msgFalha(); } catch { msg.textContent = 'sem internet agora. tente de novo.'; }
  }
  const box = h('section', { class: 'card pad jg-cod-aluno', 'aria-label': 'já tenho código' }, h('b', {}, 'já tem código de aluno? coloque aqui'), h('div', { class: 'jg-actions row jg-entrar' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: ir }, 'liberar')), msg);
  document.addEventListener('aluno-acesso', () => box.remove(), { once: true });
  return box;
}

function atalhoSala() {
  const msg = h('p', { class: 'jg-msg', role: 'status', 'aria-live': 'polite' });
  const inp = h('input', { type: 'text', class: 'jg-code-in jg-code-big', maxlength: 6, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'código da sala', 'aria-label': 'código da sala',
    oninput: (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); }, onkeydown: (e) => { if (e.key === 'Enter') ir(); } });
  async function ir() {
    const c = inp.value.trim().toUpperCase();
    if (c.length === 6) { location.hash = `#/jogos/bingo?sala=${c}`; return; }
    if (c.length !== 5) { msg.textContent = 'o código tem 5 letras ou números (o do bingo tem 6)'; return; }
    msg.textContent = 'procurando a sala…';
    const r = await acharJogoDaSala(c);
    if (!r) { msg.textContent = 'não achei essa sala. confira o código ou a internet'; return; }
    prepararEAbrir(r[0], r[1], c, false);
  }
  const voltas = JOGOS_SALA.map(([id, rota]) => [id, rota, salaLembrada(id)]).filter((x) => x[2]);
  return h('section', { class: 'card pad jg-sala-atalho', 'aria-label': 'entrar numa sala' },
    h('b', { class: 'jg-sala-t' }, 'tem código de sala?'), h('div', { class: 'jg-actions row jg-entrar' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: ir }, 'entrar')),
    voltas.length ? listaCurta(voltas.map(([id, rota, u]) => h('button', { class: 'btn small jg-volta-mini', type: 'button', onclick: () => prepararEAbrir(id, rota, u.code, true) }, `voltar pra sala ${u.code} · ${NOME_SALA[id] || id}`))) : null, msg);
}

/* ---- último jogo: todo jogo aberto fica lembrado e a tela de Jogos (e o Álbum) oferecem "voltar pro jogo" ---- */
const JOGO_ULT = 'beaterista-jogo-antigo'; const VALE = 12 * 3600 * 1000;
/** Qual jogo do catálogo é este endereço? (o mais específico ganha: #/dicas/caca antes de #/dicas) */
function jogoDoEndereco(hash) { const hsh = String(hash || ''); let melhor = null; for (const x of SECTIONS.flatMap(([, l]) => l)) { const k = keyOf(x); if ((hsh === k || hsh.startsWith(`${k}/`) || hsh.startsWith(`${k}?`)) && (!melhor || k.length > keyOf(melhor).length)) melhor = x; } return melhor; }
function anotarUltimo() { const x = jogoDoEndereco(location.hash); if (x) lembrarUltimo(location.hash, x[1], x[0]); }
if (typeof window !== 'undefined' && window.addEventListener) { window.addEventListener('hashchange', anotarUltimo); anotarUltimo(); }
function lembrarJogo(id, nome) { try { localStorage.setItem(JOGO_ULT, JSON.stringify({ id, nome, at: Date.now() })); } catch { /* sem armazenamento */ } }
function esquecerJogo(id) { try { const u = JSON.parse(localStorage.getItem(JOGO_ULT) || 'null'); if (u && u.id === id) localStorage.removeItem(JOGO_ULT); } catch { /* ok */ } }
const jogoUltimo = () => { try { const u = JSON.parse(localStorage.getItem(JOGO_ULT) || 'null'); return u && u.id && Date.now() - (u.at || 0) < VALE ? u : null; } catch { return null; } };
function atalhoContinuar() {
  const u = ultimoJogo(); if (!u) return null;
  return h('a', { class: 'btn primary wide jg-continuar', href: u.href }, `voltar pro último jogo: ${u.nome}`);
}

function catalog(host) {
  const aluno = ALUNO();
  let editing = false; let filtro = 'todos'; // todos | fav
  let pensou = 0;
  const card = (x, edit) => {
    const [id, title, img, , , href] = x; const lk = aluno && AC.trancado(href || `#/jogos/${id}`);
    return h('a', { class: `jg-card${lk ? ' locked' : ''}`, href: href || `#/jogos/${id}`, 'aria-label': lk ? `${title} (só com código)` : null, onclick: edit ? (e) => e.preventDefault() : null }, h('span', { class: 'jg-ico' }, h('img', { src: `${IMG}${img}`, alt: '', decoding: 'async', draggable: 'false' }), lk ? h('i', { class: 'jg-lock', 'aria-hidden': 'true' }, '🔒') : null), h('b', {}, title));
  };
  let catWrap;
  const grid = h('div', { class: 'jg-grid jg-flat' }); const bar = h('div', { class: 'jgx-bar' });
  const draw = () => {
    const p = prefs();
    const all = SECTIONS.flatMap(([, list]) => list).filter((x) => !(aluno && x[6] === 'bea'));
    const rank = (k) => { const i = p.order.indexOf(k); return i < 0 ? 1e6 : i; };
    const list = all.map((x, i) => [x, i]).sort((a, c) => rank(keyOf(a[0])) - rank(keyOf(c[0])) || a[1] - c[1]).map((x) => x[0]);
    const passa = (x) => (filtro === 'fav' ? p.fav.includes(keyOf(x)) : true);
    const shown = list.filter((x) => (editing || !p.hidden.includes(keyOf(x))) && passa(x));
    const keys = list.map(keyOf);
    bar.replaceChildren(
      ...[['todos', 'Todos'], ['fav', `★ Favoritos (${p.fav.filter((k) => keys.includes(k)).length})`]].map(([k, t]) => h('button', { type: 'button', class: `jgx-chip${filtro === k ? ' on' : ''}`, 'aria-pressed': String(filtro === k), onclick: () => { filtro = k; draw(); } }, t)),
      aluno ? null : h('button', { type: 'button', class: `jgx-chip jgx-edit${editing ? ' on' : ''}`, onclick: () => { editing = !editing; draw(); } }, editing ? 'pronto' : 'editar'));
    grid.classList.toggle('jgx-editing', editing);
    grid.replaceChildren(...(shown.length ? shown.map((x) => {
      const k = keyOf(x); const fav = p.fav.includes(k); const off = p.hidden.includes(k);
      return h('div', { class: `jgx-cell${off ? ' off' : ''}`, 'data-key': k }, card(x, editing),
        h('button', { type: 'button', class: `jgx-star${fav ? ' on' : ''}`, 'aria-pressed': String(fav), 'aria-label': `${fav ? 'Tirar dos' : 'Pôr nos'} favoritos: ${x[1]}`, onclick: () => { const next = { ...p, fav: fav ? p.fav.filter((y) => y !== k) : [...p.fav, k] }; if (fav) change(next, 'tirado dos favoritos'); else savePrefs(next); } }, fav ? '★' : '☆'),
        editing ? h('div', { class: 'jgx-ctl' },
          h('button', { type: 'button', 'aria-label': `${off ? 'Mostrar' : 'Esconder'} ${x[1]}`, onclick: () => (off ? savePrefs({ ...p, hidden: p.hidden.filter((y) => y !== k) }) : change({ ...p, hidden: [...p.hidden, k] }, `${x[1]} escondido`)) }, off ? '↺' : '✕')) : null);
    }) : [h('p', { class: 'jg-p', style: { gridColumn: '1 / -1' } }, 'Nenhum favorito ainda. Toque na ☆ de um jogo.')]));
  };
  host.replaceChildren(banner('Jogos', 'todos os jogos num lugar só'), paulDica(), h('div', { class: 'pad-x', style: 'display:grid;gap:10px' }, atalhoCodigoAluno(), atalhoContinuar(), atalhoSala()), catWrap = h('div', { class: `jg jg-wrap jg-cat${darkOn('') ? ' jg-dark' : ''}` }, bar, grid));
  draw();
  // O Paul fala numa nuvem de pensamento (só pros alunos): uma vez é um jogo novo, na outra é "mais chances de ganhar estrelas" (alterna a cada visita)
  if (aluno) { const KP = 'beaterista-jogos-pensou'; let n = 0; try { n = Number(localStorage.getItem(KP) || 0) || 0; localStorage.setItem(KP, String(n + 1)); } catch { /* sem armazenamento */ } const lista = NOVIDADES_JOGOS[n % 2]; pensou = setTimeout(() => think(lista[Math.floor(Math.random() * lista.length)], 8000), 1400); }
  // arrastar o próprio jogo (no modo editar; no dedo, segurando um instante): a nova ordem dos que estão na tela entra no lugar deles na ordem completa
  const offDrag = dragSort(grid, { itemSel: '.jgx-cell', onDone: (newKeys) => {
    const p = prefs(); const all = SECTIONS.flatMap(([, l]) => l).filter((x) => !(aluno && x[6] === 'bea')).map(keyOf);
    const rank = (k) => { const i = p.order.indexOf(k); return i < 0 ? 1e6 : i; };
    const full = all.map((k, i) => [k, i]).sort((a, c) => rank(a[0]) - rank(c[0]) || a[1] - c[1]).map((x) => x[0]);
    const set = new Set(newKeys); let n = 0;
    change({ ...p, order: full.map((k) => (set.has(k) ? newKeys[n++] : k)) }, 'ordem mudou');
  } });
  const offStore = store.subscribe((i) => { if (!i.kind || i.id === PK) draw(); });
  const onAc = () => draw(); document.addEventListener('aluno-acesso', onAc);
  const offFesta = attachFesta(catWrap, { paul: false }); // a faixa de título já tem o Paul
  return () => { clearTimeout(pensou); offStore(); offDrag(); offFesta(); document.removeEventListener('aluno-acesso', onAc); };
}

function game(host, entry) {
  const [, title, , mod] = entry;
  const body = h('div', { class: 'jg-body' });
  const snd = h('button', { class: 'icon-btn jg-snd', type: 'button', 'aria-pressed': String(soundOn()), 'aria-label': soundOn() ? 'desligar os efeitos' : 'ligar os efeitos', onclick: () => {
    fixarMusica(); setSound(!soundOn()); snd.setAttribute('aria-pressed', String(soundOn())); snd.setAttribute('aria-label', soundOn() ? 'desligar os efeitos' : 'ligar os efeitos'); snd.textContent = soundOn() ? '🔊' : '🔇'; sincronizarMusica();
  } }, soundOn() ? '🔊' : '🔇');
  const ctl = mod.mount(body);
  // pausa (vale pra todos os jogos): cobre o jogo, para o som e chama ctl.pause()/resume() quando o jogo tem relógio ou sorteio automático. Em sala de 2 celulares a pausa é só deste celular.
  let pausa = null; let deVez = false; // deVez: a pessoa escolheu sair (não oferece "continuar")
  const despausar = () => { if (!pausa) return; pausa.remove(); pausa = null; body.inert = false; musicaVolta(); try { ctl.resume && ctl.resume(); } catch { /* jogo sem retomar */ } };
  const pausar = () => {
    if (pausa) return; try { ctl.pause && ctl.pause(); } catch { /* jogo sem pausa própria */ } try { silence(); } catch { /* sem áudio */ } musicaPausa(); body.inert = true;
    pausa = h('div', { class: 'jg-pausa', role: 'dialog', 'aria-label': 'jogo pausado' }, h('div', { class: 'jg-pausa-box' }, h('h2', { class: 'hand' }, 'pausado ⏸'), h('p', { class: 'jg-p' }, 'o jogo está parado neste celular. em sala de 2 celulares, o outro continua.'),
      h('button', { class: 'btn primary wide', type: 'button', onclick: despausar }, 'continuar'),
      h('button', { class: 'btn ghost wide', type: 'button', onclick: async () => { if (!(ctl.inProgress && ctl.inProgress()) || await confirmSheet('sair do jogo?', 'dá pra voltar depois pelo botão “continuar” na tela de jogos.', 'sair')) { deVez = true; location.hash = '#/jogos'; } } }, 'sair do jogo')));
    wrap.append(pausa); const b = pausa.querySelector('button'); if (b) b.focus();
  };
  const btnPausa = h('button', { class: 'btn small ghost jg-pausa-btn', type: 'button', 'aria-label': 'pausar o jogo', onclick: pausar }, '⏸ pausa');
  const wrap = h('div', { class: `jg jg-wrap jg-game${darkOn(entry[0]) ? ' jg-dark' : ''}` },
    h('div', { class: 'jg-top' }, h('a', { class: 'jg-link', href: '#/jogos', onclick: async (e) => { if (ctl.inProgress && ctl.inProgress()) { e.preventDefault(); if (await confirmSheet('sair da partida?', 'a partida atual será perdida.', 'sair')) { deVez = true; location.hash = '#/jogos'; } } } }, '‹ jogos'), h('b', { class: 'hand jg-title' }, title),
      btnPausa, h('button', { class: 'btn small ghost', type: 'button', onclick: () => ctl.restart() }, 'nova partida'), snd, musicButton('icon-btn jg-mus')),
    body);
  host.replaceChildren(wrap);
  const offFesta = attachFesta(wrap);
  return () => { musicaVolta(); const andava = !!(ctl.inProgress && ctl.inProgress()); if (andava && !deVez) lembrarJogo(entry[0], entry[1]); else esquecerJogo(entry[0]); offFesta(); ctl.destroy(); };
}

/** Jogo com Modo Aventura: #/jogos/<id> escolhe o modo, /livre = como sempre, /aventura = mapa, /aventura/<n> = missão. Sem módulo de aventura (ou se falhar), cai direto no Modo Livre. */
function withModes(host, entry, [id, mode, mission]) {
  if (mode === 'livre') return game(host, entry);
  let off = () => {}; let gone = false; const wrap = h('div', { class: 'av-root' }); host.replaceChildren(wrap);
  wrap.append(h('p', { class: 'jg-p' }, 'carregando…'));
  loadAdventure(id).then((adv) => {
    if (gone) return; const base = `#/jogos/${id}/aventura`; const spec = adv.spec;
    if (mode === 'aventura') {
      const n = mission !== undefined && /^\d+$/.test(mission) ? Number(mission) : null;
      off = mountAdventure(wrap, { gameId: id, spec, adv, base, mission: n, playClass: `jg jg-wrap jg-game${darkOn(id) ? ' jg-dark' : ''}`, backHref: `#/jogos/${id}`, nav: (hash) => { location.hash = hash; } }); return;
    }
    off = modeChooser(wrap, { gameId: id, spec, title: entry[1], hrefLivre: `#/jogos/${id}/livre`, hrefAventura: base });
    wrap.prepend(h('a', { class: 'av-back', href: '#/jogos', style: 'margin-bottom:8px' }, '‹ jogos'));
  }).catch((e) => { console.warn('aventura indisponível, abrindo o modo livre', e); if (!gone) off = game(host, entry); });
  return () => { gone = true; off(); };
}

export function mount(host, parts = []) {
  if (parts[0] === 'relatorio') return relatorio(host);
  const first = String(parts[0] || '').split('?')[0];
  const entry = GAMES.find((g) => g[0] === first && g[3]);
  if (!entry) return catalog(host);
  if (/[?&]sala=/.test(String(parts[0] || ''))) return game(host, entry); // link de convite do bingo online: abre direto o jogo livre
  return hasAdventure(entry[0]) && !SEM_AVENTURA.has(entry[0]) ? withModes(host, entry, parts) : game(host, entry);
}
