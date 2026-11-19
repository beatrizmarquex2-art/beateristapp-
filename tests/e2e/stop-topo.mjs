// Stop: a faixa de cima (você / letra / tempo) fica no fluxo da página e não por cima do 1º campo (uma regra antiga das figurinhas também se chamava .st-top e a tirava do lugar).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch();
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); });
await p.goto(`${url}/aluno.html#/jogos/stop`); await sleep(1500);
const jog = p.locator('button:has-text("JOGAR")'); if (await jog.count()) { await jog.first().click(); await sleep(300); }
await p.locator('.jg-actions .btn').last().click().catch(() => {}); await sleep(1500);
await p.locator('button:has-text("sortear a letra")').first().click(); await p.waitForSelector('.st-top', { timeout: 15000 }); await sleep(500);
const m = await p.evaluate(() => ({ pos: getComputedStyle(document.querySelector('.st-top')).position, bottom: document.querySelector('.st-top').getBoundingClientRect().bottom, field: document.querySelector('.st-field').getBoundingClientRect().top }));
check('a faixa do topo não está solta (position não é absolute)', m.pos !== 'absolute', m.pos);
check('a faixa do topo termina antes do 1º campo', m.bottom <= m.field + 1, `${Math.round(m.bottom)} <= ${Math.round(m.field)}`);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
