// PRO no tamanho de iPhone (390×844 e iPhone SE 375×667), toque, sem rolagem lateral, alvos de toque e erros. É Chromium emulando iPhone, não o Safari de verdade.
import { serve, launch, sleep, check, done } from './harness.mjs';
import { exerciciosIniciais } from '../../js/pro/banco-seed.js';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 }, ua: UA });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200))); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 160)); });
const json = (r, b, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(b) });
const ex = exerciciosIniciais().slice(0, 40).map((e, i) => ({ id: `e${i}`, ...e, publicado: true, criado_em: '2026-01-01T00:00:00Z' }));
await ctx.route('**/auth/v1/token**', (r) => json(r, { access_token: 'tok', refresh_token: 'r', expires_in: 3600, user: { id: 'u1', email: 'bea@exemplo.com' } }));
await ctx.route('**/rest/v1/rpc/is_allowed', (r) => json(r, false));
await ctx.route(/\/rest\/v1\/(pro_\w+|partituras)/, (r) => { const u = r.request().url(); json(r, r.request().method() !== 'GET' ? [] : u.includes('pro_perfil') ? [{ dono: 'u1', nome: 'Bia', escola: '', instrumentos: [], logo: null }] : u.includes('pro_exercicios') ? ex : []); });
const shot = (n) => page.screenshot({ path: `/tmp/shots/iph/${n}.png` });
const semLateral = async (nome) => check(`${nome}: sem rolagem lateral`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), await page.evaluate(() => `${document.documentElement.scrollWidth} > ${innerWidth}`));
const pequenos = async (nome) => { const l = await page.evaluate(() => [...document.querySelectorAll('a,button,select,input,[role=tab]')].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && (r.height < 32 || r.width < 32) && !e.closest('svg') && !/♯/.test(e.getAttribute('aria-label') || '') && e.offsetParent !== null; }).map((e) => `${(e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 24)} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`).slice(0, 6)); check(`${nome}: alvos de toque com pelo menos 32 px`, l.length === 0, l.join(' | ')); };
await page.goto(url + '/pro.html'); await sleep(1200);
await shot('login'); await semLateral('login');
await page.locator('input[name=email]').fill('bea@exemplo.com'); await page.locator('input[name=senha]').fill('senha-forte-1'); await page.locator('.pe-form .pb').click(); await sleep(2000);
for (const [rota, nome] of [['#/inicio', 'início'], ['#/estudio', 'estúdio'], ['#/arsenal', 'arsenal'], ['#/biblioteca', 'pastas'], ['#/transcrever', 'áudio'], ['#/pedaleira', 'pedaleira'], ['#/editor', 'teclado'], ['#/editor/bateria', 'bateria'], ['#/editor/violao', 'violão']]) {
  await page.evaluate((r) => { location.hash = r; }, rota); await sleep(1100); await shot(nome); await semLateral(nome); await pequenos(nome);
}
await page.evaluate(() => { location.hash = '#/inicio'; }); await sleep(600);
await page.locator('.pbar .pbar-mais').click(); await sleep(400); check('menu "Mais" abre o menu lateral no iPhone', await page.locator('.psh.aberto').count() === 1); await shot('menu');
check('sem erros de script', errs.length === 0 || (console.log(errs), false));
await browser.close(); srv.close(); done();
