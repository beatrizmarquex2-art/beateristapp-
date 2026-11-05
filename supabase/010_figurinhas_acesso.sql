-- Álbum de figurinhas na área do aluno. USA o sistema de códigos que já existe (tabela album_codigos: código BEA-0000 do aluno,
-- coluna "liberado" que só a Bea muda). Não mexe nessa tabela: guarda o progresso das figurinhas e o registro de acesso numa tabela própria.
--   entra no álbum  = código existe E está liberado
--   a Bea vê        = nome, código, de onde veio, último acesso, figurinhas coladas (fig_relatorio)
-- Tudo fechado: o site só chama as funções abaixo.
create table if not exists public.fig_progresso (
  code text primary key references public.album_codigos(code) on delete cascade,
  aluno text check (char_length(aluno) <= 20),
  nomes text[] not null default '{}',
  origem text check (char_length(origem) <= 80),
  estado jsonb,
  primeiro_acesso timestamptz not null default now(),
  ultimo_acesso timestamptz not null default now(),
  acessos integer not null default 1,
  coladas integer not null default 0
);
create table if not exists public.fig_falhas (em timestamptz not null default now());
alter table public.fig_progresso enable row level security;
alter table public.fig_falhas enable row level security;
revoke all on public.fig_progresso, public.fig_falhas from anon, authenticated;

-- Entrar: confere o código e registra quem é (nome que o aluno escolheu + de onde veio). Código existente mas ainda não liberado
-- também fica registrado (a Bea vê "aguardando liberação" no relatório). Devolve o progresso salvo.
create or replace function public.fig_entrar(p_code text, p_aluno text default null, p_origem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c text := upper(regexp_replace(coalesce(p_code, ''), '\s+', '', 'g')); k record;
  n text := nullif(left(btrim(regexp_replace(coalesce(p_aluno, ''), '\s+', ' ', 'g')), 20), '');
  o text := nullif(left(btrim(coalesce(p_origem, '')), 80), '');
begin
  if (select count(*) from public.fig_falhas where em > now() - interval '1 minute') > 40 then raise exception 'muitas tentativas, espere um minuto'; end if;
  select a.code, a.liberado, coalesce(a.dados ->> 'n', '') as nome into k from public.album_codigos a where a.code = c;
  if not found then
    insert into public.fig_falhas default values; perform pg_sleep(0.5);
    return jsonb_build_object('ok', false, 'motivo', 'codigo');
  end if;
  insert into public.fig_progresso(code, aluno, nomes, origem) values (c, n, case when n is null then '{}'::text[] else array[n] end, o)
  on conflict (code) do update set
    aluno = coalesce(n, public.fig_progresso.aluno),
    nomes = case when n is null or n = any(public.fig_progresso.nomes) then public.fig_progresso.nomes else public.fig_progresso.nomes || n end,
    origem = coalesce(public.fig_progresso.origem, o),
    ultimo_acesso = now(), acessos = public.fig_progresso.acessos + 1;
  if not k.liberado then return jsonb_build_object('ok', false, 'motivo', 'nao_liberado', 'nome', k.nome); end if;
  return jsonb_build_object('ok', true, 'nome', k.nome, 'estado', (select f.estado from public.fig_progresso f where f.code = c));
end $$;

-- Salvar o progresso (o app chama sozinho a cada figurinha colada / pacote aberto). Só código liberado.
create or replace function public.fig_salvar(p_code text, p_estado jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
declare c text := upper(regexp_replace(coalesce(p_code, ''), '\s+', '', 'g'));
begin
  if p_estado is null or jsonb_typeof(p_estado) <> 'object' or length(p_estado::text) > 80000 then return false; end if;
  if not exists (select 1 from public.album_codigos a where a.code = c and a.liberado) then return false; end if;
  update public.fig_progresso set estado = p_estado, ultimo_acesso = now(),
    coladas = (select count(*) from jsonb_object_keys(coalesce(p_estado -> 'pasted', '{}'::jsonb))) where code = c;
  return found;
end $$;

-- Só a Bea (e-mail em app_allowed_emails): relatório e criar código já liberado.
create or replace function public.fig_relatorio()
returns table(code text, nome text, liberado boolean, aluno text, nomes text[], origem text, primeiro_acesso timestamptz, ultimo_acesso timestamptz, acessos integer, coladas integer)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_allowed() then raise exception 'nao autorizado'; end if;
  return query
    select a.code, coalesce(a.dados ->> 'n', ''), a.liberado, f.aluno, coalesce(f.nomes, '{}'::text[]), f.origem, f.primeiro_acesso, f.ultimo_acesso, coalesce(f.acessos, 0), coalesce(f.coladas, 0)
    from public.album_codigos a left join public.fig_progresso f on f.code = a.code
    where a.liberado or f.code is not null
    order by f.ultimo_acesso desc nulls last, a.code limit 500;
end $$;

create or replace function public.fig_codigo_criar(p_nome text, p_code text default null)
returns text language plpgsql security definer set search_path = public as $$
declare c text := nullif(upper(regexp_replace(coalesce(p_code, ''), '\s+', '', 'g')), ''); i int := 0;
begin
  if not public.is_allowed() then raise exception 'nao autorizado'; end if;
  if c is null then
    loop c := 'BEA-' || lpad((floor(random() * 10000))::int::text, 4, '0'); exit when not exists (select 1 from public.album_codigos a where a.code = c); i := i + 1; if i > 400 then raise exception 'cheio'; end if; end loop;
  elsif c !~ '^BEA-[0-9]{4}$' then raise exception 'o código tem o formato BEA-0000'; end if;
  insert into public.album_codigos(code, dados, liberado) values (c, jsonb_build_object('n', left(btrim(coalesce(p_nome, '')), 40), 'a', '[]'::jsonb, 'l', '{}'::jsonb, 'r', '[0,0]'::jsonb), true)
  on conflict (code) do update set liberado = true;
  return c;
end $$;

revoke all on function public.fig_entrar(text, text, text), public.fig_salvar(text, jsonb), public.fig_relatorio(), public.fig_codigo_criar(text, text) from public, anon;
grant execute on function public.fig_entrar(text, text, text), public.fig_salvar(text, jsonb) to anon, authenticated;
grant execute on function public.fig_relatorio(), public.fig_codigo_criar(text, text) to authenticated;

-- o código da Bea (professora), já liberado
insert into public.album_codigos(code, dados, liberado) values ('BEA-0404', '{"n":"Bea (professora)","a":[],"l":{},"r":[0,0]}'::jsonb, true)
on conflict (code) do update set liberado = true;
