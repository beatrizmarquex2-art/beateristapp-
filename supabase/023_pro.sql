-- Beaterista PRO (pro.beaterista.com.br): dados de cada professor. SÓ ADICIONA tabelas novas (prefixo pro_); não mexe em nada do PLAY.
-- APLICADA no projeto beaterista-app em 27/nov/2026 (a Bea aprovou). Seguro rodar de novo.
-- ACESSO FECHADO: por enquanto só a Bea (public.is_allowed()) usa o PRO. Pra liberar um professor depois:  insert into public.pro_liberados (email) values ('professor@exemplo.com');
-- (qualquer pessoa consegue criar conta no login, mas sem estar liberada não lê nem grava nada.)
-- Regra de ouro: cada professor lê e escreve EXCLUSIVAMENTE o que é dele (dono = auth.uid()). Nem a Bea nem outro professor enxergam os alunos e materiais de alguém
-- (dados de alunos de terceiros: LGPD). Quem entra só com código (anon) não tem acesso nenhum.
-- As partituras do PRO usam a tabela `partituras` que já existe (022): já é por dono.

create table if not exists public.pro_liberados (email text primary key check (email = lower(email)));
alter table public.pro_liberados enable row level security;
revoke all on public.pro_liberados from anon, authenticated; -- ninguém pelo app: só o painel do Supabase / SQL
create or replace function public.pro_liberado() returns boolean language sql stable security definer set search_path = public as $$
  select public.is_allowed() or exists (select 1 from public.pro_liberados where email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
revoke all on function public.pro_liberado() from public, anon; grant execute on function public.pro_liberado() to authenticated;

create table if not exists public.pro_perfil (
  dono uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  nome text not null default '' check (char_length(nome) <= 80),
  escola text not null default '' check (char_length(escola) <= 80),
  instrumentos text[] not null default '{}' check (cardinality(instrumentos) <= 12),
  logo text check (logo is null or char_length(logo) < 400000), -- imagem pequena em data URL: sai no cabeçalho dos PDFs
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.pro_alunos (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 80),
  instrumento text not null default '' check (char_length(instrumento) <= 40),
  nivel text not null default 'iniciante' check (nivel in ('iniciante', 'basico', 'intermediario', 'avancado')),
  idade int check (idade is null or idade between 2 and 110),
  contato text not null default '' check (char_length(contato) <= 120),
  metas jsonb not null default '[]'::jsonb check (jsonb_typeof(metas) = 'array' and pg_column_size(metas) < 40000), -- [{texto, feita}]
  notas text not null default '' check (char_length(notas) <= 8000), -- anotações particulares do professor
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists pro_alunos_dono_idx on public.pro_alunos (dono, nome);

create table if not exists public.pro_aulas (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 100),
  instrumento text not null default '' check (char_length(instrumento) <= 40),
  idade text not null default '' check (char_length(idade) <= 20),
  nivel text not null default 'iniciante' check (nivel in ('iniciante', 'basico', 'intermediario', 'avancado')),
  duracao_min int not null default 50 check (duracao_min between 5 and 480),
  modelo boolean not null default false, -- true = modelo reutilizável
  favorito boolean not null default false,
  pasta text not null default '' check (char_length(pasta) <= 60),
  dados jsonb not null default '{}'::jsonb check (pg_column_size(dados) < 200000), -- {objetivos, etapas:[{tipo, titulo, min, texto}], repertorio, materiais, tarefa}
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists pro_aulas_dono_idx on public.pro_aulas (dono, atualizado_em desc);

create table if not exists public.pro_eventos (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references auth.users (id) on delete cascade,
  aluno_id uuid references public.pro_alunos (id) on delete set null,
  aula_id uuid references public.pro_aulas (id) on delete set null,
  titulo text not null default '' check (char_length(titulo) <= 100),
  inicio timestamptz not null,
  duracao_min int not null default 50 check (duracao_min between 5 and 480),
  status text not null default 'marcada' check (status in ('marcada', 'dada', 'faltou', 'cancelada')),
  nota text not null default '' check (char_length(nota) <= 4000), -- o que foi trabalhado (histórico de aulas)
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists pro_eventos_dono_idx on public.pro_eventos (dono, inicio);
create index if not exists pro_eventos_aluno_idx on public.pro_eventos (aluno_id, inicio desc);

-- o dono e a data de criação nunca mudam; o aluno/aula ligados a um evento têm que ser do mesmo professor
create or replace function public.pro_toque() returns trigger language plpgsql set search_path = public as $$
begin new.atualizado_em := now(); new.dono := old.dono; new.criado_em := old.criado_em; return new; end $$;
create or replace function public.pro_evento_confere() returns trigger language plpgsql set search_path = public as $$
begin
  if new.aluno_id is not null and not exists (select 1 from public.pro_alunos a where a.id = new.aluno_id and a.dono = new.dono) then raise exception 'aluno de outro professor'; end if;
  if new.aula_id is not null and not exists (select 1 from public.pro_aulas a where a.id = new.aula_id and a.dono = new.dono) then raise exception 'aula de outro professor'; end if;
  return new;
end $$;
drop trigger if exists pro_evento_confere on public.pro_eventos;
create trigger pro_evento_confere before insert or update on public.pro_eventos for each row execute function public.pro_evento_confere();

do $$ declare t text; begin
  foreach t in array array['pro_perfil', 'pro_alunos', 'pro_aulas', 'pro_eventos'] loop
    execute format('drop trigger if exists %I_toque on public.%I', t, t);
    execute format('create trigger %I_toque before update on public.%I for each row execute function public.pro_toque()', t, t);
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists %I_dono on public.%I', t, t);
    execute format('create policy %I_dono on public.%I for all to authenticated using (dono = auth.uid() and public.pro_liberado()) with check (dono = auth.uid() and public.pro_liberado())', t, t);
  end loop;
end $$;

-- as partituras (022) também só gravam quem está liberado
drop policy if exists part_inserir on public.partituras;
create policy part_inserir on public.partituras for insert to authenticated with check (dono = auth.uid() and public.pro_liberado());
