// Jogo da memória (área dos alunos): abre direto na escolha do tema, sem modo aventura. Abertos: The Beatles, Rock e Profissões;
// os outros 7 (Bandas, Solos e os desenhados) só com código. Pares 6, 8 ou 12. Joga uma partida inteira (acha todos os pares) e vê o resultado.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: false });
const errs = [];
async function abrir(c, nome = 'Teste', valido = false) {
  await c.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().url().includes('aluno_codigo_ok') ? String(valido) : '[]' }));
  const p = await c.newPage(); await p.setViewportSize({ width: 390, height: 844 }); p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.addInitScript((n) => { try { localStorage.setItem('beaterista-aluno-nome', n); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } }, nome);
  await p.goto(`${url}/aluno.html#/jogos/memart`); await p.waitForSelector('.mem-theme', { timeout: 15000 }); await sleep(500); return p;
}
const rotulo = (p) => p.locator('.mem-step > span').textContent();
const passo = async (p, dir) => { await p.locator(`.mem-step button[aria-label="${dir > 0 ? 'mais' : 'menos'} pares"]`).click(); await sleep(250); };
const temas = (p) => p.locator('.mem-theme').evaluateAll((es) => es.map((e) => ({ t: e.querySelector('b').textContent.trim(), lk: e.classList.contains('locked') })));
async function jogarTudo(p) { // lê a foto de cada carta, vira os pares e espera o resultado
  const pares = await p.evaluate(() => { const m = {}; [...document.querySelectorAll('.kx-mem')].forEach((b, i) => { const im = b.querySelector('img.mem-card-img'); (m[im.getAttribute('src')] ||= []).push(i); }); return Object.values(m); });
  for (const [a, b] of pares) { await p.locator('.kx-mem').nth(a).click(); await p.locator('.kx-mem').nth(b).click(); await sleep(850); }
  return pares;
}
{ // aluno sem código
  const p = await abrir(ctx);
  check('abre direto na escolha de tema (sem escolher modo aventura)', (await p.locator('.av-root, .av-modes, .ma-esc').count()) === 0 && (await p.locator('.mem-theme').count()) >= 8);
  const t = await temas(p);
  check('abertos: só The Beatles, Rock e Profissões da música', JSON.stringify(t.filter((x) => !x.lk).map((x) => x.t).sort()) === JSON.stringify(['Profissões da música', 'Rock', 'The Beatles']), JSON.stringify(t));
  check('trancados: Bandas, Solos e os outros 5 temas (7 no total)', t.filter((x) => x.lk).length === 7 && t.filter((x) => x.lk).map((x) => x.t).includes('Bandas') && t.filter((x) => x.lk).map((x) => x.t).includes('Solos'), t.filter((x) => x.lk).map((x) => x.t).join(', '));
  await p.locator('.mem-theme.locked').first().click(); await sleep(300);
  check('tocar num tema trancado avisa e não troca o tema', (await p.locator('.mem-lockmsg').count()) === 1 && (await p.locator('.mem-theme.on b').textContent()).includes('The Beatles'));
  check('opções discretas: ícones 👤 👥 🤖 📱 e setinhas de pares (começa em 8)', (await p.locator('.mem-ic').count()) === 4 && (await rotulo(p)) === '8 pares' && (await p.locator('.kd-chip').count()) === 0);
  await passo(p, -1); check('setinha ‹ leva a 6 pares e trava no mínimo', (await rotulo(p)) === '6 pares' && await p.locator('.mem-step button[aria-label="menos pares"]').isDisabled());
  await passo(p, 1); await passo(p, 1); check('setinha › chega a 12 pares e trava no máximo', (await rotulo(p)) === '12 pares' && await p.locator('.mem-step button[aria-label="mais pares"]').isDisabled());
  await passo(p, -1); await passo(p, -1); await p.locator('.kx-go').click(); await sleep(600);
  check('The Beatles com 6 pares: 12 cartas de foto', (await p.locator('.kx-mem').count()) === 12 && (await p.locator('.kx-mem img.mem-card-img').count()) === 12);
  const pares = await jogarTudo(p); await sleep(2400);
  check('achou todos os 6 pares e aparece o resultado', pares.length === 6 && (await p.locator('.kx-result').count()) === 1, String(pares.length));
  await p.locator('.kx-result .kd-chip').click(); await sleep(400);
  await p.locator('.mem-theme:has-text("Profissões")').click(); await sleep(300);
  await passo(p, 1);
  check('Profissões tem 8 cartas: para em 8 pares', (await rotulo(p)) === '8 pares' && await p.locator('.mem-step button[aria-label="mais pares"]').isDisabled(), await rotulo(p));
  await p.locator('.mem-theme.locked:has-text("Solos")').click(); await sleep(300);
  check('Solos trancado: avisa e não troca o tema', (await p.locator('.mem-lockmsg').count()) === 1 && (await p.locator('.mem-theme.on').textContent()).includes('Profissões'));
  await p.close();
}
{ // aluno com código: tudo aberto
  const c2 = await context(browser); const p = await abrir(c2, 'Ana', true);
  check('com código: nenhum tema trancado', (await p.locator('.mem-theme.locked').count()) === 0 && (await p.locator('.mem-theme').count()) >= 8);
  await p.locator('.mem-ic').nth(1).click(); await sleep(200);
  check('2 jogadores: aparece o ↻ (acertou, joga de novo)', (await p.locator('.mem-ic[aria-label="quem acerta joga de novo"]').count()) === 1);
  await p.locator('.mem-ic').nth(0).click(); await sleep(200);
  await p.locator('.mem-theme:has-text("Solos")').click(); await sleep(300); while ((await rotulo(p)) !== '12 pares') await passo(p, 1);
  check('com código: Solos vai a 12 pares', (await rotulo(p)) === '12 pares'); await p.locator('.kx-go').click(); await sleep(600);
  check('com código: Solos com 12 pares tem 24 cartas, com nome embaixo', (await p.locator('.kx-mem').count()) === 24 && (await p.locator('.mem-cap').count()) === 24);
  await p.locator('.kx-top, .mem-top .kd-chip').first().click().catch(() => {}); await sleep(300);
  // contra o Paul (🤖): a aluna erra de propósito, o Paul joga, e a partida termina com vencedor
  await p.locator('.mem-theme:has-text("The Beatles")').click(); await sleep(300);
  while ((await rotulo(p)) !== '6 pares') await passo(p, -1);
  await p.locator('.mem-ic[aria-label="jogar contra o Paul"]').click(); await sleep(300);
  await p.locator('.kx-go').click(); await sleep(600);
  const fotos = await p.evaluate(() => [...document.querySelectorAll('.kx-mem')].map((b) => b.querySelector('img.mem-card-img').getAttribute('src')));
  const diff = fotos.findIndex((f, i) => i > 0 && f !== fotos[0]);
  check('contra o Paul: começa na sua vez', (await p.locator('.kx-memstat').textContent()).includes('sua vez'));
  await p.locator('.kx-mem').nth(0).click(); await p.locator('.kx-mem').nth(diff).click(); await sleep(1500);
  check('errou: passa a vez pro Paul', (await p.locator('.kx-memstat').textContent()).includes('vez do Paul'));
  await p.locator('.kx-mem').nth(1).click({ force: true }).catch(() => {}); await sleep(300);
  check('na vez do Paul a aluna não consegue virar carta', (await p.locator('.kx-mem.up').count()) === 0);
  await p.waitForFunction(() => /sua vez/.test(document.querySelector('.kx-memstat').textContent) || !!document.querySelector('.kx-result'), null, { timeout: 40000 });
  const grupos = await p.evaluate(() => { const m = {}; [...document.querySelectorAll('.kx-mem')].forEach((b, i) => { if (b.classList.contains('ok')) return; (m[b.querySelector('img.mem-card-img').getAttribute('src')] ||= []).push(i); }); return Object.values(m); });
  for (const [a, b] of grupos) { await p.locator('.kx-mem').nth(a).click(); await p.locator('.kx-mem').nth(b).click(); await sleep(900); }
  await p.waitForSelector('.kx-result', { timeout: 20000 }); const res = await p.locator('.kx-result h2').textContent();
  check('contra o Paul: termina com vencedor ou empate', /você venceu|o Paul venceu|empate/.test(res), res);
  await p.locator('.kx-result .kd-chip').click(); await sleep(300);
  await p.locator('.mem-theme:has-text("Instrumentos")').click(); await sleep(300); await p.locator('.kx-go').click(); await sleep(600);
  check('com código: Instrumentos musicais joga (6 pares = 12 cartas)', (await p.locator('.kx-mem').count()) === 12);
  await p.close();
}
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
