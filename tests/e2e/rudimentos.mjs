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
check('caixa à esquerda (E, vermelho) e bumbo à direita (D, azul)', await page.evaluate(() => { const e = document.querySelector('.rd-pad.E'); const d = document.querySelector('.rd-pad.D'); const rgb = (el) => getComputedStyle(el).borderTopColor; return e.dataset.inst === 'caixa' && d.dataset.inst === 'bumbo' && /255, 61, 87/.test(rgb(e)) && /45, 140, 255/.test(rgb(d)) && e.getBoundingClientRect().left < d.getBoundingClientRect().left; }));
check('mostra o padrão escrito (16 letras) e os 2 pads E/D', await page.evaluate(() => document.querySelectorAll('.rd-l').length === 16 && document.querySelectorAll('.rd-pad').length === 2 && document.querySelectorAll('.rd-pad .rd-drum svg').length === 2 && document.querySelector('.rd-pad.E').getBoundingClientRect().left < document.querySelector('.rd-pad.D').getBoundingClientRect().left));
check('tem os 4 andamentos (80, 100, 120, 140) em discos de vinil', await page.evaluate(() => [...document.querySelectorAll('.rd-vin small')].map((x) => x.textContent.replace(/\D/g, '')).join() === '80,100,120,140' && document.querySelectorAll('.rd-vin .vinil').length === 4));
check('escolhe a figura (colcheia/semicolcheia) e como jogar (tela/microfone)', await page.evaluate(() => [...document.querySelectorAll('.rd-chip')].map((x) => x.textContent).join() === 'colcheia,semicolcheia,jogar na tela,microfone'));
check('sem emojis na tela do jogo', await page.evaluate(() => !/\p{Extended_Pictographic}/u.test(document.querySelector('.jg-rud').textContent.replace(/[★☆✓▶◀↻‹]/g, ''))));
await page.screenshot({ path: process.env.SHOTS ? process.env.SHOTS + '/rud-2-fase.png' : '/tmp/rud-2-fase.png' });
await page.evaluate(() => document.querySelector('.rd-go').click()); await sleep(300);
const n = await page.evaluate(() => window.__rud.chart.length); check('gera 64 notas', n === 64, String(n));
check('colcheia a 80 BPM: uma nota a cada 0,375 s', await page.evaluate(() => Math.abs(window.__rud.chart[1].t - 0.375) < 1e-9 && window.__rud.por === 2));
check('as notas seguem o padrão D E D E…', await page.evaluate(() => window.__rud.chart.slice(0, 8).map((x) => x.side).join('') === 'DEDEDEDE'));
await sleep(2500); await page.evaluate(() => document.querySelector('.rd-info').scrollIntoView({ block: 'start' })); await sleep(250); await page.screenshot({ path: process.env.SHOTS ? process.env.SHOTS + '/rud-3-jogando.png' : '/tmp/rud-3-jogando.png' });
await page.evaluate(async () => {
  const T = window.__rud; const ctxA = (await import('/js/audio.js')).audio(false);
  for (const note of T.chart.slice()) { while (ctxA.currentTime < T.t0 + note.t - 0.005) await new Promise((r) => setTimeout(r, 2)); document.querySelector(`.rd-pad.${note.side}`).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); }
});
await sleep(1800);
const txt = await page.evaluate(() => (document.querySelector('.rd-res') && !document.querySelector('.rd-res').hidden ? document.querySelector('.rd-res').textContent : ''));
check('resultado com boa precisão', /(\d+)%/.test(txt) && +txt.match(/(\d+)%/)[1] >= 90, txt);
check('avisa que ganhou as 3 estrelas da célula (100% de toques certos)', /ganhou 3 ★/.test(txt) && /^3\/24/.test(await page.evaluate(() => document.querySelector('.rd-topo .rd-est').textContent)));
await page.screenshot({ path: process.env.SHOTS ? process.env.SHOTS + '/rud-4-resultado.png' : '/tmp/rud-4-resultado.png' });
await page.evaluate(() => [...document.querySelectorAll('.rd-topo .btn')][0].click()); await sleep(300);
check('depois da estrela a fase 2 destrava', await page.evaluate(() => !document.querySelector('.rd-fase[data-fase="2"]').disabled && document.querySelector('.rd-fase[data-fase="3"]').disabled));
// semicolcheia: 4 por tempo (a 80 BPM, 0,1875 s)
await page.evaluate(() => document.querySelector('.rd-fase[data-fase="2"]').click()); await sleep(300);
await page.evaluate(() => [...document.querySelectorAll('.rd-chip')].find((x) => x.textContent === 'semicolcheia').click()); await sleep(300);
await page.evaluate(() => document.querySelector('.rd-go').click()); await sleep(300);
check('semicolcheia a 80 BPM: uma nota a cada 0,1875 s', await page.evaluate(() => Math.abs(window.__rud.chart[1].t - 0.1875) < 1e-9 && window.__rud.por === 4));
await page.evaluate(() => [...document.querySelectorAll('.rd-topo .btn')][0].click()); await sleep(300);
// microfone: mostra o aviso (sem pads) e, sem permissão de microfone, volta sozinho pra tela
await page.evaluate(() => document.querySelector('.rd-fase[data-fase="2"]').click()); await sleep(300);
await page.evaluate(() => [...document.querySelectorAll('.rd-chip')].find((x) => x.textContent === 'microfone').click()); await sleep(300);
check('modo microfone: aviso no lugar dos pads', await page.evaluate(() => !!document.querySelector('.rd-micaviso') && !document.querySelector('.rd-pad') && window.__rud.modo === 'mic'));
await page.screenshot({ path: process.env.SHOTS ? process.env.SHOTS + '/rud-5-microfone.png' : '/tmp/rud-5-microfone.png' });
await page.evaluate(() => [...document.querySelectorAll('.rd-chip')].find((x) => x.textContent === 'jogar na tela').click()); await sleep(300);
// rodada tocando só com a mão errada (troca os lados): acerto baixo, não passa
await page.evaluate(() => document.querySelector('.rd-go').click()); await sleep(300);
await page.evaluate(async () => {
  const T = window.__rud; const ctxA = (await import('/js/audio.js')).audio(false);
  for (const note of T.chart.slice()) { while (ctxA.currentTime < T.t0 + note.t - 0.005) await new Promise((r) => setTimeout(r, 2)); document.querySelector(`.rd-pad.${note.side === 'D' ? 'E' : 'D'}`).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); }
});
await sleep(1800);
const txt2 = await page.evaluate(() => document.querySelector('.rd-res').textContent);
check('mão trocada não passa', /(\d+)%/.test(txt2) && +txt2.match(/(\d+)%/)[1] < 30 && /precisa de 70%/.test(txt2), txt2);
check('sem erro de página', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); done();
