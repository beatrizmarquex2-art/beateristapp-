// O Modo Aventura do Monte Seu Ritmo foi DESLIGADO (regra da Bea, 17/nov/2026: Modo Aventura só nos jogos de aprender: Toca Aqui, Detetive Note, Figurix e pauLta).
// O módulo (js/campanha/jogos/monte*.js) continua no repositório, só não é aberto. Aqui conferimos que o endereço antigo abre o jogo livre, sem mapa.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await page.goto(`${url}/aluno.html#/kids/ritmo/aventura`); await sleep(2500);
check('Monte seu ritmo não tem mais mapa de aventura', (await page.locator('.mp-node, .av-root').count()) === 0);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
