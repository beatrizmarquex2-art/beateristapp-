// Estudos dão estrela: o Paul chega falando (dica ou curiosidade) e o "li!" vale 1 ★, uma vez por dia de cada tipo; só com código. (A "meta do dia" saiu em 15/nov/2026.)
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: true });
await ctx.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().url().includes('aluno_codigo_ok') ? 'true' : '[]' }));
const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 900 }); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'T'); localStorage.setItem('beaterista-aluno-codigo', 'ABC123'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await p.goto(`${url}/aluno.html#/estudos`); await p.waitForSelector('.hj-fala', { timeout: 20000 }); await sleep(1500);
const tot = () => p.evaluate(async () => { const P = await import('/js/kids/progress.js'); const E = await import('/js/figurinhas/estrelas.js'); return E.estrelasTotais(P.active().id); });
check('só abrir os Estudos não dá estrela', (await tot()) === 0, String(await tot()));
check('sem meta do dia: o Paul já chega falando uma dica ou curiosidade', (await p.locator('.hj-meta, .hj-m').count()) === 0 && (await p.locator('.hj-fala-txt').innerText()).length > 20 && /dica do paul|curiosidade de músico/i.test(await p.locator('.hj-fala-tag').innerText()));
check('4 cartões na ordem da Bea: dicionário, robôterista ensina, acordes e ritmos, jogos ensinam', (await p.evaluate(() => [...document.querySelectorAll('.hj-big .hj-tile b')].map((b) => b.textContent.replace(/[🔒✓]/g, '').trim()).join('|'))) === 'dicionário musical|robôterista ensina|acordes e ritmos|jogos ensinam');
check('não tem mais botão "li!": ler a fala do Paul não dá estrela', (await p.locator('.hj-fala-li').count()) === 0);
const antes = await p.locator('.hj-fala-txt').innerText(); await p.locator('.hj-fala .btn.ghost').click(); await sleep(300);
check('"outra" troca a fala do Paul', (await p.locator('.hj-fala-txt').innerText()) !== antes);
await p.reload(); await p.waitForSelector('.hj-fala'); await sleep(1500);
check('abrir de novo não dá estrela', (await tot()) === 0, String(await tot()));
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
