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
check('abre o mapa Escape Room · Estúdio do Paul com 12 discos e a porta SAÍDA (B)', (await page.locator('.fm-no').count()) === 12 && (await page.locator('.fm-saida').count()) === 1 && /Estúdio do Paul/.test(await page.textContent('.fm-head')));
check('abas dos 3 mundos', (await page.locator('.tm-tabs:not(.fg-trilhas) button').count()) === 3);
check('só o disco 1 está aberto; a SAÍDA começa trancada', await page.evaluate(() => { const n = [...document.querySelectorAll('.fm-no')]; return n.filter((x) => x.classList.contains('st-open')).length === 1 && n[0].classList.contains('st-open') && n.slice(1).every((x) => x.classList.contains('st-locked')) && document.querySelector('.fm-saida').classList.contains('st-locked'); }));
check('rótulos: 1 e 2 → 2 portas · 3 a 5 → 3 · 6 e 7 → desafio · 8 a 10 → 3 · 11 e 12 → 4 portas', await page.evaluate(() => [...document.querySelectorAll('.fm-no .fm-lab')].map((x) => x.textContent.replace(/\D+/g, '') || 'D').join(',') === '2,2,3,3,3,D,D,3,3,3,4,4'));
check('o contador mostra 0/12 e 0/36', /0\/12/.test(await page.textContent('.fm-head')) && /0\/36/.test(await page.textContent('.fm-head')));
await page.screenshot({ path: process.env.SHOTS ? `${process.env.SHOTS}/fuga-mapa.png` : '/tmp/fuga-mapa.png' });
await page.evaluate(() => document.querySelector('.fm-no.st-open').click()); await sleep(1500);
check('fase 1 tem 2 portas e começa num jogo de tocar (mesa de som), NÃO no quiz', /0 de 2 portas abertas/.test(await page.getAttribute('.fg-cena', 'aria-label')) && /porta 1 de 2 · mesa de som/.test(await page.evaluate(() => document.body.innerText)) && !/pergunta 1 de/i.test(await page.evaluate(() => document.body.innerText)));
// o 1º quiz vem na fase 5, por último (porta 3 de 3): o gancho de teste começa direto nela
await page.evaluate(async () => { const B = await import('/js/jogos/base.js'); const est = {}; for (let i = 1; i < 5; i++) est[`estudio:${i}`] = 1; B.setGame('fuga', { est }); });
await page.goto(`${url}/aluno.html#/jogos`); await sleep(500); await page.evaluate(() => { window.__fugaPortaInicial = 2; location.hash = '#/dicas/fuga'; }); await sleep(2500);
await page.evaluate(() => document.querySelectorAll('.fm-no')[4].click()); await sleep(1500);
check('fase 5 tem 3 portas e a porta 3 é o quiz de 3 perguntas', /pergunta 1 de 3/i.test(await page.evaluate(() => document.body.innerText)) && /\d de 3 portas abertas/.test(await page.getAttribute('.fg-cena', 'aria-label')) && /porta 3 de 3/.test(await page.evaluate(() => document.body.innerText)));
check('o quiz tem o botão "pular pergunta"', (await page.locator('.dc-desistir').count()) === 1);
await page.locator('.dc-desistir').click(); await sleep(500);
const bt = await page.evaluate(() => [...document.querySelectorAll('.sheet button')].map((b) => b.textContent.trim()));
check('pergunta "quer uma dica? ou quer mesmo pular?" com 3 botões', /quer uma dica/.test(await page.textContent('.sheet')) && bt.some((t) => /quero uma dica/.test(t)) && bt.some((t) => /pular/.test(t)) && bt.some((t) => /voltar/.test(t)), bt.join(' | '));
await page.evaluate(() => document.querySelector('.sheet button[data-acao="voltar"]').click()); await sleep(300);
for (let i = 0; i < 3; i++) { await page.evaluate(() => { const o = document.querySelector('.dc-opt:not([disabled])'); if (o) o.click(); }); await sleep(300); await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /próxima|ver o resultado|terminar/.test(x.textContent)); if (b) b.click(); }); await sleep(400); }
await sleep(1500); const txt = await page.evaluate(() => document.body.innerText);
check('terminou o quiz: abriu a porta (com ★) ou pediu pra tentar de novo (menos de 3 certas)', /porta aberta/.test(txt) || /tentar outra vez/.test(txt));
if (/porta aberta/.test(txt)) check('abriu a última porta da fase 5: a fase fecha (sem "próxima porta")', !/próxima porta/.test(txt));
await page.evaluate(() => { window.__fugaPortaInicial = 0; });
// mais portas nas fases seguintes (progresso simulado): fase 3 = 3 portas, fase 11 = 4 portas
for (const [fase, portas] of [[3, 3], [11, 4]]) {
  await page.evaluate(async (f) => { const B = await import('/js/jogos/base.js'); const est = {}; for (let i = 1; i < f; i++) est[`estudio:${i}`] = 1; B.setGame('fuga', { est }); }, fase);
  await page.goto(`${url}/aluno.html#/jogos`); await sleep(500); await page.evaluate(() => { location.hash = '#/dicas/fuga'; }); await sleep(2500);
  await page.evaluate((f) => document.querySelectorAll('.fm-no')[f - 1].click(), fase); await sleep(1500);
  check(`fase ${fase} tem ${portas} portas`, new RegExp(`0 de ${portas} portas abertas`).test(await page.getAttribute('.fg-cena', 'aria-label')) && new RegExp(`porta 1 de ${portas}`).test(await page.evaluate(() => document.body.innerText)));
}
// fase 6 = desafio de 1 porta com relógio; fase 7 = caça contra o relógio; SAÍDA abre depois da fase 12
await page.evaluate(async () => { const B = await import('/js/jogos/base.js'); const est = {}; for (let i = 1; i < 6; i++) est[`estudio:${i}`] = 1; B.setGame('fuga', { est }); });
await page.goto(`${url}/aluno.html#/jogos`); await sleep(500); await page.evaluate(() => { location.hash = '#/dicas/fuga'; }); await sleep(2500);
await page.evaluate(() => document.querySelectorAll('.fm-no')[5].click()); await sleep(1500);
check('fase 6 = desafio: 1 porta, relógio na tela, quiz sem "desistir"', /0 de 1 portas abertas/.test(await page.getAttribute('.fg-cena', 'aria-label')) && /⏱ [012]:\d\d/.test(await page.textContent('.fg-rel')) && (await page.locator('.dc-desistir').count()) === 0 && /sem errar/.test(await page.evaluate(() => document.body.innerText)));
await page.evaluate(async () => { const B = await import('/js/jogos/base.js'); const est = {}; for (let i = 1; i <= 12; i++) est[`estudio:${i}`] = 1; B.setGame('fuga', { est }); });
await page.goto(`${url}/aluno.html#/jogos`); await sleep(500); await page.evaluate(() => { location.hash = '#/dicas/fuga'; }); await sleep(2500);
check('depois da fase 12 a SAÍDA (porta B) fica liberada', await page.evaluate(() => document.querySelector('.fm-saida').classList.contains('st-open')));
await page.evaluate(() => document.querySelector('.fm-saida').click()); await sleep(1500);
check('porta B = quiz de 7 perguntas, no máximo 1 erro', /pergunta 1 de 7/i.test(await page.evaluate(() => document.body.innerText)) && /no máximo 1 erro/.test(await page.evaluate(() => document.body.innerText)));
check('sem erro na página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
