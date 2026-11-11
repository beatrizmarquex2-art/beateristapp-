// Duelo de Quiz e Letras em 2 celulares (sala falsa na memória): o MESMO puzzle nos dois, começam juntos, vence quem termina primeiro. Testa a cruzadinha e a caça-palavras.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx: ctxA } = await launch({ codigo: true }); const ctxB = await context(browser);
const salas = new Map(); const errs = [];
const json = (r, v) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(v) });
const TIPS = Array.from({ length: 30 }, (_, i) => ({ n: i + 1, w: ['BAQUETA', 'PULSO', 'RITMO', 'TEMPO', 'CAIXA', 'BUMBO', 'COMPASSO', 'TOQUE', 'GROOVE', 'ANDAMENTO'][i % 10] + (i >= 10 ? ['', 'X', 'Y'][Math.floor(i / 10)] : ''), shown: 'palavra', text: `dica número ${i + 1}: treine ${['BAQUETA', 'PULSO', 'RITMO', 'TEMPO', 'CAIXA', 'BUMBO', 'COMPASSO', 'TOQUE', 'GROOVE', 'ANDAMENTO'][i % 10].toLowerCase()} todo dia com calma.` }));
async function rotas(c) {
  await c.route('**/rest/v1/rpc/**', (r) => {
    const fn = r.request().url().split('/rpc/')[1]; const b = r.request().postDataJSON() || {};
    if (fn === 'aluno_codigo_ok') return json(r, true); if (fn === 'midis_publicos_lista') return json(r, []);
    if (fn === 'dicas_lista') return json(r, TIPS.map((t) => ({ n: t.n, texto: t.text })));
    if (fn === 'sala_criar') { const code = 'LET4' + salas.size; salas.set(code, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false }); return json(r, code); }
    const s = salas.get(String(b.p_code || '').toUpperCase());
    if (fn === 'sala_entrar') { if (!s || s.jogo !== b.p_jogo) return json(r, []); s.convidado = true; return json(r, [{ ver: s.ver, estado: s.estado }]); }
    if (fn === 'sala_ler') return json(r, s ? [{ ver: s.ver, convidado: s.convidado, estado: s.ver === b.p_ver ? null : s.estado }] : []);
    if (fn === 'sala_enviar') { if (!s || s.ver !== b.p_ver) return json(r, 0); s.estado = b.p_estado; s.ver += 1; return json(r, s.ver); }
    return json(r, []);
  });
}
async function celular(c) {
  await rotas(c); const p = await c.newPage(); await p.setViewportSize({ width: 390, height: 900 }); p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.addInitScript((tips) => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); localStorage.setItem('beaterista-aluno-codigo', 'ABC123'); } catch { /* ok */ } window.__TIPS = tips; }, TIPS);
  return p;
}
const A = await celular(ctxA); const B = await celular(ctxB);
for (const p of [A, B]) { await p.goto(`${url}/aluno.html#/dicas/duelo`); await p.waitForSelector('.dc-picks', { timeout: 20000 }); await sleep(2500); }
check('a aba "duelo" aparece em Quiz e Letras', (await A.locator('.dc-pick', { hasText: 'duelo' }).count()) === 1);
const temSala = await A.locator('button:has-text("criar sala")').count();
check('a tela do duelo abre com jogo (caça, cruzadinha, quiz), como vence e criar sala', temSala === 1 && (await A.locator('.jo-chips button').count()) >= 5, `criar:${temSala}`);
await A.locator('.jo-chips button', { hasText: 'cruzadinha' }).click(); await sleep(300);
await A.locator('button:has-text("criar sala")').click(); await A.waitForSelector('.jg-code', { timeout: 10000 });
const code = (await A.locator('.jg-code').textContent()).trim(); check('sala criada com código de 5 letras', /^[A-Z0-9]{5}$/.test(code), code);
await B.goto(`${url}/aluno.html#/dicas/duelo`); await B.waitForSelector('.jg-code-in', { timeout: 20000 }); await B.locator('.jg-code-in').fill(code); await B.locator('button:has-text("entrar")').click();
await Promise.all([A, B].map((p) => p.waitForSelector('.dl-cab', { timeout: 15000 })));
const cab = async (p) => (await p.locator('.dl-cab').innerText()).replace(/\s+/g, ' ');
check('os dois veem a mesma configuração (cruzadinha, quem termina primeiro)', (await cab(A)) === (await cab(B)) && /cruzadinha/.test(await cab(A)), `${await cab(A)} || ${await cab(B)}`);
await A.locator('button:has-text("estou pronto")').click(); await B.locator('button:has-text("estou pronto")').click();
await Promise.all([A, B].map((p) => p.waitForSelector('.dc-clues input', { timeout: 20000 })));
const pistas = (p) => p.locator('.dc-clues li').evaluateAll((es) => es.map((e) => e.innerText.replace(/\s+/g, ' ').slice(0, 60)));
check('as duas cruzadinhas têm as MESMAS pistas, na mesma ordem', JSON.stringify(await pistas(A)) === JSON.stringify(await pistas(B)), JSON.stringify(await pistas(A)));
const palavras = salas.get(code).estado.cfg.pick.map((x) => x.w);
const resolver = async (p, atraso) => { const n = await p.locator('.dc-clues input').count(); for (let i = 0; i < n; i++) { const ph = await p.locator('.dc-clues input').nth(i).getAttribute('placeholder'); const w = palavras.find((x) => x[0] === ph[0] && x.length === ph.length) || palavras[i]; await p.locator('.dc-clues input').nth(i).fill(w); await sleep(120); } if (atraso) await sleep(atraso); };
await resolver(A, 0); await sleep(300); await resolver(B, 2500);
await Promise.all([A, B].map((p) => p.waitForSelector('.dl-fim', { timeout: 25000 })));
const fa = await A.locator('.dl-fim h2').textContent(); const fb = await B.locator('.dl-fim h2').textContent();
check('quem terminou primeiro vence: A ganhou e B perdeu', fa.includes('você venceu') && fb.includes('o outro venceu'), `${fa} | ${fb}`);
check('o placar mostra palavras e tempo dos dois', /\/\d/.test(await A.locator('.dl-pl').innerText()) && /terminou em/.test(await A.locator('.dl-pl').innerText()), await A.locator('.dl-pl').innerText());
// caça-palavras e quiz: a grade / a 1ª pergunta têm que ser IGUAIS nos dois celulares
for (const [jogo, sel, olhar] of [['caça-palavras', '.dc-grid', (p) => p.locator('.dc-grid .dc-c').allInnerTexts().then((l) => l.join(''))], ['quiz', '.dc-q', (p) => p.locator('.dc-q').innerText()]]) {
  for (const p of [A, B]) { await p.goto(`${url}/aluno.html#/dicas/duelo`); await p.reload(); await p.waitForSelector('.dc-picks', { timeout: 20000 }); await sleep(1800); }
  await A.locator('.jo-chips button', { hasText: jogo }).click(); await sleep(300); await A.locator('button:has-text("criar sala")').click(); await A.waitForSelector('.jg-code', { timeout: 10000 });
  const c2 = (await A.locator('.jg-code').textContent()).trim(); await B.waitForSelector('.jg-code-in', { timeout: 20000 }); await B.locator('.jg-code-in').fill(c2); await B.locator('button:has-text("entrar")').click();
  await Promise.all([A, B].map((p) => p.waitForSelector('.dl-cab', { timeout: 15000 }))); await A.locator('button:has-text("estou pronto")').click(); await B.locator('button:has-text("estou pronto")').click();
  await Promise.all([A, B].map((p) => p.waitForSelector(sel, { timeout: 20000 })));
  const [ta, tb] = [await olhar(A), await olhar(B)]; check(`${jogo}: os dois celulares recebem o MESMO jogo`, ta.length > 20 && ta === tb, `${ta.slice(0, 60)} || ${tb.slice(0, 60)}`);
  check(`${jogo}: aparece o relógio do duelo`, (await A.locator('.dl-timer').count()) === 1);
}
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
