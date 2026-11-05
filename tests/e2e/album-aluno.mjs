// Álbum na área do aluno: aba "Álbum" embaixo, trancada pelo código BEA-0000 liberado pela Bea; o progresso vai pro Supabase (aqui simulado).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
const banco = { BEA0404: { nome: 'Bea (professora)', estado: null } };
const entradas = [], salvos = [];
await ctx.route('**/rest/v1/rpc/fig_entrar', async (r) => { const b = JSON.parse(r.request().postData() || '{}'); entradas.push(b); const k = banco[String(b.p_code).replace(/[^A-Za-z0-9]/g, '').toUpperCase()];
  await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(!k ? { ok: false, motivo: 'codigo' } : { ok: true, nome: k.nome, estado: k.estado }) }); });
await ctx.route('**/rest/v1/rpc/fig_salvar', async (r) => { const b = JSON.parse(r.request().postData() || '{}'); salvos.push(b); banco[b.p_code].estado = b.p_estado; await r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }); });
await ctx.route('**/*.supabase.co/**', (r) => (r.request().url().includes('/rpc/fig_') ? r.fallback() : r.abort()));
await ctx.addInitScript(() => { if (sessionStorage.getItem('ini')) return; sessionStorage.setItem('ini', '1'); try { localStorage.setItem('beaterista-aluno-nome', 'Ana'); localStorage.setItem('beaterista-aluno-origem', 'tik tok live'); } catch { /* ok */ } });
await page.goto(url + '/aluno.html#/album'); await page.waitForSelector('.fig-gate', { timeout: 10000 });
check('aba Álbum aparece embaixo', (await page.locator('nav a', { hasText: 'Álbum' }).count()) >= 1);
check('trancado: pede o código e não mostra figurinha', (await page.locator('.fig-gate-form input').count()) === 1 && (await page.locator('.lv, .fig-tabs').count()) === 0);
await page.fill('.fig-gate-form input', 'ZZZ-9999'); await page.click('.fig-gate-form button'); await sleep(900);
check('código que não existe ou foi desativado: avisa e continua trancado', (await page.textContent('.fig-gate-msg')).includes('não achei') && (await page.locator('.fig-tabs').count()) === 0);
check('manda o nome e de onde veio pro relatório da Bea', entradas.some((e) => e.p_aluno === 'Ana' && e.p_origem === 'tik tok live'), JSON.stringify(entradas[0]));
await page.fill('.fig-gate-form input', ' bea-0404 '); await page.click('.fig-gate-form button'); await page.waitForSelector('.fig-tabs', { timeout: 10000 });
check('código válido (BEA-0404 com traço e espaços): abre o álbum', (await page.locator('.lv').count()) === 1);
// abre o pacote de boas-vindas e cola: tem que ir pro Supabase sozinho
await page.getByRole('tab', { name: /pacotes/ }).click(); await page.getByRole('button', { name: 'abrir pacote' }).click(); await sleep(500);
for (const b of await page.locator('.fig-flip').all()) await b.click();
await page.getByRole('button', { name: 'colar tudo no álbum' }).click(); await sleep(1800);
const ultimo = salvos[salvos.length - 1];
check('progresso salvo sozinho no Supabase', !!ultimo && ultimo.p_code === 'BEA0404' && Object.keys(ultimo.p_estado.pasted || {}).length >= 1, JSON.stringify(salvos.length));
// outro aparelho: storage limpo, mesmo código -> traz o progresso do servidor
const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
for (const [pat, fn] of [['**/rest/v1/rpc/fig_entrar', async (r) => { const b = JSON.parse(r.request().postData() || '{}'); const k = banco[String(b.p_code)]; await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, nome: k.nome, estado: k.estado }) }); }], ['**/rest/v1/rpc/fig_salvar', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' })]]) await ctx2.route(pat, fn);
await ctx2.route('**/*.supabase.co/**', (r) => (r.request().url().includes('/rpc/fig_') ? r.fallback() : r.abort()));
const p2 = await ctx2.newPage(); await p2.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Ana'); } catch { /* ok */ } });
await p2.goto(url + '/aluno.html#/album'); await p2.waitForSelector('.fig-gate'); await p2.fill('.fig-gate-form input', 'bea 0404'); await p2.click('.fig-gate-form button'); await p2.waitForSelector('.fig-tabs', { timeout: 10000 });
const total2 = await p2.textContent('.fig-total');
check('em outro celular, o mesmo código traz o álbum de volta', /^[1-9]\d*\/125/.test(total2.trim()), total2);
await page.reload(); await page.waitForSelector('.fig-tabs', { timeout: 10000 });
check('lembra o código neste aparelho (não pede de novo)', (await page.locator('.fig-gate').count()) === 0);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
