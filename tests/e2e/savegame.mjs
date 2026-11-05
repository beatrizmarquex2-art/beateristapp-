// Save game do álbum: código BEA-0000 (servidor simulado) + código longo de reserva.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
// Supabase simulado: guarda por código, juntando como o SQL
const db = new Map(); let n = 41;
await ctx.route('**/rest/v1/rpc/album_*', async (route) => {
  const req = route.request(); const fn = req.url().split('/').pop(); const b = JSON.parse(req.postData() || '{}');
  const ok = (j) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(j) });
  if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
  if (fn === 'album_ler') return ok(db.get((b.p_code || '').toUpperCase()) || null);
  const code = b.p_code || `BEA-${String(++n).padStart(4, '0')}`;
  const old = db.get(code); db.set(code, old ? { ...b.p_dados, a: [...new Set([...old.a, ...b.p_dados.a])] } : b.p_dados);
  return ok([{ code, dados: db.get(code) }]);
});
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); });
await page.goto(url + '/aluno.html#/kids');
await page.waitForSelector('.kx-g, .kx-cards');
const open = async () => { await sleep(500); await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /salvar \/ recuperar/.test(b.textContent)).click()); await sleep(500); };
await page.evaluate(() => { location.hash = '#/kids/album'; }); await sleep(600);
await open();
await page.click('text=gerar meu código'); await sleep(800);
const code = await page.textContent('.kx-bigcode');
check('gera código BEA-0042', code === 'BEA-0042', code);
check('servidor guardou', db.has('BEA-0042'));
// outro celular: apaga o progresso local e recupera pelo código
db.get('BEA-0042').a = ['john-bonham'];
await page.keyboard.press('Escape'); await sleep(500);
await open();
await page.fill('.sheet input', '0042'); await page.click('.sheet button:text-is("recuperar")'); await sleep(700);
check('pergunta se é o álbum certo', /é o álbum de Teste/.test(await page.textContent('body')));
await page.click('button:text-is("é meu")'); await sleep(900);
check('recuperou a figurinha do servidor', /1 figurinhas/.test(await page.textContent('#toasts')));
await open();
await page.fill('.sheet input', '9999'); await page.click('.sheet button:text-is("recuperar")'); await sleep(500);
check('código que não existe é recusado', /não achei esse código/.test(await page.textContent('#toasts')));
check('sem erros de JS', errs.length === 0, errs.join('|'));
await browser.close(); srv.close && srv.close(); done();
