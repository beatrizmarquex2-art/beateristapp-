-- Ranking dos alunos: LIMITES CONTRA TRAPAÇA (pedido da Bea, nov/2026). NÃO foi aplicado: a Bea cola e roda no SQL Editor do Supabase quando quiser.
-- Só mexe nos quadros novos (nome começa com 'rk|': mundos, longe, estrelas, figurinhas, estudos, eco, dias). Os quadros antigos (kids|estrelas, xp, músicas do Beat Hero) ficam como estão.
-- O que faz: (1) cada quadro tem um TETO (ninguém passa de X); (2) cada nome só pode SUBIR até um tanto POR DIA (no horário de Brasília).
-- Se o aparelho mandar um número maior que o permitido, o servidor NÃO dá erro: guarda o máximo permitido (o app continua funcionando e o aluno nem percebe).
-- Seguro rodar mais de uma vez. Pra desfazer: rode o bloco "DESFAZER" no fim. Pra apagar um nome indevido: delete from public.ranking_scores where name = 'NOME';
alter table public.ranking_scores add column if not exists dia date;
alter table public.ranking_scores add column if not exists base integer;

-- limites por quadro: teto total, teto de quem ENTRA agora (já tem progresso de antes), e quanto pode subir por dia
create or replace function public.ranking_limite(p_quadro text)
returns table(teto integer, entrada integer, por_dia integer)
language sql immutable as $$
  select v.teto, v.entrada, v.por_dia from (values
    ('mundos',      36,   36,  2),    -- 3 mundos × 12 fases por jogo; sobe devagar
    ('longe',      600,  600, 40),    -- fases vencidas
    ('estrelas',  5000, 5000, 150),   -- estrelas ganhas
    ('figurinhas', 400,  400, 40),    -- figurinhas do álbum
    ('estudos',   3000, 3000, 80),    -- estudos feitos
    ('eco',        200,   60, 15),    -- notas decoradas de uma vez (recorde)
    ('dias',       400,   60,  1)     -- dias em sequência: no máximo +1 por dia
  ) v(q, teto, entrada, por_dia) where v.q = split_part(p_quadro, '|', 2)
$$;

create or replace function public.ranking_add(p_board text, p_name text, p_score integer, p_acc integer default null, p_grade text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  n text := btrim(regexp_replace(coalesce(p_name,''), '\s+', ' ', 'g'));
  hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  lim record; cur record; novo integer; b integer;
begin
  if char_length(p_board) not between 1 and 120 or char_length(n) not between 1 and 20 then raise exception 'dados inválidos'; end if;
  if p_score is null or p_score < 0 or p_score > 5000000 then raise exception 'pontuação inválida'; end if;

  if p_board like 'rk|%' then -- quadros novos: com limites
    select * into lim from public.ranking_limite(p_board);
    if not found then raise exception 'quadro inválido'; end if;
    select * into cur from public.ranking_scores where board = p_board and name = n;
    if not found then
      novo := least(p_score, lim.entrada);
      insert into public.ranking_scores(board, name, score, acc, grade, dia, base) values (p_board, n, novo, null, null, hoje, novo)
      on conflict (board, name) do nothing;
    else
      b := case when cur.dia is distinct from hoje then cur.score else coalesce(cur.base, cur.score) end; -- pontuação de quando o dia começou
      novo := least(p_score, lim.teto, b + lim.por_dia);
      if novo > cur.score then
        update public.ranking_scores set score = novo, dia = hoje, base = b, updated_at = now() where board = p_board and name = n;
      elsif cur.dia is distinct from hoje then
        update public.ranking_scores set dia = hoje, base = cur.score where board = p_board and name = n; -- vira o dia sem subir
      end if;
    end if;
    return;
  end if;

  -- quadros antigos: como era antes
  insert into public.ranking_scores(board, name, score, acc, grade)
  values (p_board, n, p_score, least(greatest(p_acc,0),100), left(p_grade,3))
  on conflict (board, name) do update
    set score = excluded.score, acc = excluded.acc, grade = excluded.grade, updated_at = now()
    where excluded.score > public.ranking_scores.score;
end $$;

revoke all on function public.ranking_add(text,text,integer,integer,text) from public;
grant execute on function public.ranking_add(text,text,integer,integer,text) to anon, authenticated;
revoke all on function public.ranking_limite(text) from public;

/* ---------- DESFAZER (só se precisar: volta a função como era antes, sem limites) ----------
create or replace function public.ranking_add(p_board text, p_name text, p_score integer, p_acc integer default null, p_grade text default null)
returns void language plpgsql security definer set search_path = public as $f$
declare n text := btrim(regexp_replace(coalesce(p_name,''), '\s+', ' ', 'g'));
begin
  if char_length(p_board) not between 1 and 120 or char_length(n) not between 1 and 20 then raise exception 'dados inválidos'; end if;
  if p_score is null or p_score < 0 or p_score > 5000000 then raise exception 'pontuação inválida'; end if;
  insert into public.ranking_scores(board, name, score, acc, grade) values (p_board, n, p_score, least(greatest(p_acc,0),100), left(p_grade,3))
  on conflict (board, name) do update set score = excluded.score, acc = excluded.acc, grade = excluded.grade, updated_at = now() where excluded.score > public.ranking_scores.score;
end $f$;
*/
