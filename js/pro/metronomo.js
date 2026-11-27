// Metrônomo do PRO: andamento, compasso, acento na 1ª batida e tap tempo (bata no botão no ritmo que quiser e ele acha o andamento).
import { h } from './ui.js';
import { audio, click } from '../audio.js';
import { limitaBpm, tapBpm } from './ferr-logic.js';

export function mount(host) {
  let bpm = 100; let comp = 4; let rodando = false; let timer = 0; let prox = 0; let nota = 0; let toques = []; let gone = false; let fila = []; let raf = 0;
  try { const s = JSON.parse(localStorage.getItem('pro-metro') || '{}'); bpm = limitaBpm(s.bpm || 100); comp = [2, 3, 4, 5, 6, 7].includes(s.comp) ? s.comp : 4; } catch { /* sem storage */ }
  const guarda = () => { try { localStorage.setItem('pro-metro', JSON.stringify({ bpm, comp })); } catch { /* ok */ } };
  const num = h('output', { class: 'pm2-bpm', 'aria-live': 'off' }); const dots = h('div', { class: 'pm2-dots', 'aria-hidden': 'true' });
  const slider = h('input', { type: 'range', class: 'pm2-range', min: 30, max: 260, 'aria-label': 'Andamento (bpm)' });
  const ir = h('button', { type: 'button', class: 'pm2-go', 'aria-pressed': 'false' }); const tap = h('button', { type: 'button', class: 'pm2-tap' }, 'tap tempo'); const dica = h('p', { class: 'pt-mudo pm2-dica' }, 'toque no “tap tempo” no ritmo da música (2 toques ou mais).');
  const pinta = () => { num.textContent = bpm; slider.value = bpm; ir.textContent = rodando ? 'parar' : 'tocar'; ir.setAttribute('aria-pressed', String(rodando)); ir.classList.toggle('on', rodando);
    dots.replaceChildren(...Array.from({ length: comp }, (_, i) => h('i', { class: i === 0 ? 'ac' : '' }))); };
  const muda = (n) => { bpm = limitaBpm(n); guarda(); pinta(); };
  // o clique é agendado no relógio do áudio (exato); a bolinha acende quando o relógio chega nele (sem setTimeout, que atrasa e acumula)
  const agenda = () => { const c = audio(); while (prox < c.currentTime + 0.12) { click(prox, nota % comp === 0 ? 2 : 1); fila.push([prox, nota % comp]); prox += 60 / bpm; nota++; } };
  const luz = () => { if (gone || !rodando) return; const c = audio(); while (fila.length && fila[0][0] <= c.currentTime) { const [, i] = fila.shift(); dots.querySelectorAll('i').forEach((d, k) => d.classList.toggle('x', k === i)); } raf = requestAnimationFrame(luz); };
  const para = () => { rodando = false; clearInterval(timer); cancelAnimationFrame(raf); fila = []; pinta(); dots.querySelectorAll('i').forEach((d) => d.classList.remove('x')); };
  const toca = () => { if (rodando) { para(); return; } const c = audio(); if (c.state === 'suspended') c.resume(); rodando = true; nota = 0; fila = []; prox = c.currentTime + 0.06; agenda(); timer = setInterval(agenda, 25); raf = requestAnimationFrame(luz); pinta(); };
  const escondeu = () => { if (document.hidden && rodando) para(); }; // tela apagada/aba escondida: o navegador segura o relógio e depois solta tudo de uma vez
  document.addEventListener('visibilitychange', escondeu);
  ir.addEventListener('click', toca);
  slider.addEventListener('input', () => muda(slider.value));
  tap.addEventListener('pointerdown', (e) => { e.preventDefault(); const t = Date.now(); toques = [...toques, t].slice(-8); const b = tapBpm(toques); if (b) { muda(b); dica.textContent = `${b} bpm — continue tocando para refinar`; } else dica.textContent = 'toque de novo…'; tap.classList.add('x'); setTimeout(() => tap.classList.remove('x'), 90); });
  const pass = (rot, d) => h('button', { type: 'button', class: 'pm2-pass', 'aria-label': `${d > 0 ? 'Aumentar' : 'Diminuir'} ${Math.abs(d)} bpm` }, rot);
  const bt = (rot, d) => { const b = pass(rot, d); b.addEventListener('click', () => muda(bpm + d)); return b; };
  const compEl = h('div', { class: 'pm2-comp', role: 'group', 'aria-label': 'Compasso' }, ...[2, 3, 4, 5, 6, 7].map((n) => { const b = h('button', { type: 'button', 'aria-pressed': String(n === comp) }, `${n}/4`); b.addEventListener('click', () => { comp = n; nota = 0; guarda(); compEl.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); pinta(); }); return b; }));
  host.append(h('div', { class: 'pt pm2' }, h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, 'Pedaleira'), h('h1', {}, 'Metrônomo'))),
    h('div', { class: 'pm2-vis' }, h('div', { class: 'pm2-lin' }, bt('−5', -5), bt('−1', -1), h('div', { class: 'pm2-c' }, num, h('small', {}, 'bpm')), bt('+1', 1), bt('+5', 5)), slider, dots),
    compEl, ir, h('div', { class: 'pm2-tapbox' }, tap, dica)));
  pinta(); return () => { gone = true; para(); document.removeEventListener('visibilitychange', escondeu); };
}
