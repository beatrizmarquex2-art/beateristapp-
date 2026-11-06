// Estrelas dos jogos de mesa: ganhar do Paul vale 1 estrela (limite 30 por jogo por dia) e entra no total da roleta; sem código não conta.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); } catch { /* ok */ } });
await page.goto(url + '/aluno.html#/paulta'); await page.waitForSelector('.kx-cards .kx-g');
const r = await page.evaluate(async () => {
  const P = await import('/js/kids/progress.js'); const M = await import('/js/figurinhas/mesa.js'); const E = await import('/js/figurinhas/estrelas.js');
  const me = P.active(); const antes = E.estrelasTotais(me.id); let g = 0;
  for (let i = 0; i < 35; i++) g += await M.vitoria('velha');
  const o = await M.vitoria('cartas');
  return { g, o, delta: E.estrelasTotais(me.id) - antes, total: M.totalMesa(me.id) };
});
check('35 vitórias na velha no mesmo dia: só 30 estrelas', r.g === 30, JSON.stringify(r));
check('outro jogo tem o seu próprio limite', r.o === 1);
check('as estrelas entram no total da roleta', r.delta === 31 && r.total === 31, JSON.stringify(r));
await page.goto(url + '/aluno.html#/paulta'); await sleep(400);
await page.evaluate(() => { localStorage.removeItem('beaterista-aluno-codigo'); });
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (x) => x.fulfill({ status: 200, contentType: 'application/json', body: 'false' }));
check('sem erros de script', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
