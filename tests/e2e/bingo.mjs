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
const clickText = (p, sel, t) => p.evaluate(([s, tt]) => { const low = (v) => String(v || '').trim().toLowerCase(); const e = [...document.querySelectorAll(s)].find((x) => (low(x.textContent).startsWith(low(tt)) || low(x.getAttribute('aria-label')).startsWith(low(tt))) && !x.disabled); if (e) e.click(); return !!e; }, [sel, t]);
const sorteados = (p) => p.evaluate(() => { const m = /saíram (\d+) de (\d+)/.exec(document.querySelector('.bg-root').innerText); return m ? [Number(m[1]), Number(m[2])] : null; });

/* ---------- 1. Kids sozinho ---------- */
const p1 = await aparelho(c1, 'solo');
check('menu simples: 4 jeitos de jogar (sozinho marcado), 5 temas, "como jogar" com 3 linhas, ajustes escondidos em "mais opções"', (await p1.$$('.bv-modo')).length === 4 && await p1.evaluate(() => document.querySelector('.bv-modo.on').getAttribute('aria-label').startsWith('sozinho')) && (await p1.$$('.jo-tema')).length === 5 && (await p1.$$('.bv-como li')).length === 3 && await p1.evaluate(() => !document.querySelector('.bv-mais').open && !!document.querySelector('.bv-mais summary')));
check('nenhuma palavra "kids" na tela', !/kids/i.test(await p1.evaluate(() => document.body.innerText)));
check('padrões: qualquer linha, o jogo marca, voz desligada', await p1.evaluate(() => { document.querySelector('.bv-mais').open = true; const t = document.querySelector('.bv-mais').innerText.toLowerCase(); const on = [...document.querySelectorAll('.bv-mais .jo-chips button')].filter((b) => b.getAttribute('aria-checked') === 'true').map((b) => b.textContent); document.querySelector('.bv-mais').open = false; return /qualquer linha/.test(t) && on.includes('o jogo marca') && on.includes('desligada') && on.includes('eu aperto'); }));
await clickText(p1, '.jo-tema', 'Peças da bateria'); await sleep(200);
await clickText(p1, '.bv-go', 'jogar'); await sleep(300);
check('jogo abre com cartela 3×3 (9 casas) e contador', (await p1.$$('.bg-cell')).length === 9 && (await sorteados(p1))[1] === 16);
check('Kids: nenhuma casa marcada antes do primeiro sorteio', (await p1.$$('.bg-cell.on')).length === 0);
await p1.click('.bg-draw'); await p1.waitForFunction(() => /saíram 1 de/.test(document.querySelector('.bg-root').innerText));
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
await p1.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /voltar ao início/.test(x.textContent)); if (b) b.click(); }); await sleep(300);
await p1.evaluate(() => [...document.querySelectorAll('.sheet button')].find((b) => /Sair/.test(b.textContent))?.click()); await sleep(400);
await p1.evaluate(() => { for (const b of document.querySelectorAll('.jg-snd, .jg-mus')) if (b.getAttribute('aria-pressed') === 'true') b.click(); }); await sleep(500); // a musiquinha do jogo é de propósito: desliga pelo botão de som e confere se sobrou som da partida
check('sair da partida: sem som residual', (await pk(p1)) < 0.004);
if (!(await p1.$('.jo-tema'))) { await p1.goto(url + '/aluno.html#/jogos/bingo/livre'); await p1.reload(); await p1.waitForSelector('.jo-tema'); }
/* ---------- 1b. Clássico: marcação manual e sorteio automático com pausa ---------- */
await p1.evaluate(() => { document.querySelector('.bv-mais').open = true; }); await clickText(p1, '.jo-chips button', 'eu marco'); await sleep(200); await clickText(p1, '.jo-chips button', 'automático'); await sleep(200);
await p1.evaluate(() => { for (let i = 0; i < 4; i++) { const w = [...document.querySelectorAll('.jo-passo')].find((x) => / s$/.test(x.querySelector('span').textContent)); if (!w || w.querySelector('span').textContent === '8 s') break; w.querySelector('button').click(); } }); await sleep(200); await clickText(p1, '.bv-go', 'jogar'); await sleep(400);
check('Clássico: marcação manual (nada marcado sozinho) e AUTO ligado', (await p1.$$('.bg-cell.on')).length === 0 && /automático: desligar/.test(await txt(p1)));
await p1.click('.bg-cell'); await sleep(200);
check('Clássico: tocar em item não sorteado não marca e explica sem punir', (await p1.$$('.bg-cell.on')).length === 0 && /ainda não saiu/.test(await txt(p1)));
await p1.waitForFunction(() => /saíram 1 de/.test(document.querySelector('.bg-root').innerText), null, { timeout: 15000 });
check('automático: sorteou sozinho depois do intervalo', true);
await clickText(p1, '.bg-ctl .btn', '⏸ Pausar'); await sleep(9500);
check('pausar segura o sorteio automático', (await sorteados(p1))[0] === 1);
await clickText(p1, '.bg-ctl .btn', '▶ Continuar'); await p1.waitForFunction(() => /saíram 2 de/.test(document.querySelector('.bg-root').innerText), null, { timeout: 15000 });
check('continuar retoma sem perder a sequência', true);
await p1.evaluate(() => { const b = [...document.querySelectorAll('.jg-actions .btn')].find((x) => /voltar ao início/.test(x.textContent)); if (b) b.click(); }); await sleep(300);
await p1.evaluate(() => [...document.querySelectorAll('.sheet button')].find((b) => /Sair/.test(b.textContent))?.click()); await sleep(400);
/* ---------- 2. dois jogadores no mesmo aparelho ---------- */
await p1.evaluate(() => { document.querySelector('.bv-mais').open = true; }); await clickText(p1, '.jo-chips button', 'o jogo marca'); await sleep(200); await clickText(p1, '.jo-chips button', 'eu aperto'); await sleep(200); await clickText(p1, '.bv-modo', 'no mesmo'); await sleep(200);
await clickText(p1, '.bv-go', 'jogar'); await sleep(300);
await p1.click('.bg-draw'); await sleep(300);
check('mesmo aparelho: só UMA cartela na tela e é a do Jogador 1', (await p1.$$('.bg-card')).length === 1 && /vez de Jogador 1/i.test(await txt(p1)));
check('SORTEAR bloqueado até os dois jogadores olharem a cartela', await p1.evaluate(() => document.querySelector('.bg-draw').disabled));
await clickText(p1, '.bg-pass', 'Passar para'); await sleep(250);
check('passou para o Jogador 2 (outra cartela, uma por vez)', /vez de Jogador 2/i.test(await txt(p1)) && (await p1.$$('.bg-card')).length === 1);
check('ainda bloqueado antes do Jogador 2 terminar', await p1.evaluate(() => document.querySelector('.bg-draw').disabled));
await clickText(p1, '.bg-pass', 'Pronto'); await sleep(250);
check('depois dos dois, o próximo sorteio é liberado', await p1.evaluate(() => !document.querySelector('.bg-draw').disabled));
await p1.evaluate(() => document.querySelector('.bg-ghost, .jg-actions .btn.ghost.small')?.click()); await sleep(200);
await p1.evaluate(() => [...document.querySelectorAll('button')].find((b) => /voltar ao início/.test(b.textContent))?.click()); await sleep(300);
await clickText(p1, '.jg-sheet button, .sheet button', 'Sair'); await sleep(300);

/* ---------- 3. sala de aula: impressão das 24 cartelas ---------- */
await p1.evaluate(() => { window.__printed = null; window.print = () => { window.__printed = { cards: document.querySelectorAll('.bg-print .bp-card').length, fichas: document.querySelectorAll('.bg-print .bp-ficha').length, marks: document.querySelectorAll('.bg-print .bp-marks i').length, ids: [...document.querySelectorAll('.bg-print .bp-ch small')].map((x) => x.textContent.split(' · ')[0]) }; }; });
if (!(await p1.$('.jo-tema'))) await p1.goto(url + '/aluno.html#/jogos/bingo/livre');
await p1.waitForSelector('.jo-tema'); await clickText(p1, '.bv-modo', 'sala de aula'); await sleep(200);
await p1.evaluate(() => [...document.querySelectorAll('button')].find((b) => /imprimir cartelas/i.test(b.textContent))?.click()); await sleep(400);
await p1.evaluate(() => [...document.querySelectorAll('.sheet button')].find((b) => /Imprimir/.test(b.textContent) && b.classList.contains('primary'))?.click()); await sleep(900);
const pr = await p1.evaluate(() => window.__printed);
check('impressão: 24 cartelas numeradas, fichas e marcadores', pr && pr.cards === 24 && pr.fichas === 16 && pr.marks === 54 && new Set(pr.ids).size === 24, JSON.stringify(pr && { c: pr.cards, f: pr.fichas, m: pr.marks }));

/* ---------- 3b. tela do jogo no celular: SORTEAR e BINGO grandes lado a lado, sem rolar pra achar ---------- */
{
  await p1.goto(url + '/aluno.html#/jogos/bingo/livre'); await p1.waitForSelector('.bv-go'); await clickText(p1, '.bv-modo', 'sozinho'); await sleep(150);
  await clickText(p1, '.bv-go', 'jogar'); await sleep(300);
  const box = await p1.evaluate(() => { const r = (q) => { const b = document.querySelector(q).getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; }; return { d: r('.bg-draw'), b: r('.bg-bingo'), vw: innerWidth, vh: innerHeight, sw: document.documentElement.scrollWidth }; });
  check('SORTEAR e BINGO lado a lado, grandes e visíveis sem rolar (390x844)', Math.abs(box.d.y - box.b.y) < 4 && box.d.h >= 52 && box.b.h >= 52 && box.d.w > 120 && box.b.w > 120 && box.b.y + box.b.h < box.vh - 80 && box.sw <= box.vw, JSON.stringify(box));
  check('passo a passo curto na tela do jogo', /1 olhe a sua cartela/.test(await txt(p1)));
  check('mensagem de erro humana ao apertar BINGO cedo demais', await (async () => { await p1.click('.bg-bingo'); await sleep(200); return /ainda não: precisa de 3 em linha/.test(await txt(p1)); })());
  /* sair sem querer: a partida fica guardada e aparece "continuar partida" */
  await p1.click('.bg-draw'); await p1.waitForFunction(() => /saíram 1 de/.test(document.querySelector('.bg-root').innerText));
  await clickText(p1, '.jg-actions .btn', 'voltar ao início'); await sleep(300);
  check('voltar ao início guarda a partida e mostra "continuar partida"', !!(await p1.$('.bg-resume .btn')) && /continuar partida/.test(await txt(p1)));
  await p1.reload(); await p1.waitForSelector('.bv-go'); await sleep(300);
  check('depois de recarregar o app, "continuar partida" ainda está lá', /continuar partida/.test(await txt(p1)));
  await clickText(p1, '.bg-resume .btn', 'continuar partida'); await sleep(300);
  check('continuar partida volta com o item sorteado', (await sorteados(p1))?.[0] === 1 && (await p1.$$('.bg-cell')).length === 9);
  await clickText(p1, '.jg-actions .btn', 'voltar ao início'); await sleep(300);
  await p1.evaluate(() => { const g = JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => /jogos/.test(k) && /bingo/.test(localStorage.getItem(k))) || '') || 'null'); window.__ls = !!g; });
}

/* ---------- 3c. pausa geral do app: ctl.pause() / ctl.resume() seguram e retomam o sorteio automático ---------- */
{
  const pc = await c1.newPage(); pc.on('pageerror', (e) => errs.push(`pausa: ${e}`));
  await pc.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.removeItem('beaterista-bingo-sala'); } catch { /* ok */ } });
  await pc.goto(url + '/aluno.html#/jogos'); await sleep(600);
  await pc.evaluate(async () => { const m = await import('./js/jogos/bingo.js'); const h = document.createElement('div'); h.id = 'ctlhost'; document.body.append(h); window.__ctl = m.mount(h); });
  await pc.evaluate(() => { const q = (s) => document.querySelector(`#ctlhost ${s}`); q('.bv-mais').open = true; [...document.querySelectorAll('#ctlhost .bv-mais .jo-chips button')].find((b) => /^automático/.test(b.textContent)).click(); });
  await sleep(150);
  await pc.evaluate(() => { const w = [...document.querySelectorAll('#ctlhost .jo-passo')].find((x) => / s$/.test(x.querySelector('span').textContent)); for (let i = 0; i < 3; i++) w.querySelector('button').click(); });
  await sleep(150); await pc.evaluate(() => document.querySelector('#ctlhost .bv-go').click()); await sleep(200);
  const n = () => pc.evaluate(() => { const m = /saíram (\d+) de/.exec(document.querySelector('#ctlhost').innerText); return m ? Number(m[1]) : -1; });
  check('controlador tem pause() e resume()', await pc.evaluate(() => typeof window.__ctl.pause === 'function' && typeof window.__ctl.resume === 'function'));
  check('automático ligado em 8 s e ainda nada sorteado', (await n()) === 0 && /automático: desligar \(8 s\)/.test(await pc.evaluate(() => document.querySelector('#ctlhost').innerText)));
  await sleep(4000); await pc.evaluate(() => window.__ctl.pause()); await sleep(7000);
  check('pause() segura o sorteio automático (nada saiu em 7 s)', (await n()) === 0, String(await n()));
  await pc.evaluate(() => window.__ctl.resume()); const t0 = Date.now();
  await pc.waitForFunction(() => /saíram 1 de/.test(document.querySelector('#ctlhost').innerText), null, { timeout: 8000 }); const dt = Date.now() - t0;
  check('resume() retoma de onde parou (saiu em cerca de 4 s, não em 8)', dt < 6500 && dt > 2000, `${dt} ms`);
  await pc.evaluate(() => window.__ctl.pause()); await pc.evaluate(() => window.__ctl.pause()); await sleep(9500);
  check('pause() duas vezes não quebra e continua parado', (await n()) === 1);
  await pc.evaluate(() => window.__ctl.resume()); await pc.evaluate(() => window.__ctl.resume());
  await pc.waitForFunction(() => /saíram 2 de/.test(document.querySelector('#ctlhost').innerText), null, { timeout: 11000 });
  check('resume() de novo volta a sortear', true);
  await pc.evaluate(() => window.__ctl.destroy()); await pc.close();
}

/* ---------- 4. ONLINE por código: dois aparelhos ---------- */
if (!PGlite) { console.log('AVISO: PGlite ausente, teste online pulado'); } else {
  const c2 = await context(browser); const pa = p1; const pb = await aparelho(c2, 'convidado');
  await pa.goto(url + '/aluno.html#/jogos/bingo/livre'); await pa.waitForSelector('.jo-tema');
  await clickText(pa, '.bv-modo', 'com alguém'); await sleep(200);
  await pa.fill('.bg-online input[type=text]', 'Ana'); await clickText(pa, '.bg-online .bv-bigbtn', 'criar sala');
  await pa.waitForSelector('.jg-code', { timeout: 8000 }); const code = (await pa.textContent('.jg-code')).trim();
  check('anfitrião recebe código de 6 caracteres sem ambíguos', /^[A-HJKMNP-Z2-9]{6}$/.test(code), code);
  await clickText(pb, '.bv-modo', 'com alguém'); await sleep(200);
  await pb.fill('.bg-online input[type=text]', 'Beto'); await pb.fill('.bg-online .jg-code-in', code); await clickText(pb, '.bg-online .btn', 'ENTRAR COM CÓDIGO');
  await pb.waitForSelector('.jg-code', { timeout: 8000 });
  check('convidado entra na mesma sala (lobby)', (await pb.textContent('.jg-code')).trim() === code);
  await pa.waitForFunction(() => !document.querySelector('.bv-bigbtn')?.disabled, null, { timeout: 8000 });
  await clickText(pa, '.bv-bigbtn', 'começar'); await pa.waitForSelector('.bg-cell', { timeout: 8000 }); await pb.waitForSelector('.bg-cell', { timeout: 8000 });
  const cardA = await pa.$$eval('.bg-cell small', (e) => e.map((x) => x.textContent)); const cardB = await pb.$$eval('.bg-cell small', (e) => e.map((x) => x.textContent));
  check('cada um tem 9 itens distintos, e as cartelas são diferentes', new Set(cardA).size === 9 && new Set(cardB).size === 9 && cardA.join() !== cardB.join());
  check('convidado não tem o botão de sortear (só o anfitrião sorteia)', await pb.evaluate(() => document.querySelector('.bg-draw').disabled));
  await pa.click('.bg-draw'); await pa.waitForFunction(() => /saíram 1 de/.test(document.querySelector('.bg-root').innerText));
  await pb.waitForFunction(() => /saíram 1 de/.test(document.querySelector('.bg-root').innerText), null, { timeout: 8000 });
  const ca = await pa.$eval('.bg-call b', (e) => e.textContent); const cb = await pb.$eval('.bg-call b', (e) => e.textContent);
  check('mesmo item sorteado nos dois aparelhos, sincronizado', ca === cb && ca.length > 0, `${ca} / ${cb}`);
  for (let i = 0; i < 15; i++) { await sleep(950); await pa.evaluate(() => document.querySelector('.bg-draw').click()); }
  await pb.waitForFunction(() => /saíram 16 de 16/.test(document.querySelector('.bg-root').innerText), null, { timeout: 12000 });
  check('16 sorteios chegam no convidado', true);
  // pedido de bingo dos dois quase juntos: mesmo sorteio completa linha dos dois (todos os 16 saíram) → empate
  await Promise.all([pa.click('.bg-bingo'), pb.click('.bg-bingo')]); await sleep(1800);
  const ta = await txt(pa); const tb = await txt(pb);
  check('vitória decidida pelo servidor e igual nos dois aparelhos', /BINGO|Empate/.test(ta) && /BINGO|Empate/.test(tb) && /Empate/.test(ta) === /Empate/.test(tb), `${ta.match(/Empate|fez BINGO|venceu/)} | ${tb.match(/Empate|fez BINGO|venceu/)}`);
  // reconexão: recarrega o convidado e volta pra sala
  await pb.reload(); await pb.waitForSelector('.bg-root'); await sleep(400);
  check('depois de recarregar aparece "voltar à sala"', /voltar pra sala [A-Z0-9]{6}/.test(await txt(pb)));
  await clickText(pb, '.bg-resume .btn', 'voltar pra sala'); await sleep(1800);
  check('reconectou e a partida (histórico) foi restaurada', (await sorteados(pb))?.[0] === 16 && (await pb.$$('.bg-cell')).length === 9);
  await c2.close();
}
check('sem erros de script', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
