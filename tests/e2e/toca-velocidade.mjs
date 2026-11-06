// Toca Aqui: atalhos de velocidade (devagar/normal/rápido/turbo, até 200 BPM) e som do toque (caixa, tambor, bumbo, chimbal), nas duas versões.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/*.supabase.co/**', (r) => (r.request().url().includes('aluno_codigo_ok') ? r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }) : r.abort())); // o Toca Aqui agora só abre com código
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await page.goto(url + '/aluno.html#/jogos/toca/livre'); await page.waitForSelector('.tr-pad', { timeout: 15000 });
const bpmTxt = () => page.textContent('.bl-bpm');
const chip = (nome) => page.getByRole('radio', { name: nome, exact: true });
check('andamento padrão mais animado (90 BPM)', (await bpmTxt()).trim() === '90', await bpmTxt());
check('4 atalhos de velocidade', (await page.locator('[aria-label="Velocidade"] button').count()) === 4);
await chip('turbo').click(); await sleep(400);
check('turbo = 170 BPM e o atalho fica marcado', (await bpmTxt()).trim() === '170' && (await chip('turbo').getAttribute('aria-checked')) === 'true', await bpmTxt());
for (let i = 0; i < 8; i++) await page.getByRole('button', { name: 'mais 5 BPM' }).click();
await sleep(300); check('pode passar de 160: vai até 200 BPM', (await bpmTxt()).trim() === '200', await bpmTxt());
await chip('devagar').click(); await sleep(300); check('devagar = 60 BPM', (await bpmTxt()).trim() === '60');
check('4 sons: caixa, tambor, bumbo, chimbal', (await page.locator('[aria-label="Som do toque"] button').count()) === 4);
check('caixa é o som padrão', (await chip('caixa').getAttribute('aria-checked')) === 'true');
await chip('tambor').click(); await sleep(300);
check('escolher tambor guarda no aparelho e marca o botão', (await page.evaluate(() => localStorage.getItem('beaterista-toca-som'))) === 'tambor' && (await chip('tambor').getAttribute('aria-checked')) === 'true');
await page.reload(); await page.waitForSelector('.tr-pad'); check('depois de recarregar continua tambor', (await chip('tambor').getAttribute('aria-checked')) === 'true');
// versão com imagens
await page.getByRole('radio', { name: 'com imagens' }).click(); await page.waitForSelector('.kd-bpmv', { timeout: 10000 });
check('com imagens: velocidade e som também aparecem', (await page.locator('.kd-vel button').count()) === 4 && (await page.locator('.kd-som button').count()) === 4);
await page.locator('.kd-vel button', { hasText: 'rápido' }).click(); await sleep(300);
check('com imagens: rápido = 130 BPM', (await page.textContent('.kd-bpmv')).includes('130'), await page.textContent('.kd-bpmv'));
check('com imagens: o som escolhido (tambor) vem marcado', (await page.locator('.kd-som button.on').textContent()).includes('tambor'));
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
