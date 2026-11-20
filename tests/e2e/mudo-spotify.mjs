// Mudo = o app NÃO segura o áudio do celular (o Spotify de fone continua tocando). Simula navigator.audioSession e conta os <audio>.play().
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch();
const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 844 }); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 150)));
await p.addInitScript(() => {
  window.__tipos = []; let t = 'auto'; Object.defineProperty(navigator, 'audioSession', { value: { get type() { return t; }, set type(v) { t = v; window.__tipos.push(v); } }, configurable: true });
  window.__plays = 0; window.__pauses = 0; const pl = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { window.__plays++; return pl.apply(this, arguments); }; const pa = HTMLMediaElement.prototype.pause; HTMLMediaElement.prototype.pause = function () { window.__pauses++; return pa.apply(this, arguments); };
  try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch {}
});
await p.goto(`${url}/aluno.html#/jogos`); await sleep(1500);
for (let i = 0; i < 4; i++) { await p.mouse.click(200, 300 + i * 40); await sleep(150); }
check('mudo: a sessão de áudio fica em "ambient" (mistura com o Spotify)', (await p.evaluate(() => navigator.audioSession.type)) === 'ambient', await p.evaluate(() => navigator.audioSession.type));
check('mudo: nunca pede "playback" e não toca o áudio de fundo (que segura o celular)', !(await p.evaluate(() => window.__tipos)).includes('playback') && (await p.evaluate(() => window.__plays)) === 0, JSON.stringify(await p.evaluate(() => [window.__tipos, window.__plays])));
// liga o som: volta ao "playback" (som sai mesmo no silencioso) e toca o áudio mudo de fundo
await p.evaluate(async () => { const A = await import('/js/audio.js'); A.setMuted(false); A.audio(); }); await p.mouse.click(200, 300); await sleep(400);
check('som ligado: sessão "playback" e áudio de fundo tocando', (await p.evaluate(() => navigator.audioSession.type)) === 'playback' && (await p.evaluate(() => window.__plays)) >= 1, await p.evaluate(() => navigator.audioSession.type));
// silencia de novo: solta a sessão e pausa o áudio de fundo
const pausasAntes = await p.evaluate(() => window.__pauses);
await p.evaluate(async () => { const A = await import('/js/audio.js'); A.setMuted(true); }); await sleep(300);
check('silenciar de novo: volta a "ambient" e pausa o áudio de fundo', (await p.evaluate(() => navigator.audioSession.type)) === 'ambient' && (await p.evaluate(() => window.__pauses)) > pausasAntes, await p.evaluate(() => navigator.audioSession.type));
// o microfone ainda precisa de "play-and-record"; ao fechar no mudo volta a "ambient"
await p.evaluate(async () => { const A = await import('/js/audio.js'); A.micSession(true); }); const mic = await p.evaluate(() => navigator.audioSession.type);
await p.evaluate(async () => { const A = await import('/js/audio.js'); A.micSession(false); }); const fechou = await p.evaluate(() => navigator.audioSession.type);
check('microfone aberto = "play-and-record"; fechou no mudo = "ambient"', mic === 'play-and-record' && fechou === 'ambient', `${mic} → ${fechou}`);
check('sem erro na página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
