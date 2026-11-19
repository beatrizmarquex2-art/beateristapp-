// Topo dos alunos: o nome aparece sem "oi", a chave de "tenho código" é ícone de linha (não emoji), o avatar é a foto do perfil (ou o Paul) e abre a aba Perfil.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ codigo: false });
await ctx.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Bea'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await p.goto(`${url}/aluno.html#/jogos`); await sleep(2000);
const nome = (await p.locator('.al-quem-top > span').innerText()).trim();
check('o nome aparece sem "oi"', nome === 'Bea', nome);
check('a chave é ícone de linha (svg), sem emoji', (await p.locator('.al-tenho svg').count()) === 1 && !/🔑/.test(await p.locator('.al-tenho').innerText()));
const cor = await p.evaluate(() => [...document.querySelectorAll('.top-a .icon-btn, .top-a .al-tenho, .top-a .al-opt')].map((b) => getComputedStyle(b).color));
check('a chave tem a mesma cor dos outros símbolos', new Set(cor).size === 1, cor.join(' | '));
check('sem foto, o avatar é o Paul', !(await p.locator('.top-av.com-foto').count()) && /paul-ouvindo/.test(await p.locator('.top-av img').getAttribute('src')));
// põe uma foto de perfil (guardada só neste aparelho) e recarrega
await p.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#2a9d8f'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#e76f51'; g.beginPath(); g.arc(32, 26, 14, 0, 7); g.fill();
  const blob = await new Promise((r) => c.toBlob(r, 'image/png')); const D = await import('/js/figurinhas/dono.js'); await D.metaGravar('perfil-foto', blob); window.dispatchEvent(new Event('bt-foto-perfil'));
});
await sleep(800);
check('com foto de perfil, o avatar mostra a foto', (await p.locator('.top-av.com-foto').count()) === 1 && /^blob:/.test(await p.locator('.top-av img').getAttribute('src')));
await p.screenshot({ path: process.argv[2] ? `${process.argv[2]}/topo-foto.png` : '/dev/null', clip: { x: 0, y: 0, width: 390, height: 70 } });
await p.locator('.top-av').click(); await sleep(1200);
check('tocar na foto abre direto o Perfil', (await p.evaluate(() => location.hash)) === '#/perfil', await p.evaluate(() => location.hash));
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
