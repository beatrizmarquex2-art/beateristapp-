// Detetive Note: ouve e MONTA o ritmo com cartas (comida, parque, corpo, animal ou figuras). Errar mostra quais tempos estão errados.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch (e) {} });
await page.goto(url + '/aluno.html#/jogos/detetive'); await page.waitForSelector('.jg-detetive', { timeout: 15000 });
const modos = await page.locator('.dn-modo').allTextContents();
check('modos: comida, parque, corpo, animal e figuras', modos.length === 5 && /comida/.test(modos[0]) && /parque/.test(modos[1]) && /corpo/.test(modos[2]) && /animal/.test(modos[3]) && /figuras/.test(modos[4]), modos.join('|'));
const CELL = { '1000': 0, '1010': 1, '1111': 2, '0000': 3 };
const monta = async (certo = true) => {
  const sec = await page.evaluate(() => window.__detetive.secreto); const ordem = certo ? sec : sec.map((c, i) => (i === 1 ? (c === '1000' ? '1010' : '1000') : c));
  for (const c of ordem) await page.locator('.dn-card').nth(CELL[c]).click();
  return sec;
};
for (const [i, nome] of ['parque', 'animal'].entries()) {
  await page.getByRole('radio', { name: nome }).click(); await page.getByRole('button', { name: 'jogar', exact: true }).click(); await page.waitForSelector('.dn-card');
  check(`${nome}: 4 cartas com desenho e 4 casas vazias`, (await page.locator('.dn-card').count()) === 4 && (await page.locator('.dn-slot').count()) === 4 && (await page.locator('.dn-card i').count()) === 4);
  if (i === 0) {
    await monta(false); await page.getByRole('button', { name: 'conferir' }).click(); await sleep(200);
    check('errou: mostra o tempo errado em vermelho e deixa tentar de novo', (await page.locator('.dn-slot.no').count()) >= 1 && /quase/.test(await page.textContent('.jg-msg')));
    await page.getByRole('button', { name: 'limpar' }).click(); await monta(true); await page.getByRole('button', { name: 'conferir' }).click(); await sleep(200);
    check('acertou: os 4 tempos ficam verdes', (await page.locator('.dn-slot.ok').count()) === 4);
    await sleep(1500);
    for (let r = 1; r < 6; r++) { await monta(true); await page.getByRole('button', { name: 'conferir' }).click(); await sleep(1500); }
    check('depois de 6 rodadas mostra o resultado (1 de 6 de primeira) e dá pra mudar o modo', /de 6 de primeira/.test(await page.textContent('.jg-detetive')) && (await page.getByRole('button', { name: 'mudar o modo' }).count()) === 1);
    await page.getByRole('button', { name: 'mudar o modo' }).click();
  }
}
await page.goto(url + '/aluno.html#/jogos'); await sleep(500); await page.goto(url + '/aluno.html#/jogos/detetive'); await page.waitForSelector('.dn-modo');
await page.getByRole('radio', { name: /normal/ }).click(); await page.getByRole('button', { name: 'jogar', exact: true }).click(); await page.waitForSelector('.dn-card');
check('normal: as cartas são figuras na pauta', (await page.locator('.dn-card svg').count()) === 4);
await monta(true); await page.getByRole('button', { name: 'conferir' }).click(); await sleep(200);
check('normal: monta e confere', (await page.locator('.dn-slot.ok').count()) === 4);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
