// iPad/iPhone: com a sessão de áudio em "playback" o microfone chega mudo. Aqui o Chromium ganha um navigator.audioSession falso e conferimos:
// enquanto o microfone está aberto a sessão é "play-and-record" (e os toques não a derrubam de volta), e quando ele fecha volta pra "playback".
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: true });
const p = await ctx.newPage(); await p.setViewportSize({ width: 820, height: 1180 }); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().url().includes('aluno_codigo_ok') ? 'true' : '[]' }));
await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } window.__sess = []; let t = 'auto'; Object.defineProperty(navigator, 'audioSession', { value: { get type() { return t; }, set type(v) { t = v; window.__sess.push(v); } }, configurable: true }); });
await p.goto(`${url}/aluno.html#/jogos/toca/livre`); await p.waitForSelector('.tr-pad', { timeout: 20000 }); await sleep(800);
await p.locator('[role=radio]:has-text("microfone")').click(); await sleep(300);
await p.locator('button:has-text("tocar direto")').click(); await sleep(1800);
const durante = await p.evaluate(() => navigator.audioSession.type);
check('com o microfone aberto, a sessão de áudio é "play-and-record"', durante === 'play-and-record', durante);
await p.mouse.click(200, 500); await sleep(300); // um toque qualquer na tela não derruba a sessão de volta pra "playback"
check('um toque na tela não volta a sessão pra "playback" enquanto o microfone está aberto', (await p.evaluate(() => navigator.audioSession.type)) === 'play-and-record');
await p.waitForSelector('.tr-res', { timeout: 40000 }); await sleep(500);
const depois = await p.evaluate(() => navigator.audioSession.type);
check('depois do compasso o microfone fecha e a sessão volta pra "playback"', depois === 'playback', `${depois} · ${JSON.stringify(await p.evaluate(() => window.__sess))}`);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
