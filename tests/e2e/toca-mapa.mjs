// Toca Aqui abre direto no caminho (mapa de 12 fases por modo), com aleatório; dentro da fase só tem o que importa (sem escolher nível/fase).
import { serve, launch, sleep, check, done, alunoComCodigo } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
await alunoComCodigo(ctx);
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
await page.goto(url + '/aluno.html#/jogos/toca'); await page.waitForSelector('.mp-node', { timeout: 15000 });
check('abre direto no mapa com 12 fases', (await page.locator('.mp-node').count()) === 12);
check('3 mundos (vila, cidade, palco) e botão aleatório', (await page.locator('.tm-tabs button').count()) === 3 && (await page.locator('.tm-rand').count()) === 1);
check('sem as outras versões (imagens, figuras, taiko, duelo, aula)', !/duelo|aula ao vivo|com imagens|taiko/i.test(await page.textContent('.jg-toca')));
check('texto fala das duas mãos', /duas mãos/.test(await page.textContent('.jg-toca')));
await page.locator('.tm-tabs button').nth(1).click(); await sleep(400);
check('trocar de mundo mostra outro mapa de 12 fases com cenário próprio', (await page.locator('.mp-node').count()) === 12 && (await page.locator('.tm-tabs button.on').textContent()) === '2 · maré' && (await page.getAttribute('.mp', 'data-theme')) === 'mundo-mar');
await page.locator('.tm-tabs button').nth(0).click(); await sleep(400);
await page.evaluate(() => document.querySelector('.mp-node[data-pos="0"]').click()); await page.waitForSelector('.tr-fasehead', { timeout: 8000 });
check('fase aberta: só o botão de voltar no topo (sem texto de fase) e sem escolha de nível/caminho', !/fase/i.test(await page.textContent('.tr-fasehead')) && /mapa/.test(await page.textContent('.tr-fasehead')) && (await page.locator('.tr-path').count()) === 0 && (await page.locator('.tr-ctrl > .tp-line').count()) === 0);
check('tem velocidades 80 a 160 e pad com o aviso das duas mãos', (await page.locator('.tr-vel button').count()) === 5 && /duas mãos/.test(await page.textContent('.tr-pad')));
await page.getByRole('button', { name: /direto/ }).click(); await sleep(800);
// toca todas as notas na hora certa, pela tela
const pts = await page.evaluate(async () => {
  const pad = document.querySelector('.tr-pad'); const ons = JSON.parse(pad.dataset.onsets);
  for (const t of ons) { while (pad.clock() < t - 0.004) await new Promise((r) => setTimeout(r, 2)); pad.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, timeStamp: performance.now() })); }
  return ons.length;
});
await page.waitForSelector('.tr-quick', { timeout: 15000 });
const est = await page.evaluate(() => document.querySelector('.tr-stars') ? document.querySelector('.tr-stars').getAttribute('aria-label') : '');
check('tocando na tela vale 1 estrela', /^1 de 3/.test(est), est);
await page.getByRole('button', { name: /próxima fase/ }).click(); await sleep(500);
check('próxima fase abre outra fase (pauta nova)', (await page.locator('.tr-fasehead').count()) === 1 && (await page.locator('.tr-pad').count()) === 1);
await page.locator('.tr-fasehead button').click(); await page.waitForSelector('.mp-node');
check('voltar leva ao mapa', (await page.locator('.mp-node').count()) === 12);
await page.locator('.tm-rand').click(); await page.waitForSelector('.tr-fasehead');
check('aleatório abre uma fase', (await page.locator('.tr-pad').count()) === 1);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
