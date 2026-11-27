-- Banco de exercícios do PRO (pro.beaterista.com.br) + pastas das partituras.
-- APLICADA no projeto beaterista-app em 27/nov/2026. Só ADICIONA (uma coluna nova e uma tabela nova); não mexe em nada do PLAY. Seguro rodar de novo.
-- Quem vê o quê: professores liberados (pro_liberado()) leem os exercícios publicados; só a Bea (is_allowed()) cria, edita, despublica e apaga.
-- Os exercícios iniciais entram pelo botão "Carregar exercícios iniciais" do painel da Bea (js/pro/banco-seed.js).
alter table public.partituras add column if not exists pasta text not null default '' check (char_length(pasta) <= 60);
create index if not exists partituras_pasta_idx on public.partituras (dono, pasta);

create table if not exists public.pro_exercicios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 1 and 100),
  instrumento text not null default 'geral' check (instrumento in ('teclas', 'violao', 'guitarra', 'baixo', 'bateria', 'geral')),
  nivel text not null default 'iniciante' check (nivel in ('iniciante', 'basico', 'intermediario', 'avancado')),
  categoria text not null default '' check (char_length(categoria) <= 60),
  descricao text not null default '' check (char_length(descricao) <= 4000),
  dados jsonb not null default '{}'::jsonb check (pg_column_size(dados) < 200000), -- a partitura (mesmo formato de partituras.dados) ou {} quando é só texto
  bpm int check (bpm is null or bpm between 30 and 260),
  ordem int not null default 100,
  publicado boolean not null default true,
  criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists pro_exercicios_busca_idx on public.pro_exercicios (instrumento, categoria, ordem);
create or replace function public.pro_exercicios_toque() returns trigger language plpgsql set search_path = public as $$
begin new.atualizado_em := now(); new.criado_em := old.criado_em; return new; end $$;
drop trigger if exists pro_exercicios_toque on public.pro_exercicios;
create trigger pro_exercicios_toque before update on public.pro_exercicios for each row execute function public.pro_exercicios_toque();
alter table public.pro_exercicios enable row level security;
revoke all on public.pro_exercicios from anon;
grant select, insert, update, delete on public.pro_exercicios to authenticated;
drop policy if exists pro_ex_ler on public.pro_exercicios;
create policy pro_ex_ler on public.pro_exercicios for select to authenticated using (public.pro_liberado() and (publicado or public.is_allowed()));
drop policy if exists pro_ex_escrever on public.pro_exercicios;
create policy pro_ex_escrever on public.pro_exercicios for all to authenticated using (public.is_allowed()) with check (public.is_allowed());

-- 025 (27/nov/2026, APLICADA): a mesma tabela guarda o Arsenal (tipo 'exercicio') e o Repertório (tipo 'repertorio', com o artista).
alter table public.pro_exercicios add column if not exists tipo text not null default 'exercicio' check (tipo in ('exercicio', 'repertorio'));
alter table public.pro_exercicios add column if not exists artista text not null default '' check (char_length(artista) <= 100);
create index if not exists pro_exercicios_tipo_idx on public.pro_exercicios (tipo, instrumento, categoria, ordem);
