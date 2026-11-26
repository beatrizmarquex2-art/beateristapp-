-- Pasta online de partituras (ferramenta de montar partitura dos professores, aba Palco > Teclas).
-- NÃO APLICADA: escrita em 26/nov/2026 pra Bea aprovar antes de rodar no projeto beaterista-app. Só ADICIONA uma tabela; não mexe em nada que já existe. Seguro rodar de novo.
-- Quem vê o quê:
--   · cada pessoa com login (a Bea, e depois cada professor) lê, cria, edita e apaga SÓ as próprias partituras (pasta pessoal);
--   · a Bea (is_allowed) lê, edita e apaga a pasta de TODOS os professores;
--   · quem entra só com código (aluno) não tem acesso nenhum (anon sem permissão).
-- Os professores NÃO entram em app_allowed_emails (isso daria o app inteiro da Bea): as contas deles terão papel próprio na etapa 3 do projeto dos professores.
create table if not exists public.partituras (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dono_nome text not null default '' check (char_length(dono_nome) <= 60),
  nome text not null check (char_length(nome) between 1 and 60),
  instrumento text not null default 'teclas' check (instrumento in ('teclas', 'violao', 'guitarra', 'baixo', 'bateria')),
  dados jsonb not null default '{}'::jsonb check (pg_column_size(dados) < 200000),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists partituras_dono_idx on public.partituras (dono, atualizado_em desc);
create index if not exists partituras_nome_idx on public.partituras (lower(nome));

create or replace function public.partituras_toque() returns trigger language plpgsql as $$
begin new.atualizado_em := now(); new.dono := old.dono; new.criado_em := old.criado_em; return new; end $$; -- o dono e a data de criação nunca mudam (nem quando a Bea edita)
drop trigger if exists partituras_toque on public.partituras;
create trigger partituras_toque before update on public.partituras for each row execute function public.partituras_toque();

alter table public.partituras enable row level security;
revoke all on public.partituras from anon;
grant select, insert, update, delete on public.partituras to authenticated;
drop policy if exists part_ler on public.partituras;
create policy part_ler on public.partituras for select to authenticated using (dono = auth.uid() or public.is_allowed());
drop policy if exists part_inserir on public.partituras;
create policy part_inserir on public.partituras for insert to authenticated with check (dono = auth.uid());
drop policy if exists part_atualizar on public.partituras;
create policy part_atualizar on public.partituras for update to authenticated using (dono = auth.uid() or public.is_allowed()) with check (dono = auth.uid() or public.is_allowed());
drop policy if exists part_apagar on public.partituras;
create policy part_apagar on public.partituras for delete to authenticated using (dono = auth.uid() or public.is_allowed());
