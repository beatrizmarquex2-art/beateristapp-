-- De onde o aluno veio (aluno beaterista, on-line, tiktok live, youtube/instagram, outro: ...).
alter table public.aluno_visitas add column if not exists origem text check (char_length(origem) <= 50);

drop function if exists public.aluno_visit(uuid, text, text, boolean);

create or replace function public.aluno_visit(p_id uuid, p_name text, p_ua text default null, p_new boolean default true, p_origem text default null)
returns void language plpgsql security definer set search_path = public as $$
declare n text := nullif(left(btrim(regexp_replace(coalesce(p_name,''), '\s+', ' ', 'g')), 20), '');
        o text := nullif(left(btrim(coalesce(p_origem,'')), 50), '');
begin
  insert into public.aluno_visitas(id, name, ua, origem) values (p_id, n, left(p_ua,160), o)
  on conflict (id) do update set
    name = coalesce(excluded.name, public.aluno_visitas.name),
    ua = coalesce(excluded.ua, public.aluno_visitas.ua),
    origem = coalesce(excluded.origem, public.aluno_visitas.origem),
    last_seen = now(),
    visits = public.aluno_visitas.visits + case when p_new then 1 else 0 end;
end $$;

revoke all on function public.aluno_visit(uuid, text, text, boolean, text) from public;
grant execute on function public.aluno_visit(uuid, text, text, boolean, text) to anon, authenticated;
