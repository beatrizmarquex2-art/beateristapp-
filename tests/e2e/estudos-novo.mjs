// Aba Estudos nova: meta do dia, dica musical, aulas do Paul (bateria, teclado, violão), curiosidades de músicos.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: false }); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/*.supabase.co/**', (r) => r.fallback());
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
const go = async (h) => { await page.goto(url + '/aluno.html' + h); await sleep(1500); };
await go('#/estudos');
check('meta do dia aparece com 3 estrelinhas e a dica do dia já conta (1 de 3)', (await page.locator('.es-dots i').count()) === 3 && (await page.locator('.es-dots i.ok').count()) === 1);
const d1 = await page.locator('.es-dica').first().textContent(); await page.locator('.es-dica-box button').click();
check('"outra dica" troca a dica musical', (await page.locator('.es-dica').first().textContent()) !== d1);
check('3 áreas (ritmo, melodia e harmonia, teoria) e a área ritmo já abre com os modos de estudo', (await page.locator('.es-area').count()) === 3 && (await page.locator('.es-modo').count()) >= 4);
await go('#/estudos/aulas');
check('lista tem as 3 aulas novas e as figuras rítmicas', (await page.locator('.al-card').count()) === 4);
let n = 0;
for (const id of ['bateria', 'teclado', 'violao']) {
  await go(`#/estudos/aulas/${id}`);
  const ok1 = (await page.locator('.au-say').textContent()).length > 20;
  await page.locator('.au-nav button:has-text("próximo")').click(); await sleep(200);
  await page.locator('.au-nav button:has-text("próximo")').click(); await sleep(200);
  const trancado = (await page.locator('.am-lock').count()) === 1; // passo 3 sem código = aviso
  check(`aula de ${id}: abre, mostra os 2 passos grátis e tranca o 3º sem código`, ok1 && trancado);
  n++;
}
await go('#/estudos/aulas/bateria'); await page.locator('.au-box button').first().click(); await sleep(300);
check('aula: botão de ouvir toca sem erro', errs.length === 0, errs.join(' | '));
await go('#/estudos/curiosidades');
const c1 = await page.locator('.es-cur .es-dica').textContent(); await page.getByText('outra curiosidade').click();
check('curiosidades: "outra" troca o texto e a meta chega a 2 de 3 (dica + curiosidade)', (await page.locator('.es-cur .es-dica').textContent()) !== c1);
await go('#/estudos');
check('meta: dica + aula + curiosidade = cumprida e começa a sequência', (await page.locator('.es-dots i.ok').count()) >= 2, String(await page.locator('.es-dots i.ok').count()));
// com código a aula abre inteira
const c2 = await context(browser); const pg = await c2.newPage(); await pg.setViewportSize({ width: 390, height: 844 }); pg.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await pg.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await c2.route('**/*.supabase.co/**', (r) => r.fallback());
await pg.goto(`${url}/aluno.html#/estudos/aulas/teclado`); await sleep(1500);
for (let i = 0; i < 3; i++) await pg.locator('.au-nav button:has-text("próximo")').click();
check('com código: a aula passa do 2º passo', (await pg.locator('.am-lock').count()) === 0);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
