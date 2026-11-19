// Estudos: quem não tem código de acesso NÃO tem as aulas do Paul (teoria e instrumentos); com código abre normal.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
// sem código
{
  const { browser, ctx } = await launch({ codigo: false }); const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
  for (const r of ['#/estudos/aulas', '#/estudos/aulas/bateria', '#/estudos/aulas/teclado', '#/estudos/aulas/violao']) {
    await page.goto(`${url}/aluno.html#/jogos`); await sleep(400); await page.goto(`${url}/aluno.html${r}`); await sleep(1500);
    check(`sem código: ${r} mostra a tela de código, sem a aula`, (await page.locator('.al-cod').count()) === 1 && (await page.locator('.au-box, .tf-card').count()) === 0 && /aulas do Paul/.test(await page.evaluate(() => document.body.innerText)), (await page.evaluate(() => document.body.innerText)).slice(0, 120));
  }
  check('sem código: nenhum erro na página', errs.length === 0, errs.join(' | '));
  await browser.close();
}
// com código
{
  const { browser, ctx } = await launch(); const page = await ctx.newPage();
  await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
  await page.goto(`${url}/aluno.html#/jogos`); await sleep(800); await page.goto(`${url}/aluno.html#/estudos/aulas`); await sleep(1800);
  check('com código: a lista de aulas abre (sem campo de código)', (await page.locator('.al-aula').count()) >= 3 && (await page.locator('.al-cod').count()) === 0);
  await browser.close();
}
srv.close(); process.exit(done() ? 1 : 0);
