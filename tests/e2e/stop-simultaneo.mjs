// STOP "ao mesmo tempo" em 2 celulares (duas sessões do navegador) com uma sala falsa na memória (sala_criar/entrar/ler/enviar, com a mesma regra de versão).
// Cobre: início simultâneo (pronto dos dois + contagem), STOP de um parando o outro, corrida (os dois apertam), placar, revanche, pausa, queda de conexão e voltar pra sala no meio da rodada.
// O jogo é montado direto na página (como a tela de jogos faz) pra poder chamar ctl.pause()/ctl.resume().
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const SHOT = process.env.SHOTS;
const { srv, url } = await serve(); const { browser } = await launch();
const salas = new Map(); const errs = []; let enviosBloqueados = false;
const json = (r, v) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(v) });
async function celular(nome) {
  const ctx = await context(browser, { viewport: { width: 390, height: 844 } }); const st = { off: false };
  await ctx.route('**/rest/v1/rpc/sala_*', (r) => {
    if (st.off) return r.abort();
    const fn = new URL(r.request().url()).pathname.split('/').pop(); const b = r.request().postDataJSON() || {};
    if (fn === 'sala_criar') { const c = 'SM' + String(salas.size + 100); salas.set(c, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false }); return json(r, c); }
    const s = salas.get(String(b.p_code || '').toUpperCase());
    if (fn === 'sala_entrar') { if (!s || s.jogo !== b.p_jogo) return json(r, []); s.convidado = true; return json(r, [{ ver: s.ver, estado: s.estado }]); }
    if (fn === 'sala_ler') return json(r, s ? [{ ver: s.ver, convidado: s.convidado, estado: s.ver === b.p_ver ? null : s.estado }] : []);
    if (fn === 'sala_enviar') { if (!s || s.ver !== b.p_ver || enviosBloqueados) return json(r, 0); s.estado = b.p_estado; s.ver += 1; return json(r, s.ver); }
    return json(r, []);
  });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(`${nome}: ${String(e).slice(0, 200)}`)); p.st = st; p.nome = nome;
  await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
  await p.goto(`${url}/aluno.html#/jogos`); await sleep(1500);
  await p.evaluate(async () => {
    const d = document.createElement('div'); d.id = 't'; d.style.cssText = 'position:fixed;inset:0;overflow:auto;background:#FFF5E3;z-index:5;padding:8px'; document.body.append(d);
    const m = await import('/js/jogos/stop.js'); window.__ctl = m.mount(d);
  });
  return p;
}
const A = await celular('A'); const B = await celular('B');
const L = (p, sel) => p.locator(`#t ${sel}`);
const txt = async (p, sel) => (await L(p, sel).first().innerText().catch(() => '')).toLowerCase();
const salaDe = (code) => salas.get(code).estado;

for (const p of [A, B]) { await L(p, 'button:has-text("JOGAR")').click(); await sleep(400); await L(p, 'button[role=radio][aria-label="2 celulares"]').click(); await sleep(300); }
check('[opções] chips "ao mesmo tempo" e "um de cada vez", com ao mesmo tempo marcado', (await L(A, 'button[role=radio]:has-text("ao mesmo tempo")').getAttribute('aria-checked')) === 'true' && (await L(A, 'button[role=radio]:has-text("um de cada vez")').getAttribute('aria-checked')) === 'false');
check('[opções] ao mesmo tempo não mostra "rodadas" e tem os tempos', (await L(A, '.jo-rot:text-is("rodadas")').count()) === 0 && (await L(A, 'button[role=radio]:has-text("30 s")').count()) === 1);
check('[opções] a palavra Kids não aparece', !(await L(A, '*').first().innerText()).toLowerCase().includes('kids'));
await L(A, 'button[role=radio]:has-text("30 s")').click(); await sleep(200);
if (SHOT) await A.screenshot({ path: `${SHOT}/stop-sim-opcoes.png` });
await L(A, 'button:has-text("criar sala")').click(); await sleep(500);
const code = (await L(A, '.jg-code').textContent()).trim(); check('[sala] código de 5 caracteres', code.length === 5, code);
await L(B, '.jg-code-in').fill(code); await L(B, 'button:has-text("entrar")').click(); await sleep(2800);
const e0 = salaDe(code);
check('[sala] estado "ao mesmo tempo" com 30 s, letra e categorias na sala', e0.sim === true && e0.seconds === 30 && !!e0.letter && e0.cats.length >= 5);
check('[sala] os dois veem "estou pronto" e a mesma lista de categorias', (await L(A, 'button:has-text("estou pronto")').count()) === 1 && (await L(B, 'button:has-text("estou pronto")').count()) === 1 && (await L(A, '.ss-cats').innerText()) === (await L(B, '.ss-cats').innerText()));
check('[sala] a letra ainda não aparece antes da contagem', (await L(A, '.st-letter').count()) === 0);
if (SHOT) await A.screenshot({ path: `${SHOT}/stop-sim-sala.png` });

// ---- início simultâneo
await L(A, 'button:has-text("estou pronto")').click(); await sleep(2800);
check('[início] com um pronto só, o outro vê "pronto ✓" e ninguém começa', (await txt(B, '.ss-pl')).includes('pronto ✓') && (await L(A, '.st-count').count()) === 0 && (await L(B, '.st-field').count()) === 0);
await L(B, 'button:has-text("estou pronto")').click();
await Promise.all([A, B].map((p) => L(p, '.st-count').waitFor({ timeout: 8000 })));
check('[início] a contagem 3-2-1 começa nos dois celulares', true);
await Promise.all([A, B].map((p) => L(p, '.st-field input').first().waitFor({ timeout: 15000 })));
const letA = (await L(A, '.st-letter').innerText()).trim(); const letB = (await L(B, '.st-letter').innerText()).trim();
check('[início] mesma letra e mesmas categorias nos dois, valendo ao mesmo tempo', letA === letB && letA === e0.letter && (await L(A, '.st-field').count()) === e0.cats.length && (await L(B, '.st-field').count()) === e0.cats.length, `${letA}/${letB}`);
if (SHOT) await B.screenshot({ path: `${SHOT}/stop-sim-jogando.png` });

// ---- digitar, guardar no aparelho e continuar depois de reabrir
const palavra = async (p) => p.evaluate(async ([l, cat]) => { const V = await import('/js/jogos/stop-valid.js'); const T = await import('/js/jogos/stop-bank-teoria.js'); const C = await import('/js/jogos/stop-bank-cultura.js'); const lines = { ...T.LINES, ...C.LINES }[cat] || []; const x = lines.find((q) => V.initialOf(q.split('|')[0]) === l); return x ? x.split('|')[0] : ''; }, [e0.letter, e0.cats[0]]);
const certa = await palavra(A);
await L(A, '.st-field input').nth(0).fill(certa || `${letA}ola`); await L(B, '.st-field input').nth(1).fill(`${letA}qwerty`); await sleep(500);
const guardado = await B.evaluate(() => Object.entries(localStorage).filter(([k]) => k.startsWith('stop-sim-SM')).map(([, v]) => JSON.parse(v)));
check('[voltar] as respostas ficam guardadas só no aparelho (por sala e rodada), não na sala', guardado.length === 1 && guardado[0].answers[1] === `${letA}qwerty` && !JSON.stringify(salaDe(code)).includes('qwerty'));
// B "fecha o app" e volta (recarrega a página e reabre na sala): continua a rodada sem perder o que digitou nem o tempo
const resto0 = await txt(B, '.st-time');
await B.reload(); await sleep(1500);
const voltou = await B.evaluate(async (c) => {
  const d = document.createElement('div'); d.id = 't'; d.style.cssText = 'position:fixed;inset:0;overflow:auto;background:#FFF5E3;z-index:5;padding:8px'; document.body.append(d);
  const { reenter, linkBadge } = await import('/js/jogos/online.js'); const { montarSimultaneo } = await import('/js/jogos/stop-simultaneo.js');
  const r = await reenter(c, 1); if (!r) return false; window.__sim = montarSimultaneo({ root: d, conn: r.conn, estado: r.estado, badge: linkBadge(), sair() {} }); return true;
}, code);
await sleep(800);
check('[voltar] reabrir no meio da rodada continua nela (sem nova contagem), com o texto de volta', voltou && (await L(B, '.st-count').count()) === 0 && (await L(B, '.st-field input').nth(1).inputValue()) === `${letA}qwerty`);
const restoDepois = await txt(B, '.st-time'); const sec = (s) => { const [m, x] = s.split(':').map(Number); return m * 60 + x; };
check('[voltar] o relógio continua de onde estava (não recomeça)', sec(restoDepois) <= sec(resto0) && sec(restoDepois) >= sec(resto0) - 6, `${resto0} -> ${restoDepois}`);

// ---- pausa só deste celular
await A.evaluate(() => window.__ctl.pause()); await sleep(1800);
check('[pausa] pausar esconde os campos e mostra "pausado"', (await L(A, '.ss-pausa').isVisible()) && !(await L(A, '.st-field input').first().isVisible()));
const t1 = await txt(A, '.st-time'); await sleep(2200); const t2 = await txt(A, '.st-time');
check('[pausa] o relógio daquele celular parou', t1 === t2, `${t1} ${t2}`);
check('[pausa] o outro vê "o outro pausou" e continua jogando (campos livres)', (await txt(B, '.ss-aviso')).includes('o outro pausou') && (await L(B, '.st-field input').first().isEnabled()) && !(await L(B, '.st-field input').first().evaluate((i) => i.readOnly)));
await A.evaluate(() => window.__ctl.resume()); await sleep(1800);
const t3 = await txt(A, '.st-time'); await sleep(1500); const t4 = await txt(A, '.st-time');
check('[pausa] continuar retoma de onde parou', sec(t3) <= sec(t2) && sec(t3) >= sec(t2) - 3 && sec(t4) < sec(t3) + 1 && (await L(A, '.st-field input').first().isVisible()), `${t2} ${t3} ${t4}`);
check('[pausa] o aviso do outro some', (await txt(B, '.ss-aviso')) === '');
const valA = await L(A, '.st-field input').nth(0).inputValue(); check('[pausa] as respostas continuam lá', valA === (certa || `${letA}ola`));

// ---- STOP de um para o outro
await L(A, '.st-stop').click();
const viu = await B.waitForFunction(() => { const a = document.querySelector('#t .ss-aviso'); const i = document.querySelector('#t .st-field input'); return a && /o outro apertou stop/i.test(a.textContent) && i && i.readOnly; }, null, { timeout: 4000 }).then(() => true, () => false);
check('[stop] o outro celular vê "o outro apertou STOP!" e os campos travam na hora', viu);
await sleep(2000);
const eS = salaDe(code);
check('[stop] a sala guarda quem apertou primeiro (A = 0) e as respostas dos dois', eS.stop && eS.stop.por === 0 && !!eS.res[0] && !!eS.res[1] && eS.res[1].motivo === 'stop-outro' && eS.res[1].answers[1] === `${letA}qwerty`);
await sleep(1500);
check('[placar] os dois veem o resultado com os pontos', (await L(A, '.ss-pl').count()) === 1 && (await L(B, '.ss-pl').count()) === 1);
const ptsA = (await L(A, '.ss-j b').allInnerTexts()).map((s) => s.trim()); const ptsB = (await L(B, '.ss-j b').allInnerTexts()).map((s) => s.trim());
check('[placar] mesmos pontos nos dois (cada um vê o seu primeiro)', ptsA[0] === ptsB[1] && ptsA[1] === ptsB[0], `${ptsA} / ${ptsB}`);
check('[placar] diz quem apertou STOP', (await txt(A, '.ss-quem')).includes('você apertou stop') && (await txt(B, '.ss-quem')).includes('o outro apertou stop'));
check('[placar] resposta que o jogo não conhece fica aguardando revisão (quem criou revisa, o outro só olha)', (await L(B, '.st-ans[data-st="pendente"]').count()) >= 1 && (await L(A, '.st-contest').count()) >= 1 && (await L(B, '.st-contest').count()) === 0);
// quem criou aprova a resposta do outro: vale nos dois celulares
await L(A, '.st-ans[data-st="pendente"] .st-contest').first().click(); await sleep(400);
await A.locator('.sheet-body button:has-text("aprovar")').click(); await sleep(3000);
const pa = (await L(A, '.ss-j b').allInnerTexts()).map((s) => s.trim()); const pb = (await L(B, '.ss-j b').allInnerTexts()).map((s) => s.trim());
check('[placar] a decisão de quem criou chega no outro e muda os pontos dos dois', pa[0] === pb[1] && pa[1] === pb[0] && pa.join() !== ptsA.join(), `${ptsA} -> ${pa} / ${pb}`);
if (SHOT) { await A.screenshot({ path: `${SHOT}/stop-sim-placar-a.png` }); await B.screenshot({ path: `${SHOT}/stop-sim-placar-b.png` }); }

// ---- revanche
await L(B, 'button:has-text("revanche")').click(); await sleep(3000);
const e2 = salaDe(code);
check('[revanche] nova rodada na sala (2), letra nova, tudo zerado, quem pediu já está pronto', e2.round === 2 && e2.res[0] === null && e2.res[1] === null && e2.stop === null && e2.ready[1] === true && e2.ready[0] === false && e2.wins[0] + e2.wins[1] + e2.empates === 1);
check('[revanche] o outro vê o pronto e o placar de vitórias', (await L(A, 'button:has-text("estou pronto")').count()) === 1 && (await txt(A, '.ss-wins')).includes('vitórias'));
await L(A, 'button:has-text("estou pronto")').click();
await Promise.all([A, B].map((p) => L(p, '.st-field input').first().waitFor({ timeout: 15000 })));
check('[revanche] começa de novo nos dois, campos vazios', (await L(A, '.st-field input').first().inputValue()) === '' && (await L(B, '.st-field input').first().inputValue()) === '' && (await L(A, '.st-letter').innerText()).trim() === e2.letter);

// ---- corrida: os dois apertam STOP quase juntos
await L(A, '.st-field input').nth(2).fill('Zeca'); await L(B, '.st-field input').nth(2).fill('Mara');
await Promise.all([L(A, '.st-stop').click(), L(B, '.st-stop').click()]); await sleep(5000);
const eC = salaDe(code);
check('[corrida] só um STOP vale (o primeiro que chegou) e os dois mandaram as respostas', !!eC.stop && (eC.stop.por === 0 || eC.stop.por === 1) && !!eC.res[0] && !!eC.res[1] && eC.res[0].answers[2] === 'Zeca' && eC.res[1].answers[2] === 'Mara');
const qa = await txt(A, '.ss-quem'); const qb = await txt(B, '.ss-quem');
check('[corrida] um respondeu como "stop" e o outro aceitou o STOP dele', [eC.res[0].motivo, eC.res[1].motivo].sort().join() === 'stop,stop-outro', `${eC.res[0].motivo},${eC.res[1].motivo}`);
check('[corrida] os dois concordam em quem apertou primeiro', (qa.includes('você') && qb.includes('o outro')) || (qa.includes('o outro') && qb.includes('você')), `${qa} / ${qb}`);
check('[corrida] os dois acabam no resultado com o mesmo placar', (await L(A, '.ss-pl').count()) === 1 && (await L(B, '.ss-pl').count()) === 1 && (await L(A, '.ss-j b').first().innerText()) === (await L(B, '.ss-j b').nth(1).innerText()));

// ---- queda de conexão: B fica sem internet, A aperta STOP; quando B volta, para também e manda as respostas
await L(A, 'button:has-text("revanche")').click(); await sleep(2500); await L(B, 'button:has-text("estou pronto")').click();
await Promise.all([A, B].map((p) => L(p, '.st-field input').first().waitFor({ timeout: 15000 })));
await L(B, '.st-field input').nth(0).fill('Bia'); B.st.off = true; await sleep(2800);
check('[queda] B mostra "sem conexão" mas continua jogando', (await txt(B, '.jg-link-badge')).includes('sem conexão') && (await L(B, '.st-field input').first().isEnabled()));
await L(A, '.st-stop').click(); await sleep(3000);
check('[queda] sem rede, B não é parado ainda (continua com campos livres)', !(await L(B, '.st-field input').first().evaluate((i) => i.readOnly)));
B.st.off = false; await sleep(4500);
const eQ = salaDe(code);
check('[queda] quando a internet volta, B para e as respostas dele chegam à sala', (await L(B, '.st-field input').count()) === 0 && !!eQ.res[1] && eQ.res[1].answers[0] === 'Bia' && eQ.stop.por === 0);
check('[queda] a conexão volta a ficar "2 celulares"', (await txt(B, '.jg-link-badge')).includes('2 celulares') && !(await txt(B, '.jg-link-badge')).includes('sem conexão'));

// ---- fim por tempo é local: sem STOP, cada um termina no seu relógio
await L(A, 'button:has-text("revanche")').click(); await sleep(2500); await L(B, 'button:has-text("estou pronto")').click();
await Promise.all([A, B].map((p) => L(p, '.st-field input').first().waitFor({ timeout: 15000 })));
await L(A, '.st-field input').nth(0).fill('Ana'); await L(B, '.st-field input').nth(1).fill('Caio');
await Promise.all([A, B].map((p) => p.waitForFunction(() => document.querySelector('#t .ss-pl .ss-j b') && !document.querySelector('#t .st-field'), null, { timeout: 45000 })));
const eT = salaDe(code);
check('[tempo] sem STOP, os dois terminam pelo tempo e a sala não tem STOP', eT.stop === null && eT.res[0].motivo === 'tempo' && eT.res[1].motivo === 'tempo' && (await txt(A, '.ss-quem')).includes('acabou o tempo'));
check('[sem erros de JS]', !errs.length, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
