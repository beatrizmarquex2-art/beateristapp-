// STOP "ao mesmo tempo" em 3 celulares: um deles some (fecha a página) e os outros decidem, pela maioria, continuar sem ele (sala falsa na memória).
// Cobre: aviso de saída pra todos, votação 1/2 → 2/2, quem saiu não segura a contagem nem o STOP, "(saiu)" no placar, revanche sem ele.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const salas = new Map(); const errs = [];
const json = (r, v, st = 200) => r.fulfill({ status: st, contentType: 'application/json', body: JSON.stringify(v) });
async function celular(nome) {
  const ctx = await context(browser, { viewport: { width: 390, height: 844 } });
  await ctx.route('**/rest/v1/rpc/sala_*', (r) => {
    const fn = new URL(r.request().url()).pathname.split('/').pop(); const b = r.request().postDataJSON() || {};
    if (fn === 'sala_criar_n') { const c = 'S4' + String(salas.size + 100); salas.set(c, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, max: b.p_max, nomes: [b.p_nome] }); return json(r, c); }
    const s = salas.get(String(b.p_code || '').toUpperCase());
    if (fn === 'sala_entrar_n') { if (!s || s.jogo !== b.p_jogo) return json(r, []); if (s.nomes.length >= s.max) return json(r, { message: 'cheia' }, 400); s.nomes.push(b.p_nome || 'jogador'); return json(r, [{ lugar: s.nomes.length - 1, ver: s.ver, estado: s.estado, max_jogadores: s.max, nomes: s.nomes }]); }
    if (fn === 'sala_ler_n') return json(r, s ? [{ ver: s.ver, max_jogadores: s.max, nomes: s.nomes, estado: s.ver === b.p_ver ? null : s.estado }] : []);
    if (fn === 'sala_presenca') { if (!s) return json(r, null); s.pres = s.pres || {}; s.saiu = s.saiu || []; s.votos = s.votos || {}; if (b.p_lugar >= 0 && !s.saiu.includes(b.p_lugar)) { s.pres[b.p_lugar] = Date.now() / 1000; delete s.votos[b.p_lugar]; } const ha = {}; for (const [k, v] of Object.entries(s.pres)) ha[k] = Math.round(Date.now() / 1000 - v); return json(r, { ha, saiu: s.saiu, votos: s.votos, n: s.max }); }
    if (fn === 'sala_votar') { s.saiu = s.saiu || []; s.votos = s.votos || {}; const v = s.votos[b.p_alvo] || []; if (!v.includes(b.p_lugar)) v.push(b.p_lugar); const precisa = Math.floor((s.max - s.saiu.length - 1) / 2) + 1; if (v.length >= precisa) { s.saiu.push(b.p_alvo); delete s.votos[b.p_alvo]; } else s.votos[b.p_alvo] = v; return json(r, { saiu: s.saiu, votos: s.votos }); }
    if (fn === 'sala_ler') return json(r, s ? [{ ver: s.ver, convidado: true, estado: s.ver === b.p_ver ? null : s.estado }] : []);
    if (fn === 'sala_enviar') { if (!s || s.ver !== b.p_ver) return json(r, 0); s.estado = b.p_estado; s.ver += 1; return json(r, s.ver); }
    return json(r, []);
  });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(`${nome}: ${String(e).slice(0, 200)}`)); p.nome = nome;
  await p.addInitScript((n) => { try { localStorage.setItem('beaterista-aluno-nome', n); localStorage.setItem('beaterista-nome-sala', n); localStorage.setItem('bt-mute', '1'); window.BT_SAIDA_S = 12; } catch { /* ok */ } }, nome);
  await p.goto(`${url}/aluno.html#/jogos`); await sleep(1500);
  await p.evaluate(async () => { const d = document.createElement('div'); d.id = 't'; d.style.cssText = 'position:fixed;inset:0;overflow:auto;background:#FFF5E3;z-index:5;padding:8px'; document.body.append(d); const m = await import('/js/jogos/stop.js'); window.__ctl = m.mount(d); });
  return p;
}
const nomes = ['Ana', 'Bia', 'Cris']; const ph = []; for (const n of nomes) ph.push(await celular(n));
const [A, B, C] = ph; const L = (p, sel) => p.locator(`#t ${sel}`);
const txt = async (p, sel) => (await (sel === '#t' ? p.locator('#t') : L(p, sel)).first().innerText().catch(() => '')).toLowerCase();
for (const p of ph) { await L(p, 'button:has-text("JOGAR")').click(); await sleep(400); await L(p, 'button[role=radio][aria-label="2 a 4 celulares"]').click(); await sleep(300); }
await L(A, 'button[role=radio][aria-label="3 jogadores"]').click(); await sleep(200);
await L(A, 'button:has-text("criar sala")').click(); await sleep(700);
const code = (await L(A, '.jg-code').textContent()).trim();
for (const p of [B, C]) { await L(p, '.jg-code-in').fill(code); await L(p, 'button:has-text("entrar")').click(); await sleep(1700); }
await Promise.all(ph.map((p) => L(p, 'button:has-text("estou pronto")').waitFor({ timeout: 15000 })));
for (const p of [A, B]) { await L(p, 'button:has-text("estou pronto")').click(); await sleep(400); }
await sleep(2500);
check('com a Cris sem ficar pronta, ninguém começa (sem contagem)', (await Promise.all([A, B].map((p) => L(p, '.st-count').count()))).every((n) => n === 0));
check('ninguém vê aviso de saída logo no começo', (await Promise.all([A, B].map((p) => L(p, '.jg-saiu-l').count()))).every((n) => n === 0));
await C.close(); // a Cris some sem avisar
let aviso = false; for (let t = 0; t < 120 && !aviso; t++) { aviso = (await L(A, '.jg-saiu-l').count()) > 0 && (await L(B, '.jg-saiu-l').count()) > 0; if (!aviso) await sleep(500); }
check('depois de ~30 s sem sinal (12 s no teste) o aviso aparece pros DOIS que ficaram', aviso);
check('o aviso diz o nome e os votos 0/2', /cris parece ter saído/.test(await txt(A, '.jg-saiu')) && /0\/2/.test(await txt(A, '.jg-saiu')), (await txt(A, '.jg-saiu')).slice(0, 100));
await L(A, '.jg-saiu button:has-text("continuar sem Cris")').click(); await sleep(6500);
check('um voto só não basta: a contagem ainda não começou', (await L(A, '.st-count').count()) === 0 && (await salas.get(code).saiu || []).length === 0);
await L(B, '.jg-saiu button:has-text("continuar sem Cris")').click();
await Promise.all([A, B].map((p) => L(p, '.st-count').waitFor({ timeout: 25000 })));
check('com a maioria (2 de 2) a Cris sai e a contagem começa sem esperar ela', true);
const e1 = salas.get(code).estado; check('estado com fora = [2], pronto e resposta vazia da Cris', JSON.stringify(e1.fora) === '[2]' && e1.ready[2] === true && e1.res[2] && e1.res[2].motivo === 'saiu', JSON.stringify(e1.fora));
await Promise.all([A, B].map((p) => L(p, '.st-field input').first().waitFor({ timeout: 15000 })));
for (const p of [A, B]) { await L(p, '.st-field input').first().fill(`zz${p.nome}`); }
await sleep(500);
await L(B, '.st-stop').click(); await sleep(3500);
await Promise.all([A, B].map((p) => L(p, '.st-final').waitFor({ timeout: 25000 })));
check('Bia apertou STOP: a Ana parou também e o placar sai sem esperar a Cris', /bia apertou stop primeiro/.test(await txt(A, '#t')) || /você apertou stop/.test(await txt(B, '#t')));
check('o placar marca "cris (saiu)" nos dois que ficaram', (await Promise.all([A, B].map(async (p) => (await txt(p, '.st-final')).includes('cris (saiu)')))).every(Boolean));
check('a revanche continua com a Cris fora', await (async () => { await L(A, 'button:has-text("revanche")').click(); await sleep(3000); const e = salas.get(code).estado; return e.round === 2 && JSON.stringify(e.fora) === '[2]' && e.ready[2] === true; })());
check('sem erro de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
