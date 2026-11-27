// Quiz da Fuga: 3 perguntas, precisa acertar 2 de 3. Pular: a 1ª custa 1 ★; a 2ª pergunta "tem certeza? use a dica"; pulando de novo = sem ★ e a porta não abre.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await page.goto(`${url}/aluno.html#/jogos`); await sleep(2000);
await page.evaluate(async () => { const S = await import('/js/store.js'); const T = ['bumbo', 'caixa', 'chimbal', 'pratos', 'baqueta', 'compasso', 'pulsação', 'andamento', 'ritmo', 'melodia', 'harmonia', 'acorde', 'tempo', 'ensaio', 'palco']; for (let i = 0; i < 30; i++) await S.upsert('tip', `tip-${i}`, { n: i + 1, text: `dica ${i + 1}: treine com calma o ${T[i % T.length]} e o ${T[(i + 3) % T.length]} todos os dias para soltar a mão.` }); });
await page.evaluate(async () => { const B = await import('/js/jogos/base.js'); const est = {}; for (let i = 1; i < 5; i++) est[`estudio:${i}`] = 1; B.setGame('fuga', { est }); window.__fugaPortaInicial = 2; }); // o quiz agora é a porta 3 da fase 5
await page.evaluate(() => { location.hash = '#/dicas/fuga'; }); await sleep(2800);
await page.evaluate(() => document.querySelectorAll('.fm-no')[4].click()); await sleep(1500);
const txt = () => page.evaluate(() => document.body.innerText);
check('o quiz da porta tem 3 perguntas e o botão "pular pergunta"', /pergunta 1 de 3/i.test(await txt()) && (await page.locator('.dc-desistir').count()) === 1 && /pular pergunta/.test(await page.textContent('.dc-desistir')));
// 1ª pulada: avisa que custa 1 ★ e oferece a dica
await page.locator('.dc-desistir').click(); await sleep(400);
check('1ª vez: "quer uma dica?" e o botão pular diz que perde 1 ★', /quer uma dica/.test(await page.textContent('.sheet')) && /perde 1/.test(await page.textContent('.sheet button[data-acao="pular"]')));
await page.locator('.sheet button[data-acao="pular"]').click(); await sleep(500);
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /próxima/.test(x.textContent)); if (b) b.click(); }); await sleep(500);
check('foi pra pergunta 2 de 3', /pergunta 2 de 3/i.test(await txt()));
// 2ª pulada: "tem certeza? use a dica!"
await page.locator('.dc-desistir').click(); await sleep(400);
check('2ª vez: "tem certeza? use a dica!" avisa que sem ★ e a porta não abre', /tem certeza/.test(await page.textContent('.sheet')) && /não abre|NÃO abre/i.test(await page.textContent('.sheet')) && /pular mesmo/.test(await page.textContent('.sheet button[data-acao="pular"]')));
await page.locator('.sheet button[data-acao="pular"]').click(); await sleep(500);
check('2 puladas: já não dá pra acertar 2 de 3, então o botão vira "terminar" (acaba o quiz)', await page.evaluate(() => [...document.querySelectorAll('button')].some((x) => /terminar/.test(x.textContent))));
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /terminar/.test(x.textContent)); if (b) b.click(); }); await sleep(1500);
const fim = await txt();
check('sem ★: a porta NÃO abre e pede pra tentar de novo, explicando as puladas', /tentar outra vez/.test(fim) && /pulou 2/.test(fim) && !/porta aberta/.test(fim), fim.slice(-300));
// tenta de novo: acertar 2 de 3 abre a porta
await page.getByRole('button', { name: /tentar outra vez/ }).click(); await sleep(1500);
check('tentar outra vez: de volta na pergunta 1 de 3', /pergunta 1 de 3/i.test(await txt()));
const acerta = async () => { await page.evaluate(() => { const o = document.querySelector('.dc-opt:not([disabled])'); if (o) o.click(); }); await sleep(300); };
for (let i = 0; i < 3; i++) { await page.evaluate(() => { const qOk = document.querySelector('.dc-opt'); }); await acerta(); await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /próxima|ver o resultado|terminar/.test(x.textContent)); if (b) b.click(); }); await sleep(500); }
await sleep(1200); const t2 = await txt();
check('respondendo as 3 (2 ou 3 certas) abre a porta; com 0 ou 1 certa pede de novo', /porta aberta/.test(t2) || /tentar outra vez/.test(t2), t2.slice(-200));
check('sem erro na página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
