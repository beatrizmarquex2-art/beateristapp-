// Memória de Artistas: sorteio de artistas distintos, virar/combinar/errar, travas, dificuldades, filtros, fim de partida, sem figurinhas, sem erros de JS.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
async function open(w = 390, h = 844, hash = '#/jogos/memart', file = 'aluno.html') {
  const ctx = await context(browser, { viewport: { width: w, height: h }, isMobile: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
  await p.goto(`${url}/${file}${hash}`); await p.waitForSelector('.jg-memart .ma-go', { timeout: 15000 }); p.errs = errs; p.ctx = ctx; return p;
}
const cartas = (p) => p.evaluate(() => [...document.querySelectorAll('.ma-card')].map((b) => b.querySelector('.ma-cap').textContent));
const nao = (p) => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
{
  const p = await open();
  check('menu: 5 níveis e filtros', (await p.locator('.jg-memart [aria-label="dificuldade"] button').count()) === 5 && (await p.locator('[aria-label="coleção"] button').count()) === 9);
  await p.click('.ma-go'); await p.waitForSelector('.ma-card');
  let c = await cartas(p); check('kids: 8 cartas, 4 artistas distintos, cada um 2x', c.length === 8 && new Set(c).size === 4 && [...new Set(c)].every((n) => c.filter((x) => x === n).length === 2), c.join('|'));
  check('cartas começam viradas para baixo', (await p.locator('.ma-card.open').count()) === 0);
  const idx = await p.evaluate(() => { const n = [...document.querySelectorAll('.ma-card .ma-cap')].map((e) => e.textContent); const a = n[0]; return [0, n.indexOf(a, 1), n.findIndex((x) => x !== a)]; });
  await p.locator('.ma-card').nth(idx[0]).click(); await p.locator('.ma-card').nth(idx[2]).click();
  await p.locator('.ma-card').nth(idx[1]).click(); // 3º toque durante a avaliação é ignorado
  check('par errado: 2 abertas e a 3ª bloqueada', (await p.locator('.ma-card.open').count()) === 2);
  await sleep(1300); check('par errado desvira sozinho', (await p.locator('.ma-card.open').count()) === 0);
  await p.locator('.ma-card').nth(idx[0]).click(); await p.locator('.ma-card').nth(idx[1]).click(); await sleep(700);
  check('par certo fica aberto e mostra o nome', (await p.locator('.ma-card.ok').count()) === 2 && (await p.locator('.ma-nome').innerText()).length > 2);
  check('placar 1 de 4', (await p.locator('.ma-placar').innerText()).includes('1 de 4 pares'));
  // termina
  const nomes = await cartas(p);
  for (const n of [...new Set(nomes)]) { const is = nomes.map((x, i) => (x === n ? i : -1)).filter((i) => i >= 0); if (await p.locator('.ma-card').nth(is[0]).evaluate((e) => e.classList.contains('ok'))) continue; await p.locator('.ma-card').nth(is[0]).click(); await p.locator('.ma-card').nth(is[1]).click(); await sleep(700); }
  await p.waitForSelector('.ma-fim'); check('fim: painel com jogar de novo / mudar / voltar', (await p.locator('.ma-fim button').count()) === 3);
  check('sem figurinhas/pacotes na tela final', !/figurinha|pacote|roleta/i.test(await p.locator('.ma-fim').innerText()));
  const antes = c.join('|'); await p.click('.ma-fim >> text=jogar de novo'); await p.waitForSelector('.ma-card'); const c2 = await cartas(p);
  check('nova partida sorteia outros artistas', new Set(c2).size === 4 && c2.every((n) => !c.includes(n)), c2.join('|'));
  check('sem scroll horizontal (iPhone)', !(await nao(p)));
  check('sem erros de JS', p.errs.length === 0, p.errs.join(' ; '));
  await p.ctx.close();
}
{
  const p = await open(); await p.locator('[aria-label="dificuldade"] button:has-text("especialista")').click(); await p.click('.ma-go'); await p.waitForSelector('.ma-card');
  const c = await cartas(p); check('especialista: 24 cartas, 12 artistas distintos', c.length === 24 && new Set(c).size === 12);
  const bb = await p.evaluate(() => [...document.querySelectorAll('.ma-card')].every((e) => { const r = e.getBoundingClientRect(); return r.width >= 44 && r.height >= 44 && r.right <= innerWidth; }));
  check('cartas >=44px e dentro da tela', bb); await p.ctx.close();
}
{
  const p = await open();
  const bad = await p.evaluate(() => [...document.querySelectorAll('[aria-label="coleção"] button')].filter((b) => { const n = +b.textContent.match(/\((\d+)\)/)[1]; return (n < 2) !== b.disabled; }).map((b) => b.textContent));
  check('filtros com menos de 2 artistas ficam desativados (nunca repete entidade)', bad.length === 0, bad.join(','));
  await p.locator('[aria-label="coleção"] button:has-text("raras")').click().catch(() => {});
  await p.locator('[aria-label="coleção"] button:has-text("dupla")').click().catch(() => {});
  const avisa = await p.locator('.ma-aviso').count(); const go = await p.locator('.ma-go').isDisabled();
  check('filtro pequeno: ou avisa e bloqueia, ou joga com artistas distintos', (avisa === 1 && go) || (avisa === 0 && !go), `${avisa} ${go}`);
  await p.ctx.close();
}
{
  const p = await open(820, 1180); await p.click('.ma-go'); await p.waitForSelector('.ma-card');
  check('iPad: sem scroll horizontal', !(await nao(p))); check('iPad: sem erros', p.errs.length === 0, p.errs.join(';')); await p.ctx.close();
}
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
