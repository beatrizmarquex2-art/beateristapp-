// Bateria de toque: todo toque em cima (ou colado) de uma peça tem que soar; não existe mais o botão "chimbal aberto".
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); });
await page.goto(`${url}/aluno.html#/toque`); await sleep(1500);
const box = await page.locator('.tk-art svg').boundingBox();
const pts = [[.2, .3], [.5, .65], [.8, .35], [.3, .8], [.85, .7], [.5, .2], [.1, .6], [.65, .5], [.43, .42], [.58, .45], [.36, .6], [.72, .58]];
let ok = 0;
for (const [fx, fy] of pts) {
  const s0 = await page.evaluate(() => window.__ac.started);
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy); await sleep(90);
  if ((await page.evaluate(() => window.__ac.started)) > s0) ok++;
}
check('todo toque na bateria soa', ok === pts.length, `${ok} de ${pts.length}`);
check('sem o botão "chimbal aberto"', (await page.locator('.tk-open').count()) === 0);
check('logo do Beaterista no bumbo', (await page.locator('[data-p="bd"] image').count()) === 1);
check('sem erros de JS na página', errs.length === 0, errs.slice(0, 3).join(' | '));
const fails = done(); await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
