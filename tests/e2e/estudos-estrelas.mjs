// Estudos dão estrela: cada meta do dia vale 1 ★ (ver a dica já conta) e cumprir as 3 vale +3 ★; só com código; nada em dobro no mesmo dia.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: true });
await ctx.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().url().includes('aluno_codigo_ok') ? 'true' : '[]' }));
const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 900 }); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'T'); localStorage.setItem('beaterista-aluno-codigo', 'ABC123'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await p.goto(`${url}/aluno.html#/estudos`); await p.waitForSelector('.es-strip', { timeout: 20000 }); await sleep(1500);
const tot = () => p.evaluate(async () => { const P = await import('/js/kids/progress.js'); const E = await import('/js/figurinhas/estrelas.js'); return E.estrelasTotais(P.active().id); });
check('abrir os Estudos (ver a dica do dia) vale 1 ★', (await tot()) === 1, String(await tot()));
check('a faixa da meta mostra as 3 estrelinhas do dia (1 já acesa)', (await p.locator('.es-dots i.ok').count()) === 1 && (await p.locator('.es-dots i').count()) === 3);
await p.reload(); await p.waitForSelector('.es-strip'); await sleep(1500);
check('abrir de novo no mesmo dia não dá outra estrela', (await tot()) === 1, String(await tot()));
const apos = await p.evaluate(async () => { const m = await import('/js/estudos-meta.js'); const { ganhou } = await import('/js/jogos/estrelas-jogo.js'); m.marcar('aula'); m.marcar('curiosidade'); return m.cumprida(m.ler()); });
check('as 3 metas do dia fecham (cumprida)', apos === true);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
