// O microfone entende o som do violão, dos sinos e do piano? Toca cada nota no som do app (a mesma síntese usada nos jogos), lê a saída
// como se fosse o microfone (mesmo detector do jogo) e confere a nota (em qualquer oitava, como o jogo aceita).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch();
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
await page.goto(url + '/aluno.html#/jogos'); await sleep(1200);
const rel = await page.evaluate(async () => {
  const V = await import('/js/jogos/vivo-ui.js'); const { audio } = await import('/js/audio.js'); const c = audio(); await c.resume();
  const an = c.__an; if (!an) return { erro: 'sem analisador' };
  const buf = new Float32Array(an.fftSize); const out = [];
  const casos = [['violao', 'violao', Array.from({ length: 13 }, (_, i) => 40 + i * 3)], ['piano', 'teclado', [60, 62, 64, 65, 67, 69, 71, 72, 76, 79, 84]], ['sinos', 'sinos', [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 79, 84]]];
  for (const [tim, inst, notas] of casos) for (const m of notas) {
    V.tocaNota(m, undefined, 0.9, 0.5, tim); const t0 = performance.now(); let melhor = null; let tentativas = 0; let acertos = 0;
    while (performance.now() - t0 < 700) { await new Promise((r) => setTimeout(r, 45)); an.getFloatTimeDomainData(buf); const r = V.lerNota(buf, c.sampleRate, inst); if (r.midi != null) { tentativas++; if (((r.midi - m) % 12 + 12) % 12 === 0) acertos++; melhor = r.midi; } }
    out.push({ tim, inst, m, melhor, tentativas, acertos });
    await new Promise((r) => setTimeout(r, 500));
  }
  return { out };
});
if (rel.erro) { check('o analisador de saída existe', false, rel.erro); } else {
  for (const tim of ['violao', 'piano', 'sinos']) {
    const l = rel.out.filter((x) => x.tim === tim); const ok = l.filter((x) => x.acertos >= 1 && x.acertos >= x.tentativas * 0.6);
    check(`microfone entende o som do ${tim === 'violao' ? 'violão' : tim === 'sinos' ? 'sino (glockenspiel)' : 'piano'}: ${ok.length} de ${l.length} notas reconhecidas`, ok.length >= l.length - (tim === 'violao' ? 1 : 0), l.filter((x) => !ok.includes(x)).map((x) => `${x.m}→${x.melhor}(${x.acertos}/${x.tentativas})`).join(' '));
  }
}
check('nenhum erro de JS', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
