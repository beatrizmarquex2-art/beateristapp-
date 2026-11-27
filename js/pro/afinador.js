// Afinador do PRO: escuta o microfone, mostra a nota, e quantos cents faltam. Afinações de violão, baixo, ukulele e cavaquinho, ou cromático.
import { h } from './ui.js';
import { audio } from '../audio.js';
import { getMic, micMessage } from '../mic-access.js';
import { detectPitch, rms } from '../pitch.js';
import { AFINACOES, alvo, nomeNota, afinado } from './ferr-logic.js';

export function mount(host) {
  let tipo = 'violao'; let gone = false; let stream = null; let raf = 0; let ana = null; let fonte = null; let ultimo = 0; const lidas = [];
  try { const t = localStorage.getItem('pro-afin'); if (AFINACOES[t]) tipo = t; } catch { /* sem storage */ }
  const nota = h('output', { class: 'pa2-nota', 'aria-live': 'polite' }, '—'); const sub = h('p', { class: 'pa2-sub' }, 'toque “ligar” e toque uma corda');
  const agulha = h('i', { class: 'pa2-ag' }); const medidor = h('div', { class: 'pa2-med', role: 'img', 'aria-label': 'Medidor de afinação' }, h('b', { class: 'pa2-meio' }), agulha);
  const cordas = h('div', { class: 'pa2-cordas' }); const botao = h('button', { type: 'button', class: 'pm2-go' }, 'ligar o microfone'); const msg = h('p', { class: 'pt-mudo', role: 'status' });
  const afs = h('div', { class: 'pm2-comp pa2-afs', role: 'group', 'aria-label': 'Instrumento' });
  const pintaCordas = (ativa = '') => { const a = AFINACOES[tipo]; cordas.replaceChildren(...(a.cordas || []).map(([n, m]) => h('span', { class: ativa === `${n}${m}` ? 'on' : '' }, n))); };
  const pintaAfs = () => afs.replaceChildren(...Object.entries(AFINACOES).map(([k, v]) => { const b = h('button', { type: 'button', 'aria-pressed': String(k === tipo) }, v.nome); b.addEventListener('click', () => { tipo = k; try { localStorage.setItem('pro-afin', k); } catch { /* ok */ } pintaAfs(); pintaCordas(); }); return b; }));
  const zera = () => { nota.textContent = '—'; agulha.style.left = '50%'; medidor.classList.remove('ok'); };
  const para = () => { cancelAnimationFrame(raf); raf = 0; try { fonte && fonte.disconnect(); } catch { /* ok */ } if (stream) stream.getTracks().forEach((t) => t.stop()); stream = null; ana = null; fonte = null; botao.textContent = 'ligar o microfone'; botao.classList.remove('on'); };
  const ciclo = () => {
    if (gone || !ana) return; const buf = new Float32Array(ana.fftSize); ana.getFloatTimeDomainData(buf);
    if (rms(buf) > 0.01) { const r = detectPitch(buf, audio().sampleRate, { min: 50, max: 1400 }); if (r && r.clarity > 0.8) { lidas.push(r.freq); if (lidas.length > 4) lidas.shift(); const f = [...lidas].sort((a, b) => a - b)[Math.floor(lidas.length / 2)]; const a = alvo(f, AFINACOES[tipo].cordas); ultimo = performance.now();
      nota.textContent = a.nome || nomeNota(a.midi); const c = Math.max(-50, Math.min(50, a.cents)); agulha.style.left = `${50 + c}%`; medidor.classList.toggle('ok', afinado(a.cents));
      sub.textContent = afinado(a.cents) ? 'afinado ✓' : a.cents < 0 ? `${-a.cents} cents grave: aperte a corda` : `${a.cents} cents agudo: afrouxe a corda`; pintaCordas(`${a.nome}${a.midi}`); } }
    else if (performance.now() - ultimo > 1500) { zera(); sub.textContent = 'toque uma corda'; lidas.length = 0; }
    raf = requestAnimationFrame(ciclo);
  };
  botao.addEventListener('click', async () => {
    if (stream) { para(); zera(); return; } msg.textContent = '';
    try { stream = await getMic(); const c = audio(); if (c.state === 'suspended') await c.resume(); fonte = c.createMediaStreamSource(stream); ana = c.createAnalyser(); ana.fftSize = 4096; fonte.connect(ana); botao.textContent = 'desligar'; botao.classList.add('on'); sub.textContent = 'toque uma corda'; ciclo(); }
    catch (e) { stream = null; const m = micMessage(e); msg.textContent = Array.isArray(m) ? m.join(' ') : String(m || 'não consegui abrir o microfone'); }
  });
  host.append(h('div', { class: 'pt pm2' }, h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, 'Pedaleira'), h('h1', {}, 'Afinador'))),
    afs, h('div', { class: 'pa2-vis' }, nota, medidor, sub), cordas, botao, msg));
  pintaAfs(); pintaCordas(); return () => { gone = true; para(); };
}
