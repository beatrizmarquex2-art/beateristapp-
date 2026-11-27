// Quebra-cabeça "Nagano Drums & Beaterista": monta (6 peças, modo livre) e, no fim, aparece o link da visita da Bea na fábrica.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await ctx.route('**/*.supabase.co/**', (r) => r.abort());
await page.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); });
await page.goto(url + '/aluno.html#/jogos/quebra/livre'); await page.waitForSelector('.jg-quebra', { timeout: 10000 }); await sleep(600);
await page.evaluate(async () => { (await import('/js/acesso.js')).definir(true); }); await sleep(500);
await page.getByRole('button', { name: 'agora não' }).click({ timeout: 2000 }).catch(() => {});
const nomes = await page.evaluate(async () => (await import('/js/jogos/quebra.js')).IMAGES.map((x) => x.id));
check('a imagem da Nagano está na lista', nomes.includes('nagano'), nomes.join(','));
await page.locator('.qz-grupos button', { hasText: 'bateria' }).click(); await sleep(250); await page.locator('.qz-thumbs button').last().click(); await sleep(300);
check('a última miniatura da bateria é a da Nagano', /Nagano/.test(await page.locator('.qz-prev-nome').textContent()));
await page.locator('.qz-go .btn.primary').click(); await page.waitForSelector('.jg-pz.tp', { timeout: 10000 }); await sleep(500);
for (let i = 0; i < 6; i++) { const pc = page.locator('.jg-pz.tp').first(); const id = await pc.getAttribute('data-piece'); await pc.click(); await page.locator(`.jg-pz.slot[data-pos="${id}"]`).click(); await sleep(250); }
await page.waitForSelector('.jg-result', { timeout: 8000 }).catch(() => {});
const link = page.locator('a.qb-link');
check('ao montar aparece o link da visita à fábrica', (await link.count()) === 1 && /instagram\.com\/reel\/DbRtnCuJjGX/.test(await link.getAttribute('href')) && (await link.getAttribute('target')) === '_blank' && /noopener/.test(await link.getAttribute('rel')));
await page.screenshot({ path: process.env.SHOT || '/tmp/quebra-nagano.png' });
check('sem erro de JS', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
