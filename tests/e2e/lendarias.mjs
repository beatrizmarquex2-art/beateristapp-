// Aba Lendárias do Álbum: 5 figurinhas (selo LENDÁRIA), trancadas até o resgate; clicar abre a figurinha inteira.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
await page.goto(url + '/aluno.html#/album'); await sleep(3000);
await page.evaluate(() => [...document.querySelectorAll('.fig-tabs button, [role=tab]')].find((b) => /lendárias/i.test(b.textContent)).click()); await sleep(800);
check('mostra as 5 lendárias, todas trancadas', await page.evaluate(() => document.querySelectorAll('.ld-card').length === 5 && document.querySelectorAll('.ld-card.on').length === 0 && document.querySelectorAll('.ld-card .ld-cad').length === 5));
check('as imagens carregam', await page.evaluate(async () => { const r = await Promise.all([...document.querySelectorAll('.ld-card img')].map((i) => i.decode().then(() => i.naturalWidth > 0, () => false))); return r.every(Boolean); }));
await page.evaluate(() => document.querySelector('.ld-card').click()); await sleep(600);
check('clicar abre a figurinha inteira', await page.evaluate(() => !!document.querySelector('.ld-ver img')));
await page.screenshot({ path: process.env.SHOTS ? process.env.SHOTS + '/lendarias-aba.png' : '/tmp/lendarias-aba.png' });
check('sem erro de página', errs.length === 0, errs.join('|')); await browser.close(); srv.close(); done();
