-- Progresso do aluno na nuvem (pedido da Bea, 18/nov/2026): quem joga em casa continua na escola, em outro aparelho.
-- Guarda UM bloco de progresso por código de aluno (jogos, estudos e caminhos feitos). Tabela fechada: o site só chama as funções prog_*.
-- Só vale se o código existe e está ativo (usa fig_valido, de 011). Limite de 200 mil caracteres por aluno.
create table if not exists public.aluno_progresso (
  code text primary key check (code ~ '^[A-Z0-9]{4,12}$'),
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now(),
  salvos integer not null default 0
);
alter table public.aluno_progresso enable row level security;
revoke all on public.aluno_progresso from anon, authenticated;

create or replace function public.prog_ler(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c text := public.fig_canon(p_code);
begin
  if public.fig_valido(c) is null then return jsonb_build_object('ok', false); end if;
  return jsonb_build_object('ok', true, 'dados', (select a.dados from public.aluno_progresso a where a.code = c), 'em', (select a.atualizado_em from public.aluno_progresso a where a.code = c));
end $$;

create or replace function public.prog_salvar(p_code text, p_dados jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
declare c text := public.fig_canon(p_code);
begin
  if p_dados is null or jsonb_typeof(p_dados) <> 'object' or length(p_dados::text) > 200000 then return false; end if;
  if public.fig_valido(c) is null then return false; end if;
  insert into public.aluno_progresso(code, dados, salvos) values (c, p_dados, 1)
  on conflict (code) do update set dados = excluded.dados, atualizado_em = now(), salvos = public.aluno_progresso.salvos + 1;
  return true;
end $$;
grant execute on function public.prog_ler(text), public.prog_salvar(text, jsonb) to anon, authenticated;
