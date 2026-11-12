// Aba Jogos: caça-palavras, cruzadinha e quiz ficam separados, cada um com seu nome (js/letras-nomes.js), e o duelo de 2 celulares é um modo "com código" dentro de cada um; o quiz do Uno não aparece na lista
// (abre no fim do Uno Musical); cada card abre direto no jogo certo.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); } catch (e) {} });
await page.goto(url + '/aluno.html#/jogos'); await sleep(2200);
const txt = await page.evaluate(() => document.body.innerText);
for (const n of ['Radar Musical', 'Clave Cruzada', 'Quiz do Paul', 'Taiko']) check(`a lista de jogos tem "${n}"`, txt.includes(n));
check('não tem card de duelo nem "Rudimentos" na lista', !/Duelo/.test(txt) && !/Rudimentos/.test(txt));
check('a lista não tem mais o card "Letras" nem o "quiz Uno Musical"', !/^Letras$/m.test(txt) && !/quiz Uno Musical/i.test(txt));
check('Uno Musical continua na lista', /Uno Musical/.test(txt));
await page.screenshot({ path: process.env.SHOTS ? process.env.SHOTS + '/jogos-lista.png' : '/tmp/jogos-lista.png', fullPage: true });
for (const [nome, hash] of [['Clave Cruzada', '#/dicas/cruzadinha'], ['Quiz do Paul', '#/dicas/quiz'], ['Radar Musical', '#/dicas/caca']]) {
  await page.goto(url + '/aluno.html#/jogos'); await sleep(1200);
  await page.evaluate((n) => { const a = [...document.querySelectorAll('a')].find((x) => x.textContent.includes(n)); if (a) a.click(); }, nome); await sleep(1200);
  check(`"${nome}" abre ${hash}`, (await page.evaluate(() => location.hash)).startsWith(hash), await page.evaluate(() => location.hash));
  check(`a tela de ${nome} tem o nome no título`, (await page.evaluate(() => document.body.innerText)).includes(nome));
}
for (const k of ['caca', 'cruzadinha', 'quiz']) {
  await page.goto(url + `/aluno.html#/dicas/${k}`); await sleep(1500);
  const modos = await page.evaluate(() => [...document.querySelectorAll('.dc-modos button')].map((b) => b.textContent.trim()));
  check(`${k}: tem os modos sozinho e com código`, modos.length === 2 && modos[0] === 'sozinho' && /com código/.test(modos[1]), modos.join('|'));
  await page.evaluate(() => [...document.querySelectorAll('.dc-modos button')][1].click()); await sleep(2500);
  check(`${k}: "com código" abre o duelo desse jogo (sem escolher o jogo de novo)`, (await page.evaluate(() => location.hash)) === `#/dicas/${k}/codigo` && !/^jogo$/mi.test(await page.evaluate(() => [...document.querySelectorAll('.jg-lab, .dl-lab, label')].map((x) => x.textContent.trim()).join('\n'))));
}
check('a aba de duelo não existe mais na barra de jogos', await page.evaluate(() => ![...document.querySelectorAll('.dc-pick')].some((x) => /duelo/i.test(x.textContent))));
await page.goto(url + '/aluno.html#/jogos/quizuno'); await sleep(1500);
check('o quiz do Uno continua abrindo pelo endereço direto', /pergunta 1 de 5/.test(await page.evaluate(() => document.body.innerText)));
check('sem erro de página', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); done();
