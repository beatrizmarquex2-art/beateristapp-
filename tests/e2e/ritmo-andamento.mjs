// Beat Hero: o andamento (50% a 150%) pode ser mudado antes de começar e vale pra música tocada.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: true });
const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 }); const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
await ctx.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().url().includes('aluno_codigo_ok') ? 'true' : '[]' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await page.goto(`${url}/aluno.html#/ritmo`); await sleep(2500);
const jogar = () => page.locator('.rz-jogar small').first().textContent();
check('o botão JOGAR mostra o bpm da música (120)', (await jogar()).includes('120 bpm'), await jogar());
await page.locator('text=Ajustes').first().click(); await sleep(400);
check('Ajustes tem os botões de andamento (− e +)', (await page.locator('[data-act="rz-tempo"]').count()) === 2);
await page.locator('[data-act="rz-tempo"][data-v="5"]').first().click(); await sleep(300); await page.locator('[data-act="rz-tempo"][data-v="5"]').first().click(); await sleep(300);
check('+10% muda o bpm do JOGAR (132) e mostra a porcentagem', /132 bpm \(110%\)/.test(await jogar()), await jogar());
for (let i = 0; i < 7; i++) { await page.locator('[data-act="rz-tempo"][data-v="-5"]').first().click(); await sleep(150); }
check('−25% dá 90 bpm (75%)', /90 bpm \(75%\)/.test(await jogar()), await jogar());
await page.locator('.rz-jogar').first().click(); await sleep(2500);
check('a música começa no andamento escolhido', await page.evaluate(() => document.body.classList.contains('rz-lock')) && (await page.locator('canvas').count()) === 1);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
