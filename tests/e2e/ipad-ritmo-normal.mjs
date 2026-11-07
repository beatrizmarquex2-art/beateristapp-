// iPad: o Beat Hero FORA do Modo Aventura precisa ocupar a tela toda (no iPad ficava cortado). Simula o defeito do Safari colocando um transform no #app
// (vira a "caixa" do position:fixed): sem o portal o jogo ficaria preso nos 520px do app.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
for (const [nome, w, h] of [['iPad deitado', 1112, 834], ['iPad em pé', 834, 1112], ['iPhone', 390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, serviceWorkers: 'block' });
  await ctx.route('**/rest/v1/rpc/{aluno_codigo_ok,aluno_acesso}', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
  await ctx.route('**/rest/v1/rpc/midis_publicos_lista', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await ctx.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
  const p = await ctx.newPage(); await p.goto(url + '/aluno.html#/ritmo'); await sleep(2500);
  await p.evaluate(() => { document.getElementById('app').style.transform = 'translateZ(0)'; document.getElementById('app').style.overflow = 'hidden'; });
  await p.locator('.rz-jogar').first().click(); await sleep(2800);
  const m = await p.evaluate(() => { const e = document.querySelector('.rg-host'); const b = e.getBoundingClientRect(); return { rect: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)], noBody: e.parentNode === document.body, canvas: !!document.querySelector('#rz-cv') }; });
  check(`${nome}: durante o jogo o .rg-host está no <body> e ocupa a tela toda (${w}x${h})`, m.noBody && m.rect[0] === 0 && m.rect[1] === 0 && m.rect[2] === w && m.rect[3] === h && m.canvas, JSON.stringify(m));
  await p.locator('.rg-host button:has-text("Sair")').first().click(); await sleep(1200);
  const d = await p.evaluate(() => ({ volta: !!document.querySelector('#view > .rg-host'), naoMaisBody: ![...document.body.children].some((e) => e.classList && e.classList.contains('rg-host')) }));
  check(`${nome}: ao sair, a tela do jogo volta pro lugar (menu do Beat Hero)`, d.volta && d.naoMaisBody, JSON.stringify(d));
  await ctx.close();
}
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
