// Primeira tela do aluno: Nome + "escolha uma opção" (com CÓDIGO DE ACESSO). Código certo libera o Beat Hero e as Músicas MIDI. Supabase simulado.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true }); const valid = new Set(['BEA0404']);
await ctx.route('**/rest/v1/rpc/{aluno_codigo_ok,aluno_acesso}', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(valid.has(r.request().postDataJSON().p_code)) }));
await ctx.route('**/rest/v1/rpc/midis_publicos_lista', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await ctx.route('**/rest/v1/rpc/aluno_visit', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }));
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.goto(`${url}/aluno.html`); await sleep(1500);
const opts = await p.locator('select option').allTextContents();
check('a lista tem "CÓDIGO DE ACESSO"', opts.includes('CÓDIGO DE ACESSO'), opts.join(' | '));
check('o campo do código só aparece quando escolhe essa opção', (await p.locator('.al-cod').isHidden()));
await p.locator('input[aria-label="Seu nome"]').fill('Maria'); await p.locator('select').selectOption('codigo'); await sleep(200);
check('escolheu a opção: aparece o campo do código', await p.locator('.al-cod').isVisible());
await p.locator('button:has-text("entrar")').click(); await sleep(400);
check('sem digitar o código: avisa', (await p.locator('.form-err').textContent()).includes('digite'));
await p.locator('.al-cod').fill('ZZZ-999'); await p.locator('button:has-text("entrar")').click(); await sleep(700);
check('código errado: não entra e avisa', (await p.locator('.form-err').textContent()).includes('não achei') && (await p.locator('.al-entry').count()) === 1);
await p.locator('.al-cod').fill('bea-0404'); await p.locator('button:has-text("entrar")').click(); await sleep(2500);
check('código certo: entra no app', (await p.locator('.al-entry').count()) === 0 && (await p.locator('.bottom-nav, nav').count()) > 0);
check('código guardado no aparelho (1 ano)', (await p.evaluate(() => localStorage.getItem('beaterista-aluno-codigo'))) === 'BEA0404');
check('origem registrada como código de acesso', (await p.evaluate(() => localStorage.getItem('beaterista-aluno-origem'))).includes('código de acesso'));
await p.evaluate(() => { location.hash = '#/ritmo'; }); await sleep(2500);
check('já abre no Beat Hero liberado (sem cadeado)', (await p.locator('.rz-g.on b').textContent()) === 'Beat Hero' && (await p.locator('#rz-code').count()) === 0);
check('sem erros de JS', errs.length === 0, errs.join('|'));
// "gerar meu código" na primeira tela: mostra o código e manda informar a professora; entra e fica trancado até ela cadastrar
{
  const c2 = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true });
  await c2.route('**/rest/v1/rpc/{aluno_codigo_ok,aluno_acesso}', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(valid.has(r.request().postDataJSON().p_code)) }));
  await c2.route('**/rest/v1/rpc/midis_publicos_lista', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await c2.route('**/rest/v1/rpc/aluno_visit', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }));
  const q = await c2.newPage(); const e2 = []; q.on('pageerror', (e) => e2.push(String(e)));
  await q.goto(`${url}/aluno.html`); await sleep(1500);
  await q.locator('input[aria-label="Seu nome"]').fill('Joana'); await q.locator('select').selectOption('codigo'); await sleep(200);
  await q.locator('button:has-text("gerar meu código")').click(); await sleep(300);
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
