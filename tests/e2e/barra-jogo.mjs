// A barra de baixo (Jogos · Estudos · Tocar · Álbum · Lojinha) some DENTRO dos jogos (toque perto da borda caía na Lojinha) e volta na lista de jogos e nas outras telas.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: true });
await ctx.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().url().includes('aluno_codigo_ok') ? 'true' : '[]' }));
const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 844 });
await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'T'); localStorage.setItem('beaterista-aluno-codigo', 'ABC123'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
const vis = async (h) => { await p.goto(`${url}/aluno.html${h}`); await sleep(1800); return p.locator('.bottom-nav').isVisible(); };
check('lista de jogos: a barra aparece', await vis('#/jogos'));
check('dentro do Toca Aqui: sem barra', !(await vis('#/jogos/toca')));
check('dentro do jogo da velha: sem barra', !(await vis('#/jogos/velha')));
check('dentro da memória: sem barra', !(await vis('#/jogos/memart')));
check('dentro de Letras: sem barra', !(await vis('#/dicas/caca')));
check('Estudos e Álbum: a barra aparece', (await vis('#/estudos')) && (await vis('#/perfil')));
check('ao voltar pra lista de jogos a barra volta', (await vis('#/jogos/velha')) === false && (await (async () => { await p.evaluate(() => { location.hash = '#/jogos'; }); await sleep(1200); return p.locator('.bottom-nav').isVisible(); })()));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
