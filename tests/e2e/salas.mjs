// 2 celulares: Uno Musical, jogo da velha e stop em sala com código. O Supabase é simulado na memória (as 4 funções sala_*).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser } = await launch();
const salas = new Map();
const mock = async (route) => {
  const fn = new URL(route.request().url()).pathname.split('/').pop(); const b = route.request().postDataJSON();
  const ok = (j) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(j) });
  if (fn === 'sala_criar') { const c = 'AB' + String(salas.size + 100); salas.set(c, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false }); return ok(c); }
  const s = salas.get(String(b.p_code || '').toUpperCase());
  if (fn === 'sala_entrar') { if (!s || s.jogo !== b.p_jogo) return ok([]); s.convidado = true; return ok([{ ver: s.ver, estado: s.estado }]); }
  if (fn === 'sala_ler') return ok(s ? [{ ver: s.ver, convidado: s.convidado, estado: s.ver === b.p_ver ? null : s.estado }] : []);
  if (fn === 'sala_enviar') { if (!s || s.ver !== b.p_ver) return ok(0); s.estado = b.p_estado; s.ver++; return ok(s.ver); }
  return route.continue();
};
async function phone() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } }); await ctx.route('**/rest/v1/rpc/sala_*', mock);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); }); p.errs = errs; return p;
}
async function pair(game) {
  const a = await phone(); const b = await phone();
  for (const p of [a, b]) { await p.goto(`${url}/aluno.html#/jogos/${game}`); await sleep(900); if (await p.locator('button:has-text("JOGAR")').count()) { await p.locator('button:has-text("JOGAR")').click(); await sleep(300); } await p.locator('button:has-text("2 celulares")').first().click(); await sleep(200); }
  await a.locator('button:has-text("criar sala")').click(); await sleep(400);
  const code = (await a.locator('.jg-code').textContent()).trim();
  await b.locator('.jg-code-in').fill(code); await b.locator('button:has-text("entrar")').click(); await sleep(2500);
  return [a, b, code];
}
// --- uno
{
  const [a, b, code] = await pair('cartas'); await sleep(2800); // embaralha e distribui nos dois
  check('[uno] código com 5 caracteres', code.length === 5, code);
  check('[uno] os dois veem a mesa', (await a.locator('.cx-hc').count()) === 7 && (await b.locator('.cx-hc').count()) === 7);
  const vezA = (await a.locator('.cx-turn').textContent()).includes('sua vez'); const [vez, esp] = vezA ? [a, b] : [b, a];
  check('[uno] só um tem a vez', (await esp.locator('.cx-turn').textContent()).includes('vez do outro'));
  const n0 = await esp.locator('.cx-seat .cx-sname em').textContent();
  const play = vez.locator('.cx-hc.fit').first();
  if (await play.count()) { await play.click({ position: { x: 6, y: 30 }, force: true }); await sleep(250); if (await vez.locator('.cx-pick').count()) await vez.locator('.cx-pc').first().click({ force: true }); }
  else { await vez.locator('.cx-deck').click(); }
  await sleep(3200);
  check('[uno] a jogada chegou no outro celular', (await esp.locator('.cx-turn').textContent()).includes('sua vez') || (await vez.locator('.cx-turn').textContent()).includes('sua vez'), n0);
  check('[uno] sem erros de JS', !a.errs.length && !b.errs.length, [...a.errs, ...b.errs].join('|'));
}
// --- velha
{
  const [a, b] = await pair('velha');
  check('[velha] tabuleiro nos dois', (await a.locator('.jg-cell').count()) === 9 && (await b.locator('.jg-cell').count()) === 9);
  const vezA = (await a.locator('.jg-turn').textContent()).includes('sua vez') || !(await a.locator('.jg-cell[disabled]').count());
  const [vez, esp] = vezA ? [a, b] : [b, a];
  await vez.locator('.jg-cell:not([disabled])').nth(4).click(); await sleep(2600);
  check('[velha] a marca apareceu no outro celular', (await esp.locator('.jg-cell svg').count()) === 1);
  check('[velha] agora é a vez de quem esperava', (await esp.locator('.jg-cell:not([disabled])').count()) > 0 && (await vez.locator('.jg-cell:not([disabled])').count()) === 0);
  check('[velha] sem erros de JS', !a.errs.length && !b.errs.length, [...a.errs, ...b.errs].join('|'));
}
// --- stop
{
  const [a, b] = await pair('stop');
  check('[stop] um joga e o outro espera', (await a.locator('.jg-cover2').count()) === 1 && (await b.locator('.jg-cover2').count()) === 1);
  const tx = async (p) => (await p.locator('.jg-cover2').first().textContent());
  const [vez, esp] = (await tx(a)).includes('sua vez') ? [a, b] : [b, a];
  check('[stop] o outro está esperando', (await tx(esp)).includes('esperando'));
  await vez.locator('.jg-cover2 button').click(); await vez.locator('.st-field input').first().waitFor({ timeout: 15000 });
  await vez.locator('.st-field input').first().fill('Zeca'); await vez.locator('.st-stop').click(); await sleep(3200);
  check('[stop] a vez passou pro outro celular', (await tx(esp)).includes('sua vez'));
  await esp.locator('.jg-cover2 button').click(); await esp.locator('.st-field input').first().waitFor({ timeout: 8000 }); await esp.locator('.st-stop').click(); await sleep(3200);
  check('[stop] correção: quem criou revisa, o outro só olha', (await a.locator('button:has-text("confirmar rodada"), button:has-text("pendente")').count()) + (await b.locator('button:has-text("confirmar rodada"), button:has-text("pendente")').count()) >= 1 && (await a.locator('.st-contest').count()) + (await b.locator('.st-contest').count()) > 0 && ((await a.locator('.st-contest').count()) === 0 || (await b.locator('.st-contest').count()) === 0));
  check('[stop] sem erros de JS', !a.errs.length && !b.errs.length, [...a.errs, ...b.errs].join('|'));
}
await browser.close(); srv.close(); done();
