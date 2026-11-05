// Quebra-cabeça: arrastar a peça (dedo e mouse) além de tocar. Dedo: arrastar pra cima, ou segurar e arrastar; pro lado continua rolando a bandeja.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => localStorage.setItem('beaterista-aluno-nome', 'Teste'));
const cdp = await ctx.newCDPSession(page);
const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
const box = async (sel) => page.locator(sel).first().boundingBox();
const center = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });
const placed = () => page.evaluate(() => document.querySelectorAll('.jg-pz.fixed').length);
const msg = () => page.evaluate(() => (document.querySelector('.jg-msg') || {}).textContent || '');
async function newGame() { await page.goto(url + '/aluno.html#/jogos/quebra/livre'); await sleep(700); await page.click('button:has-text("iniciar")'); await page.waitForSelector('.jg-pz.tp'); await sleep(500); await page.evaluate(() => window.scrollTo(0, 0)); }
async function scrollToBoth() { await page.evaluate(() => { const b = document.querySelector('.jg-pboard').getBoundingClientRect(); window.scrollBy(0, b.top - 130); }); await sleep(250); } // quadro logo abaixo do topo do app, bandeja ainda à vista
async function dragTouch(p, slot, { hold = 0, steps = 12 } = {}) {
  await scrollToBoth(); const a = center(await box(`.jg-pz.tp[data-piece="${p}"]`)); const t = await box(`.jg-pz.slot[data-pos="${slot}"]`);
  await touch('touchStart', a.x, a.y); if (hold) await sleep(hold);
  const tx = t.x + t.width / 2, ty = t.y + t.height / 2 + 0.9 * 84 * 1.25 * (t.height / t.width); // o dedo fica ~0,9 da altura da peça abaixo dela (ela sobe pra não ser coberta)
  if (!hold) for (let i = 1; i <= 4; i++) { await touch('touchMove', a.x, a.y - i * 12); await sleep(16); } // como na vida real: o dedo sobe da bandeja e depois vai até o lugar
  const sx = hold ? a.x : a.x, sy = hold ? a.y : a.y - 48;
  for (let i = 1; i <= steps; i++) { await touch('touchMove', sx + (tx - sx) * i / steps, sy + (ty - sy) * i / steps); await sleep(16); }
  await touch('touchEnd');
  await sleep(300);
}
await newGame(); const n0 = await placed();
// 1. dedo: arrastar pra cima direto no lugar certo
const first = await page.evaluate(() => Number(document.querySelector('.jg-pz.tp').dataset.piece));
await dragTouch(first, first);
check('dedo: arrastar pra cima encaixa a peça no lugar certo', (await placed()) === n0 + 1, `${n0} → ${await placed()}`);
// 2. dedo: segurar um instante e arrastar
const second = await page.evaluate(() => Number(document.querySelector('.jg-pz.tp').dataset.piece));
await dragTouch(second, second, { hold: 400 });
check('dedo: segurar e arrastar encaixa a peça', (await placed()) === n0 + 2, `${await placed()}`);
// 3. lugar errado: volta pra bandeja e avisa
const third = await page.evaluate(() => Number(document.querySelector('.jg-pz.tp').dataset.piece));
const wrong = await page.evaluate((p) => Number([...document.querySelectorAll('.jg-pz.slot')].map((e) => Number(e.dataset.pos)).find((x) => x !== p)), third);
const before = await placed(); await dragTouch(third, wrong);
check('dedo: soltar no lugar errado não encaixa e avisa', (await placed()) === before && /ainda não/.test(await msg()), `placed ${before}→${await placed()}, msg=${JSON.stringify(await msg())}, peça ${third} → lugar ${wrong}`);
// 4. arrastar pro lado rola a bandeja e NÃO move peça
await scrollToBoth(); const tray = await box('.jg-tray'); const sl0 = await page.evaluate(() => document.querySelector('.jg-tray').scrollLeft); const b4 = await placed();
await touch('touchStart', tray.x + tray.width - 40, tray.y + tray.height / 2); for (let i = 1; i <= 10; i++) { await touch('touchMove', tray.x + tray.width - 40 - i * 18, tray.y + tray.height / 2); await sleep(16); } await touch('touchEnd'); await sleep(400);
const sl1 = await page.evaluate(() => document.querySelector('.jg-tray').scrollLeft);
check('dedo: arrastar pro lado rola a bandeja (e não solta peça)', sl1 > sl0 && (await placed()) === b4, `${sl0} → ${sl1}`);
// 5. toque simples (selecionar e tocar no lugar) continua funcionando
const tp = await page.evaluate(() => Number(document.querySelector('.jg-pz.tp').dataset.piece)); const b5 = await placed();
await scrollToBoth(); await page.click(`.jg-pz.tp[data-piece="${tp}"]`); await sleep(150); await page.locator(`.jg-pz.slot[data-pos="${tp}"]`).click(); await sleep(300);
check('toque na peça e no lugar continua funcionando', (await placed()) === b5 + 1);
// 6. mouse: arrastar continua funcionando
const mp = await page.evaluate(() => Number(document.querySelector('.jg-pz.tp').dataset.piece)); const b6 = await placed();
await scrollToBoth(); const ma = center(await box(`.jg-pz.tp[data-piece="${mp}"]`)); const mt = center(await box(`.jg-pz.slot[data-pos="${mp}"]`));
await page.mouse.move(ma.x, ma.y); await page.mouse.down(); await page.mouse.move((ma.x + mt.x) / 2, (ma.y + mt.y) / 2, { steps: 6 }); await page.mouse.move(mt.x, mt.y, { steps: 6 }); await page.mouse.up(); await sleep(300);
check('mouse: arrastar continua funcionando', (await placed()) === b6 + 1);
check('sem peça fantasma sobrando e sem erros', (await page.evaluate(() => document.querySelectorAll('.jg-pz.ghost').length)) === 0 && errs.length === 0, errs.join(' | '));
const fails = done(); await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
