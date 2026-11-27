// Os emojis de interface viram os ícones da Bea; campos e listas de opções ficam como estão.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: false }); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/*.supabase.co/**', (r) => r.fallback());
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await page.goto(`${url}/aluno.html#/jogos`); await sleep(2500);
const r = await page.evaluate(async () => {
  const d = document.createElement('div'); d.id = 'x'; d.innerHTML = '<p id="a">🔒 trancado ✓ feito 🥁</p><select id="s"><option>🔒 op</option></select><input id="i" value="🔒"><button id="b">▶ ⏱ 30s</button>'; document.body.append(d);
  await new Promise((ok) => setTimeout(ok, 300)); const q = (s) => document.querySelector(s);
  const no = document.createTextNode('ok'); q('#a').append(no); no.nodeValue = 'ok 🎸'; await new Promise((ok) => setTimeout(ok, 300));
  return { a: [...q('#a').querySelectorAll('img.ic-emoji')].map((i) => i.alt).join(''), txt: q('#a').textContent, opt: q('#s').textContent, inp: q('#i').value, bt: q('#b').querySelectorAll('img').length, ok: [...q('#a').querySelectorAll('img')].every((i) => i.getAttribute('src').startsWith('assets/icones-loja/')) };
});
check('🔒 ✓ 🥁 viram ícones no texto', r.a.startsWith('🔒✓🥁') && !/🔒|🥁/.test(r.txt) && r.ok, JSON.stringify(r));
check('texto que muda depois também é trocado (🎸)', r.a.includes('🎸'));
check('listas de opções e campos não mudam', r.opt.includes('🔒') && r.inp === '🔒');
check('o ⏱ do botão vira ícone', r.bt === 1);
const n = await page.evaluate(async () => [...document.querySelectorAll('img.ic-emoji')].every((i) => i.naturalWidth > 0 || !i.complete) );
check('os arquivos dos ícones existem', await page.evaluate(async () => { const m = ['estado-trancado-32', 'estado-feito-32', 'inst-bateria', 'inst-guitarra', 'jogo-tempo']; const r = await Promise.all(m.map((x) => fetch(`assets/icones-loja/${x}.png`, { method: 'HEAD' }).then((y) => y.ok))); return r.every(Boolean); }));
check('sem erros', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); done();
