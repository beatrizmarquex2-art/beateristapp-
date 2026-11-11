// Duelo do quebra-cabeça em 2 celulares (sala falsa na memória): mesma imagem e MESMA ordem das peças nos dois; quem monta primeiro vence.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx: ctxA } = await launch({ codigo: true }); const ctxB = await context(browser);
const salas = new Map(); const errs = [];
const json = (r, v) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(v) });
async function rotas(c) {
  await c.route('**/rest/v1/rpc/**', (r) => {
    const fn = r.request().url().split('/rpc/')[1]; const b = r.request().postDataJSON() || {};
    if (fn === 'aluno_codigo_ok') return json(r, true); if (fn === 'midis_publicos_lista') return json(r, []);
    if (fn === 'sala_criar') { const code = 'QBR42'; salas.set(code, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false }); return json(r, code); }
    const s = salas.get(String(b.p_code || '').toUpperCase());
    if (fn === 'sala_entrar') { if (!s || s.jogo !== b.p_jogo) return json(r, []); s.convidado = true; return json(r, [{ ver: s.ver, estado: s.estado }]); }
    if (fn === 'sala_ler') return json(r, s ? [{ ver: s.ver, convidado: s.convidado, estado: s.ver === b.p_ver ? null : s.estado }] : []);
    if (fn === 'sala_enviar') { if (!s || s.ver !== b.p_ver) return json(r, 0); s.estado = b.p_estado; s.ver += 1; return json(r, s.ver); }
    return json(r, []);
  });
}
async function celular(c) {
  await rotas(c); const p = await c.newPage(); await p.setViewportSize({ width: 390, height: 900 }); p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); localStorage.setItem('beaterista-aluno-codigo', 'ABC123'); } catch { /* ok */ } });
  await p.goto(`${url}/aluno.html#/jogos/quebra`); await p.waitForSelector('button:has-text("duelo")', { timeout: 20000 }); return p;
}
const A = await celular(ctxA); const B = await celular(ctxB);
check('o quebra-cabeça tem o botão "duelo · 2 celulares"', (await A.locator('button:has-text("duelo · 2 celulares")').count()) === 1);
await A.locator('button:has-text("duelo · 2 celulares")').click(); await A.waitForSelector('button:has-text("criar sala")', { timeout: 10000 });
await A.locator('button:has-text("criar sala")').click(); await A.waitForSelector('.jg-code', { timeout: 10000 });
const code = (await A.locator('.jg-code').textContent()).trim(); check('sala criada com código de 5 letras', /^[A-Z0-9]{5}$/.test(code), code);
await B.locator('button:has-text("duelo · 2 celulares")').click(); await B.waitForSelector('.jg-code-in', { timeout: 10000 }); await B.locator('.jg-code-in').fill(code); await B.locator('button:has-text("entrar")').click();
await Promise.all([A, B].map((p) => p.waitForSelector('.dl-cab', { timeout: 15000 })));
await A.locator('button:has-text("estou pronto")').click(); await B.locator('button:has-text("estou pronto")').click();
await Promise.all([A, B].map((p) => p.waitForSelector('.jg-tray .jg-pz', { timeout: 25000 })));
const ordem = (p) => p.locator('.jg-tray .jg-pz').evaluateAll((es) => es.map((e) => e.getAttribute('data-piece')).join(','));
check('as peças vêm na MESMA ordem nos dois celulares', (await ordem(A)) === (await ordem(B)) && (await ordem(A)).split(',').length === 6, `${await ordem(A)} | ${await ordem(B)}`);
const montar = async (p, atraso) => { for (let i = 0; i < 6; i++) { const pc = await p.locator('.jg-tray .jg-pz').first().getAttribute('data-piece'); await p.locator('.jg-tray .jg-pz').first().click(); await p.locator(`[data-pos="${pc}"]`).click(); await sleep(atraso); } };
await Promise.all([montar(A, 120), (async () => { await sleep(2500); await montar(B, 400); })()]);
await Promise.all([A, B].map((p) => p.waitForSelector('.dl-fim', { timeout: 25000 })));
const fa = await A.locator('.dl-fim h2').textContent(); const fb = await B.locator('.dl-fim h2').textContent();
check('quem montou mais rápido vence: A ganhou e B perdeu', fa.includes('você venceu') && fb.includes('o outro venceu'), `${fa} | ${fb}`);
check('o placar mostra o tempo e as dicas/erros', /montou em/.test(await A.locator('.dl-pl').innerText()), await A.locator('.dl-pl').innerText());
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
