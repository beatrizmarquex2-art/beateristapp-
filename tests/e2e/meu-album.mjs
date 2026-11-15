// Meu álbum: as cartinhas criadas pelo aluno ficam em "pra colar" e ele cola em espaços numerados (só neste aparelho, por nome).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch();
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"tipo":"aluno"}' }));
await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); } catch (e) {} });
await page.goto(url + '/aluno.html#/jogos'); await sleep(1800);
await page.evaluate(async () => { // 3 cartinhas falsas direto no aparelho (o mesmo lugar onde o criador guarda)
  const { db } = await import('/js/db.js'); const D = await import('/js/figurinhas/dono.js');
  const cor = ['#8e1b2c', '#17365b', '#1f6f78']; const itens = [];
  for (let i = 0; i < 3; i++) { const c = document.createElement('canvas'); c.width = 360; c.height = 475; const g = c.getContext('2d'); g.fillStyle = cor[i]; g.fillRect(0, 0, 360, 475); g.fillStyle = '#fff'; g.font = '60px sans-serif'; g.fillText(`C${i + 1}`, 120, 250);
    const b = await new Promise((ok) => c.toBlob(ok, 'image/png')); const id = `t${i}`; await db.metaSet(`minha-carta:${id}`, b); itens.push({ id, sig: id, fotoSig: id, nome: `carta ${i + 1}`, modelo: 'M1', em: Date.now() }); }
  await D.metaGravar('minhas-cartinhas', itens);
});
await page.evaluate(() => { location.hash = '#/album/Minhas'; }); await page.waitForSelector('.ma', { timeout: 20000 }); await sleep(900);
check('álbum com o nome do aluno, 6 espaços na página e 3 cartinhas pra colar', await page.evaluate(() => /álbum de Teste/i.test(document.querySelector('.ma-tit').textContent) && document.querySelectorAll('.ma-esp').length === 6 && document.querySelectorAll('.ma-solta').length === 3 && document.querySelectorAll('.ma-esp.cheia').length === 0));
await page.evaluate(() => document.querySelector('.ma').scrollIntoView({ block: 'start' })); await sleep(300); await page.screenshot({ path: `${process.env.SHOTS || '/tmp'}/meu-album-1.png` });
await page.evaluate(() => document.querySelector('.ma-solta[data-id="t1"]').click()); await sleep(400);
check('escolher uma cartinha destaca os espaços vazios', await page.evaluate(() => document.querySelectorAll('.ma-esp.alvo').length === 6 && /toque num espaço/.test(document.querySelector('.ma-mao-top b').textContent)));
await page.evaluate(() => document.querySelector('.ma-esp[data-slot="5"]').click()); await sleep(700);
check('ela cola no espaço escolhido (5) e sai do "pra colar"', await page.evaluate(() => document.querySelector('.ma-esp[data-slot="5"]').classList.contains('cheia') && document.querySelectorAll('.ma-solta').length === 2));
await page.evaluate(() => document.querySelector('.ma-todas').click()); await sleep(900);
check('"colar todas" cola o resto nos primeiros espaços vazios', await page.evaluate(() => ['1', '2', '5'].every((n) => document.querySelector(`.ma-esp[data-slot="${n}"]`).classList.contains('cheia')) && document.querySelector('.ma-mao').hidden));
await page.evaluate(() => document.querySelector('.ma').scrollIntoView({ block: 'start' })); await sleep(300); await page.screenshot({ path: `${process.env.SHOTS || '/tmp'}/meu-album-2.png` });
await page.reload(); await page.waitForSelector('.ma', { timeout: 20000 }); await sleep(900);
check('continua colado depois de fechar e abrir (fica no aparelho)', await page.evaluate(() => document.querySelectorAll('.ma-esp.cheia').length === 3));
const outra = await page.evaluate(async () => { localStorage.setItem('beaterista-aluno-nome', 'Outra'); const M = await import('/js/figurinhas/minhas.js'); const l = await M.listar(); localStorage.setItem('beaterista-aluno-nome', 'Teste'); return [l.length, (await M.listar()).filter((x) => x.slot).length]; });
check('outro aluno no mesmo celular tem o álbum dele, vazio; o do primeiro continua lá', outra[0] === 0 && outra[1] === 3, JSON.stringify(outra));
check('sem erro de página', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
