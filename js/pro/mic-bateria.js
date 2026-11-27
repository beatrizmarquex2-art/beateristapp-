// Microfone na bateria: escuta cada batida, separa pelo SOM (grave = bumbo, médio = caixa, agudo = chimbal) e devolve o instante.
// A separação é simples de propósito (3 timbres) e a tela avisa pra conferir. O instante vira posição na grade com `quantiza`.
import { fft, rms, onsetDetector } from '../pitch.js';
import { getMic } from '../mic-access.js';
import { audio, click } from '../audio.js';

/** Qual peça tocou, olhando a energia do ataque por faixa de frequência: abaixo de ~150 Hz (bumbo), 150–2500 (caixa), acima de ~3500 (chimbal).
    `buf` = amostras logo depois do ataque (potência de 2, ex. 2048). Devolve 'bd' | 'sn' | 'hh' ou null se for silêncio. */
export function classifica(buf, sr) {
  const n = buf.length; const re = new Float64Array(n); const im = new Float64Array(n);
  for (let i = 0; i < n; i++) re[i] = buf[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)));
  fft(re, im); const bin = sr / n; let baixo = 0; let medio = 0; let alto = 0;
  for (let k = 1; k < n / 2; k++) { const e = re[k] * re[k] + im[k] * im[k]; const f = k * bin; if (f < 150) baixo += e; else if (f < 2500) medio += e; else if (f >= 3500) alto += e; }
  const total = baixo + medio + alto; if (total < 1e-9) return null;
  if (alto / total > 0.4) return 'hh'; if (baixo / total > 0.5) return 'bd'; return 'sn';
}
/** Instante em segundos (relógio do áudio, começando em t0) → posição na grade, em semicolcheias. `grade` = 1, 2 ou 4. Nunca negativo. */
export const quantiza = (t, t0, bpm, grade) => Math.max(0, Math.round((t - t0) / (60 / bpm / 4) / grade) * grade);

/** Conta 4 e grava. `onBatida({ p, ini })` a cada batida (com o instante já na grade). Devolve { stop }. Lança se o microfone não abrir.
    Durante a conta o microfone fica surdo (senão ele escuta o próprio clique). */
export async function gravar({ bpm = 100, grade = 2, contaAntes = true, onBatida, onConta }) {
  const stream = await getMic(); const c = audio(); if (c.state === 'suspended') await c.resume();
  const src = c.createMediaStreamSource(stream); const an = c.createAnalyser(); an.fftSize = 2048; src.connect(an); const buf = new Float32Array(2048); const det = onsetDetector({ ratio: 2.4, floor: 0.02, gap: 0.07 });
  const q = 60 / bpm; const t0 = c.currentTime + 0.25 + (contaAntes ? 4 * q : 0); let parado = false; const LAT = 0.045; // atraso médio do microfone + ataque
  if (contaAntes) for (let i = 0; i < 4; i++) { click(t0 - (4 - i) * q, i === 0 ? 2 : 1, 0.7); if (onConta) setTimeout(() => !parado && onConta(i + 1), Math.max(0, (t0 - (4 - i) * q - c.currentTime) * 1000)); }
  let pendente = 0;
  const iv = setInterval(() => {
    if (parado) return; const agora = c.currentTime; an.getFloatTimeDomainData(buf);
    if (agora < t0 - 0.02) return; // conta: não escuta
    if (pendente && agora >= pendente.em) { const p = classifica(buf, c.sampleRate); const t = pendente.t; pendente = 0; if (p && t >= t0 - 0.12) onBatida({ p, ini: quantiza(t - LAT, t0, bpm, grade), t }); return; }
    const nivel = rms(buf.subarray(buf.length - 512)); if (!pendente && det(nivel, agora)) pendente = { t: agora, em: agora + 0.012 };
  }, 8);
  return { t0, stop() { parado = true; clearInterval(iv); try { src.disconnect(); } catch { /* já solto */ } stream.getTracks().forEach((t) => t.stop()); } };
}
