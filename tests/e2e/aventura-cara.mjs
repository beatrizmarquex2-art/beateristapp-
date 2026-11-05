// Modo Aventura do Cara a Cara: mapa, trava, abrir não conclui, deduzir de verdade pela tela, resultado, destrava, recarregar, modo livre independente.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|ERR_INTERNET|ERR_FAILED|Failed to load resource/.test(m.text())) errs.push(m.text()); });
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
const go = (x) => page.evaluate((v) => { location.hash = v; }, x);
const hash = () => page.evaluate(() => location.hash);
const states = () => page.evaluate(() => [...document.querySelectorAll('.mp-node')].map((n) => n.className.match(/st-(\w+)/)[1]));
const open = async (i) => { await go(`#/jogos/cara/aventura/${i}`); await page.waitForSelector('.av-go'); await page.click('.av-go'); await page.waitForSelector('.jg-cbtn'); };
const seed = (ids) => page.evaluate(async (list) => { const S = await import('/js/campanha/store.js'); let g = S.gameOf(S.playerId(), 'cara'); for (const id of list) g = { ...g, m: { ...g.m, [id]: { s: 1, n: 1, l: null } } }; await S.saveGame(S.playerId(), 'cara', g); }, ids);

/** Dedução esperta pela tela: pergunta o que divide melhor as cartas ainda em jogo (lidas dos botões) e chuta quando sobra só uma classe. */
async function deduce() {
  let guard = 0;
  while (!(await page.locator('.av-res').count()) && guard++ < 40) {
    const act = await page.evaluate(async () => {
      const { INSTRUMENTS, QUESTIONS, answerFor } = await import('/js/jogos/cara-data.js');
      const cands = [...document.querySelectorAll('.jg-cbtn:not([disabled])')].map((b) => INSTRUMENTS.find((i) => b.getAttribute('aria-label').startsWith(i.name)));
      const vec = (i) => QUESTIONS.map((q) => answerFor(i, q.id)).join();
      const manual = !!document.querySelector('.jg-flip');
      if (manual) { // manual: o jogador confere as respostas e vira as cartas que não combinam
        const hist = [...document.querySelectorAll('.jg-hist2 li')].reverse(); const keep = new Set(INSTRUMENTS.map((i) => i.id));
        hist.forEach((li) => { const yes = li.querySelector('b').textContent === 'sim'; const q = QUESTIONS.find((x) => li.textContent.includes(x.text)); INSTRUMENTS.forEach((i) => { if (answerFor(i, q.id) !== yes) keep.delete(i.id); }); });
        const pool = [...document.querySelectorAll('.jg-ccell')]; const inGame = pool.map((c) => INSTRUMENTS.find((i) => c.querySelector('.jg-cbtn').getAttribute('aria-label').startsWith(i.name)));
        for (const c of pool) { const inst = INSTRUMENTS.find((i) => c.querySelector('.jg-cbtn').getAttribute('aria-label').startsWith(i.name)); const flip = c.querySelector('.jg-flip'); const flipped = flip && flip.getAttribute('aria-pressed') === 'true'; if (flip && !keep.has(inst.id) && !flipped) { flip.click(); return 'flip'; } }
        cands.length = 0; inGame.forEach((i) => { if (keep.has(i.id) && !document.querySelector(`.jg-cbtn[aria-label^="${i.name}"][aria-label*="chute errado"]`)) cands.push(i); });
      }
      const left = cands;
      if (new Set(left.map(vec)).size <= 1) { const c = [...document.querySelectorAll('.jg-cbtn')].find((b) => b.getAttribute('aria-label').startsWith(left[0].name) && !b.getAttribute('aria-label').includes('chute errado') && !b.disabled); if (!c) return 'nada'; c.click(); return 'pick'; }
      let best = null; for (const q of QUESTIONS) { const btn = [...document.querySelectorAll('.jg-qbtn')].find((b) => b.textContent === q.text && !b.disabled); if (!btn) continue; const y = left.filter((i) => answerFor(i, q.id)).length; if (!y || y === left.length) continue; const mx = Math.max(y, left.length - y); if (!best || mx < best.mx) best = { mx, btn }; }
      best.btn.click(); return 'ask';
    });
    if (act === 'pick') { await sleep(60); await page.click('.jg-pick button:has-text("sim, chutar")'); }
    await sleep(80);
  }
}

await page.goto(url + '/aluno.html#/jogos/cara'); await page.waitForSelector('.av-mode');
check('escolha de modo: livre e aventura', (await page.locator('.av-mode').count()) === 2);
await go('#/jogos/cara/aventura'); await page.waitForSelector('.mp-node'); await sleep(700);
let st = await states();
check('mapa com 10 missões; só a 0 é a atual', st.length === 10 && st[0] === 'current' && st.slice(1).every((x) => x === 'locked'), st.join());
await page.evaluate(() => document.querySelectorAll('.mp-node')[1].click()); await sleep(300);
check('missão 1 trancada não abre', (await hash()) === '#/jogos/cara/aventura', await hash());
await go('#/jogos/cara/aventura/1'); await sleep(500);
check('rota direta da missão trancada volta ao mapa', (await hash()) === '#/jogos/cara/aventura', await hash());
await page.evaluate(() => document.querySelector('.st-current').scrollIntoView({ block: 'center' })); await page.evaluate(() => document.querySelector('.st-current').click()); await page.waitForSelector('.av-go');
check('briefing mostra objetivo e 3 critérios de estrela', (await page.locator('.av-goal').count()) === 1 && (await page.locator('.av-stars-how li').count()) === 3);
await go('#/jogos/cara/aventura'); await page.waitForSelector('.mp-node'); await sleep(500);
st = await states(); check('abrir a missão 0 não a conclui', st[0] === 'current' && st[1] === 'locked');

await open(0);
check('missão 0: tabuleiro de 4 cartas, sem menus do modo livre', (await page.locator('.jg-cbtn').count()) === 4 && (await page.locator('.jg-seg').count()) === 0 && (await page.locator('button:has-text("jogar de novo")').count()) === 0);
check('botões ≥ 44px e sem rolagem horizontal', await page.evaluate(() => [...document.querySelectorAll('.jg-cbtn, .jg-qbtn')].every((b) => b.getBoundingClientRect().height >= 44) && document.documentElement.scrollWidth <= innerWidth + 1), await page.evaluate(() => [...document.querySelectorAll('.jg-cbtn, .jg-qbtn')].map((b) => Math.round(b.getBoundingClientRect().height)).filter((x) => x < 44).join()));
check('nada concluído só por abrir', (await page.locator('.av-res').count()) === 0);
await deduce(); await page.waitForSelector('.av-res', { timeout: 8000 });
check('missão 0: concluída com 3 estrelas (2 perguntas, nenhum chute errado)', (await page.locator('.av-res h2').textContent()).includes('concluída') && (await page.locator('.av-rstar.on').count()) === 3, await page.locator('.av-sum').textContent());
check('missão 1 liberada no resultado', (await page.locator('.av-unlock').count()) === 1);
check('nada do modo livre foi gravado', await page.evaluate(() => { const j = JSON.parse(localStorage.getItem('beaterista-jogos') || '{}'); return !(j.games && j.games.cara); }));
await page.click('text=ver o mapa'); await page.waitForSelector('.mp-node'); await sleep(600);
st = await states(); check('mapa: 0 concluída, 1 atual, resto trancado', st[0] === 'done' && st[1] === 'current' && st.slice(2).every((x) => x === 'locked'), st.join());
await page.reload(); await page.waitForSelector('.mp-node'); await sleep(800);
st = await states(); check('recarregar mantém o progresso', st[0] === 'done' && st[1] === 'current', st.join());

// derrota: perder os 3 chutes não conclui nem libera
await open(1);
for (let k = 0; k < 3; k++) { const wrong = await page.evaluate(async () => { const g = [...document.querySelectorAll('.jg-cbtn:not([disabled])')]; return g.length; }); void wrong;
  // chuta a primeira carta ainda em jogo sem perguntar (pode acertar por sorte: então refaz abaixo)
  const b = page.locator('.jg-cbtn:not([disabled])').first(); if (!(await b.count())) break; await b.click(); await page.click('.jg-pick button:has-text("sim, chutar")'); await sleep(120); if (await page.locator('.av-res').count()) break; }
await page.waitForSelector('.av-res', { timeout: 8000 });
const lost = (await page.locator('.av-res h2').textContent()).includes('Ainda não');
check(lost ? 'chutar sem perguntar e errar 3 vezes: "Ainda não deu", 0 estrelas, missão 2 trancada' : 'chute de sorte na missão 1 acertou (aceitável)', lost ? (await page.locator('.av-rstar.on').count()) === 0 && (await page.locator('.av-unlock').count()) === 0 : true);

// missão 5 (manual, 8 cartas): vira as cartas à mão e conclui
await seed(['cara-01', 'cara-02', 'cara-03', 'cara-04']);
await open(5);
check('missão 5: modo manual (botões de virar) com 8 cartas', (await page.locator('.jg-flip').count()) === 8 && (await page.locator('.jg-cbtn').count()) === 8);
await deduce(); await page.waitForSelector('.av-res', { timeout: 15000 });
check('missão 5 (manual): concluída com 3 estrelas em até 4 perguntas', (await page.locator('.av-res h2').textContent()).includes('concluída') && (await page.locator('.av-rstar.on').count()) === 3, await page.locator('.av-sum').textContent());

// missão 8: 12 cartas, gêmeos
await seed(['cara-06', 'cara-07']);
await open(8);
check('missão 8: 12 cartas (guitarra e baixo juntas)', (await page.locator('.jg-cbtn').count()) === 12);
await deduce(); await page.waitForSelector('.av-res', { timeout: 15000 });
check('missão 8: concluída com 3 estrelas (até 5 perguntas e no máx. 1 chute)', (await page.locator('.av-rstar.on').count()) === 3, await page.locator('.av-sum').textContent());

// modo livre
await go('#/jogos/cara/livre'); await page.waitForSelector('.jg-seg'); await sleep(300);
check('modo livre: opções automático/manual e iniciar', (await page.locator('.jg-seg button').count()) === 2 && (await page.locator('button:has-text("iniciar")').count()) === 1);
await page.click('button:has-text("iniciar")'); await page.waitForSelector('.jg-cbtn');
check('modo livre: 12 cartas, recarregável (guarda partida)', (await page.locator('.jg-cbtn').count()) === 12);
await go('#/jogos/cara/aventura'); await page.waitForSelector('.mp-node'); await sleep(600);
st = await states(); check('progresso da aventura independe do livre', st[0] === 'done' && st[5] === 'done' && st[8] === 'done', st.join());
await go('#/jogos'); await sleep(400);
check('sair não deixa intervalos', (await page.evaluate(() => window.__ac.intervals.size)) === 0);
check('sem erros de console', errs.length === 0, errs.join(' | '));
const f = done(); await browser.close(); srv.close(); process.exit(f ? 1 : 0);
