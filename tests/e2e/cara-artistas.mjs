// Cara a cara, tema artistas: trocar de tema, jogar uma partida (perguntar, chutar), ver a foto original no fim.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({});
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
const bad = []; page.on('response', (r) => { if (r.status() >= 400) bad.push(r.url().slice(-40)); });
await page.addInitScript(() => localStorage.setItem('beaterista-aluno-nome', 'Teste'));
await page.goto(url + '/aluno.html#/jogos/cara'); await sleep(1200);
check('abre nos instrumentos', (await page.locator('.jg-cara .jg-cbtn img').count()) === 0 && (await page.locator('button[role=radio]:has-text("artistas")').count()) === 1);
await page.locator('button[role=radio]:has-text("artistas")').click(); await sleep(500);
await page.locator('button:has-text("iniciar")').click(); await sleep(900);
check('16 cartas com foto', (await page.locator('.jg-cart').count()) === 16 && (await page.locator('.jg-cart img').count()) === 16);
check('o Paul fala na abertura', (await page.locator('.jg-fala p').innerText()).length > 5);
await page.locator('.jg-qbtn:has-text("banda ou dupla")').click(); await sleep(400);
check('pergunta elimina cartas e mostra o motivo', (await page.locator('.jg-ccell.out').count()) > 0 && /^(sim|não)\./.test(await page.locator('.jg-msg').innerText()));
await page.screenshot({ path: '/tmp/claude-0/promo/cara_art_1.png' });
for (const q of ['é do Brasil?', 'é dos Estados Unidos?', 'faz pop?', 'faz rock?', 'é rock pesado']) { const b = page.locator(`.jg-qbtn:has-text("${q}")`); if (await b.count()) await b.first().click().catch(() => {}); }
await sleep(300);
const left = await page.locator('.jg-cart:not([disabled])').count();
check('sobram poucas cartas depois de várias perguntas', left >= 1 && left < 16, String(left));
await page.locator('.jg-cart:not([disabled])').first().click(); await sleep(200);
await page.locator('button:has-text("sim, chutar")').click(); await sleep(600);
check('chute termina ou tira uma vida', (await page.locator('.jg-result').count()) === 1 || (await page.locator('.jg-bar').innerText()).includes('♥'));
await page.screenshot({ path: '/tmp/claude-0/promo/cara_art_2.png' });
check('tema artistas fica salvo ao recarregar', await (async () => { await page.reload(); await sleep(1000); return (await page.locator('button[role=radio][aria-checked=true]:has-text("artistas")').count()) === 1; })());
check('sem erro de página e sem imagem quebrada', !errs.length && !bad.length, errs.concat(bad).join(' | '));
const fails = done(); await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
