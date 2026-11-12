// Aba Tocar: confere que TODOS os instrumentos soam (medindo a saída de áudio de verdade), inclusive logo depois de trocar de aba, nos dois apps.
import { serve, launch, sleep, fakeLogin } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: true });
const errs = []; let fails = 0;
const pre = () => {
  window.__max = 0; window.__ans = [];
  const realDest = Object.getOwnPropertyDescriptor(BaseAudioContext.prototype, 'destination').get;
  Object.defineProperty(BaseAudioContext.prototype, 'destination', { get() { if (!this.__tap) { const real = realDest.call(this); const tap = this.createGain(); tap.connect(real); const an = this.createAnalyser(); an.fftSize = 1024; tap.connect(an); const z = this.createGain(); z.gain.value = 0; an.connect(z); z.connect(real); this.__tap = tap; window.__ans.push(an); } return this.__tap; } });
  setInterval(() => { for (const a of window.__ans) { const d = new Uint8Array(a.fftSize); a.getByteTimeDomainData(d); for (const v of d) window.__max = Math.max(window.__max, Math.abs(v - 128)); } }, 15);
};
async function run(label, open) {
  const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 844 }); p.on('pageerror', e => errs.push(label + ' ' + String(e).slice(0, 150)));
  await p.addInitScript(pre); await open(p);
  const tap = async (sel, nth = 0) => { await p.locator(sel).nth(nth).scrollIntoViewIfNeeded(); const b = await p.locator(sel).nth(nth).boundingBox(); await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2); };
  const measure = async (name, fn) => { await p.evaluate(() => { window.__max = 0; }); await fn(); await sleep(650); const m = await p.evaluate(() => window.__max); const ok = m > 3; if (!ok) fails++; console.log(`${ok ? 'SOM ✓' : 'MUDO ✗'}  ${(label + ' · ' + name).padEnd(52)} pico ${m}`); };
  const tab = async (n) => { await p.locator('.ti-tabs a', { hasText: n }).first().click(); await sleep(250); };
  await measure('bateria', () => tap('.tk-art [data-p="sn"]'));
  console.log('abas:', (await p.locator('.ti-tabs').innerText()).replace(/\n/g, ' | '), '· útil:', (await p.locator('.ti-util').innerText()).replace(/\n/g, ' '));
  await tab('cordas'); const ch = await p.locator('.kd-modes button, .ti-panel .kd-chip').allInnerTexts(); console.log('cordas sons:', ch.join(' / '));
  await measure('cordas (violão) logo depois da bateria', () => tap('.ti-gstr'));
  for (let i = 1; i <= 2; i++) { await p.locator('.ti-panel .kd-chip').nth(i).click(); await sleep(200); await measure(`cordas: som ${i + 1}`, () => tap('.ti-gstr')); }
  await tab('teclas'); await measure('teclas (piano) logo depois das cordas', () => tap('.pn-kb [data-m]', 3));
  await tab('percussão'); await measure('percussão: barras (xilofone)', () => tap('.ti-bar', 2));
  const kinds = await p.locator('.ti-panel .kd-chip').allInnerTexts(); console.log('percussão chips:', kinds.join(' / '));
  const nm = await p.evaluate(() => [...document.querySelectorAll('.ti-panel .row')].map(r => r.getAttribute('aria-label')));
  for (const k of ['vibrafone', 'steel drum', 'kalimba', 'caixinha de música', 'sino tubular', 'glockenspiel', 'marimba']) { await p.locator('.ti-panel .kd-chip', { hasText: k }).first().click(); await sleep(120); await measure(`percussão barras: ${k}`, () => tap('.ti-bar', 3)); }
  await p.locator('.ti-panel .kd-chip', { hasText: 'pads' }).click(); await sleep(250);
  const names = await p.locator('.ti-pp').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label'))); console.log('pads:', names.join(', '));
  for (let i = 0; i < names.length; i++) await measure(`percussão pad: ${names[i]}`, async () => { await p.locator('.ti-pp').nth(i).click(); });
  await tab('bateria'); await measure('bateria de volta (depois de tudo)', () => tap('.tk-art [data-p="sn"]'));
  await p.close();
}
await run('ALUNO', async (p) => { await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'T'); } catch {} }); await p.goto(`${url}/aluno.html#/toque`); await sleep(2500); });
await run('BEA', async (p) => { await fakeLogin(ctx, p, url); await p.goto(`${url}/index.html#/toque`); await sleep(2500); });
console.log('\nfalhas:', fails, 'erros:', errs);
await browser.close(); srv.close(); process.exit(fails || errs.length ? 1 : 0);
