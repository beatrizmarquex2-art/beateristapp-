// Cara a Cara Musical em 4 celulares (corrida pela MESMA carta do Paul): sala por código com nomes, cada um joga no seu celular,
// o andamento de todos aparece na faixa "a sala", ganha quem acertou com menos perguntas; só o criador começa a próxima rodada.
// O Supabase é simulado na memória (funções sala_* antigas e as novas sala_*_n).
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch({ codigo: false });
const salas = new Map();
const mock = async (route) => {
  const fn = new URL(route.request().url()).pathname.split('/').pop(); const b = route.request().postDataJSON();
  const ok = (j) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(j) });
  const s = salas.get(String(b.p_code || '').toUpperCase());
  if (fn === 'sala_criar') { const c = 'CA' + String(salas.size + 100); salas.set(c, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false, max: 2, nomes: [] }); return ok(c); }
  if (fn === 'sala_criar_n') { const c = 'CN' + String(salas.size + 100); salas.set(c, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false, max: b.p_max, nomes: [b.p_nome] }); return ok(c); }
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
  await p.goto(`${url}/aluno.html#/jogos/cara`); await sleep(1200);
  for (const t of ['JOGAR', 'Modo Livre']) { const b = p.locator(`button:text-is("${t}"), a:text-is("${t}")`); if (await b.count()) { await b.first().click(); await sleep(400); } }
  await p.locator('button[role=radio][aria-label*="celulares"]').click(); await sleep(250); return p;
}
const nomes = ['Ana', 'Bia', 'Cris', 'Duda']; const ph = []; for (const n of nomes) ph.push(await phone(n));
const [A, B, C, D] = ph;
for (const p of ph) { await p.locator('button:has-text("criar ou entrar numa sala")').click(); await sleep(400); }
await A.locator('button[role="radio"][aria-label="4 jogadores"]').click(); await sleep(200);
await A.locator('button:has-text("criar sala")').click(); await sleep(600);
const code = (await A.locator('.jg-code').textContent()).trim();
check('sala de 4 criada: código e "1 de 4 entraram"', code.length === 5 && /1 de 4 entraram/.test(await A.locator('.jg-lobby').innerText()), code);
for (const p of [B, C, D]) { await p.locator('.jg-code-in').fill(code); await p.locator('button:has-text("entrar")').click(); await sleep(1500); }
let todos = false; for (let t = 0; t < 60 && !todos; t++) { todos = (await Promise.all(ph.map((p) => p.locator('.cm-corrida').count()))).every((n) => n === 1); if (!todos) await sleep(300); }
check('a partida começa sozinha quando os 4 entram (faixa "a sala" nos 4)', todos);
const sala = () => salas.get(code).estado;
check('o estado é de corrida: 4 jogadores, nomes na ordem de entrada, mesma carta pra todos', sala().corrida === true && sala().n === 4 && JSON.stringify(sala().nomes) === JSON.stringify(nomes), JSON.stringify(sala().nomes));
const faixa = async (p) => (await p.locator('.cm-corrida').innerText()).toLowerCase();
check('a faixa lista os 4 nomes e marca o próprio celular com "(você)"', (await Promise.all(ph.map(async (p, i) => { const t = await faixa(p); return nomes.every((n) => t.includes(n.toLowerCase())) && t.includes(`${nomes[i].toLowerCase()} (você)`); }))).every(Boolean));
const nCartas = await A.locator('.cm-card').count(); check('os 4 veem a mesma mesa (mesmo número de cartas)', (await Promise.all(ph.map((p) => p.locator('.cm-card').count()))).every((n) => n === nCartas) && nCartas >= 6, String(nCartas));
const idx = sala().mesa.cartas.findIndex((c) => c.id === sala().segredo);
const perguntar = async (p, k) => { for (let i = 0; i < k; i++) { await p.locator('.cm-qc').first().click(); await sleep(350); } };
const palpitar = async (p, i) => { await p.locator('button:has-text("Adivinhar!")').click(); await sleep(250); await p.locator('.cm-card').nth(i).click(); await sleep(250); await p.locator('button:has-text("sim, adivinhar!")').click(); await sleep(500); };
const errada = idx === 0 ? 1 : 0; const errada2 = idx <= 1 ? 2 : 1;
// Ana: 3 perguntas e acerta. Bia: 1 pergunta e acerta (vence). Cris: erra os 2 palpites. Duda: 3 perguntas e acerta (empata com Ana em perguntas, termina depois)
await perguntar(B, 1); await sleep(600);
check('o andamento de todo mundo aparece nos outros celulares ("1 pergunta" da Bia na tela da Ana)', await (async () => { for (let t = 0; t < 20; t++) { if (/bia[\s\S]*1 pergunta/.test(await faixa(A))) return true; await sleep(300); } return false; })());
await palpitar(B, idx); await sleep(1400);
await perguntar(A, 3); await palpitar(A, idx); await sleep(900);
await palpitar(C, errada); await sleep(400); await palpitar(C, errada2); await sleep(900);
check('quem terminou vê "esperando os outros" e NÃO vê a carta do Paul ainda', /esperando os outros/i.test(await A.locator('.cm-root').innerText()) && (await A.locator('.cm-ficha').count()) === 0);
await perguntar(D, 3); await palpitar(D, idx);
let fim = false; for (let t = 0; t < 40 && !fim; t++) { fim = (await Promise.all(ph.map((p) => p.locator('.cm-classif li').count()))).every((n) => n === 4) && (await A.locator('.cm-ficha').count()) === 1; if (!fim) await sleep(300); }
check('todos terminaram: classificação com os 4 e a carta do Paul aparece', fim);
const topo = async (p) => (await p.locator('.cm-classif li').first().innerText()).toLowerCase();
check('a Bia (acertou com 1 pergunta) é a 1ª nos 4 celulares', (await Promise.all(ph.map(topo))).every((t) => t.includes('bia')), await topo(A));
check('o título diz quem venceu ("você venceu!" na Bia, "Bia venceu!" nos outros)', /você venceu/i.test(await B.locator('.cm-root h3').innerText()) && /bia venceu/i.test(await A.locator('.cm-root h3').innerText()));
const ordem = (await A.locator('.cm-classif li b').allInnerTexts()).map((t) => t.toLowerCase());
check('ordem: Bia, Ana, Duda (acertaram) e Cris por último', ordem[0].includes('bia') && ordem[1].includes('ana') && ordem[2].includes('duda') && ordem[3].includes('cris'), ordem.join(' | '));
check('só quem criou a sala vê "próxima rodada"', (await A.locator('button:has-text("próxima rodada")').count()) === 1 && (await B.locator('button:has-text("próxima rodada")').count()) === 0);
await A.locator('button:has-text("próxima rodada")').click();
let nova = false; for (let t = 0; t < 40 && !nova; t++) { nova = (await Promise.all(ph.map((p) => p.locator('.cm-corrida').count()))).every((n) => n === 1) && sala().rodada === 2; if (!nova) await sleep(300); }
check('rodada 2: todos voltam a jogar, andamento zerado', nova && sala().prog.every((x) => !x.fim) && (await Promise.all(ph.map(faixa))).every((t) => !/acertou em/.test(t)), JSON.stringify(sala().prog));
check('sem erro de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
