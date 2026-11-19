// Link "reinicia a entrada" (aluno.html?entrar): quem só experimentou volta pra tela de entrada limpa; quem é aluno (tem código) não é desconectado; os dois terminam na aba principal (Início).
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const mk = async (ini) => {
  const ctx = await context(browser, { viewport: { width: 390, height: 844 }, codigo: false });
  await ctx.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().url().includes('aluno_codigo_ok') ? 'true' : '[]' }));
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(String(e).slice(0, 160)));
  await p.addInitScript((i) => { try { if (!sessionStorage.getItem('ini')) { sessionStorage.setItem('ini', '1'); for (const [k, v] of Object.entries(i)) localStorage.setItem(k, v); } localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } }, ini);
  return p;
};
// 1) só experimentou (nome, sem código), estava num jogo qualquer
let p = await mk({ 'beaterista-aluno-nome': 'Ana', 'beaterista-aluno-origem': 'não informou' });
await p.goto(`${url}/aluno.html#/ritmo/setas`); await sleep(1500);
check('antes do link, quem experimentou está dentro do app', (await p.locator('.al-entry').count()) === 0);
await p.goto(`${url}/aluno.html?entrar#/ritmo/setas`); await sleep(1800);
check('com o link, quem só experimentou volta pra tela de entrada limpa', (await p.locator('.al-entry').count()) === 1 && !(await p.evaluate(() => localStorage.getItem('beaterista-aluno-nome'))));
check('o link limpa o ?entrar e deixa a aba principal como destino', (await p.evaluate(() => location.search === '' && location.hash === '#/inicio')));
const AL = p.locator('.en-box').first();
await p.locator('.en-box').first().locator('input').first().fill('Bia').catch(() => {});
const exp = p.locator('button:has-text("experimentar")'); if (await exp.count()) { await exp.first().click(); await sleep(2500); }
check('depois de entrar de novo, cai na aba principal (Início)', (await p.evaluate(() => location.hash)).startsWith('#/inicio') && (await p.locator('.al-entry').count()) === 0, await p.evaluate(() => location.hash));
await p.close();
// 2) aluno com código: nunca é desconectado
p = await mk({ 'beaterista-aluno-nome': 'Cris', 'beaterista-aluno-codigo': 'TESTE1' });
await p.goto(`${url}/aluno.html?entrar#/ritmo/setas`); await sleep(2200);
check('aluno com código continua dentro (não é desconectado)', (await p.locator('.al-entry').count()) === 0 && (await p.evaluate(() => localStorage.getItem('beaterista-aluno-nome'))) === 'Cris' && (await p.evaluate(() => localStorage.getItem('beaterista-aluno-codigo'))) === 'TESTE1');
check('e cai direto na aba principal', (await p.evaluate(() => location.hash)) === '#/inicio', await p.evaluate(() => location.hash));
await p.close();
// 3) ninguém logado: entrada normal
p = await mk({});
await p.goto(`${url}/aluno.html?entrar`); await sleep(1500);
check('sem nome nenhum: tela de entrada', (await p.locator('.al-entry').count()) === 1);
check('sem erros de página', p.errs.length === 0, p.errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
