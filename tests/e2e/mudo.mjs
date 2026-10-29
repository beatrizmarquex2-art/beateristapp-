// Ícone de som no topo: liga/desliga o som de tudo.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
const { browser, ctx } = await launch();
const page = await ctx.newPage();
await page.goto(`${url}/aluno.html`); await sleep(800);
await page.evaluate(() => { localStorage.setItem("beaterista-aluno-nome", "Teste"); }); await page.reload(); await sleep(1500);
await page.waitForSelector('.top-snd');
const lab = () => page.getAttribute('.top-snd', 'aria-label');
check('começa com som ligado', /ligado/.test(await lab()));
await page.click('.top-snd');
check('toque desliga', /desligado/.test(await lab()));
check('guarda a escolha', (await page.evaluate(() => localStorage.getItem('bt-mute'))) === '1');
const g = await page.evaluate(async () => { const m = await import('/js/audio.js'); return m.out().gain.value; });
check('volume zerado', g === 0, String(g));
await page.click('.top-snd');
const g2 = await page.evaluate(async () => (await import('/js/audio.js')).out().gain.value);
check('religa', g2 > 0.5, String(g2));
const fails = done(); await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
