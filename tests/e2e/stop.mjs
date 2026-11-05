// STOP musical (individual): abertura, opções, sorteio, resposta, STOP, correção, contestação, resultado, histórico.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser } = await launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-jogos', JSON.stringify({ v: 1, sound: true, games: { stop: { mode: 'solo', cats: ['instrumento', 'percussao', 'estilo', 'banda', 'musica', 'marca'], seconds: 30, rounds: 3 } } })); });
await p.goto(`${url}/aluno.html#/jogos/stop`); await sleep(1200);
check('abertura com STOP e botão JOGAR', (await p.locator('.st-title').count()) === 1 && (await p.locator('button:has-text("JOGAR")').count()) === 1);
await p.locator('button:has-text("JOGAR")').click(); await sleep(400);
check('12 categorias oficiais', (await p.locator('.st-cat').count()) === 12);
check('mostra quantas categorias foram escolhidas', (await p.locator('.jg-lab:has-text("categorias: 6 escolhidas")').count()) === 1);
await p.locator('button:has-text("limpar")').click(); await sleep(200);
check('menos de 5 categorias não deixa iniciar', await p.locator('button:has-text("iniciar")').isDisabled());
for (let i = 0; i < 8; i++) await p.locator('.st-cat').nth(i).click();
await p.locator('.st-cat').nth(8).click(); await sleep(200);
check('não passa de 8 categorias', (await p.locator('.st-cat.on').count()) === 8);
await p.locator('.st-cat').nth(7).click(); await p.locator('.st-cat').nth(6).click(); await sleep(100); // 6 categorias
check('com 6 categorias libera iniciar', await p.locator('button:has-text("iniciar")').isEnabled());
await p.locator('button:has-text("iniciar")').click(); await sleep(300);
await p.locator('button:has-text("sortear a letra")').click();
await p.locator('.st-field input').first().waitFor({ timeout: 15000 });
const L = (await p.locator('.st-letter').textContent()).trim();
check('letra é uma das 16', 'ABCDEFGJLMNPRSTV'.includes(L), L);
check('6 campos de resposta', (await p.locator('.st-field input').count()) === 6);
// uma resposta real do banco para cada uma das 2 primeiras categorias, o resto fica vazio/inventado
const cats = await p.locator('.st-field span').allTextContents(); void cats;
const answers = await p.evaluate(async (L) => {
  const V = await import('/js/jogos/stop-valid.js'); const T = await import('/js/jogos/stop-bank-teoria.js'); const C = await import('/js/jogos/stop-bank-cultura.js');
  const pick = (cat) => { const lines = { ...T.LINES, ...C.LINES }[cat]; const l = lines.find((x) => V.initialOf(x.split('|')[0]) === L); return l ? l.split('|')[0] : ''; };
  return { a: pick('instrumento'), b: pick('banda') };
}, L);
const inp = p.locator('.st-field input');
await inp.nth(0).fill(answers.a.toUpperCase()); await inp.nth(3).fill(answers.b); await inp.nth(4).fill(`${L}xqzwk`); await inp.nth(5).fill('zzz');
check('contador de preenchidos', (await p.locator('.st-progress b').first().textContent()) === '4');
await p.locator('.st-stop').click(); await sleep(150);
check('STOP! aparece no centro', (await p.locator('.st-stopword').count()) === 1);
await p.locator('.st-stop').click({ force: true }).catch(() => {}); // clique duplo não faz nada
await p.locator('.st-ans').first().waitFor({ timeout: 8000 });
await sleep(4500);
const st = await p.locator('.st-ans').evaluateAll((els) => els.map((e) => e.dataset.st));
check('resposta certa é válida (mesmo em maiúsculas)', st[0] === 'valida' || !answers.a, st.join(','));
check('letra errada é inválida', st[5] === 'invalida', st.join(','));
check('resposta que o jogo não conhece fica pendente (amarela)', st[4] === 'pendente', st.join(','));
check('não dá pra confirmar com pendente', (await p.locator('button:has-text("resolva")').count()) === 1);
await p.locator('.st-ans').nth(4).locator('button:has-text("contestar")').click(); await sleep(400);
await p.locator('.st-contest button:has-text("aprovar")').click(); await sleep(500);
check('aprovada vira válida', (await p.locator('.st-ans').nth(4).getAttribute('data-st')) === 'valida');
await p.locator('button:has-text("confirmar rodada")').click(); await sleep(400);
check('resumo da rodada', (await p.locator('.jg-tbl').count()) === 1);
for (let r = 0; r < 2; r++) { await p.locator('button:has-text("próxima rodada")').click(); await p.locator('button:has-text("sortear a letra")').click(); await p.locator('.st-stop').waitFor({ timeout: 15000 }); await p.locator('.st-stop').click(); await p.locator('.st-ans').first().waitFor({ timeout: 8000 }); await sleep(3500); await p.locator('.st-skip').click().catch(() => {}); const pend = await p.locator('button:has-text("deixar pendentes")').count(); if (pend) await p.locator('button:has-text("deixar pendentes")').click(); else await p.locator('button:has-text("confirmar rodada")').click(); await sleep(400); }
await p.locator('button:has-text("ver resultado final")').click(); await sleep(500);
check('resultado final com pontos', (await p.locator('.st-final h3').textContent()).includes('total'));
await p.locator('button:has-text("histórico")').first().click(); await sleep(500);
check('histórico guarda a partida', (await p.locator('.st-hist details').count()) === 1);
check('sem erros de JS', errs.length === 0, errs.slice(0, 3).join(' | '));
await browser.close(); srv.close(); done();
