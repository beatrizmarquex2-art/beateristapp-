-- Balcão: o código de aluno feito pelas professoras (cadastrar, importar, ativar/desativar), com quem fez e quando.
-- Só ADICIONA: coluna criado_por e funções balcao_*. Não muda nada do que o app dos alunos já usa (aluno_acesso, tabelas, políticas).
-- Quem pode: a Bea logada (is_allowed) ou uma professora com o código de professora (prof_valida). Toda ação entra em codigos_historico.

alter table public.alunos_codigos add column if not exists criado_por text;

create or replace function public._balcao_quem(p_prof text, p_quem text) returns text
language plpgsql security definer set search_path to 'public' as $$
begin
  if public.is_allowed() then return 'Bea'; end if;
  if (select count(*) from public.acesso_falhas where em > now() - interval '1 minute') > 120 then raise exception 'muitas tentativas, espere um minuto'; end if;
  if p_prof is null or not public.prof_valida(p_prof) then insert into public.acesso_falhas default values; perform pg_sleep(0.4); raise exception 'nao autorizado'; end if;
  return coalesce(nullif(left(btrim(coalesce(p_quem, '')), 40), ''), 'Professor(a)');
end $$;

create or replace function public._balcao_curso(p_curso text) returns text
language plpgsql immutable as $$
begin
  if p_curso is null or btrim(p_curso) = '' then return null; end if;
  if p_curso not in ('Bateria', 'Violão', 'Guitarra e Baixo', 'Musicalização', 'Teclado') then raise exception 'curso invalido'; end if;
  return p_curso;
end $$;

create or replace function public.balcao_listar(p_prof text default null, p_quem text default null)
returns table(code text, nome text, curso text, ativo boolean, criado_por text, criado_em timestamptz, usos integer, ultimo_uso timestamptz)
language plpgsql security definer set search_path to 'public' as $$
begin
  perform public._balcao_quem(p_prof, p_quem);
  return query select x.code, x.nome, x.curso, x.ativo, x.criado_por, x.criado_em, x.usos, x.ultimo_uso
    from public.alunos_codigos x where x.tipo = 'turma' and x.categoria = 'aluno' order by x.criado_em desc nulls last limit 1000;
end $$;

create or replace function public.balcao_gerar(p_prof text, p_quem text, p_nome text, p_curso text, p_ativo boolean default true)
returns text language plpgsql security definer set search_path to 'public' as $$
declare quem text := public._balcao_quem(p_prof, p_quem); n text := left(btrim(coalesce(p_nome, '')), 60); cur text := public._balcao_curso(p_curso); c text; i int; k int;
  alfa constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if n = '' then raise exception 'nome obrigatorio'; end if;
  for k in 1..30 loop
    c := ''; for i in 1..6 loop c := c || substr(alfa, 1 + floor(random() * length(alfa))::int, 1); end loop;
    if public.prof_valida(c) then continue; end if;
    begin
      insert into public.alunos_codigos(code, nome, tipo, categoria, dias, ativo, curso, criado_por, matricula)
        values (c, n, 'turma', 'aluno', 365, coalesce(p_ativo, true), cur, quem, case when coalesce(p_ativo, true) then 'ativa' else 'encerrada' end);
    exception when unique_violation then continue; end;
    insert into public.codigos_historico(code, acao, detalhe) values (c, 'balcao_gerar', jsonb_build_object('por', quem, 'nome', n, 'curso', cur, 'ativo', coalesce(p_ativo, true)));
    return c;
  end loop;
  raise exception 'nao consegui gerar um codigo livre';
end $$;

create or replace function public.balcao_importar(p_prof text, p_quem text, p_code text, p_nome text, p_curso text, p_ativo boolean default true, p_trocar boolean default false)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare quem text := public._balcao_quem(p_prof, p_quem); c text := public.fig_canon(p_code); n text := left(btrim(coalesce(p_nome, '')), 60); cur text := public._balcao_curso(p_curso); r public.alunos_codigos%rowtype; v_ativo boolean := coalesce(p_ativo, true);
begin
  if n = '' then raise exception 'nome obrigatorio'; end if;
  if char_length(c) < 4 or char_length(c) > 12 then raise exception 'codigo invalido'; end if;
  if public.prof_valida(c) then raise exception 'esse codigo nao pode ser importado'; end if;
  select * into r from public.alunos_codigos where code = c;
  if found then
    if r.tipo <> 'turma' or r.categoria <> 'aluno' then return jsonb_build_object('ok', false, 'motivo', 'outro_tipo'); end if;
    if not coalesce(p_trocar, false) then return jsonb_build_object('ok', false, 'motivo', 'existe', 'nome', r.nome, 'curso', r.curso, 'ativo', r.ativo); end if;
    update public.alunos_codigos set nome = n, curso = cur, ativo = v_ativo, matricula = case when v_ativo then 'ativa' else 'encerrada' end,
      matricula_encerrada_em = case when v_ativo then null else coalesce(matricula_encerrada_em, now()) end where code = c;
    insert into public.codigos_historico(code, acao, detalhe) values (c, 'balcao_trocar', jsonb_build_object('por', quem, 'de', jsonb_build_object('nome', r.nome, 'curso', r.curso, 'ativo', r.ativo), 'para', jsonb_build_object('nome', n, 'curso', cur, 'ativo', v_ativo)));
    return jsonb_build_object('ok', true, 'code', c, 'novo', false);
  end if;
  insert into public.alunos_codigos(code, nome, tipo, categoria, dias, ativo, curso, criado_por, matricula, matricula_encerrada_em)
    values (c, n, 'turma', 'aluno', 365, v_ativo, cur, quem, case when v_ativo then 'ativa' else 'encerrada' end, case when v_ativo then null else now() end);
  insert into public.codigos_historico(code, acao, detalhe) values (c, 'balcao_importar', jsonb_build_object('por', quem, 'nome', n, 'curso', cur, 'ativo', v_ativo));
  return jsonb_build_object('ok', true, 'code', c, 'novo', true);
end $$;

create or replace function public.balcao_ativar(p_prof text, p_quem text, p_code text, p_on boolean)
returns void language plpgsql security definer set search_path to 'public' as $$
declare quem text := public._balcao_quem(p_prof, p_quem); c text := public.fig_canon(p_code); r public.alunos_codigos%rowtype;
begin
  select * into r from public.alunos_codigos where code = c and tipo = 'turma' and categoria = 'aluno';
  if not found then raise exception 'codigo nao encontrado'; end if;
  if coalesce(p_on, false) then update public.alunos_codigos set ativo = true, matricula = 'ativa', matricula_encerrada_em = null where code = c;
  else update public.alunos_codigos set ativo = false where code = c; end if;
  insert into public.codigos_historico(code, acao, detalhe) values (c, case when coalesce(p_on, false) then 'balcao_ativar' else 'balcao_desativar' end, jsonb_build_object('por', quem, 'nome', r.nome));
end $$;

revoke all on function public._balcao_quem(text, text), public._balcao_curso(text) from public, anon, authenticated;
grant execute on function public.balcao_listar(text, text), public.balcao_gerar(text, text, text, text, boolean), public.balcao_importar(text, text, text, text, text, boolean, boolean), public.balcao_ativar(text, text, text, boolean) to anon, authenticated;
