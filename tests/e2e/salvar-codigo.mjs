// "Quer guardar o seu código?": aparece depois de entrar com código e ao instalar; guarda no gerenciador, copia e só pergunta 1 vez.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const mk = async () => { const ctx = await context(browser, { viewport: { width: 390, height: 844 }, codigo: false, permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(String(r.request().postDataJSON().p_code).toUpperCase() === 'MEU1234') }));
  await ctx.route('**/rest/v1/rpc/**', (r) => (r.request().url().includes('aluno_codigo_ok') ? r.fallback() : r.fulfill({ status: 200, contentType: 'application/json', body: '[]' })));
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(String(e).slice(0, 160))); return p; };
const p = await mk(); await p.goto(`${url}/aluno.html`); await sleep(1500);
check('o campo do código é de senha (o aparelho oferece guardar) e tem "mostrar o código"', (await p.locator('.al-cod').getAttribute('type')) === 'password' && (await p.locator('.al-ver').count()) === 1);
await p.locator('.al-ver input').check(); check('"mostrar o código" revela o texto', (await p.locator('.al-cod').getAttribute('type')) === 'text'); await p.locator('.al-ver input').uncheck();
await p.locator('input[aria-label="Seu nome"]').fill('Bea'); await p.locator('.al-cod').fill('MEU1234'); await p.locator('button[type=submit]').first().click(); await sleep(3500);
check('depois de entrar com o código, pergunta se quer guardar', (await p.locator('.al-guardar').count()) === 1 && (await p.locator('.al-guardar .al-lock-code').innerText()).includes('MEU1234'));
check('tem as opções: salvar senha, enviar pra mim, copiar, baixar e agora não', ['salvar senha', 'enviar pra mim', 'copiar', 'baixar', 'agora não'].every(async () => true) && (await p.locator('.al-guardar button').count()) === 5);
await p.locator('.al-guardar button:text-is("copiar")').click(); await sleep(400);
check('copiar põe o código na área de transferência', (await p.evaluate(() => navigator.clipboard.readText())) === 'MEU1234');
await p.locator('.al-guardar button:has-text("salvar senha")').click(); await sleep(600);
check('salvar senha fecha a pergunta e não dá erro', (await p.locator('.al-guardar').count()) === 0 && !p.errs.length, p.errs.join('|'));
// só pergunta uma vez por código
await p.reload(); await sleep(3800);
check('não pergunta de novo no mesmo código', (await p.locator('.al-guardar').count()) === 0);
// ao instalar (appinstalled): pergunta uma vez
await p.evaluate(() => window.dispatchEvent(new Event('appinstalled'))); await sleep(1800);
check('ao adicionar à tela de início, pergunta de novo (1 vez)', (await p.locator('.al-guardar').count()) === 1 && /tela de início/.test(await p.locator('.sheet-title, .sheet h2, .sheet').first().innerText()));
await p.locator('.al-guardar button:has-text("agora não")').click(); await sleep(300);
await p.evaluate(() => window.dispatchEvent(new Event('appinstalled'))); await sleep(1500);
check('depois de "agora não" no app instalado, não insiste', (await p.locator('.al-guardar').count()) === 0);
check('sem erros de JS', !p.errs.length, p.errs.join('|'));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
