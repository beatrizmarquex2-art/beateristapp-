// Álbum na área do aluno: a aba "Álbum" só abre com código de aluno (a trava é a do acesso do aluno); aberto, o progresso vai pro Supabase (simulado).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
const banco = { BEA0404: { nome: 'Bea (professora)', estado: null } };
const entradas = [], salvos = [];
const norm = (c) => String(c).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
async function mocks(c) {
  await c.route('**/rest/v1/rpc/{aluno_codigo_ok,aluno_acesso}', (r) => { const b = JSON.parse(r.request().postData() || '{}'); r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(!!banco[norm(b.p_code)]) }); });
  await c.route('**/rest/v1/rpc/fig_entrar', async (r) => { const b = JSON.parse(r.request().postData() || '{}'); entradas.push(b); const k = banco[norm(b.p_code)];
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(!k ? { ok: false, motivo: 'codigo' } : { ok: true, nome: k.nome, estado: k.estado }) }); });
  await c.route('**/rest/v1/rpc/fig_salvar', async (r) => { const b = JSON.parse(r.request().postData() || '{}'); salvos.push(b); if (banco[norm(b.p_code)]) banco[norm(b.p_code)].estado = b.p_estado; await r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }); });
  await c.route('**/*.supabase.co/**', (r) => (/\/rpc\/(fig_|aluno_codigo_ok|aluno_acesso)/.test(r.request().url()) ? r.fallback() : r.abort()));
  await c.addInitScript(() => { if (sessionStorage.getItem('ini')) return; sessionStorage.setItem('ini', '1'); try { localStorage.setItem('beaterista-aluno-nome', 'Ana'); localStorage.setItem('beaterista-aluno-origem', 'tik tok live'); } catch { /* ok */ } });
}
await mocks(ctx);
await page.goto(url + '/aluno.html#/album'); await page.waitForSelector('.al-lock', { timeout: 10000 });
check('aba Álbum aparece embaixo', (await page.locator('nav a', { hasText: 'Álbum' }).count()) >= 1);
check('sem código: trancado, sem figurinha à vista', (await page.locator('.fig-tabs, .lv').count()) === 0 && (await page.textContent('.al-lock')).includes('Álbum'));
const digitar = async (p, codigo) => { await p.locator('.al-lock-have summary').click(); await p.fill('.al-lock-have input', codigo); await p.getByRole('button', { name: 'liberar' }).click(); };
await digitar(page, 'ZZZ-9999'); await sleep(900);
check('código que não existe: avisa e continua trancado', (await page.textContent('.al-lock-msg')).includes('não achei') && (await page.locator('.fig-tabs').count()) === 0);
await page.fill('.al-lock-have input', ' bea-0404 '); await page.getByRole('button', { name: 'liberar' }).click(); await page.waitForSelector('.fig-tabs', { timeout: 10000 });
check('código válido (BEA-0404 com traço e espaços): abre o álbum direto na coleção', (await page.locator('.lv').count()) === 1);
check('manda o nome e de onde veio pro relatório da Bea', entradas.some((e) => e.p_aluno === 'Ana' && e.p_origem === 'tik tok live' && norm(e.p_code) === 'BEA0404'), JSON.stringify(entradas[0]));
await page.getByRole('tab', { name: /pacotes/ }).click(); await page.getByRole('button', { name: 'girar a roleta' }).click(); await page.locator('.sheet').getByRole('button', { name: 'girar!' }).click(); await page.waitForSelector('.fig-reveal', { timeout: 9000 }); await sleep(300);
// (a roleta já mostra as cartas abertas)
await page.getByRole('button', { name: 'colar tudo no álbum' }).click(); await sleep(1800);
const ultimo = salvos[salvos.length - 1];
check('progresso salvo sozinho no Supabase', !!ultimo && norm(ultimo.p_code) === 'BEA0404' && Object.keys(ultimo.p_estado.pasted || {}).length >= 1, String(salvos.length));
const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } }); await mocks(ctx2);
const p2 = await ctx2.newPage(); await p2.goto(url + '/aluno.html#/album'); await p2.waitForSelector('.al-lock'); await digitar(p2, 'bea 0404'); await p2.waitForSelector('.fig-tabs', { timeout: 10000 });
const total2 = await p2.textContent('.fig-total');
check('em outro celular, o mesmo código traz o álbum de volta', /^[1-9]\d*\/125/.test(total2.trim()), total2);
await page.reload(); await page.waitForSelector('.fig-tabs', { timeout: 10000 });
check('lembra o código neste aparelho (não pede de novo)', (await page.locator('.al-lock').count()) === 0);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
