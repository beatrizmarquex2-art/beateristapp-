// Bônus escondidos no navegador: segredo 1x só; 5 vitórias online seguidas = 1 exclusiva (derrota zera); no máximo 3 por mês.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await page.goto(`${url}/aluno.html#/jogos`); await sleep(2500);
const r = await page.evaluate(async () => {
  const B = await import('/js/figurinhas/bonus.js'); const R = await import('/js/figurinhas/rewards.js'); const g = () => R.stateOf().granted; const out = {};
  await B.egg('paradiddle'); await B.egg('paradiddle'); out.eggs = g().filter((i) => i.startsWith('egg:')).length;
  for (let i = 0; i < 4; i++) await B.online('uno', 'win'); out.apos4 = g().filter((i) => i.startsWith('bonus:')).length;
  await B.online('uno', 'loss'); for (let i = 0; i < 4; i++) await B.online('uno', 'win'); out.derrotaZera = g().filter((i) => i.startsWith('bonus:')).length;
  await B.online('uno', 'win'); out.apos5 = g().filter((i) => i.startsWith('bonus:')).length;
  for (let i = 0; i < 40; i++) await B.online('velha', 'win'); out.limite = g().filter((i) => i.startsWith('bonus:')).length;
  out.empate = (await (async () => { for (let i = 0; i < 4; i++) await B.online('memoria', 'win'); await B.online('memoria', 'tie'); const antes = g().filter((i) => i.startsWith('bonus:')).length; await B.online('memoria', 'win'); return [antes, g().filter((i) => i.startsWith('bonus:')).length]; })());
  return out;
});
check('segredo vale 1 vez só', r.eggs === 1, JSON.stringify(r));
check('4 vitórias online ainda não dão nada', r.apos4 === 0);
check('uma derrota zera a sequência', r.derrotaZera === 0);
check('a 5ª vitória seguida dá 1 exclusiva', r.apos5 === 1);
check('no máximo 3 bônus por mês', r.limite === 3, String(r.limite));
check('empate não zera nem soma (e o limite já foi atingido)', r.empate[0] === 3 && r.empate[1] === 3, JSON.stringify(r.empate));
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
