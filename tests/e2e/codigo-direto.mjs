// "já tenho código": campo direto na primeira tela (sem escolher opção) e direto na aba Jogos.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const validos = new Set(['MEU1234']);
const mk = async () => { const ctx = await context(browser, { viewport: { width: 390, height: 844 }, codigo: false });
  await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(validos.has(String(r.request().postDataJSON().p_code).toUpperCase())) }));
  await ctx.route('**/rest/v1/rpc/**', (r) => (r.request().url().includes('aluno_codigo_ok') ? r.fallback() : r.fulfill({ status: 200, contentType: 'application/json', body: '[]' })));
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(String(e).slice(0, 160))); return p; };
// primeira tela: nome + código, sem escolher a opção
let p = await mk(); await p.goto(`${url}/aluno.html`); await sleep(1500);
check('primeira tela mostra o campo do código direto', await p.locator('.al-cod').isVisible());
await p.locator('input[aria-label="Seu nome"]').fill('Bea'); await p.locator('.al-cod').fill('MEU1234'); await p.locator('button[type=submit]').first().click(); await sleep(2500);
check('entrou só com nome + código (sem escolher "como chegou")', (await p.evaluate(() => location.hash)).includes('jogos') || (await p.locator('nav .nav-item').count()) >= 4);
check('já entrou liberado: sem botão "código" no topo e sem cadeado na aba Álbum', (await p.locator('.al-tenho:visible').count()) === 0 && (await p.locator('.nav-item.locked').count()) === 0);
// aba Jogos: campo direto enquanto não tem código
const q = await mk(); await q.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Bea'); } catch { /* ok */ } });
await q.goto(`${url}/aluno.html#/jogos`); await sleep(1800);
check('aba Jogos tem o campo "já tem código de aluno?" direto na tela', await q.locator('.jg-cod-aluno .jg-code-in').isVisible());
await q.locator('.jg-cod-aluno .jg-code-in').fill('ERRADO1'); await q.locator('.jg-cod-aluno button:has-text("liberar")').click(); await sleep(900);
check('código errado avisa em português', /não achei/.test(await q.locator('.jg-cod-aluno .jg-msg').innerText()));
await q.locator('.jg-cod-aluno .jg-code-in').fill('MEU1234'); await q.locator('.jg-cod-aluno button:has-text("liberar")').click(); await sleep(1500);
check('código certo libera e o quadro some', (await q.locator('.jg-cod-aluno').count()) === 0 && (await q.locator('.nav-item.locked').count()) === 0);
check('sem erros de JS', ![...p.errs, ...q.errs].length, [...p.errs, ...q.errs].join('|'));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
