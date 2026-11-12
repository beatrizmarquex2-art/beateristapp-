// A arte do Paul (Álbum) abre inteira ao tocar e dá 1 ★ só na 1ª vez.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
await page.goto(url + '/aluno.html#/album'); await sleep(3000);
await page.evaluate(async () => { const P = await import('/js/kids/progress.js'); if (!P.active()) await P.addProfile('Teste', 10); });
await page.goto(url + '/aluno.html#/album'); await sleep(3000);
const total = () => page.evaluate(async () => { const P = await import('/js/kids/progress.js'); const me = P.active(); return me ? ((P.progOf(me.id).mesa || {}).total || 0) : -1; });
const antes = await total();
await page.evaluate(() => document.querySelector('.pd-arte').click()); await sleep(1200);
check('abre a arte inteira (diálogo com a imagem)', await page.evaluate(() => !!document.querySelector('.pd-dlg[open] img')));
const dep1 = await total(); check('1ª vez: +1 ★', dep1 === antes + 1, `${antes} -> ${dep1}`);
await page.evaluate(() => { document.querySelector('.pd-dlg').close(); document.querySelector('.pd-arte').click(); }); await sleep(1200);
const dep2 = await total(); check('2ª vez: não ganha de novo', dep2 === dep1, `${dep1} -> ${dep2}`);
check('sem erro de página', errs.length === 0, errs.join('|')); await browser.close(); srv.close(); done();
