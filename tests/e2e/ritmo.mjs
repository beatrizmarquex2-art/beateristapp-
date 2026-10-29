// Pacote de ritmo (Beatstar / Palco / Piano Tiles / Setinhas): nada da execução anterior pode continuar soando.
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
const peak = (ms) => page.evaluate((m) => window.__peak(m), ms);
const live = () => page.evaluate(() => window.__audible());
const phase = () => page.evaluate(() => document.querySelector('#rz-cv') ? 'play' : document.querySelector('.rz-end') ? 'end' : 'menu');

for (const game of ['beat', 'hero', 'tiles', 'setas']) {
  if (game !== 'beat') { /* o Beaterista só expõe beat/tiles/setas no menu; hero fica fora */ if (game === 'hero') continue; }
  await click(`#jogos [data-act="rz-game"][data-v="${game}"]`); await sleep(200);
  await click('#jogos [data-act="rz-style"][data-v="imp"]'); await sleep(200);

  // 1) prévia ligada e desligada: tem que calar de verdade (a prévia agenda até 12 s de som de uma vez)
  await click('#jogos [data-act="rz-prev"][data-v="imp-0"]'); await sleep(900);
  const pPrev = await peak(300);
  check(`[${game}] prévia toca (sanidade do teste)`, pPrev > 0.01, `pico ${pPrev.toFixed(3)}`);
  await click('#jogos [data-act="rz-prev"][data-v="imp-0"]'); await sleep(500);
  const pAfter = await peak(700);
  check(`[${game}] parar a prévia cala tudo`, pAfter < 0.004, `pico ${pAfter.toFixed(4)}`);

  // 2) prévia ainda tocando e a pessoa já começa a fase: nada da prévia pode vazar pra dentro da fase
  await click('#jogos [data-act="rz-prev"][data-v="imp-1"]'); await sleep(600);
  await click('#jogos [data-act="rz-play"][data-v="2"]'); await sleep(200);
  if (game === 'tiles') { /* primeira vez mostra o "como jogar" */ await click('[data-act="rz-go"]'); await sleep(200); }
  await click('[data-act="rz-quit"],[data-act="rz-menu"]'); await sleep(500);
  const pQuit = await peak(900);
  check(`[${game}] prévia -> fase -> sair: silêncio`, pQuit < 0.004, `pico ${pQuit.toFixed(4)}`);

  // 3) trocar de fase 20 vezes seguidas (inclusive rápido): a cada troca, só a fase nova pode soar
  for (let i = 0; i < 20; i++) {
    await click(`#jogos [data-act="rz-play"][data-v="${i % 6}"]`); await sleep(i % 2 ? 60 : 350);
    if (game === 'tiles' && i === 0) { await click('[data-act="rz-go"]'); await sleep(100); }
    await click('[data-act="rz-quit"],[data-act="rz-menu"]'); await sleep(i % 3 ? 30 : 200);
  }
  // a fase NOVA, depois de tanta troca, tem que soar normalmente (o conserto não pode calar demais)
  await click('#jogos [data-act="rz-play"][data-v="3"]'); await sleep(3200);
  const pNew = await peak(600);
  check(`[${game}] a fase nova toca normalmente depois das trocas`, pNew > 0.02, `pico ${pNew.toFixed(3)}`);
  await click('[data-act="rz-quit"],[data-act="rz-menu"]');
  await sleep(500);
  const p20 = await peak(1200);
  check(`[${game}] 20 trocas rápidas de fase: sem som residual`, p20 < 0.004, `pico ${p20.toFixed(4)}`);
  await sleep(3500);
  const lv = await live();
  check(`[${game}] nenhuma fonte de áudio presa depois de 3,5 s`, lv <= 2, `${lv} ativas`);
  if (lv > 2) console.log(await page.evaluate(() => [...window.__ac.live].map((n) => n.constructor.name + (n.frequency ? ':' + Math.round(n.frequency.value) : '') + ' ctx=' + n.context.currentTime.toFixed(1)).join(', ') + ' | phase=' + (document.querySelector('#rz-cv') ? 'play' : 'other')));
}
check('sem erros de JS na página', errs.length === 0, errs.slice(0, 3).join(' | '));
const fails = done(); await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
