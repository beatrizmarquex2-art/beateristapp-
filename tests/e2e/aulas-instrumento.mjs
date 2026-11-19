// Robôterista ensina: teoria (5 temas) + aula de bateria, teclado e violão (30 aulinhas cada); sem código as aulas ficam trancadas (tela de código).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
async function abre(codigo) {
  const { browser, ctx } = await launch({ codigo });
  await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
  await p.addInitScript((c) => { try { localStorage.setItem('beaterista-aluno-nome', 'T'); localStorage.setItem('bt-mute', '1'); if (c) localStorage.setItem('beaterista-aluno-codigo', 'ABC123'); } catch (e) {} }, codigo);
  return { browser, p, errs };
}
{
  const { browser, p, errs } = await abre(true);
  await p.goto(`${url}/aluno.html#/estudos/aulas`); await sleep(1800);
  check('lista: 5 temas de teoria e 3 aulas de instrumento, sem "Figuras rítmicas"', (await p.locator('.tf-tema').count()) === 5 && (await p.locator('.al-aula').count()) === 3 && !/Figuras rítmicas/i.test(await p.locator('.al-aula').allInnerTexts().then((t) => t.join(' '))));
  for (const id of ['bateria', 'teclado', 'violao']) {
    await p.goto(`${url}/aluno.html#/estudos/aulas/${id}`); await sleep(1500);
    check(`${id}: 6 fases de 5 cartões`, (await p.locator('.tf-fase').count()) === 6 && (await p.locator('.tf-card').count()) === 5);
    await p.locator('.tf-fase').nth(5).click(); await sleep(300);
    check(`${id}: com código a fase 6 abre`, (await p.locator('.tf-card').count()) === 5 && /fase 6 de 6/i.test(await p.locator('.tf-fase-t').innerText()));
  }
  check('sem erros de página (com código)', errs.length === 0, errs.join(' | ')); await browser.close();
}
{
  const { browser, p, errs } = await abre(false);
  await p.goto(`${url}/aluno.html#/estudos/aulas/bateria`); await sleep(1500);
  check('sem código: a aula nem abre, só pede o código (as aulas são só pra quem tem acesso)', (await p.locator('.al-cod').count()) === 1 && (await p.locator('.tf-fase').count()) === 0);
  check('sem erros de página (sem código)', errs.length === 0, errs.join(' | ')); await browser.close();
}
srv.close(); process.exit(done() ? 1 : 0);
