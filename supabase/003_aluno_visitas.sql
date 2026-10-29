-- Registro de acessos da área do aluno (aluno.html). Só a Bea (e-mail na lista app_allowed_emails) consegue ler.
create table if not exists public.aluno_visitas (
  id uuid primary key,
  name text check (char_length(name) <= 20),
  visits integer not null default 1,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  ua text check (char_length(ua) <= 160)
);
alter table public.aluno_visitas enable row level security;
revoke all on public.aluno_visitas from anon, authenticated;
grant select on public.aluno_visitas to authenticated;
drop policy if exists ver_acessos on public.aluno_visitas;
create policy ver_acessos on public.aluno_visitas for select to authenticated using (public.is_allowed());

create or replace function public.aluno_visit(p_id uuid, p_name text, p_ua text default null, p_new boolean default true)
returns void language plpgsql security definer set search_path = public as $$
declare n text := nullif(left(btrim(regexp_replace(coalesce(p_name,''), '\s+', ' ', 'g')), 20), '');
begin
  insert into public.aluno_visitas(id, name, ua) values (p_id, n, left(p_ua,160))
  on conflict (id) do update set
    name = coalesce(excluded.name, public.aluno_visitas.name),
    ua = coalesce(excluded.ua, public.aluno_visitas.ua),
    last_seen = now(),
    visits = public.aluno_visitas.visits + case when p_new then 1 else 0 end;
end $$;
revoke all on function public.aluno_visit(uuid,text,text,boolean) from public;
grant execute on function public.aluno_visit(uuid,text,text,boolean) to anon, authenticated;
