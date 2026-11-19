// Uno Musical em 3 celulares: um deles some (fecha a página) e os outros decidem, pela maioria, continuar sem ele.
// O Supabase é simulado na memória (as funções sala_* antigas e as novas sala_*_n).
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch({ codigo: false });
const salas = new Map(); const ago = () => Date.now() / 1000;
const mock = async (route) => {
  const fn = new URL(route.request().url()).pathname.split('/').pop(); const b = route.request().postDataJSON();
  const ok = (j) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(j) });
  const code = String(b.p_code || '').toUpperCase(); const s = salas.get(code);
  if (fn === 'sala_criar') { const c = 'MA' + String(salas.size + 100); salas.set(c, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false, max: 2, nomes: [] }); return ok(c); }
  if (fn === 'sala_criar_n') { const c = 'MN' + String(salas.size + 100); salas.set(c, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false, max: b.p_max, nomes: [b.p_nome] }); return ok(c); }
  if (fn === 'sala_entrar_n') { if (!s || s.jogo !== b.p_jogo) return ok([]); if (s.nomes.length >= s.max) return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'cheia' }) }); s.nomes.push(b.p_nome || 'jogador'); return ok([{ lugar: s.nomes.length - 1, ver: s.ver, estado: s.estado, max_jogadores: s.max, nomes: s.nomes }]); }
  if (fn === 'sala_ler_n') return ok(s ? [{ ver: s.ver, max_jogadores: s.max, nomes: s.nomes, estado: s.ver === b.p_ver ? null : s.estado }] : []);
  if (fn === 'sala_entrar') { if (!s || s.jogo !== b.p_jogo) return ok([]); s.convidado = true; return ok([{ ver: s.ver, estado: s.estado }]); }
  if (fn === 'sala_ler') return ok(s ? [{ ver: s.ver, convidado: s.convidado, estado: s.ver === b.p_ver ? null : s.estado }] : []);
  if (fn === 'sala_enviar') { if (!s || s.ver !== b.p_ver) return ok(0); s.estado = b.p_estado; s.ver++; return ok(s.ver); }
  if (fn === 'sala_presenca') { if (!s) return ok(null); s.pres = s.pres || {}; s.saiu = s.saiu || []; s.votos = s.votos || {}; if (b.p_lugar >= 0 && !s.saiu.includes(b.p_lugar)) { s.pres[b.p_lugar] = ago(); delete s.votos[b.p_lugar]; } const ha = {}; for (const [k, v] of Object.entries(s.pres)) ha[k] = Math.round(ago() - v); return ok({ ha, saiu: s.saiu, votos: s.votos, n: s.max }); }
  if (fn === 'sala_votar') { s.saiu = s.saiu || []; s.votos = s.votos || {}; const v = s.votos[b.p_alvo] || []; if (!v.includes(b.p_lugar)) v.push(b.p_lugar); const restam = s.max - s.saiu.length - 1; const precisa = Math.floor(restam / 2) + 1; if (v.length >= precisa) { s.saiu.push(b.p_alvo); delete s.votos[b.p_alvo]; } else s.votos[b.p_alvo] = v; return ok({ saiu: s.saiu, votos: s.votos }); }
  return route.continue();
};
const errs = [];
async function phone(nome) {
  const ctx = await context(browser, { viewport: { width: 390, height: 844 } }); await ctx.route('**/rest/v1/rpc/sala_*', mock);
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.addInitScript((n) => { window.BT_SAIDA_S = 12; try { localStorage.setItem('beaterista-aluno-nome', n); localStorage.setItem('beaterista-nome-sala', n); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } }, nome);
  await p.goto(`${url}/aluno.html#/jogos/cartas/livre`); await sleep(1000);
  const jog = p.locator('button:has-text("JOGAR")'); if (await jog.count()) { await jog.first().click(); await sleep(300); }
  await p.locator('.jg-seg button[aria-label^="2 a 4"]').click(); await sleep(400); return p;
}
const vezTxt = async (p) => (await p.locator('.cx-turn').innerText()).trim().toLowerCase();
const nomes = ['Ana', 'Bia', 'Cris']; const ph = []; for (const n of nomes) ph.push(await phone(n));
const [A, B, C] = ph;
await A.locator('button[role="radio"][aria-label="3 jogadores"]').click(); await sleep(200);
await A.locator('button:has-text("criar sala")').click(); await sleep(600);
const code = (await A.locator('.jg-code').textContent()).trim();
for (const p of [B, C]) { await p.locator('.jg-code-in').fill(code); await p.locator('button:has-text("entrar")').click(); await sleep(1600); }
let comecou = false; for (let t = 0; t < 40 && !comecou; t++) { comecou = (await Promise.all(ph.map((p) => p.locator('.cx-hc').count()))).every((n) => n === 7); if (!comecou) await sleep(500); }
check('os 3 começaram com 7 cartas cada', comecou);
await C.close(); // a Cris some sem avisar
let aviso = false; for (let t = 0; t < 120 && !aviso; t++) { aviso = (await A.locator('.jg-saiu-l', { hasText: /cris/i }).count()) > 0 && (await B.locator('.jg-saiu-l', { hasText: /cris/i }).count()) > 0; if (!aviso) await sleep(500); }
check('depois de ~30 s sem sinal (12 s no teste) o aviso da Cris aparece pros DOIS que ficaram', aviso);
await A.locator('.jg-saiu button:has-text("continuar sem Cris")').click(); await sleep(6500);
check('um voto só não basta: a Cris ainda está na mesa', !/\(saiu\)/.test((await A.locator('.cx-opps').innerText()).toLowerCase()));
await B.locator('.jg-saiu button:has-text("continuar sem Cris")').click();
let saiu = false; for (let t = 0; t < 40 && !saiu; t++) { saiu = (await A.locator('.cx-opps').innerText()).toLowerCase().includes('cris (saiu)') && (await B.locator('.cx-opps').innerText()).toLowerCase().includes('cris (saiu)'); if (!saiu) await sleep(500); }
check('com a maioria (2 de 2) a Cris sai: a mesa marca "Cris (saiu)" nos dois', saiu);
check('as cartas da Cris voltaram pro baralho (ela mostra 0 cartas)', /cris \(saiu\)\s*0/.test((await A.locator('.cx-opps').innerText()).toLowerCase().replace(/\s+/g, ' ')), (await A.locator('.cx-opps').innerText()).replace(/\s+/g, ' '));
check('o aviso da Cris some depois da decisão', (await A.locator('.jg-saiu-l', { hasText: /cris/i }).count()) === 0 && (await B.locator('.jg-saiu-l', { hasText: /cris/i }).count()) === 0);
// a partida segue entre Ana e Bia: cada um joga na sua vez até um deles ganhar (a vez nunca cai na Cris)
let fimTela = false; let vezCris = false; const t0 = Date.now();
while (Date.now() - t0 < 240000 && !fimTela) {
  for (const p of [A, B]) {
    if (await p.locator('.cx-result').count()) { fimTela = true; break; }
    const vt = await vezTxt(p); if (/vez de cris/.test(vt)) vezCris = true;
    if (!vt.includes('sua vez')) continue;
    if (await p.locator('.cx-pick').count()) { await p.locator('.cx-pc').first().click({ force: true }).catch(() => {}); await sleep(250); continue; }
    const fit = p.locator('.cx-hc.fit').first(); const deck = p.locator('.cx-deck:not([disabled])'); const pass = p.locator('.cx-me .btn:not([disabled])');
    if (await fit.count()) { await fit.click({ position: { x: 6, y: 30 }, force: true }).catch(() => {}); await sleep(300); }
    else if (await deck.count()) { await deck.first().click().catch(() => {}); await sleep(300); }
    else if (await pass.count()) { await pass.first().click().catch(() => {}); await sleep(300); }
  }
  await sleep(250);
}
check('a partida seguiu e terminou entre os dois que ficaram', fimTela);
check('a vez nunca foi pra Cris depois que ela saiu', !vezCris);
check('sem erro de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
