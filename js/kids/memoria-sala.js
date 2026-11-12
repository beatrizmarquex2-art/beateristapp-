// Jogo da memória em 2 celulares (sala por código): cada pessoa joga no seu celular a MESMA mesa, em turnos.
// A partida inteira mora no estado da sala (js/kids/memoria-sala-logic.js); aqui só a tela e o vai-e-vem. Nada essencial fica só na memória do celular.
import { ganhou } from '../jogos/estrelas-jogo.js';
import { h } from '../util.js';
import { confirmSheet } from '../ui.js';
import * as FB from '../feedback.js';
import { linkBadge } from '../jogos/online.js';
import * as L from './memoria-sala-logic.js';

// o CSS desta tela mora em css/memoria-sala.css (carregado aqui, uma vez, pra não mexer nas páginas)
let cssOk = false;
function css() {
  if (cssOk || typeof document === 'undefined') return; cssOk = true;
  if (document.querySelector('link[data-memoria-sala]')) return;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = new URL('../../css/memoria-sala.css', import.meta.url).href; l.setAttribute('data-memoria-sala', ''); document.head.appendChild(l);
}

export const JOGO = 'memoria';
export const ESPERA_PAR = 1000; // ms que o par fica à vista antes de somar
export const ESPERA_ERRO = 1900; // ms que as duas cartas erradas ficam à vista nos dois celulares
export const ESPERA_RESERVA = 3500; // se quem tem a vez some, o outro celular fecha a jogada depois disso

/** Estado de uma mesa nova com as escolhas de quem cria. `th` = tema ({ id, title, items }). */
export const mesaNova = (th, pares, again) => L.novaMesa({ tema: th.id, titulo: th.title, pares, again, seed: L.novaSemente(), ids: th.items.map((x) => x.id) });

/** Mostra a mesa. `c` = { stage, themes(), locked(t), face(item), back(), FB?, bot }.
 *  Devolve { destroy, pause, resume, inProgress }. Pode ser chamada de novo com o estado da sala (voltar pra sala): reconstrói tudo só pelo estado. */
export function mostrarSala(c, conn, estado) {
  css();
  let e = estado; let gone = false; let paused = false; let rt = 0; let retry = 0; let key = ''; const me = conn.me;
  const badge = linkBadge(); badge.set(true);
  const nome = (i) => (i === me ? 'você' : 'o outro');
  const th = () => c.themes().find((t) => t.id === e.tema);
  const cards = (t) => { const m = new Map(t.items.map((x) => [x.id, x])); return e.deck.every((id) => m.has(id)) ? e.deck.map((id) => m.get(id)) : null; };
  const stage = c.stage; let refs = null;

  const sair = async () => { if (L.valido(e) && !e.fim && (e.achou[0].length || e.achou[1].length || e.virou.length) && !(await confirmSheet('sair da sala?', 'a partida atual será perdida.', 'sair'))) return; destroy(); c.back(); };
  const topo = (titulo) => h('div', { class: 'row kd-modes mem-top' }, h('b', {}, titulo), h('button', { class: 'kd-chip', type: 'button', onclick: sair }, 'sair da sala'));

  function bloqueio(t, motivo) {
    stage.replaceChildren(topo('mesa da sala'), badge.el, h('div', { class: 'ms-bloq', role: 'alert' }, h('b', {}, motivo), h('p', { class: 'muted' }, 'peça pra quem criou a sala começar uma mesa com um tema livre, ou entre com um código de aluno.')));
    refs = null; key = '';
  }

  function montar() {
    const t = th();
    if (!L.valido(e)) return bloqueio(null, 'essa sala não tem uma partida da memória');
    const nomeTema = e.titulo || e.tema;
    if (!t) return bloqueio(null, `não consegui abrir o tema “${nomeTema}” neste celular`);
    if (c.locked(t)) return bloqueio(t, `o tema “${t.title}” é só pra alunos com código`);
    const lista = cards(t); if (!lista) return bloqueio(t, `as cartas do tema “${t.title}” são diferentes neste celular`);
    lista.forEach((it) => { const i = new Image(); i.src = it.img; });
    const verso = t.verso ? `url(../${t.verso})` : t.back ? `url(../${t.back})` : null;
    const cells = lista.map((it, i) => {
      const bi = verso || `url(../assets/cards/b${String((i * 7 + (i >> 1)) % 10 + 1).padStart(2, '0')}.webp)`;
      return h('button', { type: 'button', class: 'kx-mem mem-photo', 'aria-label': 'carta virada para baixo', onclick: () => virar(i) },
        h('span', { class: 'kx-mem-in' }, h('span', { class: 'kx-mem-back', 'aria-hidden': 'true', style: `--bi:${bi}` }), h('span', { class: 'kx-mem-front', 'aria-hidden': 'true' }, c.face(it))));
    });
    const banner = h('p', { class: 'ms-vez', 'aria-live': 'polite' }); const placar = h('p', { class: 'ms-placar', 'aria-live': 'polite' }); const aviso = h('p', { class: 'ms-aviso muted', 'aria-live': 'polite' });
    const fim = h('div', { class: 'ms-fim' });
    const board = h('div', { class: `kx-board mem-board ms-board n${e.pares}`, style: '--cols:4' }, ...cells);
    const veu = h('div', { class: 'ms-veu', role: 'dialog', 'aria-label': 'pausado' }, h('b', {}, 'pausado'), h('button', { class: 'kd-btn', type: 'button', onclick: () => resume() }, 'continuar'));
    const wrap = h('div', { class: 'ms-mesa' }, board, veu);
    stage.replaceChildren(topo(t.title), badge.el, banner, placar, wrap, aviso, fim);
    refs = { cells, lista, banner, placar, aviso, fim, wrap, board };
    key = `${e.seed}:${e.mesa}:${e.tema}`;
  }

  function pintar() {
    if (gone) return;
    if (!refs || key !== `${e.seed}:${e.mesa}:${e.tema}`) montar();
    if (!refs) return;
    const { cells, lista, banner, placar, aviso, fim, wrap } = refs;
    const pen = L.pendente(e); const erro = pen && !L.ePar(e); const sc = L.placar(e);
    wrap.classList.toggle('paused', paused);
    cells.forEach((b, i) => {
      const ach = L.achada(e, i); const dono = e.achou[0].includes(i) ? 0 : e.achou[1].includes(i) ? 1 : -1; const up = e.virou.includes(i);
      b.classList.toggle('up', up); b.classList.toggle('ok', ach || (pen && !erro && up)); b.classList.toggle('no', erro && up);
      b.classList.toggle('ms-eu', dono === me); b.classList.toggle('ms-outro', dono >= 0 && dono !== me);
      b.setAttribute('aria-label', up || ach ? lista[i].name : 'carta virada para baixo');
      b.classList.toggle('ms-fora', !L.podeVirar(e, me, i));
    });
    placar.textContent = `você ${sc[me]} × ${sc[1 - me]} o outro`;
    if (e.fim) {
      const w = L.vencedor(e);
      banner.textContent = w === -1 ? 'empate!' : w === me ? 'você venceu!' : 'o outro venceu';
      banner.className = `ms-vez fim${w === me ? ' mine' : ''}`;
      aviso.textContent = '';
      const jaTem = fim.dataset.k === key; fim.dataset.k = key;
      if (!jaTem && w === me) ganhou('memoria', 1); // ganhou a partida em 2 celulares logados: 1 ★
      if (!jaTem) { FB.great(refs.board, { msg: w === me ? FB.line('great') : '' }); c.bot.set(w === -1 || w === me ? 'cheer' : 'happy', w === me ? 'você venceu!' : w === -1 ? 'empate!' : 'boa partida!'); }
      fim.replaceChildren(h('div', { class: 'row kx-act' }, h('button', { class: 'kd-btn', type: 'button', onclick: revanche }, 'revanche'), h('button', { class: 'kd-chip', type: 'button', onclick: sair }, 'sair da sala')));
    } else {
      fim.replaceChildren(); delete fim.dataset.k;
      const minha = e.vez === me;
      banner.textContent = minha ? 'sua vez' : 'vez do outro'; banner.className = `ms-vez${minha ? ' mine' : ''}`;
      aviso.textContent = erro ? 'não é par…' : pen ? 'achou um par!' : minha ? (e.virou.length === 1 ? 'vire mais uma carta' : 'vire duas cartas') : '';
    }
  }

  const fim_ = () => gone;
  /** põe o estado novo na tela e manda pro outro celular (com nova tentativa se a internet cair) */
  function enviar(novo) {
    e = novo; pintar(); agenda(); mandar(novo);
  }
  function mandar(alvo) {
    clearTimeout(retry); retry = 0;
    conn.push(alvo).then((ok) => {
      if (fim_() || ok || e !== alvo) return; // ok, ou o estado do outro celular já entrou no lugar do meu
      retry = setTimeout(() => { if (!fim_() && e === alvo) mandar(alvo); }, 1500);
    });
  }
  function virar(pos) {
    if (gone || paused) return;
    const n = L.virar(e, me, pos); if (!n) return;
    enviar(n);
  }
  /** fecha a jogada (par ou erro) depois de um tempinho; o outro celular só fecha se quem tem a vez sumir */
  function agenda() {
    clearTimeout(rt); rt = 0;
    if (gone || paused || !L.pendente(e)) return;
    const base = L.ePar(e) ? ESPERA_PAR : ESPERA_ERRO; const ref = e;
    rt = setTimeout(() => { rt = 0; if (gone || paused || e !== ref || !L.pendente(e)) return; enviar(L.resolver(e)); }, e.vez === me ? base : base + ESPERA_RESERVA);
  }
  function revanche() {
    if (!e.fim) return; const t = th(); enviar(L.revanche(e, t ? t.items.map((x) => x.id) : null));
  }

  conn.on.state = (st) => { if (gone) return; e = st; pintar(); agenda(); };
  conn.on.link = (v) => badge.set(v);
  pintar(); agenda();
  c.bot.set('think', e && e.vez === me ? 'sua vez!' : 'vez do outro');

  function pause() { if (gone || paused) return; paused = true; clearTimeout(rt); rt = 0; pintar(); }
  function resume() { if (gone || !paused) return; paused = false; pintar(); agenda(); }
  function destroy() { gone = true; clearTimeout(rt); clearTimeout(retry); conn.on.state = null; conn.on.link = null; conn.close(); }
  return { destroy, pause, resume, inProgress: () => !gone && L.valido(e) && !e.fim && !!(e.achou[0].length || e.achou[1].length || e.virou.length), estado: () => e };
}
