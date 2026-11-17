// Segredos do Palco no navegador: bateria acústica (Believer), 1ª vez = nome na tela + 3 ★; 2ª vez = só notinhas.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await page.goto(`${url}/aluno.html#/toque`); await sleep(2500);
const batida = async (id) => { await page.evaluate((i) => { const el = document.querySelector(`[data-p="${i}"]`); const r = el.getBoundingClientRect(); const o = { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 1, pointerType: 'touch' }; el.dispatchEvent(new PointerEvent('pointerdown', o)); el.dispatchEvent(new PointerEvent('pointerup', o)); }, id); await sleep(120); };
for (const id of ['ft', 'ft', 'ft', 'ft', 'sn']) await batida(id);
check('1ª vez: aparece Believer com +3 ★', await page.evaluate(() => /Believer/.test(document.querySelector('.sg-pop')?.textContent || '') && /3/.test(document.querySelector('.sg-pop')?.textContent || '')));
await sleep(3800);
for (const id of ['ft', 'ft', 'ft', 'ft', 'sn']) await batida(id);
check('2ª vez: só notinhas, sem o nome grande', await page.evaluate(() => !document.querySelector('.sg-pop') && document.querySelectorAll('.sg-n').length > 0));
check('sem erro na página', errs.length === 0);
await browser.close(); srv.close(); done();
