// Modo Aventura do Uno Musical: mapa, trava, abrir não conclui, jogar de verdade (derrota e vitória reproduzindo, na tela, jogadas calculadas pelas regras reais),
// resultado, destrava, recarregar, nada do modo livre gravado, modo livre intacto, sem rolagem horizontal.
import { serve, launch, sleep, check, done, ROOT } from './harness.mjs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const imp = (p) => import(pathToFileURL(path.join(ROOT, p)).href);
const C = await imp('js/jogos/cartas-logic.js'); const { spec, meets } = await imp('js/campanha/jogos/cartas.js');
const { srv, url } = await serve();
const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|ERR_INTERNET|ERR_FAILED|Failed to load resource/.test(m.text())) errs.push(m.text()); });
const FREE = { v: 1, sound: true, games: { cartas: { mode: 'paul', hint: 'sem', game: null, rec: { w: 5, l: 2, e: 1 } } } };
await page.addInitScript((f) => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); if (!localStorage.getItem('beaterista-jogos')) localStorage.setItem('beaterista-jogos', JSON.stringify(f)); } catch (e) {} }, FREE);
const go = (x) => page.evaluate((v) => { location.hash = v; }, x);
const hash = () => page.evaluate(() => location.hash);
const states = () => page.evaluate(() => [...document.querySelectorAll('.mp-node')].map((n) => n.className.match(/st-(\w+)/)[1]));
const ls = (k) => page.evaluate((key) => localStorage.getItem(key), k);
const noHScroll = (w) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

/** Calcula, com as regras reais e a semente da missão, uma partida do jogador 0 (política com "erros" sorteados): devolve as ações (cartas por id, UNO) para refazer na tela. */
function plan(m, want) {
  for (let k = 0; k < 4000; k++) {
    const nr = C.seededRnd(k * 104729 + 7); const eps = want === 'loss' ? 1 : 0.2;
    const pol = (g, rnd) => {
      const legal = C.legalCards(g, 0);
      if (legal.length > 1 && nr() < eps) { const c = legal[Math.floor(nr() * legal.length)]; return { type: 'play', id: c.id, color: C.isWild(c) ? C.COLORS[Math.floor(nr() * 4)] : undefined }; }
      return C.aiMove(g, 0, k % 2 ? 'paul' : 'esperto', rnd);
    };
    const r = C.simulate(m.params, pol); if (!r) continue;
    if (want === 'win3' && meets(r, m.params.limits[2])) return { acts: r.acts, r }; if (want === 'win1' && r.won) return { acts: r.acts, r }; if (want === 'loss' && r.lost) return { acts: r.acts, r };
  }
  throw new Error('sem plano');
}
const handOff = () => page.locator('.cx-hc.off').count();
async function myTurn() { // espera a vez da pessoa (ou o fim da partida); o botão UNO não conta como vez
  for (let i = 0; i < 400; i++) { if (await page.locator('.cx-result').count()) return false; if ((await page.locator('.cx-hc').count()) && !(await handOff()) && (await page.locator('.cx-turn.mine').count())) return true; await sleep(100); } throw new Error('vez não chegou'); }
async function playPlan(acts) {
  for (const a of acts) {
    if (a.type === 'uno') { await page.waitForSelector('.cx-uno'); await page.evaluate(() => document.querySelector('.cx-uno').click()); await sleep(80); continue; } // o botão pulsa: clique direto
    if (!(await myTurn())) return;
    if (a.type === 'play') { await page.locator(`.cx-hc[data-id="${a.id}"]`).click(); if (a.color) { await page.locator(`.cx-pc.c-${a.color}`).click(); } }
    else if (a.type === 'draw') await page.click('.cx-deck'); else await page.click('.cx-btns button:has-text("passar")');
    await sleep(80);
  }
}

await page.goto(url + '/aluno.html#/jogos/cartas'); await page.waitForSelector('.av-mode');
check('escolha de modo: livre e aventura', (await page.locator('.av-mode').count()) === 2);
const freeBefore = await ls('beaterista-jogos');
await go('#/jogos/cartas/aventura'); await page.waitForSelector('.mp-node'); await sleep(700);
let st = await states();
check('mapa com 10 missões; só a 0 é a atual', st.length === 10 && st[0] === 'current' && st.slice(1).every((x) => x === 'locked'), st.join());
check('mapa sem rolagem horizontal (390px)', await noHScroll());
await page.evaluate(() => document.querySelectorAll('.mp-node')[1].click()); await sleep(300);
check('missão 1 trancada não abre', (await hash()) === '#/jogos/cartas/aventura', await hash());
await go('#/jogos/cartas/aventura/1'); await sleep(500);
check('rota direta da missão trancada volta ao mapa', (await hash()) === '#/jogos/cartas/aventura', await hash());
await page.evaluate(() => document.querySelector('.st-current').scrollIntoView({ block: 'center' }));
await page.evaluate(() => document.querySelector('.st-current').click()); await page.waitForSelector('.av-go');
check('briefing: objetivo, adversário, 3 critérios de estrela, botões ≥44px', (await page.locator('.av-goal').textContent()).includes('Paul distraído') && (await page.locator('.av-stars-how li').count()) === 3 && (await page.locator('.av-go').evaluate((e) => e.getBoundingClientRect().height)) >= 44);
await go('#/jogos/cartas/aventura'); await page.waitForSelector('.mp-node'); await sleep(500);
check('abrir a missão 0 não a conclui', (await states())[0] === 'current' && (await states())[1] === 'locked');

// ---- missão 0: primeiro uma DERROTA de verdade, depois a vitória ----
const m0 = spec.missions[0];
await go('#/jogos/cartas/aventura/0'); await page.waitForSelector('.av-go'); await page.click('.av-go'); await page.waitForSelector('.cx-hc');
check('missão monta direto na partida (sem menus de modo/dica), 7 cartas, 1 adversário, painel com o estilo', (await page.locator('.jg-seg, .cx-legend').count()) === 0 && (await page.locator('.cx-hc').count()) === 7 && (await page.locator('.cx-seat').count()) === 1 && (await page.locator('.cx-advinfo').textContent()).includes('adversário: Paul distraído'));
check('partida sem rolagem horizontal (390px)', await noHScroll());
await page.setViewportSize({ width: 320, height: 640 }); await sleep(200); check('partida sem rolagem horizontal (320px)', await noHScroll()); await page.setViewportSize({ width: 390, height: 844 });
const pl = plan(m0, 'loss'); await playPlan(pl.acts);
await page.waitForSelector('.av-res', { timeout: 20000 });
check('derrota: “Ainda não deu”, 0 estrelas, missão 1 continua trancada', (await page.locator('.av-res h2').textContent()).includes('Ainda não') && (await page.locator('.av-rstar.on').count()) === 0 && (await page.locator('.av-unlock').count()) === 0);
await page.click('.av-res button:has-text("ver o mapa")'); await page.waitForSelector('.mp-node'); await sleep(600);
st = await states(); check('mapa após derrota: 0 ainda atual, 1 trancada', st[0] === 'current' && st[1] === 'locked', st.join());
check('tentativa contada no progresso, sem estrela', await page.evaluate(async () => { const S = await import('/js/campanha/store.js'); const g = S.gameOf(S.playerId(), 'cartas'); return g.m['cartas-00'] && g.m['cartas-00'].n === 1 && g.m['cartas-00'].s === 0; }));

await go('#/jogos/cartas/aventura/0'); await page.waitForSelector('.av-go'); await page.click('.av-go'); await page.waitForSelector('.cx-hc');
const pw = plan(m0, 'win3'); await playPlan(pw.acts);
await page.waitForSelector('.av-res', { timeout: 20000 });
check('vitória: missão concluída com 3 estrelas (conforme a medição)', (await page.locator('.av-res h2').textContent()).includes('concluída') && (await page.locator('.av-rstar.on').count()) === m0.evaluate(pw.r).stars, `${m0.evaluate(pw.r).stars}★ ${await page.locator('.av-sum').textContent()}`);
check('resultado informa rodadas, compras e especiais iguais às da simulação', (await page.locator('.av-sum').textContent()).includes(`rodadas: ${pw.r.rounds} · compras: ${pw.r.draws} · cartas especiais jogadas: ${pw.r.specials}`), await page.locator('.av-sum').textContent());
check('missão 1 liberada no resultado', (await page.locator('.av-unlock').count()) === 1);
check('nada do modo livre foi gravado (prefs, recorde, partida)', (await ls('beaterista-jogos')) === freeBefore);
await page.click('.av-res button:has-text("ver o mapa")'); await page.waitForSelector('.mp-node'); await sleep(600);
st = await states(); check('mapa: 0 concluída, 1 atual, resto trancado', st[0] === 'done' && st[1] === 'current' && st.slice(2).every((x) => x === 'locked'), st.join());
await page.reload(); await page.waitForSelector('.mp-node'); await sleep(800);
st = await states(); check('recarregar mantém o progresso', st[0] === 'done' && st[1] === 'current', st.join());

// ---- missão 1 e sair no meio: sem timers do Paul depois de sair ----
await go('#/jogos/cartas/aventura/1'); await page.waitForSelector('.av-go'); await page.click('.av-go'); await page.waitForSelector('.cx-hc');
await go('#/jogos/cartas/aventura'); await page.waitForSelector('.mp-node'); await sleep(1500);
check('sair no meio da partida não conclui nada nem gera erro', (await states())[1] === 'current' && errs.length === 0, errs.join('|'));

// ---- Modo Livre intacto e separado ----
await go('#/jogos/cartas/livre'); await page.waitForSelector('.jg-seg'); await sleep(300);
check('modo livre: tela de opções de sempre (modo, adversários, dicas, ajuda) com o recorde salvo', (await page.locator('.jg-seg').count()) === 4 && (await page.locator('.cx-legend .cx-leg').count()) === 10 && (await page.locator('.jg-cartas').textContent()).includes('5 vitórias · 2 derrotas · 1 empate'));
check('modo livre guarda as preferências antigas (sem dica)', await page.evaluate(() => [...document.querySelectorAll('.jg-seg button.on')].some((b) => b.textContent === 'sem dica')));
await page.click('.jg-actions button.primary'); await page.waitForSelector('.cx-hc'); await sleep(300);
check('modo livre joga normal (7 cartas, Paul)', (await page.locator('.cx-hc').count()) === 7 && (await page.locator('.cx-seat').count()) === 1 && (await page.locator('.cx-seat').textContent()).includes('paul') && (await page.locator('.cx-advinfo').count()) === 0);
const free = JSON.parse(await ls('beaterista-jogos')).games.cartas;
check('partida livre foi salva só no livre; progresso da aventura intocado', free.game && free.rec.w === 5 && (await page.evaluate(async () => { const S = await import('/js/campanha/store.js'); const g = S.gameOf(S.playerId(), 'cartas'); return Object.keys(g.m).length === 1 && g.m['cartas-00'].s >= 1; })));
await go('#/jogos/cartas/aventura'); await page.waitForSelector('.mp-node'); await sleep(600);
st = await states(); check('voltar à aventura mantém o mapa', st[0] === 'done' && st[1] === 'current', st.join());
check('sem erros de JS/console', errs.length === 0, errs.slice(0, 3).join(' | '));
const fails = done(); await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
