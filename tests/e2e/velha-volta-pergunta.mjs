// Jogo da velha: (1) sem "mover a peça"; (2) quem sai no meio de uma pergunta (vai estudar) volta na MESMA pergunta, no mesmo aparelho e na sala de 2 celulares;
// (3) em 2 celulares: "pausar pros dois" e "avisar que vou sair" aparecem pro outro, e a pergunta só aparece no celular de quem joga. A sala é simulada aqui.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch();
const errs = []; const salas = {};
await ctx.route('**/rest/v1/rpc/**', async (r) => {
  const fn = r.request().url().split('/rpc/')[1]; let b = {}; try { b = JSON.parse(r.request().postData() || '{}'); } catch { /* ok */ }
  const j = (x) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(x) });
  if (fn === 'aluno_codigo_ok') return j(true);
  if (fn === 'sala_criar') { salas.ABCDE = { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false }; return j('ABCDE'); }
  const s = salas[String(b.p_code || '').toUpperCase()];
  if (fn === 'sala_entrar') { if (!s) return j([]); s.convidado = true; return j([{ ver: s.ver, estado: s.estado }]); }
  if (fn === 'sala_ler') return j(s ? [{ ver: s.ver, convidado: s.convidado, estado: s.ver === b.p_ver ? null : s.estado }] : []);
  if (fn === 'sala_enviar') { if (!s || s.ver !== b.p_ver) return j(0); s.estado = b.p_estado; s.ver++; return j(s.ver); }
  return j([]);
});
const abrir = async (nome) => {
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.addInitScript((n) => { try { localStorage.setItem('beaterista-aluno-nome', n); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } }, nome);
  await p.goto(`${url}/aluno.html#/jogos/velha`); await sleep(1200); return p;
};
const modo = (p, rotulo) => p.locator(`.jg-seg button[aria-label^="${rotulo}"]`).click();

// ---- (1) e (2) no mesmo aparelho
{
  const p = await abrir('Ana'); await modo(p, 'dois'); await sleep(200);
  check('sem a regra de mover a peça', !/mudar uma marca|1 vez por rodada/.test(await p.locator('.jg-velha').innerText()));
  await p.locator('.jg-actions .btn').last().click(); await sleep(400);
  check('sem botão de mover a peça no jogo', (await p.locator('.jg-move').count()) === 0);
  await p.locator('.jg-cell').first().click(); await sleep(300);
  const pergunta = await p.locator('.jg-qt').innerText(); check('abriu uma pergunta', pergunta.length > 5);
  await p.evaluate(() => { location.hash = '#/estudos'; }); await sleep(900);
  await p.evaluate(() => { location.hash = '#/jogos/velha'; }); await sleep(1500);
  check('voltou direto na MESMA pergunta (mesmo aparelho)', (await p.locator('.jg-qt').count()) === 1 && (await p.locator('.jg-qt').innerText()) === pergunta);
  await p.evaluate(() => localStorage.clear()); await p.close(); // limpa a partida guardada pra não atrapalhar o teste seguinte
}
// ---- (3) dois celulares
{
  const A = await abrir('Ana'); const B = await abrir('Bia');
  await modo(A, '2 celulares'); await modo(B, '2 celulares'); await sleep(300);
  await A.locator('.jg-lobby .btn.primary').first().click(); await sleep(1500);
  await B.locator('.jg-code-in').fill('ABCDE'); await B.locator('.jg-entrar .btn').click(); await sleep(2500);
  check('os dois entraram na sala', (await A.locator('.jg-board').count()) === 1 && (await B.locator('.jg-board').count()) === 1);
  check('os dois vêem pausar e avisar que vai sair', (await A.locator('.vl-ctl button').count()) === 2 && (await B.locator('.vl-ctl button').count()) === 2);
  await A.locator('.jg-cell').first().click(); await sleep(2500);
  const q = await A.locator('.jg-qt').innerText();
  check('a pergunta aparece só no celular de quem joga', (await B.locator('.jg-qt').count()) === 0 && /respondendo/.test(await B.locator('.jg-turn').innerText()), await B.locator('.jg-turn').innerText());
  await A.locator('.vl-ctl button').nth(1).click(); await sleep(2500);
  check('o outro recebe o aviso de saída', /vai sair/.test(await B.locator('.vl-pausa').innerText()));
  check('quem avisou vê o convite pra estudar/voltar', /voltar pra sala/.test(await A.locator('.vl-pausa').innerText()));
  await A.evaluate(() => { location.hash = '#/estudos'; }); await sleep(900);
  await A.evaluate(() => { location.hash = '#/jogos/velha'; }); await sleep(1500);
  await modo(A, '2 celulares'); await sleep(300);
  await A.locator('.jg-volta .btn').click(); await sleep(2500);
  check('voltou pra sala na MESMA pergunta', (await A.locator('.jg-qt').count()) === 1 && (await A.locator('.jg-qt').innerText()) === q);
  check('o aviso de saída sumiu nos dois', (await A.locator('.vl-pausa').count()) === 0 && (await B.locator('.vl-pausa').count()) === 0);
  await B.locator('.vl-ctl button').nth(0).click(); await sleep(2500);
  check('pausar pros dois: o outro fica pausado e sem jogar', /pausou/.test(await A.locator('.vl-pausa').innerText()) && (await A.locator('.jg-opt:not([disabled])').count()) >= 0);
  await A.locator('.vl-pausa .btn.primary').click(); await sleep(2500);
  check('continuar pros dois', (await A.locator('.vl-pausa').count()) === 0 && (await B.locator('.vl-pausa').count()) === 0);
}
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
