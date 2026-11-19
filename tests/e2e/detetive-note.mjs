// Detetive Note: abre direto no mapa (12 fases por modo, "figuras" em primeiro); cada fase = 3 ritmos que a criança ouve e MONTA com cartas.
import { serve, launch, sleep, check, done } from './harness.mjs';
import { cartas } from '../../js/jogos/detetive-logic.js';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch (e) {} });
await page.goto(url + '/aluno.html#/jogos/detetive'); await page.waitForSelector('.mp-node', { timeout: 15000 });
check('abre direto no mapa com 12 fases', (await page.locator('.mp-node').count()) === 12);
const modos = await page.locator('.tm-tabs button').allTextContents();
check('modos: mundo 1, 2 e 3, depois comida, parque, corpo e animal', modos.length === 7 && /mundo 1/.test(modos[0]) && /mundo 2/.test(modos[1]) && /mundo 3/.test(modos[2]) && /comida/.test(modos[3]) && /parque/.test(modos[4]) && /corpo/.test(modos[5]) && /animal/.test(modos[6]), modos.join('|'));
check('"mundo 1" já vem marcado', (await page.locator('.tm-tabs button.on').textContent()) === 'mundo 1');
let MODO = 'm1';
const monta = async (fase, certo = true) => {
  const sec = await page.evaluate(() => window.__detetive.secreto); const pool = cartas(MODO, fase).map((c) => c.cell);
  const ordem = certo ? sec : sec.map((c, i) => (i === 1 ? (c === '1000' ? '1010' : '1000') : c));
  for (const c of ordem) await page.locator('.dn-card').nth(pool.indexOf(c)).click();
};
const abre = async (pos) => { await page.evaluate((p) => document.querySelector(`.mp-node[data-pos="${p}"]`).click(), pos); await page.waitForSelector('.dn-card'); };
await abre(0);
check('fase 1: o botão de ouvir diz o som da fase (caixa)', /caixa/.test(await page.textContent('.dn-ouvir')));
check('fase 1: só 2 cartas e o cabeçalho sem texto de fase (só 3 bolinhas dos ritmos)', (await page.locator('.dn-card').count()) === 2 && !/fase|ritmo/i.test(await page.textContent('.tr-fasehead')) && (await page.locator('.dn-dots i').count()) === 3);
check('figuras sem pauta: as cartas não têm a linha da pauta', await page.evaluate(() => [...document.querySelectorAll('.dn-card svg')].every((s) => ![...s.querySelectorAll('line')].some((l) => l.getAttribute('y1') === l.getAttribute('y2')))));
check('fase 1 do mundo 1 toca a 70 bpm, sem escolha de velocidade', /70 bpm/.test(await page.textContent('.dn-ouvir')) && (await page.locator('.dn-bpm').count()) === 0);
await monta(1, false); await page.getByRole('button', { name: 'conferir' }).click(); await sleep(200);
check('errou: mostra o tempo errado em vermelho e deixa tentar de novo', (await page.locator('.dn-slot.no').count()) >= 1 && /quase/.test(await page.textContent('.jg-msg')));
await page.getByRole('button', { name: 'limpar' }).click(); await monta(1, true); await page.getByRole('button', { name: 'conferir' }).click(); await sleep(200);
check('acertou: os 4 tempos ficam verdes', (await page.locator('.dn-slot.ok').count()) === 4);
await sleep(1500);
for (let r = 1; r < 3; r++) { await monta(1, true); await page.getByRole('button', { name: 'conferir' }).click(); await sleep(1500); }
check('3 ritmos acertados: fase concluída com estrelas e botão da próxima fase', /fase 1 concluída/.test(await page.textContent('.jg-detetive')) && (await page.getByRole('button', { name: /próxima fase/ }).count()) === 1);
check('errou de primeira no 1º ritmo (2 de 3 = 67%): 1 estrela, como na pauLta', (await page.getAttribute('.dn-estrelas', 'aria-label')) === '1 de 3 estrelas', await page.getAttribute('.dn-estrelas', 'aria-label'));
await page.getByRole('button', { name: 'ver o mapa' }).click(); await page.waitForSelector('.mp-node');
await page.locator('.tm-tabs button').nth(4).click(); await page.waitForSelector('.mp-node'); MODO = 'parque'; // parque
await abre(4); // fase 5: entram as semicolcheias
check('fase 5 do parque: 4 cartas com desenho', (await page.locator('.dn-card').count()) === 4 && (await page.locator('.dn-card i').count()) === 4);

check('fase 5 do parque toca mais rápido que a fase 1', /\d+ bpm/.test(await page.textContent('.dn-ouvir')) && Number((await page.textContent('.dn-ouvir')).match(/(\d+) bpm/)[1]) > 70);
await monta(5, true); await page.getByRole('button', { name: 'conferir' }).click(); await sleep(200);
check('parque: monta e confere', (await page.locator('.dn-slot.ok').count()) === 4);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
