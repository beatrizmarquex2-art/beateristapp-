-- Quiz e Letras (30 dicas) na área dos alunos: as 30 dicas já estão em public.dicas_publicas (n, texto).
-- Esta função só devolve as dicas pra quem tem um código de aluno ativo e dentro da validade (alunos_codigos).
create or replace function public.dicas_lista(p_code text)
returns table(n int, texto text)
language sql security definer set search_path = public as $$
  select d.n, d.texto from public.dicas_publicas d
  where exists (select 1 from public.alunos_codigos c where c.code = upper(btrim(coalesce(p_code, ''))) and c.ativo and c.expira_em > now())
  order by d.n;
$$;
revoke all on function public.dicas_lista(text) from public;
grant execute on function public.dicas_lista(text) to anon, authenticated;
