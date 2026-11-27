// Balcão (aqui com a conta da Bea; a professora usa o código de professora e a mesma tela): cadastra, importa, troca, ativa/desativa. Servidor simulado na memória.
import { serve, launch, sleep, check, done, fakeLogin } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
const json = (r, b, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(b) });
const DB = [{ code: 'AAAAAA', nome: 'Marina Miranda', curso: 'Violão', ativo: true, criado_por: 'Bea', criado_em: '2026-01-02T10:00:00Z', usos: 3 }, { code: 'BBBBBB', nome: 'Antonio Reis', curso: 'Bateria', ativo: true, criado_por: 'Leonardo', criado_em: '2026-01-03T10:00:00Z', usos: 1 }];
const chamadas = [];
await page.setViewportSize({ width: 390, height: 840 }); await fakeLogin(ctx, page, url);
await ctx.route(/\/rest\/v1\/rpc\/balcao_/, (r) => { const rq = r.request(); const n = rq.url().split('/').pop(); const b = rq.postDataJSON(); chamadas.push([n, b]);
  if (b.p_prof !== null) return json(r, { message: 'nao autorizado' }, 400);
  if (n === 'balcao_listar') return json(r, DB);
  if (n === 'balcao_gerar') { DB.unshift({ code: 'ZXCV23', nome: b.p_nome, curso: b.p_curso, ativo: b.p_ativo, criado_por: b.p_quem, criado_em: new Date().toISOString(), usos: 0 }); return json(r, 'ZXCV23'); }
  if (n === 'balcao_importar') { const x = DB.find((d) => d.code === b.p_code.toUpperCase()); if (x && !b.p_trocar) return json(r, { ok: false, motivo: 'existe', nome: x.nome, curso: x.curso, ativo: x.ativo }); if (x) { Object.assign(x, { nome: b.p_nome, curso: b.p_curso }); return json(r, { ok: true, code: x.code, novo: false }); } DB.unshift({ code: b.p_code.toUpperCase(), nome: b.p_nome, curso: b.p_curso, ativo: b.p_ativo, criado_por: b.p_quem, criado_em: new Date().toISOString(), usos: 0 }); return json(r, { ok: true, code: b.p_code.toUpperCase(), novo: true }); }
  if (n === 'balcao_ativar') { DB.find((d) => d.code === b.p_code).ativo = b.p_on; return r.fulfill({ status: 204 }); }
  return json(r, null); });
await page.evaluate(() => { location.hash = '#/balcao'; }); await sleep(2500);
check('vê o Balcão', /balcão/i.test(await page.locator('body').innerText()));
check('"meus" mostra só os dela', await page.locator('.bal-li').count() === 1 && /Marina/.test(await page.locator('.bal-li').innerText()));
await page.screenshot({ path: '/tmp/shots/b0.png' }); await page.getByRole('button', { name: 'todos', exact: true }).click({ timeout: 4000 }).catch(() => {}); check('"todos" mostra os 2', await page.locator('.bal-li').count() === 2);
await page.locator('.bal-sec input[type=search]').fill('marina'); await sleep(200); check('busca por nome', await page.locator('.bal-li').count() === 1);
await page.locator('.bal-sec input[type=search]').fill('');
await page.locator('input[placeholder="nome do aluno"]').first().fill('Bia Lima'); await page.locator('.bal-sec select').first().selectOption('Teclado'); await page.getByRole('button', { name: 'gerar código' }).click(); await sleep(600);
check('gera e mostra o código grande', /ZXCV23/.test(await page.locator('.bal-big').innerText()));
check('a chamada levou o nome da professora e o curso', chamadas.some(([n, b]) => n === 'balcao_gerar' && b.p_quem === 'Bea' && b.p_curso === 'Teclado' && b.p_ativo === true));
await page.locator('input[placeholder="código que o aluno tem"]').fill('aaaaaa'); await page.locator('.bal-sec:nth-of-type(2) input[placeholder="nome do aluno"]').fill('Nova Pessoa'); await page.getByRole('button', { name: 'importar código' }).click(); await sleep(500);
check('código repetido pergunta antes de trocar', /já é de Marina Miranda/.test(await page.locator('body').innerText()));
await page.getByRole('button', { name: 'Trocar' }).click(); await sleep(600);
check('depois de confirmar, o código passa a ser da nova pessoa', DB.find((d) => d.code === 'AAAAAA').nome === 'Nova Pessoa');
await page.getByRole('button', { name: 'todos', exact: true }).click();
await page.locator('.bal-li[data-code="BBBBBB"] .bal-sw').click(); await sleep(500);
check('desativar muda o interruptor', DB.find((d) => d.code === 'BBBBBB').ativo === false && await page.locator('.bal-li[data-code="BBBBBB"].off').count() === 1);
check('sem rolagem lateral no celular', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/balcao.png`, fullPage: true });
check('sem erros de script', errs.length === 0 || (console.log(errs), false));
await browser.close(); srv.close(); done();
