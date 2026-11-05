// Modo Aventura do Quebra-cabeça: mapa, trava, abrir não conclui, jogar de verdade, resultado, destrava, recarregar, modo livre independente.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|ERR_INTERNET|ERR_FAILED|Failed to load resource/.test(m.text())) errs.push(m.text()); });
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
const go = (x) => page.evaluate((v) => { location.hash = v; }, x);
const hash = () => page.evaluate(() => location.hash);
const states = () => page.evaluate(() => [...document.querySelectorAll('.mp-node')].map((n) => n.className.match(/st-(\w+)/)[1]));
const adv = () => page.evaluate(() => { try { return JSON.parse(localStorage.getItem('beaterista-jogos') || 'null'); } catch { return null; } });

await page.goto(url + '/aluno.html#/jogos/quebra'); await page.waitForSelector('.av-mode');
check('escolha de modo: livre e aventura', (await page.locator('.av-mode').count()) === 2);
await go('#/jogos/quebra/aventura'); await page.waitForSelector('.mp-node'); await sleep(700);
let st = await states();
check('mapa com 11 missões; só a 0 é a atual', st.length === 11 && st[0] === 'current' && st.slice(1).every((x) => x === 'locked'), st.join());
await page.evaluate(() => document.querySelectorAll('.mp-node')[1].click()); await sleep(300);
check('missão 1 trancada não abre', (await hash()) === '#/jogos/quebra/aventura', await hash());
await go('#/jogos/quebra/aventura/1'); await sleep(500);
check('rota direta da missão trancada volta ao mapa', (await hash()) === '#/jogos/quebra/aventura', await hash());

await page.evaluate(() => document.querySelector('.st-current').scrollIntoView({ block: 'center' }));
await page.evaluate(() => document.querySelector('.st-current').click()); await page.waitForSelector('.av-go');
check('briefing mostra objetivo e estrelas', (await page.locator('.av-goal').count()) === 1 && (await page.locator('.av-stars-how li').count()) === 3);
await go('#/jogos/quebra/aventura'); await page.waitForSelector('.mp-node'); await sleep(500);
check('abrir a missão 0 não a conclui', (await states())[0] === 'current' && (await states())[1] === 'locked');

await go('#/jogos/quebra/aventura/0'); await page.waitForSelector('.av-go'); await page.click('.av-go');
await page.waitForSelector('.jg-pboard .slot', { timeout: 10000 });
check('missão 0 monta 6 peças (3×2) sem menus do modo livre', (await page.locator('.jg-pboard .jg-pz').count()) === 6 && (await page.locator('.jg-seg, .jg-chk').count()) === 0);
const play = async (wrongFirst) => {
  if (wrongFirst) { const p = await page.evaluate(() => Number(document.querySelector('.tp').dataset.piece)); await page.click(`.tp[data-piece="${p}"]`); await page.click(`.slot[data-pos="${(p + 1) % 6}"]`); await sleep(80); }
  for (let k = 0; k < 6; k++) {
    const p = await page.evaluate(() => { const t = document.querySelector('.tp'); return t ? Number(t.dataset.piece) : null; }); if (p == null) break;
    await page.click(`.tp[data-piece="${p}"]`); await page.click(`.slot[data-pos="${p}"]`); await sleep(60);
  }
};
await play(false);
await page.waitForSelector('.av-res', { timeout: 8000 });
check('resultado: concluída com 3 estrelas (0 erros, sem tempo)', (await page.locator('.av-res h2').textContent()).includes('concluída') && (await page.locator('.av-rstar.on').count()) === 3);
check('resultado informa jogadas e mínimo', (await page.locator('.av-sum').textContent()).includes('mínimo possível é 6'));
check('missão 1 liberada no resultado', (await page.locator('.av-unlock').count()) === 1);
check('nada do modo livre foi gravado', await page.evaluate(() => { const j = JSON.parse(localStorage.getItem('beaterista-jogos') || '{}'); return !(j.games && j.games.quebra && (j.games.quebra.game || j.games.quebra.best)); }));
await page.click('text=ver o mapa'); await page.waitForSelector('.mp-node'); await sleep(600);
st = await states(); check('mapa: 0 concluída, 1 atual, resto trancado', st[0] === 'done' && st[1] === 'current' && st.slice(2).every((x) => x === 'locked'), st.join());
await page.reload(); await page.waitForSelector('.mp-node'); await sleep(800);
st = await states(); check('recarregar mantém o progresso', st[0] === 'done' && st[1] === 'current', st.join());

// missão 1 (6 peças, com bônus de tempo declarado): errar uma vez ainda conclui com 2 estrelas
await go('#/jogos/quebra/aventura/1'); await page.waitForSelector('.av-go');
check('briefing declara o tempo como opcional', (await page.locator('.av-card').textContent()).includes('opcional'));
await page.click('.av-go'); await page.waitForSelector('.jg-pboard .slot'); await play(true);
await page.waitForSelector('.av-res', { timeout: 8000 });
check('1 erro na missão 1 (máx. 2 pra ★2, 0 pra ★3): 2 estrelas e concluída', (await page.locator('.av-rstar.on').count()) === 2 && (await page.locator('.av-res h2').textContent()).includes('concluída'));

// modo livre: continua com menus, sem estado compartilhado
await go('#/jogos/quebra/livre'); await page.waitForSelector('.jg-seg'); await sleep(300);
check('modo livre: opções de tamanho e iniciar', (await page.locator('.jg-seg button').count()) >= 3 && (await page.locator('button:has-text("iniciar")').count()) === 1);
await page.click('button:has-text("iniciar")'); await page.waitForSelector('.jg-pboard .slot');
check('modo livre monta 6 peças e não tem objetivo da aventura', (await page.locator('.jg-pboard .jg-pz').count()) === 6 && (await page.locator('.av-objective').count()) === 0);
await go('#/jogos/quebra/aventura'); await page.waitForSelector('.mp-node'); await sleep(600);
st = await states(); check('progresso da aventura independe do livre', st[0] === 'done' && st[1] === 'done', st.join());
await go('#/jogos'); await sleep(300);
check('sair não deixa timers do jogo', await page.evaluate(() => window.__ac.intervals.size) === 0);
check('sem erros de console', errs.length === 0, errs.join(' | '));
const f = done(); await browser.close(); srv.close(); process.exit(f ? 1 : 0);
