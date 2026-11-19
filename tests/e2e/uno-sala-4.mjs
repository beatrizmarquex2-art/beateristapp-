// Uno Musical em 4 celulares (sala por código): quem cria escolhe 4 jogadores; os outros entram com o código e o nome.
// O Supabase é simulado na memória (as funções sala_* antigas e as novas sala_*_n). Cada celular vê só a sua mão.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const salas = new Map();
const mock = async (route) => {
  const fn = new URL(route.request().url()).pathname.split('/').pop(); const b = route.request().postDataJSON();
  const ok = (j) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(j) });
  const s = salas.get(String(b.p_code || '').toUpperCase());
  if (fn === 'sala_criar') { const c = 'UA' + String(salas.size + 100); salas.set(c, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false, max: 2, nomes: [] }); return ok(c); }
  if (fn === 'sala_criar_n') { const c = 'UN' + String(salas.size + 100); salas.set(c, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false, max: b.p_max, nomes: [b.p_nome] }); return ok(c); }
  if (fn === 'sala_entrar_n') { if (!s || s.jogo !== b.p_jogo) return ok([]); if (s.nomes.length >= s.max) return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'cheia' }) }); s.nomes.push(b.p_nome || 'jogador'); return ok([{ lugar: s.nomes.length - 1, ver: s.ver, estado: s.estado, max_jogadores: s.max, nomes: s.nomes }]); }
  if (fn === 'sala_ler_n') return ok(s ? [{ ver: s.ver, max_jogadores: s.max, nomes: s.nomes, estado: s.ver === b.p_ver ? null : s.estado }] : []);
  if (fn === 'sala_entrar') { if (!s || s.jogo !== b.p_jogo) return ok([]); s.convidado = true; return ok([{ ver: s.ver, estado: s.estado }]); }
  if (fn === 'sala_ler') return ok(s ? [{ ver: s.ver, convidado: s.convidado, estado: s.ver === b.p_ver ? null : s.estado }] : []);
  if (fn === 'sala_enviar') { if (!s || s.ver !== b.p_ver) return ok(0); s.estado = b.p_estado; s.ver++; return ok(s.ver); }
  return route.continue();
};
const errs = [];
async function phone(nome) {
  const ctx = await context(browser, { viewport: { width: 390, height: 844 } }); await ctx.route('**/rest/v1/rpc/sala_*', mock);
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.addInitScript((n) => { try { localStorage.setItem('beaterista-aluno-nome', n); localStorage.setItem('beaterista-nome-sala', n); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } }, nome);
  await p.goto(`${url}/aluno.html#/jogos/cartas/livre`); await sleep(1000);
  const jog = p.locator('button:has-text("JOGAR")'); if (await jog.count()) { await jog.first().click(); await sleep(300); }
  await p.locator('.jg-seg button[aria-label^="2 a 4"]').click(); await sleep(400); return p;
}
const vezTxt = async (p) => (await p.locator('.cx-turn').innerText()).trim().toLowerCase();
const nomes = ['Ana', 'Bia', 'Cris', 'Duda']; const ph = []; for (const n of nomes) ph.push(await phone(n));
const [A, B, C, D] = ph;
check('o modo online diz "2 a 4 celulares"', (await A.locator('.jg-seg button[aria-label^="2 a 4"]').count()) === 1);
await A.locator('button[role="radio"][aria-label="4 jogadores"]').click(); await sleep(200);
await A.locator('button:has-text("criar sala")').click(); await sleep(600);
const code = (await A.locator('.jg-code').textContent()).trim();
check('sala de 4 criada: código e "1 de 4 entraram"', code.length === 5 && /1 de 4 entraram/.test(await A.locator('.jg-lobby').innerText()), code);
for (const p of [B, C, D]) { await p.locator('.jg-code-in').fill(code); await p.locator('button:has-text("entrar")').click(); await sleep(1600); }
await sleep(4500);
const maos = await Promise.all(ph.map((p) => p.locator('.cx-hc').count()));
check('os 4 começaram: cada um com 7 cartas na mão', maos.every((n) => n === 7), maos.join(','));
check('cada celular vê 3 adversários com nome e número de cartas', (await Promise.all(ph.map((p) => p.locator('.cx-seat').count()))).every((n) => n === 3));
const nomesA = (await A.locator('.cx-seat .cx-sname b').allInnerTexts()).map((x) => x.toLowerCase()).sort().join(',');
check('A vê Bia, Cris e Duda', nomesA === 'bia,cris,duda', nomesA);
const vez = []; for (const p of ph) vez.push((await vezTxt(p)).includes('sua vez'));
const quem = vez.findIndex(Boolean);
check('só um celular tem "sua vez"', vez.filter(Boolean).length === 1, vez.join(','));
check('os outros 3 veem o nome de quem joga', (await Promise.all(ph.filter((_, i) => i !== quem).map(vezTxt))).every((t) => t.includes(`vez de ${nomes[quem].toLowerCase()}`)), (await Promise.all(ph.map(vezTxt))).join(' | '));
const P = ph[quem]; const play = P.locator('.cx-hc.fit').first();
if (await play.count()) { await play.click({ position: { x: 6, y: 30 }, force: true }); await sleep(250); if (await P.locator('.cx-pick').count()) await P.locator('.cx-pc').first().click({ force: true }); }
else { await P.locator('.cx-deck').click(); }
await sleep(4500);
const vez2 = []; for (const p of ph) vez2.push((await vezTxt(p)).includes('sua vez'));
check('a jogada chegou nos outros celulares (continua só um com a vez)', vez2.filter(Boolean).length === 1, vez2.join(','));
const total = (await Promise.all(ph.map((p) => p.locator('.cx-hc').count()))).reduce((a, b) => a + b, 0);
check('as mãos continuam secretas: cada um só vê as suas cartas', total >= 27 && total <= 33, String(total));
// joga a partida inteira (cada celular joga quando é a vez dele) até alguém ganhar: o resultado mostra os 4 jogadores
let fimTela = false; const t0 = Date.now();
while (Date.now() - t0 < 200000 && !fimTela) {
  for (const p of ph) {
    if (await p.locator('.cx-result').count()) { fimTela = true; break; }
    if (!(await vezTxt(p)).includes('sua vez')) continue;
    if (await p.locator('.cx-pick').count()) { await p.locator('.cx-pc').first().click({ force: true }).catch(() => {}); await sleep(250); continue; }
    const fit = p.locator('.cx-hc.fit').first(); const deck = p.locator('.cx-deck:not([disabled])'); const pass = p.locator('.cx-me .btn:not([disabled])');
    if (await fit.count()) { await fit.click({ position: { x: 6, y: 30 }, force: true }).catch(() => {}); await sleep(300); }
    else if (await deck.count()) { await deck.first().click().catch(() => {}); await sleep(300); }
    else if (await pass.count()) { await pass.first().click().catch(() => {}); await sleep(300); }
  }
  await sleep(250);
}
check('a partida de 4 terminou com tela de resultado nos celulares', fimTela);
if (fimTela) {
  await sleep(1500);
  const q = await Promise.all(ph.map((p) => p.locator('.cx-result').count()));
  check('o resultado aparece nos 4 celulares', q.every((n) => n === 1), q.join(','));
  const txt = ((await A.locator('.cx-result').innerText()) || '').toLowerCase();
  check('o resultado mostra os 4 nomes (ranking)', ['você', 'bia', 'cris', 'duda'].every((n) => txt.includes(n)), txt.slice(0, 120));
}
const E = await phone('Eva'); await E.locator('.jg-code-in').fill(code); await E.locator('button:has-text("entrar")').click(); await sleep(1500);
check('sala cheia: o quinto vê "já está cheia"', /já está cheia/.test(await E.locator('.jg-lobby').innerText()));
check('sem erro de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
