// pauLta no modo livre (aluno sem código): joga normal e abre qualquer fase, mas não vale ponto, estrela, título, ranking nem figurinha.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await ctx.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'false' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch { /* ok */ } });
await page.goto(url + '/aluno.html#/paulta'); await page.waitForSelector('.kx-cards .kx-g');
const go = async (h) => { await page.evaluate((x) => { location.hash = x; }, h); await sleep(400); };
const click = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (e && !e.disabled) { e.click(); return true; } return false; }, sel);
const txt = () => page.evaluate(() => document.querySelector('#view').innerText);
await go('#/paulta/drum/6/nomes');
check('modo livre: a fase 6 abre sem ter feito as outras', (await page.evaluate(() => location.hash)).includes('/drum/6') && (await page.$$('.adv')).length === 0);
await go('#/paulta/drum/1/nomes'); await click('.kx-go'); await sleep(250);
for (let i = 0; i < 3; i++) {
  await page.evaluate(() => { const b = [...document.querySelectorAll('.pl-opt-btn:not([disabled])')]; if (b[0]) b[0].click(); }); await sleep(250);
  if (await page.$('.pl-continue')) { await sleep(800); await click('.pl-continue'); } else await sleep(1400);
}
await page.waitForSelector('.kx-result', { timeout: 6000 });
const t = await txt();
check('resultado mostra o aviso de modo livre', t.includes('modo livre'));
check('sem estrelas, sem pontos e sem figurinha no resultado', (await page.$$('.kx-stars')).length === 0 && !/pontos · total|figurinha nova/i.test(t));
check('nada entrou no progresso do Kids', !(await page.evaluate(async () => { const P = await import('/js/kids/progress.js'); return P.progOf(P.active().id).log.some((l) => String(l.game).startsWith('pl-')); })));
check('nenhum progresso do pauLta foi salvo', await page.evaluate(async () => { const S = await import('/js/store.js'); const r = S.get('setting-paulta'); return !r || !Object.values((r.data.players || {})).some((p) => p && p.done && Object.keys(p.done).length); }));
check('sem erros de JS', errs.length === 0, errs.slice(0, 2).join('|'));
await browser.close(); srv.close(); done();
