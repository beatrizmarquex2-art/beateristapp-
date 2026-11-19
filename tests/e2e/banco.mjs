// Banco de conteúdo verificado: carrega no navegador (arquivos do assets/jogos/banco) e a Fuga funciona só com ele (sem as dicas do método).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await page.goto(`${url}/aluno.html#/jogos`); await sleep(2000);
const r = await page.evaluate(async () => { const B = await import('/js/banco.js'); const l = await B.carregaBanco(); return { total: l.length, assuntos: [...new Set(l.map((x) => x.a))].sort(), dicas: B.comoDicas().length, pares: B.paresDoBanco('ritmo').length }; });
check('o banco carrega no navegador: 4 assuntos e centenas de itens', r.total >= 300 && r.assuntos.join() === 'cordas,dicionario,ritmo,teoria', JSON.stringify(r));
check('viram dicas pros jogos (quiz, caça, cruzadinha) e pares pra memória', r.dicas >= 60 && r.pares >= 10, JSON.stringify(r));
// sem nenhuma dica do método, a Fuga ainda abre e a porta 1 (quiz) tem pergunta com 4 opções vinda do banco
await page.goto(`${url}/aluno.html#/dicas/fuga`); await page.waitForSelector('.fm-no', { timeout: 20000 }); await sleep(800);
await page.evaluate(() => document.querySelector('.fm-no.st-open').click()); await sleep(2500);
const q = await page.evaluate(() => ({ opcoes: document.querySelectorAll('.dc-opt').length, txt: document.body.innerText.slice(0, 600) }));
check('a Fuga abre só com o banco e mostra a pergunta com 4 opções', q.opcoes === 4 || /pergunta 1/i.test(q.txt), JSON.stringify(q).slice(0, 300));
check('sem erro na página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
