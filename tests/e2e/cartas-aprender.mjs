// Uno Musical: nome da figura nas cartas e modo aprender (pausa a cada figura jogada até tocar em "entendi").
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const ctx = await context(browser, { viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await p.goto(`${url}/aluno.html#/jogos/cartas/livre`); await sleep(1000);
const jog = p.locator('button:has-text("JOGAR")'); if (await jog.count()) await jog.click();
await p.waitForSelector('[aria-label="aprender"], [role=radiogroup]', { timeout: 10000 });
check('opção "modo aprender" no menu', (await p.locator('text=modo aprender').count()) === 1);
await p.locator('button:has-text("pausar a cada figura jogada")').click();
await p.locator('button:has-text("jogar"), .jg-go, button.primary').first().click().catch(() => {}); await p.waitForSelector('.cx-hc', { timeout: 10000 });
check('cada figura da mão mostra o nome', await p.evaluate(() => [...document.querySelectorAll('.cx-hc .cx-card:not(.act) .cx-lbl')].length > 0 && [...document.querySelectorAll('.cx-hc .cx-lbl')].every((e) => e.textContent.length > 3)));
await p.screenshot({ path: '/tmp/claude-0/uno1.png' });
let vi = false; for (let i = 0; i < 12 && !vi; i++) {
  const fit = p.locator('.cx-hc.fit').first();
  if (await fit.count()) { await fit.click({ position: { x: 6, y: 30 }, force: true }).catch(() => {}); await sleep(500); if (await p.locator('.cx-learn').count()) vi = true; else if (await p.locator('.cx-pick').count()) await p.locator('.cx-pc').first().click({ force: true }).catch(() => {}); }
  else { const d = p.locator('.cx-deck:not([disabled])'); if (await d.count()) await d.first().click().catch(() => {}); await sleep(900); }
}
check('jogou figura → o jogo pausa e mostra o nome e o significado', vi && (await p.locator('.cx-learn h3').innerText()).length > 3 && (await p.locator('.cx-learn p').nth(1).innerText()).length > 10);
await p.screenshot({ path: '/tmp/claude-0/uno2.png' });
check('enquanto pausado a mesa não anda (sem clique de continuar)', await p.locator('.cx-learn').count() === 1);
await p.click('.cx-learn button'); await sleep(400); check('"entendi" fecha e o jogo segue', (await p.locator('.cx-learn').count()) === 0);
check('sem erros de JS', errs.length === 0, errs.join(';'));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
