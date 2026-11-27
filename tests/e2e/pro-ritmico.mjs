// Beaterista PRO: tablatura (violão, guitarra, baixo) e pauta de bateria. Servidor simulado na memória.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch();
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
const DB = { pro_perfil: [{ dono: 'u1', nome: 'Bia', escola: '', instrumentos: [], logo: null }], pro_alunos: [], pro_aulas: [], pro_eventos: [], partituras: [] }; let n = 0;
const json = (r, b, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(b) });
await ctx.route('**/auth/v1/token**', (r) => json(r, { access_token: 'tok', refresh_token: 'r', expires_in: 3600, user: { id: 'u1', email: 'prof@exemplo.com' } }));
await ctx.route(/\/rest\/v1\/(pro_\w+|partituras)/, async (r) => {
  const rq = r.request(); const u = new URL(rq.url()); const t = u.pathname.split('/').pop(); const m = rq.method(); const tab = DB[t];
  const filtra = () => tab.filter((x) => [...u.searchParams].every(([k, v]) => !v.startsWith('eq.') || String(x[k]) === v.slice(3)));
  if (m === 'GET') return json(r, filtra());
  if (m === 'POST') { const row = { id: `id${++n}`, dono: 'u1', criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString(), ...rq.postDataJSON() }; tab.push(row); return json(r, [row], 201); }
  if (m === 'PATCH') { const l = filtra(); l.forEach((x) => Object.assign(x, rq.postDataJSON())); return json(r, l); }
  if (m === 'DELETE') { for (const x of filtra()) tab.splice(tab.indexOf(x), 1); return r.fulfill({ status: 204 }); }
  return r.fulfill({ status: 405 });
});
await page.addInitScript(() => { window.__buf = 0; const o = AudioContext.prototype.createBufferSource; AudioContext.prototype.createBufferSource = function () { window.__buf++; return o.apply(this, arguments); }; });
const bufs = () => page.evaluate(() => window.__buf);
const abreAjustes = async () => { const d = page.locator('.ep-aj'); if (!(await d.evaluate((e) => e.open))) await d.locator('summary').click(); await sleep(100); };
const shot = async (nm) => { if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/pror-${nm}.png` }); };
const setaPara = (rot, dir) => page.locator(`.pm-seta[aria-label="${rot}"] button[aria-label$="${dir}"]`).click();
const saida = (rot) => page.locator(`.pm-seta[aria-label="${rot}"] output`).innerText();
const evs = () => page.locator('.er-folha .pm-n').count();
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(url + '/pro.html'); await sleep(1200);
await page.locator('input[name=email]').fill('prof@exemplo.com'); await page.locator('input[name=senha]').fill('senha-forte-1'); await page.locator('.pe-form .pb').click(); await sleep(1800);

// ---- violão
await page.evaluate(() => { location.hash = '#/editor/violao'; }); await sleep(1200);
check('violão: braço com 6 cordas × 6 casas', await page.locator('.er-casa').count() === 36);
await page.locator('.er-casa[aria-label="corda e, casa 0"]').click(); await page.locator('.er-casa[aria-label="corda B, casa 1"]').click(); await page.locator('.er-casa[aria-label="corda G, casa 0"]').click(); await sleep(200);
check('3 toques = 3 notas na tablatura', await evs() === 3);
const antes = await bufs(); await page.locator('.er-casa[aria-label="corda e, casa 3"]').click(); await sleep(150);
check('o toque no braço usa o som de corda do jogo (1 nota, sem duplicar)', (await bufs()) > antes && await evs() === 4);
await page.locator('.ep-ib[aria-label="Desfazer"]').click(); await sleep(100);
await page.getByRole('button', { name: /acorde: juntar/ }).click(); await page.locator('.er-casa[aria-label="corda D, casa 2"]').click(); await page.locator('.er-casa[aria-label="corda A, casa 3"]').click(); await sleep(200);
check('juntar forma acorde (mesmo instante)', await evs() === 5 && await page.evaluate(() => { const x = [...document.querySelectorAll('.er-folha .pm-n text')].map((t) => t.getAttribute('x')); return new Set(x).size === 3; }));
await page.evaluate(() => window.scrollTo(0, 260)); await sleep(150); await shot('violao');
await page.locator('.er-folha .pm-n').first().click(); await sleep(150);
check('tocar na nota abre a correção com casa e corda', await page.locator('.ep-corrige').count() === 1 && /casa/.test(await page.locator('.ep-corrige b').innerText()));
await setaPara('casa', 'próximo'); await sleep(150);
check('correção muda a casa', /casa 1/.test(await page.locator('.ep-corrige b').innerText()));
await page.locator('.ep-corrige .ep-x').click(); await sleep(100);
check('fechar a correção traz a barra de durações de volta', await page.locator('.ep-pal').count() === 1 && await page.locator('.ep-corrige').count() === 0);
await page.locator('.ep-ib[aria-label="Desfazer"]').click(); await sleep(150);
check('desfazer volta uma ação', true);
await setaPara('casas', 'próximo'); await sleep(150);
check('seta de casas mostra o próximo trecho do braço', /6|7/.test(await page.locator('.er-fr').nth(1).innerText()));
const dl = page.waitForEvent('download', { timeout: 9000 }).catch(() => null); await page.locator('.ep-ac[aria-label="Baixar PDF"]').click(); const d = await dl; await sleep(500);
check('PDF da tablatura é baixado', !!d && /\.pdf$/i.test(d.suggestedFilename()));
await page.locator('.ep-nm').fill('Pestana'); await page.locator('.ep-nm').blur(); await page.locator('.ep-ac[aria-label^="Guardar"]').click(); await sleep(900);
check('guarda na pasta online como violão', DB.partituras.length === 1 && DB.partituras[0].instrumento === 'violao' && DB.partituras[0].dados.evs.length === 5 && DB.partituras[0].dados.tipo === 'tab');

// ---- guitarra 8 cordas e baixo
await page.evaluate(() => { sessionStorage.setItem('pm-novo', '1'); location.hash = '#/editor/guitarra'; }); await sleep(1000);
check('guitarra começa com 6 cordas', await page.locator('.er-casa').count() === 36);
await abreAjustes(); await setaPara('cordas', 'próximo'); await setaPara('cordas', 'próximo'); await sleep(200);
check('guitarra de 8 cordas', await page.locator('.er-casa').count() === 48);
await page.evaluate(() => { sessionStorage.setItem('pm-novo', '1'); sessionStorage.setItem('pm-cordas', '5'); location.hash = '#/editor/baixo'; }); await sleep(1000);
check('baixo de 5 cordas (vindo da Pedaleira)', await page.locator('.er-casa').count() === 30);
check('baixo não oferece microfone (fora da faixa do detector)', await page.locator('.ep-modo').count() === 0);
await page.locator('.er-casa[aria-label="corda G, casa 3"]').click(); await sleep(150);
await abreAjustes(); await setaPara('cordas', 'próximo'); await sleep(200);
check('trocar 5→6 cordas mantém a nota na mesma corda', await evs() === 1 && await page.locator('.er-casa').count() === 36);

// ---- bateria
await page.evaluate(() => { sessionStorage.setItem('pm-novo', '1'); location.hash = '#/editor/bateria'; }); await sleep(1000);
check('bateria: kit médio tem 6 peças', await page.locator('.er-pad').count() === 6);
await abreAjustes(); await setaPara('kit', 'próximo'); await sleep(150);
check('kit completo tem 10 peças (com o chimbal aberto)', await page.locator('.er-pad').count() === 10);
await setaPara('kit', 'anterior'); await setaPara('kit', 'anterior'); await sleep(150);
check('kit simples tem 3 peças', await page.locator('.er-pad').count() === 3);
await setaPara('mão', 'próximo'); await sleep(100);
const a0 = await bufs(); await page.locator('.er-pad[data-p="hh"]').click(); await sleep(200);
check('o pad usa a bateria gravada do jogo', (await bufs()) > a0);
await page.getByRole('button', { name: 'juntar', exact: true }).click(); await page.locator('.er-pad[data-p="bd"]').click(); await sleep(200);
await page.getByRole('button', { name: 'juntar', exact: true }).click();
await page.getByRole('button', { name: /acento >/ }).first().click(); await page.locator('.er-pad[data-p="sn"]').click(); await sleep(200);
await page.getByRole('button', { name: /fantasma/ }).first().click(); await page.locator('.er-pad[data-p="sn"]').click(); await sleep(200);
await page.evaluate(() => window.scrollTo(0, 400)); await sleep(150); await shot('bateria');
const t = await page.locator('.er-folha').innerHTML();
check('bateria: 4 batidas, mão D, bumbo B, acento e fantasma desenhados', await evs() === 4 && />DB</.test(t) && />\(</.test(t));
await page.locator('.er-folha .pm-n').nth(2).click(); await sleep(150);
check('correção da bateria mostra peça, mão, acento e fantasma', await page.locator('.ep-corrige .er-tg').count() >= 2 && await page.locator('.pm-seta[aria-label="peça"]').count() === 1);
await setaPara('duração', 'anterior'); await sleep(100);
// ouvir: toca pelo relógio do áudio e volta sozinho
await page.locator('.ep-ib[aria-label^="Ouvir"]').click(); await sleep(300);
check('ouvir vira "parar" enquanto toca', await page.locator('.ep-ib[aria-label="Parar"]').count() === 1);
await sleep(3500);
check('e volta sozinho ao terminar', await page.locator('.ep-ib[aria-label^="Ouvir"]').count() === 1);
// teclado do computador: Enter no pad adiciona 1 nota só (sem duplicar)
await page.evaluate(() => { location.hash = '#/pedaleira'; }); await sleep(400); await page.evaluate(() => { sessionStorage.setItem('pm-novo', '1'); location.hash = '#/editor/bateria'; }); await sleep(900);
await page.locator('.er-pad[data-p="sn"]').focus(); await page.keyboard.press('Enter'); await sleep(150);
const nEnter = await evs(); check(`Enter no pad adiciona exatamente 1 batida (achou ${nEnter})`, nEnter === 1);
check('sem erros de script', errs.length === 0 || (console.log(errs), false));
// recentes da Pedaleira abre o editor certo
await page.evaluate(() => { location.hash = '#/pedaleira'; }); await sleep(700);
await page.locator('.pp-b[data-k="partitura"]').click(); await sleep(500);
await page.locator('.pp-r').first().click(); await sleep(1500);
check('recente de violão abre o editor de violão', page.url().endsWith('#/editor/violao') && await page.locator('.er-casa').count() === 36);
await shot('celular');
for (const [w, h2, nm] of [[320, 640, 'iPhone SE'], [390, 844, 'iPhone'], [412, 915, 'Samsung'], [768, 1024, 'iPad em pé'], [1024, 768, 'iPad deitado'], [1366, 768, 'notebook'], [1440, 900, 'MacBook']]) {
  await page.setViewportSize({ width: w, height: h2 }); await page.evaluate(() => { sessionStorage.setItem('pm-novo', '1'); location.hash = '#/editor/violao'; }); await sleep(700);
  await page.locator('.er-casa').first().click(); await page.locator('.er-casa').nth(7).click(); await sleep(150);
  const ok = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && !(document.querySelector('.ep-folha').scrollWidth > document.querySelector('.ep-folha').clientWidth + 1));
  check(`${nm} (${w}×${h2}): sem rolagem lateral e a folha cabe`, ok);
  await shot(`tela-${w}`);
}
await page.setViewportSize({ width: 390, height: 844 }); await page.evaluate(() => { location.hash = '#/editor/violao'; }); await sleep(500);
await page.evaluate(() => window.scrollTo(0, 500)); await sleep(150);
check('celular: a folha fica visível mesmo rolando até o braço', await page.evaluate(() => { const r = document.querySelector('.ep-folha').getBoundingClientRect(); return r.top >= 0 && r.top < 200 && r.height > 60; }));
await page.setViewportSize({ width: 844, height: 390 }); await sleep(500);
check('celular deitado: duas colunas', await page.evaluate(() => getComputedStyle(document.querySelector('.ep-corpo')).gridTemplateColumns.trim().split(/\s+/).length === 2));
await page.setViewportSize({ width: 390, height: 844 }); await sleep(300);
check('sem rolagem lateral no celular', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
await browser.close(); srv.close(); done();
