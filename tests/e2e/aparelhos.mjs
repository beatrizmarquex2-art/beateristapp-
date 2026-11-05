// Aparelhos: iPhone, iPad e Samsung (Android). Emulação do Chromium com o tamanho, o toque e o navegador de cada um.
// Confere: modo certo (apple/lite), nada vazando pro lado, telas principais sem erro, ritmo jogando, pausa/continua e stop abrindo.
import { createRequire } from 'node:module';
import { serve, sleep, check, done } from './harness.mjs';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const { srv, url } = await serve();
const browser = await chromium.launch();
const LIST = [['iPhone 13', 'apple'], ['iPhone SE', 'apple'], ['iPad (gen 7)', 'apple'], ['iPad Pro 11', 'apple'], ['Galaxy S9+', 'lite'], ['Galaxy S8', 'lite'], ['Galaxy Tab S4', 'lite'], ['Pixel 5', 'lite']];
const ROUTES = ['#/jogos', '#/ritmo', '#/jogos/stop', '#/jogos/velha', '#/jogos/cartas', '#/jogos/bingo', '#/kids/memoria', '#/ranking'];
for (const [name, mode] of LIST) {
  const d = devices[name]; const ctx = await browser.newContext({ ...d }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); });
  await p.goto(`${url}/aluno.html#/jogos`); await sleep(1300);
  const cls = await p.evaluate(() => document.documentElement.classList.contains('apple') ? 'apple' : document.documentElement.classList.contains('lite') ? 'lite' : '?');
  check(`[${name}] modo ${mode}`, cls === mode, cls);
  const bars = await p.evaluate(() => !!document.querySelector('.scroll-track'));
  check(`[${name}] barra de rolagem falsa só no iPhone/iPad`, bars === (mode === 'apple'), String(bars));
  const wide = [];
  for (const r of ROUTES) {
    await p.goto(`${url}/aluno.html${r}`); await sleep(900);
    const w = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    if (w.sw > w.iw + 1) wide.push(`${r}:${w.sw}>${w.iw}`);
  }
  check(`[${name}] nada vaza pro lado em ${ROUTES.length} telas`, wide.length === 0, wide.join(' '));
  // ritmo: abre, joga, pausa e continua
  await p.goto(`${url}/aluno.html#/ritmo`); await sleep(1200);
  check(`[${name}] menu de ritmo tem os 2 jogos e o JOGAR`, (await p.locator('.rz-two .rz-g').count()) === 2 && (await p.locator('.rz-jogar').count()) === 1);
  await p.locator('.rz-jogar').tap(); await sleep(3200);
  check(`[${name}] ritmo jogando (pista e 4 teclas)`, (await p.locator('#rz-cv').count()) === 1 && (await p.locator('.rz-pad').count()) >= 3, String(await p.locator('.rz-pad').count()));
  await p.locator('#rz-pause').tap(); await sleep(400); const t1 = await p.locator('#rz-pause').textContent();
  await p.locator('#rz-pause').tap(); await sleep(3300); const t2 = await p.locator('#rz-pause').textContent();
  check(`[${name}] pausar e continuar com contagem`, t1.includes('Continuar') && t2.includes('Pausar'), `${t1}/${t2}`);
  const ov = await p.evaluate(() => { const cv = document.querySelector('#rz-cv'); const r = cv.getBoundingClientRect(); return r.right <= innerWidth + 1 && r.left >= -1; });
  check(`[${name}] pista cabe na tela`, ov);
  // stop abre e sorteia
  await p.goto(`${url}/aluno.html#/jogos/stop`); await sleep(1200);
  const vis = await p.evaluate(() => { const b = document.querySelector('.st-play').getBoundingClientRect(); return b.bottom <= innerHeight - 76; });
  check(`[${name}] STOP: botão JOGAR aparece sem rolar`, vis);
  await p.locator('button:has-text("JOGAR")').evaluate((el) => el.click()); await sleep(300);
  check(`[${name}] STOP: 12 categorias`, (await p.locator('.st-cat').count()) === 12);
  await p.screenshot({ path: process.env.SHOTS ? `${process.env.SHOTS}/${name.replace(/[^a-z0-9]/gi, '_')}-stop.png` : '/dev/null' }).catch(() => {});
  check(`[${name}] sem erros de JS`, errs.length === 0, errs.slice(0, 2).join(' | '));
  await ctx.close();
}
await browser.close(); srv.close(); done();
