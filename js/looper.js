// Looper: grava o que a pessoa toca (até 30 s) e, ao parar, toca em loop do jeitinho que foi tocado.
// Usado pelos pads do Groovebox. Não sabe nada de tela: quem usa liga `play` (soar um toque), `flash` (acender o pad) e `onChange` (redesenhar).
import { audio, click, scheduler, perfToCtx } from './audio.js';

export function createLooper({ max = 30, bpm, opts, play, flash, onChange, status }) {
  let rec = null; let loop = null; let last = null; let metro = null; const timers = [];
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const stopMetro = () => { if (metro) { metro.forEach((o) => { try { o.stop(); } catch { /* já parou */ } }); metro = null; } };
  const clearTimers = () => { timers.forEach(clearTimeout); timers.length = 0; };
  const setProg = (p) => { if (api.onProg) api.onProg(p); };
  function stopLoop() { if (loop) { loop.run.stop(); cancelAnimationFrame(loop.raf); loop = null; setProg(0); } }
  function cancelRec() { if (rec) { clearTimeout(rec.timer); clearInterval(rec.tick); rec = null; } stopMetro(); clearTimers(); }

  /** Começa a gravar: conta 4 (se ligado), clique (se ligado) e para sozinho aos `max` segundos. */
  function record() {
    stopLoop(); cancelRec(); last = null;
    const o = opts(); const ac = audio(); const q = 60 / bpm(); const lead = o.count ? 4 * q : 0.2; const t0 = ac.currentTime + 0.3 + lead;
    metro = [];
    if (o.count) for (let i = 0; i < 4; i++) metro.push(click(t0 - (4 - i) * q, i === 0 ? 2 : 1));
    if (o.click) for (let b = 0; b * q < max + q; b++) metro.push(click(t0 + b * q, b % 4 === 0 ? 2 : 1, 0.5));
    rec = { t0, hits: [] };
    if (o.count) for (let i = 0; i < 4; i++) timers.push(setTimeout(() => status(String(i + 1), 'count'), (t0 - (4 - i) * q - ac.currentTime) * 1000));
    status(o.count ? '…' : `● gravando 0:00 / ${fmt(max)}`, o.count ? 'count' : '');
    setProg(0);
    rec.tick = setInterval(() => { let el = perfToCtx(performance.now()) - t0; if (el < 0) { if (o.count) return; el = 0; } status(`● gravando ${fmt(el)} / ${fmt(max)}`, ''); setProg(Math.min(1, el / max)); }, 120);
    rec.timer = setTimeout(finish, (t0 - ac.currentTime + max) * 1000);
    onChange();
  }
  /** Registra um toque (perfMs = e.timeStamp). Só conta enquanto grava. */
  function hit(id, perfMs) { if (rec) rec.hits.push({ t: perfToCtx(perfMs) - rec.t0, id }); }
  /** Parou (botão ou tempo esgotado): ajusta ao compasso (se ligado) e já toca em loop. */
  function finish() {
    const r = rec; if (!r) return;
    clearTimeout(r.timer); clearInterval(r.tick); rec = null; stopMetro(); clearTimers(); setProg(0);
    const o = opts(); const bar4 = 4 * (60 / bpm()); const el = Math.min(max, perfToCtx(performance.now()) - r.t0);
    const hits = r.hits.filter((x) => x.t > -0.08 && x.t <= max).map((x) => ({ ...x, t: Math.max(0, x.t) }));
    if (!hits.length || el <= 0.2) { status(el <= 0.2 ? 'gravação cancelada.' : 'não peguei nenhum toque. tenta de novo!', ''); onChange(); return; }
    let len; if (o.grid) { const maxBars = Math.max(1, Math.floor(max / bar4)); len = Math.min(maxBars, Math.max(1, Math.ceil((el - 0.05) / bar4))) * bar4; } else len = Math.max(0.5, el);
    last = { len, hits: hits.filter((x) => x.t < len) };
    start();
  }
  /** Toca a gravação em loop (cada toque acende o pad na hora certa). */
  function start() {
    if (!last) return; stopLoop();
    const o = opts(); const ac = audio(); const q = 60 / bpm(); const { len, hits } = last;
    const evs = hits.map((x) => ({ t: x.t, id: x.id }));
    if (o.click) for (let b = 0; b * q < len - 0.01; b++) evs.push({ t: b * q, click: b % 4 === 0 ? 2 : 1 });
    evs.sort((x, y) => x.t - y.t); const n = evs.length; const start0 = ac.currentTime + 0.12;
    const run = scheduler((i) => { const e = evs[i % n]; return { at: Math.floor(i / n) * len + e.t, play: (t) => { if (e.click) click(t, e.click, 0.5); else play(e.id, t); }, ui: e.id ? () => flash(e.id) : undefined }; });
    loop = { run, len, raf: 0 };
    const frame = () => { if (!loop) return; setProg(((((ac.currentTime - start0) % len) + len) % len) / len); loop.raf = requestAnimationFrame(frame); }; frame();
    status(`em loop · ${fmt(len)} · ${hits.length} toques`, ''); onChange();
  }
  function stop() { stopLoop(); status('parado.', ''); onChange(); }
  function cancel() { cancelRec(); status('gravação cancelada.', ''); onChange(); }
  function dispose() { cancelRec(); stopLoop(); }
  const api = { record, hit, finish, start, stop, cancel, dispose, onProg: null, get state() { return rec ? 'rec' : loop ? 'loop' : last ? 'stopped' : 'idle'; }, get max() { return max; } };
  return api;
}
