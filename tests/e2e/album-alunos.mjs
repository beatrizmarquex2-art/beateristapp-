// Relatório do álbum no app da Bea: nome, código, de onde veio, último acesso, coladas. (Supabase simulado.)
import { serve, launch, sleep, check, done, fakeLogin } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await fakeLogin(ctx, page, url);
const rows = [
  { code: 'K7M2QX', exibir: 'K7M2QX', nome: 'Julia', ativo: true, fonte: 'a', aluno: 'Juju', nomes: ['Juju'], origem: 'tik tok live', primeiro_acesso: new Date().toISOString(), ultimo_acesso: new Date().toISOString(), acessos: 3, coladas: 25 },
  { code: 'BEA0404', exibir: 'BEA-0404', nome: 'Bea (professora)', ativo: true, fonte: 'b', aluno: null, nomes: [], origem: null, primeiro_acesso: null, ultimo_acesso: null, acessos: 0, coladas: 0 },
  { code: 'OLD111', exibir: 'OLD111', nome: 'Pedro', ativo: false, fonte: 'a', aluno: 'Pedro', nomes: ['Pedro', 'Pedrinho'], origem: 'youtube', primeiro_acesso: new Date().toISOString(), ultimo_acesso: new Date().toISOString(), acessos: 1, coladas: 4 },
];
const chamadas = [];
await ctx.route('**/rest/v1/rpc/fig_alunos', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows) }));
await ctx.route('**/rest/v1/rpc/acesso_liberar', (r) => { chamadas.push(['acesso_liberar', r.request().postData()]); r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }); });
await ctx.route('**/rest/v1/alunos_codigos**', (r) => { chamadas.push([r.request().method(), r.request().url(), r.request().postData()]); r.fulfill({ status: 204, body: '' }); });
await page.evaluate(() => { location.hash = '#/album-alunos'; }); await page.waitForSelector('.al-rep', { timeout: 10000 });
const txt = await page.textContent('#view');
check('mostra nome do aluno, código e de onde veio', txt.includes('Juju') && txt.includes('K7M2QX') && txt.includes('tik tok live'));
check('mostra quantas figurinhas colou', txt.includes('25/125'));
check('código da Bea aparece com traço', txt.includes('BEA-0404'));
check('mostra quando alguém usou mais de um nome', txt.includes('Pedro, Pedrinho'));
check('separa os desativados', txt.includes('desativados'));
await page.getByRole('button', { name: 'tirar acesso' }).first().click(); await sleep(500);
check('tirar acesso de um código do Beat Hero muda ativo=false', chamadas.some((c) => c[0] === 'PATCH' && c[2] === '{"ativo":false}'), JSON.stringify(chamadas));
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
