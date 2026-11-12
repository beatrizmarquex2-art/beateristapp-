// iPhone antigo (iOS < 15.4): sem crypto.randomUUID, .at, findLast, hasOwn e structuredClone. A entrada e os jogos têm que funcionar.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const antigo = () => { try { delete Crypto.prototype.randomUUID; } catch { /* ok */ } try { Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true }); } catch { /* ok */ }
  for (const [o, n] of [[Array.prototype, 'at'], [String.prototype, 'at'], [Array.prototype, 'findLast'], [Array.prototype, 'findLastIndex'], [Object, 'hasOwn']]) { try { delete o[n]; } catch { /* ok */ } }
  try { delete window.structuredClone; } catch { /* ok */ } };
const ctx = await context(browser, { viewport: { width: 390, height: 780 }, codigo: false });
await ctx.addInitScript(antigo);
await ctx.route('**/*.supabase.co/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null', headers: { 'access-control-allow-origin': '*' } }));
const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(String(e).slice(0, 160)));
await p.goto(`${url}/aluno.html`); await sleep(1500);
await p.locator('input[aria-label="Seu nome"]').fill('Leticia'); await p.locator('select').selectOption({ index: 1 }); await p.locator('button:has-text("gerar meu código")').click(); await sleep(400);
await p.locator('button:has-text("entrar")').click(); await sleep(2500);
check('entra no app mesmo sem randomUUID (o erro do iPhone da Letícia)', (await p.locator('.al-entry').count()) === 0 && (await p.locator('nav .nav-item').count()) >= 4 && !(await p.locator('.form-err').innerText().catch(() => '')).includes('deu erro'), await p.locator('.form-err').innerText().catch(() => ''));
check('os polyfills entraram', await p.evaluate(() => typeof crypto.randomUUID === 'function' && typeof [].at === 'function' && typeof [].findLast === 'function'));
for (const rota of ['#/jogos/cara/livre', '#/jogos/velha/livre', '#/jogos/stop/livre', '#/jogos/bingo/livre', '#/estudos', '#/lojinha']) { await p.goto(`${url}/aluno.html${rota}`); await sleep(1300); }
check('sem erros de JS nas telas principais', !p.errs.length, p.errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
