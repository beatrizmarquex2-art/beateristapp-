// Jogos Kids: trocar de fase / sair / recomeçar não pode deixar som, timer ou resultado da rodada anterior.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); });
await page.goto(url + '/aluno.html#/kids');
await page.waitForSelector('.kx-g, .kx-cards');
const go = async (h) => { await page.evaluate((x) => { location.hash = x; }, h); };
const click = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (e && !e.disabled) { e.click(); return true; } return false; }, sel);
const peak = (ms) => page.evaluate((m) => window.__peak(m), ms);
const live = () => page.evaluate(() => window.__audible());
const timers = () => page.evaluate(() => ({ t: window.__ac.timers.size, i: window.__ac.intervals.size, r: window.__ac.raf.size }));

// jogos que fazem som sozinhos ao mostrar a pergunta, e os que dependem de toque
const SOUND = [['bumbos', '#/kids/bumbos/0'], ['pecas (ouvir)', '#/kids/pecas/0/ouvir'], ['eco', '#/kids/eco/0'], ['detetive', '#/kids/detetive/0']];

for (const [name, route] of SOUND) {
  await go(route); await sleep(300); await click('.kx-go'); await sleep(250);
  const p1 = await peak(2200);
  check(`[${name}] toca o som da pergunta (sanidade)`, p1 > 0.005, `pico ${p1.toFixed(3)}`);
  await go('#/kids'); await sleep(450);
  const p2 = await peak(900);
  check(`[${name}] sair da fase cala tudo`, p2 < 0.004, `pico ${p2.toFixed(4)}`);
}

// sair 20 vezes seguidas bem rápido (o som de exemplo é agendado ~250 ms depois de mostrar a pergunta)
for (let i = 0; i < 20; i++) {
  const [, route] = SOUND[i % SOUND.length];
  await go(route); await sleep(40 + (i % 4) * 60); await click('.kx-go'); await sleep(30 + (i % 5) * 90); await go('#/kids'); await sleep(20);
}
await sleep(500);
const pr = await peak(1200);
check('20 entradas/saídas rápidas de fase: sem som residual', pr < 0.004, `pico ${pr.toFixed(4)}`);
await sleep(2500);
const t = await timers();
check('sem timers/rAF de fase antiga pendentes na tela de fases', t.i === 0 && t.r <= 1, JSON.stringify(t));
check('nenhuma fonte de áudio presa', (await live()) <= 2, `${await live()} ativas`);

// jogar uma fase inteira e apertar "jogar de novo" várias vezes seguidas: sem resultado duplicado
await go('#/kids/pauta/0'); await sleep(300); await click('.kx-go');
const rounds = await page.evaluate(() => 0);
for (let k = 0; k < 40; k++) { await sleep(150); if (await page.evaluate(() => !!document.querySelector('.kx-result'))) break; await click('.kd-opt'); await sleep(1850); }
const hasResult = await page.evaluate(() => !!document.querySelector('.kx-result'));
check('fase terminou e mostrou o resultado', hasResult);
const logLen = () => page.evaluate(async () => { const P = await import('/js/kids/progress.js'); const me = P.active(); return P.progOf(me.id).log.length; });
const before = await logLen();
check('o resultado foi gravado uma única vez', before === 1, `log=${before}`);
for (let k = 0; k < 6; k++) { await click('.kx-act .kd-chip, .kx-act .kd-btn:last-child'); await sleep(120); }
await sleep(1500);
const after = await logLen();
check('apertar "jogar de novo" repetido não grava resultado duplicado', after === 1, `log=${after}`);
const pj = await peak(800);
check('sem som residual depois de recomeçar a fase', pj < 0.2, `pico ${pj.toFixed(3)}`);
check('sem erros de JS na página', errs.length === 0, errs.slice(0, 3).join(' | '));
const fails = done(); await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
