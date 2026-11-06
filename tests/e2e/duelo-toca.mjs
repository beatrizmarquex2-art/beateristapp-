// Duelo do Toca Aqui em dois celulares (duas sessões do navegador) com uma sala falsa na memória (sala_criar/entrar/ler/enviar, com a mesma regra de versão).
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
for (const p of [A, B]) { await p.goto(`${url}/aluno.html#/jogos/toca/livre`); await p.waitForSelector('.jg-seg button:has-text("duelo online")', { timeout: 20000 }); await p.locator('.jg-seg button:has-text("duelo online")').click(); }
await A.waitForSelector('.dl-cfg', { timeout: 20000 });
check('Toca Aqui tem a versão "duelo online" (exercício e andamento)', (await A.locator('.dl-sel option').count()) === 20 && (await A.locator('.dl-cfg .jo-passo').count()) === 1);
await A.locator('.dl-cfg .jo-passo button[aria-label$="próximo"]').click(); await sleep(300);
await A.locator('button:has-text("criar sala")').click(); await A.waitForSelector('.jg-code', { timeout: 10000 });
const code = (await A.locator('.jg-code').textContent()).trim();
await B.waitForSelector('.jg-code-in', { timeout: 20000 }); await B.locator('.jg-code-in').fill(code); await B.locator('button:has-text("entrar")').click();
await B.waitForSelector('.dl-cab', { timeout: 15000 }); await A.waitForSelector('.dl-cab', { timeout: 15000 });
const cabA = (await A.locator('.dl-cab').innerText()).split('\n').slice(-2).join(' '); const cabB = (await B.locator('.dl-cab').innerText()).split('\n').slice(-2).join(' ');
check('os dois veem o mesmo exercício e o mesmo bpm (75)', cabA === cabB && /75 bpm/.test(cabA), `${cabA} || ${cabB}`);
await A.locator('button:has-text("estou pronto")').click(); await B.locator('button:has-text("estou pronto")').click();
await Promise.all([A, B].map((p) => p.waitForSelector('.tm-root .tr-pad', { timeout: 25000 })));
check('contagem e a vez de tocar começam nos dois (o compasso na pauta)', (await A.locator('.tm-root svg').count()) >= 1 && (await B.locator('.tm-root svg').count()) >= 1);
// A toca certinho (lê os tempos esperados do pad); B não toca
await A.waitForFunction(() => document.querySelector('.tr-pad.live'), null, { timeout: 8000 });
await A.evaluate(async () => { const pad = document.querySelector('.tr-pad'); const ons = JSON.parse(pad.dataset.onsets); for (const t of ons) { while (pad.clock() < t) await new Promise((r) => setTimeout(r, 4)); pad.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, pointerType: 'touch' })); } });
await Promise.all([A, B].map((p) => p.waitForSelector('.dl-fim', { timeout: 40000 })));
const fa = await A.locator('.dl-fim h2').textContent(); const fb = await B.locator('.dl-fim h2').textContent();
check('quem tocou no tempo vence: A ganhou e B perdeu', fa.includes('você venceu') && fb.includes('o outro venceu'), `${fa} | ${fb}`);
check('placar mostra a precisão dos dois', /%/.test(await A.locator('.dl-pl').innerText()) && /0%/.test(await B.locator('.dl-pl').innerText()));
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
