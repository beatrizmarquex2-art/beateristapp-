// Modo Aventura do Jogo da Memória: mapa, trava, abrir não conclui, jogar de verdade (cliques nas cartas, estratégia de memória perfeita lendo as cartas do DOM),
// resultado, destrava, recarregar mantém, modo livre intacto e sem estado compartilhado (setting-memoria não muda), sem erros de console.
import { serve, launch, sleep, check, done } from './harness.mjs';
import { deckIds, perfectTries } from '../../js/campanha/jogos/memoria-logic.js';
import { spec } from '../../js/campanha/jogos/memoria-spec.js';
import { themeById } from '../../js/kids/memory-themes.js';
const { srv, url } = await serve();
const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|ERR_INTERNET|ERR_FAILED|Failed to load resource/.test(m.text())) errs.push(m.text()); });
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch (e) {} });
const go = (x) => page.evaluate((v) => { location.hash = v; }, x);
const hash = () => page.evaluate(() => location.hash);
const states = () => page.evaluate(() => [...document.querySelectorAll('.mp-node')].map((n) => n.className.match(/st-(\w+)/)[1]));
const setting = (k) => page.evaluate(async (key) => { const s = await import('/js/store.js'); const r = s.get(key); return r ? JSON.stringify(r.data) : null; }, k);

/** Plano de cliques de um jogador de memória perfeita (mesma regra de memoria-logic.js#perfectTries), sobre as cartas lidas do DOM. */
function plan(ids) {
  const seen = new Set(); const done = new Set(); const turns = []; const n = ids.length / 2;
  while (done.size < n) {
    let kp = null; const by = new Map(); for (const p of seen) { if (done.has(ids[p])) continue; if (by.has(ids[p])) { turns.push([by.get(ids[p]), p]); kp = ids[p]; break; } by.set(ids[p], p); }
    if (kp !== null) { done.add(kp); continue; }
    let p1 = 0; while (seen.has(p1)) p1++; let k = -1; for (const p of seen) if (!done.has(ids[p]) && ids[p] === ids[p1]) { k = p; break; } seen.add(p1);
    if (k >= 0) { turns.push([k, p1]); done.add(ids[p1]); continue; }
    let p2 = 0; while (seen.has(p2)) p2++; seen.add(p2); turns.push([p1, p2]); if (ids[p2] === ids[p1]) done.add(ids[p1]);
  }
  return turns;
}
const cards = () => page.evaluate(() => [...document.querySelectorAll('.mem-board .kx-mem')].map((b) => b.querySelector('.kx-mem-front img').getAttribute('src')));
const clickCard = (i) => page.evaluate((k) => document.querySelectorAll('.mem-board .kx-mem')[k].click(), i);
async function playPerfect(expectIds) {
  const srcs = await cards(); const img = (id) => { for (const t of Object.values(themeById)) { const it = t.items.find((x) => x.id === id); if (it) return it.img; } };
  const same = srcs.length === expectIds.length && srcs.every((s, i) => s === img(expectIds[i]));
  const turns = plan(srcs);
  for (const [a, b] of turns) { await clickCard(a); await sleep(60); await clickCard(b); await sleep(1450); }
  return { same, tries: turns.length };
}
const unlockAll = (n = 11, stars = 1) => page.evaluate(async ({ n, stars }) => { const C = await import('/js/campanha/store.js'); const m = {}; for (let i = 0; i < n; i++) m[`memoria-${String(i).padStart(2, '0')}`] = { s: stars, n: 1 }; await C.saveGame(C.playerId(), 'memoria', { m, medals: [], log: [] }); }, { n, stars });

await page.goto(url + '/aluno.html#/kids'); await page.waitForSelector('.kx-g, .kx-cards');
await go('#/kids/memoria'); await page.waitForSelector('.av-mode');
check('escolha de modo: Livre e Aventura', (await page.locator('.av-mode.livre').count()) === 1 && (await page.locator('.av-mode.aventura').count()) === 1);
check('nenhum texto visível diz "Kids"', !(await page.evaluate(() => /kids/i.test(document.body.innerText))));
// modo livre: escolhe 4 pares (grava a preferência) e guarda o estado pra comparar depois
await go('#/kids/memoria/livre'); await page.waitForSelector('.mem-themes'); await sleep(200);
await page.evaluate(() => [...document.querySelectorAll('.kd-modes .kd-chip')].find((b) => /^4 pares/.test(b.textContent)).click()); await sleep(500);
const livre0 = await setting('setting-memoria'); check('modo livre guardou a preferência (4 pares)', !!livre0 && JSON.parse(livre0).pairs === 4, String(livre0));

await go('#/kids/memoria/aventura'); await page.waitForSelector('.mp-node'); await sleep(500);
let st = await states(); check('mapa com 11 missões; só a 0 atual', st.length === 11 && st[0] === 'current' && st.slice(1).every((x) => x === 'locked'), st.join());
await page.evaluate(() => document.querySelectorAll('.mp-node')[1].click()); await sleep(300);
check('missão 1 trancada não abre', (await hash()) === '#/kids/memoria/aventura');
await go('#/kids/memoria/aventura/1'); await sleep(500); check('rota direta da missão trancada volta ao mapa', (await hash()) === '#/kids/memoria/aventura', await hash());
await page.evaluate(() => document.querySelector('.st-current').click()); await page.waitForSelector('.av-go');
check('briefing: objetivo, regras e 3 estrelas', (await page.locator('.av-goal').count()) === 1 && (await page.locator('.av-stars-how li').count()) === 3 && (await page.locator('.av-list li').count()) >= 4);
await go('#/kids/memoria/aventura'); await page.waitForSelector('.mp-node'); await sleep(400);
check('abrir a missão 0 não a conclui', (await states())[0] === 'current' && (await states())[1] === 'locked' && (await setting('setting-aventura')) === null);

// missão 0 de verdade
await go('#/kids/memoria/aventura/0'); await page.waitForSelector('.av-go'); await page.click('.av-go'); await page.waitForSelector('.mem-board .kx-mem');
check('missão: sem menus do modo livre (tema/pares/jogadores) e sem botão "trocar"', (await page.locator('.mem-themes, .kd-modes .kd-chip').count()) === 0);
check('4 pares = 8 cartas; cartas ≥ 44px', (await page.locator('.mem-board .kx-mem').count()) === 8 && (await page.locator('.mem-board .kx-mem').first().boundingBox()).width >= 44);
check('status mostra a meta de tentativas', /meta 6/.test(await page.locator('.kx-memstat').textContent()), await page.locator('.kx-memstat').textContent());
const m0 = spec.missions[0].params; const exp0 = deckIds(m0.theme, m0.pairs, m0.seed);
const r0 = await playPerfect(exp0);
check('baralho da missão = baralho com semente (mesmas cartas na mesma ordem)', r0.same);
check('memória perfeita gasta o previsto', r0.tries === perfectTries(exp0), `${r0.tries}`);
await page.waitForSelector('.av-res', { timeout: 8000 });
check('resultado: missão concluída com 3 estrelas (meta batida)', (await page.locator('.av-res .av-rstar.on').count()) === 3 && /conclu/i.test(await page.locator('.av-res h2').textContent()), await page.locator('.av-res').innerText());
check('resultado avisa a missão 1 liberada', (await page.locator('.av-unlock').count()) === 1);
await go('#/kids/memoria/aventura'); await page.waitForSelector('.mp-node'); await sleep(400);
st = await states(); check('missão 1 destravou; missão 0 com estrelas', st[0] === 'done' && st[1] === 'current', st.join());
await page.reload(); await page.waitForSelector('.mp-node'); await sleep(500);
const st2 = await states(); check('recarregar mantém o progresso', st2.join() === st.join(), st2.join());
check('o modo livre NÃO foi alterado pela aventura (preferências e recordes iguais)', (await setting('setting-memoria')) === livre0, await setting('setting-memoria'));
check('o progresso da aventura fica em outro registro (setting-aventura)', /memoria-00/.test(await setting('setting-aventura')));

// missão 2 (com tempo opcional): mostra o relógio e o aviso "opcional"; sair no meio não deixa timer
await unlockAll(2, 1); await go('#/kids/memoria/aventura/2'); await page.waitForSelector('.av-go'); await page.click('.av-go'); await page.waitForSelector('.mem-board .kx-mem');
await clickCard(0); await sleep(1300);
check('missão com tempo: relógio opcional no status', /⏱ \d+\/60 s \(opcional\)/.test(await page.locator('.kx-memstat').textContent()), await page.locator('.kx-memstat').textContent());
check('partida em andamento (inProgress) não conclui nada', (await setting('setting-aventura')).indexOf('"memoria-02"') < 0);
await go('#/kids'); await sleep(800);
const tm = await page.evaluate(() => ({ t: window.__ac.timers.size, i: window.__ac.intervals.size }));
check('sair da missão limpa timers/intervalos', tm.i === 0 && tm.t <= 2, JSON.stringify(tm));

// desafio final (12 pares, tempo): possível de verdade, 3 estrelas, sem rolagem horizontal
await unlockAll(10, 1);
await go('#/kids/memoria/aventura/10'); await page.waitForSelector('.av-go'); await page.click('.av-go'); await page.waitForSelector('.mem-board .kx-mem');
for (const w of [320, 430]) { await page.setViewportSize({ width: w, height: 800 }); await sleep(250); check(`12 pares sem rolagem horizontal em ${w}px`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)); }
await page.setViewportSize({ width: 390, height: 844 });
const m10 = spec.missions[10].params; const r10 = await playPerfect(deckIds(m10.theme, m10.pairs, m10.seed));
check('12 pares: baralho com semente e memória perfeita dentro da meta', r10.same && r10.tries <= m10.goalTries, `${r10.tries} ≤ ${m10.goalTries}`);
await page.waitForSelector('.av-res', { timeout: 10000 });
check('desafio final concluído com 3 estrelas', (await page.locator('.av-res .av-rstar.on').count()) === 3, await page.locator('.av-res').innerText());
check('medalha do desafio final', /Mestre da memória/.test(await page.locator('.av-res').innerText()));

// modo livre continua: jogar uma rodada normal (sem semente), preferências e recorde só mudam pelo livre
await go('#/kids/memoria/livre'); await page.waitForSelector('.mem-themes'); await sleep(300);
check('modo livre: menus de sempre (tema, jogadores, pares)', (await page.locator('.mem-theme').count()) === 7 && (await page.locator('.kd-modes .kd-chip').count()) >= 5);
await page.evaluate(() => document.querySelector('.kx-go').click()); await page.waitForSelector('.mem-board .kx-mem');
check('modo livre: 4 pares (preferência salva) e botão "trocar"', (await page.locator('.mem-board .kx-mem').count()) === 8 && (await page.locator('.mem-top .kd-chip').count()) === 1);
check('modo livre intacto depois de toda a aventura', (await setting('setting-memoria')) === livre0);
check('sem erros de JS/console', errs.length === 0, errs.slice(0, 3).join(' | '));
const fails = done(); await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
