// Jogo da velha: (1) sem "mover a peça"; (2) quem sai no meio de uma pergunta (vai estudar) volta na MESMA pergunta, no mesmo aparelho e na sala de 2 celulares;
// (3) em 2 celulares: pausa geral com recado ("já volto rapidão"…), respostas ("beleza"…) e deixar a sala, e a pergunta só aparece no celular de quem joga. A sala é simulada aqui.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch();
const errs = []; const salas = {};
const instala = (c) => c.route('**/rest/v1/rpc/**', async (r) => {
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
instala(ctx);
const abrir = async (nome, c = ctx) => {
  const p = await c.newPage(); p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
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
  const ctxB = await context(browser, { viewport: { width: 390, height: 844 } }); instala(ctxB); // 2º celular: armazenamento separado
  const A = await abrir('Ana'); const B = await abrir('Bia', ctxB);
  await modo(A, '2 celulares'); await modo(B, '2 celulares'); await sleep(300);
  check('a tela da sala tem o campo "adicionar nome"', (await A.locator('.jg-nome-sala input').count()) === 1);
  await A.locator('.jg-nome-sala input').fill('Ana'); await B.locator('.jg-nome-sala input').fill('Bia');
  await A.locator('.jg-lobby .btn.primary').first().click(); await sleep(1500);
  await B.locator('.jg-code-in').fill('ABCDE'); await B.locator('.jg-entrar .btn').click(); await sleep(2500);
  check('cada um vê o nome do outro (no lugar de "o outro")', /Bia/.test(await A.locator('.jg-score').innerText()) && /Ana/.test(await B.locator('.jg-score').innerText()) && !/o outro/.test(await A.locator('.jg-score').innerText()), (await A.locator('.jg-score').innerText()).replace(/\n/g, ' '));
  check('os dois entraram na sala', (await A.locator('.jg-board').count()) === 1 && (await B.locator('.jg-board').count()) === 1);
  check('os dois vêem os botões de pausa e de deixar a sala', (await A.locator('.vl-ctl button').count()) === 2 && (await B.locator('.vl-ctl button').count()) === 2);
  await A.locator('.jg-cell').first().click(); await sleep(2500);
  const q = await A.locator('.jg-qt').innerText();
  check('a pergunta aparece só no celular de quem joga', (await B.locator('.jg-qt').count()) === 0 && /Ana está respondendo/.test(await B.locator('.jg-turn').innerText()), await B.locator('.jg-turn').innerText());
  const SHOT = process.env.SHOT; const foto = async (p, n) => { if (SHOT) await p.screenshot({ path: `${SHOT}/${n}.png` }); };
  const chip = (p, t) => p.locator(`.jg-pausa-chips button:has-text("${t}")`).click();
  const geral = (p) => p.locator('.jg-pausa-geral');
  // pausa geral com recado
  await A.locator('.vl-ctl button').nth(0).click(); await sleep(400);
  check('o menu de pausa tem continuar, 3 recados pra todos e deixar a sala', (await A.locator('.jg-pausa-go').count()) === 1 && (await A.locator('.jg-pausa-sala .jg-pausa-chips button').count()) === 3 && (await A.locator('.jg-deixar').count()) === 1);
  check('pausa normal não chega no outro celular', (await geral(B).count()) === 0);
  await foto(A, '1-menu');
  await chip(A, 'tenho que sair'); await sleep(2500);
  check('o outro celular recebe a pausa geral com o recado', /Ana pausou pra todos: “tenho que sair”/.test(await geral(B).innerText()) && (await B.evaluate(() => document.querySelector('.jg-body').inert)) === true, await geral(B).innerText().catch(() => 'sem tela'));
  check('quem recebe tem 3 respostas', (await B.locator('.jg-pausa-geral .jg-pausa-chips:not(.jg-pausa-saidas) button').allInnerTexts()).join('|') === 'beleza|blz tchau|não consigo');
  await foto(B, '2-recebe');
  await chip(B, 'beleza'); await sleep(2500);
  check('quem pausou vê a resposta', /Bia respondeu: “beleza”/.test(await geral(A).innerText()), await geral(A).innerText());
  await foto(A, '3-resposta');
  check('quem respondeu fica esperando', /você respondeu: “beleza”/.test(await geral(B).innerText()));
  // sai pra estudar e volta pela sala: a pausa geral some sozinha e a pergunta é a mesma
  await A.evaluate(() => { location.hash = '#/estudos'; }); await sleep(900);
  await A.evaluate(() => { location.hash = '#/jogos/velha'; }); await sleep(1500);
  await modo(A, '2 celulares'); await sleep(300);
  await A.locator('.jg-volta .btn').click(); await sleep(3000);
  check('voltou pra sala na MESMA pergunta', (await A.locator('.jg-qt').count()) === 1 && (await A.locator('.jg-qt').innerText()) === q);
  check('a pausa geral sumiu nos dois', (await geral(A).count()) === 0 && (await geral(B).count()) === 0 && (await B.evaluate(() => document.querySelector('.jg-body').inert)) === false);
  // "não consigo" e "voltei, continuar pra todos"
  await B.locator('.jg-pausa-btn').click(); await sleep(300); await chip(B, 'já volto rapidão'); await sleep(2500);
  await chip(A, 'não consigo'); await sleep(2500);
  check('“não consigo” chega em quem pausou', /Ana respondeu: “não consigo”/.test(await geral(B).innerText()), await geral(B).innerText());
  await B.locator('.jg-pausa-geral .jg-pausa-go').click(); await sleep(2500);
  check('continuar pra todos libera os dois', (await geral(A).count()) === 0 && (await geral(B).count()) === 0);
  // "blz tchau": responde e sai; a sala fica guardada
  await A.locator('.jg-pausa-btn').click(); await sleep(300); await chip(A, 'pode aguardar um pouco?'); await sleep(2500);
  check('quem recebe não tem botão de continuar', (await B.locator('.jg-pausa-geral .jg-pausa-go').count()) === 0);
  await chip(B, 'blz tchau'); await sleep(2500);
  check('“blz tchau” avisa e leva pra tela de jogos', /blz tchau/.test(await geral(A).innerText()) && (await B.evaluate(() => location.hash)) === '#/jogos', await B.evaluate(() => location.hash));
  await A.locator('.jg-pausa-geral .jg-pausa-go').click(); await sleep(1500);
  await B.evaluate(() => { location.hash = '#/jogos/velha'; }); await sleep(1500); await modo(B, '2 celulares'); await sleep(300); await B.locator('.jg-volta .btn').click(); await sleep(3000);
  check('quem deu tchau consegue voltar pra sala', (await B.locator('.jg-board').count()) === 1 && (await geral(B).count()) === 0);
  // deixar a sala
  await B.locator('.vl-ctl button').nth(1).click(); await sleep(400);
  await B.locator('.sheet-body button:has-text("deixar a sala")').click(); await sleep(3000);
  check('deixar a sala: quem saiu vai pros jogos e a sala é esquecida', (await B.evaluate(() => location.hash)) === '#/jogos' && (await B.evaluate(() => localStorage.getItem('beaterista-sala-ultima-velha'))) === null);
  check('quem ficou é avisado', /Bia deixou a sala/.test(await geral(A).innerText()), await geral(A).innerText().catch(() => 'sem tela'));
  await foto(A, '4-deixou');
}
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
