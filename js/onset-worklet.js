// AudioWorklet: escuta o microfone amostra por amostra e avisa a tela só quando acontece um ataque.
import { OnsetCore } from './onset-core.js';

class OnsetProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.core = new OnsetCore(sampleRate);
    this.port.onmessage = (e) => this.core.set(e.data || {});
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) for (const ev of this.core.push(ch, currentTime)) this.port.postMessage(ev, [ev.buf.buffer]);
    return true;
  }
}
registerProcessor('beaterista-onset', OnsetProcessor);
