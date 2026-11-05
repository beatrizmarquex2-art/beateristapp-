// Mapa de fases (Turnê do Vinil): estados, bloqueio, abrir fase, progresso salvo, recarregar, som ligado/desligado, teclado, celular, console.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|ERR_INTERNET/.test(m.text())) errs.push(m.text()); });
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch (e) {} });
await page.goto(url + '/aluno.html#/kids'); await page.waitForSelector('.kx-g, .kx-cards');
const go = (x) => page.evaluate((v) => { location.hash = v; }, x);
const states = () => page.evaluate(() => [...document.querySelectorAll('.mp-node')].map((n) => n.className.match(/st-(\w+)/)[1]));
const hash = () => page.evaluate(() => location.hash);
const rec = (level, stars) => page.evaluate(async ([l, s]) => { const P = await import('/js/kids/progress.js'); const me = P.active(); await P.record(me.id, { game: 'figuras', level: l, right: s ? 5 : 1, total: 5, stars: s }); }, [level, stars]);

await go('#/kids/figuras'); await page.waitForSelector('.mp-node'); await sleep(900);
let st = await states();
check('entrada no mapa: 11 discos na ordem 0..10', st.length === 11 && (await page.evaluate(() => [...document.querySelectorAll('.mp-node .mp-lab')].map((x) => x.textContent).join(',') === '0,1,2,3,4,5,6,7,8,9,10')));
check('sem progresso: fase 0 é a atual e as outras estão trancadas', st[0] === 'current' && st.slice(1).every((x) => x === 'locked'), st.join());
check('fase atual aparece centralizada na tela', await page.evaluate(() => { const r = document.querySelector('.st-current').getBoundingClientRect(); return r.top > 0 && r.bottom < innerHeight; }));
check('Paul usa o arquivo oficial', await page.evaluate(() => /assets\/paul\/e\d+\.webp/.test(document.querySelector('.mp-paul img').getAttribute('src'))));

await page.evaluate(() => document.querySelectorAll('.mp-node')[3].scrollIntoView({ block: 'center' })); await sleep(100);
await page.evaluate(() => document.querySelectorAll('.mp-node')[3].click()); await sleep(300);
check('fase trancada não abre (hash não muda)', (await hash()) === '#/kids/figuras', await hash());
check('fase trancada reage (aria-disabled e sacudida)', await page.evaluate(() => { const n = document.querySelectorAll('.mp-node')[3]; return n.getAttribute('aria-disabled') === 'true'; }));

// vários toques rápidos na fase atual = uma abertura só
await page.evaluate(() => document.querySelector('.st-current').scrollIntoView({ block: 'center' }));
await page.evaluate(() => { const n = document.querySelector('.st-current'); for (let i = 0; i < 5; i++) n.click(); }); await sleep(600);
check('fase atual abre pelo toque', (await hash()).startsWith('#/kids/figuras/0'), await hash());
await page.waitForSelector('.kx-go'); check('a fase abriu de verdade (tela da fase)', !!(await page.$('.kx-run')));

// concluir a fase 0 (1 estrela) e voltar: celebração, fase 1 passa a ser a atual
await go('#/kids/figuras'); await page.waitForSelector('.mp-node'); await sleep(500);
await rec(0, 2);
await go('#/kids'); await sleep(200); await go('#/kids/figuras'); await page.waitForSelector('.mp-node'); await sleep(500);
st = await states();
check('conclusão: fase 0 concluída, fase 1 é a atual, resto trancado', st[0] === 'done' && st[1] === 'current' && st.slice(2).every((x) => x === 'locked'), st.join());
check('estrelas reais no disco concluído (2)', await page.evaluate(() => document.querySelectorAll('.mp-node')[0].querySelectorAll('.mp-stars i.on').length === 2));
check('comemoração só ao voltar de uma conclusão nova', await page.evaluate(() => !!document.querySelector('.mp-node.pop')));
check('caminho aceso até a fase atual', await page.evaluate(() => !!document.querySelector('.mp-lit')));

// recarregar: tudo restaurado, sem comemorar de novo
await page.reload(); await page.waitForSelector('.mp-node'); await sleep(900);
st = await states();
check('depois de recarregar o progresso continua', st[0] === 'done' && st[1] === 'current', st.join());
check('recarregar não comemora de novo', await page.evaluate(() => !document.querySelector('.mp-node.pop')));

// som: ligado toca, desligado fica mudo e o botão guarda a escolha
const peak = (ms) => page.evaluate((m) => window.__peak(m), ms);
await page.evaluate(() => document.querySelector('.mp-node.st-done').scrollIntoView({ block: 'center' }));
const clickDone = () => page.evaluate(() => { document.querySelector('.mp-node.st-done').click(); });
const pOn = peak(900); await clickDone(); const pk = await pOn;
check('som ligado: clicar no disco toca um som curto', pk > 0.005, pk.toFixed(3));
await go('#/kids/figuras'); await page.waitForSelector('.mp-node'); await sleep(900);
await page.click('.mp-snd'); await sleep(100);
check('botão de silenciar guarda a escolha', await page.evaluate(() => localStorage.getItem('beaterista-mapa-som') === '0'));
const pOff = peak(900); await clickDone(); const pk2 = await pOff;
check('som desligado: nenhum som ao clicar no disco', pk2 < 0.004, pk2.toFixed(4));
await go('#/kids/figuras'); await page.waitForSelector('.mp-node'); await sleep(400);
check('sair do mapa deixa o áudio quieto (sem som persistente)', (await peak(700)) < 0.004);

// teclado
await page.evaluate(() => { localStorage.setItem('beaterista-mapa-som', '1'); });
await go('#/kids/figuras'); await page.waitForSelector('.mp-node'); await sleep(400);
await page.focus('.mp-node.st-done'); await page.keyboard.press('ArrowUp');
check('teclado: seta move o foco pro próximo disco', await page.evaluate(() => document.activeElement.dataset.pos === '1'));
await page.keyboard.press('Enter'); await sleep(500);
check('teclado: Enter abre a fase liberada', (await hash()).startsWith('#/kids/figuras/1'), await hash());
await go('#/kids/figuras'); await page.waitForSelector('.mp-node'); await sleep(900);
check('voltar da fase centraliza a fase aberta por último', await page.evaluate(() => { const r = document.querySelectorAll('.mp-node')[1].getBoundingClientRect(); return r.top > 0 && r.bottom < innerHeight; }));

// celular: sem rolagem horizontal nem disco vazando em várias larguras
for (const w of [320, 360, 390, 430, 768]) {
  await page.setViewportSize({ width: w, height: 800 }); await sleep(250);
  const r = await page.evaluate(() => { const d = document.documentElement; const bad = [...document.querySelectorAll('.mp-node')].filter((n) => { const b = n.getBoundingClientRect(); return b.left < 0 || b.right > innerWidth; }).length; const tiny = [...document.querySelectorAll('.mp-node')].filter((n) => { const b = n.getBoundingClientRect(); return b.width < 44 || b.height < 44; }).length; return { sx: d.scrollWidth - d.clientWidth, bad, tiny }; });
  check(`${w}px: sem rolagem horizontal, discos dentro da tela e com área de toque ≥ 44px`, r.sx <= 0 && r.bad === 0 && r.tiny === 0, JSON.stringify(r));
}
await page.setViewportSize({ width: 390, height: 844 });
// movimento reduzido
await page.emulateMedia({ reducedMotion: 'reduce' }); await go('#/kids/eco'); await page.waitForSelector('.mp-node'); await sleep(300);
check('prefers-reduced-motion: sem animações no disco atual', await page.evaluate(() => getComputedStyle(document.querySelector('.st-current .mp-disc')).animationName === 'none'));
await page.emulateMedia({ reducedMotion: 'no-preference' });
// outros jogos com fases usam o mesmo mapa
for (const g of ['figuras', 'eco']) { await go(`#/kids/${g}`); await page.waitForSelector('.mp-node'); check(`jogo ${g} também tem o mapa (11 discos)`, (await states()).length === 11); }
// jogo que tem modos mantém o modo no link
await go('#/kids/eco/-/tela'); await page.waitForSelector('.mp-node'); await page.evaluate(() => document.querySelector('.st-current').click()); await sleep(400);
check('modo do jogo é mantido ao abrir a fase', (await hash()).endsWith('/tela'), await hash());
check('sem erros de JS/console', errs.length === 0, errs.slice(0, 3).join(' | '));
const fails = done(); await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
