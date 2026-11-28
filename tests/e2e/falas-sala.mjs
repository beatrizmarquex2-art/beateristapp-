// Mensagens e reações na sala por código: o botão "falar" só aparece dentro de sala; os 16 Pauls e as frases prontas chegam no outro celular; sem texto livre. A sala é simulada aqui.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch();
const errs = []; const salas = {};
const instala = (c) => c.route('**/rest/v1/rpc/**', async (r) => {
  const fn = r.request().url().split('/rpc/')[1]; let b = {}; try { b = JSON.parse(r.request().postData() || '{}'); } catch { /* ok */ }
  const j = (x) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(x) });
  if (fn === 'aluno_codigo_ok') return j(true);
  if (fn === 'sala_criar') { salas.ABCDE = { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false }; return j('ABCDE'); }
  const s = salas[String(b.p_code || '').toUpperCase()];
  if (fn === 'sala_entrar') { if (!s) return j([]); s.convidado = true; return j([{ ver: s.ver, estado: s.estado }]); }
  if (fn === 'sala_ler') return j(s ? [{ ver: s.ver, convidado: s.convidado, estado: s.ver === b.p_ver ? null : s.estado }] : []);
  if (fn === 'sala_enviar') { if (!s || s.ver !== b.p_ver) return j(0); s.estado = b.p_estado; s.ver++; return j(s.ver); }
  return j([]);
});
instala(ctx);
const abrir = async (nome, c = ctx) => {
  const p = await c.newPage(); p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.addInitScript((n) => { try { localStorage.setItem('beaterista-aluno-nome', n); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } }, nome);
  await p.goto(`${url}/aluno.html#/jogos/velha`); await sleep(1200); return p;
};
const modo = (p, rotulo) => p.locator(`.jg-seg button[aria-label^="${rotulo}"]`).click();
{
  const solo = await abrir('Solo'); await modo(solo, 'dois'); await sleep(300);
  check('fora de sala o botão "falar" não aparece', (await solo.locator('.fl-btn:visible').count()) === 0);
  await solo.close();
}
const ctxB = await context(browser, { viewport: { width: 390, height: 844 } }); instala(ctxB);
const A = await abrir('Ana'); const B = await abrir('Bia', ctxB);
await modo(A, '2 celulares'); await modo(B, '2 celulares'); await sleep(300);
await A.locator('.jg-nome-sala input').fill('Ana'); await B.locator('.jg-nome-sala input').fill('Bia');
await A.locator('.jg-lobby .btn.primary').first().click(); await sleep(1500);
await B.locator('.jg-code-in').fill('ABCDE'); await B.locator('.jg-entrar .btn').click(); await sleep(2500);
check('os dois entraram na sala', (await A.locator('.jg-board').count()) === 1 && (await B.locator('.jg-board').count()) === 1);
check('dentro da sala o botão "falar" aparece nos dois', (await A.locator('.fl-btn:visible').count()) === 1 && (await B.locator('.fl-btn:visible').count()) === 1);
const SHOT = process.env.SHOT; const foto = async (p, n) => { if (SHOT) await p.screenshot({ path: `${SHOT}/${n}.png` }); };
await A.locator('.fl-btn').click(); await sleep(300); await foto(A, 'falas-1-bandeja');
check('a bandeja tem 16 Pauls e 8 frases prontas, sem campo de texto', (await A.locator('.fl-grade button').count()) === 16 && (await A.locator('.fl-frases button').count()) === 8 && (await A.locator('.fl-bandeja input, .fl-bandeja textarea').count()) === 0);
check('as 16 imagens carregam', (await A.evaluate(async () => { const im = [...document.querySelectorAll('.fl-grade img')]; await Promise.all(im.map((i) => i.decode().catch(() => {}))); return im.every((i) => i.naturalWidth > 0); })) === true);
await A.locator('.fl-grade button').nth(10).click(); await sleep(2500); // fogo
check('quem mandou vê a confirmação e a bandeja fecha', (await A.locator('.fl-bandeja').count()) === 0 && /você mandou fogo/.test(await A.locator('.fl-aviso').innerText()));
check('o outro celular recebe a reação com o nome de quem mandou', /Ana mandou fogo/.test(await B.locator('.fl-aviso').innerText()) && (await B.locator('.fl-aviso img').getAttribute('src')).endsWith('paul-fogo.webp'), await B.locator('.fl-aviso').innerText());
await foto(B, 'falas-2-chegou'); await sleep(1600);
await B.locator('.fl-btn').click(); await B.locator('.fl-frases button:has-text("boa jogada")').click(); await sleep(2500);
check('a frase pronta chega no outro celular', /Bia: boa jogada!/.test(await A.locator('.fl-aviso').innerText()), await A.locator('.fl-aviso').innerText());
// esconder o que os outros mandam
await A.locator('.fl-btn').click(); await A.locator('.fl-mudo').click(); await A.locator('.fl-fechar').click(); await sleep(300);
await A.locator('.fl-aviso').evaluate((e) => { e.hidden = true; });
await sleep(1600); await B.locator('.fl-btn').click(); await B.locator('.fl-grade button').nth(0).click(); await sleep(2500);
check('com "esconder" ligado o aviso não aparece', (await A.locator('.fl-aviso:visible').count()) === 0);
// a partida segue normal depois das falas
await A.locator('.jg-cell').first().click(); await sleep(2500);
check('a partida continua funcionando (pergunta no celular de quem joga)', (await A.locator('.jg-qt').count()) === 1);
check('sem erros de script', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
