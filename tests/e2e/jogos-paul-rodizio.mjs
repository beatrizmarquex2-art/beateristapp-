// A aba Jogos mostra uma carta do Paul diferente a cada volta, e a roleta vem antes das missões com print.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: true }); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/*.supabase.co/**', (r) => r.fallback());
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
const cartas = [];
for (let i = 0; i < 6; i++) {
  await page.goto(`${url}/aluno.html#/jogos`); await page.reload(); await sleep(1800);
  cartas.push(await page.evaluate(() => `${document.querySelector('.pd-text').textContent}|${document.querySelector('.pd-img').getAttribute('src')}`));
}
console.log(cartas.join('\n'));
check('6 voltas, 6 cartas diferentes', new Set(cartas.map((c) => c.split('|')[0])).size === 6, cartas.join(' / '));
check('as imagens também mudam', new Set(cartas.map((c) => c.split('|')[1])).size >= 4);
await page.goto(`${url}/aluno.html#/album`); await sleep(2500); await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /pacotes|você tem cartas/i.test(x.textContent)); if (b) b.click(); }); await sleep(900); await page.screenshot({ path: '/tmp/claude-0/ex2/alb.png', fullPage: true });
const ordem = await page.evaluate(() => { const bt = [...document.querySelectorAll('.fig-pack-card button')].find((b) => /girar|abrir/.test(b.textContent)); const m = document.querySelector('.fig-mais'); return bt && m ? (bt.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING ? 'botao-antes' : 'missoes-antes') : 'faltou'; });
check('o botão de girar vem antes das missões com print', ordem === 'botao-antes', ordem);
check('a lista ilegível sumiu', (await page.locator('.fig-regras').count()) === 0);
check('sem erros', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); done();
