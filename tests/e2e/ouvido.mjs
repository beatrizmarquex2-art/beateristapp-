// Jogos de ouvido e escalas: 3ª ou 5ª, que acorde é, maior ou menor e Escalas. Joga cada um na tela (resposta certa e errada).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch();
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); } catch (e) {} });
const shot = (n) => page.screenshot({ path: `${process.env.SHOTS || '/tmp'}/ouvido-${n}.png` });
const espera = (fn, ms = 15000) => page.waitForFunction(fn, null, { timeout: ms });

check('os 4 jogos novos ficam escondidos dos alunos (só no app da Bea por enquanto)', await (async () => { await page.goto(url + '/aluno.html#/jogos'); await sleep(1500); return page.evaluate(() => ['terca', 'acorde-ouvido', 'maior-menor', 'escala'].every((id) => !document.querySelector(`a.jg-card[href="#/jogos/${id}"]`))); })());

for (const [id, label] of [['terca', '3ª ou 5ª'], ['acorde-ouvido', 'que acorde'], ['maior-menor', 'maior ou menor']]) {
  await page.goto(url + `/aluno.html#/jogos/${id}`); await sleep(1300);
  check(`${label}: abre com botão jogar e chips pequenos`, await page.evaluate(() => !!document.querySelector('.vv-go') && [...document.querySelectorAll('.vv-chip')].every((c) => c.getBoundingClientRect().height <= 34)));
  await shot(`${id}-1`);
  await page.evaluate(() => document.querySelector('.vv-go').click());
  await espera(() => window.__ouvido && window.__ouvido.estado === 'jogo');
  check(`${label}: mostra as respostas em botões de 16px ou mais`, await page.evaluate(() => { const b = [...document.querySelectorAll('.vv-opcao')]; return b.length >= 2 && b.every((x) => parseFloat(getComputedStyle(x).fontSize) >= 16); }));
  await shot(`${id}-2`);
  for (let k = 0; k < 8; k++) {
    await espera(() => window.__ouvido.estado === 'jogo' && !document.querySelector('.vv-opcao[disabled]'));
    await sleep(80);
    const certa = await page.evaluate(() => String(window.__ouvido.certa));
    const errar = k === 7; // a última erra, pra ver o 2º resultado
    const alvo = errar ? await page.evaluate((c) => { const o = [...document.querySelectorAll('.vv-opcao')].find((b) => b.dataset.v !== c); return o.dataset.v; }, certa) : certa;
    await page.evaluate((v) => window.__ouvido.responde(isNaN(v) ? v : (v === '3' || v === '5' ? Number(v) : v)), alvo);
    if (errar) { check(`${label}: erro mostra qual era a certa`, await page.evaluate(() => !!document.querySelector('.vv-opcao.ok') && !!document.querySelector('.vv-opcao.bad'))); }
  }
  await espera(() => window.__ouvido.estado === 'fim', 8000);
  check(`${label}: no fim mostra 7 de 8 e 2 estrelas`, await page.evaluate(() => document.querySelector('.vv-res-n').textContent.includes('7 de 8') && document.querySelector('.vv-res-est').getAttribute('aria-label').startsWith('2')));
  await shot(`${id}-3`);
}

/* escalas na tela: dó maior */
await page.goto(url + '/aluno.html#/jogos/escala'); await sleep(1300);
check('escala: na tela só aparece o que dá só com teclas brancas (maior = só dó)', await page.evaluate(() => [...document.querySelectorAll('.vv-linha')].find((l) => l.getAttribute('aria-label') === 'começa em').querySelectorAll('.vv-chip').length === 1));
await shot('escala-1');
await page.evaluate(() => document.querySelector('.vv-go').click()); await espera(() => window.__escala.estado === 'jogo');
check('escala: a escala de dó maior tem 8 notas', await page.evaluate(() => window.__escala.alvo.join() === '60,62,64,65,67,69,71,72'));
await page.evaluate(() => window.__escala.nota(62)); check('escala: nota errada conta erro e não avança', await page.evaluate(() => window.__escala.erros === 1 && document.querySelectorAll('.vv-n.ok').length === 0));
for (const m of [60, 62, 64, 65, 67, 69, 71, 72]) await page.evaluate((n) => window.__escala.nota(n), m);
await espera(() => window.__escala.estado === 'fim', 5000);
check('escala: concluiu com 1 erro = 2 ★', await page.evaluate(() => document.querySelector('.vv-res-est').getAttribute('aria-label').startsWith('2')));
await shot('escala-2');
/* escala pelo microfone: qualquer oitava, qualquer tônica */
await page.evaluate(() => localStorage.setItem('x', '1'));
await page.goto(url + '/aluno.html#/jogos/escala'); await sleep(800);
await page.evaluate(() => [...document.querySelectorAll('.vv-chip')].find((c) => c.textContent === 'no instrumento').click()); await sleep(300);
check('escala: com microfone aparecem as 12 tônicas', await page.evaluate(() => [...document.querySelectorAll('.vv-linha')].find((l) => l.getAttribute('aria-label') === 'começa em').querySelectorAll('.vv-chip').length === 12));

check('nenhum erro de JS', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
