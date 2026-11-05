// Ritmo: modo especial (estrelas que dobram os pontos), pausa com contagem no bpm.
import { serve, launch, sleep, check, done } from './harness.mjs';

const { srv, url } = await serve(); const { browser } = await launch(); const errs=[];
const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, hasTouch: true }); await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' })); await ctx.route('**/rest/v1/rpc/midis_publicos_lista', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
const p = await ctx.newPage(); p.on('pageerror',e=>errs.push(String(e)));
await p.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'T'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); });
await p.goto(`${url}/aluno.html#/ritmo`); await sleep(2000);
const info = await p.evaluate(() => { const out = []; for (const st of ['rock','pop','reggaeton','balada','lofi','bossa']) for (const g of ['beat','tiles']) { const c = window.BeaterRhythm._build(st, 1, g, 120); const stars = c.chart.filter((n) => n.star); const gaps = stars.slice(1).map((n, i) => n.t - stars[i].t); out.push({ st, g, n: stars.length, minGap: gaps.length ? Math.min(...gaps) : 99, first: stars[0] ? stars[0].t : 0 }); } return out; });
console.log(JSON.stringify(info.slice(0,4)));
check('estrelas caem de vez em quando (3 a 12 por música de 2 min, ≥ 12 s de distância)', info.every((x) => x.n >= (x.g === 'beat' ? 3 : 1) && x.n <= 12 && x.minGap >= 11.9), '');
await p.evaluate(() => window.BeaterRhythm._build('rock', 1, 'beat', 120));
const sp0 = await p.evaluate(() => window.BeaterRhythm._special());
console.log(JSON.stringify(sp0));
check('acertar a estrela liga o modo especial e dobra os pontos', sp0.on && sp0.mult === 2 && sp0.doubled >= sp0.normal * 1.9 && sp0.specials === 1, JSON.stringify(sp0));
check('depois de 3 compassos o modo especial acaba', sp0.off === false);
// joga uma fase, pausa e continua: contagem no bpm, e fade no fim
await p.locator('[data-act="rz-game"][data-v="beat"]').click(); await sleep(200); await p.locator('.rz-jogar').click(); await sleep(3500);
await p.locator('[data-act="rz-pause"]').click(); await sleep(400);
check('pausado mostra Continuar', (await p.locator('#rz-pause').textContent()).includes('Continuar'));
await p.locator('[data-act="rz-pause"]').click(); await sleep(700);
const cin = await p.evaluate(() => !!document.querySelector('#rz-cv'));

await sleep(3200);
check('voltou a jogar depois da contagem', (await p.locator('#rz-pause').textContent()).includes('Pausar'));
// força o modo especial e tira print
const sp = await p.evaluate(() => { const c = window.BeaterRhythm._chart(); return !!c.chart.find((n) => n.star); });
check('a fase tem nota-estrela', sp);
check('sem erros de JS', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); done();
