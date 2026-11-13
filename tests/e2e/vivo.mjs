// Jogos "de verdade" (Copia Aí, pauLta ao Vivo, Eco de Groove, Clique Fantasma): abre cada um com código de aluno e joga uma rodada inteira na tela.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); } catch (e) {} });
const shot = (n) => page.screenshot({ path: `${process.env.SHOTS || '/tmp'}/vivo-${n}.png` });
const toca = (sel) => page.evaluate((s) => document.querySelector(s).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })), sel);
const espera = (fn, ms = 20000) => page.waitForFunction(fn, null, { timeout: ms });

/* ---------- catálogo ---------- */
await page.goto(url + '/aluno.html#/jogos'); await sleep(1800);
check('os 4 jogos aparecem na aba Jogos', await page.evaluate(() => ['copia', 'paultavivo', 'groove', 'fantasma'].every((id) => document.querySelector(`a.jg-card[href="#/jogos/${id}"]`))));
await page.evaluate(() => document.querySelector('a.jg-card[href="#/jogos/copia"]').scrollIntoView({ block: 'center' })); await sleep(300); await shot('0-catalogo');

/* ---------- Copia Aí ---------- */
await page.goto(url + '/aluno.html#/jogos/copia'); await sleep(1500);
check('Copia Aí: 3 teclas com nome (dó ré mi) no nível 3 notas', await page.evaluate(() => [...document.querySelectorAll('.vv-tecla:not(.fora)')].map((b) => b.textContent).join(' ') === 'dó ré mi'));
check('Copia Aí: chips pequenos de jogo, notas, ajuda e como tocar', await page.evaluate(() => document.querySelectorAll('.vv-linha').length === 4 && [...document.querySelectorAll('.vv-chip')].every((c) => c.getBoundingClientRect().height <= 34)));
await shot('1-copia-menu');
await page.evaluate(() => document.querySelector('.vv-go').click());
await espera(() => window.__vivo.estado === 'vez');
check('Copia Aí: 1ª rodada tem 2 notas escritas', await page.evaluate(() => { const n = [...document.querySelectorAll('.vv-n')].map((x) => x.textContent); return n.length === 2 && n.every((t) => ['dó', 'ré', 'mi'].includes(t)); }));
await shot('2-copia-vez');
for (let rodada = 0; rodada < 3; rodada++) { // copia certo 3 rodadas (2, 3 e 4 notas)
  await espera(() => window.__vivo.estado === 'vez');
  const alvo = await page.evaluate(() => window.__vivo.alvo);
  for (const m of alvo) { await toca(`.vv-tecla[data-midi="${m}"]`); await sleep(120); }
}
await espera(() => window.__vivo.estado === 'vez');
check('Copia Aí: a melodia cresceu pra 5 notas', await page.evaluate(() => window.__vivo.alvo.length === 5 && document.querySelectorAll('.vv-n').length === 5));
for (let i = 0; i < 3; i++) { // erra 3 vezes: acaba
  await espera(() => window.__vivo.estado === 'vez');
  const errada = await page.evaluate(() => [60, 62, 64].find((m) => m !== window.__vivo.alvo[0]));
  await toca(`.vv-tecla[data-midi="${errada}"]`); await sleep(200);
}
await espera(() => window.__vivo.estado === 'fim');
const tc = await page.evaluate(() => document.querySelector('.vv-res').textContent);
check('Copia Aí: 4 notas copiadas = 1 estrela', /4 notas/.test(tc) && /★☆☆/.test(tc), tc);
await shot('3-copia-fim');
// música + de ouvido
await page.evaluate(() => [...document.querySelectorAll('.vv-chip')].find((c) => c.textContent === 'música').click()); await sleep(300);
check('Copia Aí: modo música lista as melodias e abre as 8 teclas', await page.evaluate(() => document.querySelectorAll('.vv-tecla:not(.fora)').length === 8 && [...document.querySelectorAll('.vv-chip')].some((c) => /Brilha/.test(c.textContent))));
await page.evaluate(() => [...document.querySelectorAll('.vv-chip')].find((c) => c.textContent === 'de ouvido').click()); await sleep(300);
await page.evaluate(() => document.querySelector('.vv-go').click());
await espera(() => window.__vivo.estado === 'vez');
check('Copia Aí: de ouvido esconde os nomes (3 bolinhas) e a música começa com dó dó sol', await page.evaluate(() => [...document.querySelectorAll('.vv-n')].map((x) => x.textContent).join('') === '•••' && window.__vivo.alvo.join() === '60,60,67'));
await page.evaluate(() => { window.__vivo.nota(48); }); await sleep(100); // sem microfone a tela confere a oitava exata
check('Copia Aí: na tela vale a tecla exata', await page.evaluate(() => window.__vivo.vidas === 2));

/* ---------- pauLta ao Vivo ---------- */
await page.goto(url + '/aluno.html#/jogos/paultavivo'); await sleep(1500);
check('pauLta ao Vivo: pauta com clave e teclado', await page.evaluate(() => !!document.querySelector('.vv-pauta svg') && document.querySelectorAll('.vv-tecla:not(.fora)').length === 3));
await page.evaluate(() => document.querySelector('.vv-go').click()); await espera(() => window.__vivo.estado === 'vez');
check('pauLta ao Vivo: desenha uma nota na pauta', await page.evaluate(() => document.querySelectorAll('.vv-pauta svg ellipse').length === 1));
await shot('4-pauta-vez');
{ const certa = await page.evaluate(() => window.__vivo.certa); const errada = [60, 62, 64].find((m) => m !== certa); await toca(`.vv-tecla[data-midi="${errada}"]`); await sleep(150); } // 1 erro: 9 de 10 de primeira
for (let i = 0; i < 10; i++) { await espera(() => window.__vivo.estado === 'vez'); const certa = await page.evaluate(() => window.__vivo.certa); await toca(`.vv-tecla[data-midi="${certa}"]`); await sleep(80); }
await espera(() => window.__vivo.estado === 'fim');
const tp = await page.evaluate(() => document.querySelector('.vv-res').textContent);
check('pauLta ao Vivo: 9 de 10 de primeira = 90% e 2 estrelas', /90%/.test(tp) && /★★☆/.test(tp) && /9 de 10/.test(tp), tp);
await shot('5-pauta-fim');

/* ---------- Eco de Groove ---------- */
await page.goto(url + '/aluno.html#/jogos/groove'); await sleep(1500);
check('Eco de Groove: 10 fases e só a 1 aberta', await page.evaluate(() => { const f = [...document.querySelectorAll('.vv-fase')]; return f.length === 10 && !f[0].disabled && f.slice(1).every((b) => b.disabled); }));
await shot('6-groove-fases');
await page.evaluate(() => { localStorage.setItem(Object.keys(localStorage).find((k) => k.startsWith('beaterista-jogos')) || 'beaterista-jogos:teste', JSON.stringify({ v: 1, sound: true, games: { groove: { est: { 1: 100, 2: 100, 3: 100, 4: 100, 5: 100, 6: 100, 7: 100 }, bpm: 100 } } })); });
await page.reload(); await sleep(1500);
await page.evaluate(() => document.querySelector('.vv-fase[data-fase="8"]').click()); await sleep(300);
check('Eco de Groove: grade de 4 tempos com chimbal e bumbo juntos e caixa; 3 pads', await page.evaluate(() => { const t = [0, 1, 2, 3].map((i) => [...document.querySelectorAll(`.vv-cel.on[data-i="${i}"]`)].map((c) => c.dataset.p).join('')); return t.join('|') === 'hb|c|hb|c' && [...document.querySelectorAll('.vv-gl')].map((x) => x.textContent).join() === 'chimbal,caixa,bumbo' && document.querySelectorAll('.vv-pad').length === 3; }));
await shot('7-groove-fase');
await page.evaluate(() => document.querySelector('.vv-go').click()); await espera(() => window.__vivo.t0 > 0);
await page.evaluate(async () => { // toca cada compasso certo na vez do aluno
  const { FASES_GROOVE } = await import('/js/jogos/vivo-logic.js'); const a = (await import('/js/audio.js')).audio(false); const V = window.__vivo; const f = FASES_GROOVE[7];
  for (let k = 0; k < 3; k++) for (let i = 0; i < 4; i++) { const t = V.t0 + k * 8 * V.q + 4 * V.q + i * V.q; while (a.currentTime < t - 0.004) await new Promise((r) => setTimeout(r, 2)); for (const p of f.bars[k][i]) document.querySelector(`.vv-pad.${p}`).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); }
});
await sleep(600); await shot('8-groove-jogando');
await espera(() => window.__vivo.estado === 'fase' && !!document.querySelector('.vv-res'));
const tg = await page.evaluate(() => document.querySelector('.vv-res').textContent);
check('Eco de Groove: tocando certo passa com nota alta', /(\d+)%/.test(tg) && +tg.match(/(\d+)%/)[1] >= 90, tg);
check('Eco de Groove: oferece a próxima fase', /próxima fase/.test(tg));
await shot('9-groove-fim');

/* ---------- Clique Fantasma ---------- */
await page.goto(url + '/aluno.html#/jogos/fantasma'); await sleep(1500);
await page.evaluate(() => [...document.querySelectorAll('.vv-chip')].find((c) => c.textContent === '120 BPM').click()); await sleep(300);
check('Clique Fantasma: andamentos, tempo de silêncio e botão de tocar', await page.evaluate(() => [...document.querySelectorAll('.vv-chip')].map((c) => c.textContent).join() === '60 BPM,80 BPM,100 BPM,120 BPM,1 compasso,2 compassos,4 compassos,na tela,no instrumento' && !!document.querySelector('.vv-padzao')));
await shot('10-fantasma-menu');
await page.evaluate(() => document.querySelector('.vv-go').click()); await espera(() => window.__vivo.t0 > 0);
await page.evaluate(async () => { // toca os 12 tempos (8 com clique + 4 no silêncio) no lugar
  const a = (await import('/js/audio.js')).audio(false); const V = window.__vivo;
  for (let k = 0; k < 12; k++) { const t = V.t0 + k * V.q; while (a.currentTime < t - 0.004) await new Promise((r) => setTimeout(r, 2)); document.querySelector('.vv-padzao').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); if (k === 9) window.__mudo = document.querySelector('.vv-luz').classList.contains('mudo') && /sumiu/.test(document.querySelector('.vv-quem').textContent); }
});
check('Clique Fantasma: avisa quando o clique some', await page.evaluate(() => window.__mudo === true));
await espera(() => window.__vivo.estado === 'fim');
const tf = await page.evaluate(() => document.querySelector('.vv-res').textContent);
check('Clique Fantasma: no tempo = cravou, com 4 batidas medidas', /cravou/.test(tf) && /(\d+)%/.test(tf) && +tf.match(/(\d+)%/)[1] >= 75 && await page.evaluate(() => document.querySelectorAll('.vv-ponto').length === 4), tf);
await shot('11-fantasma-fim');

/* ---------- sem código: trancado ---------- */
check('sem erro de página', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
