// pauLta: mapa de aventura (cenário em pixel-vetor, trilha brilhante, discos de vinil como fases, Paul na fase atual e palco no final).
import { h } from '../util.js';
import { roboMarkup } from '../kids/robo.js';
import { toast } from '../ui.js';
import * as S from './score.js';
import { phaseSpec, WORLDS } from './worlds.js';

const BASE = '#/paulta';
const PITCH = 150; const TOP = 96;
const xOf = (i) => Math.round(50 + 24 * Math.sin(i * 1.1));

/* cores de cada região (céu, parede, trilha) */
const THEME = {
  drum: { sky: ['#1d1040', '#4a2478', '#a8456a'], wall: '#35205f', path: '#b57bf2', glow: '#ffcf5a', win: '#ffb347' },
  sol: { sky: ['#14275f', '#3f6bbd', '#9db8e8'], wall: '#243a78', path: '#8fc0ff', glow: '#ffe27a', win: '#ffe9a8' },
  fa: { sky: ['#081f27', '#1d5560', '#4f9a9a'], wall: '#16404a', path: '#7be3d0', glow: '#d8ff9a', win: '#bff3e6' },
  duel: { sky: ['#1f0a12', '#6b1f33', '#c0603f'], wall: '#4a1827', path: '#ff8f6b', glow: '#ffd36b', win: '#ffb89a' },
};

const skyline = (t) => {
  const b = (x, w, hgt, lit) => `<rect x="${x}" y="${520 - hgt}" width="${w}" height="${hgt}" fill="#120a26"/>${lit.map(([wx, wy]) => `<rect x="${x + wx}" y="${520 - hgt + wy}" width="5" height="6" fill="${t.win}" opacity=".85"/>`).join('')}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 520">${b(20, 46, 120, [[8, 12], [24, 12], [8, 34], [30, 54], [14, 74]])}${b(70, 34, 84, [[8, 10], [20, 30]])}${b(108, 52, 150, [[10, 14], [30, 14], [10, 40], [34, 62], [20, 96]])}${b(166, 40, 96, [[8, 12], [24, 40]])}${b(214, 56, 130, [[10, 12], [34, 36], [14, 66], [38, 90]])}${b(276, 36, 88, [[10, 14], [22, 44]])}${b(318, 50, 118, [[8, 12], [28, 34], [12, 60], [30, 84]])}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

const disc = (state) => {
  const body = state === 'locked' ? '#3b3548' : '#0d0a14'; const label = state === 'locked' ? '#6f6880' : state === 'done' ? '#d8394d' : '#e8455a'; const ring = state === 'now' ? '#ffcf5a' : state === 'done' ? '#ffcf5a' : '#5a4a7a';
  return `<svg viewBox="0 0 90 70" aria-hidden="true"><ellipse cx="45" cy="42" rx="38" ry="24" fill="#05030a"/><ellipse cx="45" cy="37" rx="38" ry="24" fill="${body}" stroke="${ring}" stroke-width="3"/><ellipse cx="45" cy="37" rx="30" ry="18.5" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width="1.4"/><ellipse cx="45" cy="37" rx="23" ry="14" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="1.4"/><path d="M22 22q12-8 28-6" stroke="#fff" stroke-opacity=".25" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="45" cy="37" rx="17" ry="10.5" fill="${label}" stroke="#fff" stroke-width="2"/></svg>`;
};
const platform = (boss) => `<svg viewBox="0 0 150 46" aria-hidden="true"><path d="M6 14h138l-6 28H12z" fill="#4a3278" stroke="#1a0f33" stroke-width="3" stroke-linejoin="round"/><path d="M14 24h122M20 33h110" stroke="#2c1a55" stroke-width="2"/><path d="M40 14v10M78 14v10M112 14v10M58 24v9M96 24v9" stroke="#2c1a55" stroke-width="2"/><path d="M2 14q8-9 18-6t18-2 18 4 18-3 18 3 18-4 18 3 18-1v6z" fill="#69b34f" stroke="#1a0f33" stroke-width="2.5" stroke-linejoin="round"/>${boss ? '<circle cx="14" cy="12" r="3" fill="#ffcf5a"/><circle cx="136" cy="12" r="3" fill="#ffcf5a"/>' : ''}</svg>`;
const stageSvg = (on) => `<svg viewBox="0 0 170 120" aria-hidden="true"><rect x="12" y="34" width="10" height="82" fill="#3d2a6e" stroke="#120a26" stroke-width="3"/><rect x="148" y="34" width="10" height="82" fill="#3d2a6e" stroke="#120a26" stroke-width="3"/><rect x="8" y="22" width="154" height="16" rx="3" fill="#5a3f9a" stroke="#120a26" stroke-width="3"/><path d="M12 38l12-16M32 38l12-16M52 38l12-16M72 38l12-16M92 38l12-16M112 38l12-16M132 38l12-16" stroke="#120a26" stroke-width="2"/><rect x="22" y="40" width="126" height="76" fill="${on ? '#6d3aa8' : '#2b1a52'}"/><path d="M40 40l-18 76h40zM130 40l18 76h-40z" fill="${on ? '#ffcf5a' : '#4a3a70'}" opacity="${on ? '.35' : '.2'}"/><circle cx="40" cy="30" r="6" fill="${on ? '#ffcf5a' : '#6a5a8a'}"/><circle cx="130" cy="30" r="6" fill="${on ? '#ffcf5a' : '#6a5a8a'}"/><path d="M85 -2l5 10 11 1.6-8 7.6 2 11L85 22l-10 5.2 2-11-8-7.6 11-1.6z" transform="translate(0 0)" fill="${on ? '#ffcf5a' : '#8a7aa8'}" stroke="#120a26" stroke-width="2.5"/><ellipse cx="85" cy="92" rx="30" ry="10" fill="#120a26" opacity=".6"/><path d="M62 92q0-26 23-26t23 26" fill="#120a26"/><rect x="40" y="100" width="20" height="14" rx="2" fill="#120a26"/><rect x="110" y="100" width="20" height="14" rx="2" fill="#120a26"/></svg>`;
const PROPS = [
  `<svg viewBox="0 0 60 70"><rect x="6" y="4" width="48" height="62" rx="6" fill="#241540" stroke="#0e0820" stroke-width="3"/><circle cx="30" cy="22" r="8" fill="#4a3278" stroke="#0e0820" stroke-width="2"/><circle cx="30" cy="46" r="13" fill="#4a3278" stroke="#0e0820" stroke-width="2"/><circle cx="30" cy="46" r="5" fill="#8a6ad0"/></svg>`,
  `<svg viewBox="0 0 80 50"><rect x="4" y="6" width="72" height="38" rx="5" fill="#d8394d" stroke="#0e0820" stroke-width="3"/><rect x="14" y="12" width="52" height="16" rx="3" fill="#f3e4d2"/><circle cx="26" cy="20" r="5" fill="#2a1850"/><circle cx="54" cy="20" r="5" fill="#2a1850"/><path d="M18 44l6-10h32l6 10" fill="#2a1850"/></svg>`,
  `<svg viewBox="0 0 80 60"><path d="M6 20l68-4 0 40H6z" fill="#8a5a2a" stroke="#0e0820" stroke-width="3"/><rect x="14" y="4" width="14" height="32" fill="#7b4bd0" stroke="#0e0820" stroke-width="2" transform="rotate(-8 21 20)"/><rect x="32" y="2" width="14" height="34" fill="#d8394d" stroke="#0e0820" stroke-width="2"/><rect x="50" y="4" width="14" height="32" fill="#3f6bbd" stroke="#0e0820" stroke-width="2" transform="rotate(8 57 20)"/></svg>`,
  `<svg viewBox="0 0 56 70"><rect x="4" y="4" width="48" height="62" rx="4" fill="#5a2a78" stroke="#0e0820" stroke-width="3"/><path d="M32 12l-12 24h10l-4 22 16-28H30z" fill="#ffcf5a" stroke="#0e0820" stroke-width="2" stroke-linejoin="round"/></svg>`,
];

/** O mapa completo: cenário + trilha + discos + Paul + palco. Devolve { scene, hud }. */
export function adventureMap({ w, p, mode, me }) {
  const W = WORLDS[w]; const n = W.count; const T = THEME[w]; const H = TOP + n * PITCH + 250;
  const dn = (k) => !!p.done[`${w}:${k}`]; let cur = 0; for (let k = 1; k <= n; k++) if (!dn(k)) { cur = k; break; }
  const full = cur === 0;
  const pos = Array.from({ length: n + 1 }, (_, i) => ({ x: i === n ? 50 : xOf(i), y: TOP + i * PITCH }));
  const scene = h('div', { class: 'adv', 'data-world': w, style: `height:${H}px;--sky1:${T.sky[0]};--sky2:${T.sky[1]};--sky3:${T.sky[2]};--wall:${T.wall};--pc:${T.path};--glow:${T.glow};--city:${skyline(T)}` });
  scene.append(h('div', { class: 'adv-stars' }), h('div', { class: 'adv-city' }), h('div', { class: 'adv-wall l' }), h('div', { class: 'adv-wall r' }));
  // adereços nas laterais
  for (let y = 210, k = 0; y < H - 330; y += 330, k++) { const el = h('div', { class: `adv-prop ${k % 2 ? 'r' : 'l'}`, style: `top:${y}px` }); el.innerHTML = PROPS[k % PROPS.length]; scene.append(el); }
  // trilha
  const seg = []; for (let i = 0; i < n; i++) { const a = pos[i]; const b = pos[i + 1]; const my = (a.y + b.y) / 2; seg.push({ d: `M${a.x} ${a.y} C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`, on: dn(i + 1) }); }
  const road = h('div', { class: 'adv-road' });
  road.innerHTML = `<svg viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true">${seg.map((s) => `<path class="o" d="${s.d}"/>`).join('')}${seg.map((s) => `<path class="m${s.on ? ' on' : ''}" d="${s.d}"/>`).join('')}${seg.map((s) => `<path class="s${s.on ? ' on' : ''}" d="${s.d}"/>`).join('')}</svg>`;
  scene.append(road);
  // discos (fases)
  for (let k = 1; k <= n; k++) {
    const sp = phaseSpec(w, k); const ph = p.ph[S.phKey(w, k, mode)]; const st = ph ? ph.s : 0; const open = S.unlocked(p, w, k); const done = dn(k);
    const boss = sp.sudden || k === n; const state = !open ? 'locked' : done ? 'done' : 'now'; const c = pos[k - 1];
    const plat = h('span', { class: 'adv-plat' }); plat.innerHTML = platform(boss);
    const dsc = h('span', { class: 'adv-disc' }); dsc.innerHTML = disc(state);
    const badge = [sp.secs ? '⏱' : '', sp.sudden ? '💥' : ''].filter(Boolean).join('');
    const body = [plat, dsc, h('b', { class: 'adv-n' }, open ? String(k) : '🔒'), badge ? h('i', { class: 'adv-bd' }, badge) : null, boss ? h('i', { class: 'adv-crown' }, k === n ? '👑' : '⚔️') : null,
      h('span', { class: 'adv-st' }, ...[1, 2, 3].map((q) => h('i', { class: q <= st ? 'on' : '' }, '★'))), h('small', { class: 'adv-t' }, open ? sp.title : `fase ${k}`)];
    const cls = `adv-node ${state}${boss ? ' boss' : ''}`; const style = `left:${c.x}%;top:${c.y}px`;
    scene.append(open ? h('a', { class: cls, href: `${BASE}/${w}/${k}/${mode}`, 'aria-label': `Fase ${k}: ${sp.title}`, style }, ...body)
      : h('button', { type: 'button', class: cls, 'aria-label': `Fase ${k} trancada`, style, onclick: () => toast('conclua a fase anterior pra abrir o caminho', { ms: 2200 }) }, ...body));
  }
  // palco no fim
  const fin = pos[n]; const stage = h(full ? 'a' : 'div', { class: `adv-goal${full ? ' on' : ''}`, style: `left:${fin.x}%;top:${fin.y + 30}px`, ...(full ? { href: `${BASE}/aula/${w}` } : {}) }, h('span', { class: 'adv-stage' }), h('small', {}, full ? '🏆 mundo concluído · aulinha do Paul' : 'o palco te espera'));
  stage.querySelector('.adv-stage').innerHTML = stageSvg(full); scene.append(stage);
  // Paul
  const target = full ? { x: pos[n].x, y: pos[n].y + 70 } : pos[cur - 1]; let from = target;
  try { const sv = JSON.parse(sessionStorage.getItem(`pl-pos-${me.id}-${w}`) || 'null'); if (sv && sv.k && sv.k !== (full ? n + 1 : cur) && sv.k <= n) from = pos[sv.k - 1]; } catch { /* ok */ }
  const pl = h('div', { class: `adv-paul${target.x < 50 ? ' r' : ''}`, style: `left:${from.x}%;top:${from.y}px`, 'aria-hidden': 'true' }); pl.innerHTML = `${roboMarkup(full ? 'cheer' : 'walk', 0)}<span class="adv-bub">♪</span>`; scene.append(pl);
  requestAnimationFrame(() => requestAnimationFrame(() => { pl.style.left = `${target.x}%`; pl.style.top = `${target.y}px`; }));
  try { sessionStorage.setItem(`pl-pos-${me.id}-${w}`, JSON.stringify({ k: full ? n + 1 : cur })); } catch { /* ok */ }
  setTimeout(() => { if (scene.isConnected) { const t = scene.querySelector('.adv-node.now, .adv-goal.on'); if (t && t.scrollIntoView) t.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); } }, 400);

  // painel de baixo: progresso, estrelas, conquistas, continuar
  const doneN = S.worldProgress(p, w); let stars = 0; for (let k = 1; k <= n; k++) stars += (p.ph[S.phKey(w, k, mode)] || {}).s || 0;
  const earned = Object.keys(p.titles || {}).length; let seen = 0; try { seen = Number(localStorage.getItem(`pl-seen-${me.id}`) || 0); } catch { /* ok */ }
  const hud = h('div', { class: 'adv-hud' },
    h('div', { class: 'adv-h1' }, h('small', {}, 'progresso'), h('b', {}, `${doneN} / ${n}`, h('em', {}, ' fases')), h('span', { class: 'adv-bar' }, h('i', { style: `width:${Math.round((doneN / n) * 100)}%` }))),
    h('div', { class: 'adv-h2' }, h('span', {}, '⭐'), h('small', {}, 'estrelas'), h('b', {}, `${stars} / ${n * 3}`)),
    h('a', { class: 'adv-h3', href: `${BASE}/perfil`, onclick: () => { try { localStorage.setItem(`pl-seen-${me.id}`, String(earned)); } catch { /* ok */ } } }, h('span', {}, '🏆'), h('small', {}, 'conquistas'), earned > seen ? h('i', { class: 'adv-dot' }, '!') : null),
    h('a', { class: 'adv-go', href: full ? `${BASE}/aula/${w}` : `${BASE}/${w}/${cur}/${mode}` }, '▶ ', full ? 'aulinha' : 'continuar'));
  return { scene, hud };
}
