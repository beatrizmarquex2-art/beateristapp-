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
check('5 Pauls em cima e 5 embaixo', await page.evaluate(() => { const t = [...document.querySelectorAll('.pbx-slot')].map((b) => Math.round(b.getBoundingClientRect().top)); return new Set(t).size === 2 && t.slice(0, 5).every((x) => x === t[0]) && t.slice(5).every((x) => x === t[5]); }));
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

/* gravar um trecho (no teste, 3 s em vez de 20) */
await page.evaluate(() => { window.__pbxSeg = 3; document.querySelector('.pbx-rec').click(); }); await sleep(1200);
check('gravando: botão avisa e a banda segue tocando', await page.evaluate(() => /gravando/.test(document.querySelector('.pbx-rec').textContent) && window.__paulbox.tocando));
await page.click('.pbx-slot[data-id="guitarra"]');
await page.waitForSelector('.pbx-fim video', { timeout: 15000 });
const vid = await page.evaluate(async () => { const b = window.__paulbox.video; const u = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return { tipo: b.type, n: b.size, b64: btoa(s) }; });
check('o vídeo sai gravado de verdade (com tamanho)', /^video\//.test(vid.tipo) && vid.n > 30000, `${vid.tipo} ${vid.n}`);
if (process.env.SHOTS) (await import('node:fs')).writeFileSync(`${process.env.SHOTS}/paulbox-video.${/mp4/.test(vid.tipo) ? 'mp4' : 'webm'}`, Buffer.from(vid.b64, 'base64'));
check('tela do vídeo: baixar, gravar de novo e fechar; a banda cala enquanto isso', await page.evaluate(() => { const t = [...document.querySelectorAll('.pbx-fim .pbx-act')].map((b) => b.textContent); return t.includes('baixar') && t.includes('gravar de novo') && t.includes('fechar') && !window.__paulbox.tocando && /paulbox-beaterista\./.test(document.querySelector('.pbx-fim a[download]').download); }));
await shot('4-video-pronto');
await page.evaluate(() => [...document.querySelectorAll('.pbx-fim .pbx-act')].find((b) => b.textContent === 'fechar').click()); await sleep(400);
check('fechar volta pra banda tocando', await page.evaluate(() => !document.querySelector('.pbx-fim') && window.__paulbox.tocando));

await page.evaluate(() => [...document.querySelectorAll('.jg-top .btn')].find((b) => b.textContent === 'nova partida').click()); await sleep(200);
check('"nova partida" zera a banda', await page.evaluate(() => window.__paulbox.state.every((s) => s === 0)));
await page.click('.pbx-slot[data-id="baixo"]'); await sleep(400);
await page.evaluate(() => { location.hash = '#/jogos'; }); await sleep(900);
check('sair do jogo cala tudo', (await page.evaluate(() => window.__peak(700))) < 0.005 && await page.evaluate(() => !window.__paulbox));
check('sem erro de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
