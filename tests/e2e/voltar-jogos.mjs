import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: true });
await ctx.route('**/*.supabase.co/**', (r) => r.fallback());
const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 844 }); const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,150)));
await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch {} });
const R=['jogos/velha','jogos/cartas','jogos/stop','jogos/memart','jogos/quebra','jogos/cara','jogos/bingo','dicas/caca','kids/ritmo','paulta','jogos/toca','ritmo'];
for (const r of R){ await p.goto(`${url}/aluno.html#/${r}`); await sleep(1800); const v=await p.evaluate(()=>{const b=document.getElementById('voltar-jogos'); if(!b) return 'nao existe'; const r=b.getBoundingClientRect(); return getComputedStyle(b).display!=='none' && r.bottom<=innerHeight && r.width>0 ? 'visivel' : 'escondido'}); console.log(r, v); }
await p.goto(`${url}/aluno.html#/jogos/velha`); await sleep(1500); await p.screenshot({path:'/tmp/voltar-jogos.png'});
await p.click('#voltar-jogos'); await sleep(800); check('volta pra lista de jogos', (await p.evaluate(()=>location.hash))==='#/jogos'); check('botão some na lista', !(await p.locator('#voltar-jogos').isVisible()));
check('sem erros', errs.length===0, errs.join('|')); await browser.close(); srv.close(); done();
