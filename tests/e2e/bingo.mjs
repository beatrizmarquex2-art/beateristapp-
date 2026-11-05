// Bingo musical v2 (área do aluno): Kids sozinho, 2 no mesmo aparelho (uma cartela por vez), sala de aula (impressão de 24 cartelas)
// e ONLINE por código com dois aparelhos de verdade (dois contextos do navegador) falando com o SQL real da sala (PGlite).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { serve, launch, context, sleep, check, done } from './harness.mjs';

let PGlite = null;
for (const p of ['/tmp/claude-0/pgtest/node_modules/@electric-sql/pglite/dist/index.js', '@electric-sql/pglite']) { try { ({ PGlite } = await import(p)); break; } catch { /* tenta o próximo */ } }
const { srv, url } = await serve();
const { browser, ctx: c1 } = await launch();
const errs = [];

/** Simula o Supabase: cada chamada /rest/v1/rpc/<fn> vira SELECT no Postgres (PGlite) com o SQL de supabase/009_bingo_salas.sql. */
let db = null;
async function backend(ctx) {
  await ctx.route('**/rest/v1/rpc/**', async (route) => {
    const fnName = new URL(route.request().url()).pathname.split('/').pop();
    if (!db) { route.fulfill({ status: 404, body: '{}' }); return; }
    const body = JSON.parse(route.request().postData() || '{}'); const keys = Object.keys(body);
    try {
      const rows = (await db.query(`select * from public.${fnName}(${keys.map((k, i) => `${k} => $${i + 1}`).join(', ')})`, keys.map((k) => body[k]))).rows;
      const scalar = fnName !== 'bingo_criar' && fnName !== 'bingo_entrar';
      const out = scalar ? (rows[0] ? rows[0][fnName] : null) : rows;
      if (out === null || out === undefined) route.fulfill({ status: 204, body: '' }); else route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(out) });
    } catch (e) { route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: String(e.message) }) }); }
  });
}
if (PGlite) { db = new PGlite(); await db.exec('create role anon nologin; create role authenticated nologin;'); await db.exec(readFileSync(fileURLToPath(new URL('../../supabase/009_bingo_salas.sql', import.meta.url)), 'utf8')); }

async function aparelho(ctx, nome) {
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(`${nome}: ${e}`));
  await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch { /* ok */ } });
  await backend(ctx);
  await page.goto(url + '/aluno.html#/jogos/bingo/livre'); await page.waitForSelector('.bg-root');
  return page;
}
const txt = (p) => p.evaluate(() => document.querySelector('.bg-root').innerText);
const clickText = (p, sel, t) => p.evaluate(([s, tt]) => { const e = [...document.querySelectorAll(s)].find((x) => x.textContent.trim().startsWith(tt) && !x.disabled); if (e) e.click(); return !!e; }, [sel, t]);
const sorteados = (p) => p.evaluate(() => { const m = /Sorteados: (\d+) de (\d+)/.exec(document.querySelector('.bg-root').innerText); return m ? [Number(m[1]), Number(m[2])] : null; });

/* ---------- 1. Kids sozinho ---------- */
const p1 = await aparelho(c1, 'solo');
check('menu: 5 temas, perfil Kids por padrão, mini-tutorial de 5 passos', (await p1.$$('.bg-poster')).length === 5 && (await p1.$$('.bg-how li')).length === 5 && await p1.evaluate(() => [...document.querySelectorAll('.bg-seg button')].some((b) => b.textContent === 'Kids' && b.getAttribute('aria-checked') === 'true')));
await clickText(p1, '.bg-poster', 'Peças da bateria'); await sleep(200);
await clickText(p1, '.bg-bigbtn', 'Jogar'); await sleep(300);
check('jogo abre com cartela 3×3 (9 casas) e contador', (await p1.$$('.bg-cell')).length === 9 && (await sorteados(p1))[1] === 16);
check('Kids: nenhuma casa marcada antes do primeiro sorteio', (await p1.$$('.bg-cell.on')).length === 0);
await p1.click('.bg-draw'); await p1.waitForFunction(() => /Sorteados: 1 de/.test(document.querySelector('.bg-root').innerText));
await p1.click('.bg-draw'); await sleep(250);
check('toque duplo no SORTEAR não pula item (ainda 1 sorteado)', (await sorteados(p1))[0] === 1);
for (let i = 0; i < 15; i++) { await sleep(950); await p1.evaluate(() => document.querySelector('.bg-draw').click()); }
await sleep(300);
const s = await sorteados(p1); check('16 sorteios sem repetir e o jogo não trava no último', s[0] === 16, JSON.stringify(s));
check('Kids: marcação automática marcou as 9 casas (todos os itens saíram)', (await p1.$$('.bg-cell.on')).length === 9);
await p1.click('.bg-bingo'); await sleep(500);
check('BINGOOOO! aparece em tela cheia com confete', !!(await p1.$('.bg-boom .bg-word')) && (await p1.$$('.bg-conf i')).length > 20);
await p1.click('.bg-boom button'); await sleep(300);
check('BINGO! confere e mostra o resultado com a linha vencedora', /BINGO/.test(await txt(p1)) && (await p1.$$('.bg-cell.win')).length === 3);
await p1.click('.bg-result .btn.ghost'); await sleep(300);

const pk = (p) => p.evaluate(() => window.__peak(700)); await p1.click('.bg-draw').catch(() => {});
await p1.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Sair para o menu/.test(x.textContent)); if (b) b.click(); }); await sleep(300);
await p1.evaluate(() => [...document.querySelectorAll('.sheet button')].find((b) => /Sair/.test(b.textContent))?.click()); await sleep(400);
check('sair da partida: sem som residual', (await pk(p1)) < 0.004);
if (!(await p1.$('.bg-poster'))) { await p1.goto(url + '/aluno.html#/jogos/bingo/livre'); await p1.reload(); await p1.waitForSelector('.bg-poster'); }
/* ---------- 1b. Clássico: marcação manual e sorteio automático com pausa ---------- */
await clickText(p1, '.bg-seg button', 'Clássico'); await sleep(200); await clickText(p1, '.bg-seg button', 'Automático'); await sleep(200);
await clickText(p1, '.bg-seg button', '8 s'); await sleep(200); await clickText(p1, '.bg-bigbtn', 'Jogar'); await sleep(400);
check('Clássico: marcação manual (nada marcado sozinho) e AUTO ligado', (await p1.$$('.bg-cell.on')).length === 0 && /AUTO: desligar/.test(await txt(p1)));
await p1.click('.bg-cell'); await sleep(200);
check('Clássico: tocar em item não sorteado não marca e explica sem punir', (await p1.$$('.bg-cell.on')).length === 0 && /ainda não saiu/.test(await txt(p1)));
await p1.waitForFunction(() => /Sorteados: 1 de/.test(document.querySelector('.bg-root').innerText), null, { timeout: 15000 });
check('automático: sorteou sozinho depois do intervalo', true);
await clickText(p1, '.bg-ctl .btn', '⏸ Pausar'); await sleep(9500);
check('pausar segura o sorteio automático', (await sorteados(p1))[0] === 1);
await clickText(p1, '.bg-ctl .btn', '▶ Continuar'); await p1.waitForFunction(() => /Sorteados: 2 de/.test(document.querySelector('.bg-root').innerText), null, { timeout: 15000 });
check('continuar retoma sem perder a sequência', true);
await p1.evaluate(() => { const b = [...document.querySelectorAll('.jg-actions .btn')].find((x) => /Sair para o menu/.test(x.textContent)); if (b) b.click(); }); await sleep(300);
await p1.evaluate(() => [...document.querySelectorAll('.sheet button')].find((b) => /Sair/.test(b.textContent))?.click()); await sleep(400);
/* ---------- 2. dois jogadores no mesmo aparelho ---------- */
await clickText(p1, '.bg-seg button', 'Kids'); await sleep(200); await clickText(p1, '.bg-seg button', 'Manual'); await sleep(200); await clickText(p1, '.bg-seg button', '2 jogadores'); await sleep(200);
await clickText(p1, '.bg-bigbtn', 'Jogar'); await sleep(300);
await p1.click('.bg-draw'); await sleep(300);
check('mesmo aparelho: só UMA cartela na tela e é a do Jogador 1', (await p1.$$('.bg-card')).length === 1 && /Vez de Jogador 1/.test(await txt(p1)));
check('SORTEAR bloqueado até os dois jogadores olharem a cartela', await p1.evaluate(() => document.querySelector('.bg-draw').disabled));
await clickText(p1, '.bg-pass', 'Passar para'); await sleep(250);
check('passou para o Jogador 2 (outra cartela, uma por vez)', /Vez de Jogador 2/.test(await txt(p1)) && (await p1.$$('.bg-card')).length === 1);
check('ainda bloqueado antes do Jogador 2 terminar', await p1.evaluate(() => document.querySelector('.bg-draw').disabled));
await clickText(p1, '.bg-pass', 'Pronto'); await sleep(250);
check('depois dos dois, o próximo sorteio é liberado', await p1.evaluate(() => !document.querySelector('.bg-draw').disabled));
await p1.evaluate(() => document.querySelector('.bg-ghost, .jg-actions .btn.ghost.small')?.click()); await sleep(200);
await p1.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Sair para o menu/.test(b.textContent))?.click()); await sleep(300);
await clickText(p1, '.jg-sheet button, .sheet button', 'Sair'); await sleep(300);

/* ---------- 3. sala de aula: impressão das 24 cartelas ---------- */
await p1.evaluate(() => { window.__printed = null; window.print = () => { window.__printed = { cards: document.querySelectorAll('.bg-print .bp-card').length, fichas: document.querySelectorAll('.bg-print .bp-ficha').length, marks: document.querySelectorAll('.bg-print .bp-marks i').length, ids: [...document.querySelectorAll('.bg-print .bp-ch small')].map((x) => x.textContent.split(' · ')[0]) }; }; });
if (!(await p1.$('.bg-poster'))) await p1.goto(url + '/aluno.html#/jogos/bingo/livre');
await p1.waitForSelector('.bg-poster'); await clickText(p1, '.bg-seg button', 'Sala de aula'); await sleep(200);
await p1.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Imprimir cartelas/.test(b.textContent))?.click()); await sleep(400);
await p1.evaluate(() => [...document.querySelectorAll('.sheet button')].find((b) => /Imprimir/.test(b.textContent) && b.classList.contains('primary'))?.click()); await sleep(900);
const pr = await p1.evaluate(() => window.__printed);
check('impressão: 24 cartelas numeradas, fichas e marcadores', pr && pr.cards === 24 && pr.fichas === 16 && pr.marks === 54 && new Set(pr.ids).size === 24, JSON.stringify(pr && { c: pr.cards, f: pr.fichas, m: pr.marks }));

/* ---------- 4. ONLINE por código: dois aparelhos ---------- */
if (!PGlite) { console.log('AVISO: PGlite ausente, teste online pulado'); } else {
  const c2 = await context(browser); const pa = p1; const pb = await aparelho(c2, 'convidado');
  await pa.goto(url + '/aluno.html#/jogos/bingo/livre'); await pa.waitForSelector('.bg-poster');
  await clickText(pa, '.bg-seg button', 'Jogar online'); await sleep(200);
  await pa.fill('.bg-online input[type=text]', 'Ana'); await clickText(pa, '.bg-online .bg-bigbtn', 'CRIAR SALA');
  await pa.waitForSelector('.jg-code', { timeout: 8000 }); const code = (await pa.textContent('.jg-code')).trim();
  check('anfitrião recebe código de 6 caracteres sem ambíguos', /^[A-HJKMNP-Z2-9]{6}$/.test(code), code);
  await clickText(pb, '.bg-seg button', 'Jogar online'); await sleep(200);
  await pb.fill('.bg-online input[type=text]', 'Beto'); await pb.fill('.bg-online .jg-code-in', code); await clickText(pb, '.bg-online .btn', 'ENTRAR COM CÓDIGO');
  await pb.waitForSelector('.jg-code', { timeout: 8000 });
  check('convidado entra na mesma sala (lobby)', (await pb.textContent('.jg-code')).trim() === code);
  await pa.waitForFunction(() => !document.querySelector('.bg-bigbtn')?.disabled, null, { timeout: 8000 });
  await clickText(pa, '.bg-bigbtn', 'COMEÇAR'); await pa.waitForSelector('.bg-cell', { timeout: 8000 }); await pb.waitForSelector('.bg-cell', { timeout: 8000 });
  const cardA = await pa.$$eval('.bg-cell small', (e) => e.map((x) => x.textContent)); const cardB = await pb.$$eval('.bg-cell small', (e) => e.map((x) => x.textContent));
  check('cada um tem 9 itens distintos, e as cartelas são diferentes', new Set(cardA).size === 9 && new Set(cardB).size === 9 && cardA.join() !== cardB.join());
  check('convidado não tem o botão de sortear (só o anfitrião sorteia)', await pb.evaluate(() => document.querySelector('.bg-draw').disabled));
  await pa.click('.bg-draw'); await pa.waitForFunction(() => /Sorteados: 1 de/.test(document.querySelector('.bg-root').innerText));
  await pb.waitForFunction(() => /Sorteados: 1 de/.test(document.querySelector('.bg-root').innerText), null, { timeout: 8000 });
  const ca = await pa.$eval('.bg-call b', (e) => e.textContent); const cb = await pb.$eval('.bg-call b', (e) => e.textContent);
  check('mesmo item sorteado nos dois aparelhos, sincronizado', ca === cb && ca.length > 0, `${ca} / ${cb}`);
  for (let i = 0; i < 15; i++) { await sleep(950); await pa.evaluate(() => document.querySelector('.bg-draw').click()); }
  await pb.waitForFunction(() => /Sorteados: 16 de 16/.test(document.querySelector('.bg-root').innerText), null, { timeout: 12000 });
  check('16 sorteios chegam no convidado', true);
  // pedido de bingo dos dois quase juntos: mesmo sorteio completa linha dos dois (todos os 16 saíram) → empate
  await Promise.all([pa.click('.bg-bingo'), pb.click('.bg-bingo')]); await sleep(1800);
  const ta = await txt(pa); const tb = await txt(pb);
  check('vitória decidida pelo servidor e igual nos dois aparelhos', /BINGO|Empate/.test(ta) && /BINGO|Empate/.test(tb) && /Empate/.test(ta) === /Empate/.test(tb), `${ta.match(/Empate|fez BINGO|venceu/)} | ${tb.match(/Empate|fez BINGO|venceu/)}`);
  // reconexão: recarrega o convidado e volta pra sala
  await pb.reload(); await pb.waitForSelector('.bg-root'); await sleep(400);
  check('depois de recarregar aparece "voltar à sala"', /sala online aberta/.test(await txt(pb)));
  await clickText(pb, '.bg-resume .btn', 'voltar à sala'); await sleep(1800);
  check('reconectou e a partida (histórico) foi restaurada', (await sorteados(pb))?.[0] === 16 && (await pb.$$('.bg-cell')).length === 9);
  await c2.close();
}
check('sem erros de script', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
