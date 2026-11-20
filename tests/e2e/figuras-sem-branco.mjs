// A figura/nota mostrada sozinha NÃO tem quadro branco em volta (Figurix "monte a figura", montar nota da Fuga, nota que cai).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 844 }); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 150)));
await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch {} });
await p.goto(`${url}/aluno.html#/jogos`); await sleep(1800);
const r = await p.evaluate(() => {
  document.body.innerHTML = '<div class="jg jg-figurix" data-skin="c"><svg class="fx-big" viewBox="0 0 10 10"><circle cx="5" cy="5" r="3"/></svg></div>'
    + '<div class="jg fg-wrap dc-wrap escuro"><div class="fg-cena"></div><div class="fgn-cena"><svg class="fgn-nota" viewBox="0 0 10 10"><ellipse cx="5" cy="5" rx="3" ry="2" fill="#1b1818" stroke="#1b1818"/><ellipse cx="5" cy="8" rx="1" ry="1" fill="#fffdf8" stroke="#1b1818"/></svg></div></div>';
  const g = (s) => getComputedStyle(document.querySelector(s)); const big = g('.fx-big'); const cena = g('.fgn-cena'); const el = g('.fgn-nota ellipse'); const ab = g('.fgn-nota ellipse:nth-child(2)');
  return { big: [big.backgroundColor, big.borderTopWidth, big.boxShadow], cena: [cena.backgroundColor, cena.backgroundImage, cena.borderTopWidth], stroke: el.stroke, fill: el.fill, aberta: ab.fill };
});
check('Figurix (adesivos): o "fx-big" da figura não tem fundo branco, borda nem sombra', r.big[0] === 'rgba(0, 0, 0, 0)' && r.big[1] === '0px' && r.big[2] === 'none', JSON.stringify(r.big));
check('montar nota (Fuga): sem painel atrás da figura', r.cena[0] === 'rgba(0, 0, 0, 0)' && r.cena[1] === 'none' && r.cena[2] === '0px', JSON.stringify(r.cena));
check('montar nota (Fuga): a figura fica clara (legível no fundo escuro) e a cabeça aberta fica vazada', /244, 248, 255/.test(r.stroke) && /244, 248, 255/.test(r.fill) && r.aberta === 'none', JSON.stringify([r.stroke, r.fill, r.aberta]));
check('sem erro na página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
