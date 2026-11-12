-- Limite de aparelhos por código de aluno: no máximo `max_aparelhos` (padrão 2) aparelhos ao mesmo tempo.
-- Vale pra 'passe' (já valia) e pra 'turma' quando o app manda o id do aparelho. App antigo (sem id) segue funcionando sem limite.
-- Vaga parada há 30 dias é liberada sozinha; "sair/tirar da lista" no app libera na hora (aluno_sair).
alter table public.alunos_codigos add column if not exists jogos text[]; -- telas que o passe libera (null = o site todo)

create or replace function public.aluno_acesso(p_code text, p_aparelho text default null, p_ua text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare c text := public.fig_canon(p_code); r public.alunos_codigos%rowtype; n int; ap text := nullif(btrim(coalesce(p_aparelho, '')), '');
begin
  if (select count(*) from public.acesso_falhas where em > now() - interval '1 minute') > 120 then raise exception 'muitas tentativas, espere um minuto'; end if;
  delete from public.acesso_falhas where em < now() - interval '1 hour';
  if public.prof_valida(c) then return jsonb_build_object('ok', true, 'tipo', 'prof', 'nome', 'Professora'); end if;
  select * into r from public.alunos_codigos where code = c;
  if not found or not r.ativo then
    insert into public.acesso_falhas default values; perform pg_sleep(0.4);
    return jsonb_build_object('ok', false, 'motivo', 'codigo');
  end if;
  if r.expira_em is not null and r.expira_em <= now() then return jsonb_build_object('ok', false, 'motivo', 'vencido'); end if;
  if r.tipo = 'passe' and (ap is null or char_length(ap) < 8 or char_length(ap) > 64) then return jsonb_build_object('ok', false, 'motivo', 'aparelho'); end if;
  if ap is not null and char_length(ap) >= 8 and char_length(ap) <= 64 then
    perform pg_advisory_xact_lock(hashtext(c));
    delete from public.codigos_aparelhos where code = c and ultimo_uso < now() - interval '30 days';
    if exists (select 1 from public.codigos_aparelhos where code = c and aparelho = ap) then
      update public.codigos_aparelhos set ultimo_uso = now() where code = c and aparelho = ap;
    else
      select count(*) into n from public.codigos_aparelhos where code = c;
      if n >= coalesce(r.max_aparelhos, 2) then return jsonb_build_object('ok', false, 'motivo', 'aparelhos', 'max', coalesce(r.max_aparelhos, 2)); end if;
      insert into public.codigos_aparelhos(code, aparelho, ua) values (c, ap, left(p_ua, 160));
    end if;
  end if;
  update public.alunos_codigos set usos = usos + 1, ultimo_uso = now(),
    iniciado_em = coalesce(iniciado_em, now()),
    expira_em = case when tipo = 'passe' and expira_em is null then now() + make_interval(days => dias) else expira_em end
   where code = c returning expira_em into r.expira_em;
  return jsonb_build_object('ok', true, 'tipo', r.tipo, 'nome', r.nome, 'expira_em', r.expira_em, 'jogos', to_jsonb(r.jogos));
end $function$;

-- Libera a vaga deste aparelho (o aluno saiu / tirou o código da lista).
create or replace function public.aluno_sair(p_code text, p_aparelho text)
returns void language sql security definer set search_path to 'public' as $$
  delete from public.codigos_aparelhos where code = public.fig_canon(p_code) and aparelho = nullif(btrim(coalesce(p_aparelho, '')), '');
$$;
grant execute on function public.aluno_acesso(text, text, text) to anon, authenticated;
grant execute on function public.aluno_sair(text, text) to anon, authenticated;
