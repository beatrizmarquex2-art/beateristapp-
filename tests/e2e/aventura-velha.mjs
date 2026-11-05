// Modo Aventura do Jogo da Velha: mapa, trava, abrir não conclui, jogar de verdade pela tela (clássico, desafio e estratégico), resultado, destrava, recarregar, modo livre independente.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|ERR_INTERNET|ERR_FAILED|Failed to load resource/.test(m.text())) errs.push(m.text()); });
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
const go = (x) => page.evaluate((v) => { location.hash = v; }, x);
const hash = () => page.evaluate(() => location.hash);
const states = () => page.evaluate(() => [...document.querySelectorAll('.mp-node')].map((n) => n.className.match(/st-(\w+)/)[1]));
const open = async (i) => { await go(`#/jogos/velha/aventura/${i}`); await page.waitForSelector('.av-go'); await page.click('.av-go'); await page.waitForSelector('.jg-cell'); };

/** Joga uma série inteira "de verdade" pela tela. policy: 'best' = minimax; no desafio responde a pergunta certa pelo texto. */
async function playSeries() {
  let guard = 0;
  while (!(await page.locator('.av-res').count()) && guard++ < 600) {
    const next = page.locator('.jg-result button:has-text("próxima rodada")');
    if (await next.count()) { await next.click(); await sleep(60); continue; }
    if (await page.locator('.jg-opt').count()) { // pergunta aberta: responde certo (banco aprovado)
      const ok = await page.evaluate(async () => { const { QUESTIONS } = await import('/js/jogos/velha-data.js'); const t = document.querySelector('.jg-qt').textContent; const q = QUESTIONS.find((x) => x.text === t); const right = q.options[q.answer]; const b = [...document.querySelectorAll('.jg-opt')].find((x) => x.textContent === right); b.click(); return !!b; });
      if (!ok) throw new Error('pergunta sem resposta'); await sleep(60); continue;
    }
    const mv = await page.evaluate(async () => {
      const V = await import('/js/jogos/velha-logic.js'); const turn = (document.querySelector('.jg-turn') || {}).textContent || '';
      if (!turn.includes('vez de você')) return -1;
      const cells = [...document.querySelectorAll('.jg-cell')]; const board = cells.map((c) => { const l = c.getAttribute('aria-label'); return l.endsWith('vazia') ? null : l.endsWith('baquetas') ? 0 : 1; });
      if (cells.every((c) => c.disabled)) return -1;
      const cell = V.bestMove(board, 0); cells[cell].click(); return cell;
    });
    await sleep(mv < 0 ? 120 : 50);
  }
}

await page.goto(url + '/aluno.html#/jogos/velha'); await page.waitForSelector('.av-mode');
check('escolha de modo: livre e aventura', (await page.locator('.av-mode').count()) === 2);
await go('#/jogos/velha/aventura'); await page.waitForSelector('.mp-node'); await sleep(700);
let st = await states();
check('mapa com 10 missões; só a 0 é a atual', st.length === 10 && st[0] === 'current' && st.slice(1).every((x) => x === 'locked'), st.join());
await page.evaluate(() => document.querySelectorAll('.mp-node')[1].click()); await sleep(300);
check('missão 1 trancada não abre', (await hash()) === '#/jogos/velha/aventura', await hash());
await go('#/jogos/velha/aventura/1'); await sleep(500);
check('rota direta da missão trancada volta ao mapa', (await hash()) === '#/jogos/velha/aventura', await hash());
await page.evaluate(() => document.querySelector('.st-current').scrollIntoView({ block: 'center' })); await page.evaluate(() => document.querySelector('.st-current').click()); await page.waitForSelector('.av-go');
check('briefing mostra objetivo e 3 critérios de estrela', (await page.locator('.av-goal').count()) === 1 && (await page.locator('.av-stars-how li').count()) === 3);
await go('#/jogos/velha/aventura'); await page.waitForSelector('.mp-node'); await sleep(500);
st = await states(); check('abrir a missão 0 não a conclui', st[0] === 'current' && st[1] === 'locked');

await open(0);
check('missão 0: tabuleiro 3x3, sem menus do modo livre, rodada 1 de 3', (await page.locator('.jg-cell').count()) === 9 && (await page.locator('.jg-seg').count()) === 0 && (await page.locator('.jg-turn').textContent()).includes('rodada 1 de 3'), await page.locator('.jg-turn').textContent());
check('células ≥ 44px e sem rolagem horizontal', await page.evaluate(() => [...document.querySelectorAll('.jg-cell')].every((b) => b.getBoundingClientRect().height >= 44) && document.documentElement.scrollWidth <= innerWidth + 1));
check('nada concluído só por abrir', (await page.locator('.av-res').count()) === 0);
await playSeries();
await page.waitForSelector('.av-res', { timeout: 8000 });
const txt0 = await page.locator('.av-res').textContent();
check('missão 0: resultado aparece (3 rodadas jogadas)', /em 3 rodadas/.test(txt0), txt0.slice(0, 120));
let tries = 0; while ((await page.locator('.av-res h2').textContent()).includes('Ainda não') && tries++ < 5) { await page.click('button:has-text("jogar de novo")'); await page.waitForSelector('.jg-cell'); await playSeries(); await page.waitForSelector('.av-res', { timeout: 8000 }); }
check('missão 0 concluída jogando bem (com estrelas)', (await page.locator('.av-res h2').textContent()).includes('concluída') && (await page.locator('.av-rstar.on').count()) >= 1, `${await page.locator('.av-rstar.on').count()} estrela(s), tentativas extras ${tries}`);
check('missão 1 liberada no resultado', (await page.locator('.av-unlock').count()) === 1);
check('nada do modo livre foi gravado', await page.evaluate(() => { const j = JSON.parse(localStorage.getItem('beaterista-jogos') || '{}'); return !(j.games && j.games.velha); }));
await page.click('text=ver o mapa'); await page.waitForSelector('.mp-node'); await sleep(600);
st = await states(); check('mapa: 0 concluída, 1 atual, resto trancado', st[0] === 'done' && st[1] === 'current' && st.slice(2).every((x) => x === 'locked'), st.join());
await page.reload(); await page.waitForSelector('.mp-node'); await sleep(800);
st = await states(); check('recarregar mantém o progresso', st[0] === 'done' && st[1] === 'current', st.join());

// missão 1: desafio infantil — responde perguntas aprovadas pelo texto
await open(1);
await page.locator('.jg-cell').first().click(); await page.waitForSelector('.jg-qt');
check('missão 1: tocar numa casa abre pergunta de 3 alternativas (infantil)', (await page.locator('.jg-opt').count()) === 3);
await page.click('button:has-text("voltar ao tabuleiro")');
await playSeries(); await page.waitForSelector('.av-res', { timeout: 15000 });
const t1 = await page.locator('.av-sum').textContent();
check('missão 1 (desafio infantil): resultado mostra perguntas certas', /perguntas certas/.test(t1), t1);

// missão 6 (clássico × estratégico): libera por progresso salvo e joga o minimax -> todas as rodadas empatam, 3 estrelas
await go('#/jogos/velha/aventura'); await sleep(300);
await page.evaluate(async () => { const S = await import('/js/campanha/store.js'); const E = await import('/js/campanha/engine.js'); const { spec } = await import('/js/campanha/jogos/velha.js'); let g = S.gameOf(S.playerId(), 'velha'); for (const id of ['velha-02', 'velha-03', 'velha-04', 'velha-05']) g = E.applyResult(g, spec, id, { outcomes: 'W'.repeat(spec.missions.find((m) => m.id === id).params.rounds).split('') }).g; await S.saveGame(S.playerId(), 'velha', g); });
await open(6); await playSeries(); await page.waitForSelector('.av-res', { timeout: 15000 });
check('Paul estratégico: jogando bem as 4 rodadas empatam e dá 3 estrelas', (await page.locator('.av-rstar.on').count()) === 3 && /0 vitórias, 4 empates, 0 derrotas/.test(await page.locator('.av-sum').textContent()), await page.locator('.av-sum').textContent());
check('medalha de sequência apareceu (progresso real)', (await page.locator('.av-newm .av-chip').count()) >= 1);

// modo livre: menus, jogo normal, sem estado compartilhado
await go('#/jogos/velha/livre'); await page.waitForSelector('.jg-seg'); await sleep(300);
check('modo livre: opções (quem joga, variante) e iniciar', (await page.locator('.jg-seg').count()) >= 2 && (await page.locator('button:has-text("iniciar")').count()) === 1);
await page.click('button:has-text("iniciar")'); await page.waitForSelector('.jg-cell');
check('modo livre: 9 casas, "rodada 1" sem "de N"', (await page.locator('.jg-cell').count()) === 9 && !/rodada \d+ de \d/.test(await page.locator('.jg-turn').textContent()), await page.locator('.jg-turn').textContent());
await go('#/jogos/velha/aventura'); await page.waitForSelector('.mp-node'); await sleep(600);
st = await states(); check('progresso da aventura independe do livre', st[0] === 'done' && st[6] === 'done', st.join());
await go('#/jogos'); await sleep(400);
check('sair não deixa timers/intervalos do jogo', (await page.evaluate(() => window.__ac.intervals.size)) === 0);
check('sem erros de console', errs.length === 0, errs.join(' | '));
const f = done(); await browser.close(); srv.close(); process.exit(f ? 1 : 0);
