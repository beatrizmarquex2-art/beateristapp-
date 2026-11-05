// Álbum de 125 figurinhas na área dos alunos: pacote de boas-vindas, abrir, colar, fotos carregando, e pacotes por estrela/ritmo.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
const fotos = []; page.on('response', (r) => { if (/\/fotos\/F\d+\.jpeg/.test(r.url())) fotos.push(r.status()); });
await page.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); });
await page.goto(url + '/aluno.html#/ranking'); await page.waitForSelector('.al-card'); await sleep(500);
check('Ranking leva ao álbum de 125', await page.$('a[href="#/figurinhas"]') !== null);
await page.evaluate(() => { location.hash = '#/figurinhas'; }); await page.waitForSelector('.fig-total'); await sleep(500);
check('começa com 0/125', /0\/125/.test(await page.textContent('.fig-total')), await page.textContent('.fig-total'));
check('aba Ranking acesa no álbum', /Ranking/.test(await page.textContent('.bottom-nav a.on')));
await page.click('.fig-tabs button:has-text("pacotes")'); await sleep(300);
check('pacote de boas-vindas e do dia esperando', /2 pacotes/.test(await page.textContent('.fig-pack-card')), await page.textContent('.fig-pack-card'));
await page.click('button:has-text("abrir pacote")'); await sleep(600);
await page.click('.sheet button:has-text("colar tudo")'); await sleep(600);
const tot = await page.textContent('.fig-total');
check('colou figurinhas no álbum', !/^0\/125/.test(tot.trim()), tot);
await page.click('.fig-tabs button:has-text("geral")'); await sleep(1500);
const got = await page.$$eval('.fig-slot.got', (a) => a.length);
check('as coladas aparecem na coleção', got >= 1, String(got));
check('fotos carregam (200) e são só do álbum', fotos.length >= 1 && fotos.every((s) => s === 200), JSON.stringify(fotos));
// pacotes por estrela (Kids) e por ★ do ritmo (idempotente)
const r = await page.evaluate(async () => {
  const A = await import('/js/kids/album.js'); const P = await import('/js/kids/progress.js'); const FR = await import('/js/figurinhas/rewards.js');
  const me = P.active(); const antes = FR.pending();
  const k = await A.grantPacks(me.id, 2); const r1 = await A.grantByStars(me.id, 12); const r2 = await A.grantByStars(me.id, 12);
  return { antes, k, r1, r2, depois: FR.pending() };
});
check('2 estrelas novas = 2 pacotes', r.k === 2, JSON.stringify(r));
check('12 ★ de ritmo = 2 pacotes, e repetir não dá de novo', r.r1 === 2 && r.r2 === 0, JSON.stringify(r));
check('pacotes somam', r.depois === r.antes + 4, JSON.stringify(r));
await page.evaluate(() => { location.hash = '#/kids/album'; }); await sleep(600);
check('rota antiga do álbum leva pro novo', /#\/figurinhas/.test(await page.evaluate(() => location.hash)));
check('sem erros de JS', errs.length === 0, errs.join('|'));
await browser.close(); srv.close && srv.close(); done();
