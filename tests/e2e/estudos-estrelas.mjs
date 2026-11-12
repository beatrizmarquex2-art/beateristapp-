// Estudos dão estrela: cada meta do dia vale 1 ★ (ver a dica já conta) e cumprir as 3 vale +3 ★; só com código; nada em dobro no mesmo dia.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: true });
await ctx.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().url().includes('aluno_codigo_ok') ? 'true' : '[]' }));
const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 900 }); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'T'); localStorage.setItem('beaterista-aluno-codigo', 'ABC123'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await p.goto(`${url}/aluno.html#/estudos`); await p.waitForSelector('.hj-meta', { timeout: 20000 }); await sleep(1500);
const tot = () => p.evaluate(async () => { const P = await import('/js/kids/progress.js'); const E = await import('/js/figurinhas/estrelas.js'); return E.estrelasTotais(P.active().id); });
check('só abrir os Estudos não dá estrela', (await tot()) === 0, String(await tot()));
check('a tela Hoje mostra 3 missões e o anel 0/3', (await p.locator('.hj-m').count()) === 3 && /0\/3/.test(await p.locator('.hj-meta').innerText()));
await p.locator('button.hj-m').first().click(); await p.locator('.hj-dica .btn:not(.ghost)').click(); await sleep(1500);
check('ler a dica do dia vale 1 ★ e acende o anel 1/3', (await tot()) === 1 && /1\/3/.test(await p.locator('.hj-meta').innerText()), String(await tot()));
await p.reload(); await p.waitForSelector('.hj-meta'); await sleep(1500);
check('abrir de novo no mesmo dia não dá outra estrela', (await tot()) === 1, String(await tot()));
const apos = await p.evaluate(async () => { const m = await import('/js/estudos-meta.js'); const { ganhou } = await import('/js/jogos/estrelas-jogo.js'); m.marcar('aula'); m.marcar('curiosidade'); return m.cumprida(m.ler()); });
check('as 3 metas do dia fecham (cumprida)', apos === true);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
