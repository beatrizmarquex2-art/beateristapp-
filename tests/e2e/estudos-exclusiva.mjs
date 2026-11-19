// Estudos: terminar o tema inteiro (quiz 3 de 3 em todas as fases) dá 1 figurinha exclusiva (da Bea ou do Paul), uma vez só.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: true });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Bea'); localStorage.setItem('bt-mute', '1'); } catch {} });
await p.goto(`${url}/aluno.html#/jogos`); await sleep(2500);
const info = await p.evaluate(async () => { const T = await import('/js/kids/teoria.js'); const s = T.sessaoPorId('figuras'); const fs = s.fases || [s]; const f = {}; fs.slice(0, -1).forEach((_, k) => { f[k ? `figuras:${k}` : 'figuras'] = 3; }); localStorage.setItem('beaterista-teoria-feitas', JSON.stringify(f)); return { fases: fs.length }; });
check('o tema tem várias fases', info.fases > 1, String(info.fases));
await p.goto(`${url}/aluno.html#/estudos/basica/figuras`); await sleep(2500);
// vai pra última fase, vira os cartões, faz o quiz acertando tudo
await p.locator('.tf-fase').last().click(); await sleep(600);
for (const b of await p.locator('.tf-cards button').all()) { await b.click(); await sleep(250); }
await p.evaluate(() => document.querySelector('button.tf-vez').click()); await sleep(600);
for (let i = 0; i < 3; i++) {
  const certo = await p.evaluate(async () => { const T = await import('/js/kids/teoria.js'); const s = T.sessaoPorId('figuras'); const fs = s.fases || [s]; const f = fs[fs.length - 1]; const q = document.querySelector('.tf-q').textContent; const it = (f.quiz || []).find((x) => x.q === q); return it ? it.ops[it.ok] : null; });
  const alvo = certo ? p.locator('.qz-op').filter({ hasText: new RegExp(`^${certo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).first() : p.locator('.qz-op').first(); await alvo.click({ force: true }); await sleep(1300);
}
await sleep(1500);
const ganhou = await p.locator('.tf-exclusiva').count(); if (process.env.PRINT) await p.screenshot({ path: process.env.PRINT });
const pacote = await p.evaluate(async () => { const D = await import('/js/figurinhas/dono.js'); return (D.albumDados().granted || []).filter((x) => x.startsWith('estudo:')); });
check('ao terminar o tema: aviso da figurinha exclusiva', ganhou === 1);
check('o pacote estudo:figuras foi entregue (1 só)', pacote.length === 1 && pacote[0] === 'estudo:figuras', JSON.stringify(pacote));
// refazer o quiz não entrega outra
await p.evaluate(async () => { const R = await import('/js/figurinhas/rewards.js'); await R.grantPacks(['estudo:figuras']); });
const de = await p.evaluate(async () => { const D = await import('/js/figurinhas/dono.js'); return (D.albumDados().granted || []).filter((x) => x.startsWith('estudo:')).length; });
check('de novo não entrega outra', de === 1);
check('sem erros', errs.length === 0, errs.join(' ; '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
