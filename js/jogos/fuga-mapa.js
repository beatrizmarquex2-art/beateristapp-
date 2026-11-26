// Mapa "Escape Room · Laboratório do Paul" (mundo 1 da Fuga do Estúdio): uma sala comprida de laboratório com lasers (arte da Bea, assets/jogos/fuga/lab-sala.webp),
// 12 discos de vinil ligados por um raio laser até a porta SAÍDA (a porta bônus B). O Paul fica no disco da vez e anda até o próximo quando a fase é concluída.
import { h } from '../util.js';
import { corSrc } from '../paul-cor.js';

export const IMG = { w: 1023, h: 1894 };
const XS = [32, 66, 38, 68, 30, 62, 36, 70, 34, 64, 40, 60]; // x de cada disco (% da largura): zigue-zague pelo meio da sala
/** Posição (em % da sala) de cada um dos 12 discos, de baixo pra cima, e da porta SAÍDA. */
export const POS = XS.map((x, i) => ({ x, y: 90 - i * 5.9 }));
export const POS_SAIDA = { x: 50, y: 9.6 };
const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const VB_H = (100 * IMG.h) / IMG.w;
const pt = (p) => `${p.x},${(p.y * VB_H) / 100}`;

/**
 * cfg = { titulo, subtitulo, fases: [{ n, portas, desafio, stars, state: 'done'|'open'|'locked' }], bonus: { state: 'locked'|'open'|'done' },
 *         lastKey, onOpen(n), onBonus(), onLocked(n) }
 */
export function mountFugaMapa(host, cfg) {
  const { fases, bonus } = cfg; const feitas = fases.filter((f) => f.state === 'done').length; const estrelas = fases.reduce((t, f) => t + (f.stars || 0), 0);
  let atual = fases.findIndex((f) => f.state === 'open'); if (atual < 0) atual = fases.every((f) => f.state === 'done') ? fases.length - 1 : 0;
  const head = h('div', { class: 'fm-head' }, h('div', { class: 'fm-tit' }, h('b', {}, cfg.titulo || 'Escape Room'), h('small', {}, cfg.subtitulo || 'Laboratório do Paul')),
    h('span', { class: 'fm-chip', title: 'fases concluídas' }, `◉ ${feitas}/${fases.length}`), h('span', { class: 'fm-chip', title: 'estrelas do mundo' }, `★ ${estrelas}/${fases.length * 3}`));
  const sala = h('div', { class: 'fm-sala', style: `aspect-ratio:${IMG.w}/${IMG.h}` });
  // raio laser ligando os discos até a SAÍDA: aceso até o disco da vez, apagadinho depois
  const pts = [...POS.slice(0, fases.length), POS_SAIDA];
  const seg = (i) => `M${pt(pts[i])}L${pt(pts[i + 1])}`;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'fm-lasers'); svg.setAttribute('viewBox', `0 0 100 ${VB_H}`); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = pts.slice(0, -1).map((_, i) => {
    const acesa = i < atual || (i === atual && fases[atual].state === 'done') || (i === pts.length - 2 && bonus.state !== 'locked'); const alvoFeito = i < fases.length && fases[i].state === 'done';
    return `<path d="${seg(i)}" class="fm-glow ${acesa || alvoFeito ? 'on' : 'off'}"/><path d="${seg(i)}" class="fm-core ${acesa || alvoFeito ? 'on' : 'off'}"/>`;
  }).join('');
  sala.append(svg);
  fases.forEach((f, i) => {
    const p = POS[i]; const est = f.stars ? '★'.repeat(f.stars) + '☆'.repeat(3 - f.stars) : '';
    const b = h('button', { type: 'button', class: `fm-no st-${f.state}${i === atual ? ' cur' : ''}${f.desafio ? ' des' : ''}`, style: `left:${p.x}%;top:${p.y}%`, 'data-n': String(f.n), 'aria-label': `fase ${f.n}, ${f.desafio ? 'desafio, ' : ''}${f.portas} porta${f.portas === 1 ? '' : 's'}${f.state === 'done' ? `, ${f.stars} de 3 estrelas` : f.state === 'locked' ? ', trancada' : ''}`,
      onclick: () => { if (f.state === 'locked') { if (cfg.onLocked) cfg.onLocked(f.n); return; } cfg.onOpen(f.n); } },
      h('span', { class: 'fm-num' }, f.state === 'locked' ? '🔒' : String(f.n)), est ? h('i', { class: 'fm-es', 'aria-hidden': 'true' }, est) : null,
      h('small', { class: 'fm-lab' }, f.desafio ? '⚡ desafio' : `${f.portas} portas`));
    sala.append(b);
  });
  // SAÍDA = porta bônus B (por cima da porta desenhada)
  const saidaTxt = bonus.state === 'done' ? '✓ porta B aberta' : bonus.state === 'open' ? '★ porta B · toque!' : 'porta B · termine a fase 12';
  sala.append(h('button', { type: 'button', class: `fm-saida st-${bonus.state}`, style: `left:${POS_SAIDA.x}%;top:${POS_SAIDA.y}%`, 'aria-label': `porta bônus B, ${bonus.state === 'locked' ? 'trancada' : bonus.state === 'done' ? 'aberta' : 'liberada'}`, onclick: () => { if (bonus.state === 'locked') { if (cfg.onLocked) cfg.onLocked('B'); return; } cfg.onBonus(); } }, h('small', {}, saidaTxt)));
  // o Paul: fica ao lado do disco da vez; se acabou de concluir uma fase, anda do disco antigo até o novo
  const key = cfg.lastKey || 'beaterista-fuga-paul'; let antes = -1; try { antes = Number(sessionStorage.getItem(key)); if (!Number.isFinite(antes)) antes = -1; } catch { antes = -1; }
  // o Paul fica do lado contrário ao do próximo disco (não tapa o caminho nem o número do vizinho)
  const noP = (i) => { const prox = i + 1 < fases.length ? POS[i + 1] : POS_SAIDA; const lado = prox.x >= POS[i].x ? -1 : 1; return { left: `${POS[i].x + lado * 15}%`, top: `${POS[i].y - 1.2}%` }; };
  const paul = h('div', { class: 'fm-paul' }, h('span', { class: 'fm-fala' }, 'bora!'), h('img', { src: corSrc('baquetas-pra-cima'), alt: '', draggable: 'false' }));
  const anda = antes >= 0 && antes < atual && !reduced(); const ini = noP(anda ? antes : atual); paul.style.left = ini.left; paul.style.top = ini.top; sala.append(paul);
  try { sessionStorage.setItem(key, String(atual)); } catch { /* sem armazenamento */ }
  if (anda) setTimeout(() => { const f = noP(atual); paul.classList.add('anda'); paul.style.left = f.left; paul.style.top = f.top; }, 350);
  host.append(head, sala);
  setTimeout(() => { const c = sala.querySelector('.fm-no.cur'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'center' }); }, 60);
  return () => {};
}
