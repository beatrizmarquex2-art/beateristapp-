// Jogo da memória em 2 celulares (duas sessões do navegador) com uma sala falsa na memória (sala_criar/entrar/ler/enviar, com a mesma regra de versão).
// Cria a sala, entra pelo código, confere que as cartas são as mesmas, joga a vez de cada um até o fim, vê o resultado nos dois e faz a revanche.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx: ctxA } = await launch({ codigo: false }); const ctxB = await context(browser);
const salas = new Map(); const errs = [];
const json = (r, v) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(v) });
async function rotas(c) {
  await c.route('**/rest/v1/rpc/**', (r) => {
    const fn = r.request().url().split('/rpc/')[1]; const b = r.request().postDataJSON() || {};
    if (fn === 'aluno_codigo_ok') return json(r, false);
    if (fn === 'sala_criar') { const code = 'MEM42'; salas.set(code, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false }); return json(r, code); }
    const s = salas.get(String(b.p_code || '').toUpperCase());
    if (fn === 'sala_entrar') { if (!s || s.jogo !== b.p_jogo) return json(r, []); s.convidado = true; return json(r, [{ ver: s.ver, estado: s.estado }]); }
    if (fn === 'sala_ler') return json(r, s ? [{ ver: s.ver, convidado: s.convidado, estado: s.ver === b.p_ver ? null : s.estado }] : []);
    if (fn === 'sala_enviar') { if (!s || s.ver !== b.p_ver) return json(r, 0); s.estado = b.p_estado; s.ver += 1; return json(r, s.ver); }
    return json(r, []);
  });
}
async function celular(c) {
  await rotas(c); const p = await c.newPage(); await p.setViewportSize({ width: 390, height: 844 }); p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
  await p.goto(`${url}/aluno.html#/jogos/memart`); await p.waitForSelector('.mem-theme', { timeout: 20000 }); await sleep(500);
  await p.locator('.mem-ic[aria-label="2 celulares (código)"]').click(); await sleep(300); return p;
}
const A = await celular(ctxA); const B = await celular(ctxB);
check('a opção "2 celulares (código)" aparece e troca o botão jogar pela sala', (await A.locator('.jg-lobby button:has-text("criar sala")').count()) === 1 && (await A.locator('.kx-go').count()) === 0);
await A.locator('button:has-text("criar sala")').click(); await A.waitForSelector('.jg-code', { timeout: 10000 });
const code = (await A.locator('.jg-code').textContent()).trim(); check('a sala devolve o código', code === 'MEM42', code);
await B.waitForSelector('.jg-code-in', { timeout: 10000 }); await B.locator('.jg-code-in').fill(code); await B.locator('button:has-text("entrar")').click();
await Promise.all([A, B].map((p) => p.waitForSelector('.kx-mem', { timeout: 20000 })));
const srcs = (p) => p.locator('.kx-mem img.mem-card-img').evaluateAll((es) => es.map((e) => e.getAttribute('src')));
const [sa, sb] = [await srcs(A), await srcs(B)];
check('os dois celulares veem as mesmas 16 cartas na mesma ordem (8 pares)', sa.length === 16 && JSON.stringify(sa) === JSON.stringify(sb));
const st = (p) => p.locator('.kx-memstat').textContent();
check('quem criou começa: "sua vez" em A e "vez do amigo" em B', /sua vez/.test(await st(A)) && /vez do amigo/.test(await st(B)), `${await st(A)} || ${await st(B)}`);
const pares = Object.values(sa.reduce((m, s, i) => { (m[s] ||= []).push(i); return m; }, {}));
const clicar = async (p, a, b) => { await p.locator('.kx-mem').nth(a).click(); await p.locator('.kx-mem').nth(b).click(); };
// B tenta virar na vez de A: nada acontece
await B.locator('.kx-mem').nth(0).click(); await sleep(300);
check('fora da vez a carta não vira', (await B.locator('.kx-mem.up').count()) === 0);
// A erra de propósito (duas cartas de pares diferentes) e a vez passa pra B
await clicar(A, pares[0][0], pares[1][0]);
await B.waitForFunction(() => document.querySelectorAll('.kx-mem.up').length === 2, null, { timeout: 2600 }).then(() => check('as duas cartas viradas aparecem também no outro celular', true), () => check('as duas cartas viradas aparecem também no outro celular', false));
await sleep(3500);
check('errou: cartas desviram nos dois e a vez passa pra B', (await A.locator('.kx-mem.up').count()) === 0 && (await B.locator('.kx-mem.up').count()) === 0 && /vez do amigo/.test(await st(A)) && /sua vez/.test(await st(B)), `${await st(A)} || ${await st(B)}`);
// B acerta um par: ganha ponto e joga de novo
await clicar(B, pares[0][0], pares[0][1]); await sleep(3000);
check('B acertou: 1 ponto pra B nos dois celulares e continua na vez', /sua vez · você 1 × 0/.test(await st(B)) && /vez do amigo · você 0 × 1/.test(await st(A)), `${await st(A)} || ${await st(B)}`);
check('o par acertado fica virado nos dois', (await A.locator('.kx-mem.ok').count()) === 2 && (await B.locator('.kx-mem.ok').count()) === 2);
// resto dos pares: quem está na vez joga (sempre acerta, então B continua), A ganha um par no meio trocando a vez com um erro
await clicar(B, pares[1][0], pares[2][0]); await sleep(3500); // B erra, vez de A
for (const [a, b] of pares.slice(1, 4)) { await clicar(A, a, b); await sleep(2100); } // A acerta 3 pares seguidos
const restantes = pares.slice(4);
for (const [a, b] of restantes) { const vezA = /sua vez/.test(await st(A)); await clicar(vezA ? A : B, a, b); await sleep(2100); }
await Promise.all([A, B].map((p) => p.waitForSelector('.kx-result', { timeout: 15000 })));
const ra = await A.locator('.kx-result h2').textContent(); const rb = await B.locator('.kx-result h2').textContent();
check('o resultado é coerente nos dois celulares (vitória de um, derrota do outro, ou empate)', (/você venceu/.test(ra) && /amigo venceu/.test(rb)) || (/amigo venceu/.test(ra) && /você venceu/.test(rb)) || (/empate/.test(ra) && /empate/.test(rb)), `${ra} | ${rb}`);
check('os dois veem o mesmo placar (invertido)', (await A.locator('.kx-pct .n').textContent()).split(' × ').reverse().join(' × ') === (await B.locator('.kx-pct .n').textContent()));
// revanche: A aperta, cartas novas nos dois e quem começa é o B
await A.locator('.kx-result button:has-text("revanche")').click(); await sleep(3200);
const novoA = await srcs(A); const novoB = await srcs(B);
check('revanche: baralho novo igual nos dois, tudo de costas, B começa', novoA.length === 16 && JSON.stringify(novoA) === JSON.stringify(novoB) && JSON.stringify(novoA) !== JSON.stringify(sa) && (await A.locator('.kx-mem.up').count()) === 0 && (await A.locator('.kx-result').count()) === 0 && /sua vez/.test(await st(B)), `${await st(A)} || ${await st(B)}`);
check('sair da sala volta pra escolha de tema', await (async () => { await A.locator('button:has-text("sair")').first().click(); await sleep(500); return (await A.locator('.mem-theme').count()) >= 3; })());
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
