// Varredura de todas as telas do app (Bea): entrar, mexer nos botões de tocar, sair. Mede vazamento de escutas/timers e som que sobra.
import { serve, launch, sleep, check, done, fakeLogin } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
await fakeLogin(ctx, page, url);
const go = (h) => page.evaluate((x) => { location.hash = x; }, h);
const stat = () => page.evaluate(() => ({ L: window.__listeners().n, T: window.__ac.timers.size, I: window.__ac.intervals.size, R: window.__ac.raf.size, A: window.__audible ? window.__audible() : 0, M: window.__micLive ? window.__micLive() : 0 }));
const peak = (ms) => page.evaluate((m) => window.__peak(m), ms);
const ROUTES = ['#/metronomo', '#/acentuacao', '#/beatlab', '#/kit', '#/tempo', '#/tempo/transcritor', '#/tempo/raiox', '#/ouvido', '#/setlist', '#/partitura', '#/toque', '#/piano', '#/treinos', '#/treinos/escuta', '#/treinos/montar', '#/treinos/montar/imagens', '#/treinos/montar/aprender', '#/rudimentos', '#/ferramentas', '#/ferramentas/tap', '#/ferramentas/bpm', '#/ferramentas/roleta', '#/ferramentas/loop', '#/ferramentas/groovebox', '#/ferramentas/um', '#/ferramentas/mapa', '#/ferramentas/leitura', '#/ferramentas/desafio', '#/ambiente', '#/foco', '#/kids', '#/ritmo', '#/estudos', '#/inicio', '#/beaterista', '#/ideias', '#/repertorio', '#/lembretes', '#/ajustes', '#/dicas', '#/dicionario', '#/hub', '#/mural', '#/feed', '#/plano', '#/planos', '#/arquivos', '#/bateristas', '#/anotacoes', '#/favoritos', '#/notas', '#/checklist'];
await go('#/inicio'); await sleep(800); await stat();
const base = await stat();
console.log('base', JSON.stringify(base));
const PLAYISH = /^(▶|tocar|ouvir|iniciar|começar|bora|play|ligar|gravar|girar|ouvir o tempo|ouvir de novo|tocar de volta|tocar tudo|▶ tocar)/i;
const report = [];
async function visit(r) {
  await go(r); await sleep(450);
  const pressed = await page.evaluate((src) => {
    const re = new RegExp(src, 'i'); let n = 0;
    for (const b of document.querySelectorAll('#view button, #view a.btn')) {
      const t = (b.getAttribute('aria-label') || b.textContent || '').trim();
      if (b.disabled || !re.test(t)) continue; if (/gravar|ligar o microfone|ouvir o microfone/i.test(t)) continue; try { b.click(); n++; } catch {} if (n >= 3) break;
    }
    return n;
  }, PLAYISH.source);
  await sleep(700);
  await go('#/inicio'); await sleep(550);
  // o estúdio de ambiente é proposital: segue tocando entre telas até a pessoa parar (botão ■ do mini-player). O teste para por ali.
  if (r === '#/ambiente') { await page.evaluate(async () => { (await import('/js/ambient.js')).stop(0.05); }); await sleep(1300); }
  return pressed;
}
for (const r of ROUTES) {
  const e0 = errs.length;
  await visit(r);                       // 1ª visita: pode inicializar coisas únicas (módulos, escutas globais do pacote de ritmo…)
  const s1 = await stat();
  const pressed = await visit(r);       // 2ª visita: aqui qualquer aumento é vazamento por visita
  const s = await stat(); const p = await peak(500);
  const d = { L: s.L - s1.L, T: s.T - s1.T, I: s.I - s1.I, R: s.R - s1.R, A: s.A, M: s.M, peak: +p.toFixed(4), pressed, err: errs.length - e0 };
  report.push([r, d]);
  const ok = d.L <= 0 && d.I <= 0 && d.R <= 1 && d.T <= 1 && d.A === 0 && d.M === 0 && d.peak < 0.004 && d.err === 0;
  check(`${r}`, ok, JSON.stringify(d));
}
console.log(errs.slice(0, 8));
const fails = done(); await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
