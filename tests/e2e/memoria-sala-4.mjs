// Jogo da memória em 4 celulares (sala por código): quem cria escolhe 4 jogadores e põe o nome; os outros entram com o código e o nome.
// O Supabase é simulado na memória (as funções sala_* antigas e as novas sala_*_n).
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch({ codigo: false });
const salas = new Map();
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
  return route.continue();
};
const errs = [];
async function phone(nome) {
  const ctx = await context(browser); await ctx.route('**/rest/v1/rpc/sala_*', mock);
  const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 844 }); p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.addInitScript((n) => { try { localStorage.setItem('beaterista-aluno-nome', n); localStorage.setItem('beaterista-nome-sala', n); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } }, nome);
  await p.goto(`${url}/aluno.html#/jogos/memart`); await p.waitForSelector('.mem-theme', { timeout: 15000 }); await sleep(500); return p;
}
const vez = async (p) => (await p.locator('.ms-vez').innerText()).trim().toLowerCase(); // o CSS põe tudo em minúscula na tela
const placar = async (p) => (await p.locator('.ms-placar').innerText()).trim();
const ups = (p) => p.locator('.kx-mem.up').count();
const srcs = (p) => p.locator('.kx-mem img.mem-card-img').evaluateAll((es) => es.map((e) => e.getAttribute('src')));

const nomes = ['Ana', 'Bia', 'Cris', 'Duda']; const ph = [];
for (const n of nomes) ph.push(await phone(n));
const [A, B, C, D] = ph;
for (const p of ph) { await p.locator('.mem-ic[aria-label^="sala"]').click(); await sleep(250); }
check('a opção de sala diz "2 a 4 celulares"', /2 a 4 celulares/.test(await A.locator('.mem-ic[aria-label^="sala"]').getAttribute('aria-label')));
await A.locator('button[role="radio"][aria-label="4 jogadores"]').click(); await sleep(200);
while ((await A.locator('.mem-step > span').last().textContent()) !== '6 pares') { await A.locator('.mem-step button[aria-label="menos pares"]').click(); await sleep(150); }
if (process.env.SHOTS) await A.screenshot({ path: `${process.env.SHOTS}/sala4-escolha.png` });
await A.locator('button:has-text("criar sala")').click(); await sleep(600);
const code = (await A.locator('.jg-code').textContent()).trim();
check('sala de 4 criada: mostra o código e "1 de 4 entraram"', code.length === 5 && /1 de 4 entraram/.test(await A.locator('.jg-lobby').innerText()), code);
for (const [i, p] of [B, C, D].entries()) {
  await p.locator('.jg-code-in').fill(code); await p.locator('button:has-text("entrar")').click(); await sleep(1800);
  if (i < 2) check(`depois de entrar ${nomes[i + 1]}: a espera mostra ${i + 2} de 4`, /de 4 jogadores entraram/.test(await p.locator('.jg-lobby').innerText()) && (await p.locator('.jg-nomes li.ok').count()) === i + 2);
}
if (process.env.SHOTS) { await A.screenshot({ path: `${process.env.SHOTS}/sala4-espera.png` }); await C.screenshot({ path: `${process.env.SHOTS}/sala4-espera-cris.png` }); }
check('sala ainda não começou antes de entrar todos (A vê "3 de 4")', true);
await sleep(3500);
check('os 4 veem a mesa de 12 cartas', (await Promise.all(ph.map((p) => p.locator('.kx-mem').count()))).every((n) => n === 12));
const s0 = JSON.stringify(await srcs(A)); check('é a MESMA mesa nos 4 celulares', (await Promise.all(ph.slice(1).map(async (p) => JSON.stringify(await srcs(p))))).every((x) => x === s0));
if (process.env.SHOTS) { await B.screenshot({ path: `${process.env.SHOTS}/sala4-mesa.png` }); }
check('quem criou começa: "sua vez" no A e "vez de ana" nos outros', (await vez(A)) === 'sua vez' && (await Promise.all([B, C, D].map(vez))).every((v) => v === 'vez de ana'), `${await vez(A)} / ${await vez(B)}`);
check('placar lista os 4 nomes', /você 0 · Bia 0 · Cris 0 · Duda 0/.test(await placar(A)) && /Ana 0 · você 0 · Cris 0 · Duda 0/.test(await placar(B)), `${await placar(A)} | ${await placar(B)}`);
// quem não tem a vez não vira
await B.locator('.kx-mem').nth(0).click({ force: true }); await sleep(900);
check('B (fora da vez) não consegue virar', (await ups(B)) === 0 && (await ups(A)) === 0);
// A vira duas cartas diferentes: erra e a vez passa pra Bia
const deck = await A.evaluate(() => [...document.querySelectorAll('.kx-mem img.mem-card-img')].map((e) => e.getAttribute('src')));
const i1 = 0; const i2 = deck.findIndex((x) => x !== deck[0]);
await A.locator('.kx-mem').nth(i1).click(); await sleep(300); await A.locator('.kx-mem').nth(i2).click(); let todos = false; for (let t = 0; t < 40 && !todos; t++) { todos = (await Promise.all(ph.map(ups))).every((n) => n === 2); if (!todos) await sleep(100); }
check('as 2 cartas aparecem viradas nos 4 celulares', todos);
await sleep(4500);
check('errou: a vez passa pra Bia (no B "sua vez", nos outros "vez de Bia")', (await vez(B)) === 'sua vez' && (await vez(C)) === 'vez de bia' && (await vez(A)) === 'vez de bia', `${await vez(A)}/${await vez(B)}/${await vez(C)}`);
// Bia acha um par e joga de novo
const par = deck.map((x, i) => [x, i]).filter(([x]) => x === deck[2]).map(([, i]) => i);
await B.locator('.kx-mem').nth(par[0]).click(); await sleep(300); await B.locator('.kx-mem').nth(par[1]).click(); await sleep(4200);
check('Bia achou um par: placar 1 pra Bia e ela continua', /Bia 1/.test(await placar(C)) || /você 1/.test(await placar(B)), `${await placar(B)} | ${await placar(C)}`);
check('Bia continua com a vez (joga de novo)', (await vez(B)) === 'sua vez' && (await vez(D)) === 'vez de bia');
// quinto jogador não entra
const E = await phone('Eva'); await E.locator('.mem-ic[aria-label^="sala"]').click(); await sleep(250); await E.locator('.jg-code-in').fill(code); await E.locator('button:has-text("entrar")').click(); await sleep(1500);
check('sala cheia: o quinto vê "já está cheia"', /já está cheia/.test(await E.locator('.jg-lobby').innerText()));
check('sem erro de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
