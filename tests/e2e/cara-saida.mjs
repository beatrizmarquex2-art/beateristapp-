// Cara a Cara Musical em 3 celulares: um deles some sem avisar (fecha a página) e os dois que ficaram decidem, pela maioria, continuar sem ele.
// O Supabase é simulado na memória (funções sala_* antigas, as _n, e sala_presenca / sala_votar da saída de jogador).
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch({ codigo: false });
const salas = new Map(); const ago = () => Date.now() / 1000;
const mock = async (route) => {
  const fn = new URL(route.request().url()).pathname.split('/').pop(); const b = route.request().postDataJSON();
  const ok = (j) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(j) });
  const s = salas.get(String(b.p_code || '').toUpperCase());
  if (fn === 'sala_criar') { const c = 'CS' + String(salas.size + 100); salas.set(c, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false, max: 2, nomes: [] }); return ok(c); }
  if (fn === 'sala_criar_n') { const c = 'CT' + String(salas.size + 100); salas.set(c, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false, max: b.p_max, nomes: [b.p_nome] }); return ok(c); }
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
  await p.addInitScript((n) => { window.BT_SAIDA_S = 12; try { localStorage.setItem('beaterista-aluno-nome', n); localStorage.setItem('beaterista-nome-sala', n); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } }, nome);
  await p.goto(`${url}/aluno.html#/jogos/cara`); await sleep(1200);
  for (const t of ['JOGAR', 'Modo Livre']) { const b = p.locator(`button:text-is("${t}"), a:text-is("${t}")`); if (await b.count()) { await b.first().click(); await sleep(400); } }
  await p.locator('button[role=radio][aria-label*="celulares"]').click(); await sleep(250); return p;
}
const nomes = ['Ana', 'Bia', 'Cris']; const ph = []; for (const n of nomes) ph.push(await phone(n));
const [A, B, C] = ph;
for (const p of ph) { await p.locator('button:has-text("criar ou entrar numa sala")').click(); await sleep(400); }
await A.locator('button[role="radio"][aria-label="3 jogadores"]').click(); await sleep(200);
await A.locator('button:has-text("criar sala")').click(); await sleep(600);
const code = (await A.locator('.jg-code').textContent()).trim();
for (const p of [B, C]) { await p.locator('.jg-code-in').fill(code); await p.locator('button:has-text("entrar")').click(); await sleep(1500); }
let todos = false; for (let t = 0; t < 60 && !todos; t++) { todos = (await Promise.all(ph.map((p) => p.locator('.cm-corrida').count()))).every((n) => n === 1); if (!todos) await sleep(300); }
check('a partida começa quando os 3 entram', todos);
const sala = () => salas.get(code).estado;
const faixa = async (p) => (await p.locator('.cm-corrida').innerText()).toLowerCase();
await C.close(); // a Cris some sem avisar
let aviso = false; for (let t = 0; t < 120 && !aviso; t++) { aviso = (await A.locator('.jg-saiu-l', { hasText: /cris/i }).count()) > 0 && (await B.locator('.jg-saiu-l', { hasText: /cris/i }).count()) > 0; if (!aviso) await sleep(500); }
check('depois de ~30 s sem sinal (12 s no teste) o aviso aparece pros DOIS que ficaram', aviso);
check('o aviso diz o nome da Cris e mostra os votos (0/2)', /cris parece ter saído/.test((await A.locator('.jg-saiu').innerText()).toLowerCase()) && /0\/2/.test((await A.locator('.jg-saiu').innerText()).toLowerCase()));
await A.locator('.jg-saiu button:has-text("continuar sem Cris")').click(); await sleep(6500);
check('um voto só não basta: a Cris continua na partida (sem "(saiu)")', !/\(saiu\)/.test(await faixa(A)) && !(sala().fora || []).includes(2));
await B.locator('.jg-saiu button:has-text("continuar sem Cris")').click();
let fora = false; for (let t = 0; t < 40 && !fora; t++) { fora = (sala().fora || []).includes(2) && /cris \(saiu\)/.test(await faixa(A)) && /cris \(saiu\)/.test(await faixa(B)); if (!fora) await sleep(500); }
check('com a maioria (2 de 2) o estado marca a Cris como "saiu" e a faixa mostra "(saiu)" nos dois', fora, JSON.stringify(sala().fora));
check('a Cris ficou como "terminou sem acertar" (não é esperada)', sala().prog[2].fim === true && sala().prog[2].ok === false && sala().prog[2].saiu === true, JSON.stringify(sala().prog[2]));
const idx = sala().mesa.cartas.findIndex((c) => c.id === sala().segredo);
const perguntar = async (p, k) => { for (let i = 0; i < k; i++) { await p.locator('.cm-qc').first().click(); await sleep(350); } };
const palpitar = async (p, i) => { await p.locator('button:has-text("Adivinhar!")').click(); await sleep(250); await p.locator('.cm-card').nth(i).click(); await sleep(250); await p.locator('button:has-text("sim, adivinhar!")').click(); await sleep(500); };
await perguntar(A, 2); await palpitar(A, idx); await sleep(900);
check('a Ana terminou e vê "esperando os outros (1 de 2)": a Cris não conta', /esperando os outros \(1 de 2 terminaram\)/i.test(await A.locator('.cm-root').innerText()), (await A.locator('.cm-root').innerText()).slice(0, 200));
await perguntar(B, 1); await palpitar(B, idx);
let fim = false; for (let t = 0; t < 40 && !fim; t++) { fim = (await Promise.all([A, B].map((p) => p.locator('.cm-classif li').count()))).every((n) => n === 3) && (await A.locator('.cm-ficha').count()) === 1; if (!fim) await sleep(300); }
check('sem esperar pela Cris: classificação com os 3 e a carta do Paul aparece', fim);
const ordem = (await A.locator('.cm-classif li b').allInnerTexts()).map((t) => t.toLowerCase());
check('ordem: Bia (1 pergunta), Ana (2) e a Cris por último, marcada "(saiu)"', ordem[0].includes('bia') && ordem[1].includes('ana') && ordem[2].includes('cris') && ordem[2].includes('(saiu)'), ordem.join(' | '));
check('a Bia vence ("você venceu!" nela, "Bia venceu!" na Ana)', /você venceu/i.test(await B.locator('.cm-root h3').innerText()) && /bia venceu/i.test(await A.locator('.cm-root h3').innerText()));
check('"próxima rodada" é da Ana (menor lugar que ficou)', (await A.locator('button:has-text("próxima rodada")').count()) === 1 && (await B.locator('button:has-text("próxima rodada")').count()) === 0);
await A.locator('button:has-text("próxima rodada")').click();
let nova = false; for (let t = 0; t < 40 && !nova; t++) { nova = sala().rodada === 2 && (await Promise.all([A, B].map((p) => p.locator('.cm-corrida').count()))).every((n) => n === 1); if (!nova) await sleep(300); }
check('rodada 2: a Cris continua fora e os dois jogam sem esperar por ela', nova && (sala().fora || []).includes(2) && sala().prog[2].saiu === true && !sala().prog[0].fim && !sala().prog[1].fim, JSON.stringify(sala().prog));
check('sem erro de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
