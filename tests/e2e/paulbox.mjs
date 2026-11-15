// Paulbox (a banda do Paul): aparece pros alunos sem código, toca de verdade, troca de ritmo, pausa cala e sair cala.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
const shot = (n) => page.screenshot({ path: `${process.env.SHOTS || '/tmp'}/paulbox-${n}.png` });

await page.goto(url + '/aluno.html#/jogos'); await sleep(1800);
check('Paulbox aparece na aba Jogos dos alunos, aberto (sem cadeado)', await page.evaluate(() => { const a = document.querySelector('a.jg-card[href="#/jogos/paulbox"]'); return !!a && !a.classList.contains('locked'); }));
await shot('0-catalogo');

await page.goto(url + '/aluno.html#/jogos/paulbox'); await sleep(1500);
check('10 Pauls no palco, todos desligados e com imagem carregada', await page.evaluate(() => { const s = [...document.querySelectorAll('.pbx-slot')]; return s.length === 10 && s.every((b) => b.dataset.s === '0' && b.querySelector('img').naturalWidth > 0); }));
check('os botões e a 1ª fileira de Pauls aparecem sem rolar', await page.evaluate(() => document.querySelector('.pbx-bar').getBoundingClientRect().bottom < window.innerHeight && document.querySelector('.pbx-slot').getBoundingClientRect().bottom < window.innerHeight));
check('os 10 Pauls ficam numa fileira só, um do lado do outro', await page.evaluate(() => new Set([...document.querySelectorAll('.pbx-slot')].map((b) => Math.round(b.getBoundingClientRect().top))).size === 1));
await shot('1-vazio');

await page.click('.pbx-slot[data-id="bateria"]'); await sleep(300);
check('1 toque liga o ritmo A e a banda começa', await page.evaluate(() => document.querySelector('.pbx-slot[data-id="bateria"]').dataset.s === '1' && window.__paulbox.tocando));
check('sai som de verdade', (await page.evaluate(() => window.__peak(1500))) > 0.01);
for (let i = 0; i < 3; i++) await page.click('.pbx-slot[data-id="bateria"]');
check('4 toques = ritmo D', await page.evaluate(() => document.querySelector('.pbx-slot[data-id="bateria"] .pbx-chip').textContent === 'ritmo D'));
await page.click('.pbx-slot[data-id="bateria"]');
check('no 5º toque ele sai', await page.evaluate(() => document.querySelector('.pbx-slot[data-id="bateria"]').dataset.s === '0'));

await page.evaluate(() => [...document.querySelectorAll('.pbx-act')].find((b) => b.textContent === 'Banda base').click()); await sleep(900);
check('Banda base liga bateria, baixo, teclado e guitarra', await page.evaluate(() => window.__paulbox.state.join('') === '1111000000'));
await shot('2-banda-base');
await page.evaluate(() => [...document.querySelectorAll('.pbx-act')].find((b) => b.textContent === 'Surpresa').click()); await sleep(600);
check('Surpresa deixa pelo menos 1 tocando', await page.evaluate(() => window.__paulbox.state.some(Boolean)));
await shot('3-surpresa');

await page.click('.jg-pausa-btn'); await sleep(700);
check('pausa cala a banda', (await page.evaluate(() => window.__peak(700))) < 0.005 && await page.evaluate(() => !window.__paulbox.tocando));
await page.evaluate(() => document.querySelector('.jg-pausa .btn.primary').click()); await sleep(500);
check('continuar volta a tocar', await page.evaluate(() => window.__paulbox.tocando) && (await page.evaluate(() => window.__peak(1500))) > 0.01);

await page.evaluate(() => [...document.querySelectorAll('.jg-top .btn')].find((b) => b.textContent === 'nova partida').click()); await sleep(200);
check('"nova partida" zera a banda', await page.evaluate(() => window.__paulbox.state.every((s) => s === 0)));
await page.click('.pbx-slot[data-id="baixo"]'); await sleep(400);
await page.evaluate(() => { location.hash = '#/jogos'; }); await sleep(900);
check('sair do jogo cala tudo', (await page.evaluate(() => window.__peak(700))) < 0.005 && await page.evaluate(() => !window.__paulbox));
check('sem erro de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
