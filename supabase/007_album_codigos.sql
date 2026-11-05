-- Código do álbum (BEA-0000): a criança gera um código de 4 números e recupera o álbum em outro celular.
-- A tabela é fechada; só estas funções mexem. Gravar JUNTA com o que já existe (nunca apaga): união das figurinhas e
-- a maior estrela/% de cada fase. Assim, quem errar um número e salvar no código de outra criança só soma, não destrói.
create table if not exists public.album_codigos (
  code text primary key check (code ~ '^BEA-[0-9]{4}$'),
  dados jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.album_codigos enable row level security;
revoke all on public.album_codigos from anon, authenticated;

-- junta dois saves: {n: nome, a: [ids], l: {fase: [estrelas, %, vezes]}, r: [estrelas ritmo, entregues]}
create or replace function public.album_juntar(a jsonb, b jsonb)
returns jsonb language plpgsql immutable as $$
declare
  alb jsonb; lv jsonb := '{}'::jsonb; k text; x jsonb; y jsonb; ra jsonb; rb jsonb;
begin
  select coalesce(jsonb_agg(distinct v), '[]'::jsonb) into alb
    from jsonb_array_elements_text(coalesce(a->'a','[]'::jsonb) || coalesce(b->'a','[]'::jsonb)) v;
  for k in select jsonb_object_keys(coalesce(a->'l','{}'::jsonb) || coalesce(b->'l','{}'::jsonb)) loop
    x := coalesce(a->'l'->k, '[0,0,0]'::jsonb); y := coalesce(b->'l'->k, '[0,0,0]'::jsonb);
    lv := lv || jsonb_build_object(k, jsonb_build_array(
      greatest((x->>0)::int, (y->>0)::int), greatest((x->>1)::int, (y->>1)::int), greatest((x->>2)::int, (y->>2)::int)));
  end loop;
  ra := coalesce(a->'r', '[0,0]'::jsonb); rb := coalesce(b->'r', '[0,0]'::jsonb);
  return jsonb_build_object('n', coalesce(nullif(b->>'n',''), a->>'n', ''), 'a', alb, 'l', lv,
    'r', jsonb_build_array(greatest((ra->>0)::int, (rb->>0)::int), greatest((ra->>1)::int, (rb->>1)::int)));
end $$;

-- guarda o álbum. Sem código (p_code nulo): cria um BEA-NNNN novo e livre. Com código existente: junta. Devolve o código e o save juntado.
create or replace function public.album_guardar(p_code text, p_dados jsonb)
returns table(code text, dados jsonb) language plpgsql security definer set search_path = public as $$
declare c text; old jsonb; merged jsonb; tries int := 0;
begin
  if p_dados is null or jsonb_typeof(p_dados) <> 'object' or pg_column_size(p_dados) > 30000 then raise exception 'invalido'; end if;
  if p_code is null or p_code = '' then
    loop
      c := 'BEA-' || lpad(floor(random() * 10000)::int::text, 4, '0');
      begin
        insert into public.album_codigos(code, dados) values (c, p_dados);
        return query select c, p_dados; return;
      exception when unique_violation then
        tries := tries + 1; if tries > 400 then raise exception 'cheio'; end if;
      end;
    end loop;
  end if;
  c := upper(p_code);
  if c !~ '^BEA-[0-9]{4}$' then raise exception 'codigo'; end if;
  select a.dados into old from public.album_codigos a where a.code = c for update;
  if not found then
    insert into public.album_codigos(code, dados) values (c, p_dados);
    return query select c, p_dados; return;
  end if;
  merged := public.album_juntar(old, p_dados);
  update public.album_codigos a set dados = merged, updated_at = now() where a.code = c;
  return query select c, merged;
end $$;

-- só lê (pra recuperar em outro celular): devolve o save ou nada se o código não existe
create or replace function public.album_ler(p_code text)
returns jsonb language sql security definer set search_path = public as $$
  select a.dados from public.album_codigos a where a.code = upper(p_code);
$$;

grant execute on function public.album_guardar(text, jsonb) to anon, authenticated;
grant execute on function public.album_ler(text) to anon, authenticated;
