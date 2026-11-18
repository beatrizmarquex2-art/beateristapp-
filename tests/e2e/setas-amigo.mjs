// Beat Hero (setas): o rival é o Paul OU um amigo por código de sala. Com amigo, os dois celulares tocam a mesma fase de setas. A sala é simulada aqui.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const errs = []; const salas = {};
await ctx.route('**/rest/v1/rpc/**', async (r) => {
  const fn = r.request().url().split('/rpc/')[1]; let b = {}; try { b = JSON.parse(r.request().postData() || '{}'); } catch { /* ok */ }
  const j = (x) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(x) });
  if (fn === 'aluno_codigo_ok') return j(true);
  if (fn === 'sala_criar') { salas.ABCDE = { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false }; return j('ABCDE'); }
  const s = salas[String(b.p_code || '').toUpperCase()];
  if (fn === 'sala_entrar') { if (!s || s.jogo !== b.p_jogo) return j([]); s.convidado = true; return j([{ ver: s.ver, estado: s.estado }]); }
  if (fn === 'sala_ler') return j(s ? [{ ver: s.ver, convidado: s.convidado, estado: s.ver === b.p_ver ? null : s.estado }] : []);
  if (fn === 'sala_enviar') { if (!s || s.ver !== b.p_ver) return j(0); s.estado = b.p_estado; s.ver++; return j(s.ver); }
  return j([]);
});
const abrir = async (nome, rota) => {
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.addInitScript((n) => { try { localStorage.setItem('beaterista-aluno-nome', n); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } }, nome);
  await p.goto(`${url}/aluno.html#${rota}`); await sleep(2500); return p;
};
const A = await abrir('Ana', '/ritmo/setas');
await A.waitForSelector('.rz-ics', { timeout: 20000 });
const rot = await A.locator('.rz-ics button').evaluateAll((l) => l.map((b) => b.getAttribute('aria-label')));
check('3 ícones: sozinho, contra o Paul e com um amigo (sem texto)', rot.length === 3 && /Paul/.test(rot[1]) && /amigo/i.test(rot[2]) && (await A.locator('.rz-ics').innerText()).trim() === '', rot.join(' | '));
await A.locator('.rz-ics button').nth(2).click(); await sleep(1500);
check('abre a sala por código', /amigo/.test(await A.evaluate(() => location.hash)) && (await A.locator('.jg-lobby').count()) === 1);
await A.locator('.jg-lobby .btn.primary').first().click(); await sleep(1500);
const B = await abrir('Bia', '/ritmo/setas/amigo');
await B.waitForSelector('.jg-code-in', { timeout: 20000 }); await B.locator('.jg-code-in').fill('ABCDE'); await B.locator('.jg-entrar .btn').click(); await sleep(2500);
for (const p of [A, B]) { const pronto = p.locator('button:has-text("estou pronto")'); await pronto.click({ timeout: 8000 }).catch(() => {}); }
await sleep(7000);
for (const [n, p] of [['A', A], ['B', B]]) check(`celular ${n} está tocando as setas`, await p.evaluate(() => document.body.classList.contains('rz-lock') && !!document.querySelector('.rz-setas')));
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
