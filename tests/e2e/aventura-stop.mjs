// Modo Aventura do STOP musical: mapa, trava, abrir não conclui, jogar de verdade (rodada completa, pendente, derrota), resultado, destrava,
// recarregar, nada do modo livre gravado (nem o banco local), modo livre intacto.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|ERR_INTERNET|ERR_FAILED|Failed to load resource/.test(m.text())) errs.push(m.text()); });
const FREE = { v: 1, sound: true, games: { stop: { mode: 'solo', cats: ['instrumento', 'percussao', 'estilo', 'banda', 'musica', 'marca'], seconds: 30, rounds: 3, hist: [], rec: { best: 77, bestRound: 40, wins: {} } } } };
await page.addInitScript((f) => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); if (!localStorage.getItem('beaterista-jogos')) localStorage.setItem('beaterista-jogos', JSON.stringify(f)); } catch (e) {} }, FREE);
const go = (x) => page.evaluate((v) => { location.hash = v; }, x);
const hash = () => page.evaluate(() => location.hash);
const states = () => page.evaluate(() => [...document.querySelectorAll('.mp-node')].map((n) => n.className.match(/st-(\w+)/)[1]));
const ls = (k) => page.evaluate((key) => localStorage.getItem(key), k);

await page.goto(url + '/aluno.html#/jogos/stop'); await page.waitForSelector('.av-mode');
check('escolha de modo: livre e aventura', (await page.locator('.av-mode').count()) === 2);
const freeBefore = await ls('beaterista-jogos');
await go('#/jogos/stop/aventura'); await page.waitForSelector('.mp-node'); await sleep(700);
let st = await states();
check('mapa com 11 missões; só a 0 é a atual', st.length === 11 && st[0] === 'current' && st.slice(1).every((x) => x === 'locked'), st.join());
await page.evaluate(() => document.querySelectorAll('.mp-node')[1].click()); await sleep(300);
check('missão 1 trancada não abre', (await hash()) === '#/jogos/stop/aventura', await hash());
await go('#/jogos/stop/aventura/1'); await sleep(500);
check('rota direta da missão trancada volta ao mapa', (await hash()) === '#/jogos/stop/aventura', await hash());

await page.evaluate(() => document.querySelector('.st-current').scrollIntoView({ block: 'center' }));
await page.evaluate(() => document.querySelector('.st-current').click()); await page.waitForSelector('.av-go');
check('briefing mostra objetivo, tempo explícito e 3 critérios de estrela', (await page.locator('.av-goal').textContent()).includes('90 s') && (await page.locator('.av-stars-how li').count()) === 3);
check('briefing diz que o tempo não tira pontos e que pendente não conta', /não tira pontos/.test(await page.locator('.av-card').textContent()) && /nem a favor nem contra/.test(await page.locator('.av-card').textContent()));
await go('#/jogos/stop/aventura'); await page.waitForSelector('.mp-node'); await sleep(500);
check('abrir a missão 0 não a conclui', (await states())[0] === 'current' && (await states())[1] === 'locked');

// ---- ajudantes de jogo ----
const params = (n) => page.evaluate(async (i) => { const m = await import('/js/campanha/jogos/stop.js'); return m.spec.missions[i].params; }, n);
const pick = (cat, L) => page.evaluate(async ([c, l]) => { const V = await import('/js/jogos/stop-valid.js'); const T = await import('/js/jogos/stop-bank-teoria.js'); const C = await import('/js/jogos/stop-bank-cultura.js'); const line = { ...T.LINES, ...C.LINES }[c].find((x) => V.initialOf(x.split('|')[0]) === l); return line ? line.split('|')[0] : ''; }, [cat, L]);
/** joga uma rodada: `mode` por categoria: 'ok' (resposta do banco), 'unk' (inventada com a letra), '' (vazia). */
async function round(cats, modes) {
  await page.click('button:has-text("sortear a letra")'); await page.waitForSelector('.st-field input', { timeout: 15000 });
  const L = (await page.locator('.st-letter').textContent()).trim(); const inp = page.locator('.st-field input');
  for (let i = 0; i < cats.length; i++) { const m = modes[i]; if (m === 'ok') await inp.nth(i).fill(await pick(cats[i], L)); else if (m === 'unk') await inp.nth(i).fill(`${L}xqzwkj`); }
  await page.click('.st-stop'); await page.waitForSelector('.st-ans', { timeout: 10000 }); await sleep(300); await page.click('.st-skip').catch(() => {});
  return L;
}
const confirm = async () => { const pend = await page.locator('button:has-text("deixar pendentes")').count(); await page.click(pend ? 'button:has-text("deixar pendentes")' : 'button:has-text("confirmar rodada")'); await page.waitForSelector('.jg-tbl'); return pend; };

// ---- missão 0: 5 acertos = 50 pts = 3 estrelas ----
await go('#/jogos/stop/aventura/0'); await page.waitForSelector('.av-go'); await page.click('.av-go');
await page.waitForSelector('button:has-text("sortear a letra")');
check('missão monta direto na partida (sem menus de categorias/tempo/modo)', (await page.locator('.st-cat, .jg-seg, .st-tools').count()) === 0 && (await page.locator('.jg-cover2').textContent()).includes('meta de 30 pontos'));
const q0 = await params(0);
check('5 categorias e 1:30 na passagem', (await page.locator('.jg-cover2').textContent()).includes('5 categorias · 1:30'));
await round(q0.cats, ['ok', 'ok', 'ok', 'ok', 'ok']);
check('letra sorteada está no grupo da missão e a meta aparece no jogo', q0.letters.includes((await page.locator('.st-ans').first().evaluate(() => document.querySelector('h2').textContent)).split('letra ')[1].trim()));
await confirm(); await page.click('button:has-text("ver resultado final")');
await page.waitForSelector('.av-res', { timeout: 8000 });
check('resultado: concluída com 3 estrelas (50 pts)', (await page.locator('.av-res h2').textContent()).includes('concluída') && (await page.locator('.av-rstar.on').count()) === 3 && (await page.locator('.av-sum').textContent()).includes('50 de 50'));
check('missão 1 liberada no resultado', (await page.locator('.av-unlock').count()) === 1);
check('nada do modo livre foi gravado (prefs, recorde, histórico, partida, banco local)', (await ls('beaterista-jogos')) === freeBefore && (await ls('beaterista-stop-custom')) === null);
await page.click('text=ver o mapa'); await page.waitForSelector('.mp-node'); await sleep(600);
st = await states(); check('mapa: 0 concluída, 1 atual, resto trancado', st[0] === 'done' && st[1] === 'current' && st.slice(2).every((x) => x === 'locked'), st.join());
await page.reload(); await page.waitForSelector('.mp-node'); await sleep(800);
st = await states(); check('recarregar mantém o progresso', st[0] === 'done' && st[1] === 'current', st.join());

// ---- missão 1: rodada 1 cheia (50); rodada 2: 4 certas + 1 desconhecida deixada PENDENTE (não conta) = 90 pts, 3 estrelas ----
await go('#/jogos/stop/aventura/1'); await page.waitForSelector('.av-go'); await page.click('.av-go');
const q1 = await params(1);
await round(q1.cats, ['ok', 'ok', 'ok', 'ok', 'ok']); await confirm(); await page.click('button:has-text("próxima rodada")');
await round(q1.cats, ['ok', 'ok', 'ok', 'ok', 'unk']);
check('resposta desconhecida fica pendente e a rodada só segue com “deixar pendentes”', (await page.locator('.st-ans[data-st="pendente"]').count()) === 1 && (await page.locator('button:has-text("deixar pendentes")').count()) === 1);
check('pendente não vira acerto nem erro na correção (sem +10)', (await confirm()) === 1);
await page.click('button:has-text("ver resultado final")'); await page.waitForSelector('.av-res', { timeout: 8000 });
check('pendente deixada não conta: 90 pts de 100, concluída com 3 estrelas', (await page.locator('.av-sum').textContent()).includes('90 de 100') && (await page.locator('.av-rstar.on').count()) === 3 && /não contaram/.test(await page.locator('.av-sum').textContent()));
check('nada do modo livre foi gravado depois da missão 1', (await ls('beaterista-jogos')) === freeBefore && (await ls('beaterista-stop-custom')) === null);

// ---- missão 2: aprovar a pendente na revisão conta 10, sem gravar no banco local; zerar o resto = derrota, missão 3 continua trancada ----
await go('#/jogos/stop/aventura/2'); await page.waitForSelector('.av-go'); await page.click('.av-go');
const q2 = await params(2);
await round(q2.cats, ['unk', '', '', '', '']);
await page.locator('.st-ans').nth(0).locator('button:has-text("contestar")').click(); await page.waitForSelector('.st-contest');
check('contestar na missão não oferece guardar no banco do aparelho', (await page.locator('.st-contest :text("guardar no banco")').count()) === 0);
await page.click('.st-contest button:has-text("aprovar")'); await sleep(300);
check('aprovada vira válida (+10)', (await page.locator('.st-ans').nth(0).getAttribute('data-st')) === 'valida');
await confirm(); await page.click('button:has-text("próxima rodada")');
await round(q2.cats, ['', '', '', '', '']); await confirm(); await page.click('button:has-text("ver resultado final")'); await page.waitForSelector('.av-res', { timeout: 8000 });
check('10 pts de 100 (meta 50): não concluída, 0 estrelas', (await page.locator('.av-res h2').textContent()).includes('Ainda não') && (await page.locator('.av-rstar.on').count()) === 0 && (await page.locator('.av-sum').textContent()).includes('10 de 100'));
check('banco local e prefs continuam intocados', (await ls('beaterista-stop-custom')) === null && (await ls('beaterista-jogos')) === freeBefore);
await page.click('text=ver o mapa'); await page.waitForSelector('.mp-node'); await sleep(600);
st = await states(); check('missão 2 segue como atual (derrota não conclui) e a 3 trancada', st[1] === 'done' && st[2] === 'current' && st[3] === 'locked', st.join());

// ---- sair no meio não devolve resultado e não deixa timers ----
await go('#/jogos/stop/aventura/2'); await page.waitForSelector('.av-go'); await page.click('.av-go'); await page.waitForSelector('button:has-text("sortear a letra")');
await page.click('button:has-text("sortear a letra")'); await page.waitForSelector('.st-field input', { timeout: 15000 });
check('botões e campos ≥44px, sem rolagem horizontal', await page.evaluate(() => { const b = document.querySelector('.st-stop').getBoundingClientRect(); const i = document.querySelector('.st-field input').getBoundingClientRect(); return b.height >= 44 && i.height >= 40 && document.documentElement.scrollWidth <= innerWidth + 1; }));
await go('#/jogos/stop/aventura'); await page.waitForSelector('.mp-node'); await sleep(500);
st = await states(); check('sair no meio da rodada não conclui nem tenta', st[2] === 'current', st.join());
check('sem timers/intervalos do jogo depois de sair', (await page.evaluate(() => window.__ac.intervals.size)) === 0);

// ---- modo livre intacto ----
await go('#/jogos/stop/livre'); await page.waitForSelector('button:has-text("JOGAR")'); await page.click('button:has-text("JOGAR")'); await page.waitForSelector('.st-cat');
check('modo livre: 12 categorias, opções e prefs antigas', (await page.locator('.st-cat').count()) === 12 && (await page.locator('.st-cat.on').count()) === 6 && (await page.locator('.av-objective, .st-mission').count()) === 0);
await page.click('button:has-text("iniciar")'); await page.waitForSelector('button:has-text("sortear a letra")');
check('modo livre: 6 categorias e 0:30 como salvo', (await page.locator('.jg-cover2').textContent()).includes('6 categorias · 0:30') && !(await page.locator('.jg-cover2').textContent()).includes('meta'));
await go('#/jogos/stop/aventura'); await page.waitForSelector('.mp-node'); await sleep(600);
st = await states(); check('progresso da aventura independe do livre', st[0] === 'done' && st[1] === 'done' && st[2] === 'current', st.join());
check('sem erros de console', errs.length === 0, errs.join(' | '));
const f = done(); await browser.close(); srv.close(); process.exit(f ? 1 : 0);
