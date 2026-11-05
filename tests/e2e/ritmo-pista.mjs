// Pista dos jogos de ritmo: 3 músicas por estilo, nada de semicolcheia seguida na mesma linha, 2 min nas músicas prontas e começo sem espera.
import { serve, launch, sleep, check, done } from "./harness.mjs";
const { srv, url } = await serve(); const { browser } = await launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } }); const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'T'); });
await p.goto(`${url}/aluno.html#/ritmo`); await sleep(2500);
await p.locator('[data-act="rz-acc"][data-v="ritmo"]').click(); await sleep(200);
check('3 músicas no estilo', (await p.locator('.rz-tier').count()) === 3, String(await p.locator('.rz-tier').count()));
console.log((await p.locator('.rz-tier .small').allTextContents()).join(' | '));
const res = await p.evaluate(() => {
  const out = { bad: [], total: 0, maxStart: 0, minDur: 1e9, notes: 0 };
  for (const st of ['rock','pop','reggaeton','balada','lofi','bossa']) for (let i = 0; i < 3; i++) for (const game of ['beat','hero','tiles','setas']) {
    const c = window.BeaterRhythm._build(st, i, game, 120); const A = c.A; const sx = A.st; const by = {};
    c.chart.filter((n) => !n.cpu).forEach((n) => { (by[n.lane] = by[n.lane] || []).push(n.t); }); let worst = 9;
    Object.values(by).forEach((a) => { a.sort((x, y) => x - y); for (let k = 1; k < a.length; k++) worst = Math.min(worst, (a[k] - a[k - 1]) / sx); });
    out.total++; out.notes += c.chart.length; if (worst < 1.9) out.bad.push(`${st}${i}/${game}:${worst.toFixed(2)}`);
    if (game === 'beat') out.minDur = Math.min(out.minDur, A.dur - A.lead * 16 * sx - 1.5);
  }
  return out;
});
console.log(JSON.stringify(res));
check('nenhuma linha com semicolcheia seguida (todos os estilos e jogos)', res.bad.length === 0, res.bad.slice(0, 5).join(' '));
check('músicas do jogo unificado têm pelo menos 2 min', res.minDur >= 118, res.minDur.toFixed(0));
const kits = await p.evaluate(() => window.BeaterRhythm._kits());
check('cores: bumbo verde, caixa vermelho, chimbal azul, tom roxo, prato dourado', kits[5].map((k) => k[2] + ':' + k[0]).join(' ') === 'bumbo:#3fae5a caixa:#e2554f chimbal:#5b8dd6 tom:#a77bff prato:#e0b043', JSON.stringify(kits[5].map((k) => k[0])));
const fill = await p.evaluate(() => { // viradas: cada linha só em colcheia, mas a virada continua com todas as notas distribuídas
  const c = window.BeaterRhythm._build('rock', 2, 'beat', 120); const toms = c.chart.filter((n) => n.snd === 'tom1' || n.snd === 'tom2' || n.snd === 'floor').length; return toms; });
check('as viradas (tons) continuam na pista', fill > 20, String(fill));
check('sem erros de JS', errs.length === 0, errs.slice(0,2).join('|'));
const lead = await p.evaluate(() => {
  const st = 0.125; const bar = 16 * st; const cl = bar; const t0 = cl + 10 * bar; // 1ª nota 10 compassos (20 s) depois da contagem
  const mel = []; for (let i = 0; i < 40; i++) mel.push({ t: t0 + i * 2 * st, m: 60 + (i % 5), idx: 7 + (i % 5), d: st, ds: 1, bar: 10 + Math.floor(i / 8), step: (i * 2) % 16, kind: 'verso' });
  const pre = [0,1,2,3].map((s) => ({ t: s * 4 * st, k: 'click', v: 1 }));
  const song = { id: 'imp-x', style: 'imp', name: 'teste', bpm: 120, root: 48, minor: false, seed: 0, imported: true, arr: { st, mel, drums: [], ev: pre, chords: [], dur: t0 + 12, bars: 16, lead: 1 } };
  window.BeaterRhythm.setSongs([song]);
  const c = window.BeaterRhythm._build('imp', 0, 'beat', 120);
  const first = Math.min(...c.chart.map((n) => n.t));
  const lanes = {}; c.chart.forEach((n) => { (lanes[n.lane] = lanes[n.lane] || []).push(n.t); }); let worst = 9; Object.values(lanes).forEach((a) => { a.sort((x,y)=>x-y); for (let k=1;k<a.length;k++) worst = Math.min(worst,(a[k]-a[k-1])/st); });
  return { espera: first - cl, antes: 10 * bar, n: c.chart.length, worst };
});

check('música que começa 20 s depois agora começa já (menos de 1 compasso de espera)', lead.espera < 2.01 && lead.espera >= 0, lead.espera.toFixed(2));
check('sem semicolcheia na mesma linha', lead.worst >= 1.9, lead.worst.toFixed(2));
check('sem erros de JS', errs.length === 0, errs.join('|'));

const vir = await p.evaluate(() => {
  const st = 0.125, bar = 16 * st; const T = (b, s) => (1 + b) * bar + s * st; const drums = [];
  for (let b = 0; b < 12; b++) { drums.push({ t: T(b, 0), lane: 0, snd: 'kick', v: 1, bar: b, kind: 'verso' }); drums.push({ t: T(b, 8), lane: 0, snd: 'kick', v: 1, bar: b, kind: 'verso' }); drums.push({ t: T(b, 4), lane: 1, snd: 'snare', v: 1, bar: b, kind: 'verso' });
    if (b % 4 === 3) [12, 13, 14, 15].forEach((s, k) => drums.push({ t: T(b, s), lane: k < 2 ? 1 : 3, snd: k % 2 ? 'snare' : (k < 2 ? 'tom1' : 'floor'), v: 1, bar: b, kind: 'verso' })); }
  const mel = []; for (let i = 0; i < 12; i++) mel.push({ t: T(i, 0), m: 60, idx: 7, d: st, ds: 1, bar: i, step: 0, kind: 'verso' });
  const pre = [0,1,2,3].map((s) => ({ t: s * 4 * st, k: 'click', v: 1 }));
  window.BeaterRhythm.setSongs([{ id: 'imp-f', style: 'imp', name: 'f', bpm: 120, root: 48, minor: false, seed: 0, imported: true, arr: { st, mel, drums, ev: pre, chords: [], dur: T(12, 0) + 2, bars: 12, lead: 1 } }]);
  const c = window.BeaterRhythm._build('imp', 0, 'beat', 120); const fillNotes = c.chart.filter((n) => n.snd && n.snd !== 'kick' && !(Math.abs(((n.t / st) % 16) - 4) < .01 && n.snd === 'snare'));
  const by = {}; c.chart.forEach((n) => { (by[n.lane] = by[n.lane] || []).push(n.t); }); let worst = 9; Object.values(by).forEach((a) => { a.sort((x,y)=>x-y); for (let k=1;k<a.length;k++) worst = Math.min(worst,(a[k]-a[k-1])/st); });
  return { total: c.chart.filter((n) => n.snd).length, esperado: 12 * 3 + 3 * 4, worst, lanes: Object.keys(by).join(',') };
});
check('virada rápida do MIDI fica distribuída entre caixa e tom (nenhuma nota perdida)', vir.total === vir.esperado && vir.worst >= 1.9, JSON.stringify(vir));
await browser.close(); srv.close(); done();
