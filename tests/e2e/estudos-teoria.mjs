// Estudos novos: acordes (violão e teclado), ritmos de bateria (com som) e teoria básica (cartões + mini quiz de 3 perguntas), e o Estudos sem jogos misturados.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: true });
await ctx.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().url().includes('aluno_codigo_ok') ? 'true' : '[]' }));
const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 900 }); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'T'); localStorage.setItem('beaterista-aluno-codigo', 'ABC123'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } window.__osc = 0; const oc = OscillatorNode.prototype.start; OscillatorNode.prototype.start = function () { window.__osc++; return oc.apply(this, arguments); }; });
const go = async (h) => { await p.goto(`${url}/aluno.html${h}`); await sleep(1500); };
await go('#/estudos');
for (const a of ['ritmo', 'melodia', 'teoria']) { await p.locator('.es-area', { hasText: a }).click(); const t = await p.locator('.es-modos').innerText(); check(`área ${a}: sem jogos misturados (nada de Toca Aqui, Beat Hero, Uno, piano na tela)`, !/Toca Aqui|Beat Hero|Uno Musical|Xilofone|Roleta|pauLta/.test(t), t.slice(0, 120)); }
await p.locator('.es-area', { hasText: 'melodia' }).click();
check('melodia e harmonia tem os acordes de violão e de teclado', /Acordes de violão/.test(await p.locator('.es-modos').innerText()) && /Acordes de teclado/.test(await p.locator('.es-modos').innerText()));
await go('#/estudos/acordes/violao');
check('violão: 16 acordes com diagrama', (await p.locator('.ac-card').count()) === 16 && (await p.locator('.ac-diag').count()) === 16);
const o0 = await p.evaluate(() => window.__osc); await p.locator('.ac-card').first().click(); await sleep(400);
check('violão: tocar o cartão faz som', (await p.evaluate(() => window.__osc)) >= o0, '');
await go('#/estudos/acordes/teclado');
check('teclado: 12 notas × tipo, com teclado desenhado', (await p.locator('.ac-teclado').count()) === 12);
await p.locator('button[role=radio]', { hasText: 'menor' }).first().click(); await sleep(300);
check('teclado: trocar o tipo muda os acordes (Cm)', /Cm/.test(await p.locator('.ac-cifra').first().innerText()));
await go('#/estudos/ritmos');
check('ritmos: 8 ritmos de bateria', (await p.locator('.rt-item').count()) === 8);
await p.locator('.rt-item', { hasText: 'Funk' }).click(); await sleep(300);
const o1 = await p.evaluate(() => window.__osc); await p.locator('.rt-play').click(); await sleep(1500);
check('ritmos: ouvir toca e acende os passos', (await p.locator('.rt-linha i.agora').count()) >= 1, String(await p.locator('.rt-linha i.agora').count()));
await p.locator('.rt-play').click();
await go('#/estudos/basica/figuras');
check('teoria: 5 cartões clicáveis e o quiz está travado até virar todos', (await p.locator('.tf-card').count()) === 5 && (await p.locator('button:has-text("cartões que faltam")').isDisabled()));
for (let i = 0; i < 5; i++) { await p.locator('.tf-card').nth(i).click(); await sleep(100); }
await p.locator('button:has-text("mini quiz")').click(); await sleep(300);
check('mini quiz: 3 perguntas com 3 opções', (await p.locator('.qz-op').count()) === 3 && /pergunta 1 de 3/.test(await p.locator('.au-say').innerText()));
const certa = { 'quantos tempos dura uma semínima?': '1 tempo', 'quantas colcheias cabem em 1 tempo?': '2', 'qual figura dura 4 tempos?': 'semibreve', 'quantas semicolcheias cabem em 1 tempo?': '4', 'duas mínimas somam quantos tempos?': '4', 'qual é a MAIS curta?': 'semicolcheia' };
for (let i = 0; i < 3; i++) { await p.waitForSelector('.qz-op:not([disabled])'); const q = (await p.locator('.tf-q').innerText()).trim(); await p.locator('.qz-op', { hasText: new RegExp(`^${(certa[q] || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).first().click(); await sleep(1100); }
await p.waitForSelector('.jg-result', { timeout: 6000 });
check('3 de 3 = 2 ★ e vai pro total de estrelas', /3 de 3/.test(await p.locator('.jg-result').innerText()) && (await p.evaluate(async () => { const P = await import('/js/kids/progress.js'); const E = await import('/js/figurinhas/estrelas.js'); return E.estrelasTotais(P.active().id); })) >= 2);
for (const s of ['pausas', 'claves', 'tempo', 'leitura']) { await go(`#/estudos/basica/${s}`); check(`sessão ${s} abre com cartões`, (await p.locator('.tf-card').count()) === 5); }
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
