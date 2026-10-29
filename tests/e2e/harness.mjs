// Harness dos testes de regressão: servidor estático + Chromium (Playwright) + medição do áudio que SAI de verdade.
// Todo AudioContext criado pela página passa por um "tap": a saída final vai por um AnalyserNode, então dá pra medir se ainda sai som.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.pdf': 'application/pdf' };

export function serve(port = 0) {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('nope'); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => srv.listen(port, '127.0.0.1', () => ok({ srv, url: `http://127.0.0.1:${srv.address().port}` })));
}

/** Roda antes de qualquer script da página: instrumenta o Web Audio. */
const TAP = `(() => {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  window.__ac = { ctxs: [], nodes: 0, started: 0, ended: 0, live: new Set(), mic: 0, micLive: 0, timers: new Set(), intervals: new Set(), raf: new Set(), listeners: 0 };
  const origConnect = AudioNode.prototype.connect;
  class TappedAC extends AC {
    constructor(...a) {
      super(...a); const ctx = this; window.__ac.ctxs.push(ctx);
      const real = ctx.destination; const an = ctx.createAnalyser(); an.fftSize = 2048; const tap = ctx.createGain();
      origConnect.call(tap, an); origConnect.call(tap, real);
      ctx.__an = an; ctx.__tap = tap;
      Object.defineProperty(ctx, 'destination', { value: tap, configurable: true }); // a página enxerga o tap como destino
    }
  }
  // connect(destination) precisa continuar válido: o "destination" que a página vê é o tap (um GainNode)
  window.AudioContext = TappedAC; if (window.webkitAudioContext) window.webkitAudioContext = TappedAC;
  for (const cls of ['OscillatorNode', 'AudioBufferSourceNode', 'ConstantSourceNode']) {
    const proto = window[cls] && window[cls].prototype; if (!proto) continue;
    const st = proto.start; proto.start = function (...a) { if (!this.__s) { this.__s = 1; window.__ac.started++; window.__ac.live.add(this); this.addEventListener('ended', () => { window.__ac.ended++; window.__ac.live.delete(this); }); } return st.apply(this, a); };
  }
  // grafo de conexões: "fonte presa" = fonte iniciada, ainda não terminada e AINDA LIGADA à saída (as desligadas não soam nem gastam CPU)
  const edges = new Map();
  const oc = AudioNode.prototype.connect, od = AudioNode.prototype.disconnect;
  AudioNode.prototype.connect = function (dst, ...r) { if (dst && dst.context) { if (!edges.has(this)) edges.set(this, new Set()); edges.get(this).add(dst); } return oc.call(this, dst, ...r); };
  AudioNode.prototype.disconnect = function (dst, ...r) { if (dst === undefined) edges.delete(this); else if (edges.has(this)) edges.get(this).delete(dst); return od.call(this, dst, ...r); };
  window.__audible = () => { const tapSet = new Set(window.__ac.ctxs.map((c) => c.__tap)); let n = 0;
    for (const src of window.__ac.live) { const seen = new Set([src]); const q = [src]; let hit = false;
      while (q.length && !hit) { const x = q.pop(); if (tapSet.has(x)) { hit = true; break; } for (const y of edges.get(x) || []) if (!seen.has(y)) { seen.add(y); q.push(y); } }
      if (hit) n++; }
    return n; };
  // RMS da saída (último quadro) e pico
  window.__rms = () => { let best = 0; for (const c of window.__ac.ctxs) { if (!c.__an) continue; const b = new Float32Array(c.__an.fftSize); c.__an.getFloatTimeDomainData(b); let s = 0; for (const x of b) s += x * x; best = Math.max(best, Math.sqrt(s / b.length)); } return best; };
  // pico durante uma janela de ms (amostra a cada ~20 ms)
  window.__peak = (ms) => new Promise((ok) => { let m = 0; const t0 = performance.now(); const iv = setInterval(() => { m = Math.max(m, window.__rms()); if (performance.now() - t0 > ms) { clearInterval(iv); ok(m); } }, 20); });
  // microfone: conta aberturas e trilhas ainda ativas
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    const g = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    window.__tracks = [];
    navigator.mediaDevices.getUserMedia = async (c) => { window.__ac.mic++; const s = await g(c); s.getTracks().forEach((t) => window.__tracks.push(t)); return s; };
    window.__micLive = () => window.__tracks.filter((t) => t.readyState === 'live').length;
  }
  // escutas em window/document/html/body (vazamento de listener ao entrar e sair de telas)
  const ls = new Map(); const tid = (t) => (t === window ? 'w' : t === document ? 'd' : (document.documentElement && t === document.documentElement) ? 'h' : (document.body && t === document.body) ? 'b' : null);
  const ael = EventTarget.prototype.addEventListener, rel = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function (type, fn, opts) { const id = tid(this); if (id && fn) { const k = id + ':' + type + ':' + ((opts === true || (opts && opts.capture)) ? 'c' : ''); if (!ls.has(k)) ls.set(k, new Set()); ls.get(k).add(fn); } return ael.call(this, type, fn, opts); };
  EventTarget.prototype.removeEventListener = function (type, fn, opts) { const id = tid(this); if (id && fn) { const k = id + ':' + type + ':' + ((opts === true || (opts && opts.capture)) ? 'c' : ''); if (ls.has(k)) ls.get(k).delete(fn); } return rel.call(this, type, fn, opts); };
  window.__listeners = () => { const o = {}; let n = 0; for (const [k, v] of ls) { if (v.size) { o[k] = v.size; n += v.size; } } return { n, o }; };
  // timers/raf pendentes (pra medir vazamento)
  const st = window.setTimeout, ct = window.clearTimeout, si = window.setInterval, ci = window.clearInterval, rq = window.requestAnimationFrame, cq = window.cancelAnimationFrame;
  window.setTimeout = (f, ms, ...a) => { const id = st((...x) => { window.__ac.timers.delete(id); return typeof f === 'function' ? f(...x) : 0; }, ms, ...a); if ((ms || 0) > 0) window.__ac.timers.add(id); return id; };
  window.clearTimeout = (id) => { window.__ac.timers.delete(id); return ct(id); };
  window.setInterval = (f, ms, ...a) => { const id = si(f, ms, ...a); window.__ac.intervals.add(id); return id; };
  window.clearInterval = (id) => { window.__ac.intervals.delete(id); return ci(id); };
  window.requestAnimationFrame = (f) => { const id = rq((t) => { window.__ac.raf.delete(id); f(t); }); window.__ac.raf.add(id); return id; };
  window.cancelAnimationFrame = (id) => { window.__ac.raf.delete(id); return cq(id); };
})();`;

export async function launch({ viewport = { width: 390, height: 844 }, hasTouch = true, isMobile = true, ua } = {}) {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--no-sandbox'] });
  const ctx = await browser.newContext({ viewport, hasTouch, isMobile, userAgent: ua, permissions: ['microphone'], serviceWorkers: 'block' });
  await ctx.addInitScript(TAP);
  return { browser, ctx };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0; const results = [];
export function check(name, ok, detail = '') { results.push({ name, ok: !!ok, detail }); if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); }
export function done() { console.log(`\n${results.length - fails}/${results.length} ok`); return fails; }
export const summary = () => results;

/** Cria uma sessão falsa no IndexedDB (o app só confere se existe) e bloqueia a rede do Supabase (offline). */
export async function fakeLogin(ctx, page, url) {
  await ctx.route('**/*.supabase.co/**', (r) => r.abort());
  await page.goto(url + '/index.html');
  await page.waitForFunction(() => document.querySelector('.login, #view'));
  await page.evaluate(async () => { const { db } = await import('/js/db.js'); await db.metaSet('session', { access_token: 'x', refresh_token: 'y', expires_at: Date.now() + 864e5, user: { id: 'u1', email: 'teste@example.com' } }); });
  await page.goto(url + '/index.html#/inicio'); await page.reload();
  await page.waitForSelector('#view', { timeout: 15000, state: 'attached' });
}
