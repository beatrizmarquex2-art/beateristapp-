// Identidade sonora do STOP musical: tudo sintetizado na hora (bumbo, caixa, chimbal, prato, notas curtas). Nenhum trecho de música comercial.
// Respeita o som geral dos jogos (base.js), as preferências do painel de áudio e o "silence()" do app (sair da tela corta o que ficou tocando).
import { audio, now, kick, snare, hihat, cymbal, tom, click, out } from '../audio.js';
import { soundOn, getGame, setGame } from './base.js';
import { EFEITOS } from './efeitos-dados.js';
import { tocarLista } from './efeitos.js';

const KEY = 'stop-audio';
const DEF = { fx: true, music: false, timer: true, fxVol: 0.8, musicVol: 0.5, vibrate: true, reduce: false };
let cfg = null;
export function settings() { if (!cfg) { const s = getGame(KEY); cfg = { ...DEF }; for (const k of Object.keys(DEF)) if (typeof s[k] === typeof DEF[k]) cfg[k] = s[k]; } return cfg; }
export function setSetting(k, v) { settings(); if (!(k in DEF)) return; cfg[k] = v; setGame(KEY, { ...cfg }); if (k === 'music') (v ? null : stopMusic()); }
export const reducedMotion = () => settings().reduce || !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

const fxOn = () => soundOn() && settings().fx;
const vol = () => settings().fxVol;
function note(f, t, len = 0.14, peak = 0.22, type = 'triangle') {
  const c = audio(); const o = c.createOscillator(); const g = c.createGain(); o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * vol()), t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(out()); o.start(t); o.stop(t + len + 0.03);
}
const NOTE = { c4: 261.6, e4: 329.6, g4: 392, c5: 523.3, e5: 659.3, g5: 784, a3: 220, c3: 130.8, g2: 98, c2: 65.4 };

/** Sons próprios do STOP (programa de auditório), aprovados pela Bea: nome do efeito do jogo -> nome em efeitos-dados.js. O resto segue como era. */
const PROPRIO = { metro: 'tique-taque', timeup: 'acabou o tempo', stop: 'STOP!', ok: 'resposta válida', points: 'resposta válida', bad: 'resposta inválida' };
/** Toca um efeito pelo nome. Sem som ligado, não faz nada (a tela mostra o mesmo por imagem/texto). */
export function play(name, arg) {
  if (!fxOn()) return;
  if ((name === 'metro' || name === 'last3') && !settings().timer) return;
  try {
    const t = now() + 0.02; const c0 = audio(); const v = vol();
    if (PROPRIO[name] && EFEITOS.stop.efeitos[PROPRIO[name]]) { tocarLista(c0, out(), EFEITOS.stop.efeitos[PROPRIO[name]], t, Math.max(0.2, v)); return; }
    switch (name) {
      case 'tap': hihat(t, 0.5 * v); break; // clique suave de baqueta
      case 'spin': for (let i = 0; i < 9; i++) snare(t + i * 0.055, (0.14 + i * 0.035) * v); break; // rulo curto de caixa
      case 'reveal': snare(t, 1 * v); break;
      case 'count': click(t, arg === 'go' ? 2 : 1, 0.9 * v); if (arg === 'go') kick(t, 0.8 * v); break; // contagem de baquetas
      case 'metro': click(t, 0, 0.7 * v); break;
      case 'last3': click(t, 2, 0.95 * v); hihat(t, 0.6 * v); break;
      case 'timeup': kick(t, 0.9 * v); cymbal(t + 0.01, false, 0.7 * v); break;
      case 'stop': kick(t, 1 * v); snare(t, 0.95 * v); cymbal(t + 0.02, false, 0.9 * v); break; // bumbo + caixa + crash
      case 'ok': note(NOTE.e5, t, 0.11, 0.2); break; // nota curta de teclado
      case 'bad': note(110, t, 0.18, 0.2, 'sine'); break; // som grave suave
      case 'pending': note(NOTE.a3 * 2, t, 0.1, 0.14); note(NOTE.a3 * 2, t + 0.13, 0.1, 0.14); break; // toque neutro
      case 'points': note(NOTE.c5, t, 0.1, 0.2); note(NOTE.e5, t + 0.1, 0.16, 0.22); break; // duas notas subindo
      case 'perfect': [220, 185, 150, 120].forEach((f, i) => tom(t + i * 0.085, f, 0.8 * v)); cymbal(t + 0.36, false, 1 * v); break; // virada de bateria
      case 'win': kick(t, 0.8 * v); [NOTE.c4, NOTE.e4, NOTE.g4, NOTE.c5].forEach((f, i) => note(f, t + 0.12 + i * 0.13, 0.22, 0.24)); [NOTE.c5, NOTE.e5, NOTE.g5].forEach((f) => note(f, t + 0.7, 0.7, 0.2)); cymbal(t + 0.7, false, 0.8 * v); break;
      case 'tie': note(NOTE.g4, t, 0.2, 0.18); note(NOTE.g4, t + 0.22, 0.34, 0.18); kick(t + 0.22, 0.4 * v); break; // finalização discreta
      case 'intro': { // vinheta de ~2,5 s: bateria + baixo + acorde final
        kick(t, 0.9 * v); hihat(t, 0.4 * v); note(NOTE.c2 * 2, t, 0.3, 0.3, 'sine');
        snare(t + 0.3, 0.8 * v); hihat(t + 0.3, 0.4 * v); note(NOTE.g2 * 2, t + 0.3, 0.28, 0.3, 'sine');
        kick(t + 0.6, 0.9 * v); kick(t + 0.75, 0.6 * v); hihat(t + 0.6, 0.4 * v); note(NOTE.c2 * 2, t + 0.6, 0.3, 0.3, 'sine');
        snare(t + 0.9, 0.8 * v); [0, 0.07, 0.14].forEach((d) => snare(t + 1.05 + d, 0.5 * v));
        [NOTE.c4, NOTE.e4, NOTE.g4, NOTE.c5].forEach((f) => note(f, t + 1.3, 1.1, 0.2)); note(NOTE.c2 * 2, t + 1.3, 1.1, 0.34, 'sine'); cymbal(t + 1.3, false, 0.9 * v); kick(t + 1.3, 0.9 * v);
        break; }
      default: break;
    }
  } catch { /* sem áudio: o jogo segue */ }
}

/** Vibração curta, só onde o navegador deixa e se estiver ligada. Nada depende dela. */
export function vibrate(pattern = 30) { try { if (settings().vibrate && typeof navigator.vibrate === 'function') navigator.vibrate(pattern); } catch { /* sem vibração */ } }

/* ---------- música de fundo (opcional, desligada por padrão): loop instrumental sem voz ---------- */
let mus = 0; let nextAt = 0; let step = 0; let duckUntil = 0;
const STEP = 60 / 96 / 2;
export function startMusic() {
  if (mus || !soundOn() || !settings().music) return;
  try {
    audio(); nextAt = now() + 0.1; step = 0;
    mus = setInterval(() => {
      if (!settings().music || !soundOn()) return stopMusic();
      const mv = settings().musicVol;
      while (nextAt < now() + 0.2) {
        if (nextAt > duckUntil) { // some enquanto o STOP e a vitória tocam
          hihat(nextAt, 0.16 * mv); if (step % 4 === 0) kick(nextAt, 0.3 * mv); if (step % 8 === 4) snare(nextAt, 0.18 * mv);
          if (step % 4 === 0) { const f = [NOTE.c2, NOTE.c2, NOTE.g2, NOTE.a3 / 2][(step / 4) % 4]; note(f * 2, nextAt, STEP * 3.4, 0.16 * mv / Math.max(vol(), 0.2), 'triangle'); }
        }
        nextAt += STEP; step = (step + 1) % 16;
      }
    }, 60);
  } catch { mus = 0; }
}
export function stopMusic() { if (mus) { clearInterval(mus); mus = 0; } }
export const duck = (ms) => { try { duckUntil = now() + ms / 1000; } catch { /* sem áudio */ } };
/** Para tudo que este módulo mantém (chamar ao sair da tela / fim da rodada). */
export function stopAll() { stopMusic(); }
