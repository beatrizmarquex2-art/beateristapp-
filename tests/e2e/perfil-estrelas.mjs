// Compartilhar as estrelas (post e story) mora no Perfil, não mais na tela Pacotes.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
await page.goto(url + '/aluno.html#/album'); await sleep(2500);
await page.evaluate(async () => { const P = await import('/js/kids/progress.js'); if (!P.active()) await P.addProfile('Teste', 10); });
await page.reload(); await sleep(3000);
await page.evaluate(() => [...document.querySelectorAll('.fig-tabs button, [role=tab]')].find((b) => /pacotes/i.test(b.textContent)).click()); await sleep(500);
check('na tela Pacotes não tem mais o compartilhar', await page.evaluate(() => !document.querySelector('.fig-share-est')));
await page.goto(url + '/aluno.html#/perfil'); await sleep(2500);
check('no Perfil tem os botões post e story', await page.evaluate(() => [...document.querySelectorAll('.pf-share-est .btn')].map((b) => b.textContent).join() === 'post,story'));
check('sem erro de página', errs.length === 0, errs.join('|')); await browser.close(); srv.close(); done();
