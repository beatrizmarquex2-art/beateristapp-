// Aba Códigos da Bea: barra de baixo (Início · Ritmos · Estudos · Códigos · Alunos), card de novo código (tipo, tempo, nome, ativado) e lista com busca/filtros.
import { serve, launch, sleep, check, done, fakeLogin } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
const db = [
  { code: 'AAAA11', nome: 'Maria', ativo: true, usos: 3, criado_em: '2026-11-01T10:00:00Z', ultimo_uso: null, expira_em: '2026-12-01T10:00:00Z', tipo: 'passe', dias: 30, jogos: null, categoria: 'aluno', iniciado_em: '2026-11-01T10:00:00Z' },
  { code: 'BBBB22', nome: 'Loja Nagano', ativo: false, usos: 0, criado_em: '2026-11-02T10:00:00Z', ultimo_uso: null, expira_em: null, tipo: 'passe', dias: 7, jogos: null, categoria: 'marca', iniciado_em: null },
  { code: 'CCCC33', nome: 'João amigo', ativo: true, usos: 1, criado_em: '2026-11-03T10:00:00Z', ultimo_uso: null, expira_em: null, tipo: 'passe', dias: 1, jogos: null, categoria: 'amigo', iniciado_em: null },
];
const posts = []; const patches = [];
await fakeLogin(ctx, page, url);
await ctx.route('**/rest/v1/alunos_codigos**', async (r) => { const m = r.request().method();
  if (m === 'GET') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(db) });
  if (m === 'POST') { posts.push(JSON.parse(r.request().postData() || '{}')); return r.fulfill({ status: 201, body: '' }); }
  if (m === 'PATCH') { patches.push({ url: r.request().url(), body: JSON.parse(r.request().postData() || '{}') }); return r.fulfill({ status: 204, body: '' }); }
  return r.fulfill({ status: 200, body: '[]' }); });
await page.evaluate(() => { location.hash = '#/codigos'; }); await sleep(2200);
const nav = await page.evaluate(() => [...document.querySelectorAll('nav a, .nav a, [role=navigation] a')].map((a) => a.textContent.trim()).filter(Boolean));
check('barra de baixo: Início, Ritmos, Estudos, Códigos, Alunos', ['Início', 'Ritmos', 'Estudos', 'Códigos', 'Alunos'].every((t) => nav.some((n) => n.includes(t))) && !nav.some((n) => /Jogos|Criar ritmos/.test(n)), nav.join(' | '));
const txt = await page.evaluate(() => document.body.innerText);
check('card "novo código" com código automático (6 caracteres)', /novo código/i.test(txt) && (await page.evaluate(() => /^[A-Z0-9]{6}$/.test(document.querySelector('.cod-big')?.textContent || ''))));
check('tipos e tempos pedidos', await page.evaluate(() => { const o = (l) => [...document.querySelectorAll(`[aria-label="${l}"] button`)].map((x) => x.textContent); return ['Alunos', 'Amigos', 'Marcas', 'Outros'].join() === o('Tipo do código').join() && ['1 dia', '3 dias', '7 dias', '1 mês', '3 meses', '6 meses', '1 ano'].join() === o('Tempo de acesso').join(); }));
check('lista dos 3 códigos', (await page.locator('.cod-item').count()) === 3);
await page.fill('input[aria-label="Procurar código"]', 'nagano'); await sleep(200);
check('busca por nome', (await page.locator('.cod-item').count()) === 1);
await page.fill('input[aria-label="Procurar código"]', ''); await page.selectOption('select[aria-label="Filtrar por tipo"]', 'amigo'); await sleep(200);
check('filtro por tipo (amigos)', (await page.locator('.cod-item').count()) === 1 && /João/.test(await page.textContent('.cod-lista')));
await page.selectOption('select[aria-label="Filtrar por tipo"]', ''); await page.selectOption('select[aria-label="Filtrar por situação"]', 'off'); await sleep(200);
check('filtro por situação (desativados)', (await page.locator('.cod-item').count()) === 1 && /Nagano/.test(await page.textContent('.cod-lista')));
await page.selectOption('select[aria-label="Filtrar por situação"]', ''); await page.selectOption('select[aria-label="Filtrar por tempo"]', '7'); await sleep(200);
check('filtro por tempo (7 dias)', (await page.locator('.cod-item').count()) === 1);
await page.selectOption('select[aria-label="Filtrar por tempo"]', '');
await page.click('button[data-tipo="marca"]'); await page.click('button[data-tempo="90"]'); await page.fill('input[aria-label="Nome"]', 'Spark'); await page.click('button[aria-label="Importar código"]'); await sleep(200);
await page.click('.cod-abas-btn'); await sleep(200);
check('menu de abas: Todas as Abas, Jogos, Estudos, Palco, Álbum', (await page.locator('.cod-aba').allTextContents()).map((t) => t.trim()).join('|') === 'Todas as abas|Jogos|Estudos|Palco|Álbum');
await page.locator('.cod-aba input[data-aba="jogos"]').check(); await sleep(150); await page.locator('.cod-aba input[data-aba="tocar"]').check(); await sleep(150);
check('marcar mais de uma aba desmarca "Todas as abas" e o resumo lista as escolhidas', /Jogos, Palco/.test(await page.textContent('.cod-abas-btn')) && !(await page.locator('.cod-aba input[data-aba="todas"]').isChecked()));
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /copiar código/.test(b.textContent)).click()); await sleep(900);
check('copiar código salva: tipo marca, 90 dias, nome, desativado, passe de 2 aparelhos', posts.length === 1 && posts[0].categoria === 'marca' && posts[0].dias === 90 && posts[0].nome === 'Spark' && posts[0].ativo === false && posts[0].tipo === 'passe' && Array.isArray(posts[0].jogos) && posts[0].jogos.includes('#/jogos') && posts[0].jogos.includes('#/tocar') && !posts[0].jogos.includes('#/estudos') && /^[A-Z0-9]{6}$/.test(posts[0].code), JSON.stringify(posts[0]));
await page.evaluate(() => [...document.querySelectorAll('.cod-item')].find((i) => /Maria/.test(i.textContent)).querySelector('button[role=switch]').click()); await sleep(700);
check('desativar manda ativo=false', patches.some((p) => p.body.ativo === false && /AAAA11/.test(p.url)), JSON.stringify(patches));
await page.evaluate(() => [...document.querySelectorAll('.cod-item')].find((i) => /Maria/.test(i.textContent)).querySelectorAll('button:not([role=switch])')[1].click()); await sleep(500);
await page.selectOption('.sheet-body select', '180'); await page.evaluate(() => [...document.querySelectorAll('.sheet-body button')].find((b) => /salvar/.test(b.textContent)).click()); await sleep(800);
check('mudar tempo (já usado): dias=180 e nova validade', patches.some((p) => p.body.dias === 180 && !!p.body.expira_em), JSON.stringify(patches.slice(-1)));
await page.screenshot({ path: process.env.SHOTS ? `${process.env.SHOTS}/codigos.png` : '/tmp/codigos.png', fullPage: false });
check('sem erro na página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
