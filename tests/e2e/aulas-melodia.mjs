// Aulas de melodia (Teclas e Percussão/xilofone): o Paul acende as teclas e o aluno repete clicando de verdade nas teclas e nas barras.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); } catch (e) {} });
const shot = (n) => page.screenshot({ path: `${process.env.SHOTS || '/tmp'}/aulas-mel-${n}.png` });
const espera = (fn, ms = 30000) => page.waitForFunction(fn, null, { timeout: ms });
const abre = (nome) => page.evaluate((n) => [...document.querySelectorAll('.au-item')].find((b) => b.textContent.includes(n)).click(), nome);
const alvo = () => page.evaluate(() => window.__aulaMel.sess.esperado());

/* ---------- Teclas ---------- */
await page.goto(url + '/aluno.html#/piano'); await sleep(2200);
check('o botão "aulas" aparece na linha "treinar" das teclas', await page.evaluate(() => !!document.querySelector('.kd-aulas') && [...document.querySelectorAll('.kd-modelos small')].some((s) => s.textContent === 'treinar')));
await page.evaluate(() => document.querySelector('.kd-aulas').click()); await sleep(400);
check('abre a lista com 6 músicas', await page.evaluate(() => document.querySelectorAll('.au-item').length === 6));
await abre('Dó ré mi fá'); await sleep(400);
check('mostra o nome da música e a partitura normal e a colorida da 1ª frase (5 notas cada)', await page.evaluate(() => document.querySelector('.au-nome').textContent === 'Dó ré mi fá' && document.querySelectorAll('.au-pauta > svg').length === 2 && [...document.querySelectorAll('.au-pauta > svg')].every((s) => s.querySelectorAll('.pn').length === 5)));
check('a colorida tem as cores das notas (dó vermelho)', await page.evaluate(() => document.querySelector('.au-pauta.cor').innerHTML.includes('#e0262f') && !document.querySelector('.au-pauta:not(.cor)').innerHTML.includes('#e0262f')));
check('o teclado mostra 2 oitavas a partir do dó 4 durante a aula', await page.evaluate(() => document.querySelectorAll('.pn-w').length === 15 && document.querySelector('.pn-w[data-m="60"]') && document.querySelector('.pn-w[data-m="74"]')));
await shot('1-teclas');
await page.evaluate(() => document.querySelector('.au-go').click());
await espera(() => window.__aulaMel && window.__aulaMel.estado === 'paul');
check('o Paul acende as teclas', await (async () => { let v = false; for (let i = 0; i < 80 && !v; i++) { v = await page.evaluate(() => !!document.querySelector('.pn-w.au-luz')); await sleep(40); } return v; })());
await espera(() => window.__aulaMel.estado === 'vez');
await shot('2-vez');
// erra uma nota de propósito, depois toca certo (clicando nas teclas de verdade)
const clica = async (m) => { await page.locator(`.pn-w[data-m="${m}"]`).click({ force: true, noWaitAfter: true }); await sleep(150); };
await clica(74); check('nota errada não avança: a esperada continua a mesma e a tecla certa fica acesa', await page.evaluate(() => window.__aulaMel.sess.erros === 1 && window.__aulaMel.sess.pos === 0 && !!document.querySelector('.pn-w.au-certa')));
for (let i = 0; i < 5; i++) await clica(await alvo());
await espera(() => window.__aulaMel.estado === 'paul' && window.__aulaMel.sess.frase === 1, 15000);
check('terminou a 1ª frase: o Paul toca a 2ª', await page.evaluate(() => window.__aulaMel.sess.frase === 1 && document.querySelectorAll('.au-pauta > svg')[0].querySelectorAll('.pn').length === 5));
await espera(() => window.__aulaMel.estado === 'vez', 15000);
for (let i = 0; i < 5; i++) await clica(await alvo());
await espera(() => document.querySelector('.au-res-n'), 15000);
check('resultado com 1 erro: 10 de 11 = 91% e 2 estrelas', await page.evaluate(() => document.querySelector('.au-res-n').textContent === '91%' && /★★☆/.test(document.querySelector('.au-res-est').textContent)));
await shot('3-resultado');
check('guardou a melhor nota e o teclado voltou ao normal ao sair', await (async () => { await page.evaluate(() => [...document.querySelectorAll('.au-topo button')].find((b) => b.textContent.includes('músicas')).click()); await sleep(300); return page.evaluate(() => { const g = JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith('beaterista-jogos'))) || '{}'); return g.games.aulamel.est.escada === 91 && document.querySelectorAll('.pn-w').length !== 15; }); })());

/* ---------- Percussão (xilofone) ---------- */
await page.goto(url + '/aluno.html#/xilofone'); await sleep(2200);
await page.evaluate(() => document.querySelector('.kd-aulas').click()); await sleep(400);
await abre('Jingle Bells'); await sleep(500);
check('o xilofone mostra só as barras da música (dó ré mi fá sol = 5)', await page.evaluate(() => document.querySelectorAll('.ti-bar').length === 5));
await page.evaluate(() => document.querySelector('.au-go').click());
await espera(() => window.__aulaMel && window.__aulaMel.estado === 'paul');
check('o Paul acende as barras', await (async () => { let v = false; for (let i = 0; i < 80 && !v; i++) { v = await page.evaluate(() => !!document.querySelector('.ti-bar.au-luz')); await sleep(40); } return v; })());
const bate = async (m) => { await page.locator(`.ti-bar[data-m="${m}"]`).click({ force: true, noWaitAfter: true }); await sleep(180); };
for (let f = 0; f < 3; f++) { await espera(() => window.__aulaMel.estado === 'vez', 20000); const n = await page.evaluate(() => window.__aulaMel.musica.frases[window.__aulaMel.sess.frase].length); for (let i = 0; i < n; i++) await bate(await alvo()); await sleep(200); }
await espera(() => document.querySelector('.au-res-n'), 15000);
check('Jingle Bells no xilofone sem errar: 100% e 3 estrelas', await page.evaluate(() => document.querySelector('.au-res-n').textContent === '100%' && /★★★/.test(document.querySelector('.au-res-est').textContent)));
await shot('4-xilofone');
check('sem erros na página', errs.length === 0, errs.join(' | '));
await done(browser, srv);
