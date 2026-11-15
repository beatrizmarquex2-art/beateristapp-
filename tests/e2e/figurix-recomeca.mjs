// Figurix: errou uma vez (já não dá 3 estrelas nesta rodada) = aparece "recomeçar pra ganhar 3 ★", que recomeça a mesma fase do zero.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch();
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch (e) { /* ok */ } });
await page.goto(url + '/aluno.html#/jogos/figurix'); await page.waitForSelector('.mp-node', { timeout: 15000 }); await sleep(500);
await page.evaluate(() => document.querySelector('.mp-node[data-pos="0"]').click()); await sleep(500);
await page.evaluate(() => document.querySelector('.fx-aula-jogar').click()); await page.waitForSelector('.fx-op');
check('sem erro ainda: não mostra o botão de recomeçar', await page.evaluate(() => !document.querySelector('.fx-recomeca')));
await page.evaluate(() => { const certa = window.__figurix.certa; [...document.querySelectorAll('.fx-op')].find((b) => b.getAttribute('aria-label') !== certa).click(); }); await sleep(400);
check('errou uma: aparece "recomeçar pra ganhar 3 ★"', await page.evaluate(() => window.__figurix.erros === 1 && /recomeçar pra ganhar 3 ★/.test((document.querySelector('.fx-recomeca') || {}).textContent || '')));
await page.screenshot({ path: `${process.env.SHOTS || '/tmp'}/figurix-recomeca.png` });
await page.evaluate(() => document.querySelector('.fx-recomeca').click()); await sleep(500);
check('o botão recomeça a fase do zero (sem erros, 1ª pergunta, sem passar pela aulinha)', await page.evaluate(() => window.__figurix.erros === 0 && !document.querySelector('.fx-recomeca') && !!document.querySelector('.fx-op') && !document.querySelector('.fx-colinha') && document.querySelector('.dn-dots i').classList.contains('now')));
// a resposta certa muda de lugar a cada pergunta, a pergunta não se repete e o tempo vai encurtando
const vistos = []; const lugares = []; const tempos = [];
for (let k = 0; k < 4; k++) {
  await page.waitForSelector('.fx-op:not(.feito)'); await sleep(150);
  const r = await page.evaluate(() => ({ lugar: window.__figurix.lugar, seg: window.__figurix.seg, chave: [...document.querySelectorAll('.fx-op')].map((b) => b.getAttribute('aria-label')).sort().join(',') + '|' + window.__figurix.certa, barra: !!document.querySelector('.fx-tempo i') }));
  lugares.push(r.lugar); tempos.push(r.seg); vistos.push(r.chave); if (!r.barra) check('tem barra de tempo', false);
  await page.evaluate(() => document.querySelector('.fx-op[data-certo="1"]').click()); await sleep(950);
}
check('a resposta certa nunca fica no mesmo lugar duas vezes seguidas', lugares.every((l, k) => k === 0 || l !== lugares[k - 1]), lugares.join());
check('nenhuma pergunta repetida na fase', new Set(vistos).size === vistos.length, vistos.join(' / '));
check('o tempo de resposta vai encurtando', tempos.every((t, k) => k === 0 || t < tempos[k - 1]) && tempos[0] === 10, tempos.join());
await page.waitForSelector('.fx-op:not(.feito)'); const antes = await page.evaluate(() => window.__figurix.erros);
await sleep((await page.evaluate(() => window.__figurix.seg)) * 1000 + 400);
check('acabou o tempo: conta como erro, mostra a certa e segue', await page.evaluate((a) => window.__figurix.erros === a + 1, antes));
check('sem erro de página', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
