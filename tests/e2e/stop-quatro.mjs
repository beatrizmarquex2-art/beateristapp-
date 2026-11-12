// STOP no mesmo celular com 3 e 4 jogadores.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-jogos', JSON.stringify({ v: 1, sound: false, games: { stop: { mode: 'dupla' } } })); });
await p.goto(`${url}/aluno.html#/jogos/stop/livre`); await sleep(1200);
await p.locator('button:has-text("JOGAR")').click(); await sleep(400);
check('seletor quantos jogam', await p.locator('[aria-label="quantos jogam"] button').count() === 3);
check('2 nomes por padrão', await p.locator('.st-names input').count() === 2);
await p.locator('[aria-label="quantos jogam"] button', { hasText: '4' }).click(); await sleep(300);
check('4 campos de nome', await p.locator('.st-names input').count() === 4);
await p.locator('[aria-label="quantos jogam"] button', { hasText: '3' }).click(); await sleep(300);
check('3 campos de nome', await p.locator('.st-names input').count() === 3);
await p.locator('button:has-text("iniciar")').first().click(); await sleep(900);
check('partida iniciou sem erro', errs.length === 0, errs.join('|'));
done(); await browser.close(); srv.close();
