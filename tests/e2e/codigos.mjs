// Importar código de aluno (app da Bea): botão no menu dos dois perfis, colar lista, gerar códigos, tabela atualizada. Supabase simulado.
import { serve, launch, sleep, check, done, fakeLogin } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
const db = []; // alunos_codigos simulado
await fakeLogin(ctx, page, url);
await ctx.unroute('**/*.supabase.co/**');
await ctx.route('**/rest/v1/alunos_codigos**', async (r) => {
  const req = r.request(); const m = req.method();
  if (m === 'GET') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(db.map((x) => ({ ...x }))) });
  if (m === 'POST') { for (const x of req.postDataJSON()) { const i = db.findIndex((y) => y.code === x.code); const row = { code: x.code, nome: x.nome, ativo: true, usos: i >= 0 ? db[i].usos : 0, criado_em: new Date().toISOString(), ultimo_uso: null }; if (i >= 0) db[i] = row; else db.push(row); } return r.fulfill({ status: 201, body: '' }); }
  if (m === 'PATCH') { const code = new URL(req.url()).searchParams.get('code').replace('eq.', ''); const i = db.findIndex((y) => y.code === code); if (i >= 0) Object.assign(db[i], req.postDataJSON()); return r.fulfill({ status: 204, body: '' }); }
  if (m === 'DELETE') { const code = new URL(req.url()).searchParams.get('code').replace('eq.', ''); const i = db.findIndex((y) => y.code === code); if (i >= 0) db.splice(i, 1); return r.fulfill({ status: 204, body: '' }); }
  return r.continue();
});
await page.evaluate(() => { location.hash = '#/codigos'; }); await sleep(1200);
check('a tela abre', (await page.locator('#view .banner, #view h1, #view h2').count()) > 0 && (await page.locator('.cod-ta').count()) === 1);
await page.locator('.cod-ta').fill('Maria Souza ; K7M2QX\nJoão Pedro\nAna Lima\tHQ9ZT4\nCarlos'); await page.locator('button:has-text("importar")').first().click(); await sleep(1200);
check('importou os 4 alunos', db.length === 4, String(db.length));
check('os 2 com código ficaram com o código que ela mandou', db.find((x) => x.nome === 'Maria Souza').code === 'K7M2QX' && db.find((x) => x.nome === 'Ana Lima').code === 'HQ9ZT4');
check('quem veio só com o nome ganhou código aleatório de 6', /^[A-Z0-9]{6}$/.test(db.find((x) => x.nome === 'Carlos').code));
check('mostra a tabela atualizada', (await page.locator('.cod-tbl').count()) >= 1 && (await page.locator('.cod-tbl tbody tr').count()) >= 4);
await page.locator('.cod-qtd').fill('3'); await page.locator('button:has-text("gerar")').click(); await sleep(1200);
check('gerou 3 códigos novos (7 no total, todos diferentes)', db.length === 7 && new Set(db.map((x) => x.code)).size === 7, String(db.length));
await page.locator('.cod-act button:has-text("desativar")').first().click(); await sleep(900);
check('desativar funciona', db.some((x) => x.ativo === false));
await page.evaluate(() => { navigator.clipboard.writeText = (t) => { window.__copied = t; return Promise.resolve(); }; }); await page.locator('button:has-text("copiar tabela")').click(); await sleep(300);
const copied = await page.evaluate(() => window.__copied || '');
check('copiar tabela: cabeçalho nome/código e uma linha por aluno', copied.startsWith('nome\tcódigo\tativo\tusos') && copied.split('\n').length === 8, copied.split('\n').length + ' linhas');
// botão no menu dos dois perfis
for (const sp of ['bea', 'beaterista']) {
  await page.evaluate((s) => { localStorage.setItem('bt-space', s); }, sp); await page.evaluate(() => { location.hash = '#/inicio'; }); await page.reload(); await sleep(1200);
  await page.locator('button[aria-label*="enu"], .menu-btn, #menu-btn').first().click().catch(() => {}); await sleep(500);
  const tabAulas = page.locator('.drawer-tab:has-text("aulas")'); if (await tabAulas.count()) { await tabAulas.first().click(); await sleep(300); }
  const has = await page.locator('.drawer a:has-text("Importar código de aluno")').count();
  check(`menu (${sp}) tem "Importar código de aluno"`, has >= 1, String(has));
}
check('sem erros de JS', errs.length === 0, errs.slice(0, 2).join(' | '));
await browser.close(); srv.close(); done();
