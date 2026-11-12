// Cara a Cara Musical em 2 celulares: sala com código (Supabase simulado em memória), segredo só no aparelho, partida kids completa, reconexão.
import { serve, launch, sleep, check, done } from './harness.mjs';
import fs from 'node:fs';
const SHOT = process.env.SHOTS;
const { srv, url } = await serve(); const { browser } = await launch();
const salas = new Map(); const trafego = [];
const mock = async (route) => {
  const fn = new URL(route.request().url()).pathname.split('/').pop(); const b = route.request().postDataJSON(); trafego.push(JSON.stringify(b));
  const ok = (j) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(j) });
  if (fn === 'sala_criar') { const c = 'CM' + String(salas.size + 100); salas.set(c, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false }); return ok(c); }
  const s = salas.get(String(b.p_code || '').toUpperCase());
  if (fn === 'sala_entrar') { if (!s || s.jogo !== b.p_jogo) return ok([]); s.convidado = true; return ok([{ ver: s.ver, estado: s.estado }]); }
  if (fn === 'sala_ler') return ok(s ? [{ ver: s.ver, convidado: s.convidado, estado: s.ver === b.p_ver ? null : s.estado }] : []);
  if (fn === 'sala_enviar') { if (!s || s.ver !== b.p_ver) return ok(0); s.estado = b.p_estado; s.ver++; return ok(s.ver); }
  return route.continue();
};
async function phone() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await ctx.route('**/rest/v1/rpc/sala_*', mock);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', '1'); localStorage.setItem('beaterista-aluno-nome', 'Teste'); } }); p.errs = errs; p.ctx = ctx; return p;
}
const livre = async (p) => { const b = p.locator('button:has-text("Modo Livre"), a:has-text("Modo Livre")'); if (await b.count()) { await b.first().click(); await sleep(400); } };
async function abrir(p) {
  await p.goto(`${url}/aluno.html#/jogos/cara`); await sleep(1000);
  if (await p.locator('button:text-is("JOGAR")').count()) { await p.locator('button:text-is("JOGAR")').click(); await sleep(300); }
  await livre(p);
  await sleep(250); // o cara a cara é só de artistas: abre direto
  await p.locator('button[role=radio]:has-text("2 celulares")').click(); await sleep(200);
}
const a = await phone(); const b = await phone();
await abrir(a); await abrir(b);
await a.locator('button:has-text("criar ou entrar numa sala")').click(); await sleep(500);
await b.locator('button:has-text("criar ou entrar numa sala")').click(); await sleep(500);
await a.locator('button:has-text("criar sala")').click(); await sleep(500);
const code = (await a.locator('.jg-code').textContent()).trim(); check('[sala] código de 5 caracteres', code.length === 5, code);
await b.locator('.jg-code-in').fill(code); await b.locator('button:has-text("entrar")').click(); await sleep(2800);
check('[escolha] os dois escolhem a carta secreta', (await a.locator('h2:has-text("escolha a sua carta secreta")').count()) === 1 && (await b.locator('h2:has-text("escolha a sua carta secreta")').count()) === 1);
const escolher = async (p, i) => { await p.locator('.cm-card').nth(i).click(); await sleep(250); await p.locator('button:has-text("esta é a minha carta secreta")').click(); await sleep(400); };
await escolher(a, 0); await escolher(b, 3); await sleep(3000);
const segA = await a.evaluate(() => Object.entries(localStorage).filter(([k]) => k.startsWith('cm-online-CM')).map(([, v]) => JSON.parse(v).segredo)[0]);
const segB = await b.evaluate(() => Object.entries(localStorage).filter(([k]) => k.startsWith('cm-online-CM')).map(([, v]) => JSON.parse(v).segredo)[0]);
check('[segredo] cada celular guarda só o seu', !!segA && !!segB && segA !== segB);
const estado = JSON.stringify(salas.get(code).estado);
check('[segredo] o segredo não está na sala', !estado.includes('"segredo"') && !trafego.some((t) => t.includes('"segredo"')));
if (SHOT) { fs.mkdirSync(SHOT, { recursive: true }); await a.screenshot({ path: `${SHOT}/10-online-a.png` }); await b.screenshot({ path: `${SHOT}/11-online-b.png` }); }
const vez = async (p) => (await p.locator('.cm-root p[aria-live=polite]').first().innerText()).includes('sua vez');
const quem = async () => ((await vez(a)) ? [a, b] : (await vez(b)) ? [b, a] : [null, null]);
let [v0] = await quem(); check('[jogo] só um tem a vez', !!v0);
// joga: quem tem a vez pergunta (1ª sugestão) ou palpita quando sobra 1 carta
let guard = 0; const lados = new Map();
while (guard++ < 60) {
  if (await a.locator('.cm-ficha').count() && await b.locator('.cm-ficha').count()) break;
  const [v] = await quem(); if (!v) { await sleep(500); continue; }
  const sobra = parseInt(await v.locator('.jg-who').nth(2).locator('span').innerText(), 10);
  if (sobra === 1) { await v.locator('button:has-text("Adivinhar!")').click(); await sleep(200); await v.locator('.cm-cell:not(.out) .cm-card').first().click(); await sleep(200); await v.locator('button:has-text("sim, adivinhar!")').click(); }
  else await v.locator('.cm-carro .cm-qc').first().click();
  await sleep(2800);
}
check('[fim] os dois veem as fichas', (await a.locator('.cm-ficha').count()) === 2 && (await b.locator('.cm-ficha').count()) === 2);
await sleep(1500); await a.screenshot({ path: SHOT ? `${SHOT}/12-online-fim.png` : '/dev/null' }).catch(() => {});
check('[fim] revelação confere', /conferidas/.test(await a.locator('#cm-conferencia').innerText()) && /conferidas/.test(await b.locator('#cm-conferencia').innerText()));
check('[fim] placar igual nos dois', (await a.locator('.cm-placar b').first().innerText()).replace(/\D/g, '') === (await b.locator('.cm-placar b').first().innerText()).replace(/\D/g, '').split('').reverse().join(""));
check('[fim] sem figurinha/recompensa', !/figurinha|pacote|recompensa/i.test(await a.locator('.cm-root').innerText()));
// reconexão: fecha a página do B e volta pelo botão
await b.reload(); await sleep(1200);
if (await b.locator('button:text-is("JOGAR")').count()) { await b.locator('button:text-is("JOGAR")').click(); await sleep(300); }
await b.screenshot({ path: '/tmp/claude-0/shots/dbg-b.png' });
await livre(b); await sleep(250);
check('[reconexão] botão voltar pra sala', (await b.locator(`button:has-text("voltar pra sala ${code}")`).count()) === 1);
await b.locator(`button:has-text("voltar pra sala ${code}")`).click(); await sleep(1800);
check('[reconexão] volta no fim da rodada', (await b.locator('.cm-ficha').count()) === 2);
check('[sem erros de JS]', !a.errs.length && !b.errs.length, [...a.errs, ...b.errs].join('|'));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
