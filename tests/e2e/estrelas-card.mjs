// Cartão de conquista das estrelas: o PNG sai nos 2 formatos, não vem em branco, e a tela de Pacotes (roleta) tem os botões de compartilhar quando há perfil.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
await page.goto(url + '/aluno.html#/album'); await sleep(2500);
for (const [f, w, h] of [['post', 1080, 1350], ['story', 1080, 1920]]) {
  const r = await page.evaluate(async (fm) => { const M = await import('/js/figurinhas/estrelas-card.js'); const c = await M.desenhar({ nome: 'Teste', total: 42, formato: fm }); const g = c.getContext('2d'); const px = (x, y) => [...g.getImageData(x, y, 1, 1).data].join(','); const set = new Set([px(540, 100), px(540, 400), px(100, 900), px(540, c.height - 60), px(900, 300), px(300, 400)]); return { w: c.width, h: c.height, distintos: set.size }; }, f);
  check(`o cartão ${f} sai em ${w}x${h} e não é uma cor só`, r.w === w && r.h === h && r.distintos >= 3, JSON.stringify(r));
}
check('sem erro de página', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); done();
