// Uno Musical no mesmo aparelho: quando alguém fica com 1 carta, o botão UNO! aparece pra todos; quem apertar primeiro vale.
// Se o outro aperta antes, quem ficou com 1 carta compra 2. O nome da carta da mesa vem em duas partes (nome + faixa da cor).
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const ctx = await context(browser, { viewport: { width: 390, height: 844 }, isMobile: true });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); });
await p.goto(`${url}/aluno.html#/jogos/cartas/livre`); await sleep(1200);
const jog = p.locator('button:has-text("JOGAR")'); if (await jog.count()) { await jog.first().click(); await sleep(300); }
await p.locator('.jg-seg button[aria-label^="no mesmo"]').click(); await sleep(200);
await p.locator('.jg-actions .btn').last().click(); await sleep(1500);
check('nome da carta em duas partes (nome + cor)', (await p.locator('.cx-name b').count()) === 1);
let pego = null; const t0 = Date.now(); // quem ficou com 1 carta não aperta: a vez passa e o outro aperta primeiro
while (Date.now() - t0 < 150000 && !pego) {
  if (await p.locator('.cx-result').count()) { await p.locator('.cx-result .btn.primary, .cx-result .kd-btn').first().click({ force: true }).catch(() => {}); await sleep(1500); continue; } // partida acabou sem a chance: joga de novo
  const cover = p.locator('.cx-cover .btn'); if (await cover.count()) { await cover.first().click(); await sleep(250); continue; }
  const uno = p.locator('.cx-uno:not([disabled])');
  if (await uno.count()) {
    const minhas = await p.locator('.cx-hc').count();
    if (minhas === 1) { await sleep(300); continue; } // dono com 1 carta: espera o aparelho passar
    if (minhas > 1) { await uno.click({ force: true }); await sleep(500); pego = (await p.locator('.cx-msg').innerText()); break; }
  }
  if (await p.locator('.cx-pick').count()) { await p.locator('.cx-pc').first().click({ force: true }).catch(() => {}); await sleep(200); continue; }
  const fit = p.locator('.cx-hc.fit').first(); const deck = p.locator('.cx-deck:not([disabled])'); const pass = p.locator('.cx-me .btn:not([disabled])');
  if (await fit.count()) { await fit.click({ position: { x: 6, y: 30 }, force: true }).catch(() => {}); await sleep(250); }
  else if (await deck.count()) { await deck.first().click().catch(() => {}); await sleep(250); }
  else if (await pass.count()) { await pass.first().click().catch(() => {}); await sleep(250); } else await sleep(120);
}
check('o outro apertou UNO! primeiro: quem ficou com 1 carta comprou 2', pego != null && /esqueceu o UNO e comprou 2/.test(pego), String(pego));
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
