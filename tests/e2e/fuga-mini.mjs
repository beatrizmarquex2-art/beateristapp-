// Jogos de toque da Fuga (lote 1): Genius, caminho 3×3 e memória. Joga de verdade: grava a sequência que acende e repete.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
const SH = process.env.SHOTS || '/tmp';
await page.goto(`${url}/aluno.html`); await sleep(1500);
const monta = (tipo, nivel, area) => page.evaluate(async ([tipo, nivel, area]) => {
  const m = await import('/js/jogos/fuga-mini.js'); document.body.className = 'aluno-on'; document.body.innerHTML = '<div class="jg jg-wrap dc-wrap escuro fg-wrap" style="padding:14px;background:#0b0e1c"><div id="cx" class="dc-box"></div></div>';
  window.__fim = 0; window.__seq = []; const cx = document.getElementById('cx'); window.__api = m.MINI[tipo](cx, { nivel, area, fim: () => { window.__fim++; } });
  new MutationObserver((ms) => { for (const r of ms) { const e = r.target; if (e.classList.contains('on') && !/\bon\b/.test(r.oldValue || '')) window.__seq.push(e.dataset.pad ?? e.dataset.cel); } }).observe(cx, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
}, [tipo, nivel, area]);
// ---- genius (fácil, 4 rodadas, notas): ouve, repete a rodada inteira, completa tudo sem erro ----
await monta('genius', 'facil', 'notas'); await page.locator('.fgm-go').click();
let ok = true;
for (let r = 1; r <= 4; r++) {
  await page.waitForFunction(() => /sua vez/.test(document.querySelector('.fgm-msg').textContent), null, { timeout: 15000 });
  const seq = await page.evaluate((r) => window.__seq.slice(-r), r); if (seq.length !== r) ok = false;
  if (r === 2) await page.screenshot({ path: `${SH}/fuga-genius.png` });
  await page.evaluate(() => { window.__seq = []; });
  for (const p of seq) { await page.locator(`.fgm-pad[data-pad="${p}"]`).click(); await sleep(120); }
  await sleep(1300);
}
await sleep(800);
check('genius: 4 rodadas completas sem erro → chama fim, 3 ★', ok && (await page.evaluate(() => window.__fim)) === 1 && JSON.stringify(await page.evaluate(() => window.__api.stats())) === '{"erros":0,"found":4,"total":4,"estrelas":3}', JSON.stringify(await page.evaluate(() => window.__api.stats())));
// ---- genius: errar conta erro e repete a rodada (área bateria, 6 botões no difícil) ----
await monta('genius', 'dificil', 'bateria'); await page.locator('.fgm-go').click();
await page.waitForFunction(() => /sua vez/.test(document.querySelector('.fgm-msg').textContent), null, { timeout: 15000 });
const certo = (await page.evaluate(() => window.__seq.slice(-1)))[0]; const errado = String((Number(certo) + 1) % 6); await page.locator(`.fgm-pad[data-pad="${errado}"]`).click(); await sleep(300);
check('genius difícil na bateria: 6 botões; errar conta 1 erro e a rodada se repete', (await page.locator('.fgm-pad').count()) === 6 && (await page.evaluate(() => window.__api.stats().erros)) === 1 && /errou/.test(await page.textContent('.fgm-msg')));
await page.screenshot({ path: `${SH}/fuga-genius-bateria.png` });
// ---- caminho 3×3 (fácil: 2 caminhos de 4 casas) ----
await monta('caminho', 'facil'); await page.locator('.fgm-go').click(); ok = true;
for (let c = 0; c < 2; c++) {
  await page.waitForFunction(() => /agora é você/.test(document.querySelector('.fgm-msg').textContent), null, { timeout: 20000 });
  const seq = await page.evaluate(() => window.__seq.slice()); if (seq.length !== 4) ok = false;
  if (c === 0) await page.screenshot({ path: `${SH}/fuga-caminho.png` });
  await page.evaluate(() => { window.__seq = []; });
  for (const p of seq) { await page.locator(`.fgm-cel[data-cel="${p}"]`).click(); await sleep(120); }
  await sleep(1500);
}
await sleep(800);
check('caminho 3×3: 2 caminhos de 4 casas refeitos sem erro → fim, 3 ★', ok && (await page.evaluate(() => window.__fim)) === 1 && (await page.evaluate(() => window.__api.stats().estrelas)) === 3, JSON.stringify(await page.evaluate(() => window.__api.stats())));
await monta('caminho', 'facil'); await page.locator('.fgm-go').click();
await page.waitForFunction(() => /agora é você/.test(document.querySelector('.fgm-msg').textContent), null, { timeout: 20000 });
const primeiro = (await page.evaluate(() => window.__seq))[0]; const outro = String((Number(primeiro) + 4) % 9); await page.locator(`.fgm-cel[data-cel="${outro}"]`).click(); await sleep(300);
check('caminho: tocar numa casa errada conta erro e mostra o caminho de novo', (await page.evaluate(() => window.__api.stats().erros)) === 1 && /olhe de novo/.test(await page.textContent('.fgm-msg')));
// ---- memória (fácil: 4 pares) ----
await monta('memoria', 'facil'); await sleep(200);
check('memória fácil: 8 cartas viradas pra baixo', (await page.locator('.fgm-carta').count()) === 8 && (await page.locator('.fgm-carta.up').count()) === 0);
const ps = await page.evaluate(() => [...new Set([...document.querySelectorAll('.fgm-carta')].map((e) => e.dataset.par))]);
await page.locator('.fgm-carta').nth(0).click(); const par0 = await page.evaluate(() => document.querySelectorAll('.fgm-carta')[0].dataset.par);
const outraDe = await page.evaluate((p) => [...document.querySelectorAll('.fgm-carta')].findIndex((e, i) => i > 0 && e.dataset.par !== p), par0);
await page.locator('.fgm-carta').nth(outraDe).click(); await sleep(250); await page.screenshot({ path: `${SH}/fuga-memoria.png` });
await sleep(1200);
check('memória: virar 2 cartas diferentes conta 1 erro e desvira', (await page.evaluate(() => window.__api.stats().erros)) === 1 && (await page.locator('.fgm-carta.up').count()) === 0);
for (const p of ps) { const ids = await page.evaluate((p) => [...document.querySelectorAll('.fgm-carta')].map((e, i) => (e.dataset.par === p ? i : -1)).filter((i) => i >= 0), p); for (const i of ids) { await page.locator('.fgm-carta').nth(i).click(); await sleep(150); } await sleep(200); }
await sleep(900);
check('memória: achar os 4 pares chama fim; 1 erro = 3 ★', (await page.evaluate(() => window.__fim)) === 1 && (await page.evaluate(() => window.__api.stats().estrelas)) === 3 && (await page.locator('.fgm-carta.par').count()) === 8, JSON.stringify(await page.evaluate(() => window.__api.stats())));
// notas caindo: 8 figuras; levar o Paul pro lado certo em todas = 0 erros, 3 ★, e chama fim
await page.evaluate(async () => { window.__fim = 0; const m = await import('/js/jogos/fuga-mini.js'); document.body.innerHTML = '<div id="b"></div>'; window.__api = m.queda(document.getElementById('b'), { nivel: 'facil', fim: () => { window.__fim = (window.__fim || 0) + 1; } }); });
await page.locator('.fgm-go').click();
for (let i = 0; i < 120 && !(await page.evaluate(() => window.__fim)); i++) { await page.evaluate(() => { const it = window.__api.item(); if (it) window.__api.vai(it.ok); }); await sleep(250); }
check('notas caindo: certo nas 8 figuras = 0 erros, 3 ★ e chama fim', (await page.evaluate(() => window.__fim)) === 1 && (await page.evaluate(() => JSON.stringify(window.__api.stats()))) === '{"erros":0,"found":8,"total":8,"estrelas":3}', await page.evaluate(() => JSON.stringify(window.__api.stats())));
// 4 notas caindo (4 faixas): 4 nomes na tela, Paul na faixa certa em todas = 0 erros
await page.evaluate(async () => { window.__fim = 0; const m = await import('/js/jogos/fuga-mini.js'); document.body.innerHTML = '<div id="b"></div>'; window.__api = m.queda4(document.getElementById('b'), { nivel: 'facil', fim: () => { window.__fim = (window.__fim || 0) + 1; } }); });
await page.locator('.fgm-go').click(); await sleep(400);
check('4 notas caindo: 4 nomes na tela', (await page.locator('.fgq-nome').count()) === 4 && (await page.evaluate(() => new Set([...document.querySelectorAll('.fgq-nome')].map((e) => e.textContent)).size)) === 4);
for (let i = 0; i < 160 && !(await page.evaluate(() => window.__fim)); i++) { await page.evaluate(() => { const it = window.__api.item(); if (it) window.__api.vai(it.ok); }); await sleep(250); }
check('4 notas caindo: faixa certa nas 8 = 0 erros, 3 ★ e chama fim', (await page.evaluate(() => window.__fim)) === 1 && (await page.evaluate(() => JSON.stringify(window.__api.stats()))) === '{"erros":0,"found":8,"total":8,"estrelas":3}', await page.evaluate(() => JSON.stringify(window.__api.stats())));
// ---- lote 2: pesca, mira e bolinha, montar nota ----
const joga2 = async (fn, nivel) => { await page.evaluate(async ([fn, nivel]) => { window.__fim = 0; const m = await import('/js/jogos/fuga-mini.js'); document.body.innerHTML = '<div id="b"></div>'; window.__api = m[fn](document.getElementById('b'), { nivel, fim: () => { window.__fim = (window.__fim || 0) + 1; } }); }, [fn, nivel]); const go = page.locator('.fgm-go'); if (await go.count()) await go.click(); await sleep(300); };
const stats = () => page.evaluate(() => JSON.stringify(window.__api.stats()));
// pesca (fácil: 5 rodadas, 3 peixes): 1 peixe errado no começo = 1 erro; o resto certo = 3 ★
await joga2('pesca', 'facil');
check('pesca: 3 peixes nadando e a pergunta aparece', (await page.locator('.fgp-peixe').count()) === 3 && /pesque/.test(await page.textContent('.fgp-q')));
await page.evaluate(() => { const r = window.__api.rodada(); window.__api.pega((r.ok + 1) % 3); }); await sleep(900);
check('pesca: peixe errado conta 1 erro e some (a rodada continua)', JSON.parse(await stats()).erros === 1 && (await page.locator('.fgp-peixe').count()) === 2);
for (let i = 0; i < 12 && !(await page.evaluate(() => window.__fim)); i++) { await page.evaluate(() => { const r = window.__api.rodada(); if (r) window.__api.pega(r.ok); }); await sleep(1200); }
check('pesca: 5 pescados = chama fim, 1 erro = 3 ★', (await page.evaluate(() => window.__fim)) === 1 && (await stats()) === '{"erros":1,"found":5,"total":5,"estrelas":3}', await stats());
// mira: um arrasto de verdade (mouse) no alvo certo, depois pelo gancho de teste
await joga2('mira', 'facil');
const mouseNo = async (i) => { const pt = await page.evaluate((i) => { const p = window.__api.alvos()[i]; const rc = document.querySelector('.fgx-svg').getBoundingClientRect(); return { x: rc.left + (p.x / 300) * rc.width, y: rc.top + (p.y / 330) * rc.height }; }, i); await page.mouse.move(pt.x - 30, pt.y + 80); await page.mouse.down(); await page.mouse.move(pt.x, pt.y, { steps: 4 }); await page.mouse.up(); };
check('mira: 3 alvos e a pergunta', (await page.locator('.fgx-alvo').count()) === 3 && /mire/.test(await page.textContent('.fgp-q')));
await page.evaluate(() => window.__api.atira((window.__api.rodada().ok + 1) % 3)); await sleep(900);
check('mira: alvo errado conta 1 erro e escurece', JSON.parse(await stats()).erros === 1 && (await page.locator('.fgx-alvo.errado').count()) === 1);
await mouseNo(await page.evaluate(() => window.__api.rodada().ok)); await sleep(1300);
check('mira: arrastar e soltar no alvo certo acerta (1ª rodada passa)', JSON.parse(await stats()).found === 1, await stats());
for (let i = 0; i < 10 && !(await page.evaluate(() => window.__fim)); i++) { await page.evaluate(() => { const r = window.__api.rodada(); if (r) window.__api.atira(r.ok); }); await sleep(1300); }
check('mira: 4 acertos = chama fim, 1 erro = 3 ★', (await page.evaluate(() => window.__fim)) === 1 && (await stats()) === '{"erros":1,"found":4,"total":4,"estrelas":3}', await stats());
// montar: 1ª tentativa errada (1 erro), depois monta certo as 3 figuras
await joga2('montar', 'facil');
const clicaPecas = async (p) => { for (const [g, v] of [['cabeca', p.cabeca], ['haste', p.haste], ['colchetes', p.colchetes]]) await page.locator(`.fgn-peca[data-g="${g}"][data-v="${v}"]`).click(); };
check('montar: o botão conferir só liga com as 3 peças escolhidas', await page.locator('.fgn-ok').isDisabled());
const montaErr = await page.evaluate(() => { const c = window.__api.certo(); return { cabeca: c.cabeca === 'cheia' ? 'vazia' : 'cheia', haste: c.haste, colchetes: c.colchetes }; }); await clicaPecas(montaErr); await page.locator('.fgn-ok').click(); await sleep(300);
check('montar: peça errada conta 1 erro e marca a peça', JSON.parse(await stats()).erros === 1 && (await page.locator('.fgn-peca.no').count()) >= 1);
for (let i = 0; i < 3; i++) { const c = await page.evaluate(() => window.__api.certo()); if (!c) break; await clicaPecas(c); await page.locator('.fgn-ok').click(); await sleep(1200); }
check('montar: as 3 figuras certas = chama fim, 1 erro = 3 ★', (await page.evaluate(() => window.__fim)) === 1 && (await stats()) === '{"erros":1,"found":3,"total":3,"estrelas":3}', await stats());

// ---- lote 3: feche o compasso e o intruso (jogos novos, 3 rodadas no fácil) ----
await joga2('compasso', 'facil');
check('compasso: 3 rodadas, a bandeja tem as 3 peças do fácil e o medidor de 16 casinhas', (await page.locator('.fgc-op').count()) === 3 && (await page.locator('.fgc-med i').count()) === 16 && /faltam/.test(await page.textContent('.fgm-msg')));
// passar do compasso conta 1 erro: põe a peça maior (mínima) até estourar
await page.evaluate(() => { window.__falta = window.__api.rodada().faltamQ; });
for (let t = 0; t < 4 && JSON.parse(await stats()).erros === 0; t++) { await page.locator('.fgc-op[data-id="minima"]').click(); await sleep(100); }
check('compasso: passar do compasso conta 1 erro, limpa e avisa', JSON.parse(await stats()).erros === 1 && /passou do compasso/.test(await page.textContent('.fgm-msg')), await stats());
for (let rod = 0; rod < 3; rod++) {
  const falta = await page.evaluate(() => window.__api.rodada().faltamQ); let q = 0; // escolhe sempre a maior peça que ainda cabe (mínima 8, semínima 4): no fácil todo "falta" é múltiplo de 4
  while (q < falta) { const id = falta - q >= 8 ? 'minima' : 'seminima'; await page.locator(`.fgc-op[data-id="${id}"]`).click(); q += id === 'minima' ? 8 : 4; await sleep(80); }
  await sleep(1300);
}
check('compasso: 3 compassos fechados = chama fim, 1 erro = 2 ★', (await page.evaluate(() => window.__fim)) === 1 && (await stats()) === '{"erros":1,"found":3,"total":3,"estrelas":2}', await stats());
await joga2('intruso', 'facil');
check('intruso: 4 discos e a pergunta', (await page.locator('.fgi-disco').count()) === 4 && /NÃO combina/.test(await page.textContent('.fgm-msg')));
XX.click(); await sleep(200);
check('intruso: disco errado conta 1 erro e fica vermelho', JSON.parse(await stats()).erros === 1 && (await page.locator('.fgi-disco.errado').count()) === 1);
for (let rod = 0; rod < 3; rod++) { const certo = await page.evaluate(() => window.__api.rodada().intruso); await page.locator('.fgi-disco').nth(certo).click(); await sleep(rod === 0 ? 400 : 400); const msg = await page.textContent('.fgm-msg'); if (rod === 0) check('intruso: acertar explica o porquê', /as outras/.test(msg) && (await page.locator('.fgi-disco.certo').count()) === 1, msg); await sleep(2100); }
check('intruso: 3 acertos = chama fim, 1 erro = 2 ★', (await page.evaluate(() => window.__fim)) === 1 && (await stats()) === '{"erros":1,"found":3,"total":3,"estrelas":2}', await stats());
check('sem erro na página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
