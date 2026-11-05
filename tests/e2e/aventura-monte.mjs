// Modo Aventura do Monte Seu Ritmo: mapa, trava, abrir não conclui, compor de verdade (toques nas cartas), validação por estrutura (várias respostas valem),
// conferência errada conta, resultado, destrava, recarregar mantém, sair cala o som, criador livre intacto, sem erros de console.
import { serve, launch, sleep, check, done } from './harness.mjs';
import { spec } from '../../js/campanha/jogos/monte-spec.js';
import { solutions, FOOD_OF_CELL, P, B, C, R } from '../../js/campanha/jogos/monte-logic.js';
import { foodOf } from '../../js/kids-logic.js';
const { srv, url } = await serve();
const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|ERR_INTERNET|ERR_FAILED|Failed to load resource/.test(m.text())) errs.push(m.text()); });
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
const go = (x) => page.evaluate((v) => { location.hash = v; }, x);
const hash = () => page.evaluate(() => location.hash);
const states = () => page.evaluate(() => [...document.querySelectorAll('.mp-node')].map((n) => n.className.match(/st-(\w+)/)[1]));
const setting = (k) => page.evaluate(async (key) => { const s = await import('/js/store.js'); const r = s.get(key); return r ? JSON.stringify(r.data) : null; }, k);
const food = (id) => page.evaluate((w) => { const b = [...document.querySelectorAll('.kd-food')].find((x) => x.getAttribute('aria-label').startsWith(w + ',')); if (!b || b.disabled) return false; b.click(); return true; }, foodOf(id).word);
const press = async (sel) => { await page.evaluate((s) => document.querySelector(s).click(), sel); await sleep(120); };
const conferir = () => page.evaluate(() => { const b = [...document.querySelectorAll('.kd-btn')].find((x) => x.textContent === 'conferir'); if (b && !b.disabled) { b.click(); return true; } return false; });
const open = async (i) => { await go(`#/kids/ritmo/aventura/${i}`); await page.waitForSelector('.av-go'); await page.click('.av-go'); await page.waitForSelector('.mr-checks'); };
const unlock = (n, stars = 1) => page.evaluate(async ({ n, stars }) => { const C = await import('/js/campanha/store.js'); const m = {}; for (let i = 0; i < n; i++) m[`monte-${String(i).padStart(2, '0')}`] = { s: stars, n: 1 }; await C.saveGame(C.playerId(), 'monte', { m, medals: [], log: [] }); }, { n, stars });
const cellIds = (cells) => cells.map((c) => FOOD_OF_CELL[c]);

await page.goto(url + '/aluno.html#/kids'); await page.waitForSelector('.kx-g, .kx-cards');
await go('#/kids/ritmo'); await page.waitForSelector('.av-mode');
check('escolha de modo: Livre e Aventura', (await page.locator('.av-mode.livre').count()) === 1 && (await page.locator('.av-mode.aventura').count()) === 1);
// criador livre
await go('#/kids/ritmo/livre'); await page.waitForSelector('.kd-slots');
check('livre: criar/adivinha, 4 tempos, paleta de 13 cartas', (await page.locator('.kd-modes .kd-chip').count()) >= 4 && (await page.locator('.kd-slot').count()) === 4 && (await page.locator('.kd-food').count()) === 13);
for (const id of ['pao', 'bolo', 'chocolate', 'shh']) await food(id);
check('livre: monta 4 tempos, mostra a pauta e o botão tocar; sem checklist de missão', (await page.locator('.kd-score').count()) === 1 && (await page.locator('.kd-btn', { hasText: 'tocar' }).count()) === 1 && (await page.locator('.mr-checks').count()) === 0);
await page.evaluate(() => [...document.querySelectorAll('.kd-modes .kd-chip')].find((b) => /adivinha/.test(b.textContent)).click()); await sleep(200);
check('livre: modo adivinha continua (ritmo secreto)', (await page.locator('.kd-listen').count()) === 1);
const aven0 = await setting('setting-aventura');

await go('#/kids/ritmo/aventura'); await page.waitForSelector('.mp-node'); await sleep(500);
let st = await states(); check('mapa com 11 missões; só a 0 atual', st.length === 11 && st[0] === 'current' && st.slice(1).every((x) => x === 'locked'), st.join());
await page.evaluate(() => document.querySelectorAll('.mp-node')[1].click()); await sleep(300);
check('missão 1 trancada não abre', (await hash()) === '#/kids/ritmo/aventura');
await go('#/kids/ritmo/aventura/1'); await sleep(500); check('rota direta da missão trancada volta ao mapa', (await hash()) === '#/kids/ritmo/aventura');
await page.evaluate(() => document.querySelector('.st-current').click()); await page.waitForSelector('.av-go');
check('briefing: objetivo, requisitos e 3 estrelas', (await page.locator('.av-goal').count()) === 1 && (await page.locator('.av-stars-how li').count()) === 3);
await go('#/kids/ritmo/aventura'); await page.waitForSelector('.mp-node'); await sleep(400);
check('abrir a missão 0 não a conclui nem grava', (await states())[0] === 'current' && (await setting('setting-aventura')) === aven0);

// missão 0: completar o compasso (3 tempos fixos 🔒)
await open(0);
check('missão 0: 3 tempos já prontos (🔒) e 1 vazio; modos criar/adivinha não aparecem', (await page.locator('.kd-slot.full').count()) === 3 && (await page.locator('.kd-slot', { hasText: '🔒' }).count()) === 3 && (await page.locator('.kd-modes .kd-chip', { hasText: 'adivinha' }).count()) === 0);
check('missão 0: paleta só com pão/bolo/shhh (3 grupos) e botões ≥ 44px', (await page.locator('.kd-group').count()) === 3 && (await page.locator('.kd-food').first().boundingBox()).height >= 44);
await press('.kd-slot.full'); check('tempo fixo não sai do lugar', (await page.locator('.kd-slot.full').count()) === 3);
check('conferir fica desligado com tempo vazio', !(await conferir()));
check('checklist: "preencha" pendente', (await page.locator('.mr-checks li.ok').count()) === 0);
await food('shh'); await sleep(150);
check('checklist atualiza ao preencher; extra cumprido', (await page.locator('.mr-checks li.ok').count()) >= 2);
check('conferir liga com o compasso completo', await conferir());
await page.waitForSelector('.av-res', { timeout: 8000 });
check('missão 0 concluída com 3 estrelas (completou + extra shhh + sem erro)', (await page.locator('.av-res .av-rstar.on').count()) === 3 && (await page.locator('.av-unlock').count()) === 1, await page.locator('.av-res').innerText());
await go('#/kids/ritmo/aventura'); await page.waitForSelector('.mp-node'); await sleep(300);
st = await states(); check('missão 1 destravou', st[0] === 'done' && st[1] === 'current', st.join());
await page.reload(); await page.waitForSelector('.mp-node'); await sleep(400); check('recarregar mantém o progresso', (await states()).join() === st.join());

// missão 2: conferência errada (sem pausa) conta; depois acerta com outra resposta -> 2 estrelas
await unlock(2); await open(2);
for (const id of ['pao', 'pao', 'bolo', 'pao']) await food(id);
check('missão 2: conferir sem pausa NÃO conclui (mostra o que falta)', (await conferir()) && (await page.waitForSelector('.kd-fb.no', { timeout: 3000 }).then(() => true)) && /pausa/.test(await page.locator('.kd-fb').textContent()) && (await page.locator('.av-res').count()) === 0, await page.locator('.kd-fb').textContent());
await press('.kd-slot:nth-child(4)'); await food('shh'); await sleep(100);
check('tirar um tempo e trocar por shhh', await conferir());
await page.waitForSelector('.av-res', { timeout: 8000 });
check('2 estrelas (cumpriu + extra duas durações, mas errou uma conferência)', (await page.locator('.av-res .av-rstar.on').count()) === 2, await page.locator('.av-res').innerText());

// sequência pedida com OUTRAS palavras + ouvir antes (extra) ; som cala ao sair
await unlock(6); await open(6);
for (const id of ['bola', 'cao', 'esqueleto', 'shh']) await food(id);
await press('.kd-btn:not([disabled])'); await sleep(900);
check('missão 6: tocando faz som', (await page.evaluate(() => window.__peak(1500))) > 0.003);
await go('#/kids'); await sleep(700);
check('sair no meio da execução cala o som', (await page.evaluate(() => window.__peak(800))) < 0.004);
check('sem timers pendentes', await page.evaluate(() => window.__ac.intervals.size === 0 && window.__ac.timers.size <= 2));
await open(6); for (const id of ['bola', 'cao', 'esqueleto', 'shh']) await food(id);
await press('.kd-btn:not([disabled])'); await sleep(200); await conferir(); await page.waitForSelector('.av-res', { timeout: 8000 });
check('missão 6: palavras diferentes da mesma célula valem; ouviu = 3 estrelas', (await page.locator('.av-res .av-rstar.on').count()) === 3, await page.locator('.av-res').innerText());

// dois compassos e desafio final: compõe pela primeira solução do extra
for (const [i, w] of [[7, 390], [10, 320], [10, 430]]) {
  await unlock(i); await page.setViewportSize({ width: w, height: 800 }); await open(i);
  check(`missão ${i}: 2 compassos (8 tempos) sem rolagem horizontal em ${w}px`, (await page.locator('.kd-slot').count()) === 8 && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  if (w === 320) continue;
  const sol = solutions(spec.missions[i].params.extra)[0];
  for (const id of cellIds(sol)) await food(id);
  await sleep(150); check(`missão ${i}: solução composta (${sol.length} tempos)`, await conferir());
  await page.waitForSelector('.av-res', { timeout: 8000 }); check(`missão ${i}: concluída com 3 estrelas`, (await page.locator('.av-res .av-rstar.on').count()) === 3, await page.locator('.av-res').innerText());
}
check('medalha do desafio final (Compositor)', /Compositor/.test(await page.locator('.av-res').innerText()));
await page.setViewportSize({ width: 390, height: 844 });
// criador livre depois de tudo
await go('#/kids/ritmo/livre'); await page.waitForSelector('.kd-slots'); await food('pao');
check('livre intacto depois da aventura (cartas, 4 tempos, sem checklist)', (await page.locator('.kd-food').count()) === 13 && (await page.locator('.kd-slot.full').count()) === 1 && (await page.locator('.mr-checks').count()) === 0);
check('nenhum texto visível diz "Kids"', !(await page.evaluate(() => /kids/i.test(document.body.innerText))));
check('sem erros de JS/console', errs.length === 0, errs.slice(0, 3).join(' | '));
const fails = done(); await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
