// Estudos com som: dicionário de acordes (violão/guitarra e teclado) e ritmos de bateria. Tudo sintetizado, nada é baixado.
import { h } from '../util.js';
import { audio, kick, snare, hihat, tom } from '../audio.js';
import { pluck } from '../instruments.js';
import { epiano, rim } from '../synth.js';
import { banner } from '../ui.js';

const NOMES = ['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Lá♯', 'Si'];
const CIFRA = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const NS = 'http://www.w3.org/2000/svg';
const svg = (w, hh, inner, cls) => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', `0 0 ${w} ${hh}`); s.setAttribute('class', cls || ''); s.setAttribute('role', 'img'); s.innerHTML = inner; return s; };
const voltar = (href, t) => h('a', { class: 'jg-link', href }, t);

/* ---------------- acordes de violão / guitarra ---------------- */
// frets da corda mais grave (mi) pra mais aguda (mi); -1 = não toca a corda; 0 = solta
export const VIOLAO = [
  ['C', 'Dó maior', [-1, 3, 2, 0, 1, 0]], ['D', 'Ré maior', [-1, -1, 0, 2, 3, 2]], ['E', 'Mi maior', [0, 2, 2, 1, 0, 0]], ['F', 'Fá maior (pestana)', [1, 3, 3, 2, 1, 1]],
  ['G', 'Sol maior', [3, 2, 0, 0, 0, 3]], ['A', 'Lá maior', [-1, 0, 2, 2, 2, 0]], ['B', 'Si maior (pestana)', [-1, 2, 4, 4, 4, 2]],
  ['Am', 'Lá menor', [-1, 0, 2, 2, 1, 0]], ['Dm', 'Ré menor', [-1, -1, 0, 2, 3, 1]], ['Em', 'Mi menor', [0, 2, 2, 0, 0, 0]], ['Bm', 'Si menor (pestana)', [-1, 2, 4, 4, 3, 2]],
  ['C7', 'Dó com sétima', [-1, 3, 2, 3, 1, 0]], ['D7', 'Ré com sétima', [-1, -1, 0, 2, 1, 2]], ['E7', 'Mi com sétima', [0, 2, 0, 1, 0, 0]], ['G7', 'Sol com sétima', [3, 2, 0, 0, 0, 1]], ['A7', 'Lá com sétima', [-1, 0, 2, 0, 2, 0]],
];
const ABERTAS = [40, 45, 50, 55, 59, 64];
function diagrama(frets) {
  const x = (i) => 22 + i * 17; const y = (f) => 30 + f * 21; let s = '';
  for (let i = 0; i < 6; i++) s += `<line x1="${x(i)}" y1="${y(0)}" x2="${x(i)}" y2="${y(5)}" stroke="#14111a" stroke-width="${2.4 - i * 0.28}"/>`;
  for (let f = 0; f <= 5; f++) s += `<line x1="${x(0)}" y1="${y(f)}" x2="${x(5)}" y2="${y(f)}" stroke="#14111a" stroke-width="${f === 0 ? 5 : 1.5}"/>`;
  frets.forEach((f, i) => { if (f < 0) s += `<text x="${x(i)}" y="22" text-anchor="middle" font-size="15" font-weight="800" fill="#BD1733">×</text>`; else if (f === 0) s += `<circle cx="${x(i)}" cy="17" r="5" fill="none" stroke="#17365B" stroke-width="2.2"/>`; else s += `<circle cx="${x(i)}" cy="${y(f) - 10.5}" r="8" fill="#17365B"/>`; });
  return svg(110, 140, s, 'ac-diag');
}
function tocaViolao(frets, kind = 'acoustic') {
  const c = audio(); const t = c.currentTime + 0.05;
  frets.forEach((f, i) => { if (f >= 0) pluck(ABERTAS[i] + f, 0.85, t + i * 0.05, kind); });
}

/* ---------------- acordes de teclado ---------------- */
const TIPOS = [['maior', [0, 4, 7], ''], ['menor', [0, 3, 7], 'm'], ['com sétima', [0, 4, 7, 10], '7'], ['menor com sétima', [0, 3, 7, 10], 'm7'], ['maior com sétima maior', [0, 4, 7, 11], 'maj7']];
const BRANCAS = [0, 2, 4, 5, 7, 9, 11];
function tecladoSVG(notas) {
  // 2 oitavas: de Dó4 (60) a Si5 (83)
  const W = 26; const set = new Set(notas); let brancas = ''; let pretas = ''; let i = 0;
  for (let m = 60; m <= 83; m++) { const pc = m % 12; if (BRANCAS.includes(pc)) { const on = set.has(m); brancas += `<rect x="${i * W + 1}" y="2" width="${W - 2}" height="100" rx="4" fill="${on ? '#EBA332' : '#fffdf7'}" stroke="#14111a" stroke-width="2"/>${on ? `<text x="${i * W + W / 2}" y="94" text-anchor="middle" font-size="9" font-weight="800" fill="#14111a">${CIFRA[pc]}</text>` : ''}`; i++; } }
  i = 0;
  for (let m = 60; m <= 83; m++) { const pc = m % 12; if (BRANCAS.includes(pc)) { i++; continue; } const on = set.has(m); pretas += `<rect x="${i * W - 8}" y="2" width="16" height="62" rx="3" fill="${on ? '#d3122f' : '#14111a'}"/>`; }
  return svg(14 * W + 2, 106, brancas + pretas, 'ac-teclado');
}
const acorde = (raiz, tipo) => TIPOS[tipo][1].map((n) => 60 + raiz + n);

export function acordesView(host, parts = []) {
  const aba = parts[0] === 'teclado' ? 'teclado' : 'violao';
  host.append(banner('Dicionário de acordes', 'veja, ouça e toque'), h('div', { class: 'pad-x', style: 'display:grid;gap:12px' }, voltar('#/estudos/melodia', '‹ estudos'),
    h('div', { class: 'es-areas', style: 'grid-template-columns:1fr 1fr' },
      h('a', { class: `es-area${aba === 'violao' ? ' on' : ''}`, href: '#/estudos/acordes/violao', style: '--c:#17365B;--f:#fff' }, h('span', { class: 'es-ai' }, '🎸'), h('b', {}, 'violão e guitarra')),
      h('a', { class: `es-area${aba === 'teclado' ? ' on' : ''}`, href: '#/estudos/acordes/teclado', style: '--c:#17365B;--f:#fff' }, h('span', { class: 'es-ai' }, '🎹'), h('b', {}, 'teclado'))),
    aba === 'violao' ? violaoLista() : tecladoLista()));
}
function violaoLista() {
  let kind = 'acoustic';
  const lista = h('div', { class: 'ac-grid' });
  const draw = () => lista.replaceChildren(...VIOLAO.map(([cifra, nome, frets]) => h('button', { type: 'button', class: 'ac-card', onclick: () => tocaViolao(frets, kind), 'aria-label': `ouvir o acorde ${nome}` },
    h('b', { class: 'ac-cifra' }, cifra), diagrama(frets), h('small', {}, nome), h('span', { class: 'ac-ouvir' }, '🔊 ouvir'))));
  draw();
  return h('div', { style: 'display:grid;gap:10px' }, h('p', { class: 'muted' }, '× = não toca a corda · ○ = corda solta · bolinha azul = onde pôr o dedo. toque no cartão pra ouvir.'),
    h('div', { class: 'jg jg-seg', role: 'radiogroup', 'aria-label': 'som' }, ...[['acoustic', '🎸 violão'], ['clean', '⚡ guitarra']].map(([v, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(kind === v), onclick: (e) => { kind = v; e.currentTarget.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b === e.currentTarget))); } }, t))), lista);
}
function tecladoLista() {
  let tipo = 0; const grade = h('div', { class: 'ac-grid' });
  const draw = () => grade.replaceChildren(...NOMES.map((n, r) => { const notas = acorde(r, tipo); return h('button', { type: 'button', class: 'ac-card wide', onclick: () => { const c = audio(); epiano(c.currentTime + 0.05, notas, 1.4, 1); }, 'aria-label': `ouvir ${n} ${TIPOS[tipo][0]}` },
    h('b', { class: 'ac-cifra' }, `${CIFRA[r]}${TIPOS[tipo][2]}`), tecladoSVG(notas), h('small', {}, `${n} ${TIPOS[tipo][0]}`), h('span', { class: 'ac-ouvir' }, '🔊 ouvir')); }));
  draw();
  return h('div', { style: 'display:grid;gap:10px' }, h('p', { class: 'muted' }, 'as teclas douradas e vermelhas formam o acorde. toque no cartão pra ouvir.'),
    h('div', { class: 'jg jg-seg', role: 'radiogroup', 'aria-label': 'tipo de acorde' }, ...TIPOS.map(([nome], i) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(tipo === i), onclick: (e) => { tipo = i; e.currentTarget.parentElement.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-checked', String(k === i))); draw(); } }, nome))), grade);
}

/* ---------------- ritmos de bateria ---------------- */
// 16 passos (semicolcheias): 1 e & a 2 e & a 3 e & a 4 e & a
export const RITMOS = [
  { id: 'rock', nome: 'Rock básico', sub: 'a levada mais famosa: chimbal, caixa no 2 e no 4', bpm: 100, hh: [0, 2, 4, 6, 8, 10, 12, 14], sn: [4, 12], bd: [0, 8] },
  { id: 'rock2', nome: 'Rock com bumbo extra', sub: 'o bumbo ganha uma batida a mais', bpm: 100, hh: [0, 2, 4, 6, 8, 10, 12, 14], sn: [4, 12], bd: [0, 8, 10] },
  { id: 'pop', nome: 'Pop', sub: 'bumbo sincopado e chimbal aberto no final', bpm: 96, hh: [0, 2, 4, 6, 8, 10, 12], ho: [14], sn: [4, 12], bd: [0, 6, 8, 10] },
  { id: 'funk', nome: 'Funk', sub: 'chimbal em semicolcheias e notas fantasma na caixa', bpm: 90, hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], sn: [4, 12], fan: [7, 9, 15], bd: [0, 3, 10] },
  { id: 'samba', nome: 'Samba', sub: 'surdo no 2 e no 4 e a caixa riscando', bpm: 100, hh: [0, 2, 4, 6, 8, 10, 12, 14], su: [4, 12], rm: [2, 6, 10, 14], bd: [0, 8] },
  { id: 'reggae', nome: 'Reggae (one drop)', sub: 'o bumbo e a caixa juntos só no tempo 3', bpm: 80, hh: [0, 2, 4, 6, 8, 10, 12, 14], sn: [8], bd: [8], rm: [] },
  { id: 'bossa', nome: 'Bossa nova (simplificada)', sub: 'aro da caixa sincopado e bumbo suave', bpm: 88, hh: [0, 4, 8, 12], rm: [0, 3, 6, 10, 12], bd: [0, 6, 8, 14] },
  { id: 'disco', nome: 'Disco (quatro por quatro)', sub: 'bumbo em todos os tempos e chimbal aberto no "e"', bpm: 118, hh: [0, 4, 8, 12], ho: [2, 6, 10, 14], sn: [4, 12], bd: [0, 4, 8, 12] },
];
const LINHAS = [['hh', 'chimbal', '#5b8dd6'], ['ho', 'chimbal aberto', '#7fb0f0'], ['rm', 'aro', '#a77bff'], ['sn', 'caixa', '#e2554f'], ['fan', 'caixa suave', '#f19a96'], ['su', 'surdo', '#e0b043'], ['bd', 'bumbo', '#3fae5a']];
const CONTA = ['1', 'e', '&', 'a', '2', 'e', '&', 'a', '3', 'e', '&', 'a', '4', 'e', '&', 'a'];
function tocaPasso(r, i, t) {
  const has = (a) => a && a.includes(i);
  if (has(r.bd)) kick(t, 0.95); if (has(r.sn)) snare(t, 0.95); if (has(r.fan)) snare(t, 0.25); if (has(r.su)) tom(t, 92, 1); if (has(r.rm)) rim(t, 0.55);
  if (has(r.ho)) hihat(t, 0.6, true); else if (has(r.hh)) hihat(t, i % 4 === 0 ? 0.8 : 0.5);
}
export function ritmosView(host) {
  let atual = RITMOS[0]; let bpm = atual.bpm; let tocando = false; let timer = 0; let step = 0; let next = 0; let celulas = [];
  const grade = h('div', { class: 'rt-grade', role: 'table', 'aria-label': 'ritmo em 16 passos' }); const titulo = h('h2', { class: 'rt-t' }); const sub = h('p', { class: 'muted' });
  const botao = h('button', { type: 'button', class: 'btn primary rt-play' }); const bpmOut = h('output', { class: 'rt-bpm' });
  const parar = () => { tocando = false; clearInterval(timer); timer = 0; marca(-1); botao.textContent = '▶ ouvir'; };
  const marca = (i) => celulas.forEach((c) => c.classList.toggle('agora', +c.dataset.i === i));
  const tick = () => { const c = audio(); const sp = 60 / bpm / 4; while (next < c.currentTime + 0.12) { tocaPasso(atual, step, next); const s = step; setTimeout(() => { if (tocando) marca(s); }, Math.max(0, (next - c.currentTime) * 1000)); next += sp; step = (step + 1) % 16; } };
  const toggle = () => { if (tocando) { parar(); return; } const c = audio(); tocando = true; step = 0; next = c.currentTime + 0.08; botao.textContent = '■ parar'; tick(); timer = setInterval(tick, 25); };
  botao.addEventListener('click', toggle);
  const desenha = () => {
    titulo.textContent = atual.nome; sub.textContent = atual.sub; bpmOut.textContent = `${bpm} BPM`; celulas = [];
    const linhas = LINHAS.filter(([k]) => (atual[k] || []).length);
    grade.replaceChildren(h('div', { class: 'rt-linha rt-conta' }, h('span', { class: 'rt-n' }, ''), ...CONTA.map((c, i) => h('i', { class: i % 4 === 0 ? 'forte' : '' }, c))),
      ...linhas.map(([k, nome, cor]) => h('div', { class: 'rt-linha', style: `--c:${cor}` }, h('span', { class: 'rt-n' }, nome), ...CONTA.map((_, i) => { const c = h('i', { class: (atual[k] || []).includes(i) ? 'on' : '', 'data-i': String(i) }); celulas.push(c); return c; }))));
  };
  const lista = h('div', { class: 'rt-lista', role: 'tablist' }, ...RITMOS.map((r) => h('button', { type: 'button', role: 'tab', class: 'rt-item', 'data-id': r.id, onclick: () => { atual = r; bpm = r.bpm; lista.querySelectorAll('.rt-item').forEach((b) => b.classList.toggle('on', b.dataset.id === r.id)); desenha(); if (tocando) { step = 0; } } }, r.nome)));
  lista.firstChild.classList.add('on');
  host.append(banner('Ritmos de bateria', 'veja o desenho e ouça'), h('div', { class: 'pad-x', style: 'display:grid;gap:12px' }, voltar('#/estudos/ritmo', '‹ estudos'), lista,
    h('section', { class: 'card pad rt-box' }, titulo, sub, grade,
      h('div', { class: 'rt-ctl' }, botao, h('span', { class: 'mem-step' }, h('button', { type: 'button', 'aria-label': 'mais devagar', onclick: () => { bpm = Math.max(50, bpm - 5); bpmOut.textContent = `${bpm} BPM`; } }, '−'), bpmOut, h('button', { type: 'button', 'aria-label': 'mais rápido', onclick: () => { bpm = Math.min(160, bpm + 5); bpmOut.textContent = `${bpm} BPM`; } }, '+'))),
      h('p', { class: 'muted' }, 'cada quadradinho é 1/4 de tempo. contagem: 1 e & a 2 e & a 3 e & a 4 e & a. as peças acesas tocam naquele ponto.'))));
  botao.textContent = '▶ ouvir'; desenha();
  return () => { parar(); };
}
