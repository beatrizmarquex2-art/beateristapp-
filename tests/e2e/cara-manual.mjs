// Cara a Cara, eliminar "manual" (dupla no mesmo aparelho): depois da pergunta dá pra virar as cartas e só então passar a vez.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const ctx = await context(browser, { viewport: { width: 390, height: 844 }, isMobile: true }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.addInitScript(() => localStorage.setItem('beaterista-aluno-nome', 'Teste'));
await p.goto(`${url}/aluno.html#/jogos/cara`); await sleep(1200);
const j = p.locator('button:text-is("JOGAR")'); if (await j.count()) { await j.click(); await sleep(300); }
const b = p.locator('button:has-text("Modo Livre"), a:has-text("Modo Livre")'); if (await b.count()) { await b.first().click(); await sleep(400); }
await p.locator('button[role=radio]:has-text("clássico")').click(); await sleep(250);
await p.locator('button[role=radio]:has-text("manual")').click(); await sleep(250);
await p.locator('button[role=radio]:has-text("contra o Paul")').click(); await sleep(250);
await p.locator('button:has-text("jogar")').first().click(); await sleep(1200);
await p.locator('.cm-card').first().click(); await sleep(400); await p.locator('.sheet-body button.btn.primary').first().click(); await sleep(900);
await p.locator('.jg-qs .jg-qbtn').first().click(); await sleep(400);
check('depois da pergunta aparece o botão "pronto, já virei"', (await p.locator('button:has-text("pronto, já virei")').count()) === 1);
check('as perguntas somem até terminar de virar', (await p.locator('.jg-qs .jg-qbtn').count()) === 0);
await p.locator('.jg-flip').first().click(); await sleep(200);
check('dá pra virar uma carta', (await p.locator('.cm-cell.out').count()) >= 1);
await p.locator('button:has-text("pronto, já virei")').click(); await sleep(2500);
check('depois do pronto as perguntas voltam', (await p.locator('.jg-qs .jg-qbtn').count()) >= 1);
check('sem erros de JS', errs.length === 0, errs.join('|'));
done(); await browser.close(); srv.close();
