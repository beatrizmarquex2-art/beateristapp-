// Início: os favoritos (bandas/cantores) vão pra nuvem com o código do aluno e aparecem em outro celular.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch({ codigo: false });
let nuvem = null; let envios = 0;
const rota = async (ctx) => {
  await ctx.route('**/rest/v1/rpc/*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
  await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, escopo: null }) }));
  await ctx.route('**/rest/v1/rpc/prog_ler', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, dados: nuvem }) }));
  await ctx.route('**/rest/v1/rpc/prog_salvar', (r) => { nuvem = r.request().postDataJSON().p_dados; envios++; r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }); });
};
const aparelho = async (comAlbum) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' }); await rota(ctx);
  await ctx.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Ana'); localStorage.setItem('beaterista-aluno-codigo', 'BEA0404'); localStorage.setItem('beaterista-aluno-codigo-ok', String(Date.now())); localStorage.setItem('bt-inicio', '1'); localStorage.setItem('bt-mute', '1'); } catch {} });
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(String(e).slice(0, 160))); return p;
};
// celular A: tem figurinhas, escolhe 2 favoritos
const A = await aparelho();
await A.goto(`${url}/aluno.html#/jogos`); await sleep(2500);
await A.evaluate(async () => { const D = await import('/js/figurinhas/dono.js'); const S = await import('/js/store.js'); const L = await import('/js/figurinhas/album-logic.js'); const cat = await (await fetch('assets/figurinhas/catalogo.json')).json();
  const cods = cat.filter((x) => x.secao !== 'Beaterista').slice(0, 6).map((x) => x.codigo); await S.upsert('figurinhas', D.albumId(), { ...L.emptyState(), pasted: Object.fromEntries(cods.map((k) => [k, true])) }); });
await A.goto(`${url}/aluno.html#/inicio`); await sleep(2500);
await A.locator('.in-fav').nth(0).click(); await sleep(500); await A.locator('.in-pick-it').nth(0).click(); await sleep(500);
await A.locator('.in-fav').nth(1).click(); await sleep(500); await A.locator('.in-pick-it').nth(2).click(); await sleep(1500);
const nomesA = await A.locator('.in-fav.tem small').allTextContents();
check('A escolheu 2 favoritos', nomesA.length === 2, nomesA.join(' | '));
check('subiu pra nuvem', envios > 0 && nuvem && nuvem.outros && nuvem.outros['beaterista-inicio-fav'] && nuvem.outros['beaterista-inicio-fav'].a.length === 2, JSON.stringify(nuvem && nuvem.outros && nuvem.outros['beaterista-inicio-fav']));
// celular B: sem nada guardado, mesmo código: os favoritos chegam
const B = await aparelho();
await B.goto(`${url}/aluno.html#/inicio`); await sleep(3500);
const nomesB = await B.locator('.in-fav.tem small').allTextContents();
check('B mostra os mesmos favoritos', JSON.stringify(nomesB) === JSON.stringify(nomesA), nomesB.join(' | '));
// B troca (mais recente) e A recebe depois
await B.locator('.in-fav').nth(2).click(); await sleep(500);
const sem = await B.locator('.in-pick-it').count(); check('B (sem figurinhas) vê a folha vazia com aviso, sem travar', sem === 0);
check('sem erros', A.errs.length + B.errs.length === 0, [...A.errs, ...B.errs].join(' ; '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
