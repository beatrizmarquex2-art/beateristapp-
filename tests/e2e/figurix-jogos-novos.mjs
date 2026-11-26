// Figurix, jogos novos: memória em 3 formatos (pares, espiada, quem sumiu), Detetive Note e quiz de instrumentos. Resolve cada um de verdade e tira print.
import { serve, launch, sleep, check, done, alunoComCodigo } from './harness.mjs';
import { PHASES, MUNDOS, mundoDe, montesDe, peçasDe, arvore } from '../../js/jogos/figurix-logic.js';
import { FIGS } from '../../js/kids/figs.js';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } }); await alunoComCodigo(ctx);
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); localStorage.setItem('beaterista-figurix-sem-tempo', '1'); if (!localStorage.getItem('beaterista-jogos:teste')) localStorage.setItem('beaterista-jogos:teste', JSON.stringify({ v: 1, sound: true, games: { figurix: { est: Object.fromEntries(Array.from({ length: 62 }, (_, i) => [i + 1, 3])) } } })); /* regra das 3 ★: o aluno do teste já tem tudo com 3 ★ pra poder abrir qualquer mundo */ } catch (e) {} });
const abre = async (n) => { const m = mundoDe(n); await page.goto(url + '/aluno.html#/jogos'); await sleep(250); await page.goto(url + '/aluno.html#/jogos/figurix'); await page.waitForSelector('.mp-node');
  await page.locator('.tm-tabs button').nth(MUNDOS.indexOf(m)).click(); await sleep(700); await page.waitForSelector('.mp-node');
  await page.evaluate((p) => document.querySelector(`.mp-node[data-pos="${p}"]`).scrollIntoView({ block: 'center' }), n - m.de); await sleep(150); await page.evaluate((p) => document.querySelector(`.mp-node[data-pos="${p}"]`).click(), n - m.de); await sleep(500); };
const concluida = async () => { await sleep(1500); return /concluída/.test(await page.textContent('.jg-figurix')); };
const pares = async () => { const cs = await page.evaluate(() => window.__figurix.cartas); for (const id of [...new Set(cs.map((c) => c.par))]) { const [a, b] = cs.filter((c) => c.par === id); await page.locator(`.fx-card[data-k="${a.k}"]`).click(); await page.locator(`.fx-card[data-k="${b.k}"]`).click(); await sleep(150); } };
const shot = (nome) => page.screenshot({ path: `/tmp/claude-0/fx-${nome}.png` });
// 1a toque nos pares (fase 6)
let n = 6; await abre(n); await page.waitForSelector('.fx-card'); check('pares: todas as cartas já abertas', (await page.locator('.fx-card.aberta').count()) === (await page.locator('.fx-card').count())); await shot('pares'); await pares(); check(`fase ${n} (toque nos pares): concluída`, await concluida());
// 1b olhe e vire (fase 37)
n = 37; await abre(n); await page.waitForSelector('.fx-card'); check('espiada: começa tudo à vista', (await page.locator('.fx-card.previa').count()) > 0); await shot('espiada');
await page.waitForFunction(() => document.querySelectorAll('.fx-card.previa').length === 0, null, { timeout: 9000 }); check('espiada: depois vira', (await page.locator('.fx-card.aberta').count()) === 0); await pares(); check(`fase ${n} (olhe e vire): concluída`, await concluida());
// 1c quem sumiu (fase 17)
n = 17; await abre(n); await page.waitForSelector('.fx-sc'); await shot('sumiu1');
for (let r = 0; r < 5; r++) { await page.waitForSelector('.fx-op[data-certo="1"]', { timeout: 9000 }); if (r === 0) await shot('sumiu2'); await page.locator('.fx-op[data-certo="1"]').click(); await sleep(1100); }
check(`fase ${n} (quem sumiu): concluída`, await concluida());
// 2 detetive (fase 22)
n = 22; await abre(n); await page.waitForSelector('.dn-card'); await shot('detetive');
for (let r = 0; r < 3; r++) { await page.waitForFunction(() => !!window.__figurix.secreto); const sec = await page.evaluate(() => window.__figurix.secreto.slice()); for (const cell of sec) await page.locator(`.dn-card[data-cell="${cell}"]`).click(); if (r === 0) await shot('detetive2'); await page.locator('.dn-conferir').click(); await sleep(1500); }
check(`fase ${n} (detetive): concluída`, await concluida());
// 3 quiz de instrumentos (fases 11 e 28)
for (n of [11, 28]) { await abre(n); await page.waitForSelector('.fx-ouvir'); await shot(`instr${n}`); const tot = await page.locator('.tr-fasehead .dn-dots i').count();
  for (let r = 0; r < tot; r++) { await page.waitForSelector('.fx-op[data-certo="1"]'); await page.locator('.fx-op[data-certo="1"]').click(); await sleep(1000); }
  check(`fase ${n} (de quem é esse som?): concluída`, await concluida()); }
check('sem erros de página', errs.length === 0, errs.join(' | ')); await browser.close(); srv.close(); done();
