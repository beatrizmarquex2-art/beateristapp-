// Toca Aqui, jogo taiko (caixa à esquerda = agudo, bumbo à direita = grave): abre, joga uma rodada tocando no lado certo e confere o resultado.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); } catch (e) {} });
await page.goto(url + '/aluno.html#/jogos/toca/livre'); await sleep(800);
await page.evaluate(() => [...document.querySelectorAll('.jg-seg button')].find((b) => /taiko/.test(b.textContent)).click()); await sleep(300);
check('os botões são desenhos de tambor', await page.evaluate(() => document.querySelectorAll('.tk-pad svg').length === 2));
check('tem os 2 pads (agudo à esquerda, grave à direita)', await page.evaluate(() => { const p = [...document.querySelectorAll('.tk-pad')]; return p.length === 2 && p[0].dataset.side === 'agudo' && p[1].dataset.side === 'grave' && p[0].getBoundingClientRect().left < p[1].getBoundingClientRect().left; }));
await page.evaluate(() => document.querySelector('.tk > .kd-btn').click()); await sleep(300);
const n = await page.evaluate(() => window.__taiko.chart.length); check('gera notas', n > 0, String(n));
// toca cada nota no instante certo
await page.evaluate(async () => {
  const T = window.__taiko; const ctxA = (await import('/js/audio.js')).audio(false);
  for (const note of T.chart.slice()) { while (ctxA.currentTime < T.t0 + note.t - 0.005) await new Promise((r) => setTimeout(r, 2)); document.querySelector(`.tk-pad.${note.side}`).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, timeStamp: performance.now() })); }
});
await sleep(1500);
const txt = await page.evaluate(() => document.querySelector('.tk-res') && !document.querySelector('.tk-res').hidden ? document.querySelector('.tk-res').textContent : '');
check('mostra o resultado com boa precisão', /(\d+)%/.test(txt) && +txt.match(/(\d+)%/)[1] >= 90, txt);
check('sem erro de página', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); done();
