// A Fuga do Estúdio: 3 portas em ordem (quiz, caça-palavras, cruzadinha); sem código, só o aviso.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await page.goto(`${url}/aluno.html#/jogos`); await sleep(2000);
await page.evaluate(async () => { const S = await import('/js/store.js'); const T = ['bumbo', 'caixa', 'chimbal', 'pratos', 'baqueta', 'compasso', 'pulsação', 'andamento', 'ritmo', 'melodia', 'harmonia', 'acorde', 'tempo', 'ensaio', 'palco']; for (let i = 0; i < 30; i++) await S.upsert('tip', `tip-${i}`, { n: i + 1, text: `dica ${i + 1}: treine com calma o ${T[i % T.length]} e o ${T[(i + 3) % T.length]} todos os dias para soltar a mão.` }); });
await page.goto(`${url}/aluno.html#/dicas/fuga`); await sleep(2500);
const t = () => page.evaluate(() => document.body.innerText);
let txt = await t(); check('abre a história e as 3 portas', /abrir as portas/.test(txt) && /sala de controle/.test(txt) && /cabine de gravação/.test(txt) && /sala de ensaio/.test(txt));
await page.screenshot({ path: process.env.SHOTS ? `${process.env.SHOTS}/fuga-intro.png` : '/tmp/fuga-intro.png' });
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /abrir as portas/.test(b.textContent)).click()); await sleep(2200);
txt = await t(); check('porta 1 = quiz (pergunta 1 de 5)', /pergunta 1 de 5/i.test(txt));
await page.screenshot({ path: process.env.SHOTS ? `${process.env.SHOTS}/fuga-quiz.png` : '/tmp/fuga-quiz.png' });
check('o quiz tem a opção "desistir das minhas ⭐⭐⭐"', (await page.locator('.dc-desistir').count()) === 1);
const antesOps = await page.locator('.dc-opt').count();
await page.locator('.dc-desistir').click(); await sleep(500);
const botoesSheet = await page.evaluate(() => [...document.querySelectorAll('.sheet button')].map((b) => b.textContent.trim()));
check('ao desistir pergunta "quer uma dica? ou quer mesmo pular?" com 3 botões', /quer uma dica/.test(await page.textContent('.sheet')) && botoesSheet.some((t) => /quero uma dica/.test(t)) && botoesSheet.some((t) => /pular mesmo/.test(t)) && botoesSheet.some((t) => /voltar/.test(t)), botoesSheet.join(' | '));
await page.evaluate(() => document.querySelector('.sheet button[data-acao="dica"]').click()); await sleep(500);
check('"quero uma dica" tira 2 alternativas erradas e o quiz vale no máximo 2 ★', antesOps === 4 && (await page.locator('.dc-opt').count()) === 2 && /no máximo 2/.test(await page.textContent('.dc-q')));
await page.evaluate(() => document.querySelector('.dc-opt').click()); await sleep(400); await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /próxima/.test(b.textContent)).click()); await sleep(400);
await page.locator('.dc-desistir').click(); await sleep(500);
check('depois de gastar a dica, só sobra "pular mesmo" (e voltar)', (await page.locator('.sheet button[data-acao="dica"]').count()) === 0 && (await page.locator('.sheet button[data-acao="pular"]').count()) === 1);
await page.evaluate(() => document.querySelector('.sheet button[data-acao="pular"]').click()); await sleep(500);
check('pular conta como erro: aparece a resposta certa e o botão de próxima', (await page.locator('.dc-opt.ok').count()) >= 1 && (await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => /próxima/.test(b.textContent)))));
check('estrelas do quiz: 5 certas 3 ★ · 4 certas 2 ★ · 3 certas 1 ★ · com "desistir" no máximo 2 ★', await page.evaluate(async () => { const { estrelasPorta } = await import('/js/jogos/fuga.js'); const q = (found, ajuda = false) => estrelasPorta('quiz', { stats: () => ({ found, ajuda }) }); return [q(5), q(4), q(3), q(5, true), q(3, true), estrelasPorta('cruz', null), estrelasPorta('caca', { stats: () => ({ estrelas: 2 }) })].join() === '3,2,1,2,1,3,2'; }));
// responde tudo certo: cada opção certa é achada pelo texto da tela depois de clicar na 1ª (a certa fica verde); aqui só confere que a porta pede mínimo de acertos
for (let i = 0; i < 5; i++) { const tem = await page.evaluate(() => { const o = document.querySelector('.dc-opt:not([disabled])'); if (o) o.click(); return !!o; }); await sleep(300); await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /próxima|ver o resultado|terminar/.test(x.textContent)); if (b) b.click(); }); await sleep(400); if (!tem && i > 2) break; }
await sleep(1200); txt = await t();
check('termina o quiz: ou abre a próxima porta, ou pede pra tentar de novo (precisa de 3 certas)', /porta aberta|tentar outra vez/.test(txt));
check('sem erro na página', errs.length === 0);
await browser.close(); srv.close(); done();
