// Nomes de quem joga no mesmo aparelho: digita "jogador 1 ____" na memória e o jogo chama pelo nome na vez e no placar;
// o placar deixa compartilhar; os cartões "o Paul vai te apresentar" do pauLta ficam claros (não pegam a cor do placar azul).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: true });
await ctx.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().url().includes('aluno_codigo_ok') ? 'true' : '[]' }));
const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 844 }); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await p.goto(`${url}/aluno.html#/jogos/memart`); await p.waitForSelector('.mem-theme', { timeout: 20000 }); await sleep(600);
check('com 1 jogador não pede nome', (await p.locator('.jg-nomes').count()) === 0);
await p.locator('.mem-ic[aria-label^="pessoas"]').click(); await sleep(400);
check('com 2 jogadores aparecem 2 campos de nome', (await p.locator('.jg-nomes input').count()) === 2);
await p.locator('.mem-step button[aria-label="menos pares"]').click(); await sleep(300);
await p.locator('.jg-nomes input').nth(0).fill('Ana'); await sleep(150);
check('o nome fica guardado ao mexer nas opções', (await p.locator('.jg-nomes input').nth(0).inputValue()) === 'Ana');
await p.locator('.kx-go').click(); await sleep(700);
const vez = await p.locator('.kx-memstat').textContent(); check('a vez chama pelo nome', /vez de Ana/.test(vez), vez);
const pares = await p.evaluate(() => { const m = {}; [...document.querySelectorAll('.kx-mem')].forEach((b, i) => { const im = b.querySelector('img.mem-card-img'); (m[im.getAttribute('src')] ||= []).push(i); }); return Object.values(m); });
for (const [a, b] of pares) { await p.locator('.kx-mem').nth(a).click(); await p.locator('.kx-mem').nth(b).click(); await sleep(850); }
await p.waitForSelector('.kx-result', { timeout: 8000 }); await sleep(400);
const fim = (await p.locator('.kx-result').innerText()).toLowerCase(); check('placar com os nomes (quem ficou sem nome vira "jogador 2")', fim.includes('ana venceu') && fim.includes('jogador 2'), fim.replace(/\n+/g, ' | '));
check('placar tem o botão de compartilhar', (await p.locator('.kx-result .cq-bt').count()) === 1);
await p.goto(`${url}/aluno.html#/paulta`); await sleep(900); await p.evaluate(() => { location.hash = '#/paulta/drumF/1/nomes'; }); await sleep(900);
const cor = await p.evaluate(() => { const c = document.querySelector('.pl-tcard'); return c ? getComputedStyle(c).backgroundColor : ''; });
check('cartões do pauLta com fundo branco (pauta legível)', cor === 'rgb(255, 255, 255)', cor);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
