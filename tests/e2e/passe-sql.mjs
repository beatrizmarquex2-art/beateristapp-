// Testa de verdade o SQL de supabase/015_passe_hotmart.sql num Postgres em memória (PGlite), com as tabelas/funções que já existem no Supabase.
// Rodar: PGLITE_DIR=/caminho/onde/instalou node tests/e2e/passe-sql.mjs   (instalar: mkdir /tmp/pgt && cd /tmp/pgt && npm i @electric-sql/pglite)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { check, done } from './harness.mjs';
const dir = process.env.PGLITE_DIR || '/tmp/pgt';
let PGlite;
try { PGlite = (await import(pathToFileURL(createRequire(path.join(dir, 'x.js')).resolve('@electric-sql/pglite')).href)).PGlite; } catch { console.log(`PGlite não encontrado em ${dir}; teste ignorado`); process.exit(0); }
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const db = new PGlite();
await db.exec(`
create role anon; create role authenticated; create role service_role;
create function is_allowed() returns boolean language sql as $$ select false $$;
create function fig_canon(t text) returns text language sql immutable as $$ select upper(regexp_replace(coalesce(t, ''), '[^A-Za-z0-9]', '', 'g')) $$;
create function prof_valida(p text) returns boolean language sql as $$ select false $$;
create table acesso_falhas (em timestamptz not null default now());
create table alunos_codigos (code text primary key check (code ~ '^[A-Z0-9]{4,12}$'), nome text not null default '' check (char_length(nome) <= 60), ativo boolean not null default true, usos int not null default 0,
  criado_em timestamptz not null default now(), ultimo_uso timestamptz, expira_em timestamptz, tipo text not null default 'turma' check (tipo in ('turma','passe')), dias int not null default 365 check (dias between 1 and 3660),
  iniciado_em timestamptz, max_aparelhos int not null default 2 check (max_aparelhos between 1 and 10));
create table codigos_aparelhos (code text not null, aparelho text not null, ua text, primeiro_uso timestamptz not null default now(), ultimo_uso timestamptz not null default now(), primary key (code, aparelho));
create function aluno_acesso(p_code text, p_aparelho text default null, p_ua text default null) returns jsonb language plpgsql security definer set search_path to 'public' as $f$
declare c text := public.fig_canon(p_code); r public.alunos_codigos%rowtype; n int; ap text := nullif(btrim(coalesce(p_aparelho, '')), '');
begin
  if public.prof_valida(c) then return jsonb_build_object('ok', true, 'tipo', 'prof'); end if;
  select * into r from public.alunos_codigos where code = c;
  if not found or not r.ativo then return jsonb_build_object('ok', false, 'motivo', 'codigo'); end if;
  if r.expira_em is not null and r.expira_em <= now() then return jsonb_build_object('ok', false, 'motivo', 'vencido'); end if;
  if r.tipo = 'passe' then
    if ap is null or char_length(ap) < 8 or char_length(ap) > 64 then return jsonb_build_object('ok', false, 'motivo', 'aparelho'); end if;
    if exists (select 1 from public.codigos_aparelhos where code = c and aparelho = ap) then update public.codigos_aparelhos set ultimo_uso = now() where code = c and aparelho = ap;
    else select count(*) into n from public.codigos_aparelhos where code = c;
      if n >= r.max_aparelhos then return jsonb_build_object('ok', false, 'motivo', 'aparelhos', 'max', r.max_aparelhos); end if;
      insert into public.codigos_aparelhos(code, aparelho, ua) values (c, ap, left(p_ua, 160)); end if;
  end if;
  update public.alunos_codigos set usos = usos + 1, ultimo_uso = now(), iniciado_em = coalesce(iniciado_em, now()), expira_em = case when tipo = 'passe' and expira_em is null then now() + make_interval(days => dias) else expira_em end where code = c returning expira_em into r.expira_em;
  return jsonb_build_object('ok', true, 'tipo', r.tipo, 'nome', r.nome, 'expira_em', r.expira_em);
end $f$;
grant usage on schema public to anon, authenticated, service_role; grant execute on function aluno_acesso(text, text, text) to anon, authenticated;
insert into alunos_codigos(code, nome, tipo) values ('TURMA1', 'Aluno da escola', 'turma'), ('PASSEOUTRO', 'Outro passe', 'passe');
`);
await db.exec(fs.readFileSync(path.join(raiz, 'supabase/015_passe_hotmart.sql'), 'utf8'));
const q = async (sql, params) => (await db.query(sql, params)).rows;
const reg = async (t, ap = '2026-11-12T09:00:00Z') => (await q('select public.passe_registrar_compra($1,$2,$3,$4,$5) as r', [t, 'maria@exemplo.com', 'Maria', '4567890', ap]))[0].r;
const dev = 'aparelho-123456';

const a = await reg('HP12345678');
check('aprovação gera código P + 9 do alfabeto sem confusão', /^P[A-HJ-NP-Z2-9]{9}$/.test(a.code), a.code);
check('vale 12 meses a partir da aprovação', new Date(a.expira_em).toISOString() === '2027-11-12T09:00:00.000Z', a.expira_em);
const lin = (await q('select tipo, ativo, max_aparelhos, nome from alunos_codigos where code=$1', [a.code]))[0];
check('é um código de passe, ativo, 2 aparelhos, nome "Passe Maria"', lin.tipo === 'passe' && lin.ativo && lin.max_aparelhos === 2 && lin.nome === 'Passe Maria', JSON.stringify(lin));
const b = await reg('HP12345678');
check('aviso duplicado devolve o MESMO código e não cria outro', b.code === a.code && b.novo === false && (await q("select count(*)::int n from alunos_codigos where nome like 'Passe %' and code<>'PASSEOUTRO'"))[0].n === 1);
check('uma linha só em passe_compras', (await q('select count(*)::int n from passe_compras'))[0].n === 1);
const ac = (await q('select public.aluno_acesso($1,$2) as r', [a.code.toLowerCase(), dev]))[0].r;
check('o comprador entra pelo aluno_acesso (o mesmo campo Código de acesso)', ac.ok === true && ac.tipo === 'passe', JSON.stringify(ac));
check('sem id de aparelho o passe pede aparelho', (await q('select public.aluno_acesso($1,null) as r', [a.code]))[0].r.motivo === 'aparelho');
await q('select public.passe_email_resultado($1,false,$2)', ['HP12345678', 'smtp caiu']);
const c1 = (await q('select email_enviado_em, email_tentativas, email_erro from passe_compras'))[0];
check('falha no e-mail guarda o erro e o código segue o mesmo', c1.email_enviado_em === null && c1.email_tentativas === 1 && c1.email_erro === 'smtp caiu' && (await reg('HP12345678')).code === a.code);
await q('select public.passe_email_resultado($1,true,null)', ['HP12345678']);
check('e-mail enviado marca a compra (e limpa o erro)', (await reg('HP12345678')).email_enviado === true && (await q('select email_erro from passe_compras'))[0].email_erro === null);
const d = (await q('select public.passe_dados_envio($1) as r', ['HP12345678']))[0].r; check('dados pro reenvio', d.code === a.code && d.email === 'maria@exemplo.com' && d.status === 'aprovada');
check('transação desconhecida → null', (await q('select public.passe_dados_envio($1) as r', ['NAOEXISTE1']))[0].r === null);

// compra 2 (outro comprador) e reembolso da 1
const outra = await reg('HP99999999');
const rv = (await q("select public.passe_revogar($1,'reembolsada') as r", ['HP12345678']))[0].r;
check('reembolso revoga o código da compra', rv.revogado === true && (await q('select ativo from alunos_codigos where code=$1', [a.code]))[0].ativo === false);
check('depois do reembolso o código não entra mais', (await q('select public.aluno_acesso($1,$2) as r', [a.code, dev]))[0].r.ok === false);
check('NÃO mexe no código de turma, em outro passe nem na outra compra', (await q("select count(*)::int n from alunos_codigos where ativo and code in ('TURMA1','PASSEOUTRO',$1)", [outra.code]))[0].n === 3);
check('reembolso repetido não faz nada', (await q("select public.passe_revogar($1,'chargeback') as r", ['HP12345678']))[0].r.revogado === false && (await q('select status from passe_compras where transacao=$1', ['HP12345678']))[0].status === 'reembolsada');
check('aprovação repetida depois do reembolso não reativa', (await reg('HP12345678')).status === 'reembolsada' && (await q('select ativo from alunos_codigos where code=$1', [a.code]))[0].ativo === false);
const cb = await reg('HP77777777'); await q("select public.passe_revogar($1,'chargeback')", ['HP77777777']);
check('chargeback revoga só aquela compra', (await q('select ativo from alunos_codigos where code=$1', [cb.code]))[0].ativo === false && (await q('select ativo from alunos_codigos where code=$1', [outra.code]))[0].ativo === true);
// reembolso antes da aprovação
const t = (await q("select public.passe_revogar($1,'reembolsada') as r", ['HP55555555']))[0].r; const tarde = await reg('HP55555555');
check('reembolso antes da aprovação: aprovação tardia não cria código', t.revogado === false && tarde.status === 'reembolsada' && !tarde.code && (await q("select count(*)::int n from alunos_codigos where nome like 'Passe %'"))[0].n === 3);
// 12 meses nunca no futuro
const fut = await reg('HP44444444', '2099-01-01T00:00:00Z'); check('data de aprovação no futuro é limitada a agora', new Date(fut.expira_em) < new Date('2028-01-01'));
// aleatoriedade / unicidade
const set = new Set(); for (let i = 0; i < 3000; i++) set.add((await q('select public.passe_gerar_codigo() as c'))[0].c);
check('3000 códigos gerados, todos diferentes e no formato', set.size === 3000 && [...set].every((x) => /^P[A-HJ-NP-Z2-9]{9}$/.test(x)));
// permissões: anon/authenticated não chamam nada
for (const papel of ['anon', 'authenticated']) {
  await db.exec(`set role ${papel}`); let neg = 0;
  for (const sql of ["select public.passe_registrar_compra('HPXXXXXXXX','a@b.co','x','1',null)", "select public.passe_revogar('HP12345678','chargeback')", "select public.passe_dados_envio('HP12345678')", "select * from passe_compras"]) { try { await db.query(sql); } catch { neg++; } }
  await db.exec('reset role'); check(`${papel} não consegue chamar as funções nem ler passe_compras (RLS: authenticated só lê se is_allowed)`, papel === 'anon' ? neg === 4 : neg >= 3, String(neg));
}
await db.exec('set role service_role'); let okSvc = true; try { await db.query("select public.passe_dados_envio('HP12345678')"); } catch { okSvc = false; } await db.exec('reset role');
check('service_role (Edge Function) consegue chamar', okSvc);
process.exit(done() ? 1 : 0);
