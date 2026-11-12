// Toca Aqui (dentro de uma fase): 5 velocidades (80, 100, 120, 140, 160, até 200 BPM) e o Monte seu ritmo com os mesmos discos.
import { serve, launch, sleep, check, done, alunoComCodigo } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await alunoComCodigo(ctx);
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await page.goto(url + '/aluno.html#/jogos/toca'); await page.waitForSelector('.mp-node', { timeout: 15000 });
await page.evaluate(() => document.querySelector('.mp-node[data-pos="0"]').click()); await page.waitForSelector('.tr-pad', { timeout: 15000 });
await page.locator('.tr-mais summary').first().click();
const bpmTxt = () => page.textContent('.bl-bpm');
const chip = (nome) => page.getByRole('radio', { name: nome, exact: true });
check('andamento padrão (100 BPM)', (await bpmTxt()).trim() === '100', await bpmTxt());
check('5 atalhos de velocidade (80 a 160)', (await page.locator('[aria-label="Velocidade"] button').count()) === 5);
await chip('turbo, 140 BPM').click(); await sleep(400);
check('turbo = 140 BPM e o atalho fica marcado', (await bpmTxt()).trim() === '140' && (await chip('turbo, 140 BPM').getAttribute('aria-checked')) === 'true', await bpmTxt());
for (let i = 0; i < 14; i++) await page.getByRole('button', { name: 'mais 5 BPM' }).click();
await sleep(300); check('pode passar de 160: vai até 200 BPM', (await bpmTxt()).trim() === '200', await bpmTxt());
await chip('devagar, 80 BPM').click(); await sleep(300); check('devagar = 80 BPM', (await bpmTxt()).trim() === '80');
check('só o som de caixa: sem escolha de som', (await page.locator('[aria-label="Som do toque"] button').count()) === 0);
// Monte seu ritmo (Kids)
await page.goto(url + '/aluno.html#/kids/ritmo/livre'); await page.waitForSelector('.kd-bpmv', { timeout: 10000 });
check('Monte seu ritmo: 5 discos de velocidade e sem escolha de som', (await page.locator('.kd-vel button').count()) === 5 && (await page.locator('.kd-som button').count()) === 0);
await page.locator('.kd-vel button[aria-label="rápido"]').click(); await sleep(300);
check('Monte seu ritmo: rápido = 120 BPM', (await page.textContent('.kd-bpmv')).includes('120'), await page.textContent('.kd-bpmv'));
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
