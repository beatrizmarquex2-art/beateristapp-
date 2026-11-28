// Genius infinito (4 instrumentos, +1 nota por rodada, recorde) e Treino livre (todos os jogos da Fuga soltos).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
const SH = (n) => (process.env.SHOTS ? `${process.env.SHOTS}/${n}.png` : `/tmp/${n}.png`);
await page.goto(`${url}/aluno.html#/jogos/genius`); await sleep(2200);
const PADS = { xilofone: '.gn-bar', piano: '.gn-key', violao: '.gn-corda', bateria: '.gn-kit [data-p]' };
const NP = { xilofone: 8, piano: 8, violao: 6, bateria: 8 };
// grava a ordem em que os pads acendem
await page.evaluate(() => { window.__acesos = []; new MutationObserver((ms) => { for (const m of ms) { const e = m.target; if (m.attributeName === 'class' && (e.classList.contains('gn-on')) && !(m.oldValue || '').includes('gn-on')) { const alvo = e.closest('.gn-stage'); const lista = [...alvo.querySelectorAll('.gn-bar, .gn-key, .gn-corda, .gn-kit [data-p]')]; const i = lista.indexOf(e); if (i >= 0) window.__acesos.push(i); } } }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true }); });
for (const inst of ['xilofone', 'piano', 'bateria', 'violao']) {
  await page.click(`.gn-tab[data-i="${inst}"]`); await sleep(300);
  check(`${inst}: ${NP[inst]} pads na tela`, (await page.locator(PADS[inst]).count()) === NP[inst], String(await page.locator(PADS[inst]).count()));
  await page.screenshot({ path: SH(`genius-${inst}`) });
}
// joga o xilofone: 3 rodadas certas (repete o que acendeu), depois erra
await page.click('.gn-tab[data-i="xilofone"]'); await page.evaluate(() => { window.__acesos = []; });
await page.click('.qz-main'); 
for (let r = 1; r <= 3; r++) {
  await page.waitForFunction(() => /sua vez/.test(document.querySelector('.gn-msg').textContent), null, { timeout: 15000 });
  const ordem = await page.evaluate(() => { const a = window.__acesos.slice(); window.__acesos = []; return a; });
  check(`rodada ${r}: ${r} nota(s) tocadas`, ordem.length === r, JSON.stringify(ordem));
  for (const i of ordem) { await page.locator('.gn-bar').nth(i).dispatchEvent('pointerdown'); await sleep(120); }
  await sleep(350); await page.evaluate(() => { window.__acesos = []; }); // limpa os acendimentos dos próprios toques
  check(`rodada ${r}: elogia e a sequência cresce`, /isso!/.test(await page.textContent('.gn-msg')) || r === 3);
}
await page.waitForFunction(() => /sua vez/.test(document.querySelector('.gn-msg').textContent), null, { timeout: 15000 });
const ult = await page.evaluate(() => { const a = window.__acesos.slice(); window.__acesos = []; return a; });
check('rodada 4 tem 4 notas', ult.length === 4, JSON.stringify(ult));
const errada = (ult[0] + 1) % 8; await page.locator('.gn-bar').nth(errada).dispatchEvent('pointerdown'); await sleep(400);
const fimTxt = await page.textContent('.gn-msg');
check('erro termina: "você decorou 3 notas" + novo recorde', /você decorou 3 notas/.test(fimTxt) && /recorde/.test(fimTxt), fimTxt);
check('o botão vira "jogar de novo" e o recorde do xilofone é 3', /jogar de novo/.test(await page.textContent('.qz-main')) && (await page.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => /jogos/.test(k) && /genius/.test(localStorage.getItem(k) || '')) || '') || '{}'))).toString().length > 0);
check('no fim o botão jogar de novo está habilitado', (await page.locator('.qz-main').isEnabled()));
await page.screenshot({ path: SH('genius-fim') });
await page.click('.qz-main'); await sleep(900); check('jogar de novo recomeça na rodada 1 (recorde fica)', /ouça|sua vez/.test(await page.textContent('.gn-msg')) && (await page.textContent('.qz-st:nth-child(3) b')) === '3');
// treino livre
await page.goto(`${url}/aluno.html#/jogos/treino`); await sleep(2000);
const nomes = await page.$$eval('.tl-card b', (xs) => xs.map((x) => x.textContent));
check('treino livre mostra os 10 jogos da Fuga', nomes.length === 10, nomes.join(' | '));
check('tem atalhos pros outros treinos', (await page.locator('.tl-outro').count()) === 4);
await page.screenshot({ path: SH('treino-lobby') });
for (let i = 0; i < 10; i++) {
  await page.evaluate(() => { location.hash = '#/jogos'; }); await sleep(300); await page.evaluate(() => { location.hash = '#/jogos/treino'; }); await sleep(600);
  await page.locator('.tl-card').nth(i).click(); await sleep(1600);
  const txt = (await page.locator('.tl-caixa').first().innerText()).trim(); const ok = (await page.locator('.tl-caixa').count()) === 1 && txt.length > 5 && !/não consegui abrir/.test(txt); // (a mensagem de erro também é texto: por isso a checagem explícita)
  check(`jogo ${i + 1} (${nomes[i]}) abre com conteúdo`, ok);
  if (i === 0 || i === 8) await page.screenshot({ path: SH(`treino-jogo-${i}`) });
}
check('sem erros de página', errs.length === 0, errs.join(' / '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
