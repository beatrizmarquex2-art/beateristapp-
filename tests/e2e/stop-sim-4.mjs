// STOP "ao mesmo tempo" em 4 celulares (sessões do navegador) com a sala falsa na memória (sala_* antigas e as novas sala_*_n).
// Cobre: criar sala de 4 com nomes, esperar todos, pronto de todos + contagem, STOP de um parando os outros, placar com os 4 nomes,
// só quem criou a sala aprova/rejeita as respostas (e vale pra todos), revanche, e sala cheia.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const salas = new Map(); const errs = [];
const json = (r, v, st = 200) => r.fulfill({ status: st, contentType: 'application/json', body: JSON.stringify(v) });
async function celular(nome) {
  const ctx = await context(browser, { viewport: { width: 390, height: 844 } });
  await ctx.route('**/rest/v1/rpc/sala_*', (r) => {
    const fn = new URL(r.request().url()).pathname.split('/').pop(); const b = r.request().postDataJSON() || {};
    if (fn === 'sala_criar_n') { const c = 'S4' + String(salas.size + 100); salas.set(c, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, max: b.p_max, nomes: [b.p_nome] }); return json(r, c); }
    const s = salas.get(String(b.p_code || '').toUpperCase());
    if (fn === 'sala_entrar_n') { if (!s || s.jogo !== b.p_jogo) return json(r, []); if (s.nomes.length >= s.max) return json(r, { message: 'cheia' }, 400); s.nomes.push(b.p_nome || 'jogador'); return json(r, [{ lugar: s.nomes.length - 1, ver: s.ver, estado: s.estado, max_jogadores: s.max, nomes: s.nomes }]); }
    if (fn === 'sala_ler_n') return json(r, s ? [{ ver: s.ver, max_jogadores: s.max, nomes: s.nomes, estado: s.ver === b.p_ver ? null : s.estado }] : []);
    if (fn === 'sala_ler') return json(r, s ? [{ ver: s.ver, convidado: true, estado: s.ver === b.p_ver ? null : s.estado }] : []);
    if (fn === 'sala_enviar') { if (!s || s.ver !== b.p_ver) return json(r, 0); s.estado = b.p_estado; s.ver += 1; return json(r, s.ver); }
    return json(r, []);
  });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(`${nome}: ${String(e).slice(0, 200)}`)); p.nome = nome;
  await p.addInitScript((n) => { try { localStorage.setItem('beaterista-aluno-nome', n); localStorage.setItem('beaterista-nome-sala', n); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } }, nome);
  await p.goto(`${url}/aluno.html#/jogos`); await sleep(1500);
  await p.evaluate(async () => { const d = document.createElement('div'); d.id = 't'; d.style.cssText = 'position:fixed;inset:0;overflow:auto;background:#FFF5E3;z-index:5;padding:8px'; document.body.append(d); const m = await import('/js/jogos/stop.js'); window.__ctl = m.mount(d); });
  return p;
}
const nomes = ['Ana', 'Bia', 'Cris', 'Duda']; const ph = []; for (const n of nomes) ph.push(await celular(n));
const [A, B, C, D] = ph; const L = (p, sel) => p.locator(`#t ${sel}`);
const txt = async (p, sel) => (await (sel === '#t' ? p.locator('#t') : L(p, sel)).first().innerText().catch(() => '')).toLowerCase();
for (const p of ph) { await L(p, 'button:has-text("JOGAR")').click(); await sleep(400); await L(p, 'button[role=radio][aria-label="2 a 4 celulares"]').click(); await sleep(300); }
check('o modo online diz "2 a 4 celulares" e "ao mesmo tempo" vem marcado', (await L(A, 'button[role=radio]:has-text("ao mesmo tempo")').getAttribute('aria-checked')) === 'true');
await L(A, 'button[role=radio][aria-label="4 jogadores"]').click(); await sleep(200);
await L(A, 'button:has-text("criar sala")').click(); await sleep(700);
const code = (await L(A, '.jg-code').textContent()).trim(); check('sala de 4 criada: código e "1 de 4 entraram"', code.length === 5 && /1 de 4 entraram/.test(await txt(A, '.jg-lobby')), code);
for (const p of [B, C, D]) { await L(p, '.jg-code-in').fill(code); await L(p, 'button:has-text("entrar")').click(); await sleep(1700); }
const E = await celular('Eva'); await L(E, 'button:has-text("JOGAR")').click(); await sleep(400); await L(E, 'button[role=radio][aria-label="2 a 4 celulares"]').click(); await sleep(300);
await L(E, '.jg-code-in').fill(code); await L(E, 'button:has-text("entrar")').click(); await sleep(1500);
check('sala cheia: o quinto vê "já está cheia"', /já está cheia/.test(await txt(E, '.jg-lobby')));
await Promise.all(ph.map((p) => L(p, 'button:has-text("estou pronto")').waitFor({ timeout: 15000 })));
const e0 = salas.get(code).estado;
check('estado "ao mesmo tempo" com n = 4 e os 4 nomes', e0.sim === true && e0.n === 4 && e0.ready.length === 4 && e0.res.length === 4 && e0.wins.length === 4 && JSON.stringify(e0.nomes) === JSON.stringify(nomes), JSON.stringify(e0.nomes));
check('os 4 veem a lista dos 4 jogadores na sala', (await Promise.all(ph.map((p) => L(p, '.ss-pl .ss-j').count()))).every((n) => n === 4));
for (const p of [A, B, C]) { await L(p, 'button:has-text("estou pronto")').click(); await sleep(400); }
await sleep(3000);
check('com 3 de 4 prontos ninguém começa (sem contagem)', (await Promise.all(ph.map((p) => L(p, '.st-count').count()))).every((n) => n === 0) && /esperando os outros/.test(await txt(A, '.jg-p')));
await L(D, 'button:has-text("estou pronto")').click();
await Promise.all(ph.map((p) => L(p, '.st-count').waitFor({ timeout: 10000 })));
check('com todos prontos a contagem 3-2-1 começa nos 4', true);
await Promise.all(ph.map((p) => L(p, '.st-field input').first().waitFor({ timeout: 15000 })));
const letras = await Promise.all(ph.map(async (p) => (await L(p, '.st-letter').innerText()).trim()));
check('mesma letra nos 4 celulares', new Set(letras).size === 1 && letras[0] === e0.letter, letras.join(','));
for (const p of ph) { await L(p, '.st-field input').first().fill(`zz${p.nome}`); }
await sleep(500);
await L(D, '.st-stop').click(); await sleep(3500);
await Promise.all(ph.map((p) => L(p, '.st-final').waitFor({ timeout: 20000 })));
check('Duda apertou STOP: os outros 3 também pararam (o placar diz quem parou)', (await Promise.all([A, B, C].map(async (p) => (await txt(p, '#t')).includes('duda apertou stop primeiro')))).every(Boolean));
check('placar com os 4 nomes nos 4 celulares', (await Promise.all(ph.map(async (p) => { const t = await txt(p, '.st-final'); return nomes.filter((n) => n !== p.nome).every((n) => t.includes(n.toLowerCase())) && t.includes('você'); }))).every(Boolean));
check('só quem criou (Ana) vê "contestar resposta"; os outros não', (await L(A, '.st-contest').count()) > 0 && (await Promise.all([B, C, D].map((p) => L(p, '.st-contest').count()))).every((n) => n === 0));
check('os outros leem que Ana (quem criou a sala) aprova ou rejeita', /ana, que criou a sala, aprova ou rejeita/.test(await txt(B, '#t')));
await L(A, '.st-card').first().locator('.st-ans').filter({ hasText: 'zzbia' }).locator('.st-contest').click(); await sleep(500);
await A.locator('.sheet-body button:has-text("aprovar")').click(); await sleep(3500);
check('depois de aprovar, os 4 veem a resposta do Bia valendo ponto', (await Promise.all(ph.map((p) => L(p, '.st-ans[data-pt="10"]').count()))).every((n) => n === 1));
await L(A, 'button:has-text("revanche")').click(); await sleep(3500);
check('revanche: nova rodada na sala (round 2) e volta pro "estou pronto"', salas.get(code).estado.round === 2 && (await Promise.all(ph.map((p) => L(p, 'button:has-text("estou pronto")').count()))).filter((n) => n === 1).length >= 3);
check('sem erro de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
