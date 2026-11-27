// Código por abas: dentro da aba liberada vale tudo dela; nas outras segue como quem entra sem acesso; a Lojinha é sempre livre.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
await ctx.route('**/*.supabase.co/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Marca'); localStorage.setItem('beaterista-aluno-codigo', 'MARCA1'); localStorage.setItem('beaterista-aluno-codigo-ok', String(Date.now())); localStorage.setItem('beaterista-aluno-escopo', JSON.stringify(['#/estudos', '#/dicionario', '#/dicas', '#/erros', '#/kids/figuras'])); } catch {} });
await p.goto(`${url}/aluno.html#/dicionario`); await sleep(1500);
await p.evaluate(async () => { (await import('/js/acesso.js')).definir(true); }); await sleep(700);
check('na aba liberada (Estudos) o dicionário abre todos os termos, sem cadeado', (await p.locator('.dc-term.locked').count()) === 0 && (await p.locator('.dc-term').count()) > 100, String(await p.locator('.dc-term.locked').count()));
await p.goto(`${url}/aluno.html#/estudos/aulas/bateria`); await sleep(1500); await p.evaluate(async () => { (await import('/js/acesso.js')).definir(true); }); await sleep(600);
check('as aulas do Estudos abrem todas as fases (nenhuma trancada)', (await p.locator('.tf-fases .locked, .tf-fases [class*=lock]').count()) === 0);
await p.evaluate(() => { location.hash = '#/jogos/figurix'; }); await sleep(900);
check('fora das abas liberadas (Jogos) segue como quem entra sem acesso: Figurix com fases trancadas e "sem código"', /SEM CÓDIGO/i.test(await p.locator('body').innerText()) && /🔒/.test(await p.locator('body').innerText()));
await p.evaluate(() => { location.hash = '#/lojinha'; }); await sleep(900);
check('a Lojinha é sempre livre', (await p.locator('.ljv').count()) > 0);
check('sem erros de JS', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); done();
