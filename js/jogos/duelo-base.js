// Duelo em 2 celulares (base dos jogos): sala por código (online.js), mesma configuração nos dois aparelhos, "estou pronto" dos dois, contagem, cada um joga no seu
// aparelho e, no fim, os resultados são comparados (com revanche). Cada jogo entra com um adaptador (o que escolher, como jogar, como pontuar).
import { h } from '../util.js';
import { banner } from '../ui.js';
import { lobby, linkBadge } from './online.js';
import { portal } from '../rg-portal.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clone = (o) => JSON.parse(JSON.stringify(o));

/** Estado novo da sala: a configuração escolhida por quem criou, ninguém pronto e sem resultados. */
export const estadoInicial = (cfg) => ({ v: 1, cfg, ready: [false, false], res: [null, null], round: 1 });
/** Quem ganhou (0, 1 ou -1 = empate). `nota(res)` devolve um número (ou lista de números, desempate na ordem). Sem resultado dos dois não decide (null). */
export function vencedor(res, nota = (r) => r.score) {
  if (!res || !res[0] || !res[1]) return null;
  const a = [].concat(nota(res[0])); const b = [].concat(nota(res[1]));
  for (let i = 0; i < Math.max(a.length, b.length); i++) { const x = a[i] || 0; const y = b[i] || 0; if (x !== y) return x > y ? 0 : 1; }
  return -1;
}

/**
 * Adaptador (A): { jogo, titulo, sub, voltar:[href,texto], semCabecalho? (já está dentro de outra tela), frameClass?, carregar():Promise, config({ redraw }):{ nodes, cfg() }, resumo(cfg):[linha1, linha2],
 *   desbloquear(), jogar(box, cfg, fim(res)):()=>void, nota(res), placar(res):[grande, pequeno], aoSair?() }
 */
export function mountDueloBase(host, A) {
  let gone = false; let conn = null; let me = 0; let latest = null; let phase = 'config'; let seenRound = 0; let sent = false; let parar = null; const timers = [];
  const badge = linkBadge(); const root = h('div', { class: 'dl' });
  const box = h('div', { class: A.frameClass ? '' : 'dl-play', id: A.boxId || null }); const frame = h('div', { class: `${A.frameClass || 'dl-playframe'} dl-game`, hidden: true }, box);
  if (!A.semCabecalho) host.append(banner(A.titulo, A.sub), h('div', { class: 'pad-x' }, h('a', { class: 'jg-link', href: A.voltar[0] }, A.voltar[1])));
  host.append(root, frame); const stopPortal = A.frameClass === 'rg-host' ? portal(frame) : () => {}; // iPad: o jogo de ritmo vai pro <body> enquanto roda
  const later = (fn, ms) => { const t = setTimeout(() => { if (!gone) fn(); }, ms); timers.push(t); return t; };
  let cfgUI = null;

  function telaConfig() {
    phase = 'config'; cfgUI = A.config({ redraw: telaConfig });
    const L = lobby({ jogo: A.jogo, makeState: () => estadoInicial(cfgUI.cfg()), onStart: (c, st) => entrar(c, st) });
    root.replaceChildren(h('section', { class: 'card pad dl-cfg' }, h('b', {}, 'quem cria a sala escolhe'), ...cfgUI.nodes), h('section', { class: 'card pad' }, L.el));
  }
  function entrar(c, st) {
    conn = c; me = c.me; latest = st; badge.set(true); seenRound = st.round || 1; sent = false;
    c.on.state = (novo) => { latest = novo; aoMudar(); }; c.on.link = (ok) => badge.set(ok);
    phase = 'sala'; render();
  }
  async function atualizar(fn) { // cada celular só mexe no seu lugar; se o outro gravou na frente, espera o estado dele chegar e tenta de novo
    for (let i = 0; i < 6 && !gone; i++) { const base = clone(latest); fn(base); if (await conn.push(base)) { latest = base; return true; } await sleep(1400); }
    return false;
  }
  function aoMudar() {
    if (gone || !latest) return;
    if ((latest.round || 1) !== seenRound && (phase === 'resultado' || phase === 'sala')) { seenRound = latest.round || 1; sent = false; phase = 'sala'; }
    if (phase === 'sala' && latest.ready[0] && latest.ready[1]) { contagem(); return; }
    render();
  }
  function contagem() {
    phase = 'contagem'; let n = 3; render(n);
    const tick = () => { if (gone) return; n -= 1; if (n > 0) { render(n); later(tick, 1000); } else jogar(); };
    later(tick, 1000);
  }
  function jogar() {
    phase = 'jogando'; sent = false; root.hidden = true; frame.hidden = false;
    parar = A.jogar(box, latest.cfg, (res) => terminar(res));
  }
  async function terminar(res) {
    if (sent || gone) return; sent = true;
    try { if (parar) parar(); } catch { /* ok */ } parar = null;
    frame.hidden = true; box.replaceChildren(); root.hidden = false; phase = 'resultado'; render();
    await atualizar((s) => { s.res[me] = res; }); aoMudar();
  }
  function pronto() { try { A.desbloquear(); } catch { /* ok */ } atualizar((s) => { s.ready[me] = true; }).then(aoMudar); render(); }
  function revanche() { atualizar((s) => { s.ready = [false, false]; s.res = [null, null]; s.round = (s.round || 1) + 1; }).then(() => { seenRound = latest.round; sent = false; phase = 'sala'; render(); }); }
  const quem = (i) => (i === me ? 'você' : 'o outro');

  function render(n) {
    if (!latest || gone) return;
    const v = vencedor(latest.res, A.nota); const [l1, l2] = A.resumo(latest.cfg);
    const cab = h('section', { class: 'card pad dl-cab' }, badge.el, h('b', {}, l1), h('small', { class: 'muted' }, l2));
    const placar = h('div', { class: 'dl-pl' }, ...[me, 1 - me].map((i) => { const r = latest.res[i]; const [g, p] = r ? A.placar(r) : ['', '']; return h('div', { class: `dl-j${i === me ? ' eu' : ''}${v === i ? ' win' : ''}` }, h('small', {}, quem(i)),
      r ? h('b', {}, g) : h('b', { class: 'muted' }, latest.ready[i] ? 'pronto ✓' : 'esperando…'), r && p ? h('small', {}, p) : null); }));
    let corpo;
    if (phase === 'contagem') corpo = h('p', { class: 'dl-cont', role: 'status', 'aria-live': 'assertive' }, String(n || 1));
    else if (phase === 'resultado' || latest.res[me]) {
      corpo = v == null ? h('p', { class: 'jg-p', role: 'status' }, 'esperando o resultado do outro celular…')
        : h('div', { class: 'dl-fim' }, h('h2', { class: 'hand' }, v === -1 ? 'empate!' : v === me ? 'você venceu! 🏆' : 'o outro venceu desta vez'), h('button', { class: 'btn primary jo-go', type: 'button', onclick: revanche }, 'revanche'));
    } else corpo = latest.ready[me] ? h('p', { class: 'jg-p', role: 'status' }, 'você está pronto. esperando o outro celular…') : h('button', { class: 'btn primary jo-go', type: 'button', onclick: pronto }, 'estou pronto');
    root.replaceChildren(cab, placar, h('div', { class: 'dl-corpo' }, corpo), h('p', { class: 'muted dl-nota' }, 'quando os dois estiverem prontos, começa uma contagem. cada um joga no seu aparelho.'));
  }

  (async () => {
    root.replaceChildren(h('p', { class: 'muted' }, 'carregando…'));
    try { await A.carregar(); if (gone) return; telaConfig(); } catch { if (!gone) root.replaceChildren(h('p', { class: 'muted' }, 'não consegui abrir o duelo agora. confira a internet.')); }
  })();
  return () => {
    stopPortal(); gone = true; timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
    try { if (conn) conn.close(); } catch { /* ok */ } try { if (parar) parar(); } catch { /* ok */ } try { if (A.aoSair) A.aoSair(); } catch { /* ok */ }
  };
}
