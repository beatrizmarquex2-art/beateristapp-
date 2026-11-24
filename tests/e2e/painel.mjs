import { serve, launch, sleep, check, done, fakeLogin } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage(); await page.setViewportSize({ width: 390, height: 844 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
const futuro = new Date(Date.now() + 200 * 864e5).toISOString();
const base = { usos: 1, criado_em: '2026-11-01T10:00:00Z', ultimo_uso: null, expira_em: null, dias: 365, jogos: null, iniciado_em: null, max_aparelhos: 2 };
const db = [
  { ...base, code: 'ANA111', nome: 'Ana Matriculada', ativo: true, tipo: 'turma', categoria: 'aluno', matricula: 'ativa' },
  { ...base, code: 'BIA222', nome: 'Bia Ex-aluna', ativo: false, tipo: 'turma', categoria: 'aluno', matricula: 'encerrada' },
  { ...base, code: 'CAIO33', nome: 'Caio Manual', ativo: true, tipo: 'passe', categoria: 'aluno', matricula: null, expira_em: futuro },
  { ...base, code: 'DANI44', nome: 'Dani Ex com passe', ativo: true, tipo: 'passe', categoria: 'aluno', matricula: 'encerrada', expira_em: futuro, passe_pago_ate: futuro },
  { ...base, code: 'AMIGO5', nome: 'Amigo da Bea', ativo: true, tipo: 'passe', categoria: 'amigo', matricula: null },
];
const rpcs = []; let semBanco = false;
await fakeLogin(ctx, page, url);
await ctx.route('**/rest/v1/alunos_codigos**', (r) => r.request().method() === 'GET' ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(db) }) : r.fulfill({ status: 204, body: '' }));
await ctx.route('**/rest/v1/rpc/**', (r) => { const fn = new URL(r.request().url()).pathname.split('/').pop(); const body = JSON.parse(r.request().postData() || '{}'); rpcs.push({ fn, body });
  if (semBanco) return r.fulfill({ status: 404, contentType: 'application/json', body: '{"code":"PGRST202"}' });
  const J = (o) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(o) });
  if (fn === 'codigos_resumo') return J([{ code: 'ANA111', aparelhos: 2 }, { code: 'BIA222', aparelhos: 1 }]);
  if (fn === 'codigo_aparelhos') return J([{ aparelho: 'abc12345', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17) Safari', primeiro_uso: '2026-11-01T10:00:00Z', ultimo_uso: '2026-11-20T10:00:00Z', max_aparelhos: 2 }, { aparelho: 'def67890', ua: 'Mozilla/5.0 (Linux; Android 14) Chrome/120', primeiro_uso: '2026-11-05T10:00:00Z', ultimo_uso: '2026-11-21T10:00:00Z', max_aparelhos: 2 }]);
  if (fn === 'codigo_progresso') return J({ code: 'ANA111', nuvem: { atualizado_em: '2026-11-20T10:00:00Z', salvos: 12, bytes: 900, jogos: ['detetive', 'velha'] }, figurinhas: { coladas: 7, acessos: 4, ultimo_acesso: '2026-11-21T10:00:00Z' }, historico: [{ acao: 'matricula_reativada', em: '2026-11-10T10:00:00Z', detalhe: {} }, { acao: 'passe_pago_ativado', em: '2026-10-10T10:00:00Z', detalhe: { ref: 'Pix 10/10' } }] });
  if (fn === 'codigo_aparelho_liberar') return J(true);
  return J({ code: body.p_code, tipo: 'turma', ativo: true, matricula: 'ativa', passe_pago_ate: futuro }); });
await page.evaluate(() => { location.hash = '#/codigos'; }); await sleep(2500);
await page.waitForSelector('.cod-modo-bt[data-modo="cartoes"]', { timeout: 10000 }); await page.click('.cod-modo-bt[data-modo="cartoes"]'); await page.waitForSelector('.cod-item', { timeout: 10000 });
const card = (code) => page.locator('.cod-item', { hasText: code });
const botoes = async (code) => (await card(code).locator('.cod-item-act button').allInnerTexts()).map((t) => t.trim());
const ana = await botoes('ANA111'), bia = await botoes('BIA222'), caio = await botoes('CAIO33'), dani = await botoes('DANI44'), amigo = await botoes('AMIGO5');
check('matriculada: "encerrar matrícula", aparelhos e progresso (sem botões de ex-aluno)', ana.includes('encerrar matrícula') && ana.includes('aparelhos') && ana.includes('progresso') && !ana.some((t) => /ativar 1 ano|voltou à escola/.test(t)), ana.join(' | '));
check('ex-aluna: "pagou R$ 49,90 · ativar 1 ano" e "voltou à escola · grátis"', bia.some((t) => /ativar 1 ano/.test(t)) && bia.some((t) => /voltou à escola/.test(t)) && !bia.includes('encerrar matrícula'), bia.join(' | '));
check('aluno cadastrado à mão (passe): "marcar como matriculado"', caio.includes('marcar como matriculado'), caio.join(' | '));
check('ex-aluna com passe pago válido: só "voltou à escola" (não oferece pagar de novo)', dani.some((t) => /voltou à escola/.test(t)) && !dani.some((t) => /ativar 1 ano/.test(t)), dani.join(' | '));
check('amigo/marca: nenhuma regra de matrícula nem aparelhos/progresso de aluno', !amigo.some((t) => /matr|ativar|voltou|aparelhos|progresso/.test(t)), amigo.join(' | '));
const metaAna = await card('ANA111').locator('.cod-item-meta').innerText();
check('lista mostra situação e número de aparelhos', /matriculado · grátis/.test(metaAna) && /2 aparelhos/.test(metaAna), metaAna);
check('ex-aluna aparece como "matrícula encerrada"', /matrícula encerrada/.test(await card('BIA222').locator('.cod-item-meta').innerText()));
// encerrar: pede confirmação
await card('ANA111').getByText('encerrar matrícula').click(); await sleep(400);
check('encerrar pede confirmação e explica que nada é apagado', /Encerrar matrícula\?/.test(await page.locator('.sheet').innerText()) && /figurinhas e o progresso continuam guardados/.test(await page.locator('.sheet').innerText()));
await page.locator('.sheet .btn.danger, .sheet .btn.primary').filter({ hasText: /^Encerrar matrícula$/ }).first().click(); await sleep(700);
check('confirmou: chama matricula_encerrar no servidor (não só visual)', rpcs.some((r) => r.fn === 'matricula_encerrar' && r.body.p_code === 'ANA111'));
// ativar passe pago: exige referência + conferido
await card('BIA222').getByText(/ativar 1 ano/).click(); await sleep(400);
const bt = page.locator('.sheet .btn.primary'); check('ativar passe: botão travado até informar a referência e marcar "conferi"', await bt.isDisabled());
await page.fill('.sheet input[aria-label="Referência do pagamento"]', 'Pix de 24/11, Bia'); check('só a referência não basta', await bt.isDisabled()); await page.check('.sheet input[aria-label="Conferi o recebimento"]'); check('referência + conferi libera', !(await bt.isDisabled()));
await bt.click(); await sleep(700); const pp = rpcs.find((r) => r.fn === 'passe_pago_ativar');
check('ativar passe: servidor recebe confirmado=true e a referência', pp && pp.body.p_code === 'BIA222' && pp.body.p_confirmado === true && pp.body.p_ref === 'Pix de 24/11, Bia', JSON.stringify(pp && pp.body));
// reativar
await card('BIA222').getByText(/voltou à escola/).click(); await sleep(400); check('reativar pede confirmação', /Reativar matrícula\?/.test(await page.locator('.sheet').innerText())); await page.locator('.sheet button').filter({ hasText: /^Reativar$/ }).first().click(); await sleep(600);
check('reativar chama matricula_reativar', rpcs.some((r) => r.fn === 'matricula_reativar' && r.body.p_code === 'BIA222'));
// marcar
await card('CAIO33').getByText('marcar como matriculado').click(); await sleep(400); await page.locator('.sheet button').filter({ hasText: /^Marcar como matriculado$/ }).first().click(); await sleep(600);
check('marcar chama matricula_marcar', rpcs.some((r) => r.fn === 'matricula_marcar' && r.body.p_code === 'CAIO33'));
// aparelhos
await card('ANA111').getByRole('button', { name: 'aparelhos', exact: true }).click(); await sleep(900); const st = await page.locator('.sheet').innerText();
check('aparelhos: lista os 2 com tipo e datas, e o limite', /iPhone · Safari/.test(st) && /Android · Chrome/.test(st) && /2 de 2 aparelhos/.test(st) && /limite de aparelhos/.test(st), st.replace(/\s+/g, ' ').slice(0, 160));
await page.locator('.sheet .cod-ap').first().getByRole('button', { name: 'liberar' }).click(); await sleep(400); check('liberar pede confirmação', /Liberar este aparelho\?/.test(await page.locator('.sheet').last().innerText())); await page.locator('.sheet button').filter({ hasText: /^Liberar$/ }).first().click(); await sleep(700);
check('liberar chama o servidor com o aparelho certo', rpcs.some((r) => r.fn === 'codigo_aparelho_liberar' && r.body.p_aparelho === 'abc12345'));
await page.selectOption('.sheet select[aria-label="Limite de aparelhos"]', '3'); await page.getByRole('button', { name: 'salvar limite' }).click(); await sleep(400); await page.locator('.sheet button').filter({ hasText: /^Mudar$/ }).first().click(); await sleep(600);
check('limite: pede confirmação e chama o servidor (1 a 5)', rpcs.some((r) => r.fn === 'codigo_max_aparelhos' && r.body.p_max === 3));
// progresso (só leitura)
await sleep(500); await card('ANA111').getByRole('button', { name: 'progresso', exact: true }).click(); await sleep(900); const sp = await page.locator('.sheet').last().innerText();
check('progresso: mostra jogos, figurinhas e histórico, e avisa que é só consulta', /detetive, velha/.test(sp) && /7 coladas/.test(sp) && /passe pago ativado \(Pix 10\/10\)/.test(sp) && /só consulta/.test(sp), sp.replace(/\s+/g, ' ').slice(0, 200));
check('progresso: não existe nenhum botão que altere (só fechar)', (await page.locator('.sheet').last().locator('button').allInnerTexts()).every((t) => /fechar|✕|^$/i.test(t.trim())));
// interruptor não reativa ex-aluno
await page.keyboard.press('Escape'); await sleep(300); const antes = rpcs.length; await card('BIA222').locator('.cod-sw').click().catch(() => {}); await sleep(500);
// plano B: banco sem as funções novas
semBanco = true; await ctx.route('**/rest/v1/alunos_codigos?**', (r) => r.fallback()); 
check('sem erros de JS', errs.length === 0, errs.join('|'));
console.log(`\nrpcs chamadas: ${[...new Set(rpcs.map((r) => r.fn))].join(', ')}`); await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
