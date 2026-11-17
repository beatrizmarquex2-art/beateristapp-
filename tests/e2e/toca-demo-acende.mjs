// Toca Aqui: na demonstração ("só ouvir") a nota da pauta acende na hora em que toca.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await page.goto(`${url}/aluno.html#/jogos/toca`); await sleep(2500);
await page.evaluate(() => { document.querySelector('.mp-node.st-current').click(); }); await sleep(1500);
check('abriu a fase com os botões de ouvir', await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => /só ouvir/.test(b.textContent))));
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /só ouvir/.test(b.textContent)).click());
let vistas = 0; for (let i = 0; i < 60; i++) { await sleep(150); if (await page.evaluate(() => /#ffb000/i.test(document.querySelector('.tr-score')?.innerHTML || ''))) vistas++; }
check('durante a demonstração alguma nota acendeu (cor âmbar na pauta)', vistas > 0, String(vistas));
await sleep(1500); check('no fim a pauta volta ao normal (nada aceso)', !(await page.evaluate(() => /#ffb000/i.test(document.querySelector('.tr-score')?.innerHTML || ''))));
check('sem erro na página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
