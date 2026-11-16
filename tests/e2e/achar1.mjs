// Achar o 1: joga uma partida inteira na tela (5 rodadas), confere a régua, as estrelas e que nada quebra.
import { serve, launch, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); } catch (e) { /* ok */ } });
const shot = (n) => page.screenshot({ path: `${process.env.SHOTS || '/tmp'}/achar1-${n}.png` });
await page.goto(url + '/aluno.html#/jogos/achar1'); await page.waitForSelector('.vv-achar1 .vv-go');
await shot('menu');
check('menu tem 3 níveis e botão jogar', (await page.$$('.vv-achar1 .vv-chip')).length === 3);
await page.click('.vv-achar1 .vv-go'); await page.waitForSelector('.a1-pad');
check('começa na rodada 1 de 5', /rodada 1 de 5/.test(await page.textContent('.vv-achar1 .vv-quem')));
for (let r = 0; r < 5; r++) {
  if (r === 0) { // toca de verdade em cada 1 da rodada (lido do relógio de áudio): tem que pontuar
    await page.waitForTimeout(1500); await shot('tocando');
    await page.evaluate(() => new Promise((ok) => {
      const A = window.__achar1; const { g, offset, bpm } = A.rodada(); const passo = 60 / bpm / (g.steps / 4); const bar = passo * g.steps;
      const first = ((g.steps - offset) % g.steps) * passo; const alvo = [0, 1, 2, 3].map((k) => first + k * bar + 0.01); const t0 = A.inicio();
      const tick = () => { while (alvo.length && A.agora() >= t0 + alvo[0]) { alvo.shift(); document.querySelector('.a1-pad').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); } if (alvo.length) requestAnimationFrame(tick); else ok(); };
      tick();
    }));
  }
  await page.waitForSelector('.a1-veredito', { timeout: 40000 });
  if (r === 0) await shot('rodada1');
  check(`rodada ${r + 1}: régua com as marcas do 1`, (await page.$$('.a1-um')).length >= 3);
  if (r === 0) check('tocar nos 1 de verdade dá ponto', /achou/.test(await page.textContent('.a1-veredito')), await page.textContent('.a1-veredito'));
  if (r === 0) { await page.click('.a1-botoes .vv-chip'); await page.waitForFunction(() => !document.querySelector('.a1-botoes .vv-chip') && !document.querySelector('.a1-pad[disabled]'), null, { timeout: 40000 }); await shot('marcado'); }
  await page.click('.a1-botoes .vv-go');
  if (r < 4) await page.waitForFunction(() => !document.querySelector('.a1-veredito'), null, { timeout: 5000 });
}
await page.waitForSelector('.vv-res', { timeout: 10000 }); await shot('fim');
check('fim mostra 1 ponto (só a rodada 1 foi tocada) e 0 estrelas', /^1 de 5/.test(await page.textContent('.vv-res-n')) && /☆☆☆/.test(await page.textContent('.vv-res-est')), await page.textContent('.vv-res-n'));
check('sem erros de JS', errs.length === 0, errs[0] || '');
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
