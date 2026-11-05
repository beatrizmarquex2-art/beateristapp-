// Só a Bea adiciona fotos: na área dos alunos o seletor de fotos nunca abre e nenhuma tela tem botão de adicionar/trocar foto.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => localStorage.setItem('beaterista-aluno-nome', 'Teste'));
await page.goto(url + '/aluno.html#/jogos'); await sleep(1200);
const r = await page.evaluate(async () => { const m = await import('/js/views/mural.js'); const out = await m.pickImages(true); return { out, inputs: document.querySelectorAll('input[type=file]').length }; });
check('aluno: pickImages não abre seletor e devolve vazio', r.out.length === 0 && r.inputs === 0, JSON.stringify(r));
const ROUTES = ['#/jogos', '#/jogos/quebra', '#/jogos/quebra/livre', '#/jogos/velha/livre', '#/kids', '#/kids/album', '#/kids/figuras', '#/kids/memoria/livre', '#/ritmo', '#/beatlab', '#/tocar', '#/ranking'];
let bad = [];
for (const h of ROUTES) { await page.goto(url + '/aluno.html' + h); await sleep(900); const x = await page.evaluate(() => ({ files: document.querySelectorAll('input[type=file]').length, txt: [...document.querySelectorAll('button, a, label')].filter((e) => /trocar foto|adicionar foto|enviar foto|escolher foto|subir (a )?foto|nova foto/i.test(e.textContent || e.getAttribute('aria-label') || '')).length })); if (x.files || x.txt) bad.push(`${h}: ${JSON.stringify(x)}`); }
check('aluno: nenhuma tela tem seletor de arquivo nem botão de adicionar/trocar foto', !bad.length, bad.join(' | '));
check('sem erros de JS', errs.length === 0, errs.join(' | '));
const fails = done(); await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
