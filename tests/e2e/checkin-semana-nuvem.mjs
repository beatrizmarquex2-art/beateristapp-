// Check-in da semana (Stars): entrar em dias seguidos soma (1, 2, 3...), mesmo com a nuvem do álbum ligada (a junção com a nuvem zerava o contador todo dia).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch({ codigo: false });
let nuvem = null;
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' });
await ctx.route('**/rest/v1/rpc/*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, escopo: null }) }));
await ctx.route('**/rest/v1/rpc/fig_entrar', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, nome: 'Bea', estado: nuvem }) }));
await ctx.route('**/rest/v1/rpc/fig_salvar', (r) => { nuvem = r.request().postDataJSON().p_estado; r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }); });
await ctx.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Bea'); localStorage.setItem('beaterista-aluno-codigo', 'BEA0404'); localStorage.setItem('beaterista-aluno-codigo-ok', String(Date.now())); localStorage.setItem('bt-mute', '1'); } catch {} });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
const dia = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
// ontem ela estava no dia 2 (a nuvem do álbum ainda não tem o check-in: foi o caso que zerava)
await p.goto(`${url}/aluno.html#/jogos`); await sleep(2500);
await p.evaluate(async (ontem) => { const D = await import('/js/figurinhas/dono.js'); const S = await import('/js/store.js'); const L = await import('/js/figurinhas/album-logic.js'); await S.upsert('figurinhas', D.albumId(), { ...L.emptyState(), sem: { ult: ontem, seq: 2, ciclo: 0 } }); }, dia(1));
nuvem = { v: 1, inv: {}, pasted: {}, granted: [], opened: {}, reduzir: false };
await p.goto(`${url}/aluno.html#/album/Pacotes`); await sleep(4000);
const sem = await p.evaluate(async () => { const D = await import('/js/figurinhas/dono.js'); return D.albumDados().sem; });
check('hoje soma: dia 3 (e não volta pro 1)', sem && sem.seq === 3 && sem.ult === dia(0), JSON.stringify(sem));
check('o check-in também foi pra nuvem', nuvem && nuvem.sem && nuvem.sem.seq === 3, JSON.stringify(nuvem && nuvem.sem));
await p.goto(`${url}/aluno.html#/jogos`); await sleep(1500); await p.goto(`${url}/aluno.html#/album/Pacotes`); await sleep(3500);
const sem2 = await p.evaluate(async () => { const D = await import('/js/figurinhas/dono.js'); return D.albumDados().sem; });
check('abrir de novo no mesmo dia não muda', sem2 && sem2.seq === 3, JSON.stringify(sem2));
check('sem erros', errs.length === 0, errs.join(' ; '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
