// Prova do Paul nos Estudos: acordes (violão e teclado) e ritmos abrem 3 perguntas e terminam com estrelas.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
const rodar = async (hash, rot) => {
  await page.goto(`${url}/aluno.html#${hash}`); await sleep(2200);
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /prova do Paul/.test(b.textContent)).click()); await sleep(400);
  const perguntas = [];
  for (let i = 0; i < 3; i++) { perguntas.push(await page.evaluate(() => document.querySelector('.pv-bar')?.textContent || '')); await page.evaluate(() => document.querySelector('.pv-op').click()); await sleep(1100); }
  const fim = await page.evaluate(() => document.querySelector('.pv-box')?.textContent || '');
  check(`${rot}: 3 perguntas e tela final`, perguntas.every((p, i) => p.includes(`pergunta ${i + 1} de 3`)) && /de 3 certas/.test(fim));
};
await rodar('/estudos/acordes/violao', 'violão'); await rodar('/estudos/acordes/teclado', 'teclado'); await rodar('/estudos/ritmos', 'ritmos');
check('sem erro na página', errs.length === 0);
await browser.close(); srv.close(); done();
