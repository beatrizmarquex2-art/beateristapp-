// O som que sai do app não passa de 1.0 (estourar = distorção): efeitos juntos + música de fundo passam pelo limitador final.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/*.supabase.co/**', (r) => r.abort());
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch {} });
await page.goto(url + '/aluno.html#/jogos'); await sleep(1500);
const pico = await page.evaluate(async () => {
  const A = await import('/js/audio.js'); const c = A.audio(); await c.resume(); await new Promise((r) => setTimeout(r, 300));
  const t = c.currentTime + 0.15;
  for (let i = 0; i < 6; i++) { A.kick(t, 1); A.snare(t, 1); A.click(t, 2, 1); A.cymbal(t, false, 1); A.hihat(t, 1.2, true); A.tom(t, 180, 1); }
  const an = c.__an; let max = 0; const buf = new Float32Array(an.fftSize);
  const fim = performance.now() + 700;
  while (performance.now() < fim) { an.getFloatTimeDomainData(buf); for (const v of buf) max = Math.max(max, Math.abs(v)); await new Promise((r) => setTimeout(r, 4)); }
  return { max, temLimitador: typeof A.destino === 'function' };
});
console.log(JSON.stringify(pico));
check('o app tem o limitador final (destino)', pico.temLimitador);
check('o pico do som que sai fica em até 1,0 (sem estourar)', pico.max <= 1.001, pico.max.toFixed(2));
check('sem erro de JS', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
