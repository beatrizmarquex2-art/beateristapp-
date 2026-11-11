// Jogando de verdade: terminar o jogo da memória sozinho vale 3 ★ (entra no total da roleta); o aviso mostra quantas faltam pra roleta.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: true });
await ctx.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().url().includes('aluno_codigo_ok') ? 'true' : '[]' }));
const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 844 }); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await p.goto(`${url}/aluno.html#/jogos/memart`); await p.waitForSelector('.mem-theme', { timeout: 20000 }); await sleep(600);
const total = () => p.evaluate(async () => { const P = await import('/js/kids/progress.js'); const E = await import('/js/figurinhas/estrelas.js'); return E.estrelasTotais(P.active().id); });
const antes = await total();
await p.locator('.mem-step button[aria-label="menos pares"]').click(); await p.locator('.kx-go').click(); await sleep(700);
const pares = await p.evaluate(() => { const m = {}; [...document.querySelectorAll('.kx-mem')].forEach((b, i) => { const im = b.querySelector('img.mem-card-img'); (m[im.getAttribute('src')] ||= []).push(i); }); return Object.values(m); });
for (const [a, b] of pares) { await p.locator('.kx-mem').nth(a).click(); await p.locator('.kx-mem').nth(b).click(); await sleep(850); }
await p.waitForSelector('.kx-result', { timeout: 8000 }); await sleep(600);
check('terminou a memória sozinho: +3 ★ no total da roleta', (await total()) - antes === 3, `${antes} → ${await total()}`);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
