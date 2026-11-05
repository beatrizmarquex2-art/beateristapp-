// iPad: viewport travado (sem zoom que sai rolando), sem rolagem horizontal em várias telas e tamanhos de iPad.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
for (const [nome, w, h] of [['iPad em pé', 820, 1180], ['iPad deitado', 1180, 820], ['iPad Pro deitado', 1366, 1024]]) {
  const ctx = await context(browser, { viewport: { width: w, height: h }, isMobile: true });
  await ctx.addInitScript(() => { try { Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 }); localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(`${url}/aluno.html#/jogos`); await sleep(1200);
  check(`${nome}: viewport travado`, /maximum-scale=1/.test(await p.evaluate(() => document.querySelector('meta[name=viewport]').content)));
  check(`${nome}: touch-action sem pinch`, (await p.evaluate(() => getComputedStyle(document.documentElement).touchAction)) === 'pan-x pan-y');
  for (const r of ['#/jogos', '#/tocar', '#/roleta', '#/jogos/memart', '#/piano', '#/perfil', '#/estudos', '#/album']) {
    await p.goto(`${url}/aluno.html${r}`); await sleep(900);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(`${nome} ${r}: sem rolagem lateral`, ov <= 1, String(ov));
  }
  check(`${nome}: sem erros`, errs.length === 0, errs.join(';')); await ctx.close();
}
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
