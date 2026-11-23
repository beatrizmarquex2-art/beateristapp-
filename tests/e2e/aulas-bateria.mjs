// Aulas da bateria de toque (Palco > bateria > aulas): abre com código de aluno, o Paul acende as peças e o aluno repete (toques injetados com o tempo certo).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); } catch (e) {} });
const shot = (n) => page.screenshot({ path: `${process.env.SHOTS || '/tmp'}/aulas-bat-${n}.png` });
const espera = (fn, ms = 30000) => page.waitForFunction(fn, null, { timeout: ms });

await page.goto(url + '/aluno.html#/toque'); await sleep(2200);
check('o "canhota" fica dentro da área da bateria e o "aulas" na linha de baixo, em outro lugar', await page.evaluate(() => !!document.querySelector('.tk-palco .kd-canhota') && !!document.querySelector('.kd-aulas') && !document.querySelector('.tk-palco .kd-aulas')));
await page.evaluate(() => document.querySelector('.kd-aulas').click()); await sleep(500);
check('abre a lista com 9 aulas', await page.evaluate(() => document.querySelectorAll('.au-item').length === 9));
await shot('1-lista');

await page.evaluate(() => [...document.querySelectorAll('.au-item')].find((b) => b.textContent.includes('ritmo 5')).click()); await sleep(400);
check('a aula mostra a grade com as 3 peças do ritmo 5', await page.evaluate(() => document.querySelectorAll('.au-pl').length === 3 && document.querySelectorAll('.au-cel.on').length === 8));
await shot('2-aula');
await page.evaluate(() => { document.querySelectorAll('.bl-step')[0].click(); }); // 100 -> 95 bpm só pra conferir o controle
check('o controle de bpm muda o número', await page.evaluate(() => document.querySelector('.au-tempo output').textContent === '95'));
await page.evaluate(() => document.querySelectorAll('.au-tempo .bl-step')[1].click());
await page.evaluate(() => document.querySelector('.au-go').click());
await espera(() => window.__aulaBat && window.__aulaBat.vezes && window.__aulaBat.vezes.length === 3);
check('o Paul acende peças da bateria durante o exemplo', await (async () => { let viu = false; for (let i = 0; i < 80 && !viu; i++) { viu = await page.evaluate(() => !!document.querySelector('.tk-art [data-p].au-luz')); await sleep(40); } return viu; })());
await shot('3-paul');
// toca certinho nas 3 rodadas (tempo absoluto = vez + passo)
await page.evaluate(() => {
  const w = window.__aulaBat; const a = w.aula; const q = w.q; const s = q / (a.n === 8 ? 2 : 4); const P = { cr: [], ch: a.p.ch, cx: a.p.cx, bu: a.p.bu };
  for (const vez of w.vezes) for (const p of ['ch', 'cx', 'bu']) for (const i of P[p]) w.inject(i * s + vez, p);
});
await espera(() => document.querySelector('.au-res-n'), 40000);
check('resultado 100% e 3 estrelas', await page.evaluate(() => document.querySelector('.au-res-n').textContent === '100%' && /★★★/.test(document.querySelector('.au-res-est').textContent)));
await shot('4-resultado');
check('guardou a melhor nota', await page.evaluate(() => { const g = JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith('beaterista-jogos'))) || '{}'); return g.games && g.games.aulabat && g.games.aulabat.est && g.games.aulabat.est.r05 === 100; }));
check('sem erros na página', errs.length === 0, errs.join(' | '));
await done(browser, srv);
