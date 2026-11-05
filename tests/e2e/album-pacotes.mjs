// Estrelas e pontuação dão pacotes pro álbum (aba Álbum, só com código): 1 por estrela nova dos Kids e 1 a cada 5 ★ de ritmo, sem entregar em dobro.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/rest/v1/rpc/fig_entrar', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, nome: 'Ana', estado: null }) }));
await ctx.route('**/rest/v1/rpc/fig_salvar', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
await ctx.route('**/*.supabase.co/**', (r) => (r.request().url().includes('/rpc/fig_') ? r.fallback() : r.abort()));
await ctx.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Ana'); } catch { /* ok */ } });
await page.goto(url + '/aluno.html#/album'); await page.waitForSelector('.fig-gate');
check('álbum trancado: pede código', (await page.locator('.fig-gate-form input').count()) === 1);
const r = await page.evaluate(async () => {
  const A = await import('/js/kids/album.js'); const P = await import('/js/kids/progress.js'); const FR = await import('/js/figurinhas/rewards.js');
  const me = P.active() || P.profiles()[0]; const antes = FR.pending();
  const k = await A.grantPacks(me.id, 2); const r1 = await A.grantByStars(me.id, 12); const r2 = await A.grantByStars(me.id, 12);
  return { antes, k, r1, r2, depois: FR.pending() };
});
check('2 estrelas novas = 2 pacotes', r.k === 2, JSON.stringify(r));
check('12 ★ de ritmo = 2 pacotes e repetir não dá de novo', r.r1 === 2 && r.r2 === 0, JSON.stringify(r));
check('pacotes somam', r.depois === r.antes + 4, JSON.stringify(r));
await page.fill('.fig-gate-form input', 'bea-0404'); await page.click('.fig-gate-form button'); await page.waitForSelector('.fig-tabs', { timeout: 10000 });
check('com o código, a aba Pacotes mostra os pacotes ganhos', /[4-9]/.test(await page.locator('.fig-tabs [role=tab]').last().textContent()), await page.locator('.fig-tabs [role=tab]').last().textContent());
check('sem erros', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
