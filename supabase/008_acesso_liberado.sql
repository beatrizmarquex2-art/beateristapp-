-- Acesso liberado pela Bea: o código BEA-0000 que a criança gera guarda álbum e ranking (grátis).
-- A Bea marca o código de um aluno como "liberado" e a área jogos.beaterista.com.br abre tudo pra quem entrar com ele.
alter table public.album_codigos add column if not exists liberado boolean not null default false;

-- qualquer celular pergunta "esse código está liberado?" (só devolve sim/não)
create or replace function public.acesso_ler(p_code text)
returns boolean language sql security definer set search_path = public as $$
  select coalesce((select a.liberado from public.album_codigos a where a.code = upper(p_code)), false);
$$;

-- só a Bea (e-mail em app_allowed_emails) libera ou tira a liberação. Devolve false se o código não existe.
create or replace function public.acesso_liberar(p_code text, p_on boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_allowed() then raise exception 'nao autorizado'; end if;
  update public.album_codigos a set liberado = p_on where a.code = upper(p_code);
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- lista pra Bea: todos os códigos com nome, se está liberado e quantas figurinhas
create or replace function public.acesso_listar()
returns table(code text, nome text, liberado boolean, figurinhas int, estrelas int, atualizado timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_allowed() then raise exception 'nao autorizado'; end if;
  return query
    select a.code, coalesce(a.dados->>'n', ''), a.liberado,
           coalesce(jsonb_array_length(a.dados->'a'), 0),
           coalesce((select sum((v.value->>0)::int)::int from jsonb_each(coalesce(a.dados->'l', '{}'::jsonb)) v), 0),
           a.updated_at
    from public.album_codigos a order by a.liberado desc, a.updated_at desc limit 500;
end $$;

revoke all on function public.acesso_liberar(text, boolean) from public, anon;
revoke all on function public.acesso_listar() from public, anon;
grant execute on function public.acesso_ler(text) to anon, authenticated;
grant execute on function public.acesso_liberar(text, boolean) to authenticated;
grant execute on function public.acesso_listar() to authenticated;
