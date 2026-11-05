-- Cada código de aluno vale 1 ano (a Bea pode desativar antes, ou renovar com "+1 ano").
alter table public.alunos_codigos add column if not exists expira_em timestamptz not null default (now() + interval '1 year');

create or replace function public.aluno_codigo_ok(p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  update public.alunos_codigos set usos = usos + 1, ultimo_uso = now()
   where code = upper(btrim(coalesce(p_code, ''))) and ativo and expira_em > now() returning true into ok;
  return coalesce(ok, false);
end $$;

create or replace function public.midis_publicos_lista(p_code text)
returns table(id text, name text, folder text, corte jsonb, b64 text)
language sql security definer set search_path = public as $$
  select m.id, m.name, m.folder, m.corte, m.b64 from public.midis_publicos m
  where exists (select 1 from public.alunos_codigos c where c.code = upper(btrim(coalesce(p_code, ''))) and c.ativo and c.expira_em > now())
  order by m.name limit 200;
$$;
