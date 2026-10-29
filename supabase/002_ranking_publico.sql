-- Ranking público da área do aluno (aluno.html). Já aplicado no projeto beaterista-app.
-- A tabela não tem policy nenhuma: só dá pra ler/gravar pelas duas funções, com validação.
-- Pra apagar um nome indevido:  delete from public.ranking_scores where name = 'NOME';
-- Pra zerar tudo:               truncate public.ranking_scores;
create table if not exists public.ranking_scores (
  board text not null check (char_length(board) between 1 and 120),
  name text not null check (char_length(name) between 1 and 20),
  score integer not null check (score between 0 and 5000000),
  acc smallint check (acc between 0 and 100),
  grade text check (char_length(grade) <= 3),
  updated_at timestamptz not null default now(),
  primary key (board, name)
);
alter table public.ranking_scores enable row level security;
revoke all on public.ranking_scores from anon, authenticated;

create or replace function public.ranking_top(p_board text)
returns table(name text, score integer, acc smallint, grade text)
language sql security definer set search_path = public as $$
  select name, score, acc, grade from public.ranking_scores
  where board = p_board order by score desc, updated_at asc limit 10;
$$;

create or replace function public.ranking_add(p_board text, p_name text, p_score integer, p_acc integer default null, p_grade text default null)
returns void language plpgsql security definer set search_path = public as $$
declare n text := btrim(regexp_replace(coalesce(p_name,''), '\s+', ' ', 'g'));
begin
  if char_length(p_board) not between 1 and 120 or char_length(n) not between 1 and 20 then raise exception 'dados inválidos'; end if;
  if p_score is null or p_score < 0 or p_score > 5000000 then raise exception 'pontuação inválida'; end if;
  insert into public.ranking_scores(board, name, score, acc, grade)
  values (p_board, n, p_score, least(greatest(p_acc,0),100), left(p_grade,3))
  on conflict (board, name) do update
    set score = excluded.score, acc = excluded.acc, grade = excluded.grade, updated_at = now()
    where excluded.score > public.ranking_scores.score;
end $$;

revoke all on function public.ranking_top(text) from public;
revoke all on function public.ranking_add(text,text,integer,integer,text) from public;
grant execute on function public.ranking_top(text) to anon, authenticated;
grant execute on function public.ranking_add(text,text,integer,integer,text) to anon, authenticated;
