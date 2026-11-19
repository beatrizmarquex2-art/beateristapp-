// A foto de perfil e as figurinhas coladas vão com o aluno pra outro celular (mesmo código; nuvem simulada em memória).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch({ codigo: false });
let nuvem = null; let album = null; let envios = 0;
const rota = async (ctx) => {
  await ctx.route('**/rest/v1/rpc/*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
  await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, escopo: null }) }));
  await ctx.route('**/rest/v1/rpc/prog_ler', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, dados: nuvem }) }));
  await ctx.route('**/rest/v1/rpc/prog_salvar', (r) => { nuvem = r.request().postDataJSON().p_dados; envios++; r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }); });
  await ctx.route('**/rest/v1/rpc/fig_entrar', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, nome: 'Ana', estado: album }) }));
  await ctx.route('**/rest/v1/rpc/fig_salvar', (r) => { album = r.request().postDataJSON().p_estado; r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }); });
};
const aparelho = async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' }); await rota(ctx);
  await ctx.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Ana'); localStorage.setItem('beaterista-aluno-codigo', 'BEA0404'); localStorage.setItem('beaterista-aluno-codigo-ok', String(Date.now())); localStorage.setItem('bt-inicio', '1'); localStorage.setItem('bt-mute', '1'); } catch {} });
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(String(e).slice(0, 160))); return p;
};
const A = await aparelho();
await A.goto(`${url}/aluno.html#/jogos`); await sleep(2500);
// A: põe uma foto (um quadrado vermelho de 800 px vira miniatura) e cola 2 figurinhas
await A.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 800; c.height = 600; const x = c.getContext('2d'); x.fillStyle = '#c81e2d'; x.fillRect(0, 0, 800, 600); x.fillStyle = '#fff'; x.fillRect(300, 200, 200, 200);
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.9)); const D = await import('/js/figurinhas/dono.js'); await D.metaGravar('perfil-foto', blob); const F = await import('/js/foto-perfil-nuvem.js'); await F.guardou(blob);
  const S = await import('/js/store.js'); const L = await import('/js/figurinhas/album-logic.js'); const cat = await (await fetch('assets/figurinhas/catalogo.json')).json(); const cods = cat.filter((k) => k.secao !== 'Beaterista').slice(0, 2).map((k) => k.codigo);
  const st = { ...L.emptyState(), pasted: Object.fromEntries(cods.map((k) => [k, true])) }; await S.upsert('figurinhas', D.albumId(), st); window.__cods = cods; const AC = await import('/js/figurinhas/acesso.js'); await AC.salvar('BEA0404', st);
});
await sleep(2000);
const f = nuvem && nuvem.outros && nuvem.outros['beaterista-foto-perfil'];
check('a miniatura da foto subiu pra nuvem', !!f && f.d.startsWith('data:image/jpeg') && f.d.length < 60000, f ? `${Math.round(f.d.length / 1024)} KB` : 'nada');
check('as figurinhas coladas subiram (nuvem do álbum)', !!album && Object.keys(album.pasted || {}).length === 2);
// B: outro celular, mesmo código, vazio
const B = await aparelho();
await B.goto(`${url}/aluno.html#/inicio`); await sleep(4000);
const temFoto = await B.evaluate(async () => { const D = await import('/js/figurinhas/dono.js'); const b = await D.metaLer('perfil-foto'); return b ? b.size : 0; });
check('B recebeu a foto de perfil', temFoto > 500, `${temFoto} bytes`);
const topo = await B.evaluate(() => { const i = document.querySelector('.top-av img'); return i ? i.src.slice(0, 5) : ''; });
check('B mostra a foto no topo', topo === 'blob:' || topo === 'data:', topo);
const cods = await B.evaluate(async () => { const D = await import('/js/figurinhas/dono.js'); return Object.keys((D.albumDados().pasted) || {}).length; });
check('B recebeu as 2 figurinhas coladas (sem abrir o Álbum)', cods === 2, String(cods));
// B tira a foto: A recebe depois
await B.evaluate(async () => { const D = await import('/js/figurinhas/dono.js'); await D.metaApagar('perfil-foto'); const F = await import('/js/foto-perfil-nuvem.js'); await F.guardou(null); }); await sleep(1500);
check('foto removida também vai pra nuvem', nuvem.outros['beaterista-foto-perfil'].d === '');
check('sem erros', A.errs.length + B.errs.length === 0, [...A.errs, ...B.errs].join(' ; '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
