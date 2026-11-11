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
check('outro jogo tem o seu próprio limite (e vale 3 ★ por vitória)', r.o === 3);
check('as estrelas entram no total da roleta', r.delta === 33 && r.total === 33, JSON.stringify(r));
const t = await page.evaluate(async () => {
  const P = await import('/js/kids/progress.js'); const M = await import('/js/figurinhas/mesa.js'); const E = await import('/js/figurinhas/estrelas.js'); const me = P.active();
  const mem = await M.vitoria('memoria'); const cara = await M.vitoria('cara'); const stop = await M.vitoria('stop'); const bingo = await M.vitoria('bingo');
  const q = []; for (const id of ['a', 'b', 'a', 'c']) q.push(await M.quebra(id, 3)); const q2 = []; for (const id of ['a', 'b', 'c']) q2.push(await M.quebra(id, 3));
  const total = E.estrelasTotais(me.id); return { mem, cara, stop, bingo, q, q2, total, roletas: E.roletasDevidas(total), faltam: E.faltamParaRoleta(total) };
});
check('memória, cara a cara, stop e bingo valem 3 ★ cada', t.mem === 3 && t.cara === 3 && t.stop === 3 && t.bingo === 3, JSON.stringify(t));
check('quebra-cabeça: 3 ★ por imagem (repetir na mesma volta não dá) e na 2ª volta 2 ★ por imagem', JSON.stringify(t.q) === '[3,3,0,3]' && JSON.stringify(t.q2) === '[2,2,2]', JSON.stringify(t));
check('a cada 15 ★ libera 1 roleta (soma de todos os jogos)', t.roletas === Math.floor(t.total / 15) && t.faltam === 15 - (t.total % 15), JSON.stringify(t));
await page.goto(url + '/aluno.html#/paulta'); await sleep(400);
await page.evaluate(() => { localStorage.removeItem('beaterista-aluno-codigo'); });
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (x) => x.fulfill({ status: 200, contentType: 'application/json', body: 'false' }));
check('sem erros de script', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
