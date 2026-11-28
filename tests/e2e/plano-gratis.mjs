// Plano grátis dos jogos de mesa (sem código de aluno): só contra o robô, 2 partidas (Velha, Stop, Uno), cara a cara só de instrumentos, Eco do Paul só o xilofone, sem sala.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'false' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
const ir = async (h) => { await page.evaluate((x) => { location.hash = x; }, h); await sleep(1400); };
await page.goto(`${url}/aluno.html#/jogos`); await sleep(2000);
check('na aba Jogos a sala vira aviso trancado (sem "entrar com código de sala")', (await page.locator('.jg-sala-aviso').count()) === 1 && (await page.locator('.jg-sala-jogos').count()) === 0);
// Jogo da velha
await ir('#/jogos/velha');
check('velha abre (sem pedir código) e mostra o plano grátis com 2 partidas', /2 partidas contra o Paul/.test(await page.textContent('.jg-velha, .jg') || ''));
check('velha: "dois no aparelho" e "2 celulares" ficam trancados', (await page.locator('.jg-seg button.jg-trav').count()) >= 2);
await page.locator('.jg-seg button.jg-trav').first().click(); await sleep(300); check('tocar numa opção trancada mostra o aviso e não muda o modo', /abre com o código/.test(await page.textContent('body')) );
await page.getByRole('button', { name: 'iniciar' }).first().click(); await sleep(800);
check('1ª partida grátis conta', (await page.evaluate(() => localStorage.getItem('beaterista-gratis-partidas-velha'))) === '1');
await ir('#/jogos'); await ir('#/jogos/velha'); await page.getByRole('button', { name: /iniciar|novo placar/ }).first().click(); await sleep(800);
check('2ª partida grátis conta', (await page.evaluate(() => localStorage.getItem('beaterista-gratis-partidas-velha'))) === '2');
await ir('#/jogos'); await ir('#/jogos/velha'); await page.getByRole('button', { name: /iniciar|novo placar/ }).first().click(); await sleep(800);
check('3ª partida: acabou, pede o código', /partidas grátis de jogo da velha acabaram/.test(await page.textContent('body')) && (await page.evaluate(() => localStorage.getItem('beaterista-gratis-partidas-velha'))) === '2');
// Uno
await ir('#/jogos/cartas');
check('Uno Musical abre sem código, só "contra o robô"', /plano grátis: 2 partidas contra o robô/.test(await page.textContent('body')) && (await page.locator('.jg-seg button.jg-trav').count()) === 2);
// Stop
await ir('#/jogos/stop'); await page.getByRole('button', { name: 'JOGAR' }).first().click().catch(() => {}); await sleep(900);
check('Stop mostra o plano e só "individual" livre', /plano grátis: 2 partidas, só individual/.test(await page.textContent('body')) && (await page.locator('button.jg-trav').count()) === 3);
const ini = async (opts) => { await page.getByRole('button', opts).first().click(); await sleep(1500); };
await page.evaluate(() => { location.hash = '#/jogos/stop'; }); await sleep(900); await page.getByRole('button', { name: 'JOGAR' }).first().click().catch(() => {}); await sleep(700);
await page.locator('button.btn.primary:has-text("começar"), button.btn.primary:has-text("iniciar"), button.btn.primary:has-text("jogar")').first().click().catch(() => {}); await sleep(1200);
check('Stop: começar a partida conta 1 das 2 grátis', (await page.evaluate(() => localStorage.getItem('beaterista-gratis-partidas-stop'))) === '1', String(await page.evaluate(() => localStorage.getItem('beaterista-gratis-partidas-stop'))));
await page.evaluate(() => { location.hash = '#/jogos/cartas'; }); await sleep(1200); await ini({ name: 'iniciar', exact: true });
check('Uno: iniciar conta 1 das 2 grátis', (await page.evaluate(() => localStorage.getItem('beaterista-gratis-partidas-cartas'))) === '1');
// Cara a cara
await ir('#/jogos/cara');
check('cara a cara abre no tema instrumentos (artistas trancado)', /cara a cara/.test(await page.textContent('.jg-cara h2, h2')) && !/artista/.test((await page.textContent('.jg-cara')).slice(0, 80)) && (await page.locator('.jg-cara button.jg-trav').count()) === 1);
// Eco do Paul
await ir('#/jogos/genius');
check('Eco do Paul: só o xilofone livre (3 instrumentos com cadeado)', (await page.locator('.gn-tab.jg-trav').count()) === 3 && (await page.locator('.gn-tab.on').textContent()) === 'xilofone');
await page.locator('.gn-tab[data-i="piano"]').click(); await sleep(300); check('tocar no piano não troca (mostra aviso)', (await page.locator('.gn-tab.on').textContent()) === 'xilofone');
// com código tudo abre
const p2 = await ctx.newPage(); await p2.setViewportSize({ width: 390, height: 844 });
await p2.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await p2.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await p2.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await p2.goto(`${url}/aluno.html#/jogos/velha`); await sleep(2200);
check('com código: velha sem trava e sem aviso de plano grátis', (await p2.locator('.jg-seg button.jg-trav').count()) === 0 && !/plano grátis/.test(await p2.textContent('body')));
await p2.evaluate(() => { location.hash = '#/jogos/genius'; }); await sleep(1500);
check('com código: Eco do Paul com os 4 instrumentos livres', (await p2.locator('.gn-tab.jg-trav').count()) === 0);
check('sem erros de página', errs.length === 0, errs.join(' / '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
