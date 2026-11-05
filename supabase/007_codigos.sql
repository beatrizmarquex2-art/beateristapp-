-- Código do aluno: só quem tem código (dado pela Bea) acessa o Beat Hero e a aba "Músicas MIDI" da área dos alunos.
-- A lista de MIDIs deixa de ser pública: midis_publicos_lista(p_code) só devolve arquivos com um código ativo.
-- A Bea cria, desativa e apaga códigos no app (Jogos de ritmo → "códigos dos alunos"). Desativar tira o acesso na hora.
create table if not exists public.alunos_codigos (
  code text primary key check (code ~ '^[A-Z0-9]{4,12}$'),
  nome text not null default '' check (char_length(nome) <= 60),
  ativo boolean not null default true,
  usos int not null default 0,
  criado_em timestamptz not null default now(),
  ultimo_uso timestamptz
);
alter table public.alunos_codigos enable row level security;
revoke all on public.alunos_codigos from anon;
grant select, insert, update, delete on public.alunos_codigos to authenticated;
create policy cod_bea_ler on public.alunos_codigos for select to authenticated using (is_allowed());
create policy cod_bea_inserir on public.alunos_codigos for insert to authenticated with check (is_allowed());
create policy cod_bea_atualizar on public.alunos_codigos for update to authenticated using (is_allowed()) with check (is_allowed());
create policy cod_bea_apagar on public.alunos_codigos for delete to authenticated using (is_allowed());

-- o celular do aluno pergunta se o código vale (e isso conta como um uso)
create or replace function public.aluno_codigo_ok(p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  update public.alunos_codigos set usos = usos + 1, ultimo_uso = now()
   where code = upper(btrim(coalesce(p_code, ''))) and ativo returning true into ok;
  return coalesce(ok, false);
end $$;
revoke all on function public.aluno_codigo_ok(text) from public;
grant execute on function public.aluno_codigo_ok(text) to anon, authenticated;

-- a lista pública de antes (sem código) sai do ar
drop function if exists public.midis_publicos_lista();
create or replace function public.midis_publicos_lista(p_code text)
returns table(id text, name text, folder text, corte jsonb, b64 text)
language sql security definer set search_path = public as $$
  select m.id, m.name, m.folder, m.corte, m.b64 from public.midis_publicos m
  where exists (select 1 from public.alunos_codigos c where c.code = upper(btrim(coalesce(p_code, ''))) and c.ativo)
  order by m.name limit 200;
$$;
revoke all on function public.midis_publicos_lista(text) from public;
grant execute on function public.midis_publicos_lista(text) to anon, authenticated;
