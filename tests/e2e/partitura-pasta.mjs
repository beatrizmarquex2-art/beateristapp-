// Pasta online das partituras: guardar, abrir, editar de novo, procurar por nome (sem se importar com acento), apagar, e a aba Professores da Bea (todas as pastas).
import { serve, launch, sleep, check, done, fakeLogin } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
const db = [
  { id: 'p-1', dono: 'u-leo', dono_nome: 'leo', nome: 'Escala de dó', instrumento: 'teclas', dados: { evs: [{ m: 60, ini: 0, d: 4 }, { m: 62, ini: 4, d: 4 }], bpm: 90, grade: 2, clave: 'sol', cor: false }, criado_em: '2026-11-25T10:00:00Z', atualizado_em: '2026-11-25T10:00:00Z' },
  { id: 'p-2', dono: 'u-andre', dono_nome: 'andre', nome: 'Melodia do Pôr do Sol', instrumento: 'teclas', dados: { evs: [{ m: 67, ini: 0, d: 8 }], bpm: 100, grade: 2, clave: 'sol', cor: false }, criado_em: '2026-11-24T10:00:00Z', atualizado_em: '2026-11-24T10:00:00Z' },
];
const posts = []; const patches = []; const dels = []; let fora = false;
await fakeLogin(ctx, page, url);
await ctx.route('**/rest/v1/partituras**', async (r) => { const m = r.request().method(); const u = r.request().url(); const json = (b, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(b) });
  if (fora) return r.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  if (m === 'GET') { const id = /id=eq\.([^&]+)/.exec(u); return json(id ? db.filter((x) => x.id === decodeURIComponent(id[1])) : db.map(({ dados, ...x }) => x)); }
  if (m === 'POST') { const b = JSON.parse(r.request().postData()); posts.push(b); const row = { id: 'p-novo', dono: 'u-bea', criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString(), ...b }; db.unshift(row); return json([row], 201); }
  if (m === 'PATCH') { const id = decodeURIComponent(/id=eq\.([^&]+)/.exec(u)[1]); const b = JSON.parse(r.request().postData()); patches.push({ id, ...b }); const row = db.find((x) => x.id === id); Object.assign(row, b, { atualizado_em: new Date().toISOString() }); return json([row]); }
  if (m === 'DELETE') { const id = decodeURIComponent(/id=eq\.([^&]+)/.exec(u)[1]); dels.push(id); const i = db.findIndex((x) => x.id === id); if (i >= 0) db.splice(i, 1); return r.fulfill({ status: 204, body: '' }); }
  return json([]); });
const clica = async (m) => { await page.locator(`.pn-w[data-m="${m}"]`).click({ force: true, noWaitAfter: true }); await sleep(110); };
const para = (rotulo, alvo) => page.evaluate(async ([r, a]) => { const esp = (ms) => new Promise((k) => setTimeout(k, ms)); for (let i = 0; i < 12; i++) { const g = [...document.querySelectorAll('.pm-seta')].find((x) => x.getAttribute('aria-label') === r); if (!g) return false; if (g.querySelector('output').textContent === a) return true; g.querySelectorAll('button')[1].click(); await esp(60); } return false; }, [rotulo, alvo]);
const botao = (t) => page.evaluate((x) => { const b = [...document.querySelectorAll('.pm-painel button, .sheet button')].find((y) => y.textContent.trim() === x); if (b) b.click(); return !!b; }, t);

await page.evaluate(() => { location.hash = '#/piano'; }); await sleep(2400);
await page.evaluate(() => [...document.querySelectorAll('.kd-modelos .kd-chip')].find((b) => b.textContent.includes('partitura')).click()); await sleep(500);
for (const m of [60, 62, 64]) await clica(m);
check('sem nome, não guarda e avisa', await (async () => { await botao('guardar na pasta'); await sleep(300); return posts.length === 0 && /nome da partitura/.test(await page.evaluate(() => document.body.innerText)); })());
await page.fill('.pm-titulo', 'Minha primeira'); await page.locator('.pm-titulo').dispatchEvent('change');
await botao('guardar na pasta'); await sleep(500);
check('guardar cria a partitura online com nome, instrumento e as notas', posts.length === 1 && posts[0].nome === 'Minha primeira' && posts[0].instrumento === 'teclas' && posts[0].dados.evs.length === 3 && typeof posts[0].dono_nome === 'string');
check('depois de guardada o botão vira "guardar de novo"', await page.evaluate(() => [...document.querySelectorAll('.pm-painel button')].some((b) => b.textContent === 'guardar de novo')));
// editar de novo: mais uma nota e guarda por cima (PATCH, não cria outra)
await clica(65); await botao('guardar de novo'); await sleep(500);
check('guardar de novo ATUALIZA a mesma partitura (PATCH) com as 4 notas', patches.length === 1 && patches[0].id === 'p-novo' && patches[0].dados.evs.length === 4 && posts.length === 1);
// abrir da pasta: a Bea vê as dela e as dos professores; procura por nome sem acento
await botao('abrir da pasta'); await sleep(700);
const nomes = () => page.evaluate(() => [...document.querySelectorAll('.pm-pasta .pm-it-n b')].map((b) => b.textContent));
check('a pasta mostra as 3 partituras (a dela e as dos professores)', (await nomes()).length === 3);
await page.fill('.pm-pasta input[type=search]', 'por do sol'); await sleep(300);
check('procurar "por do sol" acha "Melodia do Pôr do Sol" (sem acento)', JSON.stringify(await nomes()) === '["Melodia do Pôr do Sol"]');
await page.fill('.pm-pasta input[type=search]', 'andre'); await sleep(300);
check('procurar pelo nome do professor também acha', (await nomes()).length === 1);
await page.fill('.pm-pasta input[type=search]', ''); await sleep(200);
await page.locator('.pm-pasta .pm-it-n', { hasText: 'Escala de dó' }).click(); await sleep(700);
check('abrir carrega as notas e o nome na folha pra editar de novo', await page.evaluate(() => document.querySelectorAll('.pm-folha .pm-n').length === 2 && document.querySelector('.pm-titulo').value === 'Escala de dó'));
await para('montar', 'clicar nas teclas'); await clica(64); await botao('guardar de novo'); await sleep(500);
check('editar a partitura de outro professor e guardar atualiza a dele (Bea pode)', patches.length === 2 && patches[1].id === 'p-1' && patches[1].dados.evs.length === 3);
// ---- aba Professores
await page.evaluate(() => { location.hash = '#/professores'; }); await sleep(1500);
const txt = await page.evaluate(() => document.body.innerText);
check('a aba Professores mostra a pasta de cada professor com a contagem', /leo/i.test(txt) && /andre/i.test(txt) && /Minha primeira/i.test(txt) && /3 professores/.test(txt));
await page.fill('.pad-x input[type=search]', 'melodia'); await sleep(300);
check('procurar por nome na aba Professores', await page.evaluate(() => document.querySelectorAll('.pr-it').length === 1));
await page.locator('.pr-it').first().click(); await sleep(800);
check('ver mostra a partitura desenhada e as ações (editar, PDF, apagar)', await page.evaluate(() => !!document.querySelector('.sheet .pm-folha svg') && ['editar a partitura', 'baixar PDF', 'apagar'].every((t) => [...document.querySelectorAll('.sheet button')].some((b) => b.textContent === t))));
await botao('editar a partitura'); await sleep(2500);
check('"editar a partitura" abre o editor já com a partitura aberta', await page.evaluate(() => location.hash === '#/editor' && !!document.querySelector('.ep-folha') && document.querySelector('.ep-nm').value === 'Melodia do Pôr do Sol'));
// ---- apagar (de volta ao painel das Teclas)
await page.evaluate(() => { location.hash = '#/piano'; }); await sleep(2400);
await page.evaluate(() => [...document.querySelectorAll('.kd-modelos .kd-chip')].find((b) => b.textContent.includes('partitura')).click()); await sleep(500);
await botao('abrir da pasta'); await sleep(600);
await page.locator('.pm-pasta .pm-it', { hasText: 'Minha primeira' }).getByRole('button', { name: /Apagar/ }).click(); await sleep(400);
await page.evaluate(() => [...document.querySelectorAll('.sheet button')].filter((b) => b.textContent.trim() === 'Apagar').pop().click()); await sleep(500);
check('apagar tira da pasta (DELETE) e a lista atualiza', dels.length === 1 && !(await nomes()).includes('Minha primeira'));
// ---- tabela ainda não criada
fora = true; await page.evaluate(() => { document.querySelectorAll('.sheet-close, .sheet .btn.ghost').forEach(() => {}); });
check('sem erros de script', errs.length === 0 || (console.log(errs), false));
await browser.close(); srv.close(); done();
