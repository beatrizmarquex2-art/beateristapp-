// Código do aluno: todos os jogos de ritmo só com código; com código as músicas MIDI aparecem. O Supabase é simulado.
import fs from 'node:fs';
import { serve, launch, sleep, check, done } from './harness.mjs';
const b64 = fs.readFileSync(process.env.MID_FILE).toString('base64');
const { srv, url } = await serve(); const { browser } = await launch();
const state = { valid: new Set(['ABC123']), listCalls: [] };
async function phone(saved) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true });
  await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => { const c = r.request().postDataJSON().p_code; r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.valid.has(c)) }); });
  await ctx.route('**/rest/v1/rpc/midis_publicos_lista', (r) => { const c = r.request().postDataJSON().p_code; state.listCalls.push(c); r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.valid.has(c) ? [{ id: 'a1', name: 'Minha música MIDI', folder: 'Filmes', corte: null, b64 }] : []) }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.addInitScript((c) => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); if (c) localStorage.setItem('beaterista-aluno-codigo', c); }, saved || '');
  await p.goto(`${url}/aluno.html#/ritmo`); await sleep(2500); return { p, errs, ctx };
}
// 1) sem código: o ritmo todo fica trancado (tela de "gerar meu código"); digitando o código certo libera
{
  const { p, errs, ctx } = await phone('');
  check('sem código: o ritmo pede o código na hora (sem JOGAR)', (await p.locator('.al-lock').count()) === 1 && (await p.locator('.rz-jogar').count()) === 0);
  check('nenhuma lista de MIDI foi baixada sem código', state.listCalls.length === 0, JSON.stringify(state.listCalls));
  await p.locator('.al-lock-have summary').click();
  await p.locator('.al-lock-have input').fill('ZZZ999'); await p.locator('.al-lock-have button').click(); await sleep(700);
  check('código errado: avisa e continua trancado', (await p.locator('.al-lock-msg').textContent()).includes('não achei') && (await p.locator('.al-lock').count()) === 1);
  await p.locator('.al-lock-have input').fill('abc 123'); await p.locator('.al-lock-have button').click(); await sleep(2500);
  check('código certo libera e guarda no aparelho', await p.evaluate(() => localStorage.getItem('beaterista-aluno-codigo')) === 'ABC123');
  check('a lista de MIDIs só foi pedida com o código', state.listCalls.length >= 1 && state.listCalls.every((c) => c === 'ABC123'), JSON.stringify(state.listCalls));
  check('o ritmo abre liberado (JOGAR, sem cadeado)', (await p.locator('.al-lock').count()) === 0 && (await p.locator('.rz-jogar').count()) === 1);
  check('sem erros de JS', errs.length === 0, errs.join('|')); await ctx.close();
}
// 2) com código guardado: já abre liberado, MIDI na lista, sem botões de editar, e joga
{
  const { p, errs, ctx } = await phone('ABC123');
  check('com código guardado abre no Beat Hero', (await p.locator('.rz-g.on b').textContent()) === 'Beat Hero');
  await p.locator('[data-act="rz-acc"][data-v="ritmo"]').click(); await sleep(200); await p.locator('.rz-st[data-v="imp"]').click(); await sleep(400);
  check('a música MIDI aparece (pasta Filmes)', (await p.locator('.rz-song b').first().textContent()).includes('Minha música MIDI'));
  check('aluno não vê renomear / pasta / cortar nas músicas', (await p.locator('.rz-macts').count()) === 0 && (await p.locator('[data-act="rz-mtrim"]').count()) === 0);
  await p.locator('.rz-song').first().click(); await sleep(3500);
  check('joga a música MIDI', (await p.locator('#rz-cv').count()) === 1 && (await p.locator('.rz-pad').count()) >= 3);
  check('sem erros de JS', errs.length === 0, errs.join('|')); await ctx.close();
}
// 3) a professora desativa o código: na próxima vez que o aluno abre, tranca de novo
{
  state.valid.delete('ABC123'); state.listCalls.length = 0;
  const { p, errs, ctx } = await phone('ABC123');
  check('código desativado: volta a trancar e apaga o código guardado', (await p.locator('.al-lock').count()) === 1 && (await p.evaluate(() => localStorage.getItem('beaterista-aluno-codigo'))) === null);
  check('desativado não baixa lista nenhuma', state.listCalls.length === 0);
  await ctx.close();
}
// 4) sem internet no banco: quem já foi confirmado há pouco continua liberado
{
  state.valid.add('ABC123');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 } }); await ctx.route('**/rest/v1/rpc/**', (r) => r.abort());
  const p = await ctx.newPage(); await p.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'ABC123'); localStorage.setItem('beaterista-aluno-codigo-ok', String(Date.now())); });
  await p.goto(`${url}/aluno.html#/ritmo`); await sleep(2500);
  check('sem internet: aluno já confirmado continua com o Beat Hero', (await p.locator('.rz-jogar').count()) === 1);
  await ctx.close();
}
await browser.close(); srv.close(); done();
