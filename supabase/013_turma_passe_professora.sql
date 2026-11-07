-- Dois tipos de código + código da professora (nov/2026).
--   tipo 'turma' : alunos da Bea (ela cadastra o nome). Sem limite de aparelhos. expira_em vazio = sem validade.
--   tipo 'passe' : Passe Beaterista pago. Vale no máximo em 2 aparelhos e 365 dias CONTADOS DO PRIMEIRO USO (não da criação).
--   professora   : código secreto. Guardado só como hash (este arquivo é público, o código NÃO está aqui). Abre tudo, não ocupa aparelho de
--                  aluno e lista a turma pra busca "trocar aluno".
-- Compatível com o app antigo: aluno_codigo_ok(p_code) continua existindo.

alter table public.alunos_codigos
  add column if not exists tipo text not null default 'turma' check (tipo in ('turma', 'passe')),
  add column if not exists dias int not null default 365 check (dias between 1 and 3660),
  add column if not exists iniciado_em timestamptz,
  add column if not exists max_aparelhos int not null default 2 check (max_aparelhos between 1 and 10);
-- a validade do passe só começa no primeiro uso; turma pode ficar sem validade
alter table public.alunos_codigos alter column expira_em drop not null;
alter table public.alunos_codigos alter column expira_em drop default;

create table if not exists public.codigos_aparelhos (
  code text not null references public.alunos_codigos(code) on delete cascade on update cascade,
  aparelho text not null check (char_length(aparelho) between 8 and 64),
  ua text check (char_length(ua) <= 160),
  primeiro_uso timestamptz not null default now(),
  ultimo_uso timestamptz not null default now(),
  primary key (code, aparelho)
);
alter table public.codigos_aparelhos enable row level security;
revoke all on public.codigos_aparelhos from anon, authenticated;
grant select, delete on public.codigos_aparelhos to authenticated;
drop policy if exists apar_bea_ler on public.codigos_aparelhos;
drop policy if exists apar_bea_apagar on public.codigos_aparelhos;
create policy apar_bea_ler on public.codigos_aparelhos for select to authenticated using (public.is_allowed());
create policy apar_bea_apagar on public.codigos_aparelhos for delete to authenticated using (public.is_allowed());

create table if not exists public.acesso_falhas (em timestamptz not null default now());
alter table public.acesso_falhas enable row level security;
revoke all on public.acesso_falhas from anon, authenticated;

-- hash do código da professora (sha256 do código em maiúsculas, sem traço)
create table if not exists public.prof_codigos (hash text primary key check (hash ~ '^[0-9a-f]{64}$'));
alter table public.prof_codigos enable row level security;
revoke all on public.prof_codigos from anon, authenticated;
insert into public.prof_codigos(hash) values ('98a4a89173a4ce91c9a41214c046e9cdc30adb7f3f5ea10ec0082750e003e32a') on conflict do nothing;

create or replace function public.prof_valida(p text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.prof_codigos where hash = encode(sha256(convert_to(public.fig_canon(p), 'UTF8')), 'hex'));
$$;

-- o código vale agora? (professora, ou código ativo e dentro da validade; validade vazia = ainda não começou / sem validade)
create or replace function public.codigo_vale(p text) returns boolean language sql stable security definer set search_path = public as $$
  select public.prof_valida(p) or exists (select 1 from public.alunos_codigos c
    where c.code = public.fig_canon(p) and c.ativo and (c.expira_em is null or c.expira_em > now()));
$$;

-- Entrada do aluno. p_aparelho = id do aparelho (só o passe usa). Devolve { ok, tipo, nome, expira_em } ou { ok:false, motivo }.
-- motivo: 'codigo' (não existe/desativado), 'vencido', 'aparelhos' (já está em max aparelhos), 'aparelho' (faltou o id do aparelho)
create or replace function public.aluno_acesso(p_code text, p_aparelho text default null, p_ua text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c text := public.fig_canon(p_code); r public.alunos_codigos%rowtype; n int; ap text := nullif(btrim(coalesce(p_aparelho, '')), '');
begin
  if (select count(*) from public.acesso_falhas where em > now() - interval '1 minute') > 120 then raise exception 'muitas tentativas, espere um minuto'; end if;
  delete from public.acesso_falhas where em < now() - interval '1 hour';
  if public.prof_valida(c) then return jsonb_build_object('ok', true, 'tipo', 'prof', 'nome', 'Professora'); end if;
  select * into r from public.alunos_codigos where code = c;
  if not found or not r.ativo then
    insert into public.acesso_falhas default values; perform pg_sleep(0.4);
    return jsonb_build_object('ok', false, 'motivo', 'codigo');
  end if;
  if r.expira_em is not null and r.expira_em <= now() then return jsonb_build_object('ok', false, 'motivo', 'vencido'); end if;
  if r.tipo = 'passe' then
    if ap is null or char_length(ap) < 8 or char_length(ap) > 64 then return jsonb_build_object('ok', false, 'motivo', 'aparelho'); end if;
    perform pg_advisory_xact_lock(hashtext(c));
    if exists (select 1 from public.codigos_aparelhos where code = c and aparelho = ap) then
      update public.codigos_aparelhos set ultimo_uso = now() where code = c and aparelho = ap;
    else
      select count(*) into n from public.codigos_aparelhos where code = c;
      if n >= r.max_aparelhos then return jsonb_build_object('ok', false, 'motivo', 'aparelhos', 'max', r.max_aparelhos); end if;
      insert into public.codigos_aparelhos(code, aparelho, ua) values (c, ap, left(p_ua, 160));
    end if;
  end if;
  update public.alunos_codigos set usos = usos + 1, ultimo_uso = now(),
    iniciado_em = coalesce(iniciado_em, now()),
    expira_em = case when tipo = 'passe' and expira_em is null then now() + make_interval(days => dias) else expira_em end
   where code = c returning expira_em into r.expira_em;
  return jsonb_build_object('ok', true, 'tipo', r.tipo, 'nome', r.nome, 'expira_em', r.expira_em);
end $$;
revoke all on function public.aluno_acesso(text, text, text) from public;
grant execute on function public.aluno_acesso(text, text, text) to anon, authenticated;

-- app antigo (guardado no celular do aluno): continua funcionando; passe sem id de aparelho não entra
create or replace function public.aluno_codigo_ok(p_code text)
returns boolean language sql security definer set search_path = public as $$
  select coalesce((public.aluno_acesso(p_code, null, null) ->> 'ok')::boolean, false);
$$;
revoke all on function public.aluno_codigo_ok(text) from public;
grant execute on function public.aluno_codigo_ok(text) to anon, authenticated;

-- a lista de MIDIs e as dicas passam a aceitar validade vazia e a professora
create or replace function public.midis_publicos_lista(p_code text)
returns table(id text, name text, folder text, corte jsonb, b64 text)
language sql security definer set search_path = public as $$
  select m.id, m.name, m.folder, m.corte, m.b64 from public.midis_publicos m where public.codigo_vale(p_code) order by m.name limit 200;
$$;
create or replace function public.dicas_lista(p_code text)
returns table(n int, texto text)
language sql security definer set search_path = public as $$
  select d.n, d.texto from public.dicas_publicas d where public.codigo_vale(p_code) order by d.n;
$$;

-- Busca "trocar aluno" da professora: devolve a turma (só nome e código que ELA cadastrou). Só com o código secreto dela.
create or replace function public.prof_turma(p_prof text)
returns table(nome text, code text)
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.acesso_falhas where em > now() - interval '1 minute') > 120 then raise exception 'muitas tentativas, espere um minuto'; end if;
  if not public.prof_valida(p_prof) then insert into public.acesso_falhas default values; perform pg_sleep(0.4); raise exception 'nao autorizado'; end if;
  return query select x.nome, x.code from public.alunos_codigos x where x.tipo = 'turma' and x.ativo and btrim(x.nome) <> '' order by lower(x.nome) limit 500;
end $$;
revoke all on function public.prof_turma(text) from public;
grant execute on function public.prof_turma(text) to anon, authenticated;

-- Passe pago: quem cria é o webhook do checkout (Edge Function com a chave de serviço), nunca o navegador.
create or replace function public.passe_criar(p_code text, p_nome text default '', p_dias int default 365)
returns void language sql security definer set search_path = public as $$
  insert into public.alunos_codigos(code, nome, tipo, dias, ativo) values (public.fig_canon(p_code), left(coalesce(p_nome, ''), 60), 'passe', p_dias, true)
  on conflict (code) do update set ativo = true, nome = case when excluded.nome <> '' then excluded.nome else public.alunos_codigos.nome end where public.alunos_codigos.tipo = 'passe';
$$;
create or replace function public.passe_desativar(p_code text)
returns void language sql security definer set search_path = public as $$
  update public.alunos_codigos set ativo = false where code = public.fig_canon(p_code) and tipo = 'passe';
$$;
revoke all on function public.passe_criar(text, text, int), public.passe_desativar(text) from public, anon, authenticated;
grant execute on function public.passe_criar(text, text, int), public.passe_desativar(text) to service_role;

-- Turma da Bea (tipo turma: abre tudo, sem limite de aparelhos e sem validade). Aparecem na busca "trocar aluno" só com o código secreto da professora.
-- Beatriz Marques e Leticia Oliveira são as contas pessoais; BEA0404 e BELE1212 saem (BEA0404 estava em arquivos públicos).
delete from public.alunos_codigos where code in ('BEA0404', 'BELE1212');
update public.album_codigos set liberado = false where code = 'BEA-0404';
insert into public.alunos_codigos(code, nome, tipo, ativo, expira_em) values
  ('BEA0204', 'Beatriz Marques', 'turma', true, null),
  ('BEA1204', 'Leticia Oliveira', 'turma', true, null),
  ('BEA0504', 'Isabella M', 'turma', true, null),
  ('BEA2103', 'Gislaine M', 'turma', true, null),
  ('BEA2706', 'Eliel de C', 'turma', true, null),
  ('BEA1704', 'Lenira', 'turma', true, null),
  ('BEA1610', 'Kalebe', 'turma', true, null)
  on conflict (code) do update set nome = excluded.nome, ativo = true, tipo = 'turma', expira_em = null;
