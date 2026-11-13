// Figurix: abre no mapa de 62 fases; joga as fases pelas ideias da Bea (rápida, lenta, monte, ligar, memória, quiz, caça-palavras, notas, tetris).
import { serve, launch, sleep, check, done, alunoComCodigo } from './harness.mjs';
import { PHASES, MUNDOS, mundoDe } from '../../js/jogos/figurix-logic.js';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } }); await alunoComCodigo(ctx);
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); localStorage.setItem('beaterista-figurix-sem-tempo', '1'); if (!localStorage.getItem('beaterista-jogos:teste')) localStorage.setItem('beaterista-jogos:teste', JSON.stringify({ v: 1, sound: true, games: { figurix: { est: Object.fromEntries(Array.from({ length: 62 }, (_, i) => [i + 1, 3])) } } })); /* regra das 3 ★: o aluno do teste já tem tudo com 3 ★ pra poder abrir qualquer mundo */ } catch (e) {} });
await page.goto(url + '/aluno.html#/jogos/figurix'); await page.waitForSelector('.mp-node', { timeout: 15000 });
check('abre no mapa do mundo 1 (15 fases) com os 4 mundos pra escolher', (await page.locator('.mp-node').count()) === 15 && (await page.locator('.tm-tabs button').count()) === 4 && /floresta/.test(await page.textContent('.tm-tabs')));
for (const [i, m] of MUNDOS.entries()) { await page.locator('.tm-tabs button').nth(i).click(); await sleep(600); check(`mundo ${i + 1} (${m.curto}): ${m.ate - m.de + 1} fases e cenário próprio`, (await page.locator('.mp-node').count()) === m.ate - m.de + 1 && (await page.getAttribute('.mp', 'data-theme')) === `mundo-${m.tema}`); }
await page.locator('.tm-tabs button').nth(0).click(); await sleep(600);
const abreFase = async (n) => { const m = mundoDe(n); await page.goto(url + '/aluno.html#/jogos'); await sleep(250); await page.goto(url + '/aluno.html#/jogos/figurix'); await page.waitForSelector('.mp-node');
  await page.locator('.tm-tabs button').nth(MUNDOS.indexOf(m)).click(); await sleep(700); await page.waitForSelector('.mp-node');
  await page.evaluate((p) => document.querySelector(`.mp-node[data-pos="${p}"]`).scrollIntoView({ block: 'center' }), n - m.de); await sleep(150); await page.evaluate((p) => document.querySelector(`.mp-node[data-pos="${p}"]`).click(), n - m.de); await sleep(500);
  if (n <= 3) { check(`fase ${n}: abre a aulinha do Paul (colinha das figuras, caminho pros Estudos e aviso da estrela)`, await page.evaluate(() => document.querySelectorAll('.fx-colinha tr').length === 5 && !!document.querySelector('a[href="#/estudos/aulas"]') && /ganha estrela/.test(document.querySelector('.fx-aula-nota').textContent))); if (n === 1) await page.screenshot({ path: `${process.env.SHOTS || '/tmp'}/figurix-aulinha.png` }); await page.evaluate(() => document.querySelector('.fx-aula-jogar').click()); await sleep(400); } };
const abre = async (pos) => { await page.evaluate((p) => document.querySelector(`.mp-node[data-pos="${p}"]`).click(), pos); await sleep(400); await page.evaluate(() => { const b = document.querySelector('.fx-aula-jogar'); if (b) b.click(); }); await sleep(300); }; // as 3 primeiras fases abrem na aulinha: passa por ela
const mapa = async () => { await page.getByRole('button', { name: '‹ mapa' }).click(); await page.waitForSelector('.mp-node'); };
// fase 1: qual é a mais rápida? (semínima, colcheia, semicolcheia -> semicolcheia)
await abre(0); await page.waitForSelector('.fx-op');
check('fase 1: "qual é a mais rápida?" com 3 figuras', /mais rápida/.test(await page.textContent('.fx-q')) && (await page.locator('.fx-op').count()) === 3);
const certa = (rotulo) => page.locator(`.fx-op[aria-label="${rotulo}"]`).click();
await certa('semicolcheia'); await sleep(1000);
for (let i = 1; i < 5; i++) { // as outras: descobre a certa pela duração (a que tem mais colchetes = mais rápida)
  const r = await page.evaluate(() => { const o = [...document.querySelectorAll('.fx-op')]; return o.map((b) => b.getAttribute('aria-label')); });
  const dur = { semibreve: 4, 'mínima': 2, 'semínima': 1, colcheia: .5, semicolcheia: .25, fusa: .125, semifusa: .0625 };
  const ok = r.slice().sort((a, b) => dur[a] - dur[b])[0]; await certa(ok); await sleep(1000);
}
check('fase 1 concluída com 3 estrelas (sem erro)', /concluída/.test(await page.textContent('.jg-figurix')) && (await page.getAttribute('.dn-estrelas', 'aria-label')) === '3 de 3 estrelas');
await page.getByRole('button', { name: 'ver o mapa' }).click(); await page.waitForSelector('.mp-node');
// fase 3: monte a colcheia
await abre(2); await page.waitForSelector('.fx-peca');
check('fase 3: pede pra montar a colcheia', /monte a colcheia/.test(await page.textContent('.fx-q')));
await page.getByRole('button', { name: 'bolinha vazia' }).click(); await page.getByRole('button', { name: 'sem haste' }).click(); await page.getByRole('button', { name: '2 colchetes' }).click(); await page.getByRole('button', { name: 'conferir' }).click(); await sleep(200);
check('montou errado: peças erradas ficam vermelhas e conta erro', (await page.locator('.fx-peca.no').count()) >= 1 && (await page.evaluate(() => window.__figurix.erros)) === 1);
await page.getByRole('button', { name: 'bolinha pintada' }).click(); await page.getByRole('button', { name: 'com haste' }).click(); await page.getByRole('button', { name: '1 colchete' }).click(); await page.getByRole('button', { name: 'conferir' }).click(); await sleep(1500);
check('montou certo: vai pra próxima figura', /monte a semínima/.test(await page.textContent('.fx-q')));
await mapa();
// fase 4: ligar 3
await abre(3); await page.waitForSelector('.fx-lig');
check('fase 4: 3 figuras e 3 nomes', (await page.locator('.fx-lig:not(.nome)').count()) === 3 && (await page.locator('.fx-lig.nome').count()) === 3);
for (const f of await page.locator('.fx-lig:not(.nome)').evaluateAll((e) => e.map((x) => x.dataset.f))) { await page.locator(`.fx-lig[data-f="${f}"]`).click(); await page.locator(`.fx-lig.nome[data-n="${f}"]`).click(); await sleep(150); }
await sleep(1200);
check('ligou tudo: fase concluída', /concluída/.test(await page.textContent('.jg-figurix')));
await page.getByRole('button', { name: 'ver o mapa' }).click(); await page.waitForSelector('.mp-node');
// fase 6: memória das pausas (mostra, depois vira; acha os pares)
await abre(5); await page.waitForSelector('.fx-card');
check('fase 6: 8 cartas abertas de início (pra guardar)', (await page.locator('.fx-card').count()) === 8 && (await page.locator('.fx-card.aberta').count()) === 8);
await page.waitForFunction(() => document.querySelectorAll('.fx-card.aberta').length === 0, null, { timeout: 9000 });
const cs = await page.evaluate(() => window.__figurix.cartas);
for (const id of [...new Set(cs.map((c) => c.par))]) { const [a, b] = cs.filter((c) => c.par === id); await page.locator(`.fx-card[data-k="${a.k}"]`).click(); await page.locator(`.fx-card[data-k="${b.k}"]`).click(); await sleep(200); }
await sleep(1200);
check('achou todos os pares figura/pausa: fase concluída', /concluída/.test(await page.textContent('.jg-figurix')));
await page.getByRole('button', { name: 'ver o mapa' }).click(); await page.waitForSelector('.mp-node');
// fase 7: quiz (8 perguntas)
await abre(6); await page.waitForSelector('.fx-op');
for (let i = 0; i < 8; i++) { const c = await page.evaluate(() => window.__figurix.certa); await page.locator('.fx-op', { has: page.locator('b', { hasText: new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }) }).click(); await sleep(1000); }
check('quiz: 8 perguntas certas, fase concluída com 3 estrelas', /concluída/.test(await page.textContent('.jg-figurix')) && (await page.getAttribute('.dn-estrelas', 'aria-label')) === '3 de 3 estrelas');
await page.getByRole('button', { name: 'ver o mapa' }).click(); await page.waitForSelector('.mp-node');
// fase 8: caça-palavras
await abre(7); await page.waitForSelector('.fx-c');
check('fase 8: grade 10x10 com as palavras', (await page.locator('.fx-c').count()) === 100 && (await page.locator('.fx-pal').count()) >= 5);
const g = await page.evaluate(() => window.__figurix.caca.placed);
for (const w of g) { const x1 = w.x + w.dx * (w.w.length - 1), y1 = w.y + w.dy * (w.w.length - 1); await page.locator(`.fx-c[data-x="${w.x}"][data-y="${w.y}"]`).click(); await page.locator(`.fx-c[data-x="${x1}"][data-y="${y1}"]`).click(); await sleep(100); }
await sleep(1200);
check('achou todas as palavras: fase concluída', /concluída/.test(await page.textContent('.jg-figurix')));
await page.getByRole('button', { name: 'ver o mapa' }).click(); await page.waitForSelector('.mp-node');
// fase 9: monte as notas
await abre(8); await page.waitForSelector('.fx-arv');
check('fase 9: semibreve e mínima já certas, 3 por completar', (await page.locator('.fx-arv.ok').count()) === 2 && (await page.locator('.fx-arv:not(.ok)').count()) === 3);
const cab = { seminima: 4, colcheia: 8, semicolcheia: 16 };
for (const [id, n] of Object.entries(cab)) await page.locator(`.fx-arv[data-id="${id}"] .fx-n`, { hasText: new RegExp(`^${n}$`) }).click();
await sleep(1200);
check('completou a árvore: fase concluída', /concluída/.test(await page.textContent('.jg-figurix')));
await page.getByRole('button', { name: 'ver o mapa' }).click(); await page.waitForSelector('.mp-node');
// fase 10: tetris (o Paul vai pro lado do nome certo)
await abre(9); await page.waitForSelector('.fx-campo');
for (let i = 0; i < 8; i++) { await page.evaluate(() => { const t = window.__figurix.tetris; t.vai(t.item.ok); }); await page.waitForFunction((k) => !window.__figurix.tetris || window.__figurix.tetris.item !== k, null, null, { timeout: 9000 }).catch(() => {}); await sleep(6200); if (await page.locator('.dn-estrelas').count()) break; }
check('tetris: acompanhou o lado certo e terminou a fase', /concluída/.test(await page.textContent('.jg-figurix')), (await page.textContent('.jg-figurix')).slice(0, 80));
// as 50 fases novas: abre uma de cada tipo (nível 3 e nível 7) e confere que monta sem erro
const SEL = { rapida: '.fx-op', lenta: '.fx-op', monte: '.fx-peca', ligar: '.fx-lig', memoria: '.fx-card', quiz: '.fx-op', caca: '.fx-c', notas: '.fx-arv', tetris: '.fx-campo' };
const novas = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 33, 44, 53, 54, 55, 56, 57, 58, 59, 60, 61].map((pos) => [pos, SEL[PHASES[pos].tipo]]);
for (const [pos, sel] of novas) {
  await abreFase(pos + 1); const ok = (await page.locator(sel).count()) > 0; check(`fase ${pos + 1} (${PHASES[pos].tipo}, nível ${PHASES[pos].nivel}) abre`, ok);
}
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
