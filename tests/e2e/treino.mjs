// Modo TREINO (Toca Aqui, Detetive Note, Figurix): botão grande e visível no mapa, sem trilha, rodadas novas sem parar, e NADA é salvo (sem estrela, sem figurinha).
import { serve, launch, sleep, check, done, alunoComCodigo } from './harness.mjs';
import { cartas } from '../../js/jogos/detetive-logic.js';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
await alunoComCodigo(ctx);
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch (e) {} });
const estrelas = () => page.evaluate(() => JSON.stringify([window.__figurix, 0]).length && Object.keys(localStorage).filter((k) => /figurix|detetive/i.test(k)).map((k) => localStorage.getItem(k)).join('|'));

for (const jogo of ['toca', 'detetive', 'figurix']) {
  await page.goto(url + `/aluno.html#/jogos/${jogo}`); await page.waitForSelector('.mp-node', { timeout: 15000 });
  const b = page.locator('.tm-treino');
  check(`${jogo}: botão "modo treino" visível no mapa (não "aleatório" nem "aula")`, (await b.count()) === 1 && await b.isVisible() && /modo treino/.test(await b.textContent()) && !/aleat|aula/i.test(await b.textContent()));
  const box = await b.boundingBox(); check(`${jogo}: botão grande (largura inteira e alto o bastante pro dedo)`, box && box.width > 300 && box.height >= 48, JSON.stringify(box));
}

// ---- Detetive Note: nível 3 do mundo 1, certo várias vezes seguidas sem fechar e sem salvar
await page.goto(url + '/aluno.html#/jogos/detetive'); await page.waitForSelector('.tm-treino');
const antesDet = await estrelas();
await page.locator('.tm-treino').click(); await page.waitForSelector('.tm-treino-start');
check('detetive: tela do treino tem mundo e nível 1 a 12', (await page.locator('.tm-treino-grupo').count()) === 2 && (await page.locator('.tm-treino-grupo').nth(1).locator('button').count()) === 12);
await page.locator('.tm-treino-grupo').nth(1).locator('button[data-v="3"]').click(); await page.locator('.tm-treino-start').click(); await page.waitForSelector('.dn-card');
check('detetive: cabeçalho mostra "treino · nível 3" e o placar (sem bolinhas de fase)', /treino · .*nível 3/.test(await page.textContent('.dn-sub')) && (await page.locator('.dn-dots').count()) === 0 && /0 ritmos certos/.test(await page.textContent('.tm-treino-placar')));
let n = 0;
for (let i = 0; i < 5; i++) {
  const sec = await page.evaluate(() => window.__detetive.secreto); const pool = cartas('m1', 3).map((c) => c.cell);
  for (const c of sec) await page.locator('.dn-card').nth(pool.indexOf(c)).click();
  await page.locator('.dn-conferir').click(); await page.waitForFunction((k) => new RegExp(`${k + 1} ritm`).test(document.querySelector('.tm-treino-placar')?.textContent || ''), i, { timeout: 8000 }); n++;
}
check('detetive: 5 ritmos certos seguidos e continua jogando (infinito, não passa de "fase concluída")', n === 5 && (await page.locator('.dn-card').count()) > 0 && !/concluída/.test(await page.textContent('.jg-detetive')));
check('detetive: treino não salvou estrela nem progresso', (await estrelas()).replace(/"(modo|estilo|tNivel)":[^,}]*,?/g, '') === antesDet.replace(/"(modo|estilo|tNivel)":[^,}]*,?/g, '') || !/"est"/.test(await estrelas()));
await page.getByRole('button', { name: /treino/ }).first().click(); await page.waitForSelector('.tm-treino-start');
check('detetive: "‹ treino" volta pra escolha de nível', true);

// ---- Figurix: nível 3, misturado; rodada acaba e vem "próxima rodada" sem estrela
await page.goto(url + '/aluno.html#/jogos/figurix'); await page.waitForSelector('.tm-treino');
await page.locator('.tm-treino').click(); await page.waitForSelector('.tm-treino-start');
check('figurix: tela do treino tem nível 1 a 7 e "misturado"', (await page.locator('.tm-treino-grupo').nth(0).locator('button').count()) === 7 && /misturado/.test(await page.locator('.tm-treino-grupo').nth(1).textContent()));
await page.locator('.tm-treino-grupo').nth(0).locator('button[data-v="1"]').click();
await page.locator('.tm-treino-grupo').nth(1).locator('button[data-v="rapida"]').click();
await page.locator('.tm-treino-start').click(); await sleep(600);
check('figurix: abre direto numa rodada (sem aulinha), com o cabeçalho de treino', (await page.locator('.tm-treino-placar').count()) === 1 && !/aulinha/.test(await page.textContent('.jg-figurix')));
// responde tudo: clica sempre numa opção qualquer até a rodada acabar (errar também vale: treino não salva)
for (let i = 0; i < 40 && (await page.locator('.tm-treino-start').count()) === 0; i++) { const op = page.locator('.jg-figurix button:not(.ghost):not(.fx-recomeca):visible').first(); if (await op.count()) await op.click({ timeout: 1500 }).catch(() => {}); await sleep(250); }
check('figurix: no fim vem "próxima rodada" (e não "fase concluída" nem estrelas)', (await page.locator('.tm-treino-start').count()) === 1 && !/fase \d+ concluída|★/.test(await page.textContent('.jg-figurix')));
const salvoFx = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).filter(([k]) => /figurix/i.test(k))));
check('figurix: nenhuma estrela foi salva', !/"est":\{\s*"\d+"/.test(salvoFx), salvoFx.slice(0, 200));
await page.locator('.tm-treino-start').click(); await sleep(500);
check('figurix: "próxima rodada" já abre outra rodada', (await page.locator('.tm-treino-placar').count()) === 1 && /rodada 2/.test(await page.textContent('.tm-treino-placar')));
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
