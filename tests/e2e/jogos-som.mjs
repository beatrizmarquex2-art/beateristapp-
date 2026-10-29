// Jogos de tabuleiro/cartas: tocar numa casa ou carta tem que fazer barulho (os sons saem pela saída principal).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); });
const started = () => page.evaluate(() => window.__ac.started);
for (const [id, start, play] of [
  ['velha', 'button:has-text("iniciar")', '.jg-cell:not([disabled])'],
  ['cartas', 'button:has-text("iniciar")', '.jg-hbtn:not([disabled])'],
]) {
  await page.goto(`${url}/aluno.html#/jogos/${id}`); await sleep(1200);
  const ini = page.locator(start).first(); if (await ini.count()) await ini.click(); await sleep(600);
  const s0 = await started();
  const alvo = page.locator(play).first();
  if (await alvo.count()) await alvo.click().catch(() => {});
  await sleep(500);
  check(`[${id}] tocar faz barulho`, (await started()) > s0, `${(await started()) - s0} sons`);
}

// dominó: legenda toca a figura; "sem dica" não destaca as peças que servem
await page.goto(`${url}/aluno.html#/jogos/domino`); await sleep(1200);
{
  const s0 = await started();
  await page.locator('button.jg-leg').nth(3).click(); await sleep(300);
  check('[domino] tocar numa figura da legenda faz som', (await started()) > s0, `${(await started()) - s0} sons`);
  await page.locator('button:has-text("sem dica")').first().click(); await sleep(300);
  await page.locator('button:has-text("iniciar")').first().click(); await sleep(700);
  const fitSem = await page.locator('.jg-hbtn.fit').count();
  check('[domino] sem dica: nenhuma peça destacada', fitSem === 0, `${fitSem} destacadas`);
  await page.locator('.jg-top .btn').first().click().catch(() => {}); await sleep(300);
  const ok = page.locator('button:has-text("nova partida")').last(); if (await ok.count()) await ok.click().catch(() => {});
  await sleep(500);
  await page.locator('button:has-text("com dica")').first().click().catch(() => {}); await sleep(300);
  await page.locator('button:has-text("iniciar")').first().click().catch(() => {}); await sleep(700);
  const fitCom = await page.locator('.jg-hbtn.fit').count();
  check('[domino] com dica: peças que servem ficam destacadas', fitCom > 0, `${fitCom} destacadas`);
}
check('sem erros de JS na página', errs.length === 0, errs.slice(0, 3).join(' | '));
const fails = done(); await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
