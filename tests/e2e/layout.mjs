// Responsividade: sem rolagem horizontal, sem elemento vazando da tela, alvos de toque, em vários tamanhos e na horizontal.
import { serve, launch, sleep, check, done, fakeLogin } from './harness.mjs';
const { srv, url } = await serve();
const VPS = [['iPhone SE', 320, 568], ['iPhone 14', 390, 844], ['iPhone Max', 430, 932], ['Android', 360, 740], ['iPad', 820, 1180], ['notebook', 1366, 768], ['celular horizontal', 844, 390], ['iPad horizontal', 1180, 820]];
const ROUTES = ['#/inicio', '#/beatlab', '#/metronomo', '#/treinos', '#/toque', '#/piano', '#/ferramentas', '#/kids', '#/ritmo', '#/estudos', '#/ajustes', '#/ouvido', '#/tempo', '#/kids/pauta/0'];
for (const [name, w, h] of VPS) {
  const { browser, ctx } = await launch({ viewport: { width: w, height: h }, isMobile: w < 900 });
  const page = await ctx.newPage(); await fakeLogin(ctx, page, url);
  for (const r of ROUTES) {
    await page.evaluate((x) => { location.hash = x; }, r); await sleep(500);
    const m = await page.evaluate(() => {
      const W = document.documentElement.clientWidth; const bad = [];
      for (const e of document.querySelectorAll('#view *, .bottom-nav *, .topwrap *')) {
        const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || cs.position === 'fixed' || (e.tagName === 'IMG' && e.getAttribute('alt') === '')) continue; // rabiscos decorativos sangram de propósito
        const b = e.getBoundingClientRect(); if (!b.width || !b.height) continue;
        // ignora o que está dentro de um contêiner que rola na horizontal de propósito
        let p = e.parentElement, scroll = false; while (p && p.id !== 'app') { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') { scroll = true; break; } p = p.parentElement; }
        if (!scroll && (b.right > W + 2 || b.left < -2)) bad.push(e.tagName + '.' + String(e.className).slice(0, 30));
      }
      const small = [...document.querySelectorAll('#view button, #view a.btn, .bottom-nav a, .top button, .top a')].filter((e) => { const b = e.getBoundingClientRect(); return b.width && (b.height < 32 || b.width < 32) && getComputedStyle(e).visibility !== 'hidden'; }).length;
      return { sw: document.documentElement.scrollWidth - W, bad: bad.slice(0, 3), nbad: bad.length, small };
    });
    check(`${name} ${w}x${h} ${r}`, m.sw <= 1 && m.nbad === 0, JSON.stringify(m));
  }
  await browser.close();
}
const fails = done(); srv.close(); process.exit(fails ? 1 : 0);
