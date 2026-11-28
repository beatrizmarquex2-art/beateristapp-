// Mensagens e reações na sala por código (pedido da Bea). Sem texto livre: só os 16 Pauls (assets/paul/emojis) e frases prontas, porque tem criança na sala.
// O envio e a chegada moram na conexão (js/jogos/online.js: conn.falar(k) e o evento 'bt-fala-sala'); aqui é só a tela.
import { h } from '../util.js';
import { salaAtual, REACOES, FRASES, falaRotulo } from './online.js';

const MUDO = 'bt-falas-mudo';
const lerMudo = () => { try { return localStorage.getItem(MUDO) === '1'; } catch { return false; } };
const gravaMudo = (v) => { try { localStorage.setItem(MUDO, v ? '1' : '0'); } catch { /* sem armazenamento */ } };
export const imgPaul = (id) => `assets/paul/emojis/paul-${id}.webp`;

/** Monta o botão "falar" e os avisos que chegam. Devolve { el, off }: `el` vai na moldura do jogo, `off` solta os ouvintes. */
export function montarFalas(host) {
  let mudo = lerMudo(); let bandeja = null; let timer = 0;
  const aviso = h('div', { class: 'fl-aviso', role: 'status', 'aria-live': 'polite', hidden: true });
  const btn = h('button', { type: 'button', class: 'fl-btn', 'aria-label': 'mandar reação ou mensagem pra sala', hidden: true, onclick: () => abre() }, h('img', { src: imgPaul('joinha'), alt: '', draggable: 'false' }), 'falar');
  const mostra = (d) => {
    const s = salaAtual(); if (!s) return; const c = s.conn;
    if (d.eu === undefined && mudo) return;
    const reacao = d.k.startsWith('r:'); const quem = d.eu ? 'você' : c.nomeDe(d.seat, 'o outro');
    aviso.className = `fl-aviso${d.eu ? ' eu' : ''}`;
    aviso.replaceChildren(reacao ? h('img', { src: imgPaul(d.k.slice(2)), alt: falaRotulo(d.k), draggable: 'false' }) : null, h('span', {}, h('b', {}, quem), reacao ? ` mandou ${falaRotulo(d.k)}` : `: ${falaRotulo(d.k)}`));
    aviso.hidden = false; clearTimeout(timer); timer = setTimeout(() => { aviso.hidden = true; }, d.eu ? 1800 : 3800);
  };
  const envia = (k) => { const s = salaAtual(); if (!s) return; s.conn.falar(k).then((ok) => { if (!ok) { /* rápido demais ou sem conexão: o botão volta a valer em instantes */ } }); fecha(); };
  const fecha = () => { if (bandeja) { bandeja.remove(); bandeja = null; btn.focus(); } };
  const abre = () => {
    if (bandeja) return fecha();
    const mudoChip = h('button', { type: 'button', class: 'fl-mudo', 'aria-pressed': String(mudo), onclick: () => { mudo = !mudo; gravaMudo(mudo); mudoChip.setAttribute('aria-pressed', String(mudo)); mudoChip.textContent = mudo ? 'ver o que os outros mandam' : 'esconder o que os outros mandam'; } }, mudo ? 'ver o que os outros mandam' : 'esconder o que os outros mandam');
    bandeja = h('div', { class: 'fl-bandeja', role: 'dialog', 'aria-label': 'reações e mensagens' },
      h('div', { class: 'fl-grade', role: 'group', 'aria-label': 'reações' }, ...REACOES.map(([id, rot]) => h('button', { type: 'button', 'aria-label': rot, onclick: () => envia(`r:${id}`) }, h('img', { src: imgPaul(id), alt: '', loading: 'lazy', draggable: 'false' })))),
      h('div', { class: 'fl-frases jg-seg', role: 'group', 'aria-label': 'mensagens' }, ...FRASES.map(([id, rot]) => h('button', { type: 'button', onclick: () => envia(`f:${id}`) }, rot))),
      mudoChip, h('button', { type: 'button', class: 'fl-fechar', onclick: fecha }, 'fechar'));
    host.append(bandeja); const b = bandeja.querySelector('button'); if (b) b.focus();
  };
  const atualiza = () => { const s = salaAtual(); btn.hidden = !s; if (!s) { fecha(); aviso.hidden = true; } };
  const onKey = (e) => { if (e.key === 'Escape') fecha(); };
  const onFala = (e) => mostra(e.detail);
  document.addEventListener('bt-fala-sala', onFala); document.addEventListener('bt-pausa-sala', atualiza); document.addEventListener('bt-perfis-sala', atualiza); document.addEventListener('keydown', onKey);
  atualiza();
  return { el: h('div', { class: 'fl-caixa' }, btn, aviso), off() { clearTimeout(timer); document.removeEventListener('bt-fala-sala', onFala); document.removeEventListener('bt-pausa-sala', atualiza); document.removeEventListener('bt-perfis-sala', atualiza); document.removeEventListener('keydown', onKey); if (bandeja) bandeja.remove(); } };
}
