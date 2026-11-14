// Lojinha só com ebooks (preços, Black Friday no Bateria Start, aviso de digital) e pensamentos do Paul chamando pra Lojinha e pros jogos.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: false }); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/*.supabase.co/**', (r) => r.fallback());
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await page.goto(`${url}/aluno.html#/lojinha`); await sleep(2000);
const precos = await page.locator('.lj-card').evaluateAll((es) => es.map((e) => `${e.querySelector('h3').textContent}=${(e.querySelector('.lj-preco-card') || {}).textContent || ''}`));
check('6 ebooks com preço no cartão', precos.length === 6 && precos.every((x) => /R\$/.test(x)), precos.join(' | '));
const start = page.locator('.lj-card[data-id="start"]');
check('Bateria Start: PROMOÇÃO BLACK FRIDAY, de R$ 29,90 por R$ 14,90', (await start.locator('.lj-selo').textContent()).includes('BLACK FRIDAY') && (await start.locator('.lj-de').textContent()) === 'R$ 29,90' && (await start.locator('.lj-preco-card').textContent()).includes('R$ 14,90'));
check('aviso de materiais digitais (estudar e imprimir)', /digitais/.test(await page.locator('.lj-digital').textContent()) && /imprimir/.test(await page.locator('.lj-digital').textContent()));
check('todos os botões Adquirir têm link (nenhum "em breve") e o Passe está escondido', (await page.locator('.lj-btn.breve').count()) === 0 && (await page.locator('.lj-passe').count()) === 0);
// pensamentos do Paul
const itens = await page.evaluate(async () => { const m = await import('/js/paul-talk.js'); return m.THOUGHTS.filter((t) => t[2] === 'aluno').map((t) => t[1]); });
check('pensamentos de Lojinha e de jogos existem', itens.some((h) => h === '#/lojinha') && itens.some((h) => h.startsWith('#/jogos')), itens.join(' '));
await page.goto(`${url}/aluno.html#/jogos`); await sleep(1500);
await page.evaluate(async () => { const m = await import('/js/paul-talk.js'); m.think(m.THOUGHTS.find((t) => t[1] === '#/lojinha'), 20000); });
await sleep(300);
const a = page.locator('.pt-cloud .pt-ver'); check('a nuvem é um link interno (abre no mesmo app)', (await a.getAttribute('href')) === '#/lojinha' && (await a.getAttribute('target')) === null);
await a.click(); await sleep(800);
check('tocar na nuvem leva pra Lojinha', (await page.evaluate(() => location.hash)) === '#/lojinha' && (await page.locator('.lj-card').count()) === 6);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
