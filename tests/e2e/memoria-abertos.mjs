// Jogo da memória sem código: só Percussão e Profissões da música abertos; The Beatles, Rock e o resto com cadeado. Com código: tudo aberto.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const temas = async (p) => p.evaluate(() => [...document.querySelectorAll('.mem-theme')].map((b) => ({ t: b.textContent.replace('🔒', '').trim(), lk: b.classList.contains('locked') })));
{
  const { browser, ctx } = await launch({ codigo: false }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
  await p.goto(url + '/aluno.html#/jogos/memart'); await sleep(3000);
  const t = await temas(p); const abertos = t.filter((x) => !x.lk).map((x) => x.t);
  check('sem código: só 2 temas abertos', abertos.length === 2, abertos.join(' | '));
  check('os abertos são Percussão e Profissões da música (e vêm primeiro)', abertos.join('|') === 'Percussão|Profissões da música' && !t[0].lk && !t[1].lk && t[2].lk, t.map((x) => `${x.t}${x.lk ? ' 🔒' : ''}`).join(' | '));
  check('The Beatles e Rock pedem código', t.filter((x) => /Beatles|Rock/.test(x.t)).every((x) => x.lk) && t.some((x) => /Beatles/.test(x.t)) && t.some((x) => /Rock/.test(x.t)));
  await p.screenshot({ path: process.env.SHOTS ? process.env.SHOTS + '/memoria-temas.png' : '/tmp/memoria-temas.png' });
  await p.evaluate(() => [...document.querySelectorAll('.mem-theme')].find((b) => /Percussão/.test(b.textContent)).click()); await sleep(500);
  check('dá pra escolher a Percussão', await p.evaluate(() => /Percussão/.test(document.querySelector('.mem-theme.on')?.textContent || '')));
  check('sem erro de página', errs.length === 0, errs.join('|')); await browser.close();
}
{
  const { browser, ctx } = await launch({ codigo: true }); const p = await ctx.newPage();
  await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
  await p.goto(url + '/aluno.html#/jogos/memart'); await sleep(3000);
  const t = await temas(p); check('com código: nenhum tema trancado', t.length >= 8 && t.every((x) => !x.lk), t.map((x) => x.t).join(' | ')); await browser.close();
}
srv.close(); done();
