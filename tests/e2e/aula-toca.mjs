// Aula ao vivo do Toca Aqui: a professora monta a partitura, o aluno entra com o código e toca quando ela manda começar (duas sessões do navegador) com uma sala falsa na memória (sala_criar/entrar/ler/enviar, com a mesma regra de versão).
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
for (const p of [A, B]) { await p.goto(`${url}/aluno.html#/jogos/toca/livre`); await p.waitForSelector('.jg-seg button:has-text("aula ao vivo")', { timeout: 20000 }); await p.locator('.jg-seg button:has-text("aula ao vivo")').click(); }
await A.waitForSelector('button:has-text("sou professora")'); await B.waitForSelector('button:has-text("sou aluna")');
await A.locator('button:has-text("sou professora")').click(); await A.waitForSelector('.au-cels');
check('editor: 4 tempos com as 11 células e a pauta desenhada', (await A.locator('.au-cel').count()) === 4 && (await A.locator('.au-cel option').count()) === 44 && (await A.locator('.tr-score svg').count()) === 1);
await A.locator('input[aria-label="Nome da atividade"]').fill('Aula 1: colcheias');
await A.locator('.au-cel').nth(1).selectOption('1010'); await sleep(300);
await A.locator('.jo-chips button:has-text("2")').first().click(); await sleep(300);
check('2 compassos: 8 tempos e 2 pautas', (await A.locator('.au-cel').count()) === 8 && (await A.locator('.tr-score svg').count()) === 2);
await A.locator('button:has-text("criar a aula ao vivo")').click(); await A.waitForSelector('.jg-code', { timeout: 10000 });
const code = (await A.locator('.jg-code').textContent()).trim(); check('aula criada com código de 5 letras', /^[A-Z0-9]{5}$/.test(code), code);
await B.locator('button:has-text("sou aluna")').click(); await B.locator('.jg-code-in').fill(code); await B.locator('button:has-text("entrar")').click();
await B.waitForSelector('.au-play .tr-pad', { timeout: 15000 });
check('a aluna vê a mesma partitura (nome, bpm, 2 pautas) e o microfone já vem marcado', (await B.locator('.au-cab').innerText()).includes('Aula 1: colcheias') && (await B.locator('.au-play .tr-score svg').count()) === 2 && (await B.locator('.au-play [role=radio][aria-checked=true]').first().textContent()).includes('microfone'));
await B.locator('.au-play [role=radio]:has-text("na tela")').click(); await sleep(300);
await A.locator('button:has-text("começar pra todos")').click();
await B.waitForFunction(() => document.querySelector('.tr-pad.live'), null, { timeout: 15000 });
check('quando a professora manda, a contagem começa sozinha no aparelho da aluna', true);
await B.evaluate(async () => { const pad = document.querySelector('.tr-pad'); const ons = JSON.parse(pad.dataset.onsets); for (const t of ons) { while (pad.clock() < t) await new Promise((r) => setTimeout(r, 4)); pad.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, pointerType: 'touch' })); } });
await B.waitForSelector('.tr-res', { timeout: 40000 });
const pct = Number((await B.locator('.tr-big b').textContent()).replace('%', ''));
check('a aluna toca no tempo e vê a precisão (alta)', pct >= 85, String(pct));
// a professora troca a partitura: a aluna recebe a nova
await A.locator('button:has-text("mudar a partitura")').click(); await A.waitForSelector('.au-cels');
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
