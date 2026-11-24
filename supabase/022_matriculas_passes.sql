-- MATRÍCULAS E PASSES (nov/2026)
--   · aluno matriculado: acesso gratuito enquanto a matrícula estiver ativa (sem vencimento anual), 2 aparelhos por código;
--   · matrícula encerrada: o ACESSO é suspenso no servidor (aluno_acesso), mas o código, o progresso, as figurinhas e as conquistas ficam intactos;
--   · ex-aluno: passe pago de R$ 49,90, 12 meses, NO MESMO CÓDIGO (ativado pela professora só depois de confirmar o pagamento);
--   · reativar a matrícula devolve o acesso gratuito. Compradores externos, amigos, marcas e professoras NÃO entram nessas regras (matricula = null).
-- Só ADICIONA colunas/funções e troca aluno_acesso por uma versão compatível (o app antigo continua funcionando). Não apaga nem reescreve linhas reais:
-- o único UPDATE em dados existentes é marcar como matricula='ativa' os códigos tipo 'turma' + categoria 'aluno' (os alunos de hoje).
-- Seguro rodar de novo.

alter table public.alunos_codigos add column if not exists matricula text;
alter table public.alunos_codigos add column if not exists matricula_encerrada_em timestamptz;
alter table public.alunos_codigos add column if not exists passe_pago_em timestamptz;
alter table public.alunos_codigos add column if not exists passe_pago_ate timestamptz;
alter table public.alunos_codigos add column if not exists pagamento_ref text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'alunos_codigos_matricula_check') then
    alter table public.alunos_codigos add constraint alunos_codigos_matricula_check check (matricula is null or matricula in ('ativa', 'encerrada'));
  end if;
end $$;

-- quem já era "turma" (aluno matriculado) vira matricula='ativa'. Nada mais muda.
update public.alunos_codigos set matricula = case when ativo then 'ativa' else 'encerrada' end,
       matricula_encerrada_em = case when ativo then null else now() end
 where matricula is null and tipo = 'turma' and categoria = 'aluno';

-- histórico das ações da professora (quem encerrou, reativou, ativou passe...). Só ela lê; ninguém apaga pelo app.
create table if not exists public.codigos_historico (
  id bigserial primary key,
  code text not null,
  acao text not null,
  detalhe jsonb not null default '{}'::jsonb,
  em timestamptz not null default now()
);
create index if not exists codigos_historico_code_idx on public.codigos_historico (code, em desc);
alter table public.codigos_historico enable row level security;
revoke all on public.codigos_historico from anon, authenticated;
grant select on public.codigos_historico to authenticated;
drop policy if exists hist_bea_ler on public.codigos_historico;
create policy hist_bea_ler on public.codigos_historico for select to authenticated using (public.is_allowed());

-- Rede de segurança: (1) código novo "turma + aluno" nasce como matriculado; (2) matrícula encerrada SEM passe pago válido nunca fica ativa,
-- nem por "importar lista" nem por um toque no interruptor antigo. Só reativar a matrícula (ou ativar o passe pago) devolve o acesso.
create or replace function public.alunos_codigos_guarda() returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.matricula is null and new.tipo = 'turma' and new.categoria = 'aluno' then new.matricula := 'ativa'; end if;
  -- quem desativa um matriculado pelo jeito antigo (ativo = false) passa a constar como matrícula encerrada (o histórico e a oferta de R$ 49,90 seguem o mesmo caminho)
  if tg_op = 'UPDATE' and new.tipo = 'turma' and new.matricula = 'ativa' and old.ativo and not new.ativo then new.matricula := 'encerrada'; new.matricula_encerrada_em := now(); end if;
  if new.matricula = 'encerrada' and new.ativo and coalesce(new.passe_pago_ate, '-infinity'::timestamptz) <= now() then new.ativo := false; end if;
  return new;
end $$;
drop trigger if exists alunos_codigos_guarda on public.alunos_codigos;
create trigger alunos_codigos_guarda before insert or update on public.alunos_codigos for each row execute function public.alunos_codigos_guarda();

-- ===== O ACESSO (autenticação) =====
-- Igual à versão em produção (rate limit, professora, 'matricula', 'vencido', 'aparelho(s)'), mais:
--  · matrícula encerrada = 'matricula' também quando o passe pago do ex-aluno venceu (a oferta de R$ 49,90 volta);
--  · limite de aparelhos também para matriculados (quando o app manda o id do aparelho; app antigo, sem id, segue sem limite);
--  · vaga de aparelho parada há 30 dias é liberada sozinha (troca de celular);
--  · devolve 'matricula', 'passe_pago_em' e 'passe_pago_ate' (a tela "Meu passe") e volta a devolver 'jogos' (passe de abas).
create or replace function public.aluno_acesso(p_code text, p_aparelho text default null, p_ua text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare c text := public.fig_canon(p_code); r public.alunos_codigos%rowtype; n int; ap text := nullif(btrim(coalesce(p_aparelho, '')), ''); extra jsonb;
begin
  if (select count(*) from public.acesso_falhas where em > now() - interval '1 minute') > 120 then raise exception 'muitas tentativas, espere um minuto'; end if;
  delete from public.acesso_falhas where em < now() - interval '1 hour';
  if public.prof_valida(c) then return jsonb_build_object('ok', true, 'tipo', 'prof', 'nome', 'Professora'); end if;
  select * into r from public.alunos_codigos where code = c;
  if not found then
    insert into public.acesso_falhas default values; perform pg_sleep(0.4);
    return jsonb_build_object('ok', false, 'motivo', 'codigo');
  end if;
  extra := jsonb_build_object('matricula', r.matricula, 'passe_pago_em', r.passe_pago_em, 'passe_pago_ate', r.passe_pago_ate);
  if not r.ativo then
    insert into public.acesso_falhas default values; perform pg_sleep(0.4);
    return jsonb_build_object('ok', false, 'motivo', case when r.matricula = 'encerrada' or r.tipo = 'turma' then 'matricula' else 'codigo' end) || extra;
  end if;
  if r.expira_em is not null and r.expira_em <= now() then
    return jsonb_build_object('ok', false, 'motivo', case when r.matricula = 'encerrada' then 'matricula' else 'vencido' end) || extra;
  end if;
  if r.tipo = 'passe' and (ap is null or char_length(ap) < 8 or char_length(ap) > 64) then return jsonb_build_object('ok', false, 'motivo', 'aparelho') || extra; end if;
  if ap is not null and char_length(ap) >= 8 and char_length(ap) <= 64 then
    perform pg_advisory_xact_lock(hashtext(c));
    delete from public.codigos_aparelhos where code = c and ultimo_uso < now() - interval '30 days';
    if exists (select 1 from public.codigos_aparelhos where code = c and aparelho = ap) then
      update public.codigos_aparelhos set ultimo_uso = now() where code = c and aparelho = ap;
    else
      select count(*) into n from public.codigos_aparelhos where code = c;
      if n >= r.max_aparelhos then return jsonb_build_object('ok', false, 'motivo', 'aparelhos', 'max', r.max_aparelhos) || extra; end if;
      insert into public.codigos_aparelhos(code, aparelho, ua) values (c, ap, left(p_ua, 160));
    end if;
  end if;
  update public.alunos_codigos set usos = usos + 1, ultimo_uso = now(),
    iniciado_em = coalesce(iniciado_em, now()),
    expira_em = case when tipo = 'passe' and expira_em is null then now() + make_interval(days => dias) else expira_em end
   where code = c returning expira_em into r.expira_em;
  return jsonb_build_object('ok', true, 'tipo', r.tipo, 'nome', r.nome, 'expira_em', r.expira_em, 'jogos', to_jsonb(r.jogos)) || extra;
end $function$;
grant execute on function public.aluno_acesso(text, text, text) to anon, authenticated;

-- ===== AÇÕES DA PROFESSORA (só quem está em app_allowed_emails) =====
create or replace function public._bea_exige() returns void language plpgsql security definer set search_path = public as $$
begin if not public.is_allowed() then raise exception 'nao autorizado'; end if; end $$;
revoke all on function public._bea_exige() from public;

create or replace function public._cod_estado(c text) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('code', x.code, 'tipo', x.tipo, 'ativo', x.ativo, 'matricula', x.matricula, 'expira_em', x.expira_em,
    'passe_pago_em', x.passe_pago_em, 'passe_pago_ate', x.passe_pago_ate) from public.alunos_codigos x where x.code = c;
$$;
revoke all on function public._cod_estado(text) from public;

create or replace function public.matricula_encerrar(p_code text, p_obs text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c text := public.fig_canon(p_code); r public.alunos_codigos%rowtype;
begin
  perform public._bea_exige();
  select * into r from public.alunos_codigos where code = c for update;
  if not found then raise exception 'codigo nao encontrado'; end if;
  if r.matricula is distinct from 'ativa' then raise exception 'a matricula nao esta ativa'; end if;
  if r.passe_pago_ate is not null and r.passe_pago_ate > now() then
    -- já tinha pago um passe que ainda vale: continua jogando até o fim dele
    update public.alunos_codigos set matricula = 'encerrada', matricula_encerrada_em = now(), tipo = 'passe', ativo = true, expira_em = r.passe_pago_ate where code = c;
  else
    update public.alunos_codigos set matricula = 'encerrada', matricula_encerrada_em = now(), ativo = false where code = c;
  end if;
  insert into public.codigos_historico(code, acao, detalhe) values (c, 'matricula_encerrada', jsonb_build_object('obs', left(p_obs, 200)));
  return public._cod_estado(c);
end $$;

create or replace function public.matricula_reativar(p_code text, p_obs text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c text := public.fig_canon(p_code); r public.alunos_codigos%rowtype;
begin
  perform public._bea_exige();
  select * into r from public.alunos_codigos where code = c for update;
  if not found then raise exception 'codigo nao encontrado'; end if;
  if r.matricula is distinct from 'encerrada' then raise exception 'a matricula nao esta encerrada'; end if;
  -- o passe pago (se ainda houver tempo) fica guardado em passe_pago_ate e volta a valer se a matrícula terminar de novo
  update public.alunos_codigos set matricula = 'ativa', matricula_encerrada_em = null, tipo = 'turma', ativo = true, expira_em = null where code = c;
  insert into public.codigos_historico(code, acao, detalhe) values (c, 'matricula_reativada', jsonb_build_object('obs', left(p_obs, 200)));
  return public._cod_estado(c);
end $$;

-- Classifica como matriculado um código de ALUNO que a professora cadastrou à mão (hoje eles nascem como passe de 1 ano).
-- Recusa códigos de amigos, marcas, outros e de compradores (Hotmart / Pix): essas regras não se aplicam a eles.
create or replace function public.matricula_marcar(p_code text, p_obs text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c text := public.fig_canon(p_code); r public.alunos_codigos%rowtype;
begin
  perform public._bea_exige();
  select * into r from public.alunos_codigos where code = c for update;
  if not found then raise exception 'codigo nao encontrado'; end if;
  if r.matricula is not null then raise exception 'ja e matriculado'; end if;
  if r.categoria <> 'aluno' then raise exception 'so codigos da categoria aluno'; end if;
  if exists (select 1 from public.hotmart_passe_vendas v where v.codigo = c) or exists (select 1 from public.mercadopago_passe_vendas v where v.codigo = c) then
    raise exception 'codigo de comprador externo'; end if;
  update public.alunos_codigos set matricula = 'ativa', matricula_encerrada_em = null, tipo = 'turma', expira_em = null where code = c;
  insert into public.codigos_historico(code, acao, detalhe) values (c, 'matricula_marcada', jsonb_build_object('obs', left(p_obs, 200), 'tipo_antes', r.tipo));
  return public._cod_estado(c);
end $$;

-- Ativa o passe pago (R$ 49,90, 12 meses) de um EX-ALUNO, no mesmo código. Só com a confirmação manual do pagamento (p_confirmado = true + referência).
create or replace function public.passe_pago_ativar(p_code text, p_confirmado boolean, p_ref text, p_obs text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c text := public.fig_canon(p_code); r public.alunos_codigos%rowtype; v_ini timestamptz; v_ate timestamptz;
begin
  perform public._bea_exige();
  if p_confirmado is not true then raise exception 'pagamento nao confirmado'; end if;
  if char_length(btrim(coalesce(p_ref, ''))) < 3 then raise exception 'informe a referencia do pagamento'; end if;
  select * into r from public.alunos_codigos where code = c for update;
  if not found then raise exception 'codigo nao encontrado'; end if;
  if r.matricula is distinct from 'encerrada' then raise exception 'so para ex-aluno (matricula encerrada)'; end if;
  if r.passe_pago_em is not null and r.passe_pago_em > now() - interval '10 minutes' then raise exception 'passe ja ativado ha instantes'; end if;
  if r.passe_pago_ate is not null and r.passe_pago_ate > now() then v_ini := coalesce(r.passe_pago_em, now()); v_ate := r.passe_pago_ate + interval '12 months'; -- renovação antecipada: soma
  else v_ini := now(); v_ate := now() + interval '12 months'; end if;
  update public.alunos_codigos set tipo = 'passe', ativo = true, dias = 365, max_aparelhos = greatest(coalesce(max_aparelhos, 2), 2), iniciado_em = coalesce(iniciado_em, v_ini),
    passe_pago_em = v_ini, passe_pago_ate = v_ate, expira_em = v_ate, pagamento_ref = left(btrim(p_ref), 120) where code = c;
  insert into public.codigos_historico(code, acao, detalhe) values (c, 'passe_pago_ativado', jsonb_build_object('ref', left(btrim(p_ref), 120), 'obs', left(p_obs, 200), 'ate', v_ate));
  return public._cod_estado(c);
end $$;

-- aparelhos: ver, liberar um, ajustar o limite (1 a 5) e contagem de todos de uma vez
create or replace function public.codigo_aparelhos(p_code text) returns table(aparelho text, ua text, primeiro_uso timestamptz, ultimo_uso timestamptz, max_aparelhos int)
language plpgsql security definer set search_path = public as $$
declare c text := public.fig_canon(p_code);
begin
  perform public._bea_exige();
  return query select a.aparelho, a.ua, a.primeiro_uso, a.ultimo_uso, (select x.max_aparelhos from public.alunos_codigos x where x.code = c)
    from public.codigos_aparelhos a where a.code = c order by a.ultimo_uso desc;
end $$;
create or replace function public.codigo_aparelho_liberar(p_code text, p_aparelho text) returns boolean
language plpgsql security definer set search_path = public as $$
declare c text := public.fig_canon(p_code); n int;
begin
  perform public._bea_exige();
  delete from public.codigos_aparelhos where code = c and aparelho = p_aparelho; get diagnostics n = row_count;
  if n > 0 then insert into public.codigos_historico(code, acao, detalhe) values (c, 'aparelho_liberado', jsonb_build_object('aparelho', left(p_aparelho, 8))); end if;
  return n > 0;
end $$;
create or replace function public.codigo_max_aparelhos(p_code text, p_max int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c text := public.fig_canon(p_code);
begin
  perform public._bea_exige();
  if p_max is null or p_max < 1 or p_max > 5 then raise exception 'limite deve ser de 1 a 5'; end if;
  update public.alunos_codigos set max_aparelhos = p_max where code = c;
  if not found then raise exception 'codigo nao encontrado'; end if;
  insert into public.codigos_historico(code, acao, detalhe) values (c, 'limite_aparelhos', jsonb_build_object('max', p_max));
  return public._cod_estado(c);
end $$;
create or replace function public.codigos_resumo() returns table(code text, aparelhos int)
language plpgsql security definer set search_path = public as $$
begin
  perform public._bea_exige();
  return query select a.code, count(*)::int from public.codigos_aparelhos a group by a.code;
end $$;

-- progresso: SÓ LEITURA (números e nomes de jogos; nada é alterado). O conteúdo completo continua só no aparelho/nuvem do aluno.
create or replace function public.codigo_progresso(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c text := public.fig_canon(p_code); p record; f record; j jsonb;
begin
  perform public._bea_exige();
  select a.atualizado_em, a.salvos, length(a.dados::text) as tam, a.dados into p from public.aluno_progresso a where a.code = c;
  select g.acessos, g.coladas, g.primeiro_acesso, g.ultimo_acesso into f from public.fig_aluno g where g.code = c;
  j := case when p.dados is not null and jsonb_typeof(p.dados -> 'jogos') = 'object' then (select coalesce(jsonb_agg(k order by k), '[]'::jsonb) from jsonb_object_keys(p.dados -> 'jogos') k) else '[]'::jsonb end;
  return jsonb_build_object('code', c,
    'nuvem', case when p.atualizado_em is null then null else jsonb_build_object('atualizado_em', p.atualizado_em, 'salvos', p.salvos, 'bytes', p.tam, 'jogos', j) end,
    'figurinhas', case when f.ultimo_acesso is null and f.acessos is null then null else jsonb_build_object('coladas', f.coladas, 'acessos', f.acessos, 'primeiro_acesso', f.primeiro_acesso, 'ultimo_acesso', f.ultimo_acesso) end,
    'historico', (select coalesce(jsonb_agg(jsonb_build_object('acao', h.acao, 'em', h.em, 'detalhe', h.detalhe) order by h.em desc), '[]'::jsonb) from (select * from public.codigos_historico where code = c order by em desc limit 15) h));
end $$;

do $$ declare f text; begin
  foreach f in array array['matricula_encerrar(text,text)', 'matricula_reativar(text,text)', 'matricula_marcar(text,text)', 'passe_pago_ativar(text,boolean,text,text)',
    'codigo_aparelhos(text)', 'codigo_aparelho_liberar(text,text)', 'codigo_max_aparelhos(text,int)', 'codigos_resumo()', 'codigo_progresso(text)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
