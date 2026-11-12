// Aluno SEM código: a Cruzadinha abre de amostra (2 grátis, com palavras do dicionário) pra criança ver como é; o Detetive Note fica fechado (tela de cadeado).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch({ codigo: false });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
await page.goto(url + '/aluno.html#/dicas/cruzadinha'); await sleep(2500);
check('a cruzadinha abre sem código: tem a grade e as 5 pistas', (await page.locator('.dc-cw').count()) === 1 && (await page.locator('.dc-clues input').count()) === 5);
check('não mostra o aviso de código', (await page.locator('.am-lock').count()) === 0);
check('mostra o banco de palavras (a criança vê como é)', (await page.locator('.dc-chip').count()) === 5);
check('as outras abas continuam com cadeado, a cruzadinha e o Radar Musical não', await page.evaluate(() => { const t = [...document.querySelectorAll('.dc-pick b')].map((b) => b.textContent.trim()); return t.some((x) => x.startsWith('🔒') && x.includes('Quiz do Paul')) && !t.some((x) => /🔒.*(Cruzadinha|Radar)/.test(x)); }));
await page.locator('.dc-clues input').first().fill('xxxxxxxx'); await sleep(300);
check('a primeira tentativa conta uma cruzadinha grátis', (await page.evaluate(() => localStorage.getItem('beaterista-cruzadinha-gratis'))) === '1');
await page.evaluate(() => localStorage.setItem('beaterista-cruzadinha-gratis', '2')); await page.goto(url + '/aluno.html#/dicas/caca'); await sleep(800); await page.goto(url + '/aluno.html#/dicas/cruzadinha'); await sleep(1800);
check('depois das 2 grátis pede o código', (await page.locator('.am-lock').count()) === 1 && /2 cruzadinhas grátis/.test(await page.locator('.am-lock').textContent()));
await page.goto(url + '/aluno.html#/jogos/detetive'); await sleep(2000);
check('o Detetive Note está fechado sem código', (await page.locator('.al-lock').count()) === 1);
check('sem erro de página', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); done();
