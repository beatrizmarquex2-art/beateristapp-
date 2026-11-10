// Cara a Cara Musical em 2 celulares: PERGUNTA LIVRE (texto livre, o outro responde SIM/NÃO na mão, vez alterna, cartas viradas à mão).
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
  await p.locator('button[role=radio]:has-text("cara a cara musical")').click(); await sleep(250);
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
if (false) { fs.mkdirSync(SHOT, { recursive: true }); await a.screenshot({ path: `${SHOT}/10-online-a.png` }); await b.screenshot({ path: `${SHOT}/11-online-b.png` }); }

const vez = async (p) => (await p.locator('.cm-root p[aria-live=polite]').first().innerText()).includes('sua vez');
const quem = async () => ((await vez(a)) ? [a, b] : (await vez(b)) ? [b, a] : [null, null]);
const [v, o] = await quem(); check('[jogo] um dos dois tem a vez e vê o botão "pergunta livre"', !!v && (await v.locator('button:has-text("pergunta livre")').count()) === 1);
check('[jogo] quem não tem a vez não vê o botão', (await o.locator('button:has-text("pergunta livre")').count()) === 0);
// pergunta livre com texto
await v.locator('button:has-text("pergunta livre")').click(); await sleep(400);
await v.locator('input[aria-label="pergunta livre"]').fill('a sua carta já tocou no rock in rio?'); await v.locator('.sheet-body button:has-text("perguntar")').click(); await sleep(3000);
check('[livre] o outro celular recebe o texto e os botões SIM e NÃO', (await o.locator('.cm-livre-txt').innerText()).includes('rock in rio') && (await o.locator('.cm-livre button:text-is("SIM")').count()) === 1 && (await o.locator('.cm-livre button:text-is("NÃO")').count()) === 1);
if (SHOT) { fs.mkdirSync(SHOT, { recursive: true }); await o.screenshot({ path: `${SHOT}/livre-responder.png` }); }
check('[livre] não responde sozinho (continua esperando)', (await v.locator('.cm-root p[aria-live=polite]').first().innerText()).includes('esperando o outro'));
await o.locator('.cm-livre button:text-is("SIM")').click(); await sleep(3000);
check('[livre] quem perguntou vê o SIM com o texto', /SIM/.test(await v.locator('.cm-paul').innerText()) && (await v.locator('.cm-paul').innerText()).includes('rock in rio'));
check('[livre] a vez passou pro outro', await vez(o) && !(await vez(v)));
check('[livre] conta como pergunta (1) e nenhuma carta saiu sozinha', (await v.locator('.jg-who').nth(0).locator('span').innerText()) === '1' && (await v.locator('.cm-cell.out').count()) === 0);
if (SHOT) await v.screenshot({ path: `${SHOT}/livre-virar.png` });
check('[livre] botões "virar" aparecem nas cartas de quem perguntou', (await v.locator('.cm-cell .jg-flip').count()) > 0);
await v.locator('.cm-cell .jg-flip').first().click(); await sleep(300);
check('[livre] virar à mão tira a carta do jogo (só neste aparelho)', (await v.locator('.cm-cell.out').count()) === 1 && (await o.locator('.cm-cell.out').count()) === 0);
await v.locator('.cm-cell.out .jg-flip').click(); await sleep(300);
check('[livre] desvirar devolve a carta', (await v.locator('.cm-cell.out').count()) === 0);
// agora o outro faz uma pergunta livre SEM texto (falada) e responde NÃO
await o.locator('button:has-text("pergunta livre")').click(); await sleep(400); await o.locator('.sheet-body button:has-text("perguntar")').click(); await sleep(3000);
check('[falada] o outro celular pede pra ouvir e responder', (await v.locator('.cm-livre-txt').innerText()).includes('falada'));
await v.locator('.cm-livre button:text-is("NÃO")').click(); await sleep(3000);
check('[falada] NÃO chega pra quem perguntou e a vez volta', /NÃO/.test(await o.locator('.cm-paul').innerText()) && await vez(v));
// pergunta pronta continua funcionando e mistura com as livres
await v.locator('.cm-qs .cm-q').first().click(); await sleep(3000);
check('[mistura] pergunta pronta ainda responde sozinha', (await v.locator('.jg-who').nth(0).locator('span').innerText()) === '2');
check('[sem erros de JS]', !a.errs.length && !b.errs.length, [...a.errs, ...b.errs].join('|'));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
