-- As 30 dicas do Plano de Estudo da Bea, copiadas pra uma tabela fechada. Só saem pra código BEA liberado (trava no servidor).
-- Pra atualizar depois de editar as dicas no app da Bea, rode de novo o insert ... on conflict do final.
create table if not exists public.dicas_publicas (
  n int primary key check (n between 1 and 999),
  texto text not null check (char_length(texto) between 1 and 600),
  updated_at timestamptz not null default now()
);
alter table public.dicas_publicas enable row level security;
revoke all on public.dicas_publicas from anon, authenticated;

create or replace function public.dicas_ler(p_code text)
returns table(n int, texto text) language sql security definer set search_path = public as $$
  select d.n, d.texto from public.dicas_publicas d
  where public.acesso_ler(p_code) order by d.n;
$$;
revoke all on function public.dicas_ler(text) from public;
grant execute on function public.dicas_ler(text) to anon, authenticated;

insert into public.dicas_publicas(n, texto)
select (r.data->>'n')::int, left(r.data->>'text', 600) from public.records r
where r.kind = 'tip' and not r.deleted and coalesce(r.data->>'text','') <> '' and (r.data->>'n') ~ '^[0-9]+$'
on conflict (n) do update set texto = excluded.texto, updated_at = now();
