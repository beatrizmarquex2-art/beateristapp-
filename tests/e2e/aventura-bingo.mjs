// Modo Aventura do Bingo: mapa, trava, abrir não conclui, jogar de verdade pela tela, resultado, destrava, recarregar, modo livre independente.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|ERR_INTERNET|ERR_FAILED|Failed to load resource/.test(m.text())) errs.push(m.text()); });
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
const go = (x) => page.evaluate((v) => { location.hash = v; }, x);
const hash = () => page.evaluate(() => location.hash);
const states = () => page.evaluate(() => [...document.querySelectorAll('.mp-node')].map((n) => n.className.match(/st-(\w+)/)[1]));
const guide = () => page.evaluate(() => (document.querySelector('.jg-guide') || {}).textContent || '');
const stat = () => page.evaluate(() => (document.querySelector('.jg-mbar') || {}).textContent || '');

await page.goto(url + '/aluno.html#/jogos/bingo'); await page.waitForSelector('.av-mode');
check('escolha de modo: livre e aventura', (await page.locator('.av-mode').count()) === 2);
await go('#/jogos/bingo/aventura'); await page.waitForSelector('.mp-node'); await sleep(700);
let st = await states();
check('mapa com 10 missões; só a 0 é a atual', st.length === 10 && st[0] === 'current' && st.slice(1).every((x) => x === 'locked'), st.join());
await page.evaluate(() => document.querySelectorAll('.mp-node')[1].click()); await sleep(300);
check('missão 1 trancada não abre', (await hash()) === '#/jogos/bingo/aventura', await hash());
await go('#/jogos/bingo/aventura/1'); await sleep(500);
check('rota direta da missão trancada volta ao mapa', (await hash()) === '#/jogos/bingo/aventura', await hash());

await page.evaluate(() => document.querySelector('.st-current').scrollIntoView({ block: 'center' }));
await page.evaluate(() => document.querySelector('.st-current').click()); await page.waitForSelector('.av-go');
check('briefing mostra objetivo e 3 critérios de estrela', (await page.locator('.av-goal').count()) === 1 && (await page.locator('.av-stars-how li').count()) === 3);
await go('#/jogos/bingo/aventura'); await page.waitForSelector('.mp-node'); await sleep(500);
st = await states(); check('abrir a missão 0 não a conclui', st[0] === 'current' && st[1] === 'locked');

await go('#/jogos/bingo/aventura/0'); await page.waitForSelector('.av-go'); await page.click('.av-go'); await page.waitForSelector('.jg-bcell');
check('missão 0: 16 casas, sem menus do modo livre, sem sorteio automático', (await page.locator('.jg-bcell').count()) === 16 && (await page.locator('.jg-seg').count()) === 0 && (await page.locator('button:has-text("automático")').count()) === 0);
check('tutorial guia o primeiro passo', (await guide()).includes('sortear'), await guide());
check('botões ≥ 44px de altura', await page.evaluate(() => [...document.querySelectorAll('.jg-bcell, .jg-drawer .btn.primary')].every((b) => b.getBoundingClientRect().height >= 44)));
check('sem rolagem horizontal', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
check('nada foi concluído só por abrir/sortear (sem resultado)', (await page.locator('.av-res').count()) === 0);

// erro de verdade: clicar em casa não sorteada é recusado e conta como erro (missão 0 aceita erros, só perde a estrela 2)
await page.click('.jg-drawer .btn.primary'); await sleep(100);
const unsorted = page.locator('.jg-bcell:not([aria-label$="sorteado"]):not([aria-label$="marcado"])').first();
await unsorted.click(); await sleep(100);
check('marcação de item não sorteado é recusada e conta 1 erro', (await stat()).includes('erros: 1') && (await page.locator('.jg-bcell.on').count()) === 0, await stat());
// joga atento: sorteia, marca tudo que saiu e grita bingo quando o guia avisa
let guard = 0;
while (!(await page.locator('.av-res').count()) && guard++ < 40) {
  const cells = page.locator('.jg-bcell[aria-label$="já sorteado"]');
  while (await cells.count()) { await cells.first().click(); await sleep(30); }
  if ((await guide()).includes('completa')) { await page.click('.jg-actions button:has-text("bingo!")'); break; }
  await page.click('.jg-drawer .btn.primary'); await sleep(40);
}
await page.waitForSelector('.av-res', { timeout: 8000 });
check('resultado: concluída com 1 estrela (houve 1 erro)', (await page.locator('.av-res h2').textContent()).includes('concluída') && (await page.locator('.av-rstar.on').count()) === 1);
check('resultado informa sorteios e mínimo', (await page.locator('.av-sum').textContent()).includes('mínimo possível aqui é 7'));
check('missão 1 liberada no resultado', (await page.locator('.av-unlock').count()) === 1);
check('combinação vencedora destacada na cartela', (await page.locator('.jg-bcell.win').count()) >= 4);
check('nada do modo livre foi gravado', await page.evaluate(() => { const j = JSON.parse(localStorage.getItem('beaterista-jogos') || '{}'); return !(j.games && j.games.bingo); }));
await page.click('text=ver o mapa'); await page.waitForSelector('.mp-node'); await sleep(600);
st = await states(); check('mapa: 0 concluída, 1 atual, resto trancado', st[0] === 'done' && st[1] === 'current' && st.slice(2).every((x) => x === 'locked'), st.join());
await page.reload(); await page.waitForSelector('.mp-node'); await sleep(800);
st = await states(); check('recarregar mantém o progresso', st[0] === 'done' && st[1] === 'current', st.join());

// missão 1 (linha só de instrumentos): destaque do grupo e resultado 3 estrelas jogando sem erro
await go('#/jogos/bingo/aventura/1'); await page.waitForSelector('.av-go'); await page.click('.av-go'); await page.waitForSelector('.jg-bcell');
check('missão 1 destaca as casas do grupo e diz o alvo', (await stat()).includes('instrumentos') && (await page.locator('.jg-bcell[style*="box-shadow"]').count()) >= 4, await stat());
guard = 0;
const lineReady = () => page.evaluate(() => { const c = [...document.querySelectorAll('.jg-bcell')]; const L = []; for (let r = 0; r < 4; r++) { L.push([0, 1, 2, 3].map((k) => r * 4 + k)); L.push([0, 1, 2, 3].map((k) => k * 4 + r)); } return L.some((l) => l.every((i) => c[i].classList.contains('on') && c[i].getAttribute('style'))); });
while (!(await page.locator('.av-res').count()) && guard++ < 40) {
  const cells = page.locator('.jg-bcell[aria-label$="já sorteado"]');
  while (await cells.count()) { await cells.first().click(); await sleep(30); }
  if (await lineReady()) { await page.click('.jg-actions button:has-text("bingo!")'); break; }
  await page.click('.jg-drawer .btn.primary'); await sleep(40);
}
await page.waitForSelector('.av-res', { timeout: 8000 });
check('missão 1: jogo atento (linha do grupo) conclui com 3 estrelas em 9 sorteios', (await page.locator('.av-rstar.on').count()) === 3 && (await page.locator('.av-sum').textContent()).includes('9 sorteios'), await page.locator('.av-sum').textContent());

// missão estrita (4): erro encerra a tentativa e não conclui
await go('#/jogos/bingo/aventura'); await sleep(300);
await page.evaluate(async () => { const S = await import('/js/campanha/store.js'); const E = await import('/js/campanha/engine.js'); const { spec } = (await import('/js/campanha/jogos/bingo.js')); let g = S.gameOf(S.playerId(), 'bingo'); for (const id of ['bingo-01', 'bingo-02', 'bingo-03']) g = E.applyResult(g, spec, id, { won: true, draws: 24, marks: Array(16).fill(false) }).g; await S.saveGame(S.playerId(), 'bingo', g); });
check('resultado falso (sem marcas) não concluiu missão', await page.evaluate(async () => { const S = await import('/js/campanha/store.js'); const g = S.gameOf(S.playerId(), 'bingo'); return !g.m['bingo-02'] || g.m['bingo-02'].s === 0; }));
await page.evaluate(async () => { const S = await import('/js/campanha/store.js'); const g = S.gameOf(S.playerId(), 'bingo'); g.m['bingo-03'] = { s: 1, n: 1, l: null }; await S.saveGame(S.playerId(), 'bingo', g); });
await go('#/jogos/bingo/aventura/4'); await page.waitForSelector('.av-go'); await page.click('.av-go'); await page.waitForSelector('.jg-bcell');
await page.click('.jg-drawer .btn.primary'); await sleep(80);
await page.locator('.jg-bcell:not([aria-label$="sorteado"]):not([aria-label$="marcado"])').first().click();
await page.waitForSelector('.av-res', { timeout: 8000 });
check('missão estrita: um erro encerra e mostra "Ainda não deu"', (await page.locator('.av-res h2').textContent()).includes('Ainda não') && (await page.locator('.av-rstar.on').count()) === 0);
check('derrota não libera a missão seguinte', await page.evaluate(async () => { const S = await import('/js/campanha/store.js'); const g = S.gameOf(S.playerId(), 'bingo'); return !g.m['bingo-04'] || g.m['bingo-04'].s === 0; }));

// modo livre: continua com menus, sem estado compartilhado
await go('#/jogos/bingo/livre'); await page.waitForSelector('.bg-root'); await sleep(300);
check('modo livre (Bingo novo): 5 temas, modos de jogo e condições de vitória', (await page.locator('.bg-poster').count()) === 5 && (await page.locator('.bg-seg button').count()) >= 10 && (await page.locator('.bg-bigbtn:has-text("Jogar")').count()) === 1);
await page.click('.bg-bigbtn:has-text("Jogar")'); await page.waitForSelector('.bg-cell');
check('modo livre: 9 casas (3×3), botão AUTO, sem barra de missão', (await page.locator('.bg-cell').count()) === 9 && (await page.locator('button:has-text("AUTO")').count()) === 1 && (await page.locator('.jg-mbar').count()) === 0);
await go('#/jogos/bingo/aventura'); await page.waitForSelector('.mp-node'); await sleep(600);
st = await states(); check('progresso da aventura independe do livre', st[0] === 'done', st.join());
await go('#/jogos'); await sleep(300);
check('sair não deixa timers do jogo', await page.evaluate(() => window.__ac.intervals.size) === 0);
check('sem erros de console', errs.length === 0, errs.join(' | '));
const f = done(); await browser.close(); srv.close(); process.exit(f ? 1 : 0);
