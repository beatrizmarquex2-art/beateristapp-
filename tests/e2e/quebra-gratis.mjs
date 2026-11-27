// Quebra-cabeça sem código: só as 2 primeiras imagens abrem; as outras ficam com cadeado. Com código: todas.
// A tela de escolha mostra um instrumento por vez (abas) e as miniaturas dele; as 2 grátis são as 2 primeiras da lista (guitarra e baixo… conferidas pela ordem de IMAGES).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const contaPorAba = async (p) => { const abas = await p.locator('.qz-grupos button').count(); let tot = 0; let lk = 0; for (let i = 0; i < abas; i++) { await p.locator('.qz-grupos button').nth(i).click(); await sleep(200); tot += await p.locator('.qz-thumbs button').count(); lk += await p.locator('.qz-thumbs button.locked').count(); } return { abas, tot, lk }; };
{
  const { browser, ctx } = await launch({ codigo: false }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
  await p.goto(url + '/aluno.html#/jogos/quebra'); await sleep(2500);
  const n = await contaPorAba(p);
  check('sem código: 5 abas de instrumento, só 2 imagens abertas no total e o resto com cadeado', n.abas === 5 && n.tot >= 13 && n.lk === n.tot - 2, JSON.stringify(n));
  const antes = await p.locator('.qz-prev-nome').textContent();
  const trancada = p.locator('.qz-thumbs button.locked').first(); if (await trancada.count()) { await trancada.click(); await sleep(400); }
  check('clicar numa trancada não troca a imagem', (await p.locator('.qz-prev-nome').textContent()) === antes);
  check('sem erro de página', errs.length === 0, errs.join('|')); await browser.close();
}
{
  const { browser, ctx } = await launch({ codigo: true }); const p = await ctx.newPage();
  await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
  await p.goto(url + '/aluno.html#/jogos/quebra'); await sleep(2500);
  const n = await contaPorAba(p);
  check('com código: nenhuma trancada', n.lk === 0 && n.tot >= 13, JSON.stringify(n)); await browser.close();
}
srv.close(); done();
