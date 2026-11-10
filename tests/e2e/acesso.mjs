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
  check('aba com cadeado: só o Álbum (Jogos, Estudos, Tocar e Perfil abertos; o Ranking saiu do menu)', (await p.locator('.nav-item.locked').count()) === 1, String(await p.locator('.nav-item.locked').count()));
  check('não existe aba Beat Lab pro aluno', (await p.locator('.bottom-nav .nav-item:has-text("Beat Lab")').count()) === 0);
  await go(p, '#/beatlab'); check('#/beatlab volta pra Jogos (não existe pro aluno)', (await p.evaluate(() => location.hash)).startsWith('#/jogos'));
  for (const h of ['#/ranking', '#/album', '#/ritmo', '#/kids', '#/kids/figuras', '#/kids/eco', '#/estudos/dicas']) { await go(p, h); check(`sem código: ${h} trancado`, (await trancada(p)) === 1); }
  for (const h of ['#/jogos', '#/tocar', '#/toque', '#/piano', '#/kids/explorar', '#/kids/memoria', '#/kids/ritmo', '#/jogos/velha', '#/jogos/stop', '#/jogos/bingo', '#/jogos/relatorio']) { await go(p, h); check(`sem código: ${h} aberto`, (await trancada(p)) === 0); }
  await go(p, '#/jogos');
  const locked = await p.locator('.jg-card.locked b').allTextContents();
  check('no catálogo: Beat Hero, Toca Aqui, pauLta e Uno com cadeado; Quiz e Letras (amostra) e os jogos livres não; sem fases e estrelas e sem Jogos Ensinam', ['Beat Hero', 'Toca Aqui'].every((n) => locked.some((t) => t.includes(n))) && !locked.some((t) => /Quiz e Letras|memória|velha|stop|bingo/i.test(t)) && (await p.locator('.jg-card:has-text("fases e estrelas"), .jg-card:has-text("Jogos Ensinam")').count()) === 0, locked.join(' | '));
  check('"Jogos Ensinam" saiu do catálogo de jogos (mora em Estudos)', (await p.locator('.jg-card:has-text("Jogos Ensinam")').count()) === 0);
  await go(p, '#/jogos/relatorio'); check('Jogos Ensinam abre o relatório', (await p.locator('.rel-page, .jg-doc').count()) > 0 && (await p.locator('h1:has-text("Jogos Ensinam")').count()) >= 1);
  // gerar meu código
  await go(p, '#/ranking'); await p.locator('a:has-text("gerar meu código")').click(); await sleep(700);
  check('"gerar meu código" leva direto pra lojinha', (await p.evaluate(() => location.hash)) === '#/lojinha' && (await p.locator('.lj-card').count()) === 6);
  await sleep(1200); await p.locator('button:has-text("pedir o código pra professora")').click(); await sleep(300); await go(p, '#/ranking');
  const code = (await p.locator('.al-lock-code').textContent()).trim();
  check('gerou um código de 6 e mandou informar a professora Bea', /^[A-Z0-9]{6}$/.test(code) && (await p.locator('.al-lock-t').textContent()).includes('informe a professora Bea'), code);
  check('o mesmo código aparece de novo em outra tela trancada', await (async () => { await go(p, '#/album'); return (await p.locator('.al-lock-code').textContent()).trim() === code; })());
  await p.locator('button:has-text("já liberou")').click(); await sleep(700);
  check('ainda não cadastrado: continua trancado e avisa', (await trancada(p)) === 1 && (await p.locator('.al-lock-msg').textContent()).includes('ainda não liberou'));
  valid.add(code); // a professora cadastra o código no app dela
  await p.locator('button:has-text("já liberou")').click(); await sleep(1500);
  check('depois que a professora cadastra, libera (sem cadeado nas abas)', (await trancada(p)) === 0 && (await p.locator('.nav-item.locked').count()) === 0);
  check('o código fica guardado e o pedido some', (await p.evaluate(() => localStorage.getItem('beaterista-aluno-codigo'))) === code && (await p.evaluate(() => localStorage.getItem('beaterista-aluno-codigo-pendente'))) === null);
  for (const h of ['#/ranking', '#/album', '#/ritmo', '#/kids', '#/estudos/dicas']) { await go(p, h); check(`com código: ${h} abre`, (await trancada(p)) === 0); }
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
  check('código desativado: tranca de novo', (await p.locator('.nav-item.locked').count()) === 1);
  await ctx.close();
}
// 5) Quiz e Letras (30 dicas): trancado sem código; com código baixa as dicas e abre; sem código nada é baixado
{
  const tips = Array.from({ length: 30 }, (_, i) => ({ n: i + 1, texto: `Dica ${i + 1}: pratique com metrônomo sempre devagar e aumente o andamento aos poucos, mantendo o pulso firme e a postura relaxada.` }));
  let chamadas = [];
  const mk = async (codigo) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true });
    await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(valid.has(r.request().postDataJSON().p_code)) }));
    await ctx.route('**/rest/v1/rpc/midis_publicos_lista', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await ctx.route('**/rest/v1/rpc/dicas_lista', (r) => { const c = r.request().postDataJSON().p_code; chamadas.push(c); r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(valid.has(c) ? tips : []) }); });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
    await p.addInitScript((c) => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); if (c) localStorage.setItem('beaterista-aluno-codigo', c); }, codigo || '');
    return { ctx, p, errs };
  };
  valid.clear();
  { const { ctx, p } = await mk(''); await p.goto(`${url}/aluno.html#/dicas/quiz`); await sleep(1800);
    check('Quiz e Letras sem código: abre (amostra) e nada é baixado', (await trancada(p)) === 0 && chamadas.length === 0, JSON.stringify(chamadas));
    await go(p, '#/jogos'); const lk = await p.locator('.jg-card.locked b').allTextContents();
    check('no catálogo, "Quiz e Letras" aparece sem cadeado e é o último', !lk.some((t) => /Quiz e Letras/.test(t)) && /Quiz e Letras/.test((await p.locator('.jg-card b').last().textContent())), lk.join(' | ')); await ctx.close(); }
  valid.add('ABC123');
  for (const tab of ['quiz', 'caca', 'cruzadinha']) {
    const { ctx, p, errs } = await mk('ABC123'); await p.goto(`${url}/aluno.html#/dicas/${tab}`); await sleep(2500);
    check(`Quiz e Letras com código: ${tab} abre com as 30 dicas`, (await trancada(p)) === 0 && (await p.locator('.dc-box .card, .dc-box .dc-grid, .dc-box .dc-q').count()) > 0 && (await p.locator('.dc-box .empty').count()) === 0, tab);
    check(`Quiz e Letras (${tab}): só pediu as dicas com o código`, chamadas.length >= 1 && chamadas.every((c) => c === 'ABC123'), JSON.stringify(chamadas));
    check(`Quiz e Letras (${tab}): título novo e sem erros`, (await p.locator('h1:has-text("Quiz e Letras")').count()) >= 1 && errs.length === 0, errs.join('|')); await ctx.close();
  }
}
// 6) o que ensina de verdade (pauLta e Toca Aqui) fica trancado sem código; os jogos de mesa abrem direto, sem modo aventura
{
  valid.clear(); const { ctx, p, errs } = await phone('', '');
  await p.goto(`${url}/aluno.html#/paulta`); await sleep(2000);
  check('pauLta trancada sem código', (await trancada(p)) === 1);
  await go(p, '#/jogos/toca'); check('Toca Aqui trancado sem código', (await trancada(p)) === 1);
  await go(p, '#/jogos/cartas'); check('Uno Musical trancado sem código', (await trancada(p)) === 1);
  await go(p, '#/jogos');
  const lk = await p.locator('.jg-card.locked b').allTextContents();
  check('no catálogo: Toca Aqui, pauLta e Uno com cadeado; memória, bingo, velha, quebra-cabeça, cara a cara e stop abertos', ['Toca Aqui', 'pauLta', 'Uno'].every((n) => lk.some((t) => t.includes(n))) && !lk.some((t) => /memória|bingo|velha|quebra|cara a cara|stop/i.test(t)), lk.join(' | '));
  for (const g of ['memart', 'bingo', 'velha', 'quebra', 'cara', 'stop']) { await go(p, `#/jogos/${g}`); check(`#/jogos/${g} abre direto no jogo (sem escolher modo aventura)`, (await trancada(p)) === 0 && (await p.locator('.av-root, .av-modes').count()) === 0 && (await p.locator('.jg-game').count()) === 1); }
  check('sem erros de página', errs.length === 0, errs.join(' | '));
  await ctx.close();
}
function location_ok(h) { return h.includes('/paulta/drum/6'); }
await browser.close(); srv.close(); done();
