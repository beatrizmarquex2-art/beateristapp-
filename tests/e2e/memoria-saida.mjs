// Jogo da memória em 3 celulares: um deles some (fecha a página) e os outros decidem, pela maioria, continuar sem ele.
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
  const ctx = await context(browser); await ctx.route('**/rest/v1/rpc/sala_*', mock);
  const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 844 }); p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.addInitScript((n) => { window.BT_SAIDA_S = 12; try { localStorage.setItem('beaterista-aluno-nome', n); localStorage.setItem('beaterista-nome-sala', n); localStorage.setItem('bt-mute', '1'); window.BT_SAIDA_S = 12; } catch { /* ok */ } }, nome);
  await p.goto(`${url}/aluno.html#/jogos/memart`); await p.waitForSelector('.mem-theme', { timeout: 15000 }); await sleep(500); return p;
}
const vez = async (p) => (await p.locator('.ms-vez').innerText()).trim().toLowerCase(); // o CSS põe tudo em minúscula na tela
const placar = async (p) => (await p.locator('.ms-placar').innerText()).trim();
const ups = (p) => p.locator('.kx-mem.up').count();
const srcs = (p) => p.locator('.kx-mem img.mem-card-img').evaluateAll((es) => es.map((e) => e.getAttribute('src')));

const nomes = ['Ana', 'Bia', 'Cris']; const ph = [];
for (const n of nomes) ph.push(await phone(n));
const [A, B, C] = ph;
for (const p of ph) { await p.locator('.mem-ic[aria-label^="sala"]').click(); await sleep(250); }
await A.locator('button[role="radio"][aria-label="3 jogadores"]').click(); await sleep(200);
await A.locator('button:has-text("criar sala")').click(); await sleep(600);
const code = (await A.locator('.jg-code').textContent()).trim();
for (const p of [B, C]) { await p.locator('.jg-code-in').fill(code); await p.locator('button:has-text("entrar")').click(); await sleep(1800); }
let comecou = false; for (let t = 0; t < 40 && !comecou; t++) { comecou = (await Promise.all(ph.map((p) => p.locator('.kx-mem').count()))).every((n) => n >= 12); if (!comecou) await sleep(500); }
const semAviso = (await Promise.all(ph.map((p) => p.locator('.jg-saiu-l').count()))).every((n) => n === 0);
check('ninguém vê aviso de saída logo que a partida começa', semAviso);
check('os 3 começaram a partida', comecou, JSON.stringify(await Promise.all(ph.map(async (p) => [await p.locator('.kx-mem').count(), (await p.locator('.jg-lobby').count()), (await p.locator('.jg-saiu-l').count())]))));

await C.close(); // a Cris some sem avisar
let aviso = false; for (let t = 0; t < 120 && !aviso; t++) { aviso = (await A.locator('.jg-saiu-l').count()) > 0 && (await B.locator('.jg-saiu-l').count()) > 0; if (!aviso) await sleep(500); }
check('depois de ~30 s sem sinal (12 s no teste) o aviso aparece pros DOIS que ficaram', aviso);
const txtA = (await A.locator('.jg-saiu').innerText()).toLowerCase();
check('o aviso diz o nome e mostra os votos (0/2)', /cris parece ter saído/.test(txtA) && /0\/2/.test(txtA), txtA.slice(0, 120));
await A.locator('.jg-saiu button:has-text("continuar sem Cris")').click(); await sleep(6500);
check('um voto só não basta: aparece 1/2 pro Bia e o seu voto foi enviado pra Ana', /1\/2/.test((await B.locator('.jg-saiu-l', { hasText: /cris/i }).innerText()).toLowerCase()) && (await A.locator('.jg-saiu').innerText()).toLowerCase().includes('seu voto'), '');
await B.locator('.jg-saiu button:has-text("continuar sem Cris")').click(); await sleep(4500);
check('com a maioria (2 de 2) a Cris sai: o placar marca "(saiu)"', /cris \(saiu\)/.test((await A.locator('.ms-placar').innerText()).toLowerCase()) && /cris \(saiu\)/.test((await B.locator('.ms-placar').innerText()).toLowerCase()), await A.locator('.ms-placar').innerText());
check('o aviso da Cris some depois da decisão', (await A.locator('.jg-saiu-l', { hasText: /cris/i }).count()) === 0 && (await B.locator('.jg-saiu-l', { hasText: /cris/i }).count()) === 0);
// a partida continua entre Ana e Bia: Ana erra (2 cartas diferentes) e a vez vai pra Bia, pulando a Cris
const deck = await A.evaluate(() => [...document.querySelectorAll('.kx-mem img.mem-card-img')].map((e) => e.getAttribute('src')));
const vezTxt = async (p) => (await p.locator('.ms-vez').innerText()).trim().toLowerCase();
const quemA = (await vezTxt(A)) === 'sua vez' ? A : B; const outro = quemA === A ? B : A;
const i2 = deck.findIndex((x) => x !== deck[0]);
await quemA.locator('.kx-mem').nth(0).click(); await sleep(300); await quemA.locator('.kx-mem').nth(i2).click(); await sleep(4500);
check('depois do erro a vez vai pro outro que ficou (pulando quem saiu)', (await vezTxt(outro)) === 'sua vez', `${await vezTxt(A)} / ${await vezTxt(B)}`);
check('sem erro de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
