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
  ['cartas', 'button:has-text("iniciar")', '.cx-hc'],
]) {
  await page.goto(`${url}/aluno.html#/jogos/${id}`); await sleep(1200);
  const ini = page.locator(start).first(); if (await ini.count()) await ini.click(); await sleep(id === 'cartas' ? 4200 : 600); // o Uno embaralha e distribui antes de aceitar toque
  if (id === 'cartas') await page.waitForSelector('.cx-turn.mine', { timeout: 15000 }).catch(() => {}); // pode começar o computador
  await sleep(id === 'cartas' ? 700 : 0);
  const s0 = await started();
  const alvo = page.locator(play).first();
  if (await alvo.count()) await alvo.click(id === 'cartas' ? { position: { x: 6, y: 30 }, force: true } : {}).catch(() => {});
  await sleep(500);
  check(`[${id}] tocar faz barulho`, (await started()) > s0, `${(await started()) - s0} sons`);
}

check('sem erros de JS na página', errs.length === 0, errs.slice(0, 3).join(' | '));
const fails = done(); await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
