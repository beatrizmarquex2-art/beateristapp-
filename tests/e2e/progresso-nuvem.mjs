// Dois aparelhos, o mesmo código: o progresso de um aparece no outro (Supabase simulado com UMA nuvem em memória).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const valid = new Set(['BEA0404']); let nuvem = null; let envios = 0;
const rota = async (ctx) => {
  await ctx.route('**/rest/v1/rpc/*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' })); // o resto: vazio (as rotas abaixo, registradas depois, têm prioridade)
  await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(valid.has(r.request().postDataJSON().p_code)) }));
  await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => { const ok = valid.has(String(r.request().postDataJSON().p_code).toUpperCase()); r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ok ? { ok: true, escopo: null } : { ok: false, motivo: 'codigo' }) }); });
  await ctx.route('**/rest/v1/rpc/prog_ler', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, dados: nuvem }) }));
  await ctx.route('**/rest/v1/rpc/prog_salvar', (r) => { nuvem = r.request().postDataJSON().p_dados; envios++; r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }); });
};
const aparelho = async () => { const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }); await rota(ctx); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(String(e).slice(0, 160))); return p; };
// aparelho A (casa): entra com o código e joga
const A = await aparelho(); await A.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Ana'); localStorage.setItem('beaterista-aluno-codigo', 'BEA0404'); localStorage.setItem('beaterista-aluno-codigo-ok', String(Date.now())); } catch {} });
await A.goto(`${url}/aluno.html#/jogos`); await sleep(2500);
await A.evaluate(async () => { const B = await import('/js/jogos/base.js'); B.setGame('quebra', { best: { '6:sem': 42000 }, img: 'guitarra' }); localStorage.setItem('beaterista-teoria-feitas', JSON.stringify(['figuras:1', 'figuras:2'])); const P = await import('/js/progresso-nuvem.js'); await P.enviar(true); });
await sleep(600);
check('o aparelho de casa mandou o progresso pra nuvem', envios >= 1 && nuvem && nuvem.jogos && nuvem.jogos.quebra && nuvem.jogos.quebra.best['6:sem'] === 42000);
check('a nuvem não leva código, nome nem calibração', !JSON.stringify(nuvem).includes('BEA0404') && !JSON.stringify(nuvem).includes('Ana'));
// aparelho B (escola, outro nome de aluno no aparelho): entra com o mesmo código
const Bp = await aparelho(); await Bp.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Ana'); localStorage.setItem('beaterista-aluno-codigo', 'BEA0404'); localStorage.setItem('beaterista-aluno-codigo-ok', String(Date.now())); localStorage.setItem('beaterista-teoria-feitas', JSON.stringify(['pausas:1'])); } catch {} });
await Bp.goto(`${url}/aluno.html#/jogos`); await sleep(3000);
const r = await Bp.evaluate(async () => { const B = await import('/js/jogos/base.js'); return { quebra: B.getGame('quebra'), feitas: JSON.parse(localStorage.getItem('beaterista-teoria-feitas') || '[]') }; });
check('no outro aparelho aparece o jogo que foi jogado em casa', r.quebra && r.quebra.img === 'guitarra' && r.quebra.best && r.quebra.best['6:sem'] === 42000, JSON.stringify(r.quebra));
check('os estudos feitos dos dois aparelhos se juntam', ['figuras:1', 'figuras:2', 'pausas:1'].every((x) => r.feitas.includes(x)), r.feitas.join(','));
check('o que só existia no aparelho B subiu pra nuvem', nuvem.outros['beaterista-teoria-feitas'].includes('pausas:1'));
check('sem erros de JS', ![...A.errs, ...Bp.errs].length, [...A.errs, ...Bp.errs].join('|'));
await browser.close(); srv.close(); done();
