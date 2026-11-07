// Amostra grátis (aluno sem código): Dicionário mostra 3 termos, Aulinha do Paul 2 passos, Quiz e Letras 2 partidas de caça-palavras (palavras do dicionário).
// Dicas do método só com código. Com código tudo abre.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: false });
const errs = []; let baixou = 0;
async function abrir(c, valido, hash) {
  await c.route('**/rest/v1/rpc/**', (r) => { const u = r.request().url(); if (u.includes('dicas_lista')) { baixou++; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(Array.from({ length: 12 }, (_, i) => ({ n: i + 1, texto: `Dica ${i + 1}: estude devagar com o metrônomo e relaxe a pegada da baqueta.` }))) }); } r.fulfill({ status: 200, contentType: 'application/json', body: u.match(/aluno_(codigo_ok|acesso)/) ? String(valido) : '[]' }); });
  const p = await c.newPage(); await p.setViewportSize({ width: 390, height: 844 }); p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.addInitScript((v) => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); if (v) localStorage.setItem('beaterista-aluno-codigo', 'ABC123'); } catch { /* ok */ } }, valido);
  await p.goto(`${url}/aluno.html${hash}`); await sleep(2200); return p;
}
{ // sem código
  const p = await abrir(ctx, false, '#/dicionario');
  const termos = await p.locator('.dc-term').count(); const trancados = await p.locator('.dc-term.locked').count();
  check('Dicionário: 3 termos abertos e os outros com cadeado', termos > 20 && termos - trancados === 3, `${termos - trancados} abertos de ${termos}`);
  await p.locator('.dc-term.locked .dc-head').first().click(); await sleep(300);
  check('tocar num termo trancado mostra o aviso do código', (await p.locator('.am-lock:not([hidden])').count()) === 1);
  await p.locator('.dc-term:not(.locked) .dc-head').first().click(); await sleep(300);
  check('termo aberto mostra a explicação', (await p.locator('.dc-term.open .dc-def').count()) === 1);
  await p.goto(`${url}/aluno.html#/kids/figuras/aula`); await sleep(2000);
  check('Aulinha do Paul abre sem cadeado, no 1º passo', (await p.locator('.au').count()) === 1 && (await p.locator('.am-lock').count()) === 0);
  await p.locator('.au-nav button:has-text("próximo")').click(); await sleep(300);
  check('2º passo ainda é grátis', (await p.locator('.am-lock').count()) === 0 && (await p.locator('.au-nav button:has-text("próximo")').count()) === 1);
  await p.locator('.au-nav button:has-text("próximo")').click(); await sleep(300);
  check('3º passo: aviso do código e sem botão próximo', (await p.locator('.am-lock').count()) === 1 && (await p.locator('.au-nav button:has-text("próximo")').count()) === 0);
  await p.goto(`${url}/aluno.html#/estudos/dicas`); await sleep(1500);
  check('Dicas do método trancadas sem código', (await p.locator('.al-lock').count()) === 1);
  // Quiz e Letras: 2 partidas de caça-palavras
  const cacaJogada = async () => { await p.goto(`${url}/aluno.html#/jogos`); await sleep(800); await p.goto(`${url}/aluno.html#/dicas`); await sleep(2200); const c = p.locator('.dc-grid .dc-c'); await c.nth(0).click(); await c.nth(1).click(); await sleep(300); };
  await p.goto(`${url}/aluno.html#/dicas`); await sleep(2200);
  check('Quiz e Letras sem código abre na caça-palavras (grade 9×9) com palavras do dicionário', (await p.locator('.dc-grid .dc-c').count()) === 81 && (await p.locator('.dc-chips .dc-chip').count()) >= 4);
  check('quiz e cruzadinha: cadeado nas abas', (await p.locator('.dc-pick b').allTextContents()).filter((t) => t.includes('🔒')).length === 2);
  await cacaJogada(); check('1ª partida grátis conta', /grátis 1 de 2/.test(await p.locator('.tr-count').textContent()));
  await cacaJogada(); check('2ª partida grátis conta', /grátis 2 de 2/.test(await p.locator('.tr-count').textContent()));
  await p.goto(`${url}/aluno.html#/jogos`); await sleep(800); await p.goto(`${url}/aluno.html#/dicas`); await sleep(2000);
  check('3ª partida: aviso e sem grade', (await p.locator('.am-lock').count()) === 1 && (await p.locator('.dc-grid').count()) === 0);
  await p.goto(`${url}/aluno.html#/dicas/quiz`); await sleep(1500);
  check('quiz sem código mostra o aviso', (await p.locator('.am-lock').count()) === 1 && (await p.locator('.dc-q').count()) === 0);
  check('nada das dicas foi baixado sem código', baixou === 0, String(baixou));
  // prévia dos jogos que ensinam de verdade
  for (const [h, nome] of [['#/ritmo', 'Beat Hero'], ['#/paulta', 'pauLta'], ['#/jogos/toca', 'Toca Aqui'], ['#/jogos/cartas', 'Uno Musical']]) {
    await p.goto(`${url}/aluno.html#/jogos`); await sleep(600); await p.goto(`${url}/aluno.html${h}`); await sleep(1800);
    const imgs = await p.locator('.pv-fig img').evaluateAll((es) => es.map((e) => e.complete && e.naturalWidth > 0));
    check(`${nome} sem código: mostra a prévia (telas reais), o que faz e o que desenvolve, e o caminho pra lojinha`, (await p.locator('.pv h2').textContent()).includes(nome) && imgs.length >= 2 && imgs.every(Boolean) && (await p.locator('.pv-txt li').count()) >= 6 && (await p.locator('.al-lock a[href="#/lojinha"]').count()) === 1, JSON.stringify(imgs));
  }
  await p.close();
}
{ // com código
  const c2 = await context(browser); const p = await abrir(c2, true, '#/dicionario');
  check('com código: Dicionário todo aberto', (await p.locator('.dc-term.locked').count()) === 0);
  await p.goto(`${url}/aluno.html#/estudos`); await sleep(1500);
  check('com código: sem selos "grátis" e sem cadeado no Estudos', (await p.locator('.al-am').count()) === 0 && (await p.locator('.al-card.locked').count()) === 0);
  await p.goto(`${url}/aluno.html#/estudos/dicas`); await sleep(2500);
  check('com código: Dicas do método lista as dicas pra estudar', (await p.locator('.dc-tipbox').count()) >= 6 && baixou >= 1, String(await p.locator('.dc-tipbox').count()));
  await p.goto(`${url}/aluno.html#/ritmo`); await sleep(2000);
  check('com código: Beat Hero abre de verdade (sem prévia)', (await p.locator('.pv').count()) === 0 && (await p.locator('.al-lock').count()) === 0);
  await p.goto(`${url}/aluno.html#/kids/figuras/aula`); await sleep(1500);
  for (let i = 0; i < 3; i++) await p.locator('.au-nav button:has-text("próximo")').click();
  check('com código: aulinha passa do 2º passo', (await p.locator('.am-lock').count()) === 0);
  await p.close();
}
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
