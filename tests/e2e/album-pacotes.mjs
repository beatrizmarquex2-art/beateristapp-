// Estrelas e pontuação dão pacotes pro álbum (aba Álbum, só com código): 1 por estrela nova dos Kids e 1 a cada 5 ★ de ritmo, sem entregar em dobro.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
const norm = (c) => String(c).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(norm(JSON.parse(r.request().postData() || '{}').p_code) === 'BEA0404') }));
await ctx.route('**/rest/v1/rpc/fig_entrar', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, nome: 'Ana', estado: null }) }));
await ctx.route('**/rest/v1/rpc/fig_salvar', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await ctx.route('**/*.supabase.co/**', (r) => (/\/rpc\/(fig_|aluno_codigo_ok)/.test(r.request().url()) ? r.fallback() : r.abort()));
await ctx.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Ana'); } catch { /* ok */ } });
await page.goto(url + '/aluno.html#/album'); await page.waitForSelector('.al-lock', { timeout: 10000 });
check('álbum trancado: pede código', (await page.locator('.fig-tabs').count()) === 0);
const r = await page.evaluate(async () => {
  const A = await import('/js/kids/album.js'); const P = await import('/js/kids/progress.js'); const FR = await import('/js/figurinhas/rewards.js');
  const me = P.active() || P.profiles()[0]; const antes = FR.pending();
  await P.patch(me.id, { ritmoStars: 29 }); const r0 = await A.sincronizar(me.id);          // 29 ★: ainda não
  await P.patch(me.id, { ritmoStars: 65 }); const r1 = await A.sincronizar(me.id); const r2 = await A.sincronizar(me.id); // 65 ★: 2 roletas; repetir não dá de novo
  await P.patch(me.id, { ritmoStars: 95 }); const r3 = await A.sincronizar(me.id);              // 95 ★: mais 1
  // jogo completo: todas as 11 fases de um jogo com pelo menos 1 estrela
  const lv = { ...(P.progOf(me.id).lv || {}) }; for (let l = 0; l <= 10; l++) lv[`figuras:${l}`] = { ...(lv[`figuras:${l}`] || {}), s: 1 }; await P.patch(me.id, { lv });
  const j1 = await A.premioKids(me.id, 'figuras'); const j2 = await A.premioKids(me.id, 'figuras'); const j3 = await A.premioKids(me.id, 'memoria');
  return { antes, r0, r1, r2, r3, j1, j2, j3, depois: FR.pending(), falta: A.EST.faltamParaRoleta(95) };
});
const av = await page.evaluate(async () => { const A = await import('/js/kids/album.js'); const e = A.rewardEl({ roletas: 2, jogos: 1 }); return { nulo: A.rewardEl(null) === null && A.rewardEl(undefined) === null && A.rewardEl({}) === null, txt: e ? e.textContent : '' }; });
check('aviso de recompensa: aceita null (modo livre) e mostra roletas + jogo completo', av.nulo && av.txt.includes('2 roletas liberadas') && av.txt.includes('jogo completo'), JSON.stringify(av));
check('29 ★ ainda não libera roleta', r.r0 === 0, JSON.stringify(r));
check('65 ★ = 2 roletas, e repetir não dá de novo', r.r1 === 2 && r.r2 === 0, JSON.stringify(r));
check('95 ★ = mais 1 roleta (a cada 30)', r.r3 === 1 && r.falta === 25, JSON.stringify(r));
check('jogo completo dá o prêmio uma vez só; outro jogo incompleto não dá', r.j1 === 1 && r.j2 === 0 && r.j3 === 0, JSON.stringify(r));
check('roletas e prêmio somam à lista de pacotes pra abrir', r.depois === r.antes + 4, JSON.stringify(r));
await page.locator('.al-lock-have summary').click(); await page.fill('.al-lock-have input', 'bea-0404'); await page.getByRole('button', { name: 'liberar' }).click(); await page.waitForSelector('.fig-tabs', { timeout: 10000 });
check('com o código, a aba Pacotes mostra os pacotes ganhos', /[3-9]/.test(await page.locator('.fig-tabs [role=tab]').last().textContent()), await page.locator('.fig-tabs [role=tab]').last().textContent());
await page.getByRole('tab', { name: /pacotes/ }).click(); await sleep(300);
check('a aba mostra roletas e prêmio', (await page.textContent('.fig-pack-card')).includes('roleta') && (await page.textContent('.fig-pack-card')).includes('prêmio'), await page.textContent('.fig-pack-card'));
check('o prêmio de jogo completo vem primeiro, depois as roletas, depois os pacotes', (await page.getByRole('button', { name: 'abrir o prêmio' }).count()) === 1);
await page.getByRole('button', { name: 'abrir o prêmio' }).click(); await page.waitForSelector('.fig-wheel-disc', { timeout: 5000 });
check('prêmio: cena própria, ainda não gastou', (await page.locator('.fig-reveal').count()) === 0 && (await page.textContent('.sheet')).includes('terminou um jogo inteiro'));
await page.locator('.sheet').getByRole('button', { name: 'abrir o prêmio' }).click(); await page.waitForSelector('.fig-reveal', { timeout: 9000 });
const top = await page.evaluate(async () => { const cat = await (await fetch('assets/figurinhas/catalogo.json')).json(); const nomes = [...document.querySelectorAll('.fig-reveal .fig-flip svg')].map((x) => x.getAttribute('aria-label') || ''); const rar = nomes.map((n) => (cat.find((c) => n.includes(`figurinha ${c.codigo}`)) || {}).raridade); return { n: nomes.length, rar }; });
check('prêmio: 3 figurinhas tops (exclusivas ou raras)', top.n === 3 && top.rar.every((r) => r === 'Exclusiva' || r === 'Rara'), JSON.stringify(top));
await page.locator('.sheet').getByRole('button', { name: 'colar depois' }).click(); await page.waitForSelector('.sheet-back', { state: 'detached', timeout: 5000 }).catch(() => {}); await sleep(400);
check('depois do prêmio, o botão passa a ser "girar a roleta"', (await page.getByRole('button', { name: 'girar a roleta' }).count()) === 1);
await page.getByRole('button', { name: 'girar a roleta' }).click(); await page.waitForSelector('.fig-wheel-disc', { timeout: 5000 });
check('abre a cena da roleta (ainda não gastou)', (await page.locator('.fig-reveal').count()) === 0 && (await page.locator('.sheet').getByRole('button', { name: 'girar!' }).count()) === 1);
await page.locator('.sheet').getByRole('button', { name: 'girar!' }).click(); await page.waitForSelector('.fig-reveal', { timeout: 9000 });
const nCartas = await page.locator('.fig-reveal .fig-flip').count();
check('depois de girar: ganha 1 ou 2 figurinhas', nCartas === 1 || nCartas === 2, String(nCartas));
check('as cartas já vêm abertas e o texto diz o que ganhou', (await page.locator('.fig-reveal .fig-flip.open').count()) === nCartas && (await page.textContent('.sheet')).includes('você ganhou'));
check('sem erros', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
