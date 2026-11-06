// Duelo do Beat Hero em dois celulares (duas sessões do navegador) com uma sala falsa na memória (sala_criar/entrar/ler/enviar, com a mesma regra de versão).
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx: ctxA } = await launch({ codigo: true }); const ctxB = await context(browser);
const salas = new Map(); const errs = [];
const json = (r, v) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(v) });
async function rotas(c) {
  await c.route('**/rest/v1/rpc/**', (r) => {
    const fn = r.request().url().split('/rpc/')[1]; const b = r.request().postDataJSON() || {};
    if (fn === 'aluno_codigo_ok') return json(r, true); if (fn === 'midis_publicos_lista') return json(r, []);
    if (fn === 'sala_criar') { const code = 'ABCDE'; salas.set(code, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false }); return json(r, code); }
    const s = salas.get(String(b.p_code || '').toUpperCase());
    if (fn === 'sala_entrar') { if (!s || s.jogo !== b.p_jogo) return json(r, []); s.convidado = true; return json(r, [{ ver: s.ver, estado: s.estado }]); }
    if (fn === 'sala_ler') return json(r, s ? [{ ver: s.ver, convidado: s.convidado, estado: s.ver === b.p_ver ? null : s.estado }] : []);
    if (fn === 'sala_enviar') { if (!s || s.ver !== b.p_ver) return json(r, 0); s.estado = b.p_estado; s.ver += 1; return json(r, s.ver); }
    return json(r, []);
  });
}
async function celular(c) {
  await rotas(c); const p = await c.newPage(); await p.setViewportSize({ width: 390, height: 844 }); p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); localStorage.setItem('beaterista-aluno-codigo', 'ABC123'); } catch { /* ok */ } }); return p;
}
const A = await celular(ctxA); const B = await celular(ctxB);
await A.goto(`${url}/aluno.html#/ritmo`); await sleep(2500);
check('o Beat Hero mostra o botão "Duelo online"', (await A.locator('a[href="#/ritmo/duelo"]').count()) === 1);
await A.goto(`${url}/aluno.html#/ritmo/duelo`); await A.waitForSelector('.dl-cfg', { timeout: 20000 });
check('duelo: escolha de música com as 18 prontas, andamento em % e nível', (await A.locator('.dl-sel option').count()) === 18 && (await A.locator('.dl-cfg .jo-passo').count()) === 1 && (await A.locator('.dl-cfg .jo-chips').count()) >= 2);
await A.locator('.dl-cfg .jo-passo button[aria-label$="próximo"]').click(); await sleep(300);
check('andamento 105% mostra o bpm novo', /105%|126 bpm/.test(await A.locator('.dl-cfg').innerText()));
await A.locator('button:has-text("criar sala")').click(); await A.waitForSelector('.jg-code', { timeout: 10000 });
const code = (await A.locator('.jg-code').textContent()).trim(); check('sala criada com código de 5 letras', /^[A-Z0-9]{5}$/.test(code), code);
await B.goto(`${url}/aluno.html#/ritmo/duelo`); await B.waitForSelector('.jg-code-in', { timeout: 20000 });
await B.locator('.jg-code-in').fill(code); await B.locator('button:has-text("entrar")').click();
await B.waitForSelector('.dl-cab', { timeout: 15000 }); await A.waitForSelector('.dl-cab', { timeout: 15000 });
const cabA = await A.locator('.dl-cab').innerText(); const cabB = await B.locator('.dl-cab').innerText();
check('os dois celulares veem a mesma música e o mesmo andamento (105%)', cabA.includes('105%') && cabB.includes('105%') && cabA.split('\n')[1] === cabB.split('\n')[1], `${cabA.replace(/\n/g, ' | ')} || ${cabB.replace(/\n/g, ' | ')}`);
await A.locator('button:has-text("estou pronto")').click(); await sleep(1500);
check('um pronto só: continua esperando', (await B.locator('.dl-j:has-text("pronto ✓")').count()) >= 1 && (await B.locator('.dl-cont, .dl-game:not([hidden])').count()) === 0);
await B.locator('button:has-text("estou pronto")').click();
await Promise.all([A, B].map((p) => p.waitForFunction(() => document.body.classList.contains('rz-lock') && !!document.querySelector('canvas'), null, { timeout: 25000 })));
check('contagem e música começam nos dois celulares', true);
await sleep(5000);
for (const p of [A, B]) await p.locator('.dl-game button:has-text("Sair")').first().click().catch(() => {});
await Promise.all([A, B].map((p) => p.waitForSelector('.dl-fim', { timeout: 30000 })));
check('placar final nos dois: ambos saíram (0 × 0) = empate', (await A.locator('.dl-fim h2').textContent()).includes('empate') && (await B.locator('.dl-fim h2').textContent()).includes('empate'));
await A.locator('button:has-text("revanche")').click(); await sleep(3500);
check('revanche volta pro "estou pronto" nos dois', (await A.locator('button:has-text("estou pronto")').count()) === 1 && (await B.locator('button:has-text("estou pronto")').count()) === 1);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
