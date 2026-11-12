// Cara a Cara Musical: Kids solo completo (iPhone), clássico 12/20, contra Paul, dupla com tela de passe, sem erros de JS, sem scroll horizontal.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
import fs from 'node:fs';
const SHOT = process.env.SHOTS;
const { srv, url } = await serve();
const { browser } = await launch();
async function open(w = 390, h = 844) {
  const ctx = await context(browser, { viewport: { width: w, height: h }, isMobile: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_TUNNEL|net::/.test(m.text())) errs.push(m.text()); });
  await p.addInitScript(() => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); });
  await p.goto(`${url}/aluno.html#/jogos/cara`); await sleep(1200);
  const jog = p.locator('button:text-is("JOGAR")'); if (await jog.count()) { await jog.click(); await sleep(300); }
  p.errs = errs; return p;
}
const livre = async (p) => { const b = p.locator('button:has-text("Modo Livre"), a:has-text("Modo Livre")'); if (await b.count()) { await b.first().click(); await sleep(400); } };
const shot = async (p, n) => { if (SHOT) { fs.mkdirSync(SHOT, { recursive: true }); await p.screenshot({ path: `${SHOT}/${n}.png` }); } };
const hscroll = (p) => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const pickTema = async (p) => { await livre(p); await sleep(300); };

{ // KIDS SOLO
  const p = await open(); await pickTema(p); await shot(p, '01-menu');
  check('[menu] objetivo explicado', (await p.locator('.cm-root').innerText()).includes('Descubra o artista'));
  await p.locator('button:has-text("jogar")').first().click(); await sleep(800);
  check('[kids] tutorial aparece na primeira vez', (await p.locator('.cm-tut').count()) === 1); await shot(p, '02-tutorial');
  await p.locator('button:has-text("pular")').click(); await sleep(300);
  await p.locator('button:has-text("jogar")').first().click(); await sleep(1000);
  check('[kids] 6 cartas', (await p.locator('.cm-card').count()) === 6);
  const nomes = await p.locator('.cm-card small').allTextContents(); check('[kids] sem duplicatas', new Set(nomes).size === 6, nomes.join(','));
  check('[kids] perguntas no carrossel (3 visíveis por vez)', (await p.locator('.cm-carro .cm-qc').count()) >= 3);
  const min = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.cm-root .cm-card,.cm-root .cm-qc,.cm-root .btn')].map((e) => e.getBoundingClientRect().height)));
  const peq = await p.evaluate(() => [...document.querySelectorAll('.cm-root .cm-card,.cm-root .cm-qc,.cm-root .btn')].filter((e) => e.getBoundingClientRect().height < 43.5).map((e) => e.className + ':' + e.textContent.slice(0, 20))); check('[kids] alvos >= 44px', min >= 43.5, peq.join(';')); check('[kids] sem scroll horizontal', !(await hscroll(p))); await shot(p, '03-kids-jogo');
  const antes = await p.locator('.cm-cell:not(.out)').count();
  await p.locator('.cm-carro .cm-qc').first().click(); await sleep(400);
  check('[kids] resposta SIM/NÃO exibida', /SIM|NÃO/.test(await p.locator('.jg-msg').first().innerText()));
  check('[kids] virou automaticamente', (await p.locator('.cm-cell:not(.out)').count()) < antes); await shot(p, '04-kids-resposta');
  // palpites: erra 2 vezes escolhendo cartas vivas até acabar
  for (let i = 0; i < 3; i++) {
    if (await p.locator('.cm-ficha').count()) break;
    await p.locator('button:has-text("Adivinhar!")').click(); await sleep(200);
    await p.locator('.cm-cell:not(.out) .cm-card').nth(i % 2).click(); await sleep(200);
    await p.locator('button:has-text("sim, adivinhar!")').click(); await sleep(1400);
  }
  check('[kids] ficha final', (await p.locator('.cm-ficha').count()) >= 1); await shot(p, '05-kids-ficha');
  check('[kids] sem figurinhas/recompensa', !/figurinha|pacote|recompensa/i.test(await p.locator('.cm-root').innerText()));
  check('[kids] sem erros de JS', p.errs.length === 0, p.errs.join(' | '));
}
{ // CLÁSSICO 12 e 20
  for (const n of [12, 20]) {
    const p = await open(); await pickTema(p);
    await p.locator('button[role=radio]:has-text("clássico")').click(); await sleep(150);
    await p.locator(`button[role=radio]:has-text("${n} cartas")`).click(); await sleep(150);
    await p.locator('button:has-text("jogar")').first().click(); await sleep(1000);
    const nomes = await p.locator('.cm-card small').allTextContents(); check(`[clássico ${n}] ${n} cartas sem duplicata`, nomes.length === n && new Set(nomes).size === n);
    const q = p.locator('.cm-carro .cm-qc'); const c = await q.count(); check(`[clássico ${n}] perguntas listadas`, c >= 3, String(c));
    const t = await q.first().innerText(); await q.first().click(); await sleep(300);
    check(`[clássico ${n}] pergunta não repete`, (await p.locator('.cm-carro .cm-qc').allTextContents()).every((x) => x !== t));
    check(`[clássico ${n}] sem scroll horizontal`, !(await hscroll(p))); if (n === 20) await shot(p, '06-classico20');
    check(`[clássico ${n}] sem erros`, p.errs.length === 0, p.errs.join('|'));
  }
}
{ // CONTRA PAUL
  const p = await open(); await pickTema(p);
  await p.locator('button[role=radio]:has-text("contra o Paul")').click(); await sleep(150);
  await p.locator('button:has-text("jogar")').first().click(); await sleep(800);
  if (await p.locator('.cm-tut').count()) { await p.locator('button:has-text("pular")').click(); await sleep(200); await p.locator('button:has-text("jogar")').first().click(); await sleep(800); }
  await p.locator('.cm-card').first().click(); await sleep(300); await shot(p, '07-paul-escolha');
  await p.locator('button:has-text("esta é a minha carta secreta")').click(); await sleep(800);
  check('[paul] mostra minha carta', (await p.locator('.cm-minha').count()) === 1);
  await p.locator('.cm-carro .cm-qc').first().click(); await sleep(2500);
  check('[paul] Paul perguntou', /Paul perguntou/.test(await p.locator('.jg-msg').first().innerText())); await shot(p, '08-paul-jogo');
  check('[paul] placar', (await p.locator('.cm-placar').count()) === 1);
  check('[paul] sem erros', p.errs.length === 0, p.errs.join('|'));
}
{ // DUPLA
  const p = await open(); await pickTema(p);
  await p.locator('button[role=radio]:has-text("dupla")').click(); await sleep(150);
  await p.locator('button:has-text("jogar")').first().click(); await sleep(800);
  if (await p.locator('.cm-tut').count()) { await p.locator('button:has-text("pular")').click(); await sleep(200); await p.locator('button:has-text("jogar")').first().click(); await sleep(800); }
  await p.locator('.cm-card').first().click(); await sleep(300); await p.locator('button:has-text("esta é a minha carta secreta")').click(); await sleep(400);
  check('[dupla] tela de passe', (await p.locator('.cm-passe').count()) === 1); await shot(p, '09-dupla-passe');
  check('[dupla] não mostra carta na tela de passe', (await p.locator('.cm-passe .cm-card').count()) === 0);
  check('[dupla] sem erros', p.errs.length === 0, p.errs.join('|'));
}
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
