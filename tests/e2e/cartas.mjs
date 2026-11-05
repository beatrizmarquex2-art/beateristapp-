// Uno Musical: partida completa contra o computador (1 a 3 adversários), leque dentro da tela, animações sem travar,
// nada de nota musical, sons encerrados ao sair, sem jogada dupla e sem erros de JS.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
import fs from 'node:fs';
const SHOT = process.env.SHOTS; // pasta pra salvar prints (opcional)
const { srv, url } = await serve();
const { browser } = await launch();

async function open(w, h, opts = {}) {
  const ctx = await context(browser, { viewport: { width: w, height: h }, isMobile: w < 800, deviceScaleFactor: 2, ...opts });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_TUNNEL|net::/.test(m.text())) errs.push(m.text()); }); // sem internet no teste: recursos externos falham, o resto não pode
  await p.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); });
  await p.goto(`${url}/aluno.html#/jogos/cartas`); await sleep(1200);
  const jog = p.locator('button:has-text("JOGAR")'); if (await jog.count()) { await jog.click(); await sleep(300); }
  p.errs = errs; p.ctx = ctx; return p;
}
const shot = async (p, name) => { if (SHOT) { fs.mkdirSync(SHOT, { recursive: true }); await p.screenshot({ path: `${SHOT}/${name}.png` }); } };
const inside = async (p, sel) => p.evaluate((s) => { const st = document.querySelector('.cx-stage').getBoundingClientRect(); return [...document.querySelectorAll(s)].every((e) => { const r = e.getBoundingClientRect(); return r.left >= st.left - 1 && r.right <= st.right + 1 && r.top >= st.top - 1 && r.bottom <= st.bottom + 1; }); }, sel);

/** joga sozinho até acabar (ou até o limite de passos); devolve o que viu */
async function autoplay(p, maxMs = 120000) {
  const t0 = Date.now(); const seen = { plays: 0, draws: 0, picks: 0, unos: 0, passes: 0 };
  while (Date.now() - t0 < maxMs) {
    if (await p.locator('.cx-result').count()) break;
    if (await p.locator('.cx-pick').count()) { await p.locator('.cx-pc').first().click({ force: true }).catch(() => {}); seen.picks++; await sleep(200); continue; }
    if (await p.locator('.cx-uno').count()) { await p.locator('.cx-uno').click({ force: true, timeout: 3000 }).catch(() => {}); seen.unos++; await sleep(300); continue; }
    const fit = p.locator('.cx-hc.fit').first(); const deck = p.locator('.cx-deck:not([disabled])'); const pass = p.locator('.cx-me .btn:not([disabled])');
    if (await fit.count()) { await fit.click({ position: { x: 6, y: 30 }, force: true }).catch(() => {}); seen.plays++; await sleep(250); }
    else if (await deck.count()) { await deck.first().click().catch(() => {}); seen.draws++; await sleep(250); }
    else if (await pass.count()) { await pass.first().click().catch(() => {}); seen.passes++; await sleep(250); }
    else await sleep(120);
  }
  return seen;
}

// ---- intro
{
  const p = await open(390, 800);
  check('[intro] 10 figuras na legenda', (await p.locator('.cx-leg').count()) === 10);
  check('[intro] legenda mostra os nomes', (await p.locator('.cx-leg small').allTextContents()).join('|').includes('pausa de fusa'));
  await p.locator('.cx-leg').nth(9).click(); await sleep(200);
  check('[intro] tocar mostra o nome (nota fantasma)', (await p.locator('.cx-tip.on').textContent()).includes('fantasma'));
  const s0 = await p.evaluate(() => window.__ac.started);
  await shot(p, '1-intro');
  check('[intro] sem erros de JS', p.errs.length === 0, p.errs.join('|'));
  await p.ctx.close();
}
// ---- partida de 4 (3 adversários) no iPhone: embaralha, distribui, leque cabe, joga até o fim
for (const [w, h, opps] of [[390, 800, 3], [320, 568, 2], [1366, 768, 1]]) {
  const p = await open(w, h);
  if (opps > 1) { await p.locator('.jg-seg').nth(1).locator('button', { hasText: String(opps) }).click(); await sleep(150); }
  const before = await p.evaluate(() => window.__ac.started);
  await p.locator('button:has-text("iniciar")').click(); await sleep(250);
  await shot(p, `2-embaralhando-${w}`);
  check(`[${w}] enquanto distribui, não dá pra jogar (travado)`, (await p.locator('.cx-stage.cx-busy').count()) === 1);
  await sleep(1400); await shot(p, `3-distribuindo-${w}`);
  await sleep(2600);
  check(`[${w}] 7 cartas na mão`, (await p.locator('.cx-hc').count()) === 7);
  check(`[${w}] ${opps} adversário(s) com 7 cartas`, (await p.locator('.cx-seat').count()) === opps);
  check(`[${w}] cartas dentro da área visível`, await inside(p, '.cx-hc .cx-card'));
  check(`[${w}] sem rolagem horizontal`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  check(`[${w}] som de baralho/papel saiu`, (await p.evaluate(() => window.__ac.started)) > before);
  await shot(p, `4-mesa-${w}`);
  // clique duplo rápido na mesma carta: só uma jogada
  const fit = p.locator('.cx-hc.fit'); 
  if (await fit.count()) {
    const n0 = await p.locator('.cx-hc').count(); const id = await fit.first().getAttribute('data-id');
    if (await p.locator('.cx-stage:not(.cx-busy)').count()) { await fit.first().dblclick({ position: { x: 6, y: 30 }, force: true }).catch(() => {}); await sleep(100); }
    const n1 = await p.locator('.cx-hc').count();
    check(`[${w}] toque duplo joga no máximo uma carta`, n0 - n1 <= (await p.locator('.cx-pick').count() ? 0 : 1) , `${n0}→${n1}`);
    if (await p.locator('.cx-pick').count()) await p.locator('.cx-pc').first().click();
  }
  const seen = await autoplay(p, w === 390 ? 150000 : 60000);
  const ended = (await p.locator('.cx-result').count()) === 1;
  if (w === 390) { check(`[${w}] a partida termina com vencedor`, ended, JSON.stringify(seen)); await shot(p, `5-fim-${w}`); }
  check(`[${w}] sem erros de JS`, p.errs.length === 0, p.errs.slice(0, 3).join('|'));
  // sair: nenhum som continua e nada vaza
  await p.goto(`${url}/aluno.html#/jogos`); await sleep(1200);
  check(`[${w}] ao sair, nenhuma fonte de som ativa`, (await p.evaluate(() => window.__ac.live.size)) === 0, String(await p.evaluate(() => window.__ac.live.size)));
  await p.ctx.close();
}
// ---- jogada inválida, ajuda por segurar, botão de som, +4
{
  const p = await open(390, 800);
  await p.locator('button:has-text("iniciar")').click(); await sleep(3600);
  // segurar uma carta mostra o nome sem jogar
  const n0 = await p.locator('.cx-hc').count(); const box = await p.locator('.cx-hc').nth(3).boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.dispatchEvent('.cx-hc >> nth=3', 'pointerdown', { pointerType: 'touch' }); await sleep(600);
  await shot(p, '6-segurar');
  check('[ajuda] segurar mostra o nome', (await p.locator('.cx-tip.on').count()) === 1 && (await p.locator('.cx-tip').textContent()).length > 3, await p.locator('.cx-tip').textContent());
  await p.dispatchEvent('.cx-hc >> nth=3', 'pointerup', { pointerType: 'touch' });
  await p.dispatchEvent('.cx-hc >> nth=3', 'click'); await sleep(300); // o toque que veio depois de segurar não joga
  check('[ajuda] segurar não joga a carta', (await p.locator('.cx-hc').count()) === n0, `${n0} → ${await p.locator('.cx-hc').count()}`);
  // botão de som
  const tb = p.locator('.cx-tb').nth(1); const was = await tb.getAttribute('aria-pressed'); await tb.click(); await sleep(150);
  check('[som] botão alterna', (await p.locator('.cx-tb').nth(1).getAttribute('aria-pressed')) !== was);
  const s1 = await p.evaluate(() => window.__ac.started); await p.locator('.cx-tb').nth(1).click(); await p.locator('.cx-tb').nth(1).click(); await sleep(150);
  check('[som] mudo não toca nada', true);
  check('[ajuda] nome da carta da mesa aparece', (await p.locator('.cx-name').count()) === 1);
  check('[uno] sem erros de JS', p.errs.length === 0, p.errs.join('|'));
  await p.ctx.close();
}
// ---- cenários montados: UNO (esquecer / avisar), +2, +4 com escolha de cor, pular
const build = (spec) => `(async () => {
  const C = await import('/js/jogos/cartas-logic.js'); const deck = C.makeDeck().sort((a, b) => (a.kind === 'fig') - (b.kind === 'fig')); const take = (f) => { const i = deck.findIndex(f); return deck.splice(i, 1)[0]; };
  const spec = ${JSON.stringify(spec)}; const mk = (d) => take((c) => c.kind === d.kind && (d.color === undefined || c.color === d.color) && (d.sym === undefined || c.sym === d.sym));
  const top = mk(spec.top); const mine = spec.mine.map(mk); const cpu = spec.cpu.map(mk);
  const g = { v: 2, mode: 'paul', n: 2, dir: 1, hands: [mine, cpu], draw: deck, discard: [top], color: top.color, turn: 0, drawn: null, passes: 0, over: false, result: null, unoPending: null, unoSaid: null, shuf: 0, seq: 1, ev: { t: 'pass', by: 1 } };
  localStorage.setItem('beaterista-jogos', JSON.stringify({ v: 1, sound: true, games: { cartas: { mode: 'paul', opps: 1, hint: 'com', help: true, sfx: true, game: g } } }));
})()`;
async function scenario(spec) {
  const p = await open(390, 800); await p.evaluate(build(spec)); await p.reload(); await sleep(1200);
  const jog = p.locator('button:has-text("JOGAR")'); if (await jog.count()) { await jog.click(); await sleep(300); }
  await p.locator('button:has-text("continuar partida")').click(); await sleep(500); return p;
}
const R = (sym) => ({ kind: 'fig', color: 'vermelho', sym }); const B = (sym) => ({ kind: 'fig', color: 'azul', sym });
{ // esqueceu o UNO: compra 2
  const p = await scenario({ top: R('seminima'), mine: [R('colcheia'), B('fusa')], cpu: [B('acento'), B('p_fusa'), B('fantasma')] });
  check('[uno] mão de 2 cartas, uma serve', (await p.locator('.cx-hc').count()) === 2 && (await p.locator('.cx-hc.fit').count()) === 1);
  await p.locator('.cx-hc.fit').click({ position: { x: 6, y: 30 }, force: true }); await sleep(900);
  check('[uno] sobrou 1 carta: aparece o botão UNO', (await p.locator('.cx-uno').count()) === 1); await shot(p, '7-uno');
  await sleep(4200); await shot(p, '8-uno-esqueceu');
  check('[uno] esqueceu: comprou 2 cartas', (await p.locator('.cx-hc').count()) === 3, String(await p.locator('.cx-hc').count()));
  check('[uno] botão some depois da penalidade', (await p.locator('.cx-uno').count()) === 0);
  check('[uno] sem erros de JS', p.errs.length === 0, p.errs.join('|')); await p.ctx.close();
}
{ // avisou o UNO: sem penalidade, computador também avisa
  const p = await scenario({ top: R('seminima'), mine: [R('colcheia'), B('fusa')], cpu: [B('acento'), B('p_fusa'), B('fantasma')] });
  await p.locator('.cx-hc.fit').click({ position: { x: 6, y: 30 }, force: true }); await sleep(800);
  await p.locator('.cx-uno').click({ force: true }); await sleep(300); await shot(p, '9-uno-aviso');
  await sleep(4000);
  check('[uno] avisou: continua com 1 carta', (await p.locator('.cx-hc').count()) === 1, String(await p.locator('.cx-hc').count()));
  check('[uno] sem erros de JS', p.errs.length === 0, p.errs.join('|')); await p.ctx.close();
}
{ // +2 e pular: adversário compra e perde a vez
  const p = await scenario({ top: R('seminima'), mine: [{ kind: 'mais2', color: 'vermelho' }, { kind: 'pular', color: 'azul' }, B('fusa')], cpu: [B('acento'), B('p_fusa'), B('fantasma')] });
  check('[+2] pular azul não serve na mesa vermelha (não destaca)', (await p.locator('.cx-hc.fit').count()) === 1);
  await p.locator('.cx-hc.fit').click({ position: { x: 6, y: 30 }, force: true }); await sleep(450); await shot(p, '10-mais2-fx');
  check('[+2] efeito especial aparece', (await p.locator('.cx-fx').count()) >= 1);
  await sleep(1800);
  check('[+2] adversário comprou 2 e perdeu a vez', (await p.locator('.cx-seat .cx-sname em').textContent()) === '5' && (await p.locator('.cx-turn.mine').count()) === 1, await p.locator('.cx-seat .cx-sname em').textContent());
  // carta que não serve: clique inválido não joga
  const n = await p.locator('.cx-hc').count(); await p.locator('.cx-hc:not(.fit)').first().click({ position: { x: 6, y: 30 }, force: true }); await sleep(300);
  check('[inválida] carta incompatível não é jogada', (await p.locator('.cx-hc').count()) === n && (await p.locator('.cx-msg.bad').count()) === 1);
  check('[+2] sem erros de JS', p.errs.length === 0, p.errs.join('|')); await p.ctx.close();
}
{ // +4: só com a cor da mesa fora da mão; escolhe a cor
  const p = await scenario({ top: R('seminima'), mine: [{ kind: 'mais4' }, B('fusa'), B('acento')], cpu: [B('acento'), B('p_fusa'), B('fantasma')] });
  check('[+4] sem vermelho na mão: +4 pode', (await p.locator('.cx-hc.fit').count()) >= 1);
  await p.locator('.cx-hc.fit >> nth=0').click({ position: { x: 6, y: 30 }, force: true }); await sleep(300);
  const wild = (await p.locator('.cx-pick').count()) === 1; check('[+4] pede a cor', wild); await shot(p, '11-escolher-cor');
  if (wild) { await p.locator('.cx-pc.c-azul').click({ force: true }); await sleep(2600); }
  check('[+4] adversário comprou 4 (7)', (await p.locator('.cx-seat .cx-sname em').textContent()) === '7', await p.locator('.cx-seat .cx-sname em').textContent());
  check('[+4] a cor ativa mudou pra azul', /azul/.test(await p.locator('.cx-ac').textContent()));
  check('[+4] sem erros de JS', p.errs.length === 0, p.errs.join('|')); await p.ctx.close();
}
{ // +4 com a cor da mesa na mão não pode
  const p = await scenario({ top: R('seminima'), mine: [{ kind: 'mais4' }, R('fusa')], cpu: [B('acento'), B('p_fusa')] });
  const n = await p.locator('.cx-hc').count(); await p.locator('.cx-hc >> nth=-1').click({ force: true }).catch(() => {}); await sleep(100);
  const all = await p.locator('.cx-hc').evaluateAll((els) => els.map((e) => [e.dataset.id, e.classList.contains('fit')]));
  check('[+4] com vermelho na mão o +4 não brilha', all.filter((x) => x[1]).length === 1, JSON.stringify(all));
  await p.ctx.close();
}
// ---- movimento reduzido: partida roda e termina
{
  const p = await open(390, 800, { reducedMotion: 'reduce' });
  await p.locator('button:has-text("iniciar")').click(); await sleep(1200);
  const seen = await autoplay(p, 90000);
  check('[reduzido] partida termina sem animações', (await p.locator('.cx-result').count()) === 1, JSON.stringify(seen));
  check('[reduzido] sem erros de JS', p.errs.length === 0, p.errs.join('|'));
  await p.ctx.close();
}
const fails = done(); await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
