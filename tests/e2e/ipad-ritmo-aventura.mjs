// iPad: o jogo de ritmo do Modo Aventura precisa ocupar a TELA TODA (antes ficava preso numa caixa de ~463px e aparecia só até a metade).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
for (const [nome, w, h] of [['iPad em pé', 820, 1180], ['iPad deitado', 1180, 820], ['iPad Pro deitado', 1366, 1024], ['iPhone', 390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, serviceWorkers: 'block', permissions: ['microphone'] });
  await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
  await ctx.route('**/rest/v1/rpc/midis_publicos_lista', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await ctx.route('**/*.supabase.co/**', (r) => r.fallback());
  await ctx.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
  const p = await ctx.newPage();
  await p.goto(url + '/aluno.html#/ritmo/aventura/0'); await p.waitForSelector('.av-go', { timeout: 20000 }); await p.click('.av-go');
  await p.waitForSelector('[data-nr-modo="beat"]', { timeout: 20000 });
  const eh = await p.evaluate(() => { const b = document.querySelector('.rg-host').getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; });
  check(`${nome}: a tela de escolha cabe inteira na tela`, eh[1] >= 0 && eh[1] + eh[3] <= h && eh[0] >= 0 && eh[0] + eh[2] <= w, JSON.stringify(eh));
  await p.click('[data-nr-modo="beat"]');
  await p.waitForSelector('.rz-mmenu .rz-jogar', { timeout: 20000 }); await p.locator('.rz-mmenu .rz-jogar').first().click();
  if (await p.locator('[data-act="rz-go"]').count()) await p.click('[data-act="rz-go"]');
  await p.waitForSelector('#rz-cv', { timeout: 10000 }); await sleep(700);
  const m = await p.evaluate(() => { const b = document.querySelector('.rg-host').getBoundingClientRect(), s = document.querySelector('.rz-stage').getBoundingClientRect(); return { host: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)], stageBottom: Math.round(s.bottom), vw: innerWidth, vh: innerHeight }; });
  check(`${nome}: o jogo ocupa a tela inteira (${w}x${h})`, m.host[0] === 0 && m.host[1] === 0 && m.host[2] === w && m.host[3] === h, JSON.stringify(m.host));
  check(`${nome}: o palco não passa da tela`, m.stageBottom <= h, String(m.stageBottom));
  await ctx.close();
}
await browser.close(); srv.close(); done();
