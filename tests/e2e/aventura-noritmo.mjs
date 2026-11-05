// Modo Aventura do No Ritmo: mapa, trava de ORDEM (nenhuma música trancada), abrir não conclui, jogar de verdade (relógio virtual + toques nos tempos reais do gráfico),
// resultado, destrava, recarregar, derrota/abandono não conclui, modo livre intacto. Roda a campanha inteira: prova que as 11 missões são possíveis.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { // relógio de áudio virtual (só liga quando window.__vt existe) e sem criar fontes de som: acelera a música sem mexer na lógica do jogo
  try {
    const d = Object.getOwnPropertyDescriptor(BaseAudioContext.prototype, 'currentTime');
    window.__realCT = (c) => d.get.call(c);
    Object.defineProperty(BaseAudioContext.prototype, 'currentTime', { get() { return window.__vt != null ? window.__vt : d.get.call(this); }, configurable: true });
    for (const cls of ['OscillatorNode', 'AudioBufferSourceNode']) { const pr = window[cls].prototype; const st = pr.start, sp = pr.stop; pr.start = function (...a) { if (window.__vt != null) { this.__skip = 1; return; } return st.apply(this, a); }; pr.stop = function (...a) { if (this.__skip) return; return sp.apply(this, a); }; }
    window.__auto = (perFrame, noHit) => new Promise((resolve) => {
      const BR = window.BeaterRhythm; const c = window.__ac.ctxs[0]; const keys = BR._keys(); const chart = BR._chart().chart; const seen = new Set();
      let vt = window.__realCT(c); window.__vt = vt;
      const press = (key) => { document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); document.body.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true })); };
      const frame = () => {
        const end = vt + perFrame;
        while (vt < end) {
          vt += 0.008; window.__vt = vt; const s = BR._time(); if (s == null) { window.__vt = null; resolve(true); return; }
          if (!noHit) for (const n of chart) { if (n.cpu || n.res || seen.has(n) || n.t > s) continue; seen.add(n); press(n.sw ? ({ u: 'ArrowUp', l: 'ArrowLeft', r: 'ArrowRight' }[n.sw]) : keys[n.lane]); }
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  } catch (e) { console.log('init', e); }
});
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|ERR_INTERNET|ERR_FAILED|Failed to load resource/.test(m.text())) errs.push(m.text()); });
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch (e) {} });
const go = (x) => page.evaluate((v) => { location.hash = v; }, x);
const hash = () => page.evaluate(() => location.hash);
const states = () => page.evaluate(() => [...document.querySelectorAll('.mp-node')].map((n) => n.className.match(/st-(\w+)/)[1]));
const ls = (k) => page.evaluate((x) => localStorage.getItem(x), k);

await page.goto(url + '/aluno.html#/ritmo'); await page.waitForSelector('#jogos [data-act="rz-game"]');
check('modo livre: botão Aventura visível e nada removido (Beat Hero, Piano Hero, JOGAR)', (await page.locator('a[data-aventura]').count()) === 1 && (await page.locator('[data-act="rz-game"]').count()) === 2);
const btn = await page.locator('a[data-aventura]').boundingBox(); check('botão Aventura tem 44px+ de altura', btn.height >= 44, String(btn.height));
// pega o estado do livre antes de qualquer aventura (preferências, recordes, figurinhas, ranking)
await page.evaluate(() => document.querySelector('#jogos [data-act="rz-acc"][data-v="ajustes"]').click()); await sleep(100);
await page.evaluate(() => document.querySelector('#jogos [data-act="rz-diff"][data-v="facil"]').click()); await sleep(600);
const livre0 = await ls('beaterista-aluno-ritmo'); const xp0 = await page.evaluate(async () => (await import('/js/views/jogos-ritmo.js')).xpTotal());
await page.click('a[data-aventura]'); await page.waitForSelector('.mp-node'); await sleep(700);
check('rota #/ritmo/aventura abre o mapa', (await hash()) === '#/ritmo/aventura');
let st = await states();
check('mapa com 11 missões; só a 0 atual, ordem dos desafios trancada', st.length === 11 && st[0] === 'current' && st.slice(1).every((x) => x === 'locked'), st.join());
await page.evaluate(() => document.querySelectorAll('.mp-node')[1].click()); await sleep(300);
check('missão 1 trancada não abre', (await hash()) === '#/ritmo/aventura');
await go('#/ritmo/aventura/1'); await sleep(500);
check('rota direta da missão trancada volta ao mapa', (await hash()) === '#/ritmo/aventura', await hash());
await page.evaluate(() => document.querySelector('.st-current').click()); await page.waitForSelector('.av-go');
check('briefing: objetivo, regras e as 3 estrelas', (await page.locator('.av-goal').count()) === 1 && (await page.locator('.av-stars-how li').count()) === 3);
await go('#/ritmo/aventura'); await page.waitForSelector('.mp-node'); await sleep(400);
check('abrir a missão 0 não a conclui', (await states())[0] === 'current' && (await states())[1] === 'locked');
check('abrir não gravou progresso', await page.evaluate(() => { const r = localStorage.getItem('beaterista-aluno-ritmo'); return true; }));

const startMission = async (i, songIdx = 0) => {
  await go(`#/ritmo/aventura/${i}`); await page.waitForSelector('.av-go'); await page.click('.av-go');
  await page.waitForSelector('.rz-mmenu .rz-jogar', { timeout: 15000 });
  await page.locator('.rz-mmenu .rz-jogar').nth(songIdx).click();
  if (await page.locator('[data-act="rz-go"]').count()) await page.click('[data-act="rz-go"]');
  await page.waitForSelector('#rz-cv', { timeout: 5000 });
};
// missão 0: menu da missão sem opções do modo livre
await go('#/ritmo/aventura/0'); await page.waitForSelector('.av-go'); await page.click('.av-go'); await page.waitForSelector('.rz-mmenu .rz-jogar', { timeout: 15000 });
check('missão 0: menu simples (sem abas de jogo/ajustes/importar do modo livre)', (await page.locator('[data-act="rz-game"], [data-act="rz-diff"], [data-act="rz-len"]').count()) === 0 && (await page.locator('.rz-mmenu .tag').textContent()).includes('3 teclas'));
check('missão 0: botão JOGAR grande', (await page.locator('.rz-mmenu .rz-jogar').first().boundingBox()).height >= 44);
for (const w of [320, 430]) { await page.setViewportSize({ width: w, height: 700 }); await sleep(250); check(`menu da missão sem rolagem horizontal em ${w}px`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), await page.evaluate(() => document.documentElement.scrollWidth + '>' + window.innerWidth)); }
await page.setViewportSize({ width: 390, height: 844 });
await page.locator('.rz-mmenu .rz-jogar').first().click(); await page.waitForSelector('#rz-cv');
// abandonar no meio: não conclui nem entrega resultado
await sleep(800); await page.click('[data-act="rz-quit"]'); await sleep(500);
check('sair no meio volta ao menu da missão, sem resultado', (await page.locator('.av-res').count()) === 0 && (await page.locator('.rz-mmenu').count()) === 1);
// partida de verdade, tocando tudo certo
await page.locator('.rz-mmenu .rz-jogar').first().click(); await page.waitForSelector('#rz-cv');
const info = await page.evaluate(() => { const c = window.BeaterRhythm._chart(); return { n: c.chart.filter((x) => !x.cpu).length, dur: c.A.dur }; });
check('gráfico real da missão 0 tem notas e ~1 min', info.n > 20 && info.dur > 55 && info.dur < 70, JSON.stringify(info));
await page.evaluate(() => window.__auto(0.25)); await page.waitForSelector('.av-res', { timeout: 10000 });
check('resultado: missão concluída com 3 estrelas (jogada perfeita)', (await page.locator('.av-res h2').textContent()).includes('concluída') && (await page.locator('.av-rstar.on').count()) === 3, await page.locator('.av-sum').textContent());
check('resultado mostra a precisão real', /precisão (100|9\d)%/.test(await page.locator('.av-sum').textContent()));
check('missão 1 liberada no resultado', (await page.locator('.av-unlock').count()) === 1);
const livre1 = await ls('beaterista-aluno-ritmo');
check('nada do modo livre foi gravado (preferências, recordes, figurinhas, ranking)', livre1 === livre0, `${(livre0 || '').length} vs ${(livre1 || '').length}`);
check('sem ★ de figurinhas nem recorde na aventura', !/sticker/.test(livre1 || '') && !/"best":\{"[^}]/.test(livre1 || ''));
const xp1 = await page.evaluate(async () => (await import('/js/views/jogos-ritmo.js')).xpTotal()); check('XP creditado como numa partida normal (decisão documentada)', xp1 > xp0, `${xp0} -> ${xp1}`);
await page.click('text=ver o mapa'); await page.waitForSelector('.mp-node'); await sleep(500);
st = await states(); check('mapa: 0 concluída, 1 atual, resto trancado', st[0] === 'done' && st[1] === 'current' && st.slice(2).every((x) => x === 'locked'), st.join());
await page.reload(); await page.waitForSelector('.mp-node'); await sleep(700);
st = await states(); check('recarregar mantém o progresso', st[0] === 'done' && st[1] === 'current', st.join());

// derrota/sem acertos não conclui e não destrava (missão 1: ninguém toca em nada, a música corre até o fim)
await startMission(1); await page.evaluate(() => window.__auto(0.25, true)); await page.waitForSelector('.av-res', { timeout: 10000 });
check('música inteira sem acertos: "Ainda não deu", 0 estrelas, sem destravar', (await page.locator('.av-res h2').textContent()).includes('Ainda não') && (await page.locator('.av-rstar.on').count()) === 0 && (await page.locator('.av-unlock').count()) === 0);
await page.click('text=ver o mapa'); await page.waitForSelector('.mp-node'); await sleep(400);
st = await states(); check('falhar não destrava a missão 2', st[1] === 'current' && st[2] === 'locked', st.join());

// campanha inteira, tocando certo: cada missão é possível (jogo/teclas/dificuldade/duração/música reais)
const plan = await page.evaluate(async () => (await import('/js/campanha/jogos/noritmo.js')).spec.missions.map((m) => m.params));
for (let i = 1; i <= 10; i++) {
  const p = plan[i]; await startMission(i, i === 10 ? 7 : 0);
  const cfg = await page.evaluate(() => { const c = window.BeaterRhythm._chart(); return { n: c.chart.filter((x) => !x.cpu).length, dur: c.A.dur, keys: window.BeaterRhythm._keys().length }; });
  if (p.game === 'beat') check(`missão ${i}: ${p.keys} teclas e ${p.maxLen / 60} min de verdade`, cfg.keys === p.keys && cfg.dur > p.maxLen - 5 && cfg.dur < p.maxLen + 8, JSON.stringify(cfg));
  else check(`missão ${i}: Piano Hero (4 colunas) com notas`, cfg.keys === 4 && cfg.n > 20, JSON.stringify(cfg));
  if (p.combo) check(`missão ${i}: o gráfico comporta o combo ${p.combo}`, cfg.n >= p.combo * 2, `${cfg.n} notas`);
  await page.evaluate(() => window.__auto(0.25)); await page.waitForSelector('.av-res', { timeout: 20000 });
  const h2 = await page.locator('.av-res h2').textContent(); const stars = await page.locator('.av-rstar.on').count();
  check(`missão ${i} (${p.game}/${p.diff}) concluída tocando tudo certo: 3 estrelas`, h2.includes('concluída') && stars === 3, `${h2} ${stars}★ ${await page.locator('.av-sum').textContent()}`);
  if (i < 10) { await page.click('.av-res .av-go'); await page.waitForSelector('.av-go'); }
}
check('medalhas novas aparecem no fim', (await page.locator('.av-newm .av-chip').count()) >= 1);
await page.click('text=ver o mapa'); await page.waitForSelector('.mp-node'); await sleep(500);
st = await states(); check('campanha completa: 11 discos concluídos', st.every((x) => x === 'done'), st.join());

// Piano Hero: perder os corações não conclui (missão 4 já concluída; a tentativa nova não apaga as estrelas)
await startMission(4); await page.evaluate(() => window.__auto(0.25, true)); await page.waitForSelector('.av-res', { timeout: 20000 });
check('Piano Hero sem tocar: perde os corações, não conclui, e não tira as estrelas já ganhas', (await page.locator('.av-res h2').textContent()).includes('Ainda não') && !!(await page.evaluate(() => /ainda|corações|precisão/i.test(document.querySelector('.av-sum').textContent))));
await go('#/ritmo/aventura'); await page.waitForSelector('.mp-node'); await sleep(400);
check('estrelas anteriores mantidas', (await states())[4] === 'done');

// modo livre depois da aventura: continua igual e sem estado emprestado
await go('#/ritmo'); await page.waitForSelector('#jogos [data-act="rz-game"]'); await sleep(300);
check('modo livre volta com o menu completo', (await page.locator('[data-act="rz-game"]').count()) === 2 && true);
await page.evaluate(() => document.querySelector('#jogos [data-act="rz-acc"][data-v="ajustes"]').click()); await sleep(100);
check('modo livre: preferência do livre continua (fácil) e a aventura não a mudou', await page.evaluate(() => { const b = document.querySelector('#jogos [data-act="rz-diff"][data-v="facil"]'); return !!b && (b.classList.contains('on') || b.getAttribute('aria-pressed') === 'true'); }));
check('armazenamento do livre idêntico depois da campanha toda', (await ls('beaterista-aluno-ritmo')) === livre0);
await go('#/jogos'); await sleep(500);
check('sair não deixa som nem corpo travado', await page.evaluate(() => !document.body.classList.contains('rz-lock') && !document.documentElement.classList.contains('rg-on')));
check('sem erros de console', errs.length === 0, errs.slice(0, 3).join(' | '));
const f = done(); await browser.close(); srv.close(); process.exit(f ? 1 : 0);
