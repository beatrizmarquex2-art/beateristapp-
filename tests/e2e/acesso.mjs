// Acesso do aluno: sem código só o modo livre; "gerar meu código" → a professora cadastra → libera sozinho; com código tudo abre.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch(); const valid = new Set();
async function phone(codigo, pend) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true });
  await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(valid.has(r.request().postDataJSON().p_code)) }));
  await ctx.route('**/rest/v1/rpc/midis_publicos_lista', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await ctx.route('**/rest/v1/rpc/**', (r) => (r.request().url().match(/aluno_codigo_ok|midis_publicos_lista/) ? r.fallback() : r.fulfill({ status: 200, contentType: 'application/json', body: '[]' })));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.addInitScript(([c, pd]) => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); if (c) localStorage.setItem('beaterista-aluno-codigo', c); if (pd) localStorage.setItem('beaterista-aluno-codigo-pendente', pd); }, [codigo || '', pend || '']);
  return { ctx, p, errs };
}
const go = async (p, h) => { await p.evaluate((x) => { location.hash = x; }, h); await sleep(900); };
const trancada = (p) => p.locator('.al-lock').count();
// 1) sem código
{
  const { ctx, p, errs } = await phone('', ''); await p.goto(`${url}/aluno.html#/jogos`); await sleep(1800);
  check('abas com cadeado: Beat Lab, Álbum e Ranking (Jogos e Tocar abertos)', (await p.locator('.nav-item.locked').count()) === 3, String(await p.locator('.nav-item.locked').count()));
  for (const h of ['#/ranking', '#/album', '#/beatlab', '#/ritmo', '#/kids', '#/kids/figuras', '#/kids/eco', '#/dicionario']) { await go(p, h); check(`sem código: ${h} trancado`, (await trancada(p)) === 1); }
  for (const h of ['#/jogos', '#/tocar', '#/toque', '#/piano', '#/kids/explorar', '#/kids/memoria', '#/kids/ritmo', '#/jogos/velha', '#/jogos/cartas', '#/jogos/stop', '#/jogos/bingo', '#/jogos/relatorio']) { await go(p, h); check(`sem código: ${h} aberto`, (await trancada(p)) === 0); }
  await go(p, '#/jogos');
  const locked = await p.locator('.jg-card.locked b').allTextContents();
  check('no catálogo, as fases/estudos têm cadeado e os jogos livres não', locked.some((t) => /fases e estrelas/.test(t)) && locked.some((t) => /dicionário/.test(t)) && !locked.some((t) => /memória|velha|stop|bingo|Jogos Ensinam/i.test(t)), locked.join(' | '));
  check('"Jogos Ensinam" aparece no catálogo (aberto)', (await p.locator('.jg-card:has-text("Jogos Ensinam")').count()) === 1);
  await go(p, '#/jogos/relatorio'); check('Jogos Ensinam abre o relatório', (await p.locator('.rel-page, .jg-doc').count()) > 0 && (await p.locator('h1:has-text("Jogos Ensinam")').count()) >= 1);
  // gerar meu código
  await go(p, '#/ranking'); await p.locator('button:has-text("gerar meu código")').click(); await sleep(400);
  const code = (await p.locator('.al-lock-code').textContent()).trim();
  check('gerou um código de 6 e mandou informar a professora Bea', /^[A-Z0-9]{6}$/.test(code) && (await p.locator('.al-lock-t').textContent()).includes('informe a professora Bea'), code);
  check('o mesmo código aparece de novo em outra tela trancada', (async () => { await go(p, '#/album'); return (await p.locator('.al-lock-code').textContent()).trim() === code; })() instanceof Promise);
  await p.locator('button:has-text("já liberou")').click(); await sleep(700);
  check('ainda não cadastrado: continua trancado e avisa', (await trancada(p)) === 1 && (await p.locator('.al-lock-msg').textContent()).includes('ainda não liberou'));
  valid.add(code); // a professora cadastra o código no app dela
  await p.locator('button:has-text("já liberou")').click(); await sleep(1500);
  check('depois que a professora cadastra, libera (sem cadeado nas abas)', (await trancada(p)) === 0 && (await p.locator('.nav-item.locked').count()) === 0);
  check('o código fica guardado e o pedido some', (await p.evaluate(() => localStorage.getItem('beaterista-aluno-codigo'))) === code && (await p.evaluate(() => localStorage.getItem('beaterista-aluno-codigo-pendente'))) === null);
  for (const h of ['#/ranking', '#/album', '#/beatlab', '#/ritmo', '#/kids', '#/dicionario']) { await go(p, h); check(`com código: ${h} abre`, (await trancada(p)) === 0); }
  check('sem erros de JS', errs.length === 0, errs.slice(0, 2).join('|')); await ctx.close();
}
// 2) pedido pendente + a professora cadastra enquanto o aluno está na tela: libera sozinho (sem apertar nada)
{
  valid.clear(); const { ctx, p } = await phone('', 'PEDI01'); await p.goto(`${url}/aluno.html#/ranking`); await sleep(1800);
  check('com pedido guardado: mostra o código PEDI01', (await p.locator('.al-lock-code').textContent()).trim() === 'PEDI01');
  valid.add('PEDI01'); await sleep(9500);
  check('libera sozinho em até ~8 s depois que a professora cadastra', (await trancada(p)) === 0);
  await ctx.close();
}
// 3) ao abrir o app já com o pedido cadastrado: abre liberado
{
  valid.add('PEDI02'); const { ctx, p } = await phone('', 'PEDI02'); await p.goto(`${url}/aluno.html#/jogos`); await sleep(2000);
  check('abriu o app e a professora já tinha cadastrado: tudo liberado', (await p.locator('.nav-item.locked').count()) === 0);
  await ctx.close();
}
// 4) a professora desativa: tranca de novo ao abrir
{
  valid.clear(); const { ctx, p } = await phone('ATIVO1', ''); await p.goto(`${url}/aluno.html#/jogos`); await sleep(2000);
  check('código desativado: tranca de novo', (await p.locator('.nav-item.locked').count()) === 3);
  await ctx.close();
}
await browser.close(); srv.close(); done();
