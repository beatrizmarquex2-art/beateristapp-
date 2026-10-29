// Todo toque nos jogos de ritmo tem que fazer barulho (mesmo fora do tempo): senão a pessoa perde o fio.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); });
await page.goto(url + '/aluno.html#/ritmo');
await page.waitForSelector('#jogos [data-act="rz-game"]');
// música "importada" sintética (a prévia só existe pra músicas importadas): 100 bpm, 24 compassos, bateria em colcheias + melodia
await page.evaluate(() => {
  const st = 60 / 100 / 4, bar = 16 * st, lead = 1; const T = (b, s) => (lead + b) * bar + s * st; const drums = [], mel = [], ev = [], chords = [];
  for (let b = 0; b < 24; b++) { for (const s of [0, 8]) drums.push({ t: T(b, s), lane: 0, snd: 'kick', v: 1, bar: b, kind: 'verso' }); for (const s of [4, 12]) drums.push({ t: T(b, s), lane: 1, snd: 'snare', v: 1, bar: b, kind: 'verso' });
    for (let s = 0; s < 16; s += 2) drums.push({ t: T(b, s), lane: 2, snd: s % 8 ? 'hhc' : 'crash', v: .6, bar: b, kind: 'verso' });
    for (const s of [0, 4, 8, 12]) mel.push({ t: T(b, s), m: 60 + ((b + s) % 7), idx: 4 + (s / 4), d: st * 3, ds: 3, bar: b, step: s, kind: 'verso' });
    ev.push({ t: T(b, 0), k: 'chord', ms: [48, 52, 55], d: bar * .95, sty: 'pop' }); ev.push({ t: T(b, 0), k: 'bass', m: 36, d: st * 2 }); }
  const pre = [0, 1, 2, 3].map((s) => ({ t: s * 4 * st, k: 'click', v: s ? .6 : 1 }));
  const arr = { st, mel, drums, ev: pre.concat(ev), chords, dur: T(24, 0) + 1.5, bars: 24, lead };
  const songs = [0, 1, 2, 3, 4, 5].map((i) => ({ id: 'imp-' + i, name: 'Música ' + i, bpm: 100, root: 48, minor: false, seed: i + 1, style: 'imp', arr }));
  window.BeaterRhythm.setSongs(songs); window.BeaterRhythm.refresh();
});
const click = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, sel);
for (const [game, key] of [['tiles', 'a'], ['setas', 'a']]) {
  await click(`#jogos [data-act="rz-game"][data-v="${game}"]`); await sleep(200);
  await click('#jogos [data-act="rz-style"][data-v="imp"]'); await sleep(200);
  await click('#jogos [data-act="rz-play"][data-v="2"]'); await sleep(300);
  if (game === 'tiles') { await click('[data-act="rz-go"]'); await sleep(300); }
  // toque logo no começo (nenhuma nota perto): a quantidade de sons criados na hora do toque tem que subir
  const made = await page.evaluate((k) => { const a = window.__ac; const s0 = a.started; document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); return a.started - s0; }, key);
  check(`[${game}] toque fora do tempo também faz som`, made > 0, `${made} sons criados`);
  await click('[data-act="rz-quit"],[data-act="rz-menu"]'); await sleep(400);
}
check('sem erros de JS na página', errs.length === 0, errs.slice(0, 3).join(' | '));
const fails = done(); await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
