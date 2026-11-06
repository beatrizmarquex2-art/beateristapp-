// Testa supabase/013_passe.sql num Postgres local descartável. Rodar: node --test tests/sql/passe.test.mjs (pula se não houver Postgres).
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { subir } from './pg-helper.mjs';

const pg = await subir();
const T = { skip: pg ? false : 'sem Postgres local' };
if (pg) {
  pg.psql('stubs.sql'.replace('stubs.sql', 'tests/sql/stubs.sql'), { file: true });
  pg.psql('supabase/013_passe.sql', { file: true });
  pg.psql("update passe_config set valor='teste' where chave='ambiente'; update passe_config set valor='OFERTA_PASSE' where chave='oferta_codigos'; update passe_config set valor='999' where chave='produto_ids';");
}
const J = (s) => JSON.parse(s);
let seq = 0;
const ev = (tipo, { email = 'ana@exemplo.com', tr = 'HP-1', oferta = 'OFERTA_PASSE', prod = '999', id, ts = Date.now() } = {}) => ({ id: id || `e${++seq}`, creation_date: ts, event: tipo, data: { product: { id: Number(prod) }, buyer: { email }, purchase: { transaction: tr, status: tipo, offer: { code: oferta } } } });
const proc = (e, o = {}) => J(pg.psql(`select public.passe_processar_evento('${JSON.stringify(e).replace(/'/g, "''")}'::jsonb)`, o));
const q = (s, o) => pg.psql(s, o);
const codigoAtivo = (email) => q(`select codigo from passe_codigos where email='${email}' and estado='ativo' order by criado_em desc limit 1`);

test.after(() => pg && pg.parar());

test('compra aprovada: direito, conta de aluno, código PAUL#### e outbox (sem envio)', T, () => {
  const r = proc(ev('PURCHASE_APPROVED', { tr: 'HP-A', email: 'Ana@Exemplo.com' }));
  assert.equal(r.resultado, 'aprovada');
  assert.equal(q("select estado from passe_direitos where email='ana@exemplo.com'"), 'ativo');
  assert.match(codigoAtivo('ana@exemplo.com'), /^PAUL\d{4}$/);
  assert.equal(q("select count(*) from passe_outbox where para='ana@exemplo.com' and estado='pendente'"), '1');
  const meses = Number(q("select round(extract(epoch from (expira_em - now()))/86400/30.4)::int from passe_direitos where email='ana@exemplo.com'"));
  assert.equal(meses, 12);
  assert.equal(q("select aluno_code ~ '^PS[A-Z0-9]{8}$' from passe_direitos where email='ana@exemplo.com'"), 't');
  assert.equal(q("select public.aluno_codigo_ok(aluno_code) from passe_direitos where email='ana@exemplo.com'"), 't');
});

test('reentrega do mesmo evento e da mesma compra não duplica nada', T, () => {
  const e = ev('PURCHASE_APPROVED', { tr: 'HP-B', email: 'bia@exemplo.com', id: 'fixo-1', ts: 1700000000000 });
  assert.equal(proc(e).resultado, 'aprovada');
  assert.equal(proc(e).resultado, 'duplicado');
  assert.equal(proc({ ...e, id: 'fixo-2' }).resultado, 'ignorado_fora_de_ordem'); // mesma compra, mesmo instante
  assert.equal(q("select count(*) from passe_codigos where email='bia@exemplo.com'"), '1');
  assert.equal(q("select count(*) from passe_compras where email='bia@exemplo.com'"), '1');
});

test('compra avulsa / outra oferta / outro produto nunca concede o Passe', T, () => {
  assert.equal(proc(ev('PURCHASE_APPROVED', { tr: 'HP-C', email: 'cla@exemplo.com', oferta: 'OUTRA' })).resultado, 'ignorado_outra_oferta');
  assert.equal(proc(ev('PURCHASE_APPROVED', { tr: 'HP-C2', email: 'cla@exemplo.com', prod: '123' })).resultado, 'ignorado_outra_oferta');
  assert.equal(q("select count(*) from passe_direitos where email='cla@exemplo.com'"), '0');
});

test('ativação: código certo + e-mail certo, uso único e atômico', T, async () => {
  proc(ev('PURCHASE_APPROVED', { tr: 'HP-D', email: 'dani@exemplo.com' }));
  const c = codigoAtivo('dani@exemplo.com');
  const errado = J(q(`select public.passe_ativar('outra@exemplo.com','${c}')`, { role: 'anon' }));
  assert.equal(errado.ok, false);
  const [a, b] = await Promise.all([1, 2].map(() => new Promise((res) => execFile('/usr/bin/psql', ['-h', pg.dir, '-p', '54399', '-U', 'postgres', '-At', '-c', `select public.passe_ativar('dani@exemplo.com','${c}')`], (e, out) => res(JSON.parse(out.trim()))))));
  assert.equal([a, b].filter((x) => x.ok).length, 1, 'só uma ativação vence');
  const ok = [a, b].find((x) => x.ok);
  assert.match(ok.code, /^PS/); assert.equal(ok.bonus_pendente, true);
  assert.equal(J(q(`select public.passe_ativar('dani@exemplo.com','${c}')`, { role: 'anon' })).ok, false, 'segunda vez falha');
});

test('tentativas repetidas bloqueiam o código', T, () => {
  proc(ev('PURCHASE_APPROVED', { tr: 'HP-E', email: 'edu@exemplo.com' }));
  const c = codigoAtivo('edu@exemplo.com'); const errado = c === 'PAUL0000' ? 'PAUL0001' : 'PAUL0000';
  for (let i = 0; i < 5; i++) assert.equal(J(q(`select public.passe_ativar('edu@exemplo.com','${errado}')`, { role: 'anon' })).ok, false);
  assert.equal(q(`select estado from passe_codigos where codigo='${c}' and email='edu@exemplo.com'`), 'bloqueado');
  assert.equal(J(q(`select public.passe_ativar('edu@exemplo.com','${c}')`, { role: 'anon' })).ok, false, 'certo, mas já bloqueado');
});

test('reembolso revoga só aquele direito; aprovação atrasada depois do reembolso é ignorada', T, () => {
  proc(ev('PURCHASE_APPROVED', { tr: 'HP-F', email: 'fe@exemplo.com', ts: 1700000000000 }));
  proc(ev('PURCHASE_APPROVED', { tr: 'HP-F2', email: 'outro@exemplo.com' }));
  assert.equal(proc(ev('PURCHASE_REFUNDED', { tr: 'HP-F', email: 'fe@exemplo.com', ts: 1700000100000 })).resultado, 'reembolsada');
  assert.equal(q("select estado from passe_direitos where email='fe@exemplo.com'"), 'revogado');
  assert.equal(q("select public.aluno_codigo_ok(aluno_code) from passe_direitos where email='fe@exemplo.com'"), 'f');
  assert.equal(q("select count(*) from passe_codigos where email='fe@exemplo.com' and estado='ativo'"), '0');
  assert.equal(q("select estado from passe_direitos where email='outro@exemplo.com'"), 'ativo');
  assert.equal(proc(ev('PURCHASE_APPROVED', { tr: 'HP-F', email: 'fe@exemplo.com', ts: 1699999990000 })).resultado, 'ignorado_fora_de_ordem');
  assert.equal(q("select estado from passe_direitos where email='fe@exemplo.com'"), 'revogado');
});

test('reembolso que chega ANTES da aprovação não libera o Passe', T, () => {
  assert.equal(proc(ev('PURCHASE_REFUNDED', { tr: 'HP-G', email: 'gil@exemplo.com' })).resultado, 'reembolsada');
  assert.equal(proc(ev('PURCHASE_APPROVED', { tr: 'HP-G', email: 'gil@exemplo.com' })).resultado, 'ignorado_fora_de_ordem');
  assert.equal(q("select count(*) from passe_direitos where email='gil@exemplo.com'"), '0');
});

test('renovação estende sem duplicar bônus; reembolsar a renovação mantém a primeira compra', T, () => {
  proc(ev('PURCHASE_APPROVED', { tr: 'HP-H1', email: 'hel@exemplo.com' }));
  const code = q("select aluno_code from passe_direitos where email='hel@exemplo.com'");
  assert.equal(J(q(`select public.passe_resgatar_bonus('${code}')`, { role: 'anon' })).novo, true);
  const exp1 = q("select expira_em from passe_direitos where email='hel@exemplo.com'");
  proc(ev('PURCHASE_APPROVED', { tr: 'HP-H2', email: 'hel@exemplo.com' }));
  const meses = Number(q("select round(extract(epoch from (expira_em - now()))/86400/30.4)::int from passe_direitos where email='hel@exemplo.com'"));
  assert.equal(meses, 24);
  assert.equal(J(q(`select public.passe_resgatar_bonus('${code}')`, { role: 'anon' })).novo, false, 'bônus não repete');
  proc(ev('PURCHASE_REFUNDED', { tr: 'HP-H2', email: 'hel@exemplo.com' }));
  assert.equal(q("select estado from passe_direitos where email='hel@exemplo.com'"), 'ativo');
  assert.equal(q("select expira_em from passe_direitos where email='hel@exemplo.com'"), exp1);
  assert.equal(q("select count(*) from passe_outbox where para='hel@exemplo.com'"), '1', 'sem novo código na renovação');
});

test('status: nenhum, aluno, passe ativo, vencido e revogado', T, () => {
  assert.equal(J(q("select public.passe_status('XXXX0000')", { role: 'anon' })).tipo, 'nenhum');
  q("insert into alunos_codigos(code,nome) values ('ALUNO1','Aluno')");
  assert.equal(J(q("select public.passe_status('ALUNO1')", { role: 'anon' })).tipo, 'aluno');
  proc(ev('PURCHASE_APPROVED', { tr: 'HP-I', email: 'ivo@exemplo.com' }));
  const code = q("select aluno_code from passe_direitos where email='ivo@exemplo.com'");
  assert.equal(J(q(`select public.passe_status('${code}')`, { role: 'anon' })).estado, 'ativo');
  q("update passe_direitos set expira_em = now() - interval '1 day' where email='ivo@exemplo.com'");
  assert.equal(J(q(`select public.passe_status('${code}')`, { role: 'anon' })).estado, 'vencido');
  assert.equal(J(q(`select public.passe_resgatar_bonus('${code}')`, { role: 'anon' })).ok, false, 'vencido não resgata');
  q("update passe_direitos set estado='revogado' where email='ivo@exemplo.com'");
  assert.equal(J(q(`select public.passe_status('${code}')`, { role: 'anon' })).estado, 'revogado');
});

test('expirar não apaga dados', T, () => {
  proc(ev('PURCHASE_APPROVED', { tr: 'HP-J', email: 'jo@exemplo.com' }));
  q("update passe_direitos set expira_em = now() - interval '1 day' where email='jo@exemplo.com'; select public._passe_sincronizar(id) from passe_direitos where email='jo@exemplo.com'");
  assert.equal(q("select count(*) from passe_direitos where email='jo@exemplo.com'"), '1');
  assert.equal(q("select count(*) from alunos_codigos c join passe_direitos d on d.aluno_code=c.code where d.email='jo@exemplo.com'"), '1');
});

test('códigos PAUL#### ativos não colidem (300 emissões)', T, () => {
  q("insert into passe_direitos(email, expira_em) select 'lote'||g||'@exemplo.com', now()+interval '1 year' from generate_series(1,300) g");
  q("select public._passe_emitir_codigo(id, email) from passe_direitos where email like 'lote%'");
  assert.equal(q("select count(*)=count(distinct codigo) from passe_codigos where estado='ativo' and email like 'lote%'"), 't');
});

test('permissões: anon não chama o webhook nem o admin; Bea reemite, revoga e deixa auditoria', T, () => {
  assert.throws(() => q("select public.passe_processar_evento('{}'::jsonb)", { role: 'anon' }));
  assert.throws(() => q('select * from public.passe_direitos', { role: 'anon' }));
  assert.throws(() => q('select * from public.passe_admin_listar()', { role: 'authenticated', email: 'intruso@x.com' }));
  proc(ev('PURCHASE_APPROVED', { tr: 'HP-K', email: 'kau@exemplo.com' }));
  const velho = codigoAtivo('kau@exemplo.com');
  const novo = q("select public.passe_admin_reemitir('kau@exemplo.com')", { role: 'authenticated', email: 'bea@teste.com' });
  assert.match(novo, /^PAUL\d{4}$/);
  assert.equal(q(`select estado from passe_codigos where codigo='${velho}' and email='kau@exemplo.com'`), velho === novo ? 'ativo' : 'revogado');
  assert.equal(q("select public.passe_admin_revogar('kau@exemplo.com','teste')", { role: 'authenticated', email: 'bea@teste.com' }), 't');
  assert.equal(q("select estado from passe_direitos where email='kau@exemplo.com'"), 'revogado');
  assert.ok(Number(q("select count(*) from passe_auditoria where acao in ('reemitir_codigo','revogar')")) >= 2);
});
