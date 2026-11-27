// Prêmios do passe na Lojinha (só pra quem comprou) e o botão "atualizar" que mudou do Perfil pro Início.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve();
async function abrir(codigo, hash) {
  const { browser, ctx } = await launch({ codigo }); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await ctx.route('**/*.supabase.co/**', (r) => r.fallback());
  await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
  await page.goto(`${url}/aluno.html#/${hash}`); await sleep(2200); return { browser, page, errs };
}
{ // quem comprou (tem código)
  const { browser, page, errs } = await abrir(true, 'lojinha');
  check('com o passe: aparece "Seus prêmios do passe" e some o Passe à venda', (await page.locator('#lj-premios').count()) === 1 && (await page.locator('#lj-passe').count()) === 0);
  check('12 wallpapers, 7 banners, 9 planners e as folhas de colorir estão lá', (await page.locator('#lj-premios .pm-w:not(.pm-p)').count()) === 12 && (await page.locator('#lj-premios .pm-b').count()) === 7 && (await page.locator('#lj-premios .pm-p').count()) === 9 && (await page.locator('#lj-premios .pm-item').count()) === 1);
  check('todos os arquivos de prêmio existem (nenhum 404)', await page.evaluate(async () => { const m = await import('/js/premios-config.js'); const l = [...[...m.WALLPAPERS, ...m.BANNERS, ...m.PLANNERS].flatMap((w) => [w.arquivo, w.mini]), m.COLORIR.arquivo, m.COLORIR.mini, ...m.FIGURINHAS.codigos.map((c) => `assets/figurinhas/mini/${c}.webp`)]; const r = await Promise.all(l.map((u) => fetch(u, { method: 'HEAD' }).then((x) => x.ok))); return r.every(Boolean); }));
  check('o banner de oferta do acesso anual não aparece pra quem já tem o passe', (await page.locator('.ljv-banner[data-id="anual"]').count()) === 0);
  await sleep(800);
  const g = await page.evaluate(async () => { const R = await import('/js/figurinhas/rewards.js'); return R.stateOf().granted; });
  check('as 3 figurinhas exclusivas foram entregues no baú (uma vez só)', g.filter((id) => id.startsWith('dado:') && id.endsWith(':passe')).length === 1, g.join('|'));
  await page.reload(); await sleep(2200);
  const g2 = await page.evaluate(async () => { const R = await import('/js/figurinhas/rewards.js'); return R.stateOf().granted.filter((id) => id.endsWith(':passe')).length; });
  check('abrir de novo não entrega em dobro', g2 === 1, String(g2));
  check('as 48 folhas de colorir da semana existem (nenhum 404)', await page.evaluate(async () => { const m = await import('/js/premios-config.js'); const r = await Promise.all(m.COLORIR_PAGINAS.flatMap((c) => [c.arquivo, c.mini]).map((u) => fetch(u, { method: 'HEAD' }).then((x) => x.ok))); return m.COLORIR_PAGINAS.length === 48 && r.every(Boolean); }));
  await page.evaluate(async () => { const S = await import('/js/store.js'); const D = await import('/js/figurinhas/dono.js'); const L = await import('/js/figurinhas/album-logic.js'); await S.upsert('figurinhas', D.albumId(), { ...L.emptyState(), ...D.albumDados(), sem: { ult: '2026-11-20', seq: 3, ciclo: 2 } }); });
  await page.goto(`${url}/aluno.html#/album/Pacotes`); await sleep(2200);
  check('no check-in da semana aparecem os prêmios das 2 semanas fechadas: 1 wallpaper + 2 folhas de colorir cada', (await page.locator('.pm-sem .pm-sem-linha').count()) === 2 && (await page.locator('.pm-sem .pm-sem-wp').count()) === 2 && (await page.locator('.pm-sem .pm-sem-cl').count()) === 4 && /1 wallpaper \+ 2 folhas/.test(await page.locator('.fig-semana').textContent()));
  await page.evaluate(async () => { const S = await import('/js/store.js'); const D = await import('/js/figurinhas/dono.js'); const L = await import('/js/figurinhas/album-logic.js'); await S.upsert('figurinhas', D.albumId(), { ...L.emptyState(), ...D.albumDados(), rm: { t: 5, ids: [], dia: '', n: 0, g: 0, sur: [] } }); });
  await page.goto(`${url}/aluno.html#/jogos`); await sleep(400); await page.goto(`${url}/aluno.html#/album/Pacotes`); await sleep(1800);
  await page.getByRole('tab', { name: /resgatar/i }).click(); await sleep(600);
  check('resgatar: roleta maluca + tabela com Desafio, Google, 3 redes, postagem e amigo', (await page.locator('.rs-maluca').count()) === 1 && (await page.locator('.rs-tab tbody tr').count()) === 9);
  for (let i = 0; i < 3; i++) { await page.getByRole('button', { name: 'girar', exact: true }).click(); await sleep(i === 2 ? 4200 : 600); await page.keyboard.press('Escape'); await sleep(300); }
  const rm = await page.evaluate(async () => { const D = await import('/js/figurinhas/dono.js'); return D.albumDados().rm; });
  check('3 giros no dia e o limite trava o 4º', rm.n === 3 && (rm.t === 2 || rm.t > 2) && (await page.getByRole('button', { name: /volte amanhã/ }).count()) === 1, JSON.stringify(rm));
  await page.goto(`${url}/aluno.html#/inicio`); await sleep(1800);
  check('o botão "atualizar agora" e a versão estão no Início', (await page.locator('.al-versao .btn', { hasText: 'atualizar agora' }).count()) === 1);
  await page.goto(`${url}/aluno.html#/perfil`); await sleep(1800);
  check('e não estão mais no Perfil', (await page.locator('.al-versao').count()) === 0);
  check('sem erros (com passe)', errs.length === 0, errs.join('|')); await browser.close();
}
{ // visitante sem código
  const { browser, page, errs } = await abrir(false, 'lojinha');
  check('sem o passe: não vê prêmios, vê o Passe à venda', (await page.locator('#lj-premios').count()) === 0 && (await page.locator('#lj-passe').count()) === 1);
  check('sem erros (visitante)', errs.length === 0, errs.join('|')); await browser.close();
}
srv.close(); done();
