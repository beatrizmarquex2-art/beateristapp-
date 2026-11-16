// Jogos de ritmo: o pacote "beater rhythm games" (assets/rhythm-games/) montado dentro do app.
// O pacote é um script clássico que expõe window.BeaterRhythm; carregamos css + js uma vez só e
// chamamos mount/unmount a cada entrada/saída da tela. XP dos jogos vai pro registro "setting-xp".
import { h } from '../util.js';
import * as store from '../store.js';
import { banner, toast, confirmSheet, sheet } from '../ui.js';
import * as FB from '../feedback.js';
import * as RK from '../ranking.js';
import * as CODE from '../codigo.js';
import * as P from '../kids/progress.js';
import * as Album from '../kids/album.js';
import * as AC from '../acesso.js';
import { portal } from '../rg-portal.js';

const BASE = 'assets/rhythm-games/';
const XP = 'setting-xp';
const HALL = 'setting-ritmo-hall'; // ranking estilo fliperama: { boards: { 'jogo|instrumento|dificuldade|musica': [{ name, score, acc, grade, at }] } }
let loading = null;

export const hallTop = (key) => { const b = store.get(HALL); return (b && b.data.boards && b.data.boards[key]) || []; };
export function hallAdd(key, entry) {
  const b = store.get(HALL); const boards = { ...((b && b.data.boards) || {}) };
  boards[key] = [...(boards[key] || []), entry].sort((x, y) => y.score - x.score).slice(0, 10);
  store.upsert('setting', HALL, { boards });
}

export const xpTotal = () => (store.get(XP) ? store.get(XP).data.total || 0 : 0);
export async function addXp(n, why = '') {
  n = Math.round(Number(n) || 0); if (n <= 0) return xpTotal();
  const cur = store.get(XP) ? store.get(XP).data : { total: 0, log: [] };
  const total = (cur.total || 0) + n;
  await store.upsert('setting', XP, { total, log: [{ n, why: String(why || '').slice(0, 60), at: Date.now() }, ...(cur.log || [])].slice(0, 50) });
  return total;
}

/** Carrega o css e o js do pacote (uma vez). Resolve com window.BeaterRhythm ou rejeita se o pacote não está lá. */
export function loadPackage() {
  if (window.BeaterRhythm) return Promise.resolve(window.BeaterRhythm);
  if (loading) return loading;
  if (!document.querySelector('link[data-rg]')) document.head.append(h('link', { rel: 'stylesheet', href: `${BASE}rhythm-games.css`, 'data-rg': '' }));
  loading = new Promise((ok, fail) => {
    const s = h('script', { src: `${BASE}rhythm-games.js`, 'data-rg': '' });
    s.addEventListener('load', () => (window.BeaterRhythm ? ok(window.BeaterRhythm) : fail(new Error('o pacote carregou mas não criou BeaterRhythm'))));
    s.addEventListener('error', () => fail(new Error('pacote não encontrado')));
    document.head.append(s);
  }).catch((e) => { loading = null; document.querySelectorAll('script[data-rg], link[data-rg]').forEach((x) => x.remove()); throw e; });
  return loading;
}

/** opts.student: área do aluno (ranking compartilhado com o nome do aluno). Só as músicas prontas do app. */
export function mount(host, opts = {}) {
  // Modo Aventura (#/ritmo/aventura[/n]): tela própria, o jogo normal abaixo não é montado. Nada do modo livre muda.
  if (opts.parts && opts.parts[0] === 'aventura') { location.hash = '#/ritmo'; return () => {}; } // o Modo Aventura do Beat Hero/Piano Hero foi removido (links antigos voltam pro jogo)
  // Duelo (#/ritmo/duelo): a mesma música ao mesmo tempo em dois celulares, por código de sala
  if (opts.parts && opts.parts[0] === 'duelo') { location.hash = '#/ritmo'; return () => {}; } // o duelo de 2 celulares saiu: só o modo normal
  // 3 jogos separados, cada um na sua tela: #/ritmo/drum (Hero Drum, bateria), #/ritmo/piano (Piano Hero, melodia) e #/ritmo/setas (Beat Hero, duelo de setas). #/ritmo sozinho abre o Hero Drum.
  const JOGO = { drum: ['beat', 'Hero Drum', 'toque a bateria no tempo e ganhe estrelas'], piano: ['tiles', 'Piano Hero', 'toque a melodia no ritmo da música'], setas: ['setas', 'Beat Hero', 'siga as setas e dance com o Paul'] };
  const jg = JOGO[(opts.parts || [])[0]] || JOGO.drum;
  const student = !!opts.student;
  let mounted = false; let gone = false;
  const studentTop = (key) => RK.cached(`ritmo|${key}`);
  const studentAdd = (key, e) => { RK.add(`ritmo|${key}`, e.name, e.score, e.acc, e.grade).then(() => RK.top(`ritmo|${key}`, { fresh: true })).then(() => window.BeaterRhythm && window.BeaterRhythm.refresh && window.BeaterRhythm.refresh()); };
  // #jogos fica sem altura fixa (o pacote mede a tela com 100dvh); durante o jogo o .rg-host vira tela cheia (ver app.css)
  const box = h('div', { id: 'jogos' }, h('p', { class: 'muted rg-wait' }, 'carregando os jogos…'));
  const frame = h('div', { class: 'rg-host' }, box);
  const stopPortal = portal(frame); // iPad: na hora de jogar, a tela do jogo vai pro <body> (senão fica cortada)
  // ---- códigos dos alunos (só a Bea): quem tem código acessa os jogos de ritmo ----
  const codes = h('details', { class: 'card pad rg-manage rg-codes' });
  let codeList = []; let codeLoaded = false; let codeBusy = false;
  async function loadCodes() { try { codeList = await CODE.listar(); codeLoaded = true; } catch (e) { toast(`não consegui ler os códigos (${e.message})`, { id: 'rg-cod', ms: 3500 }); } drawCodes(); }
  const when = (t) => (t ? new Date(t).toLocaleDateString('pt-BR') : 'nunca');
  async function codeDo(fn, ok) { if (codeBusy) return; codeBusy = true; try { await fn(); toast(ok, { id: 'rg-cod', ms: 2500 }); await loadCodes(); } catch (e) { toast(`não deu (${e.message})`, { id: 'rg-cod', ms: 3500 }); } codeBusy = false; drawCodes(); }
  const nameIn = h('input', { type: 'text', maxlength: 60, placeholder: 'nome do aluno', 'aria-label': 'Nome do aluno', class: 'rg-mfilter' });
  function drawCodes() {
    const n = codeList.filter((c) => c.ativo).length;
    codes.replaceChildren(h('summary', {}, `códigos dos alunos${codeLoaded ? ` (${n} ativo${n === 1 ? '' : 's'})` : ''}`),
      h('p', { class: 'muted rg-pubnote' }, 'quem tem código usa os jogos de ritmo. crie um código por aluno e passe pra ele. desativar tira o acesso na hora.'),
      h('div', { class: 'row rg-pubbar' }, nameIn, h('button', { class: 'btn small', type: 'button', disabled: codeBusy, onclick: () => { const nm = nameIn.value.trim(); codeDo(async () => { const c = await CODE.criar(nm); try { await navigator.clipboard.writeText(c); } catch { /* sem área de transferência */ } nameIn.value = ''; toast(`código ${c} criado${nm ? ` pra ${nm}` : ''} (copiado)`, { id: 'rg-cod2', ms: 6000 }); }, 'código criado ✓'); } }, '+ novo código')),
      h('ul', { class: 'rg-list' }, ...codeList.map((c) => h('li', {}, h('span', {}, h('b', { class: 'rg-code' }, c.code), h('small', { class: 'muted' }, ` · ${c.nome || 'sem nome'} · ${c.usos} uso${c.usos === 1 ? '' : 's'} · último ${when(c.ultimo_uso)} · até ${c.expira_em ? new Date(c.expira_em).toLocaleDateString('pt-BR') : '—'}${c.ativo ? '' : ' · DESATIVADO'}`)),
        h('span', { class: 'row' }, h('button', { class: 'btn small ghost', type: 'button', disabled: codeBusy, onclick: async () => { try { await navigator.clipboard.writeText(c.code); toast('código copiado', { id: 'rg-cod', ms: 1500 }); } catch { toast(c.code, { id: 'rg-cod', ms: 6000 }); } } }, 'copiar'),
          h('button', { class: 'btn small ghost', type: 'button', disabled: codeBusy, onclick: () => codeDo(() => CODE.alterar(c.code, { ativo: !c.ativo }), c.ativo ? 'desativado' : 'ativado') }, c.ativo ? 'desativar' : 'ativar'),
          h('button', { class: 'btn small ghost', type: 'button', disabled: codeBusy, 'aria-label': `Apagar o código de ${c.nome || c.code}`, onclick: async () => { if (await confirmSheet('Apagar este código?', `${c.nome || ''} ${c.code}: o aluno perde o acesso.`, 'Apagar')) codeDo(() => CODE.apagar(c.code), 'apagado'); } }, '✕'))))),
      !codeList.length && codeLoaded ? h('p', { class: 'muted' }, 'nenhum código ainda.') : null);
  }
  codes.addEventListener('toggle', () => { if (codes.open && !codeLoaded) loadCodes(); });
  drawCodes();
  host.append(banner(jg[1], jg[2]), h('div', { class: 'row between pad-x rg-top' }, student ? h('a', { class: 'btn small rg-voltar', href: '#/jogos' }, '← voltar pros jogos') : h('a', { class: 'link', href: '#/kids' }, '← kids e jogos')), frame, ...(student ? [] : [codes]));
  document.documentElement.classList.add('rg-on');
  // o pacote avisa quando acerta/erra (figuras) e quando fecha uma música: aqui entram o Paul e a frase
  window.__bfb = (kind, withSound) => { const msg = FB.line(kind); if (withSound) FB.sound(kind); FB.paul(kind, msg, 1600); };
  let unlocked = false; let BRref = null;
  const gate = { ok: () => unlocked || AC.liberado(), pedir: () => CODE.pedir(), pendente: () => CODE.pendente(),
    check: async (c) => { const ok = await CODE.entrar(c); if (ok) { unlocked = true; AC.definir(true); } return ok; },
    conferir: async () => { const ok = await CODE.conferirPedido(); if (ok) { unlocked = true; AC.definir(true); } return ok; } };
  Promise.all([loadPackage(), student ? CODE.revalidar().then(async (ok) => { if (!ok && CODE.pendente()) ok = await CODE.conferirPedido().catch(() => false); unlocked = ok; if (ok) AC.definir(true); return ok; }) : Promise.resolve(true)]).then(([BR]) => {
    if (gone) return;
    BRref = BR;
    box.replaceChildren();
    // ★ dos jogos de ritmo entram na conta: a cada 15 ★ (somando todos os jogos) libera uma roleta de figurinhas
    const onStars = async ({ total }) => { const me = P.active(); if (!me) return; await P.patch(me.id, { ritmoStars: total }); const won = await Album.sincronizar(me.id);
      if (won) sheet(won === 1 ? '🎡 roleta liberada!' : `🎡 ${won} roletas liberadas!`, () => h('div', { class: 'sheet-body' }, h('p', {}, 'você juntou mais 15 ★. gire a roleta pra ganhar figurinhas!'), h('a', { class: 'kd-btn', href: student ? '#/album/Pacotes' : '#/figurinhas/Pacotes' }, 'abrir agora')));
      else toast(`★ ${Album.progressoTxt(me.id)}`, { id: 'rg-fig', ms: 1800 }); };
    const studentOpts = !student ? { builtin: true } : { builtin: true, readonly: true, gate, autoName: opts.name, hallTop: studentTop, hallAdd: studentAdd, onPlay: (key) => RK.top(`ritmo|${key}`, { fresh: true }).then(() => BR.refresh && BR.refresh()) };
    BR.mount('#jogos', { only: jg[0], storageKey: student ? 'beaterista-aluno-ritmo' : 'beaterista-ritmo', midiImport: false, songs: [], hallTop, hallAdd, ...studentOpts, onStars, onXp: async (n, why) => { await addXp(n, why); /* XP não aparece mais pra ninguém (pedido da Bea): só fica guardado em silêncio */ } });
    mounted = true;
  }).catch((e) => {
    if (gone) return;
    box.replaceChildren(h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'os jogos ainda não foram instalados.'), h('p', { class: 'muted' }, `faltam os arquivos rhythm-games.js e rhythm-games.css em ${BASE} (${e.message}).`)));
  });
  const off = () => {};
  return () => {
    stopPortal(); off(); gone = true; window.__bfb = null; document.documentElement.classList.remove('rg-on'); document.body.classList.remove('rz-lock');
    if (mounted && window.BeaterRhythm && window.BeaterRhythm.unmount) { try { window.BeaterRhythm.unmount(); } catch { /* o pacote já desmontou */ } }
  };
}

/** Modo Aventura do No Ritmo: mapa de desafios (#/ritmo/aventura) e missão (#/ritmo/aventura/<n>). Mesma rota do jogo normal, só outra tela. */
function mountAventura(host, parts) {
  let gone = false; let off = () => {};
  const wrap = h('div', { class: 'pad-x' }, h('p', { class: 'muted' }, 'carregando a aventura…')); host.append(wrap);
  Promise.all([import('../campanha/registry.js'), import('../campanha/run.js')]).then(async ([R, run]) => {
    const adv = await R.loadAdventure('noritmo'); if (gone) return;
    const n = parts[1] != null && /^\d+$/.test(parts[1]) ? Number(parts[1]) : null;
    off = run.mountAdventure(wrap, { gameId: 'noritmo', spec: adv.spec, adv, base: '#/ritmo/aventura', mission: n, backHref: '#/ritmo', nav: (hash) => { location.hash = hash; } });
  }).catch((e) => { console.warn('aventura indisponível', e); if (!gone) wrap.replaceChildren(h('p', { class: 'muted' }, 'a aventura não abriu.'), h('a', { class: 'btn wide', href: '#/ritmo' }, 'Voltar ao Beat Hero')); });
  return () => { gone = true; try { off(); } catch { /* ok */ } };
}
