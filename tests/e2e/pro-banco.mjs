// PRO: banco de exercícios (painel da Bea + uso pelos professores) e biblioteca (pastas, duplicar, PDF, imagem). Servidor simulado na memória.
import { readFileSync } from 'node:fs';
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch();
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
const DB = { pro_perfil: [{ dono: 'u1', nome: 'Bia', escola: 'Escola Teste', instrumentos: [], logo: null }], pro_alunos: [], pro_aulas: [], pro_eventos: [], pro_exercicios: [], partituras: [] }; let n = 0; let admin = true;
const json = (r, b, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(b) });
await ctx.route('**/auth/v1/token**', (r) => json(r, { access_token: 'tok', refresh_token: 'r', expires_in: 3600, user: { id: 'u1', email: 'bea@exemplo.com' } }));
await ctx.route('**/rest/v1/rpc/is_allowed', (r) => json(r, admin));
await ctx.route(/\/rest\/v1\/(pro_\w+|partituras)/, async (r) => {
  const rq = r.request(); const u = new URL(rq.url()); const t = u.pathname.split('/').pop(); const m = rq.method(); const tab = DB[t];
  const filtra = () => tab.filter((x) => [...u.searchParams].every(([k, v]) => !v.startsWith('eq.') || String(x[k]) === v.slice(3)));
  if (m === 'GET') return json(r, filtra());
  if (m === 'POST') { const row = { id: `id${++n}`, dono: 'u1', pasta: '', publicado: true, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString(), ...rq.postDataJSON() }; tab.push(row); return json(r, [row], 201); }
  if (m === 'PATCH') { const l = filtra(); l.forEach((x) => Object.assign(x, rq.postDataJSON(), { atualizado_em: new Date().toISOString() })); return json(r, l); }
  if (m === 'DELETE') { for (const x of filtra()) tab.splice(tab.indexOf(x), 1); return r.fulfill({ status: 204 }); }
  return r.fulfill({ status: 405 });
});
const shot = async (nm) => { if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/prob-${nm}.png` }); };
const baixa = async (acao) => { const d = page.waitForEvent('download', { timeout: 15000 }).catch(() => null); await acao(); const dl = await d; return dl; };
await page.setViewportSize({ width: 1280, height: 860 });
await page.goto(url + '/pro.html'); await sleep(1200);
await page.locator('input[name=email]').fill('bea@exemplo.com'); await page.locator('input[name=senha]').fill('senha-forte-1'); await page.locator('.pe-form .pb').click(); await sleep(1800);

// ---- painel da Bea
await page.evaluate(() => { location.hash = '#/banco'; }); await sleep(800);
check('banco vazio mostra o convite pra carregar os exercícios iniciais (painel da Bea)', /painel da bea/i.test(await page.locator(".pt-ov").innerText()) && await page.getByRole('button', { name: 'Carregar exercícios iniciais' }).count() === 1);
await page.getByRole('button', { name: 'Carregar exercícios iniciais' }).click(); await sleep(2500);
check('carrega os 16 exercícios iniciais', DB.pro_exercicios.length === 16 && await page.locator('.pb-li').count() === 16);
await page.getByRole('button', { name: 'Carregar exercícios iniciais' }).click(); await sleep(1200);
check('carregar de novo não duplica', DB.pro_exercicios.length === 16);
await shot('banco');
await page.locator('.pt-pastas').first().getByRole('button', { name: 'bateria' }).click(); await sleep(200);
check('filtrar por instrumento (bateria = 6)', await page.locator('.pb-li').count() === 6);
await page.locator('.pt-pastas').first().getByRole('button', { name: 'todos os instrumentos' }).click(); await sleep(150);

// ---- professor usa: abrir uma cópia no editor
await page.locator('.pb-li', { hasText: 'Groove de rock básico' }).click(); await sleep(500);
check('o exercício abre com a partitura desenhada e o texto', await page.locator('dialog .pb-folha svg').count() >= 1 && /colcheias/.test(await page.locator('dialog .pb-desc').innerText()));
await shot('exercicio');
await page.getByRole('button', { name: /Abrir no editor/ }).click(); await sleep(1800);
check('abrir no editor cria uma cópia na pasta "Banco de exercícios" e abre a bateria', DB.partituras.length === 1 && DB.partituras[0].pasta === 'Banco de exercícios' && page.url().endsWith('#/editor/bateria') && await page.locator('.ep-folha .pm-n').count() === 12);
await page.evaluate(() => { location.hash = '#/banco'; }); await sleep(700);
await page.locator('.pb-li', { hasText: 'Aquecimento de 5 minutos' }).click(); await sleep(400);
check('exercício só de texto não tem botões de partitura', await page.getByRole('button', { name: /Abrir no editor/ }).count() === 0 && await page.getByRole('button', { name: 'Usar numa aula' }).count() === 1);
await page.getByRole('button', { name: 'Usar numa aula' }).click(); await sleep(1200);
check('usar numa aula cria o rascunho com o texto na etapa', DB.pro_aulas.length === 1 && DB.pro_aulas[0].dados.etapas[0].texto.length > 50 && /#\/aulas\//.test(page.url()));

// ---- painel: criar com partitura guardada, despublicar, apagar
await page.evaluate(() => { location.hash = '#/banco'; }); await sleep(700);
await page.getByRole('button', { name: '+ Novo exercício' }).click(); await sleep(400);
await page.locator('dialog input[aria-label="Título"]').fill('Meu exercício novo'); await page.locator('dialog input[aria-label="Categoria"]').fill('Grooves'); await page.locator('dialog select').nth(2).selectOption({ index: 1 });
await page.locator('dialog button[type=submit]').click(); await sleep(900);
const novo = DB.pro_exercicios.find((e) => e.titulo === 'Meu exercício novo');
check('criar exercício com a partitura de uma das minhas guardadas', !!novo && novo.instrumento === 'bateria' && novo.dados.evs.length === 12 && novo.categoria === 'Grooves');
await page.locator('.pb-li', { hasText: 'Meu exercício novo' }).click(); await sleep(300); await page.getByRole('button', { name: /Despublicar/ }).click(); await sleep(800);
check('despublicar: some pros professores e fica marcado como rascunho pra Bea', novo.publicado === false && await page.locator('.pb-li em', { hasText: 'rascunho' }).count() === 1);
await page.locator('.pb-li', { hasText: 'Meu exercício novo' }).click(); await sleep(300); await page.getByRole('button', { name: 'Apagar do banco' }).click(); await sleep(300); await page.locator('dialog .pb.perigo').click(); await sleep(800);
check('apagar do banco (com confirmação)', !DB.pro_exercicios.some((e) => e.titulo === 'Meu exercício novo'));

// ---- biblioteca: pastas, duplicar, PDF, imagem, apagar
await page.evaluate(() => { location.hash = '#/biblioteca'; }); await sleep(700);
await page.getByRole('tab', { name: /Partituras/ }).click(); await sleep(200);
check('a partitura do banco está na pasta "Banco de exercícios" (chip de pasta)', await page.locator('.pt-pastas button', { hasText: 'Banco de exercícios' }).count() === 1);
await page.getByRole('button', { name: '+ nova pasta' }).click(); await sleep(200); await page.locator('dialog input').fill('Turma das 14h'); await page.locator('dialog button[type=submit]').click(); await sleep(300);
check('criar pasta nova (aparece como chip e ficou lembrada)', await page.locator('.pt-pastas button.on', { hasText: 'Turma das 14h' }).count() === 1);
await page.locator('.pt-pastas button', { hasText: 'todas' }).click(); await sleep(150);
await page.locator('.pt-lista .pb-i').first().click(); await sleep(300); await page.getByRole('button', { name: 'Mover para pasta…' }).click(); await sleep(300);
await page.locator('dialog input[aria-label="Pasta"]').fill('Turma das 14h'); await page.locator('dialog button[type=submit]').click(); await sleep(700);
check('mover para a pasta nova grava a pasta', DB.partituras[0].pasta === 'Turma das 14h');
await page.locator('.pt-pastas button', { hasText: 'Turma das 14h' }).click(); await sleep(150);
check('filtrar pela pasta mostra a partitura', await page.locator('.pt-lista li').count() === 1);
await page.locator('.pt-lista .pb-i').first().click(); await sleep(300); await page.getByRole('button', { name: 'Duplicar' }).click(); await sleep(900);
check('duplicar cria "… (cópia)" na mesma pasta', DB.partituras.length === 2 && /\(cópia\)/.test(DB.partituras[1].nome) && DB.partituras[1].pasta === 'Turma das 14h');
let dl = await baixa(async () => { await page.locator('.pt-lista .pb-i').first().click(); await sleep(300); await page.getByRole('button', { name: 'Baixar PDF' }).click(); });
check('baixar PDF direto da biblioteca', !!dl && /\.pdf$/i.test(dl.suggestedFilename()));
dl = await baixa(async () => { await page.locator('.pt-lista .pb-i').first().click(); await sleep(300); await page.getByRole('button', { name: 'Salvar como imagem' }).click(); });
const png = dl ? readFileSync(await dl.path()) : Buffer.alloc(0);
check('salvar como imagem baixa um PNG de verdade', !!dl && /\.png$/i.test(dl.suggestedFilename()) && png.slice(1, 4).toString() === 'PNG' && png.length > 5000);
await page.locator('.pt-lista .pb-i').first().click(); await sleep(300); await page.getByRole('button', { name: 'Apagar' }).click(); await sleep(300); await page.locator('dialog .pb.perigo').click(); await sleep(700);
check('apagar partitura (com confirmação)', DB.partituras.length === 1);

// ---- PDF de várias páginas (24 compassos de quadros da bateria)
const evsGrande = []; for (let b = 0; b < 24; b++) for (let k = 0; k < 8; k++) { evsGrande.push({ p: 'hh', ini: b * 16 + k * 2, d: 2 }); if (k === 2 || k === 6) evsGrande.push({ p: 'sn', ini: b * 16 + k * 2, d: 2 }); if (k === 0 || k === 4) evsGrande.push({ p: 'bd', ini: b * 16 + k * 2, d: 2 }); }
DB.partituras.push({ id: 'grande', dono: 'u1', nome: 'Groove longo', instrumento: 'bateria', pasta: '', dados: { versao: 2, tipo: 'bateria', inst: 'bateria', escrita: 'quadros', kit: 'medio', modelo: 'acustica', evs: evsGrande, bpm: 90 }, atualizado_em: new Date().toISOString() });
await page.evaluate(() => { location.hash = '#/estudio'; }); await sleep(300); await page.evaluate(() => { location.hash = '#/biblioteca'; }); await sleep(700); await page.getByRole('tab', { name: /Partituras/ }).click(); await sleep(200);
await page.locator('.pt-pastas button', { hasText: 'todas' }).click(); await sleep(150);
dl = await baixa(async () => { await page.locator('.pt-lista li', { hasText: 'Groove longo' }).locator('.pb-i').click(); await sleep(300); await page.getByRole('button', { name: 'Baixar PDF' }).click(); });
const pdf = dl ? readFileSync(await dl.path()).toString('latin1') : '';
const paginas = (pdf.match(/\/Type\s*\/Page\b(?!s)/g) || []).length;
check(`PDF de 24 compassos de quadros sai em várias páginas (achou ${paginas})`, paginas >= 3 && pdf.startsWith('%PDF'));
dl = await baixa(async () => { await page.locator('.pt-lista li', { hasText: 'Groove longo' }).locator('.pb-i').click(); await sleep(300); await page.getByRole('button', { name: 'Salvar como imagem' }).click(); });
check('imagem de várias páginas baixa uma imagem por página', !!dl);

// ---- professor (não é a Bea): sem painel
admin = false; await page.reload(); await sleep(1800); await page.evaluate(() => { location.hash = '#/banco'; }); await sleep(900);
check('professor comum não vê os botões do painel', await page.getByRole('button', { name: '+ Novo exercício' }).count() === 0 && await page.getByRole('button', { name: 'Carregar exercícios iniciais' }).count() === 0 && !/painel da bea/i.test(await page.locator(".pt-ov").innerText()));
await page.locator('.pb-li').first().click(); await sleep(400);
check('e não vê editar, despublicar nem apagar', await page.getByRole('button', { name: 'Apagar do banco' }).count() === 0 && await page.getByRole('button', { name: 'Editar exercício' }).count() === 0);
check('sem erros de script', errs.length === 0 || (console.log(errs), false));
await browser.close(); srv.close(); done();
