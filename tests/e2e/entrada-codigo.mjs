// Primeira tela do aluno: Nome + código de acesso (campo pequeno, letras visíveis) + "gerar código" lado a lado, sem a lista "como você chegou aqui". Código certo libera o Beat Hero e as Músicas MIDI. Supabase simulado.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true }); const valid = new Set(['BEA0404']);
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(valid.has(r.request().postDataJSON().p_code)) }));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => { const ok = valid.has(String(r.request().postDataJSON().p_code).toUpperCase()); r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ok ? { ok: true, tipo: 'turma', nome: 'Maria' } : { ok: false, motivo: 'codigo' }) }); });
await ctx.route('**/rest/v1/rpc/midis_publicos_lista', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await ctx.route('**/rest/v1/rpc/aluno_visit', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }));
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.goto(`${url}/aluno.html`); await sleep(1500);
check('não tem mais a lista "escolha uma opção"', (await p.locator('select').count()) === 0);
check('o campo do código já aparece direto, com as letras visíveis (texto, não senha)', (await p.locator('.al-cod').isVisible()) && (await p.locator('.al-cod').getAttribute('type')) === 'text');
await p.locator('input[aria-label="Seu nome"]').fill('Maria'); await sleep(200);
const cb = await p.locator('.al-cod').boundingBox(), gb = await p.locator('.al-codrow .btn').boundingBox();
check('código e "gerar código" ficam um do lado do outro (mesma linha)', cb && gb && Math.abs(cb.y - gb.y) < 12 && gb.x > cb.x + cb.width - 2, JSON.stringify([cb && cb.y, gb && gb.y]));
await p.locator('.al-cod').fill('ZZZ-999'); await p.locator('button:text-is("entrar")').click(); await sleep(700);
check('código errado: não entra e avisa', (await p.locator('.form-err').textContent()).includes('não achei') && (await p.locator('.al-entry').count()) === 1);
await p.locator('.al-cod').fill('bea-0404'); await p.locator('button:text-is("entrar")').click(); await sleep(2500);
check('código certo: entra no app', (await p.locator('.al-entry').count()) === 0 && (await p.locator('.bottom-nav, nav').count()) > 0);
check('código guardado no aparelho (1 ano)', (await p.evaluate(() => localStorage.getItem('beaterista-aluno-codigo'))) === 'BEA0404');
check('origem registrada como código de acesso', (await p.evaluate(() => localStorage.getItem('beaterista-aluno-origem'))).includes('código de acesso'));
await p.evaluate(() => { location.hash = '#/ritmo'; }); await sleep(2500);
check('já abre no Beat Hero liberado (sem cadeado)', (await p.locator('.rz-g.on b').textContent()) === 'Beat Hero' && (await p.locator('#rz-code').count()) === 0);
check('sem erros de JS', errs.length === 0, errs.join('|'));
// "gerar meu código" na primeira tela: mostra o código e manda informar a professora; entra e fica trancado até ela cadastrar
{
  const c2 = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true });
  await c2.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(valid.has(r.request().postDataJSON().p_code)) }));
  await c2.route('**/rest/v1/rpc/aluno_acesso', (r) => { const ok = valid.has(String(r.request().postDataJSON().p_code).toUpperCase()); r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ok ? { ok: true, tipo: 'turma', nome: 'Joana' } : { ok: false, motivo: 'codigo' }) }); });
  await c2.route('**/rest/v1/rpc/midis_publicos_lista', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await c2.route('**/rest/v1/rpc/aluno_visit', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }));
  const q = await c2.newPage(); const e2 = []; q.on('pageerror', (e) => e2.push(String(e)));
  await q.goto(`${url}/aluno.html`); await sleep(1500);
  await q.locator('input[aria-label="Seu nome"]').fill('Joana'); await sleep(200);
  await q.locator('button:has-text("gerar código")').click(); await sleep(300);
  const gerado = (await q.locator('.al-pedido .al-lock-code').textContent()).trim();
  check('gerar meu código: mostra o código e "informe a professora Bea"', /^[A-Z0-9]{6}$/.test(gerado) && (await q.locator('.al-pedido').textContent()).includes('informe a professora Bea'), gerado);
  await q.locator('button:has-text("entrar")').click(); await sleep(2500);
  check('entra no app mesmo sem estar liberado (modo livre)', (await q.locator('.al-entry').count()) === 0);
  await q.evaluate(() => { location.hash = '#/ranking'; }); await sleep(900);
  check('o ranking mostra o mesmo código, trancado', (await q.locator('.al-lock-code').textContent()).trim() === gerado);
  valid.add(gerado); await q.reload(); await sleep(2500); await q.evaluate(() => { location.hash = '#/ranking'; }); await sleep(900);
  check('professora cadastrou: ao abrir de novo já está liberado', (await q.locator('.al-lock').count()) === 0 && (await q.evaluate(() => localStorage.getItem('beaterista-aluno-codigo'))) === gerado);
  check('sem erros de JS', e2.length === 0, e2.join('|'));
  await c2.close();
}
await browser.close(); srv.close(); done();
