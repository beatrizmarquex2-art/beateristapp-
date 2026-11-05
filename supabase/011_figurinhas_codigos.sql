-- Álbum de figurinhas da área do aluno. Aceita QUALQUER código de aluno que já exista:
--   * alunos_codigos  (supabase/007_codigos.sql: código que a Bea cria no app, ativo = true)
--   * album_codigos   (código BEA-0000 do álbum de ritmo, liberado = true)
-- O código do aluno é guardado sem traço e em maiúsculas (BEA-0404 = BEA0404). Guarda o progresso das figurinhas por código
-- (vale em qualquer aparelho) e o registro de acesso: nome que o aluno escolheu, de onde veio, último acesso, coladas.
-- Tabelas fechadas: o site só chama as funções fig_*.
create table if not exists public.fig_aluno (
  code text primary key check (code ~ '^[A-Z0-9]{4,12}$'),
  aluno text check (char_length(aluno) <= 20),
  nomes text[] not null default '{}',
  origem text check (char_length(origem) <= 80),
  estado jsonb,
  primeiro_acesso timestamptz not null default now(),
  ultimo_acesso timestamptz not null default now(),
  acessos integer not null default 1,
  coladas integer not null default 0
);
alter table public.fig_aluno enable row level security;
revoke all on public.fig_aluno from anon, authenticated;

create or replace function public.fig_canon(t text) returns text language sql immutable as $$
  select upper(regexp_replace(coalesce(t, ''), '[^A-Za-z0-9]', '', 'g'));
$$;
-- nome do aluno se o código vale (pode ser ''), ou null se não vale / foi desativado
create or replace function public.fig_valido(c text) returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    (select x.nome from public.alunos_codigos x where x.code = c and x.ativo limit 1),
    (select coalesce(a.dados ->> 'n', '') from public.album_codigos a where public.fig_canon(a.code) = c and a.liberado limit 1));
$$;

create or replace function public.fig_entrar(p_code text, p_aluno text default null, p_origem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c text := public.fig_canon(p_code); nome text;
  n text := nullif(left(btrim(regexp_replace(coalesce(p_aluno, ''), '\s+', ' ', 'g')), 20), '');
  o text := nullif(left(btrim(coalesce(p_origem, '')), 80), '');
begin
  if (select count(*) from public.fig_falhas where em > now() - interval '1 minute') > 40 then raise exception 'muitas tentativas, espere um minuto'; end if;
  nome := public.fig_valido(c);
  if nome is null then
    insert into public.fig_falhas default values; perform pg_sleep(0.5);
    return jsonb_build_object('ok', false, 'motivo', 'codigo');
  end if;
  insert into public.fig_aluno(code, aluno, nomes, origem) values (c, n, case when n is null then '{}'::text[] else array[n] end, o)
  on conflict (code) do update set
    aluno = coalesce(n, public.fig_aluno.aluno),
    nomes = case when n is null or n = any(public.fig_aluno.nomes) then public.fig_aluno.nomes else public.fig_aluno.nomes || n end,
    origem = coalesce(public.fig_aluno.origem, o),
    ultimo_acesso = now(), acessos = public.fig_aluno.acessos + 1;
  return jsonb_build_object('ok', true, 'nome', nome, 'estado', (select f.estado from public.fig_aluno f where f.code = c));
end $$;

create or replace function public.fig_salvar(p_code text, p_estado jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
declare c text := public.fig_canon(p_code);
begin
  if p_estado is null or jsonb_typeof(p_estado) <> 'object' or length(p_estado::text) > 80000 then return false; end if;
  if public.fig_valido(c) is null then return false; end if;
  update public.fig_aluno set estado = p_estado, ultimo_acesso = now(),
    coladas = (select count(*) from jsonb_object_keys(coalesce(p_estado -> 'pasted', '{}'::jsonb))) where code = c;
  return found;
end $$;

-- Relatório da Bea (só e-mail em app_allowed_emails): todos os códigos de aluno + quem já entrou no álbum.
-- fonte 'a' = alunos_codigos, 'b' = album_codigos (BEA-0000).
create or replace function public.fig_alunos()
returns table(code text, exibir text, nome text, ativo boolean, fonte text, aluno text, nomes text[], origem text, primeiro_acesso timestamptz, ultimo_acesso timestamptz, acessos integer, coladas integer)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_allowed() then raise exception 'nao autorizado'; end if;
  return query
    with v as (
      select x.code, x.code as exibir, x.nome, x.ativo, 'a'::text as fonte from public.alunos_codigos x
      union all
      select public.fig_canon(a.code), a.code, coalesce(a.dados ->> 'n', ''), a.liberado, 'b'::text from public.album_codigos a
    )
    select coalesce(v.code, f.code), coalesce(v.exibir, f.code), coalesce(v.nome, ''), coalesce(v.ativo, false), coalesce(v.fonte, '-'),
           f.aluno, coalesce(f.nomes, '{}'::text[]), f.origem, f.primeiro_acesso, f.ultimo_acesso, coalesce(f.acessos, 0), coalesce(f.coladas, 0)
    from v full join public.fig_aluno f on f.code = v.code
    where f.code is not null or v.ativo
    order by f.ultimo_acesso desc nulls last, 1 limit 500;
end $$;

revoke all on function public.fig_canon(text), public.fig_valido(text), public.fig_entrar(text, text, text), public.fig_salvar(text, jsonb), public.fig_alunos() from public, anon;
grant execute on function public.fig_entrar(text, text, text), public.fig_salvar(text, jsonb) to anon, authenticated;
grant execute on function public.fig_alunos() to authenticated;

-- o código da Bea (BEA-0404) vale nos dois sistemas
insert into public.alunos_codigos(code, nome) values ('BEA0404', 'Bea (professora)') on conflict (code) do update set ativo = true;
insert into public.album_codigos(code, dados, liberado) values ('BEA-0404', '{"n":"Bea (professora)","a":[],"l":{},"r":[0,0]}'::jsonb, true) on conflict (code) do update set liberado = true;
