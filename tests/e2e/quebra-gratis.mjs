// Quebra-cabeça sem código: só as 2 primeiras imagens abrem; as outras ficam com cadeado. Com código: todas.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
{
  const { browser, ctx } = await launch({ codigo: false }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
  await p.goto(url + '/aluno.html#/jogos/quebra'); await sleep(2500);
  const n = await p.evaluate(() => ({ tot: document.querySelectorAll('.jg-imgs button').length, lk: document.querySelectorAll('.jg-imgs button.locked').length }));
  check('sem código: só 2 imagens abertas, o resto com cadeado', n.tot >= 13 && n.lk === n.tot - 2, JSON.stringify(n));
  await p.evaluate(() => document.querySelectorAll('.jg-imgs button')[5].click()); await sleep(400);
  check('clicar numa trancada não troca a imagem', await p.evaluate(() => document.querySelectorAll('.jg-imgs button')[0].classList.contains('on')));
  await p.evaluate(() => document.querySelectorAll('.jg-imgs button')[1].click()); await sleep(400);
  check('a 2ª imagem abre', await p.evaluate(() => document.querySelectorAll('.jg-imgs button')[1].classList.contains('on')));
  check('sem erro de página', errs.length === 0, errs.join('|')); await browser.close();
}
{
  const { browser, ctx } = await launch({ codigo: true }); const p = await ctx.newPage();
  await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
  await p.goto(url + '/aluno.html#/jogos/quebra'); await sleep(2500);
  check('com código: nenhuma trancada', await p.evaluate(() => document.querySelectorAll('.jg-imgs button.locked').length === 0)); await browser.close();
}
srv.close(); done();
