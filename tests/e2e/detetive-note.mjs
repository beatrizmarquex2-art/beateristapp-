// Detetive Note: modo infantil (desenhos) e normal (figuras), 8 perguntas, resultado.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch (e) {} });
await page.goto(url + '/aluno.html#/jogos/detetive'); await page.waitForSelector('.jg-detetive', { timeout: 15000 });
check('tem os dois modos', (await page.locator('.dn-modos button').count()) === 2);
await page.getByRole('button', { name: 'jogar', exact: true }).click(); await page.waitForSelector('.dn-op');
check('infantil: 4 opções com desenhos', (await page.locator('.dn-op').count()) === 4 && (await page.locator('.dn-pics').count()) === 4);
await page.getByRole('radio', { name: /normal/ }).count();
for (let i = 0; i < 8; i++) { await page.waitForSelector('.dn-op:not(.ok):not(.no)'); await page.locator('.dn-op').first().click(); await sleep(1500); }
check('mostra o resultado no fim', /de 8/.test(await page.textContent('.jg-detetive')) && (await page.locator('.dn-op').count()) === 0);
await page.getByRole('button', { name: 'mudar o modo' }).click(); await page.getByRole('radio', { name: /normal/ }).click();
await page.getByRole('button', { name: 'jogar', exact: true }).click(); await page.waitForSelector('.dn-op');
check('normal: 4 opções com figuras na pauta', (await page.locator('.dn-op').count()) === 4 && (await page.locator('.dn-fig svg').count()) === 4);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
