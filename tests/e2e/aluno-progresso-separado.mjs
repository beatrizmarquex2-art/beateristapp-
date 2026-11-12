// Cada aluno tem o seu progresso: quem troca de aluno no mesmo aparelho começa do zero, e ao voltar o que era dele está lá.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: false }); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/*.supabase.co/**', (r) => r.fallback());
await page.addInitScript(() => { try { localStorage.setItem('bt-mute', '1'); if (!localStorage.getItem('beaterista-aluno-nome')) localStorage.setItem('beaterista-aluno-nome', 'Aluna A'); } catch { /* ok */ } });
await page.goto(`${url}/aluno.html#/jogos`); await sleep(2500);
const pontos = () => page.evaluate(async () => { const S = await import('/js/store.js'); const B = await import('/js/jogos/base.js'); return { treinos: (S.get('setting-treinos') || { data: {} }).data.pstars || null, jogo: B.getGame('teste').n || 0 }; });
await page.evaluate(async () => { const S = await import('/js/store.js'); const B = await import('/js/jogos/base.js'); await S.upsert('setting', 'setting-treinos', { pstars: { 0: 3, 1: 3 } }); B.setGame('teste', { n: 7 }); });
const a1 = await pontos(); check('aluna A tem progresso', a1.treinos && a1.treinos[0] === 3 && a1.jogo === 7, JSON.stringify(a1));
await page.evaluate(() => localStorage.setItem('beaterista-aluno-nome', 'Aluno B')); await page.reload(); await sleep(2500);
const b = await pontos(); check('aluno B começa do zero', !b.treinos && b.jogo === 0, JSON.stringify(b));
await page.evaluate(() => localStorage.setItem('beaterista-aluno-nome', 'Aluna A')); await page.reload(); await sleep(2500);
const a2 = await pontos(); check('voltando pra aluna A o progresso está lá', a2.treinos && a2.treinos[1] === 3 && a2.jogo === 7, JSON.stringify(a2));
check('sem erros', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); done();
