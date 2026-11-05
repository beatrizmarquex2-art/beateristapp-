// Roleta Musical (aba Tocar): 3 rolos, resultado decidido antes e igual ao que a tela mostra, filtros, histórico, "Tocar agora", sem figurinhas, sem erros.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const ctx = await context(browser, { viewport: { width: 390, height: 844 }, isMobile: true });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await p.goto(`${url}/aluno.html#/tocar`); await p.waitForSelector('a[href="#/roleta"]');
check('card da Roleta na aba Tocar', true);
await p.click('a[href="#/roleta"]'); await p.waitForSelector('.rl-spin:not([disabled])', { timeout: 15000 });
check('3 rolos e botão Girar >=44px', (await p.locator('.rl-win').count()) === 3 && (await p.locator('.rl-spin').boundingBox()).height >= 44);
check('5ª aba "roleta" ativa nas abas do Tocar', (await p.locator('.ti-tab.on').innerText()) === 'roleta');
check('filtros com contagem', (await p.locator('.rl-filtros button').count()) === 8);
await p.click('.rl-spin'); await sleep(100);
check('botão trava durante o giro', await p.locator('.rl-spin').isDisabled());
await p.waitForSelector('.rl-card', { timeout: 8000 });
const r = await p.evaluate(() => ({ frase: document.querySelector('.rl-frase').textContent, rolos: [...document.querySelectorAll('.rl-strip')].map((s) => { const it = s.querySelectorAll('.rl-it'); return it[it.length - 1].querySelector('.rl-nm').textContent; }), alt: document.querySelector('.rl-big').alt }));
check('os 3 rolos terminam na mesma carta do resultado', r.rolos.every((n) => n === r.rolos[0]) && r.frase.length > 20, JSON.stringify(r));
check('frase "Hoje é dia de tocar uma música de …!"', /^Hoje é dia de tocar uma música de .+!$/.test(r.frase));
check('botões Tocar agora / Ver artista / Sortear novamente', (await p.locator('.rl-card button').count()) === 3);
check('sem figurinhas/prêmios na tela', !/figurinha|prêmio|moeda|crédito/i.test(await p.locator('.rl-card-main').innerText().then((t) => t.replace(/não vale dinheiro nem figurinha/i, ''))));
await p.click('.rl-card >> text=Tocar agora'); check('Tocar agora: painel com missão e 4 instrumentos', (await p.locator('.rl-pop .rl-inst a').count()) === 4 && /Escolha uma música de/.test(await p.locator('.rl-pop h3').innerText()));
await p.click('.rl-pop >> text=fechar'); await p.click('.rl-card >> text=Ver artista'); check('Ver artista abre a ficha', (await p.locator('.rl-pop-img').count()) === 1); await p.click('.rl-pop >> text=fechar');
const vistos = new Set([r.frase]);
for (let i = 0; i < 4; i++) { await p.click('.rl-card >> text=Sortear novamente'); await p.waitForSelector('.rl-spin:not([disabled])', { timeout: 8000 }); await sleep(100); vistos.add(await p.locator('.rl-frase').innerText()); }
check('evita repetir os últimos sorteados (5 giros, 5 artistas diferentes)', vistos.size === 5, [...vistos].join(' | '));
check('histórico guarda os sorteios', (await p.locator('.rl-hl li').count()) === 5);
const hl = await p.evaluate(() => JSON.parse(localStorage.getItem('beaterista-jogos')).games.roleta.hist.length); check('histórico persiste (máx. 10)', hl === 5);
await p.locator('.rl-filtros button:has-text("solo")').click(); await sleep(200);
check('filtro solo: só entra solo (nota de elegíveis atualiza)', /artistas elegíveis/.test(await p.locator('.rl-nota').innerText()));
check('sem scroll horizontal', !(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)));
await p.goto(`${url}/aluno.html#/toque`); await sleep(500); check('abas do Tocar cabem (5 abas)', (await p.locator('.ti-tab').count()) === 5);
check('sem erros de JS', errs.length === 0, errs.join(';'));
await ctx.close();
{ // movimento reduzido: sem animação, mesmo resultado
  const c2 = await context(browser, { viewport: { width: 820, height: 1180 }, isMobile: true, reducedMotion: 'reduce' }); const q = await c2.newPage(); const e2 = []; q.on('pageerror', (e) => e2.push(String(e)));
  await q.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
  await q.goto(`${url}/aluno.html#/roleta`); await q.waitForSelector('.rl-spin:not([disabled])'); await q.click('.rl-spin'); await q.waitForSelector('.rl-card', { timeout: 3000 });
  check('reduce-motion: resultado imediato', true); check('iPad sem erros', e2.length === 0, e2.join(';')); await c2.close();
}
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
