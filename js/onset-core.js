// Detector de ataques amostra por amostra (roda dentro do AudioWorklet, ou no plano B do navegador antigo).
// Lógica pura, testada em tests/timing.test.mjs. Nada de áudio sai do aparelho: só instantes e um pedacinho do ataque.
export class OnsetCore {
  /**
   * @param {number} sampleRate
   * @param {{ratio?: number, floor?: number, gapMs?: number, captureSize?: number}} opts
   */
  constructor(sampleRate, { ratio = 3, floor = 0.0015, gapMs = 70, captureSize = 2048 } = {}) {
    // e5 = energia suavizada (~6 ms): estável em nota grave de teclado
    this.sr = sampleRate; this.hop = 32; // energia a cada 32 amostras (~0,7 ms)
    this.set({ ratio, floor, gapMs }); this.captureSize = captureSize;
    this.slow = 0; this.slowA = 1 - Math.exp(-this.hop / (sampleRate * 0.04)); this.e5 = 0; this.a5 = 1 - Math.exp(-1 / (sampleRate * 0.006)); this.noise = 0.0005; this.prev = 0; this.env = 0; this.decay = Math.exp(-this.hop / (sampleRate * 0.06)); this.acc = 0; this.n = 0; this.peak = 0;
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
      this.acc += x * x; this.n++; this.e5 += (x * x - this.e5) * this.a5;
      if (this.n < this.hop) continue;
      const level = Math.sqrt(this.acc / this.n); this.acc = 0; this.n = 0;
      const t = t0 + (i + 1) / this.sr; // fim deste pedacinho
      const rise = level - this.prev; this.prev = level;
      // ataque novo = bem mais forte que o rabo do golpe anterior (envelope que cai ~60 ms), não só acima do ruído
      // 2 jeitos de ouvir um ataque: (a) golpe seco (bateria, pad, palma): sobe de repente e passa bem do rabo do golpe anterior;
      // (b) nota de teclado/piano: o ataque é mais suave e a nota anterior ainda está soando, então compara com a MÉDIA dos últimos ~40 ms (subiu bem acima dela)
      const lvS = Math.sqrt(this.e5); const slowPrev = this.slow; this.slow += (lvS - this.slow) * this.slowA;
      const seco = level > this.env * 1.8 && rise > this.noise * 2;
      const suave = lvS > this.floor && lvS > this.noise * this.ratio && lvS > slowPrev * 1.5 && lvS - slowPrev > this.floor * 0.6;
      const hit = ((level > this.floor && level > this.noise * this.ratio && seco) || suave) && t - this.last >= this.gap;
      this.env = Math.max(this.env * this.decay, level);
      this.noise = level < this.noise ? this.noise * 0.995 + level * 0.005 : Math.min(level, this.noise * 1.0001); // ruído de fundo: desce rápido quando fica quieto e sobe bem devagar (nota de teclado sustentada não vira "ruído")
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
