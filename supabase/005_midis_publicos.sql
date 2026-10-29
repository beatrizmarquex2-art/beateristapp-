-- Músicas (MIDI) que a Bea escolhe mostrar na área dos alunos (aluno.html).
-- A Bea marca "pros alunos" na lista de músicas importadas (menu → Jogos de ritmo); o app copia o arquivo pra esta tabela.
-- Só a Bea (is_allowed) grava, apaga ou lê a tabela. O aluno lê pela função midis_publicos_lista() (anônimo).
-- Pra tirar uma música dos alunos:  delete from public.midis_publicos where id = 'ID';
create table if not exists public.midis_publicos (
  id text primary key check (char_length(id) between 1 and 80),
  name text not null check (char_length(name) between 1 and 80),
  folder text not null default '' check (char_length(folder) <= 60),
  corte jsonb,
  b64 text not null check (char_length(b64) <= 3000000),
  updated_at timestamptz not null default now()
);
alter table public.midis_publicos enable row level security;
revoke all on public.midis_publicos from anon;
grant select, insert, update, delete on public.midis_publicos to authenticated;
create policy midis_bea_ler on public.midis_publicos for select to authenticated using (is_allowed());
create policy midis_bea_inserir on public.midis_publicos for insert to authenticated with check (is_allowed());
create policy midis_bea_atualizar on public.midis_publicos for update to authenticated using (is_allowed()) with check (is_allowed());
create policy midis_bea_apagar on public.midis_publicos for delete to authenticated using (is_allowed());

create or replace function public.midis_publicos_lista()
returns table(id text, name text, folder text, corte jsonb, b64 text)
language sql security definer set search_path = public as $$
  select m.id, m.name, m.folder, m.corte, m.b64 from public.midis_publicos m order by m.name limit 200;
$$;
revoke all on function public.midis_publicos_lista() from public;
grant execute on function public.midis_publicos_lista() to anon, authenticated;
