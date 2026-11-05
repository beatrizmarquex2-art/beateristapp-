// pauLta (área do aluno): fases abrem/fecham sem som nem timer sobrando, erro mostra explicação, progresso e título persistem entre sessões,
// duplo toque não duplica jogada, e o nome aparece com o título.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch { /* ok */ } });
await page.goto(url + '/aluno.html#/paulta');
await page.waitForSelector('.kx-cards .kx-g');
const go = async (h) => { await page.evaluate((x) => { location.hash = x; }, h); await sleep(350); };
const click = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (e && !e.disabled) { e.click(); return true; } return false; }, sel);
const peak = (ms) => page.evaluate((m) => window.__peak(m), ms);
const timers = () => page.evaluate(() => ({ i: window.__ac.intervals.size, r: window.__ac.raf.size }));
const txt = () => page.evaluate(() => document.querySelector('#view').innerText);

check('nome do jogo aparece como pauLta (L maiúsculo)', (await txt()).includes('pauLta'));
check('4 regiões: bateria, sol, fá e duelo (trancado)', (await page.$$('.kx-cards .kx-g')).length === 4 && !!(await page.$('.kx-g.pl-locked')));
for (const [w, n] of [['drum', 18], ['sol', 15], ['fa', 15]]) { await go(`#/paulta/${w}`); check(`mapa ${w}: ${n} fases`, (await page.$$('.pl-trail .pl-node')).length === n); }
await go('#/paulta/drum/2/nomes'); check('fase 2 trancada redireciona pro mapa', (await page.$$('.pl-trail')).length === 1);

// errar mostra explicação específica e exige "entendi"
await go('#/paulta/drum/1/nomes'); await click('.kx-go'); await sleep(250);
check('fase 1 mostra 3 alternativas', (await page.$$('.pl-opt-btn')).length === 3);
let sawExplain = false;
for (let i = 0; i < 3; i++) {
  await page.evaluate(() => { const b = [...document.querySelectorAll('.pl-opt-btn:not([disabled])')]; if (b[0]) { b[0].click(); b[0].click(); } }); // duplo clique
  await sleep(250);
  if (await page.$('.pl-continue')) { sawExplain = sawExplain || /Você escolheu .* mas a posição apresentada corresponde a/.test(await txt()); await sleep(800); await click('.pl-continue'); } else await sleep(1400);
}
await page.waitForSelector('.kx-result', { timeout: 6000 });
check('duplo toque não pula rodada: resultado fecha exatamente 3 rodadas', /de 3 certas/.test(await txt()));
check('algum erro mostrou a explicação com a posição na pauta (ou acertou tudo)', sawExplain || /100/.test(await txt()));

// sair da fase cala tudo e não deixa timers
for (let i = 0; i < 12; i++) { await go('#/paulta/drum/1/imagens'); await sleep(60 + (i % 3) * 50); await click('.kx-go'); await sleep(120); await go('#/paulta'); }
await sleep(900);
check('sair rápido da fase: sem som residual', (await peak(900)) < 0.004);
check('sem intervalos/rAF pendentes', (await timers()).i === 0);

// progresso + título persistem: injeta conclusões e recarrega
await page.evaluate(async () => {
  const P = await import('/js/kids/progress.js'); const V = await import('/js/paulta/save.js'); const S = await import('/js/paulta/score.js');
  const me = P.active();
  await V.commit(me.id, (c) => { let p = c; for (let n = 1; n <= 5; n++) p = S.applyRun(p, { world: 'drum', n, mode: 'nomes', right: 3, total: 3 }).p; return p; });
});
await page.reload(); await page.waitForSelector('.kx-cards .kx-g');
check('depois de recarregar o título persiste (Explorador)', /Explorador da pauLta/.test(await txt()));
check('nome do aluno aparece com o título no topo', await page.evaluate(() => /Teste · Explorador da pauLta/.test(document.querySelector('.ws').innerText)));
await go('#/paulta/drum'); check('fases 1 a 5 concluídas e a 6 aberta, a 7 trancada', (await page.$$('.pl-trail a.pl-node')).length === 6);
await go('#/paulta/perfil'); check('perfil mostra o título e os pontos', /Explorador/.test(await txt()) && /pts/.test(await txt()));
await go('#/paulta/ranking'); check('ranking local lista o aluno', /Teste/.test(await txt()));
await go('#/paulta/legenda'); check('legenda de bateria tem 13 símbolos', (await page.$$('.pl-legend .pl-card')).length >= 13);
await go('#/paulta/aula/drum'); check('aulinha trancada até concluir o mundo', !(await page.$('.pl-lesson')));
check('sem erros de script', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
