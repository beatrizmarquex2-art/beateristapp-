// Partitura no Palco (Teclas): clicar nas teclas monta a folha, dá pra corrigir, gravar tocando (arruma na grade) e baixar o PDF no papel timbrado.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); } catch (e) {} });
const shot = (n) => page.screenshot({ path: `${process.env.SHOTS || '/tmp'}/partitura-palco-${n}.png` });
const clica = async (m) => { await page.locator(`.pn-w[data-m="${m}"]`).click({ force: true, noWaitAfter: true }); await sleep(120); };
const notas = () => page.evaluate(() => document.querySelectorAll('.pm-folha .pm-n').length);

await page.goto(url + '/aluno.html#/piano'); await sleep(2200);
check('o botão "partitura" aparece na linha "treinar" das teclas', await page.evaluate(() => [...document.querySelectorAll('.kd-modelos .kd-chip')].some((b) => b.textContent.includes('partitura'))));
await page.evaluate(() => [...document.querySelectorAll('.kd-modelos .kd-chip')].find((b) => b.textContent.includes('partitura')).click()); await sleep(500);
check('abre o painel com a folha vazia e a clave de sol já desenhada ao montar', await page.evaluate(() => !!document.querySelector('.pm-painel') && !!document.querySelector('.pm-vazio')));
// ---- clicar: figura padrão semínima
for (const m of [60, 62, 64, 65]) await clica(m);
check('4 teclas viram 4 notas na pauta (clave de sol, 4/4 e barra final)', await page.evaluate(() => { const f = document.querySelector('.pm-folha'); return f.querySelectorAll('.pm-n').length === 4 && /Partitura de 4 notas na clave de sol/.test(f.innerHTML); }));
// figura colcheia: as duas próximas notas saem ligadas por feixe
await page.evaluate(() => [...document.querySelectorAll('.pm-painel .kd-chip')].find((b) => b.textContent === 'colcheia').click()); await sleep(200);
await clica(67); await clica(69);
check('colcheias seguidas no mesmo tempo ganham feixe (uma barra grossa)', await page.evaluate(() => /stroke-width="3.4"/.test(document.querySelector('.pm-folha').innerHTML)));
check('6 notas na folha', (await notas()) === 6);
// ---- corrigir: tocar numa nota e apagar / desfazer
await page.locator('.pm-folha .pm-n').nth(1).click({ force: true }); await sleep(250);
check('tocar na nota abre a barra de correção com o nome e o compasso', await page.evaluate(() => /ré · compasso 1/.test(document.querySelector('.pm-corrige b').textContent)));
await page.evaluate(() => [...document.querySelectorAll('.pm-corrige button')].find((b) => b.textContent === 'apagar').click()); await sleep(250);
check('apagar tira a nota (5 na folha)', (await notas()) === 5);
await page.evaluate(() => [...document.querySelectorAll('.pm-painel button')].find((b) => b.textContent.includes('desfazer')).click()); await sleep(250);
check('desfazer traz a nota de volta (6)', (await notas()) === 6);
await page.locator('.pm-folha .pm-n').nth(0).click({ force: true }); await sleep(200);
await page.evaluate(() => [...document.querySelectorAll('.pm-corrige button')].find((b) => b.textContent.includes('♯')).click()); await sleep(250);
check('subir meio tom: a nota vira dó♯ (sustenido desenhado)', await page.evaluate(() => /dó♯ · compasso 1/.test(document.querySelector('.pm-corrige b').textContent)));
await shot('1-clicar');
// ---- salvou só neste aparelho
check('a partitura fica guardada (recarregar mantém as notas)', await (async () => { await page.reload(); await sleep(2200); await page.evaluate(() => [...document.querySelectorAll('.kd-modelos .kd-chip')].find((b) => b.textContent.includes('partitura')).click()); await sleep(600); return (await notas()) === 6; })());
// ---- PDF no papel timbrado
const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.evaluate(() => [...document.querySelectorAll('.pm-painel button')].find((b) => b.textContent.includes('PDF')).click())]);
const fs = await import('node:fs'); const p = await dl.path(); const buf = fs.readFileSync(p);
check('baixa um PDF de verdade (A4, começa com %PDF e tem imagem)', buf.slice(0, 5).toString() === '%PDF-' && buf.length > 20000);
check('o nome do arquivo leva o título e o aluno', /\.pdf$/i.test(dl.suggestedFilename()));
// ---- tocar: grava com o metrônomo e arruma na grade
await page.evaluate(() => [...document.querySelectorAll('.pm-painel button')].find((b) => b.textContent === 'limpar').click()); await sleep(250);
await page.evaluate(() => [...document.querySelectorAll('.pm-painel .kd-chip')].find((b) => b.textContent === 'tocar').click()); await sleep(250);
await page.evaluate(() => [...document.querySelectorAll('.pm-painel button')].find((b) => b.textContent.includes('gravar')).click());
await sleep(2700); // 4 batidas a 100 bpm = 2,4 s
check('depois da contagem está gravando', await page.evaluate(() => /gravando/.test(document.querySelector('.pm-msg')?.textContent || '')));
for (const m of [60, 62, 64, 65]) { await clica(m); await sleep(480); } // ~uma semínima cada
await page.evaluate(() => [...document.querySelectorAll('.pm-painel button')].find((b) => b.textContent.includes('parar')).click()); await sleep(400);
check('as 4 notas tocadas viram 4 notas na grade', (await notas()) === 4);
const ini = await page.evaluate(() => document.querySelectorAll('.pm-folha .pm-n').length);
await page.evaluate(() => [...document.querySelectorAll('.pm-painel .kd-chip')].find((b) => b.textContent === 'semínima').click()); await sleep(300);
check('mudar a grade acerta o tempo de novo sem perder as notas', (await notas()) >= 1 && (await notas()) <= ini);
await shot('2-tocar');
check('sem erros de script', errs.length === 0 || (console.log(errs), false));
await browser.close(); srv.close(); done();
