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
// cada fase tem 3 compassos seguidos: toca todas as notas na hora certa, pela tela, em cada um
const tocaCompasso = async () => {
  await page.getByRole('button', { name: /direto/ }).click(); await sleep(800);
  return page.evaluate(async () => {
    const pad = document.querySelector('.tr-pad'); const ons = JSON.parse(pad.dataset.onsets);
    for (const t of ons) { while (pad.clock() < t - 0.004) await new Promise((r) => setTimeout(r, 2)); pad.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, timeStamp: performance.now() })); }
    return ons.length;
  });
};
check('a fase começa avisando "compasso 1 de 3"', /compasso 1 de 3/.test(await page.textContent('.tr-status')));
await tocaCompasso(); await page.waitForSelector('.tr-quick', { timeout: 15000 });
check('depois do 1º compasso: sem estrelas ainda e botão do próximo compasso', (await page.locator('.tr-stars').count()) === 0 && (await page.getByRole('button', { name: /próximo compasso/ }).count()) === 1);
await page.getByRole('button', { name: /próximo compasso/ }).click(); await sleep(500);
check('2º compasso é outra pauta e avisa "compasso 2 de 3"', /compasso 2 de 3/.test(await page.textContent('.tr-status')));
await tocaCompasso(); await page.waitForSelector('.tr-quick', { timeout: 15000 });
await page.getByRole('button', { name: /próximo compasso/ }).click(); await sleep(500);
check('3º compasso avisa "compasso 3 de 3"', /compasso 3 de 3/.test(await page.textContent('.tr-status')));
await tocaCompasso(); await page.waitForSelector('.tr-stars', { timeout: 15000 });
const est = await page.evaluate(() => document.querySelector('.tr-stars') ? document.querySelector('.tr-stars').getAttribute('aria-label') : '');
check('tocando tudo certinho na tela vale 3 estrelas (nota = média dos 3 compassos, igual à pauLta)', /^3 de 3/.test(est) && /média dos 3 compassos/.test(await page.textContent('.tr-big')), est);
check('passou de fase: NÃO tem "próxima fase" direto; o botão avisa que andou no mundinho', (await page.getByRole('button', { name: /próxima fase/ }).count()) === 0 && (await page.getByRole('button', { name: /andou no mundinho/ }).count()) === 1);
await page.getByRole('button', { name: /andou no mundinho/ }).click(); await page.waitForSelector('.mp-node');
check('o botão leva ao mapa e o aviso diz que a fase 2 abriu', (await page.locator('.mp-node').count()) === 12 && /fase 1 concluída, a fase 2 abriu/.test(await page.evaluate(() => (document.getElementById('toasts') || document.body).textContent)));
await page.screenshot({ path: `${process.env.SHOTS || '/tmp'}/toca-andou.png` });
await page.locator('.tm-rand').click(); await page.waitForSelector('.tr-fasehead');
check('aleatório abre uma fase', (await page.locator('.tr-pad').count()) === 1);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
