// Detector de ataques amostra por amostra (roda dentro do AudioWorklet, ou no plano B do navegador antigo).
// Lógica pura, testada em tests/timing.test.mjs. Nada de áudio sai do aparelho: só instantes e um pedacinho do ataque.
export class OnsetCore {
  /**
   * @param {number} sampleRate
   * @param {{ratio?: number, floor?: number, gapMs?: number, captureSize?: number}} opts
   */
  constructor(sampleRate, { ratio = 4, floor = 0.004, gapMs = 70, captureSize = 2048 } = {}) {
    this.sr = sampleRate; this.hop = 32; // energia a cada 32 amostras (~0,7 ms)
    this.set({ ratio, floor, gapMs }); this.captureSize = captureSize;
    this.noise = 0.0005; this.prev = 0; this.env = 0; this.decay = Math.exp(-this.hop / (sampleRate * 0.06)); this.acc = 0; this.n = 0; this.peak = 0;
    this.last = -Infinity; this.capture = null; this.hist = new Float32Array(256); this.hpos = 0; this.count = 0;
  }
  set({ ratio, floor, gapMs } = {}) { if (ratio) this.ratio = ratio; if (floor) this.floor = floor; if (gapMs) this.gap = gapMs / 1000; }
  /**
   * Recebe um bloco de amostras cujo primeiro sample acontece em `t0` (segundos do AudioContext).
   * Devolve os ataques completos: { t, level, buf } (buf = `captureSize` amostras a partir do ataque, para o timbre).
   */
  push(block, t0) {
    const out = [];
    for (let i = 0; i < block.length; i++) {
      const x = block[i];
      this.hist[this.hpos] = x; this.hpos = (this.hpos + 1) & 255; this.count++;
      if (this.capture) { this.capture.buf[this.capture.k++] = x; if (this.capture.k >= this.captureSize) { out.push({ t: this.capture.t, level: this.capture.level, buf: this.capture.buf }); this.capture = null; } }
      this.acc += x * x; this.n++;
      if (this.n < this.hop) continue;
      const level = Math.sqrt(this.acc / this.n); this.acc = 0; this.n = 0;
      const t = t0 + (i + 1) / this.sr; // fim deste pedacinho
      const rise = level - this.prev; this.prev = level;
      // ataque novo = bem mais forte que o rabo do golpe anterior (envelope que cai ~60 ms), não só acima do ruído
      const hit = level > this.floor && level > this.noise * this.ratio && level > this.env * 1.8 && rise > this.noise * 2 && t - this.last >= this.gap;
      this.env = Math.max(this.env * this.decay, level);
      this.noise = this.noise * 0.995 + Math.min(level, this.noise * 2) * 0.005; // ruído de fundo segue devagar
      if (hit && !this.capture) {
        // onde o ataque começou de verdade: primeira amostra (dos últimos 2 pedacinhos) acima de 25% do pico
        const back = this.hop * 2; let peak = 0;
        for (let k = 1; k <= back; k++) peak = Math.max(peak, Math.abs(this.hist[(this.hpos - k + 256) & 255]));
        let k = back; while (k > 1 && Math.abs(this.hist[(this.hpos - k + 256) & 255]) < peak * 0.25) k--;
        const at = t - k / this.sr; this.last = at;
        const buf = new Float32Array(this.captureSize); let j = 0;
        for (let m = k; m >= 1 && j < buf.length; m--) buf[j++] = this.hist[(this.hpos - m + 256) & 255];
        this.capture = { t: at, level, buf, k: j };
      }
    }
    return out;
  }
}
