-- Álbum da área do aluno, versão final: cada aluno tem o SEU código; o progresso fica salvo por código (vale em qualquer aparelho)
-- e a Bea vê no app: nome, código, de onde veio, último acesso e quantas figurinhas colou.
-- Substitui a 007 (código único), que nunca foi usada.
drop function if exists public.album_codigo_ok(text), public.album_codigo_versao(), public.album_codigo_definir(text);
drop table if exists public.album_config;

create table if not exists public.album_codigos (
  codigo text primary key check (codigo = upper(codigo) and char_length(codigo) between 4 and 24),
  nome text not null default '' check (char_length(nome) <= 40),
  ativo boolean not null default true,
  criado timestamptz not null default now()
);
create table if not exists public.album_acessos (
  codigo text primary key references public.album_codigos(codigo) on delete cascade,
  aluno text check (char_length(aluno) <= 20),
  nomes text[] not null default '{}',
  origem text check (char_length(origem) <= 80),
  primeiro_acesso timestamptz not null default now(),
  ultimo_acesso timestamptz not null default now(),
  acessos integer not null default 1,
  coladas integer not null default 0,
  estado jsonb
);
create table if not exists public.album_falhas (em timestamptz not null default now());
alter table public.album_codigos enable row level security;
alter table public.album_acessos enable row level security;
alter table public.album_falhas enable row level security;
revoke all on public.album_codigos, public.album_acessos, public.album_falhas from anon, authenticated;
grant select on public.album_codigos to authenticated;
grant select (codigo, aluno, nomes, origem, primeiro_acesso, ultimo_acesso, acessos, coladas) on public.album_acessos to authenticated;
drop policy if exists ver_album_codigos on public.album_codigos;
create policy ver_album_codigos on public.album_codigos for select to authenticated using (public.is_allowed());
drop policy if exists ver_album_acessos on public.album_acessos;
create policy ver_album_acessos on public.album_acessos for select to authenticated using (public.is_allowed());

create or replace function public.album_norm(t text) returns text language sql immutable as $$
  select upper(regexp_replace(coalesce(t, ''), '\s+', '', 'g'));
$$;

-- Entrar com o código: confere, registra o acesso (nome que o aluno escolheu + de onde veio) e devolve o progresso salvo.
create or replace function public.album_entrar(p_codigo text, p_aluno text default null, p_origem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c text := public.album_norm(p_codigo); k record;
  n text := nullif(left(btrim(regexp_replace(coalesce(p_aluno, ''), '\s+', ' ', 'g')), 20), '');
  o text := nullif(left(btrim(coalesce(p_origem, '')), 80), '');
begin
  if (select count(*) from public.album_falhas where em > now() - interval '1 minute') > 40 then raise exception 'muitas tentativas, espere um minuto'; end if;
  select * into k from public.album_codigos where codigo = c and ativo;
  if not found then
    insert into public.album_falhas default values; delete from public.album_falhas where em < now() - interval '1 hour';
    perform pg_sleep(0.5); return jsonb_build_object('ok', false);
  end if;
  insert into public.album_acessos(codigo, aluno, nomes, origem) values (c, n, case when n is null then '{}'::text[] else array[n] end, o)
  on conflict (codigo) do update set
    aluno = coalesce(n, public.album_acessos.aluno),
    nomes = case when n is null or n = any(public.album_acessos.nomes) then public.album_acessos.nomes else public.album_acessos.nomes || n end,
    origem = coalesce(public.album_acessos.origem, o),
    ultimo_acesso = now(), acessos = public.album_acessos.acessos + 1;
  return jsonb_build_object('ok', true, 'nome', k.nome, 'estado', (select estado from public.album_acessos where codigo = c));
end $$;

-- Salvar o progresso (o app chama sozinho a cada figurinha colada / pacote aberto).
create or replace function public.album_salvar(p_codigo text, p_estado jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
declare c text := public.album_norm(p_codigo);
begin
  if p_estado is null or jsonb_typeof(p_estado) <> 'object' or length(p_estado::text) > 80000 then return false; end if;
  if not exists (select 1 from public.album_codigos where codigo = c and ativo) then return false; end if;
  update public.album_acessos set estado = p_estado, ultimo_acesso = now(),
    coladas = (select count(*) from jsonb_object_keys(coalesce(p_estado -> 'pasted', '{}'::jsonb))) where codigo = c;
  return found;
end $$;

-- Só a Bea (e-mail em app_allowed_emails): criar código (em branco = gera ALU-0000) e ativar/desativar.
create or replace function public.album_codigo_criar(p_nome text, p_codigo text default null)
returns text language plpgsql security definer set search_path = public as $$
declare c text := nullif(public.album_norm(p_codigo), ''); i int := 0;
begin
  if not public.is_allowed() then raise exception 'sem permissão'; end if;
  if c is null then loop c := 'ALU-' || lpad((floor(random() * 10000))::int::text, 4, '0'); exit when not exists (select 1 from public.album_codigos where codigo = c); i := i + 1; if i > 50 then raise exception 'tente de novo'; end if; end loop; end if;
  if char_length(c) not between 4 and 24 then raise exception 'código precisa ter de 4 a 24 caracteres'; end if;
  insert into public.album_codigos(codigo, nome) values (c, left(btrim(coalesce(p_nome, '')), 40));
  return c;
end $$;
create or replace function public.album_codigo_ativar(p_codigo text, p_ativo boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_allowed() then raise exception 'sem permissão'; end if;
  update public.album_codigos set ativo = p_ativo where codigo = public.album_norm(p_codigo);
end $$;

revoke all on function public.album_entrar(text, text, text), public.album_salvar(text, jsonb), public.album_codigo_criar(text, text), public.album_codigo_ativar(text, boolean) from public;
grant execute on function public.album_entrar(text, text, text), public.album_salvar(text, jsonb) to anon, authenticated;
grant execute on function public.album_codigo_criar(text, text), public.album_codigo_ativar(text, boolean) to authenticated;

-- o código da Bea
insert into public.album_codigos(codigo, nome) values ('BEA-0404', 'Bea (professora)') on conflict (codigo) do nothing;
