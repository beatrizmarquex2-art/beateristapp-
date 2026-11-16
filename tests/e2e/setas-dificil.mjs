// Setinhas (Beat Hero das setas) em modo duelo: no difícil entram setas da bateria (bumbo/caixa) na vez do jogador; fácil e médio ficam só com a melodia.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: true });
await ctx.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().url().includes('aluno_codigo_ok') ? 'true' : '[]' }));
const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 900 }); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'T'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await p.goto(`${url}/aluno.html#/ritmo`); await sleep(3000);
const r = await p.evaluate(() => { const out = {}; for (const diff of ['facil', 'medio', 'dificil']) { window.BeaterRhythm._cfg({ diff, duel: true }); let mel = 0, bat = 0, quase = 0; for (const st of ['rock', 'pop', 'reggaeton', 'blues', 'lofi']) for (const tier of [0, 1, 2]) { const c = window.BeaterRhythm._build(st, tier, 'setas', 60); const ch = c.chart.filter((n) => !n.cpu); ch.forEach((n) => { if (n.snd) bat++; else mel++; }); const s = c.A.st; for (let i = 1; i < ch.length; i++) if (ch[i].lane === ch[i - 1].lane && ch[i].t - ch[i - 1].t < s * 1.9) quase++; } out[diff] = { mel, bat, quase }; } return out; });
check('setinhas fácil e médio: só melodia, nenhuma seta de bateria', r.facil.bat === 0 && r.medio.bat === 0, JSON.stringify(r));
check('setinhas difícil: entram setas de bateria', r.dificil.bat > 0, JSON.stringify(r));
check('setinhas difícil: sem setas coladas na mesma tecla', r.dificil.quase <= r.medio.quase + 2, JSON.stringify(r));
check('sem erro de página', errs.length === 0, errs.join('|')); await browser.close(); srv.close(); done();
