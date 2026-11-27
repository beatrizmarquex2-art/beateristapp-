// Beaterista PRO (pro.html): entrada, perfil, alunos, aulas, agenda, biblioteca, estúdio. O servidor é simulado na memória (a RLS de verdade está em supabase/023_pro.sql).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch();
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
const DB = { pro_perfil: [], pro_alunos: [], pro_aulas: [], pro_eventos: [] }; let n = 0; let signups = 0;
const DEF = { pro_alunos: { instrumento: '', nivel: 'iniciante', idade: null, contato: '', metas: [], notas: '', ativo: true }, pro_aulas: { instrumento: '', idade: '', nivel: 'iniciante', duracao_min: 50, modelo: false, favorito: false, pasta: '', dados: {} }, pro_eventos: { aluno_id: null, aula_id: null, titulo: '', duracao_min: 50, status: 'marcada', nota: '' }, pro_perfil: { nome: '', escola: '', instrumentos: [], logo: null } };
const json = (r, b, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(b) });
await ctx.route('**/auth/v1/signup', (r) => { signups++; json(r, { access_token: 'tok', user: { id: 'u1', email: 'a@b.com' } }); });
await ctx.route('**/auth/v1/token**', (r) => json(r, { access_token: 'tok', refresh_token: 'r', expires_in: 3600, user: { id: 'u1', email: 'prof@exemplo.com' } }));
await ctx.route('**/rest/v1/partituras**', (r) => json(r, []));
await ctx.route('**/rest/v1/pro_*', async (r) => {
  const rq = r.request(); const u = new URL(rq.url()); const t = u.pathname.split('/').pop(); const m = rq.method(); const tab = DB[t];
  const filtra = () => tab.filter((x) => [...u.searchParams].every(([k, v]) => !v.startsWith('eq.') || String(x[k]) === v.slice(3)));
  if (m === 'GET') { let l = filtra(); const o = u.searchParams.get('order'); if (o) { const [c, d] = o.split('.'); l = [...l].sort((a, b) => String(a[c]).localeCompare(String(b[c])) * (d === 'desc' ? -1 : 1)); } return json(r, l); }
  if (m === 'POST') { const b = rq.postDataJSON() || {}; const row = { id: `id${++n}`, dono: 'u1', criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString(), ...DEF[t], ...b }; tab.push(row); return json(r, [row], 201); }
  if (m === 'PATCH') { const l = filtra(); l.forEach((x) => Object.assign(x, rq.postDataJSON(), { atualizado_em: new Date().toISOString() })); return json(r, l); }
  if (m === 'DELETE') { for (const x of filtra()) tab.splice(tab.indexOf(x), 1); return r.fulfill({ status: 204 }); }
  return r.fulfill({ status: 405 });
});
const shot = async (n) => { if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/pro-${n}.png` }); };
await page.setViewportSize({ width: 1280, height: 800 });
await page.goto(url + '/pro.html'); await sleep(1500);
check('sem login aparece a entrada do PRO', await page.locator('.pe-h').count() === 1 && await page.locator('.pe-logo').count() === 1);
await shot('1-entrada');
await page.locator('.pe-link').first().click();
await page.locator('input[name=nome]').fill('Bia Souza'); await page.locator('input[name=email]').fill('a@b.com'); await page.locator('input[name=senha]').fill('senha-forte-1');
await page.locator('.pe-form .pb').click(); await sleep(1800);
check('criar conta chama o servidor e já entra', signups === 1 && await page.locator('.psh').count() === 1);
check('o nome da conta vira o perfil e o início cumprimenta', DB.pro_perfil[0] && DB.pro_perfil[0].nome === 'Bia Souza' && /Bia/.test(await page.locator('.pt-top h1').innerText()));
await shot('2-inicio');
check('menu lateral com as 8 áreas', await page.locator('.ps-nav a').count() === 8);
await page.locator('.ps-rec').click(); await sleep(300);
check('menu recolhe e lembra', await page.locator('.psh.mini').count() === 1);
await page.locator('.ps-rec').click();

// alunos
await page.evaluate(() => { location.hash = '#/alunos'; }); await sleep(700);
await page.getByRole('button', { name: '+ Novo aluno' }).first().click(); await sleep(300);
await page.locator('dialog input').first().fill('Ana Lima'); await page.locator('dialog input[list]').fill('violão'); await page.locator('dialog button[type=submit]').click(); await sleep(900);
check('aluno cadastrado e ficha aberta', DB.pro_alunos.length === 1 && /Ana Lima/.test(await page.locator('.pt-cab h1').innerText()));
await page.locator('.pt-add input').fill('tocar a primeira música'); await page.locator('.pt-add button').click(); await sleep(600);
await page.locator('.pt-metas input[type=checkbox]').check(); await sleep(600);
check('meta criada e marcada (progresso 100%)', DB.pro_alunos[0].metas.length === 1 && DB.pro_alunos[0].metas[0].feita === true && /100%/.test(await page.locator('.pt-s').first().innerText()));
await page.locator('textarea').first().fill('prefere músicas lentas'); await page.locator('textarea').first().blur(); await sleep(500);
check('anotação particular salva', DB.pro_alunos[0].notas === 'prefere músicas lentas');
await page.getByRole('button', { name: 'Registrar aula dada' }).click(); await sleep(300); await page.locator('dialog textarea').fill('trabalhamos pegada'); await page.locator('dialog button[type=submit]').click(); await sleep(800);
await shot('3-aluno');
check('aula dada vai pro histórico do aluno', DB.pro_eventos.length === 1 && DB.pro_eventos[0].status === 'dada' && await page.locator('.pt-hist li').count() === 1);

// criador de aulas
await page.evaluate(() => { location.hash = '#/aulas/nova'; }); await sleep(700);
await page.locator('.pa-form input').first().fill('Groove básico'); await page.locator('.pa-form input[type=number]').first().fill('60');
await page.getByRole('button', { name: 'estrutura sugerida' }).click(); await sleep(300);
check('estrutura sugerida soma a duração da aula', await page.locator('.pa-et').count() === 5 && /60 min de 60/.test(await page.locator('.pa-tempo').innerText()));
await page.locator('.pa-form textarea').first().fill('tocar o groove em 80 bpm');
await page.locator('.pa-opc input').first().check(); await page.getByRole('button', { name: 'Salvar aula' }).click(); await sleep(900);
await shot('4-aula');
check('aula salva como modelo', DB.pro_aulas.length === 1 && DB.pro_aulas[0].modelo === true && DB.pro_aulas[0].dados.etapas.length === 5);
const dl = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
await page.getByRole('button', { name: 'Baixar PDF' }).click(); const d = await dl; await sleep(500);
check('PDF da aula é baixado', !!d && /\.pdf$/i.test(d.suggestedFilename()));

// agenda
await page.evaluate(() => { location.hash = '#/agenda'; }); await sleep(700);
await page.getByRole('button', { name: '+ Marcar aula' }).click(); await sleep(300);
await page.locator('dialog select').first().selectOption(DB.pro_alunos[0].id); await page.locator('dialog input[type=number]').last().fill('2'); await page.locator('dialog button[type=submit]').click(); await sleep(1200);
check('marcar com repetição cria 3 aulas semanais', DB.pro_eventos.filter((e) => e.status === 'marcada').length === 3);
await shot('5-semana');
check('aparece na semana', await page.locator('.pa-e').count() >= 1);
await page.getByRole('button', { name: 'mês' }).click(); await sleep(300);
await shot('5-mes');
check('visão do mês', await page.locator('.pa-c').count() >= 28);

// biblioteca e estúdio
await page.evaluate(() => { location.hash = '#/biblioteca'; }); await sleep(700);
await page.getByRole('tab', { name: /Modelos/ }).click(); await sleep(200);
check('modelo aparece na biblioteca', await page.locator('.pt-lista li').count() === 1);
await page.locator('.pt-lista .pb-i').click(); await sleep(500);
check('favoritar grava', DB.pro_aulas[0].favorito === true);
await page.evaluate(() => { location.hash = '#/estudio'; }); await sleep(500);
await page.locator('a[href="#/editor"]').click(); await sleep(1800);
await shot('6-editor');
check('editor de partitura abre dentro do PRO', await page.locator('.ep-kb').count() === 1);
await page.locator('.ep-ib[aria-label^="Voltar"]').click(); await sleep(500);
check('voltar do editor leva ao Estúdio', page.url().endsWith('#/estudio'));
await page.evaluate(() => { location.hash = '#/assistente'; }); await sleep(400);
check('assistente é honesto: sem caixa de texto de enfeite', await page.locator('.pas textarea, .pas input').count() === 0 && /ainda não está ligado/.test(await page.locator('.pas').innerText()));
// pedaleira (computador)
await page.evaluate(() => { location.hash = '#/pedaleira'; }); await sleep(600);
check('pedaleira tem os 4 botões redondos', await page.locator('.pp-b').count() === 4);
await page.locator('.pp-b[data-k="partitura"]').click(); await sleep(200);
check('painel da partitura tem "Nova partitura"', await page.locator('.pp-nova').count() === 1);
await page.locator('.pp-b[data-k="codigos"]').click(); await sleep(200);
check('Códigos diz com clareza que a ligação com o PLAY não está ativa', /ainda não está ativa/.test(await page.locator('.pp-painel').innerText()));
await page.locator('.pp-b[data-k="metronomo"]').click(); await sleep(600);
check('abre o metrônomo', await page.locator('.pm2-bpm').count() === 1);
for (const t of [0, 1, 2]) { await page.locator('.pm2-tap').dispatchEvent('pointerdown'); await sleep(500); }
const bpm = +(await page.locator('.pm2-bpm').innerText());
check('tap tempo ajusta o andamento (~120)', bpm >= 105 && bpm <= 135);
await page.locator('.pm2-pass').nth(2).click(); await sleep(100);
check('+1 aumenta o andamento', +(await page.locator('.pm2-bpm').innerText()) === bpm + 1);
await page.locator('.pm2-go').click(); await sleep(900);
check('metrônomo toca e o botão vira "parar"', /parar/.test(await page.locator('.pm2-go').innerText()));
await page.locator('.pm2-go').click();
await page.evaluate(() => { location.hash = '#/afinador'; }); await sleep(600);
check('afinador abre com as afinações e as cordas do violão', await page.locator('.pa2-afs button').count() === 6 && await page.locator('.pa2-cordas span').count() === 6);
// celular
await page.setViewportSize({ width: 390, height: 800 }); await page.evaluate(() => { location.hash = '#/pedaleira'; }); await sleep(600);
await shot('7-celular');
check('no celular aparece a barra de baixo com Pedaleira no centro', await page.locator('.pbar').isVisible() && await page.locator('.pbar a.central').count() === 1);
check('no celular o menu lateral some', !(await page.locator('.ps').boundingBox()).x > -1);
check('sem rolagem horizontal no celular', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
await page.locator('.pbar-mais').click(); await sleep(400);
check('"Mais" abre a gaveta', await page.locator('.psh.aberto').count() === 1);
await page.evaluate(() => document.querySelector('.ps-vel').click()); await sleep(300);
for (const r of ['#/inicio', '#/alunos', '#/agenda', '#/aulas', '#/biblioteca', '#/afinador', '#/metronomo']) { await page.evaluate((x) => { location.hash = x; }, r); await sleep(500); const ov = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1); if (ov) check(`sem estouro lateral no celular em ${r}`, false); }
await shot('8-celular-metronomo');
check('sem erros de script', errs.length === 0 || (console.log(errs), false));
await browser.close(); srv.close(); done();
