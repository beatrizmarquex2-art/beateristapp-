// Rudimentos (jogo novo): abre pelo endereço #/jogos/rudimentos (com código de aluno), vê as 11 fases com a 2 trancada, joga a fase 1 no andamento devagar
// tocando cada nota no instante certo (E à esquerda, D à direita), confere o resultado, a estrela, o desbloqueio da fase 2 e uma rodada tocando só a mão errada.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); } catch (e) {} });
await page.goto(url + '/aluno.html#/jogos/rudimentos'); await sleep(2000);
check('lista as 11 fases em 3 blocos', await page.evaluate(() => document.querySelectorAll('.rd-fase').length === 11 && document.querySelectorAll('.rd-bloco').length === 3));
check('só a fase 1 está aberta no começo', await page.evaluate(() => [...document.querySelectorAll('.rd-fase')].map((b) => !b.disabled).join() === 'true,false,false,false,false,false,false,false,false,false,false'));
await page.screenshot({ path: process.env.SHOTS ? process.env.SHOTS + '/rud-1-fases.png' : '/tmp/rud-1-fases.png' });
await page.evaluate(() => document.querySelector('.rd-fase[data-fase="1"]').click()); await sleep(400);
check('mostra o padrão escrito (16 letras) e os 2 pads E/D', await page.evaluate(() => document.querySelectorAll('.rd-l').length === 16 && document.querySelectorAll('.rd-pad').length === 2 && document.querySelectorAll('.rd-pad .rd-drum svg').length === 2 && document.querySelector('.rd-pad.E').getBoundingClientRect().left < document.querySelector('.rd-pad.D').getBoundingClientRect().left));
check('tem os 3 andamentos, em discos de vinil', await page.evaluate(() => document.querySelectorAll('.rd-vin').length === 3 && document.querySelectorAll('.rd-vin .vinil').length === 3));
check('sem emojis na tela do jogo', await page.evaluate(() => !/\p{Extended_Pictographic}/u.test(document.querySelector('.jg-rud').textContent.replace(/[★☆✓▶◀↻‹]/g, ''))));
await page.screenshot({ path: process.env.SHOTS ? process.env.SHOTS + '/rud-2-fase.png' : '/tmp/rud-2-fase.png' });
await page.evaluate(() => document.querySelector('.rd-go').click()); await sleep(300);
const n = await page.evaluate(() => window.__rud.chart.length); check('gera 64 notas', n === 64, String(n));
check('as notas seguem o padrão D E D E…', await page.evaluate(() => window.__rud.chart.slice(0, 8).map((x) => x.side).join('') === 'DEDEDEDE'));
await sleep(5400); await page.screenshot({ path: process.env.SHOTS ? process.env.SHOTS + '/rud-3-jogando.png' : '/tmp/rud-3-jogando.png' });
await page.evaluate(async () => {
  const T = window.__rud; const ctxA = (await import('/js/audio.js')).audio(false);
  for (const note of T.chart.slice()) { while (ctxA.currentTime < T.t0 + note.t - 0.005) await new Promise((r) => setTimeout(r, 2)); document.querySelector(`.rd-pad.${note.side}`).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); }
});
await sleep(1800);
const txt = await page.evaluate(() => (document.querySelector('.rd-res') && !document.querySelector('.rd-res').hidden ? document.querySelector('.rd-res').textContent : ''));
check('resultado com boa precisão', /(\d+)%/.test(txt) && +txt.match(/(\d+)%/)[1] >= 90, txt);
check('avisa que ganhou a estrela', /ganhou uma estrela/.test(txt) && (await page.evaluate(() => document.querySelector('.rd-topo .rd-est').textContent)).startsWith('★'));
await page.screenshot({ path: process.env.SHOTS ? process.env.SHOTS + '/rud-4-resultado.png' : '/tmp/rud-4-resultado.png' });
await page.evaluate(() => [...document.querySelectorAll('.rd-topo .btn')][0].click()); await sleep(300);
check('depois da estrela a fase 2 destrava', await page.evaluate(() => !document.querySelector('.rd-fase[data-fase="2"]').disabled && document.querySelector('.rd-fase[data-fase="3"]').disabled));
// rodada tocando só com a mão errada (troca os lados): acerto baixo, não passa
await page.evaluate(() => document.querySelector('.rd-fase[data-fase="2"]').click()); await sleep(300);
await page.evaluate(() => document.querySelector('.rd-go').click()); await sleep(300);
await page.evaluate(async () => {
  const T = window.__rud; const ctxA = (await import('/js/audio.js')).audio(false);
  for (const note of T.chart.slice()) { while (ctxA.currentTime < T.t0 + note.t - 0.005) await new Promise((r) => setTimeout(r, 2)); document.querySelector(`.rd-pad.${note.side === 'D' ? 'E' : 'D'}`).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); }
});
await sleep(1800);
const txt2 = await page.evaluate(() => document.querySelector('.rd-res').textContent);
check('mão trocada não passa', /(\d+)%/.test(txt2) && +txt2.match(/(\d+)%/)[1] < 30 && /precisa de 80%/.test(txt2), txt2);
check('sem erro de página', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); done();
