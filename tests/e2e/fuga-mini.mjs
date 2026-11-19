// Jogos de toque da Fuga (lote 1): Genius, caminho 3×3 e memória. Joga de verdade: grava a sequência que acende e repete.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
const SH = process.env.SHOTS || '/tmp';
await page.goto(`${url}/aluno.html`); await sleep(1500);
const monta = (tipo, nivel, area) => page.evaluate(async ([tipo, nivel, area]) => {
  const m = await import('/js/jogos/fuga-mini.js'); document.body.className = 'aluno-on'; document.body.innerHTML = '<div class="jg jg-wrap dc-wrap escuro fg-wrap" style="padding:14px;background:#0b0e1c"><div id="cx" class="dc-box"></div></div>';
  window.__fim = 0; window.__seq = []; const cx = document.getElementById('cx'); window.__api = m.MINI[tipo](cx, { nivel, area, fim: () => { window.__fim++; } });
  new MutationObserver((ms) => { for (const r of ms) { const e = r.target; if (e.classList.contains('on') && !/\bon\b/.test(r.oldValue || '')) window.__seq.push(e.dataset.pad ?? e.dataset.cel); } }).observe(cx, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
}, [tipo, nivel, area]);
// ---- genius (fácil, 4 rodadas, notas): ouve, repete a rodada inteira, completa tudo sem erro ----
await monta('genius', 'facil', 'notas'); await page.locator('.fgm-go').click();
let ok = true;
for (let r = 1; r <= 4; r++) {
  await page.waitForFunction(() => /sua vez/.test(document.querySelector('.fgm-msg').textContent), null, { timeout: 15000 });
  const seq = await page.evaluate((r) => window.__seq.slice(-r), r); if (seq.length !== r) ok = false;
  if (r === 2) await page.screenshot({ path: `${SH}/fuga-genius.png` });
  await page.evaluate(() => { window.__seq = []; });
  for (const p of seq) { await page.locator(`.fgm-pad[data-pad="${p}"]`).click(); await sleep(120); }
  await sleep(1300);
}
await sleep(800);
check('genius: 4 rodadas completas sem erro → chama fim, 3 ★', ok && (await page.evaluate(() => window.__fim)) === 1 && JSON.stringify(await page.evaluate(() => window.__api.stats())) === '{"erros":0,"found":4,"total":4,"estrelas":3}', JSON.stringify(await page.evaluate(() => window.__api.stats())));
// ---- genius: errar conta erro e repete a rodada (área bateria, 6 botões no difícil) ----
await monta('genius', 'dificil', 'bateria'); await page.locator('.fgm-go').click();
await page.waitForFunction(() => /sua vez/.test(document.querySelector('.fgm-msg').textContent), null, { timeout: 15000 });
const certo = (await page.evaluate(() => window.__seq.slice(-1)))[0]; const errado = String((Number(certo) + 1) % 6); await page.locator(`.fgm-pad[data-pad="${errado}"]`).click(); await sleep(300);
check('genius difícil na bateria: 6 botões; errar conta 1 erro e a rodada se repete', (await page.locator('.fgm-pad').count()) === 6 && (await page.evaluate(() => window.__api.stats().erros)) === 1 && /errou/.test(await page.textContent('.fgm-msg')));
await page.screenshot({ path: `${SH}/fuga-genius-bateria.png` });
// ---- caminho 3×3 (fácil: 2 caminhos de 4 casas) ----
await monta('caminho', 'facil'); await page.locator('.fgm-go').click(); ok = true;
for (let c = 0; c < 2; c++) {
  await page.waitForFunction(() => /agora é você/.test(document.querySelector('.fgm-msg').textContent), null, { timeout: 20000 });
  const seq = await page.evaluate(() => window.__seq.slice()); if (seq.length !== 4) ok = false;
  if (c === 0) await page.screenshot({ path: `${SH}/fuga-caminho.png` });
  await page.evaluate(() => { window.__seq = []; });
  for (const p of seq) { await page.locator(`.fgm-cel[data-cel="${p}"]`).click(); await sleep(120); }
  await sleep(1500);
}
await sleep(800);
check('caminho 3×3: 2 caminhos de 4 casas refeitos sem erro → fim, 3 ★', ok && (await page.evaluate(() => window.__fim)) === 1 && (await page.evaluate(() => window.__api.stats().estrelas)) === 3, JSON.stringify(await page.evaluate(() => window.__api.stats())));
await monta('caminho', 'facil'); await page.locator('.fgm-go').click();
await page.waitForFunction(() => /agora é você/.test(document.querySelector('.fgm-msg').textContent), null, { timeout: 20000 });
const primeiro = (await page.evaluate(() => window.__seq))[0]; const outro = String((Number(primeiro) + 4) % 9); await page.locator(`.fgm-cel[data-cel="${outro}"]`).click(); await sleep(300);
check('caminho: tocar numa casa errada conta erro e mostra o caminho de novo', (await page.evaluate(() => window.__api.stats().erros)) === 1 && /olhe de novo/.test(await page.textContent('.fgm-msg')));
// ---- memória (fácil: 4 pares) ----
await monta('memoria', 'facil'); await sleep(200);
check('memória fácil: 8 cartas viradas pra baixo', (await page.locator('.fgm-carta').count()) === 8 && (await page.locator('.fgm-carta.up').count()) === 0);
const ps = await page.evaluate(() => [...new Set([...document.querySelectorAll('.fgm-carta')].map((e) => e.dataset.par))]);
await page.locator('.fgm-carta').nth(0).click(); const par0 = await page.evaluate(() => document.querySelectorAll('.fgm-carta')[0].dataset.par);
const outraDe = await page.evaluate((p) => [...document.querySelectorAll('.fgm-carta')].findIndex((e, i) => i > 0 && e.dataset.par !== p), par0);
await page.locator('.fgm-carta').nth(outraDe).click(); await sleep(250); await page.screenshot({ path: `${SH}/fuga-memoria.png` });
await sleep(1200);
check('memória: virar 2 cartas diferentes conta 1 erro e desvira', (await page.evaluate(() => window.__api.stats().erros)) === 1 && (await page.locator('.fgm-carta.up').count()) === 0);
for (const p of ps) { const ids = await page.evaluate((p) => [...document.querySelectorAll('.fgm-carta')].map((e, i) => (e.dataset.par === p ? i : -1)).filter((i) => i >= 0), p); for (const i of ids) { await page.locator('.fgm-carta').nth(i).click(); await sleep(150); } await sleep(200); }
await sleep(900);
check('memória: achar os 4 pares chama fim; 1 erro = 3 ★', (await page.evaluate(() => window.__fim)) === 1 && (await page.evaluate(() => window.__api.stats().estrelas)) === 3 && (await page.locator('.fgm-carta.par').count()) === 8, JSON.stringify(await page.evaluate(() => window.__api.stats())));
check('sem erro na página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
