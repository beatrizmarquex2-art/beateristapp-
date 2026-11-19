// A Fuga do Estúdio em mapa: 3 mundos, 12 portas por mundo; abre uma porta (quiz), ganha ★ e libera a próxima.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await page.goto(`${url}/aluno.html#/jogos`); await sleep(2000);
await page.evaluate(async () => { const S = await import('/js/store.js'); const T = ['bumbo', 'caixa', 'chimbal', 'pratos', 'baqueta', 'compasso', 'pulsação', 'andamento', 'ritmo', 'melodia', 'harmonia', 'acorde', 'tempo', 'ensaio', 'palco']; for (let i = 0; i < 30; i++) await S.upsert('tip', `tip-${i}`, { n: i + 1, text: `dica ${i + 1}: treine com calma o ${T[i % T.length]} e o ${T[(i + 3) % T.length]} todos os dias para soltar a mão.` }); });
await page.goto(`${url}/aluno.html#/dicas/fuga`); await sleep(2800);
check('abre o mapa com 12 portas e as abas dos 3 mundos', (await page.locator('.mp-node').count()) === 12 && (await page.locator('.tm-tabs button').count()) === 3);
check('o tema do 1º mundo é o dos lasers', await page.evaluate(() => !!document.querySelector('.mp[data-theme="mundo-laser"]')));
check('só a porta 1 está aberta no começo', await page.evaluate(() => { const n = [...document.querySelectorAll('.mp-node')]; return n.filter((x) => /open|current/.test(x.className)).length === 1 && /st-(current|open)/.test(n[0].className); }));
check('o contador mostra 0/36', /0\s*\/\s*36/.test(await page.textContent('.mp-head')));
await page.screenshot({ path: process.env.SHOTS ? `${process.env.SHOTS}/fuga-mapa.png` : '/tmp/fuga-mapa.png' });
await page.evaluate(() => document.querySelector('.mp-node.st-current, .mp-node.st-open').click()); await sleep(1500);
check('porta 1 = quiz de 5 perguntas, com a porta trancada na tela', /pergunta 1 de 5/i.test(await page.evaluate(() => document.body.innerText)) && (await page.locator('.fg-cena.fg-uma').count()) === 1);
check('o quiz tem "desistir das minhas ⭐⭐⭐"', (await page.locator('.dc-desistir').count()) === 1);
await page.locator('.dc-desistir').click(); await sleep(500);
const bt = await page.evaluate(() => [...document.querySelectorAll('.sheet button')].map((b) => b.textContent.trim()));
check('pergunta "quer uma dica? ou quer mesmo pular?" com 3 botões', /quer uma dica/.test(await page.textContent('.sheet')) && bt.some((t) => /quero uma dica/.test(t)) && bt.some((t) => /pular mesmo/.test(t)) && bt.some((t) => /voltar/.test(t)), bt.join(' | '));
await page.evaluate(() => document.querySelector('.sheet button[data-acao="voltar"]').click()); await sleep(300);
for (let i = 0; i < 5; i++) { await page.evaluate(() => { const o = document.querySelector('.dc-opt:not([disabled])'); if (o) o.click(); }); await sleep(300); await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /próxima|ver o resultado|terminar/.test(x.textContent)); if (b) b.click(); }); await sleep(400); }
await sleep(1500); const txt = await page.evaluate(() => document.body.innerText);
check('terminou o quiz: abriu a porta (com ★) ou pediu pra tentar de novo (menos de 3 certas)', /porta aberta/.test(txt) || /tentar outra vez/.test(txt));
if (/porta aberta/.test(txt)) { check('mostra o botão da próxima porta', /próxima porta/.test(txt)); await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /voltar ao mapa/.test(b.textContent)).click()); await sleep(1500); check('a porta 2 abriu no mapa', await page.evaluate(() => /st-done/.test(document.querySelectorAll('.mp-node')[0].className))); }
check('sem erro na página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
