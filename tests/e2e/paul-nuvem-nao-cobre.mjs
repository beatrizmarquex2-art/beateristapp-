// A nuvem do Paul não pode "roubar" o toque dos botões de baixo (antes tocar em jogar abria o Radar Musical). Só o botão "ver" abre o link.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: false }); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/*.supabase.co/**', (r) => r.fallback());
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await page.goto(`${url}/aluno.html#/jogos`); await sleep(2500);
// tudo no mesmo instante, pra a nuvem sorteada sozinha não trocar a do teste
const r = await page.evaluate(async () => {
  const m = await import('/js/paul-talk.js'); m.think(['jogo novo! Radar Musical: ache as palavras na grade', '#/dicas/caca', 'aluno'], 30000);
  const c = [...document.querySelectorAll('.pt-cloud')].find((x) => x.querySelector('.pt-ver[href="#/dicas/caca"]')); if (!c) return { erro: 'sem nuvem' };
  const b = c.getBoundingClientRect(); const el = document.elementFromPoint(b.left + 20, b.top + b.height / 2);
  const ver = c.querySelector('.pt-ver'); const vb = ver && ver.getBoundingClientRect(); const ev = vb && document.elementFromPoint(vb.left + vb.width / 2, vb.top + vb.height / 2);
  return { cobre: !!(el && el.closest('.pt-cloud')), temVer: !!ver, verTocavel: !!(ver && ev === ver) };
});
check('a nuvem apareceu com o botão "ver"', !r.erro && r.temVer, JSON.stringify(r));
check('tocar no texto da nuvem passa pro que está embaixo', r.cobre === false, JSON.stringify(r));
check('o botão "ver" recebe o toque', r.verTocavel === true, JSON.stringify(r));
await page.evaluate(() => document.querySelector('.pt-ver[href="#/dicas/caca"]').click()); await sleep(600);
check('o botão "ver" abre o Radar', (await page.evaluate(() => location.hash)) === '#/dicas/caca');
check('sem erros', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); done();
