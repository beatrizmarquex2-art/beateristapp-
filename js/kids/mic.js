// Microfone → batidas (pra "tocar no pad / na bateria de verdade"). Mesmo detector do Juiz de Tempo. Nada de áudio sai do aparelho.
import { audio } from '../audio.js';
import { OnsetCore } from '../onset-core.js';

/** Abre o microfone e chama onHit({ t, level }) a cada ataque (t = relógio do som). Devolve { stop, mode }. Lança se não puder abrir. */
export async function openMic(onHit) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw Object.assign(new Error('sem microfone'), { name: 'NotSupported' });
  const ctx = audio();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  const src = ctx.createMediaStreamSource(stream); let node; let mode;
  try {
    if (!ctx.audioWorklet) throw new Error('sem worklet');
    await ctx.audioWorklet.addModule('js/onset-worklet.js');
    node = new AudioWorkletNode(ctx, 'beaterista-onset', { numberOfInputs: 1, numberOfOutputs: 0 });
    node.port.onmessage = (e) => onHit(e.data); src.connect(node); mode = 'worklet';
  } catch {
    const core = new OnsetCore(ctx.sampleRate); node = ctx.createScriptProcessor(1024, 1, 1);
    node.onaudioprocess = (e) => { const t0 = e.playbackTime != null ? e.playbackTime - 1024 / ctx.sampleRate : ctx.currentTime; for (const ev of core.push(e.inputBuffer.getChannelData(0), t0)) onHit(ev); };
    const mute = ctx.createGain(); mute.gain.value = 0; src.connect(node); node.connect(mute).connect(ctx.destination); mode = 'script';
  }
  return { mode, stop() { try { src.disconnect(); node.disconnect(); } catch { /* já desligado */ } stream.getTracks().forEach((t) => t.stop()); } };
}
