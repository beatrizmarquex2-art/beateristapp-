// Área dos alunos: aba Estudos (5 erros, dicionário, quiz, aulinha do Paul), Tocar com os 4 instrumentos, e "figuras rítmicas" dentro do Toca Aqui (fora da lista de jogos).
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: false }); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'false' }));
await ctx.route('**/*.supabase.co/**', (r) => r.fallback());
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
const go = async (h) => { await page.goto(url + '/aluno.html' + h); await sleep(1500); };
await go('#/estudos');
const abas = await page.evaluate(() => [...document.querySelectorAll('nav .nav-item')].map((a) => a.textContent.trim()));
check('barra de baixo: Jogos, Estudos, Tocar, Álbum, Perfil (sem Ranking)', ['Jogos', 'Estudos', 'Tocar', 'Álbum', 'Perfil'].every((x, i) => (abas[i] || '').includes(x)), abas.join('|'));
check('as 5 abas cabem em uma linha', await page.evaluate(() => { const t = [...document.querySelectorAll('nav .nav-item')].map((a) => a.getBoundingClientRect().top); return Math.max(...t) - Math.min(...t) < 3; }));
check('Estudos: acende a aba e mostra os 4 itens', (await page.locator('nav .nav-item.on').textContent()).includes('Estudos') && (await page.locator('#view .al-card').count()) === 4);
const txt = await page.textContent('#view');
check('itens: 5 erros, Dicionário musical, Dicas do método, Aulinha do Paul (sem Jogos Ensinam e sem Quiz)', ['5 erros', 'Dicionário musical', 'Dicas do método', 'Aulinha do Paul'].every((x) => txt.includes(x)) && !txt.includes('Jogos Ensinam'));
check('sem código: só as Dicas do método têm cadeado; Dicionário e Aulinha com selo "grátis"; 5 erros aberto', (await page.locator('#view .al-card.locked').count()) === 1 && (await page.locator('#view .al-am').count()) === 2 && !(await page.locator('#view .al-card', { hasText: '5 erros' }).getAttribute('class')).includes('locked'));
await page.locator('#view .al-card', { hasText: '5 erros' }).click(); await sleep(1200);
check('5 erros abre sem código e a aba Estudos continua acesa', (await page.evaluate(() => location.hash)).includes('erros') && (await page.locator('nav .nav-item.on').textContent()).includes('Estudos'));
await go('#/tocar');
const tocar = await page.textContent('#view');
check('Tocar mostra os 4 instrumentos', ['Bateria', 'Violão', 'Piano', 'Xilofone'].every((x) => tocar.includes(x)));
for (const [rota, nome] of [['#/violao', 'violão'], ['#/xilofone', 'xilofone']]) { await go(rota); check(`${nome} abre sem erro`, (await page.locator('#view').innerText()).length > 20 && (await page.locator('nav .nav-item.on').textContent()).includes('Tocar')); }
// o Toca Aqui agora só abre com código: esta parte roda com um aluno que já tem código
const ctx2 = await context(browser); const pg = await ctx2.newPage(); await pg.setViewportSize({ width: 390, height: 844 }); pg.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await pg.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await ctx2.route('**/*.supabase.co/**', (r) => r.fallback());
const go2 = async (h) => { await pg.goto(url + '/aluno.html' + h); await sleep(1500); };
await go2('#/jogos');
const lista = await pg.textContent('#view');
check('"figuras rítmicas" saiu da lista de jogos', !/figuras rítmicas/i.test(lista));
await go2('#/jogos/toca/livre');
check('Toca Aqui tem 3 opções, a terceira é "figuras rítmicas"', (await pg.locator('.jg-seg button').count()) === 3 && (await pg.locator('.jg-seg button').nth(2).textContent()).includes('figuras rítmicas'));
await pg.locator('.jg-seg button').nth(2).click(); await sleep(500);
check('a opção abre o jogo de fases e a aulinha do Paul', (await pg.locator('.jg-fases a[href="#/kids/figuras"]').count()) === 1 && (await pg.locator('.jg-fases a[href="#/kids/figuras/aula"]').count()) === 1);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
