// Música de fundo dos jogos: escolhe a música pelo endereço (musica-dados.js), sintetiza no aparelho e toca baixinho em loop.
// Respeita o som do topo (alto-falante) e o som dos jogos; só começa depois do primeiro toque (regra do navegador); para ao sair do jogo ou ao esconder o app.
import { audio, out, isMuted, lastAudioUse } from '../audio.js';
import { soundOn } from './base.js';
import { TRACKS, trackDe } from './musica-dados.js';
import './efeitos.js'; // registra o som próprio de cada jogo

const VOL = 0.32; // bem baixinho: o fundo não pode atrapalhar a atenção
let pausada = false; // um jogo pediu silêncio (ouvir o ritmo, microfone): evento 'jogo-musica'
let bus = null; let timer = 0; let cur = ''; let step = 0; let nextT = 0; let gesture = false; let noiseBuf = null; let fadeT = 0;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function tone(c, f, t, dur, type, g) {
  const o = c.createOscillator(); const a = c.createGain(); o.type = type; o.frequency.value = f;
  a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(Math.max(0.0002, g), t + 0.012); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(a); a.connect(bus); o.start(t); o.stop(t + dur + 0.03);
}
function noise(c, t, dur, g, hp) {
  if (!noiseBuf) { noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.5), c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = c.createBufferSource(); const f = c.createBiquadFilter(); const a = c.createGain(); s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
  a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(a); a.connect(bus); s.start(t); s.stop(t + dur + 0.02);
}
function kick(c, t) {
  const o = c.createOscillator(); const a = c.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  a.gain.setValueAtTime(0.9, t); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(a); a.connect(bus); o.start(t); o.stop(t + 0.25);
}
function schedule(c, p, i, t) {
  const len = 60 / p.bpm / 4; const [lw, lg, ln] = p.lead; const [bw, bg, bo, bn] = p.bass;
  if (ln[i] !== '.') tone(c, mtof(p.root + Number(ln[i])), t, len * 1.8, lw, lg);
  if (bn[i] !== '.') tone(c, mtof(p.root + bo + Number(bn[i])), t, len * 1.9, bw, bg);
  if (p.dr.k[i] === 'x') kick(c, t);
  if (p.dr.s[i] === 'x') noise(c, t, 0.14, 0.45, 1500);
  if (p.dr.h[i] === 'x' && p.vh > 0) noise(c, t, 0.04, 0.16 * p.vh, 7000);
}
function stop(fade = true) {
  clearInterval(timer); timer = 0; cur = '';
  if (bus) { const b = bus; bus = null; try { b.gain.setTargetAtTime(0, b.context.currentTime, fade ? 0.12 : 0.01); } catch { /* sem áudio */ } clearTimeout(fadeT); fadeT = setTimeout(() => { try { b.disconnect(); } catch { /* ok */ } }, 600); }
}
/** Abaixa a música enquanto o jogo toca ritmo ou nota (ela não pode atrapalhar), e cala de vez quando o jogo manda (Beat Hero tocando). */
function ajusta(c, p) {
  if (!bus) return;
  const calar = pausada || (p.parar && document.body.classList.contains(p.parar));
  const baixa = p.duck && Date.now() - lastAudioUse() < 1300;
  const alvo = calar ? 0 : baixa ? 0.04 : 1;
  bus.gain.setTargetAtTime(VOL * alvo, c.currentTime, calar || baixa ? 0.05 : 0.4);
}
function start(id) {
  const p = TRACKS[id]; if (!p) return;
  try {
    const c = audio(false); if (!c) return; stop(false);
    bus = c.createGain(); bus.gain.value = VOL; bus.connect(out()); cur = id; step = 0; nextT = c.currentTime + 0.1;
    const tick = () => { if (!bus) return; ajusta(c, p); while (nextT < c.currentTime + 0.18) { schedule(c, p, step % 16, nextT); nextT += 60 / p.bpm / 4; step++; } };
    timer = setInterval(tick, 40); tick();
  } catch { stop(false); }
}
/** Liga ou desliga conforme a tela e o som. Chamado ao trocar de tela, no primeiro toque e quando o som do topo muda. */
export function sync() {
  const want = trackDe(location.hash);
  const ok = want && gesture && !document.hidden && !isMuted() && soundOn();
  if (!ok) { if (cur) stop(); return; }
  if (cur !== want) start(want);
}
let started = false;
/** Liga o sistema uma vez (app da Bea e área dos alunos). */
export function initMusica() {
  if (started || typeof window === 'undefined') return; started = true;
  window.addEventListener('hashchange', sync);
  window.addEventListener('bt-mute', sync);
  window.addEventListener('jogo-musica', (e) => { pausada = e.detail === 'pausa'; if (!pausada) sync(); }); // Toca Aqui, Detetive Note e a pausa dos jogos avisam por aqui
  document.addEventListener('visibilitychange', sync);
  const first = () => { gesture = true; sync(); };
  ['pointerdown', 'touchend', 'keydown'].forEach((ev) => document.addEventListener(ev, first, { capture: true, passive: true }));
  setInterval(sync, 2500); // pega o botão de som dos jogos (muda um valor guardado, sem evento)
}

/** Os jogos avisam: a música dá uma pausa enquanto o jogo precisa de silêncio (ouvir o ritmo, microfone, pausa da partida). */
export const musicaPausa = () => { try { window.dispatchEvent(new CustomEvent('jogo-musica', { detail: 'pausa' })); } catch { /* sem DOM */ } };
export const musicaVolta = () => { try { window.dispatchEvent(new CustomEvent('jogo-musica', { detail: 'volta' })); } catch { /* sem DOM */ } };
