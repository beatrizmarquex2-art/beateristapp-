// Festa musical da pauLta: aparece com chuva de notas, o Paul e o botão "valeu!", e fecha.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
await page.goto(url + '/aluno.html#/album'); await sleep(2500);
await page.evaluate(async () => { const M = await import('/js/paulta/festa.js'); window.__f = M.festa({ titulo: 'modo difícil concluído!', sub: '3 pacotinhos de figurinhas esperando por você no Álbum' }); }); await sleep(900);
check('a festa aparece com notas caindo, o Paul e o botão', await page.evaluate(() => document.querySelectorAll('.pf-p').length >= 20 && !!document.querySelector('.pf-paul') && !!document.querySelector('.pf-box button')));
await page.screenshot({ path: process.env.SHOTS ? process.env.SHOTS + '/festa-paulta.png' : '/tmp/festa-paulta.png' });
await page.evaluate(() => document.querySelector('.pf-box button').click()); await sleep(700);
check('fecha ao tocar em "valeu!"', await page.evaluate(() => !document.querySelector('.pf')));
check('sem erro de página', errs.length === 0, errs.join('|')); await browser.close(); srv.close(); done();
