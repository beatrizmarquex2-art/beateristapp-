-- 027 (27/nov/2026, APLICADA): favoritos do professor — um exercício ou música do Arsenal/Repertório guardado numa pasta dele.
-- Cada professor só enxerga os seus (RLS por dono + pro_liberado). Testado com rollback: isolamento, duplicado, não liberado e cascata.
create table if not exists public.pro_favoritos (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid(),
  exercicio_id uuid not null references public.pro_exercicios(id) on delete cascade,
  pasta text not null default '' check (char_length(pasta) <= 60),
  criado_em timestamptz not null default now(),
  unique (dono, exercicio_id)
);
create index if not exists pro_favoritos_dono_idx on public.pro_favoritos (dono, pasta);
alter table public.pro_favoritos enable row level security;
revoke all on public.pro_favoritos from anon;
grant select, insert, update, delete on public.pro_favoritos to authenticated;
drop policy if exists pro_fav_proprio on public.pro_favoritos;
create policy pro_fav_proprio on public.pro_favoritos for all to authenticated
  using (dono = auth.uid() and public.pro_liberado()) with check (dono = auth.uid() and public.pro_liberado());
