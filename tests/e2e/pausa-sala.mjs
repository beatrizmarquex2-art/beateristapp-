// Pausa em todos os jogos, "continuar" depois de sair sem querer, atalho "tenho um código de sala" e botão "tenho código".
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const salas = new Map();
const mock = async (route) => {
  const fn = new URL(route.request().url()).pathname.split('/').pop(); const b = route.request().postDataJSON();
  const ok = (j) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(j) });
  if (fn === 'sala_criar') { const c = 'ZZ' + String(salas.size + 100); salas.set(c, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false }); return ok(c); }
  const s = salas.get(String(b.p_code || '').toUpperCase());
  if (fn === 'sala_entrar') { if (!s || s.jogo !== b.p_jogo) return ok([]); s.convidado = true; return ok([{ ver: s.ver, estado: s.estado }]); }
  if (fn === 'sala_ler') return ok(s ? [{ ver: s.ver, convidado: s.convidado, estado: s.ver === b.p_ver ? null : s.estado }] : []);
  if (fn === 'sala_enviar') { if (!s || s.ver !== b.p_ver) return ok(0); s.estado = b.p_estado; s.ver++; return ok(s.ver); }
  return route.continue();
};
const mk = async (codigo = true) => { const ctx = await context(browser, { viewport: { width: 390, height: 844 }, codigo }); await ctx.route('**/rest/v1/rpc/sala_*', mock); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(String(e).slice(0, 160)));
  await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } }); return p; };
const p = await mk();
// pausa
await p.goto(`${url}/aluno.html#/jogos/velha/livre`); await sleep(1500);
check('botão de pausa aparece no jogo', (await p.locator('.jg-pausa-btn').count()) === 1);
await p.locator('.jg-pausa-btn').click(); await sleep(300);
check('pausar cobre o jogo e bloqueia o toque', (await p.locator('.jg-pausa').count()) === 1 && (await p.evaluate(() => document.querySelector('.jg-body').inert)) === true);
await p.locator('.jg-pausa button:has-text("continuar")').click(); await sleep(300);
check('continuar volta ao jogo', (await p.locator('.jg-pausa').count()) === 0 && (await p.evaluate(() => document.querySelector('.jg-body').inert)) === false);
for (const g of ['cartas', 'stop', 'bingo', 'quebra', 'cara', 'memart', 'toca']) { await p.goto(`${url}/aluno.html#/jogos/${g}/livre`); await sleep(1300); check(`pausa existe em ${g}`, (await p.locator('.jg-pausa-btn').count()) === 1); }
// atalho de sala + voltar pra sala
await p.goto(`${url}/aluno.html#/jogos`); await sleep(1200);
check('tela de jogos tem "tem um código de sala?" bem à vista', (await p.locator('.jg-sala-atalho .jg-code-in').count()) === 1);
// cria sala de velha em outro celular e entra pelo atalho
const a = await mk(); await a.goto(`${url}/aluno.html#/jogos/velha/livre`); await sleep(1200);
await a.locator('button[aria-label*="2 celulares"], button:has-text("2 celulares")').first().click(); await sleep(300);
await a.locator('button:has-text("criar sala")').click(); await sleep(600);
const code = (await a.locator('.jg-code').textContent()).trim();
await p.locator('.jg-sala-atalho .jg-code-in').fill(code); await p.locator('.jg-sala-atalho button:has-text("entrar")').click(); await sleep(3500);
check('o atalho abriu o jogo certo e entrou na sala sozinho', (await p.evaluate(() => location.hash)).includes('velha') && (await p.locator('.jg-cell').count()) === 9, await p.evaluate(() => location.hash));
check('os dois celulares estão na mesma partida', (await a.locator('.jg-cell').count()) === 9);
// sair sem querer e voltar pra sala
await p.goto(`${url}/aluno.html#/jogos`); await sleep(1200);
check('depois de sair, a tela de jogos oferece "voltar pra sala"', (await p.locator(`.jg-sala-atalho button:has-text("voltar pra sala ${code}")`).count()) === 1);
await p.locator(`.jg-sala-atalho button:has-text("voltar pra sala ${code}")`).click(); await sleep(3500);
check('"voltar pra sala" devolve a partida', (await p.locator('.jg-cell').count()) === 9);
// código errado
await p.goto(`${url}/aluno.html#/jogos`); await sleep(1000); await p.locator('.jg-sala-atalho .jg-code-in').fill('QQQQQ'); await p.locator('.jg-sala-atalho button:has-text("entrar")').click(); await sleep(1500);
check('código que não existe avisa em português', /não achei/.test(await p.locator('.jg-sala-atalho .jg-msg').innerText()));
// tenho código (sem código de acesso)
const q = await mk(false); await q.goto(`${url}/aluno.html#/jogos`); await sleep(1500);
check('sem código de acesso: botão "tenho código" no topo', (await q.locator('.al-tenho:visible').count()) === 1);
await q.locator('.al-tenho').click(); await sleep(400);
check('abre a folha pra digitar o código', (await q.locator('input[aria-label="Código de acesso"]').count()) === 1);
check('com código de acesso o botão some', (await p.locator('.al-tenho:visible').count()) === 0);
check('sem erros de JS', ![...p.errs, ...a.errs, ...q.errs].length, [...p.errs, ...a.errs, ...q.errs].join('|'));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
