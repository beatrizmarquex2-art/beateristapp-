// Mundos de ouvido e escalas: aulinha, mapa com 12 fases em 2 níveis, fases dos 4 jogos, escalas coloridas e fileiras que arrastam.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch();
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
const base = () => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); } catch (e) {} };
await page.addInitScript(base);
const shot = (n) => page.screenshot({ path: `${process.env.SHOTS || '/tmp'}/ouvido-${n}.png` });
const espera = (fn, ms = 15000) => page.waitForFunction(fn, null, { timeout: ms });
const nodes = () => page.locator('.mp-node').count();
const abreFase = async (n) => { await page.evaluate((p) => { const el = document.querySelector(`.mp-node[data-pos="${p}"]`); el.scrollIntoView({ block: 'center' }); el.click(); }, n - 1); await sleep(400); };
const mapa = () => page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('mapa')).click());

check('os jogos novos ficam escondidos dos alunos (só no app da Bea por enquanto)', await (async () => { await page.goto(url + '/aluno.html#/jogos'); await sleep(1500); return page.evaluate(() => ['terca', 'acorde-ouvido', 'maior-menor', 'escala', 'aula-ouvido'].every((id) => !document.querySelector(`a.jg-card[href="#/jogos/${id}"]`))); })());

/* aulinha: abre sozinha na 1ª vez, em qualquer um dos jogos */
await page.goto(url + '/aluno.html#/jogos/terca'); await sleep(1500);
check('1ª vez: abre a aulinha do Paul antes do mapa', await page.evaluate(() => !!document.querySelector('.vv-aula') && /aulinha/i.test(document.body.textContent)));
await shot('aula-1');
let passos = 0; while (await page.evaluate(() => [...document.querySelectorAll('.au-nav button')].some((b) => b.textContent.includes('próximo')))) { await page.evaluate(() => [...document.querySelectorAll('.au-nav button')].find((b) => b.textContent.includes('próximo')).click()); passos++; await sleep(120); if (passos === 2) await shot('aula-3'); }
check('a aulinha tem 8 passos e termina com "bora jogar!"', passos === 7 && await page.evaluate(() => !![...document.querySelectorAll('button')].find((b) => b.textContent.includes('bora jogar'))));
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('bora jogar')).click()); await espera(() => document.querySelector('.mp-node'));
check('depois da aulinha abre o mapa com 12 fases e 2 níveis (fácil e médio · difícil)', (await nodes()) === 12 && (await page.locator('.tm-tabs button').count()) === 2);
await shot('mapa-terca');

/* os 3 jogos de escolher resposta: fácil e difícil, 12 fases cada */
for (const [id, label, resp] of [['terca', '3ª ou 5ª', 'grau'], ['acorde-ouvido', 'que acorde', 'acorde'], ['maior-menor', 'maior ou menor', 'mm']]) {
  await page.goto(url + `/aluno.html#/jogos/${id}`); await sleep(500); await page.waitForSelector('.mp-node');
  check(`${label}: nível fácil com 12 fases (só a 1ª aberta)`, (await nodes()) === 12);
  check(`${label}: o difícil começa trancado pros alunos (abre com o fácil concluído)`, await page.evaluate(() => document.querySelectorAll('.tm-tabs button')[1].classList.contains('lock')));
  await abreFase(1); await espera(() => window.__ouvido && window.__ouvido.estado === 'jogo');
  check(`${label}: respostas em botões de 16px ou mais`, await page.evaluate(() => { const b = [...document.querySelectorAll('.vv-opcao')]; return b.length >= 2 && b.every((x) => parseFloat(getComputedStyle(x).fontSize) >= 16); }));
  if (id === 'terca') await shot('terca-fase');
  const total = await page.evaluate(() => document.querySelector('.vv-rod').textContent.split(' de ')[1]);
  for (let k = 0; k < Number(total); k++) {
    await espera(() => window.__ouvido.estado === 'jogo' && !document.querySelector('.vv-opcao[disabled]')); await sleep(80);
    const certa = await page.evaluate(() => String(window.__ouvido.certa)); await page.evaluate((v) => window.__ouvido.responde(/^\d+$/.test(v) ? Number(v) : v), certa);
  }
  await espera(() => document.querySelector('.vv-res-n'), 8000);
  check(`${label}: acertou tudo na fase 1 = 3 estrelas e abre a fase 2`, await page.evaluate(() => document.querySelector('.vv-res-est').getAttribute('aria-label').startsWith('3') && !![...document.querySelectorAll('button')].find((b) => b.textContent.includes('próxima fase'))));
  await mapa(); await espera(() => document.querySelector('.mp-node'));
  check(`${label}: no mapa a fase 2 abriu e a 3 segue trancada`, await page.evaluate(() => { const n = [...document.querySelectorAll('.mp-node')]; return !n[1].className.includes('lock') && n[2].className.includes('lock') || n[2].getAttribute('aria-disabled') === 'true' || n[2].disabled === true; }));
}
/* com o fácil concluído o difícil abre (12 fases em cada jogo) */
const semeia = () => page.evaluate(() => { const est = {}; for (let i = 1; i <= 12; i++) est[`facil:${i}`] = 3; const games = {}; for (const id of ['terca', 'acorde-ouvido', 'maior-menor', 'escala']) games[id] = { est }; localStorage.setItem('beaterista-jogos:teste', JSON.stringify({ v: 1, sound: true, games })); });
await semeia(); await page.goto('about:blank');
for (const id of ['terca', 'acorde-ouvido', 'maior-menor', 'escala']) { await page.goto(url + `/aluno.html#/jogos/${id}`); await page.waitForSelector('.mp-node'); await page.locator('.tm-tabs button').nth(1).click(); await sleep(700); check(`${id}: com o fácil concluído, o difícil abre com 12 fases`, (await nodes()) === 12); if (id !== 'terca') { await page.locator('.tm-tabs button').nth(0).click(); await sleep(400); } await page.goto('about:blank'); }
/* difícil de 3ª e 5ª usa mais graus */
await page.goto(url + '/aluno.html#/jogos/terca'); await page.waitForSelector('.mp-node'); await abreFase(1); await espera(() => window.__ouvido && window.__ouvido.estado === 'jogo');
check('3ª ou 5ª difícil fase 1: 3 respostas (3ª, 5ª e 7ª), sem nome da tônica quando a dica some', (await page.locator('.vv-opcao').count()) === 3);

/* escalas */
await page.goto(url + '/aluno.html#/jogos/escala'); await page.waitForSelector('.mp-node'); await sleep(400);
check('escalas: 12 fases no fácil e 3 abas (fácil, difícil, livre)', (await nodes()) === 12 && (await page.locator('.tm-tabs button').count()) === 3);
await abreFase(1); await espera(() => window.__escala && window.__escala.estado === 'menu'); await shot('escala-1');
check('escalas: as notas são coloridas (cada uma com a sua cor)', await page.evaluate(() => new Set([...document.querySelectorAll('.vv-seq .vv-n')].map((n) => n.style.getPropertyValue('--nc'))).size === 7));
check('escalas: as teclas também são coloridas', await page.evaluate(() => [...document.querySelectorAll('.vv-tecla[data-midi]')].every((b) => b.style.getPropertyValue('--nc'))));
await page.evaluate(() => document.querySelector('.vv-go').click()); await espera(() => window.__escala.estado === 'jogo');
check('escalas: fase 1 é dó maior (8 notas)', await page.evaluate(() => window.__escala.alvo.join() === '60,62,64,65,67,69,71,72'), await page.evaluate(() => window.__escala.alvo.join()));
for (const m of [60, 62, 64, 65, 67, 69, 71, 72]) await page.evaluate((n) => window.__escala.nota(n), m);
await espera(() => document.querySelector('.vv-res-n'), 6000);
check('escalas: sem erros = 3 estrelas', await page.evaluate(() => document.querySelector('.vv-res-est').getAttribute('aria-label').startsWith('3')));
/* difícil: com teclas pretas tocáveis e bemol no nome */
await page.goto('about:blank'); await page.goto(url + '/aluno.html#/jogos/escala'); await page.waitForSelector('.mp-node'); await page.locator('.tm-tabs button').nth(1).click(); await sleep(700);
await abreFase(1); await espera(() => window.__escala && window.__escala.estado === 'menu'); await page.evaluate(() => document.querySelector('.vv-go').click()); await espera(() => window.__escala.estado === 'jogo');
for (const m of await page.evaluate(() => window.__escala.alvo)) await page.evaluate((n) => window.__escala.nota(n), m);
await espera(() => document.querySelector('.vv-res-n'), 6000); await mapa(); await espera(() => document.querySelector('.mp-node')); await abreFase(2); await espera(() => window.__escala && window.__escala.estado === 'menu');
check('escalas difícil: fá maior tem si♭ escrito e teclas pretas que tocam', await page.evaluate(() => /si♭/.test(document.querySelector('.vv-seq').textContent) && document.querySelectorAll('.vv-preta.tocavel:not(.fora)').length >= 1));
await shot('escala-dificil');
await page.evaluate(() => document.querySelector('.vv-go').click()); await espera(() => window.__escala.estado === 'jogo');
for (const m of await page.evaluate(() => window.__escala.alvo)) await page.evaluate((n) => window.__escala.nota(n), m);
await espera(() => document.querySelector('.vv-res-n'), 6000);
check('escalas difícil: concluiu fá maior', await page.evaluate(() => document.querySelector('.vv-res-est').getAttribute('aria-label').startsWith('3')));
/* livre: fileiras com setinhas */
await page.goto(url + '/aluno.html#/jogos'); await sleep(300); await page.goto(url + '/aluno.html#/jogos/escala'); await page.waitForSelector('.mp-node'); await page.locator('.tm-tabs button').nth(2).click(); await sleep(800);
check('livre: escala, tônica e percurso em fileiras que arrastam pro lado', (await page.locator('.vv-rol-fila').count()) === 3);
check('livre: a fileira das 12 tônicas rola e tem a setinha ›', await page.evaluate(() => { const f = [...document.querySelectorAll('.vv-rol')].find((x) => x.textContent.includes('começa em')); const fila = f.querySelector('.vv-rol-fila'); return fila.scrollWidth > fila.clientWidth && !f.querySelector('.vv-rol-b.dir').hidden; }));
await shot('livre');
await page.evaluate(() => [...document.querySelectorAll('.vv-rol-fila .vv-chip')].find((c) => c.textContent === 'pentatônica').click()); await sleep(300);
check('livre: escolher pentatônica troca a escala (6 notas)', await page.evaluate(() => document.querySelectorAll('.vv-seq .vv-n').length === 6));

check('nenhum erro de JS', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
