// Banners da vitrine: acesso anual (enquanto vale a oferta) e combo Robôterista, com a arte inteira.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: false }); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/*.supabase.co/**', (r) => r.fallback());
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch {} });
await page.goto(`${url}/aluno.html#/lojinha`); await sleep(1500);
const ids = await page.locator('.ljv-banner').evaluateAll((es) => es.map((e) => e.dataset.id));
const oferta = await page.evaluate(async () => (await import('/js/passe-preco.js')).precoPasse().oferta);
check('o banner do acesso anual é o primeiro enquanto vale a oferta; depois o combo e os baralhos', (oferta ? ids.join() === 'anual,combo-robo,cards-combo' : ids.join() === 'combo-robo,cards-combo'), ids.join());
check('sem aba black friday', (await page.getByRole('tab', { name: 'black friday' }).count()) === 0);
check('o combo Robôterista continua com botão de compra', (await page.locator('#lj-combos [data-id="combo-bf"] .lj-btn').count()) === 1);
check('sem erros', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); done();
