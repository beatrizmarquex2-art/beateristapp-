// "voltar para ___": ao sair de uma área (barra de baixo) aparece no topo o caminho de volta pro lugar anterior; na mesma área não aparece.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await page.goto(`${url}/aluno.html#/jogos`); await sleep(2200);
check('na primeira tela não tem "voltar para"', (await page.locator('.al-voltar').count()) === 0);
await page.locator('nav a', { hasText: 'Estudos' }).click(); await sleep(900);
check('saiu de Jogos pra Estudos: aparece "voltar para Jogos"', /voltar para Jogos/.test((await page.locator('.al-voltar').first().innerText()) || ''), await page.locator('.al-voltar').count() + '');
await page.locator('.al-voltar').first().click(); await sleep(900);
check('tocar nele volta pra Jogos e a faixa some', (await page.evaluate(() => location.hash)) === '#/jogos' && (await page.locator('.al-voltar').count()) === 0);
await page.goto(`${url}/aluno.html#/jogos/velha`); await sleep(1800); await page.evaluate(() => { location.hash = '#/album'; }); await sleep(1200);
check('saindo de um jogo, o botão diz o nome do jogo', /voltar para Jogo da velha/.test((await page.locator('.al-voltar').first().innerText()) || ''), (await page.locator('.al-voltar').first().innerText()));
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
