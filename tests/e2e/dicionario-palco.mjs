// Dicionário do app (área do aluno) com os 75 termos novos de banda, estúdio e jeito de falar: filtro, busca e a frase de exemplo.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/*.supabase.co/**', (r) => r.abort());
await ctx.addInitScript(() => { try { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', '1'); localStorage.setItem('beaterista-aluno-nome', 'Ana'); localStorage.setItem('beaterista-aluno-codigo', 'ANA123'); } } catch { /* sem storage */ } });
await page.goto(url + '/aluno.html#/dicionario'); await page.waitForSelector('.dc-list', { timeout: 10000 });
await page.evaluate(async () => { (await import('/js/acesso.js')).definir(true); }); await sleep(500); await page.getByRole('button', { name: 'agora não' }).click({ timeout: 3000 }).catch(() => {}); await sleep(300); // simula o aluno com código liberado (a validação real vai ao Supabase)
const chips = await page.locator('.lib-tab').allTextContents();
check('os 3 grupos novos viram temas do dicionário', ['banda e palco', 'estúdio e equipamento', 'como o músico fala'].every((n) => chips.includes(n)), chips.join('|'));
await page.getByRole('radio', { name: 'banda e palco' }).click(); await sleep(300);
check('o tema "banda e palco" mostra 24 termos', (await page.locator('.dc-term').count()) === 24);
await page.fill('input[type=search]', 'setlist'); await sleep(300);
check('a busca acha "setlist"', (await page.locator('.dc-term strong', { hasText: 'setlist' }).count()) >= 1);
await page.locator('.dc-term .dc-head').first().click(); await sleep(300);
check('abre com a frase de exemplo', /setlist de hoje/.test(await page.locator('.dc-term.open').first().innerText()));
check('sem erro de JS', errs.length === 0, errs.join(' | '));
await page.locator('.dc-term.open').first().screenshot({ path: process.env.SHOT || '/tmp/dicionario-palco.png' });
await browser.close(); srv.close(); done();
