// MIDI publicado pela professora aparece na área dos alunos ("Músicas MIDI") e dá pra jogar. O Supabase é simulado (midis_publicos_lista).
import fs from 'node:fs';
import { serve, launch, sleep, check, done } from './harness.mjs';
const MID = process.env.MID_FILE; const b64 = fs.readFileSync(MID).toString('base64');
const { srv, url } = await serve(); const { browser } = await launch();
async function run(lista, label) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true });
  await ctx.route('**/rest/v1/rpc/midis_publicos_lista', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(lista) }));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); });
  await p.goto(`${url}/aluno.html#/ritmo`); await sleep(2500);
  return { p, errs, ctx, label };
}
// 1) com uma música publicada
{
  const { p, errs, ctx } = await run([{ id: 'a1', name: 'Minha música MIDI', folder: '', corte: null, b64 }], 'com música');
  await p.locator('[data-act="rz-acc"][data-v="ritmo"]').click(); await sleep(300);
  const label = await p.locator('.rz-st[data-v="imp"]').textContent().catch(() => '');
  check('o estilo "Músicas MIDI" aparece quando tem música publicada', label.trim() === 'Músicas MIDI', label);
  await p.locator('.rz-st[data-v="imp"]').click(); await sleep(400);
  check('a música aparece na lista', (await p.locator('.rz-song b').first().textContent().catch(() => '')).includes('Minha música MIDI'));
  check('tem prévia', (await p.locator('.rz-prev').count()) === 1);
  await p.locator('.rz-song').first().click(); await sleep(3500);
  check('a música MIDI abre a pista e joga', (await p.locator('#rz-cv').count()) === 1 && (await p.locator('.rz-pad').count()) >= 3);
  check('começa já tocando (a 1ª nota não demora)', await p.evaluate(() => { const c = window.BeaterRhythm._chart(); const cl = c.A.lead * 16 * c.A.st; return Math.min(...c.chart.map((n) => n.t)) - cl < 3; }));
  check('sem erros de JS', errs.length === 0, errs.slice(0, 2).join(' | ')); await ctx.close();
}
// 2) nada publicado: o que o aluno vê
{
  const { p, errs, ctx } = await run([], 'vazio');
  await p.locator('[data-act="rz-acc"][data-v="ritmo"]').click(); await sleep(300);
  check('sem música publicada: a aba "Músicas MIDI" continua lá, com os 6 estilos', (await p.locator('.rz-st[data-v="imp"]').count()) === 1 && (await p.locator('.rz-st').count()) === 7);
  await p.locator('.rz-st[data-v="imp"]').click(); await sleep(300);
  check('e explica que a professora ainda não liberou', (await p.locator('.rz-empty').textContent()).includes('ainda não liberou'));
  check('sem erros de JS', errs.length === 0, errs.slice(0, 2).join(' | ')); await ctx.close();
}
// 3) Supabase fora do ar: o resto do ritmo continua funcionando
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 } }); await ctx.route('**/rest/v1/rpc/midis_publicos_lista', (r) => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); }); await p.goto(`${url}/aluno.html#/ritmo`); await sleep(2500);
  check('sem conexão com o banco: o ritmo abre do mesmo jeito', (await p.locator('.rz-jogar').count()) === 1 && errs.length === 0, errs.join('|')); await ctx.close();
}
await browser.close(); srv.close(); done();
