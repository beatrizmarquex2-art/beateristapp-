// Uno Musical em perfis de iPhone, iPad e Samsung/Android (emulação do Chromium): cabe na tela, leque visível, joga e termina sem erro.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
import { createRequire } from 'node:module';
const { devices } = createRequire(import.meta.url)('playwright');
const { srv, url } = await serve(); const { browser } = await launch();
const PERFIS = ['iPhone SE', 'iPhone 14 Pro Max', 'iPad (gen 7)', 'iPad (gen 7) landscape', 'iPad Pro 11', 'Galaxy S9+', 'Galaxy S8 landscape', 'Pixel 7', 'Galaxy Tab S4'];
for (const nome of PERFIS) {
  const d = devices[nome]; if (!d) { console.log('sem perfil', nome); continue; }
  const { defaultBrowserType, ...o } = d; const ctx = await context(browser, o); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); });
  await p.goto(`${url}/aluno.html#/jogos/cartas/livre`); await sleep(1200);
  const j = p.locator('button:has-text("JOGAR")'); if (await j.count()) { await j.click(); await sleep(300); }
  await p.locator('.jg-seg').nth(1).locator('button', { hasText: '2' }).click(); await p.locator('button:has-text("iniciar")').click(); await sleep(4200);
  const m = await p.evaluate(() => { const vw = innerWidth, vh = innerHeight; const st = document.querySelector('.cx-stage').getBoundingClientRect();
    const out = [...document.querySelectorAll('.cx-hc .cx-card')].filter((e) => { const r = e.getBoundingClientRect(); return r.left < st.left - 1 || r.right > st.right + 1 || r.bottom > st.bottom + 1; }).length;
    return { hs: document.documentElement.scrollWidth > vw + 1, out, stH: Math.round(st.height), vh, lite: document.documentElement.classList.contains('lite'), cards: document.querySelectorAll('.cx-hc').length }; });
  check(`[${nome}] 7 cartas, todas visíveis, sem rolagem lateral`, m.cards >= 7 && m.out === 0 && !m.hs, JSON.stringify(m));
  for (let i = 0; i < 40 && !(await p.locator('.cx-result').count()); i++) {
    if (await p.locator('.cx-pick').count()) await p.locator('.cx-pc').first().click({ force: true }).catch(() => {});
    else if (await p.locator('.cx-uno').count()) await p.locator('.cx-uno').click({ force: true, timeout: 2000 }).catch(() => {});
    else if (await p.locator('.cx-hc.fit').count()) await p.locator('.cx-hc.fit').first().tap({ position: { x: 6, y: 30 }, force: true }).catch(() => {});
    else if (await p.locator('.cx-deck:not([disabled])').count()) await p.locator('.cx-deck').tap({ force: true }).catch(() => {});
    else if (await p.locator('.cx-me .btn:not([disabled])').count()) await p.locator('.cx-me .btn').tap({ force: true }).catch(() => {});
    await sleep(500);
  }
  check(`[${nome}] jogou por toque sem erros de JS`, errs.length === 0, errs.join('|'));
  await ctx.close();
}
const f = done(); await browser.close(); srv.close(); process.exit(f ? 1 : 0);
