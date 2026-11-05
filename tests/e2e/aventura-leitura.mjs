// Leitura das telas de aventura: nada de texto sobreposto ou cortado pela tela (texto só pra leitor de tela fica de fora), em 390 e 320 px, nos 9 jogos (mapa, briefing e missão).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch({ viewport: { width: 390, height: 844 } });
const GAMES = [['cartas', '#/jogos/cartas/aventura'], ['bingo', '#/jogos/bingo/aventura'], ['stop', '#/jogos/stop/aventura'], ['velha', '#/jogos/velha/aventura'], ['quebra', '#/jogos/quebra/aventura'], ['cara', '#/jogos/cara/aventura'], ['memoria', '#/kids/memoria/aventura'], ['monte', '#/kids/ritmo/aventura'], ['noritmo', '#/ritmo/aventura']];
const audit = () => {
  const out = []; const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.3; };
  const inScroller = (e) => { for (let n = e.parentElement; n; n = n.parentElement) { const o = getComputedStyle(n).overflowX; if ((o === 'auto' || o === 'scroll') && n.scrollWidth > n.clientWidth) return true; } return false; };
  const texts = [...document.querySelectorAll('.av *, .mp *')].filter((e) => vis(e) && !e.closest('svg, .mp-head, .sr-only') && !(e.closest('details:not([open])') && !e.closest('summary')) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1));
  const boxes = texts.map((e) => { let L = 1e9, T = 1e9, R = -1e9, B = -1e9; for (const n of e.childNodes) { if (n.nodeType !== 3 || !n.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(n); const q = rg.getBoundingClientRect(); L = Math.min(L, q.left); T = Math.min(T, q.top); R = Math.max(R, q.right); B = Math.max(B, q.bottom); } return { e, r: { left: L, top: T, right: R, bottom: B, width: R - L }, t: e.textContent.trim().slice(0, 28) }; }).filter((b) => b.r.width > 2); // só o texto do próprio elemento (não o de filhos escondidos)
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j]; if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
    const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (ox > 3 && oy > 3) out.push(`sobreposto: "${a.t}" × "${b.t}"`);
  }
  for (const b of boxes) if (!inScroller(b.e) && (b.r.right > innerWidth + 1 || b.r.left < -1)) out.push(`fora da tela: "${b.t}"`);
  if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) out.push('rolagem horizontal');
  // contraste: não medido aqui (muitos fundos são papel/pseudo-elementos); conferido por inspeção visual dos prints.
  return out;
};
for (const w of [390, 320]) {
  const page = await ctx.newPage(); await page.setViewportSize({ width: w, height: 800 });
  await page.addInitScript(() => localStorage.setItem('beaterista-aluno-nome', 'Teste'));
  for (const [id, hash] of GAMES) {
    await page.goto(url + '/aluno.html' + hash); await page.waitForSelector('.mp-node', { timeout: 8000 }).catch(() => {}); await sleep(1400);
    const H = await page.evaluate(() => (document.querySelector('.mp-world') || { getBoundingClientRect: () => ({ height: 0 }) }).getBoundingClientRect().height);
    const iss = new Set(); for (const f of [0, 0.5, 1]) { await page.evaluate((y) => window.scrollTo(0, y), f * H); await sleep(200); (await page.evaluate(audit)).forEach((x) => iss.add(x)); }
    check(`${w}px ${id} mapa legível`, !iss.size, [...iss].slice(0, 4).join(' | '));
    await page.goto(url + '/aluno.html' + hash + '/0'); await page.waitForSelector('.av-go', { timeout: 6000 }).catch(() => {}); await sleep(700);
    const b = await page.evaluate(audit); check(`${w}px ${id} briefing legível`, !b.length, b.slice(0, 4).join(' | '));
    await page.click('.av-go').catch(() => {}); await sleep(1400);
    const m = await page.evaluate(audit); check(`${w}px ${id} missão legível`, !m.length, m.slice(0, 4).join(' | '));
  }
  await page.close();
}
const fails = done(); await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
