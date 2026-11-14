// Figurix, fases novas (13 a 62): resolve de verdade uma de cada tipo mais difícil (ligar por valor, memória pausa↔nome, monte a fsemifusa, árvore com base menor, quiz difícil, caça na diagonal).
import { serve, launch, sleep, check, done, alunoComCodigo } from './harness.mjs';
import { PHASES, MUNDOS, mundoDe, montesDe, peçasDe, arvore } from '../../js/jogos/figurix-logic.js';
import { FIGS } from '../../js/kids/figs.js';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } }); await alunoComCodigo(ctx);
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); localStorage.setItem('beaterista-figurix-sem-tempo', '1'); if (!localStorage.getItem('beaterista-jogos:teste')) localStorage.setItem('beaterista-jogos:teste', JSON.stringify({ v: 1, sound: true, games: { figurix: { est: Object.fromEntries(Array.from({ length: 62 }, (_, i) => [i + 1, 3])) } } })); /* regra das 3 ★: o aluno do teste já tem tudo com 3 ★ pra poder abrir qualquer mundo */ } catch (e) {} });
const abre = async (n) => { const m = mundoDe(n); await page.goto(url + '/aluno.html#/jogos'); await sleep(250); await page.goto(url + '/aluno.html#/jogos/figurix'); await page.waitForSelector('.mp-node');
  await page.locator('.tm-tabs button').nth(MUNDOS.indexOf(m)).click(); await sleep(700); await page.waitForSelector('.mp-node');
  await page.evaluate((p) => document.querySelector(`.mp-node[data-pos="${p}"]`).scrollIntoView({ block: 'center' }), n - m.de); await sleep(150); await page.evaluate((p) => document.querySelector(`.mp-node[data-pos="${p}"]`).click(), n - m.de); await sleep(500); };
const nivel = (tipo, nv) => PHASES.find((p) => p.tipo === tipo && p.nivel === nv).n;
const concluida = async () => { await sleep(1400); return /concluída/.test(await page.textContent('.jg-figurix')); };
// ligar por valor (nível 4 = tipo "valor")
let n = nivel('ligar', 4); await abre(n);
for (const f of await page.locator('.fx-lig:not(.nome)').evaluateAll((e) => e.map((x) => x.dataset.f))) { await page.locator(`.fx-lig[data-f="${f}"]`).click(); await page.locator(`.fx-lig.nome[data-n="${f}"]`).click(); await sleep(120); }
check(`fase ${n} (ligar figura ↔ quanto vale): ligou tudo`, await concluida());
// memória (nível 5 = pausa ↔ nome)
n = nivel('memoria', 5); await abre(n); await page.waitForSelector('.fx-card');
await page.waitForFunction(() => document.querySelectorAll('.fx-card.aberta').length === 0, null, { timeout: 9000 });
const cs = await page.evaluate(() => window.__figurix.cartas);
for (const id of [...new Set(cs.map((c) => c.par))]) { const [a, b] = cs.filter((c) => c.par === id); await page.locator(`.fx-card[data-k="${a.k}"]`).click(); await page.locator(`.fx-card[data-k="${b.k}"]`).click(); await sleep(150); }
check(`fase ${n} (memória pausa ↔ nome, ${cs.length / 2} pares): achou todos`, await concluida());
// monte a figura (nível 6: semifusa com 4 colchetes etc.)
n = nivel('monte', 6); await abre(n); await page.waitForSelector('.fx-peca');
const alvos = montesDe(6); const NOME = Object.fromEntries(FIGS.map((f) => [f.name, f.id]));
for (let r = 0; r < alvos.length; r++) {
  const nome = (await page.textContent('.fx-q')).replace('monte a ', '').trim(); const pc = peçasDe(NOME[nome]);
  await page.getByRole('button', { name: pc.cabeca === 'cheia' ? 'bolinha pintada' : 'bolinha vazia' }).click(); await page.getByRole('button', { name: pc.haste ? 'com haste' : 'sem haste' }).click();
  await page.getByRole('button', { name: pc.colchetes === 0 ? '0 colchetes' : `${pc.colchetes} colchete${pc.colchetes === 1 ? '' : 's'}` }).click(); await page.getByRole('button', { name: 'conferir' }).click(); await sleep(1300);
}
check(`fase ${n} (monte até a semifusa): montou todas`, /concluída/.test(await page.textContent('.jg-figurix')));
// árvore com base menor (nível 5)
n = nivel('notas', 5); await abre(n); await page.waitForSelector('.fx-arv');
const T = arvore(5); for (const l of T.linhas.filter((x) => !x.pronto)) await page.locator(`.fx-arv[data-id="${l.id}"] .fx-n`, { hasText: new RegExp(`^${l.cabem}$`) }).click();
check(`fase ${n} (monte as notas, base ${T.base}): completou`, await concluida());
// quiz difícil (nível 6: 12 perguntas, 4 opções)
n = nivel('quiz', 6); await abre(n); await page.waitForSelector('.fx-op');
const tot = await page.evaluate(() => document.querySelectorAll('.dn-dots i').length);
for (let i = 0; i < tot; i++) { const c = await page.evaluate(() => window.__figurix.certa); await page.locator('.fx-op', { has: page.locator('b', { hasText: new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }) }).click(); await sleep(950); }
check(`fase ${n} (quiz difícil, ${tot} perguntas): acertou todas com 3 estrelas`, /concluída/.test(await page.textContent('.jg-figurix')) && (await page.getAttribute('.dn-estrelas', 'aria-label')) === '3 de 3 estrelas');
// caça-palavras com diagonal (nível 5: grade 12)
n = nivel('caca', 5); await abre(n); await page.waitForSelector('.fx-c');
check(`fase ${n}: grade 12x12`, (await page.locator('.fx-c').count()) === 144);
const g = await page.evaluate(() => window.__figurix.caca.placed);
for (const w of g) { const x1 = w.x + w.dx * (w.w.length - 1), y1 = w.y + w.dy * (w.w.length - 1); await page.locator(`.fx-c[data-x="${w.x}"][data-y="${w.y}"]`).click(); await page.locator(`.fx-c[data-x="${x1}"][data-y="${y1}"]`).click(); await sleep(80); }
check(`fase ${n} (caça-palavras na diagonal): achou todas`, await concluida());
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
