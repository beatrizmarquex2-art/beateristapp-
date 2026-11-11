// Toca Aqui com microfone: se o aparelho recusar o microfone, a tela diz o MOTIVO (e como resolver), continua na tela e tem botão "tentar o microfone de novo".
// Escolher "microfone" de novo também tenta outra vez (antes ficava bloqueado até recarregar a página).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: true });
const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 900 }); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().url().includes('aluno_codigo_ok') ? 'true' : '[]' }));
await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ }
  const real = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices); window.__nega = true;
  navigator.mediaDevices.getUserMedia = (c) => (window.__nega ? Promise.reject(Object.assign(new Error('negado'), { name: 'NotAllowedError' })) : real(c)); });
await p.goto(`${url}/aluno.html#/jogos/toca/livre`); await p.waitForSelector('.tr-pad', { timeout: 20000 }); await sleep(600);
await p.locator('[role=radio]:has-text("microfone")').click(); await sleep(300);
await p.locator('button:has-text("tocar direto")').click(); await p.waitForSelector('.tr-micerro', { timeout: 8000 });
const txt = await p.locator('.tr-micerro').innerText();
check('mostra o motivo (sem permissão) e como resolver, e avisa que vai usar a tela', /sem permissão/.test(txt) && /Ajustes/.test(txt) && /vou usar a tela/.test(txt), txt.replace(/\s+/g, ' '));
check('tem o botão "tentar o microfone de novo"', (await p.locator('.tr-micerro button').count()) === 1);
await p.evaluate(() => { window.__nega = false; });
await p.locator('.tr-micerro button').click(); await sleep(400);
check('depois de tentar de novo o aviso some e o toque volta pro modo microfone', (await p.locator('.tr-micerro').count()) === 0 && (await p.locator('.tr-pad.mic').count()) === 1);
await p.locator('button:has-text("tocar direto")').click(); await sleep(2000);
check('com a permissão liberada o microfone abre (pad "live")', (await p.locator('.tr-pad.live').count()) === 1 && (await p.locator('.tr-micerro').count()) === 0);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
