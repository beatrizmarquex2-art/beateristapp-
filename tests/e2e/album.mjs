// Álbum: pacotinho de teste abre, as cartas viram, vão pra folha de colar e a colagem conclui sem erro.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); });
await page.goto(url + '/aluno.html#/kids'); await page.waitForSelector('.kx-cards'); await sleep(400);
await page.evaluate(() => { location.hash = '#/kids/album'; }); await page.waitForSelector('.kx-album');
const shot = process.env.SHOTS;
check('105 espaços no álbum', (await page.locator('.kx-album .kx-card-fig').count()) === 105);
await page.getByText('pacotinho de teste').click(); await page.waitForSelector('.kx-pack-wrap'); if (shot) await page.screenshot({ path: `${shot}/1-pacote.png` });
await page.locator('.kx-pack-wrap').click({ force: true }); await page.waitForSelector('.pk-deck.on', { timeout: 4000 }); await sleep(900); if (shot) await page.screenshot({ path: `${shot}/2-cartas.png` });
for (let i = 0; i < 2; i++) { await page.locator('.pk-card:not(.flip)').first().click({ force: true }); await sleep(1100); if (shot && i === 1) await page.screenshot({ path: `${shot}/3-virando.png` }); }
if (shot) await page.screenshot({ path: `${shot}/4-todas.png` });
check('2 cartas viradas', (await page.locator('.pk-card.flip').count()) === 2);
await page.getByText('colar no álbum').click(); await sleep(400); await page.waitForSelector('.kx-tray');
check('2 na folha de colar', (await page.locator('.kx-tray-row .kx-card-fig').count()) === 2); if (shot) await page.screenshot({ path: `${shot}/5-folha.png` });
await page.locator('.kx-tray-row .kx-card-fig').first().click({ force: true }); await sleep(450); if (shot) await page.screenshot({ path: `${shot}/6-voando.png` }); await sleep(1500);
check('1 colada, 1 na folha', (await page.locator('.kx-tray-row .kx-card-fig:not(.gone)').count()) === 1 && (await page.locator('.kx-album .kx-card-fig:not(.locked)').count()) === 1);
if (shot) await page.screenshot({ path: `${shot}/7-colada.png` });
check('sem erro de JS', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
