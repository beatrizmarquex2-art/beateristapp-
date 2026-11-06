-- Passe Beaterista (compra única de R$ 49,90, 12 meses). NÃO APLICAR EM PRODUÇÃO antes da aprovação da Bea.
-- Testado em Postgres local (tests/sql/passe.test.mjs). Tudo fechado: as tabelas não têm acesso para anon/authenticated;
-- o site só chama as funções passe_status / passe_ativar / passe_resgatar_bonus. O webhook usa passe_processar_evento (só service_role).
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.passe_config (
  chave text primary key,
  valor text not null
);
-- ambiente: 'teste' | 'producao'. oferta_codigos / produto_ids: separados por vírgula. compra_ativa: 'sim' só quando a oferta real existir.
insert into public.passe_config(chave, valor) values ('ambiente', 'teste'), ('oferta_codigos', ''), ('produto_ids', ''), ('compra_ativa', 'nao')
  on conflict (chave) do nothing;

create table if not exists public.passe_direitos (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(btrim(email)) and email ~ '^[^@\s]+@[^@\s]+$'),
  estado text not null default 'ativo' check (estado in ('ativo', 'revogado')),
  expira_em timestamptz not null,
  aluno_code text unique,
  bonus_resgatado_em timestamptz,
  motivo_revogacao text,
  criado_em timestamptz not null default now()
);
create table if not exists public.passe_compras (
  transacao text primary key,
  direito_id uuid references public.passe_direitos(id),
  email text not null,
  oferta text,
  produto_id text,
  estado text not null check (estado in ('pendente', 'aprovada', 'cancelada', 'reembolsada', 'chargeback')),
  rank int not null,
  ultimo_evento_em timestamptz not null,
  inicio_em timestamptz,
  fim_em timestamptz,
  ambiente text not null,
  criado_em timestamptz not null default now()
);
create table if not exists public.passe_eventos (
  evento_id text primary key,
  transacao text,
  tipo text,
  resultado text not null,
  ambiente text,
  recebido_em timestamptz not null default now(),
  bruto jsonb
);
create table if not exists public.passe_codigos (
  id uuid primary key default gen_random_uuid(),
  direito_id uuid not null references public.passe_direitos(id),
  email text not null,
  codigo text not null check (codigo ~ '^PAUL[0-9]{4}$'),
  estado text not null default 'ativo' check (estado in ('ativo', 'usado', 'revogado', 'bloqueado')),
  expira_em timestamptz not null,
  falhas int not null default 0,
  usado_em timestamptz,
  criado_em timestamptz not null default now()
);
-- sem conflito entre códigos ativos (usados/revogados/bloqueados liberam o número)
create unique index if not exists passe_codigos_ativo_uq on public.passe_codigos(codigo) where estado = 'ativo';
create table if not exists public.passe_tentativas (id bigserial primary key, email text, em timestamptz not null default now());
create table if not exists public.passe_auditoria (id bigserial primary key, em timestamptz not null default now(), ator text not null, acao text not null, detalhe jsonb);
-- mensagens a enviar ao comprador (NADA é enviado por aqui: a Bea escolhe o serviço de e-mail depois)
create table if not exists public.passe_outbox (id bigserial primary key, criado_em timestamptz not null default now(), para text not null, modelo text not null, dados jsonb, estado text not null default 'pendente');

alter table public.passe_config enable row level security;
alter table public.passe_direitos enable row level security;
alter table public.passe_compras enable row level security;
alter table public.passe_eventos enable row level security;
alter table public.passe_codigos enable row level security;
alter table public.passe_tentativas enable row level security;
alter table public.passe_auditoria enable row level security;
alter table public.passe_outbox enable row level security;
revoke all on public.passe_config, public.passe_direitos, public.passe_compras, public.passe_eventos, public.passe_codigos, public.passe_tentativas, public.passe_auditoria, public.passe_outbox from anon, authenticated;

create or replace function public._passe_cfg(k text) returns text language sql stable security definer set search_path = public as $$
  select valor from public.passe_config where chave = k;
$$;
create or replace function public._passe_lista(t text) returns text[] language sql immutable as $$
  select coalesce(array_remove(array(select btrim(x) from unnest(string_to_array(coalesce(t, ''), ',')) x), ''), '{}');
$$;
-- dígito aleatório sem viés (rejeição) com gen_random_bytes
create or replace function public._passe_rand(n int) returns int language plpgsql volatile set search_path = public, extensions as $$
declare b bytea; v int;
begin
  loop
    b := gen_random_bytes(2); v := get_byte(b, 0) * 256 + get_byte(b, 1);
    if v < (65536 / n) * n then return v % n; end if;
  end loop;
end $$;
create or replace function public._passe_aluno_code() returns text language plpgsql volatile set search_path = public as $$
declare abc constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c text; i int;
begin
  loop
    c := 'PS';
    for i in 1..8 loop c := c || substr(abc, public._passe_rand(32) + 1, 1); end loop;
    exit when not exists (select 1 from public.alunos_codigos where code = c);
  end loop;
  return c;
end $$;

-- emite um código PAUL + 4 dígitos, sem repetir nenhum código ATIVO
create or replace function public._passe_emitir_codigo(p_direito uuid, p_email text, p_dias int default 30) returns text language plpgsql security definer set search_path = public as $$
declare c text; tries int := 0;
begin
  loop
    tries := tries + 1; if tries > 200 then raise exception 'sem códigos livres'; end if;
    c := 'PAUL' || lpad(public._passe_rand(10000)::text, 4, '0');
    begin
      insert into public.passe_codigos(direito_id, email, codigo, expira_em) values (p_direito, p_email, c, now() + make_interval(days => p_dias));
      return c;
    exception when unique_violation then null; end;
  end loop;
end $$;

-- mantém a conta de aluno ligada ao Passe igual ao direito (validade e revogação)
create or replace function public._passe_sincronizar(p_direito uuid) returns void language plpgsql security definer set search_path = public as $$
declare d public.passe_direitos;
begin
  select * into d from public.passe_direitos where id = p_direito; if not found or d.aluno_code is null then return; end if;
  update public.alunos_codigos set ativo = (d.estado = 'ativo'), expira_em = d.expira_em where code = d.aluno_code;
end $$;

create or replace function public._passe_recalcular(p_direito uuid, p_motivo text) returns void language plpgsql security definer set search_path = public as $$
declare f timestamptz;
begin
  select max(fim_em) into f from public.passe_compras where direito_id = p_direito and estado = 'aprovada';
  if f is null then
    update public.passe_direitos set estado = 'revogado', motivo_revogacao = p_motivo where id = p_direito;
    update public.passe_codigos set estado = 'revogado' where direito_id = p_direito and estado = 'ativo';
  else
    update public.passe_direitos set expira_em = f, estado = 'ativo', motivo_revogacao = null where id = p_direito;
  end if;
  perform public._passe_sincronizar(p_direito);
end $$;

-- Webhook da Hotmart (só service_role). Idempotente, tolera duplicata e eventos fora de ordem.
create or replace function public.passe_processar_evento(p_payload jsonb) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  eid text := coalesce(nullif(p_payload ->> 'id', ''), md5(p_payload::text));
  tipo text := upper(coalesce(p_payload ->> 'event', ''));
  tr text := nullif(btrim(coalesce(p_payload #>> '{data,purchase,transaction}', '')), '');
  em text := lower(btrim(coalesce(p_payload #>> '{data,buyer,email}', '')));
  prod text := nullif(btrim(coalesce(p_payload #>> '{data,product,id}', '')), '');
  ofe text := nullif(btrim(coalesce(p_payload #>> '{data,purchase,offer,code}', '')), '');
  amb text := public._passe_cfg('ambiente');
  ts timestamptz; novo text; r int; atual public.passe_compras; d public.passe_direitos; tem_d boolean; cod text; ac text; res text; ant_estado text;
begin
  begin ts := to_timestamp((p_payload ->> 'creation_date')::numeric / 1000.0); exception when others then ts := now(); end;
  if ts is null then ts := now(); end if;
  insert into public.passe_eventos(evento_id, transacao, tipo, resultado, ambiente, bruto) values (eid, tr, tipo, 'recebido', amb, p_payload) on conflict (evento_id) do nothing;
  if not found then return jsonb_build_object('ok', true, 'resultado', 'duplicado'); end if;
  if tr is null or em !~ '^[^@\s]+@[^@\s]+$' then update public.passe_eventos set resultado = 'ignorado_incompleto' where evento_id = eid; return jsonb_build_object('ok', true, 'resultado', 'ignorado_incompleto'); end if;
  -- só vale a oferta (e produto) do PASSE: compra avulsa nunca concede o Passe
  if ofe is null or not (ofe = any(public._passe_lista(public._passe_cfg('oferta_codigos'))))
     or (cardinality(public._passe_lista(public._passe_cfg('produto_ids'))) > 0 and (prod is null or not (prod = any(public._passe_lista(public._passe_cfg('produto_ids')))))) then
    update public.passe_eventos set resultado = 'ignorado_outra_oferta' where evento_id = eid; return jsonb_build_object('ok', true, 'resultado', 'ignorado_outra_oferta');
  end if;
  novo := case tipo when 'PURCHASE_APPROVED' then 'aprovada' when 'PURCHASE_COMPLETE' then 'aprovada'
    when 'PURCHASE_REFUNDED' then 'reembolsada' when 'PURCHASE_CHARGEBACK' then 'chargeback'
    when 'PURCHASE_CANCELED' then 'cancelada' when 'PURCHASE_EXPIRED' then 'cancelada'
    when 'PURCHASE_DELAYED' then 'pendente' when 'PURCHASE_BILLET_PRINTED' then 'pendente' when 'PURCHASE_PROTEST' then 'pendente' else null end;
  if novo is null then update public.passe_eventos set resultado = 'ignorado_tipo' where evento_id = eid; return jsonb_build_object('ok', true, 'resultado', 'ignorado_tipo'); end if;
  r := case novo when 'pendente' then 1 when 'cancelada' then 1 when 'aprovada' then 2 else 3 end;
  perform pg_advisory_xact_lock(hashtext('passe:' || tr));
  select * into atual from public.passe_compras where transacao = tr;
  if found and (r < atual.rank or (r = atual.rank and ts <= atual.ultimo_evento_em)) then
    update public.passe_eventos set resultado = 'ignorado_fora_de_ordem' where evento_id = eid; return jsonb_build_object('ok', true, 'resultado', 'ignorado_fora_de_ordem');
  end if;
  perform pg_advisory_xact_lock(hashtext('passe-email:' || em));
  select * into d from public.passe_direitos where email = em; tem_d := found;
  if novo = 'aprovada' then
    if not tem_d then
      insert into public.passe_direitos(email, expira_em) values (em, now()) returning * into d;
    end if;
    insert into public.passe_compras(transacao, direito_id, email, oferta, produto_id, estado, rank, ultimo_evento_em, ambiente) values (tr, d.id, em, ofe, prod, 'aprovada', r, ts, amb)
      on conflict (transacao) do update set estado = 'aprovada', rank = r, ultimo_evento_em = ts, direito_id = d.id;
    -- 12 meses a contar da aprovação; renovação estende a partir do fim atual, sem duplicar bônus
    update public.passe_compras set inicio_em = greatest(now(), coalesce((select max(fim_em) from public.passe_compras x where x.direito_id = d.id and x.estado = 'aprovada' and x.transacao <> tr), now())),
      fim_em = greatest(now(), coalesce((select max(fim_em) from public.passe_compras x where x.direito_id = d.id and x.estado = 'aprovada' and x.transacao <> tr), now())) + interval '12 months' where transacao = tr;
    if d.aluno_code is null then
      ac := public._passe_aluno_code();
      insert into public.alunos_codigos(code, nome, ativo, expira_em) values (ac, 'Passe Beaterista', true, now());
      update public.passe_direitos set aluno_code = ac where id = d.id;
    end if;
    perform public._passe_recalcular(d.id, null);
    if not exists (select 1 from public.passe_codigos where direito_id = d.id and (estado = 'usado' or (estado = 'ativo' and expira_em > now()))) then
      cod := public._passe_emitir_codigo(d.id, em);
      insert into public.passe_outbox(para, modelo, dados) values (em, 'passe_codigo', jsonb_build_object('codigo', cod));
    end if;
    res := 'aprovada';
  else
    insert into public.passe_compras(transacao, direito_id, email, oferta, produto_id, estado, rank, ultimo_evento_em, ambiente) values (tr, case when tem_d then d.id end, em, ofe, prod, novo, r, ts, amb)
      on conflict (transacao) do update set estado = novo, rank = r, ultimo_evento_em = ts;
    if tem_d and novo in ('reembolsada', 'chargeback') then perform public._passe_recalcular(d.id, novo); end if;
    res := novo;
  end if;
  update public.passe_eventos set resultado = res where evento_id = eid;
  insert into public.passe_auditoria(ator, acao, detalhe) values ('webhook', 'evento_' || res, jsonb_build_object('transacao', tr, 'email', em, 'evento', eid));
  return jsonb_build_object('ok', true, 'resultado', res);
end $$;

-- o comprador ativa: e-mail + código PAUL#### (uso único, 5 erros bloqueiam o código, consumo atômico)
create or replace function public.passe_ativar(p_email text, p_codigo text) returns jsonb language plpgsql security definer set search_path = public as $$
declare mail text := lower(btrim(coalesce(p_email, ''))); c text := upper(btrim(coalesce(p_codigo, ''))); k public.passe_codigos; d public.passe_direitos; nega jsonb := jsonb_build_object('ok', false, 'motivo', 'codigo');
begin
  if (select count(*) from public.passe_tentativas where em > now() - interval '1 minute') > 60 then raise exception 'muitas tentativas, espere um minuto'; end if;
  if (select count(*) from public.passe_tentativas t where t.email = mail and t.em > now() - interval '15 minutes') >= 8 then perform pg_sleep(0.5); return jsonb_build_object('ok', false, 'motivo', 'espere'); end if;
  if c !~ '^PAUL[0-9]{4}$' or mail !~ '^[^@\s]+@[^@\s]+$' then insert into public.passe_tentativas(email) values (mail); perform pg_sleep(0.5); return nega; end if;
  -- consumo atômico: um único UPDATE decide quem leva o código
  update public.passe_codigos set estado = 'usado', usado_em = now() where codigo = c and email = mail and estado = 'ativo' and expira_em > now() returning * into k;
  if not found then
    insert into public.passe_tentativas(email) values (mail);
    -- erro de código para um e-mail com código ativo: conta falha; 5 falhas bloqueiam o código (precisa reemitir)
    update public.passe_codigos set falhas = falhas + 1, estado = case when falhas + 1 >= 5 then 'bloqueado' else estado end where email = mail and estado = 'ativo';
    perform pg_sleep(0.5); return nega;
  end if;
  select * into d from public.passe_direitos where id = k.direito_id;
  if d.estado <> 'ativo' or d.expira_em <= now() then
    update public.passe_codigos set estado = 'revogado', usado_em = null where id = k.id; return jsonb_build_object('ok', false, 'motivo', 'sem_direito');
  end if;
  insert into public.passe_auditoria(ator, acao, detalhe) values ('comprador', 'ativacao', jsonb_build_object('email', mail));
  return jsonb_build_object('ok', true, 'code', d.aluno_code, 'expira_em', d.expira_em, 'bonus_pendente', d.bonus_resgatado_em is null);
end $$;

-- estado do acesso de um código: aluno comum, comprador ativo, vencido ou revogado
create or replace function public.passe_status(p_code text) returns jsonb language plpgsql security definer set search_path = public as $$
declare c text := upper(btrim(coalesce(p_code, ''))); d public.passe_direitos;
begin
  select * into d from public.passe_direitos where aluno_code = c;
  if found then
    return jsonb_build_object('tipo', 'passe', 'estado', case when d.estado = 'revogado' then 'revogado' when d.expira_em <= now() then 'vencido' else 'ativo' end,
      'expira_em', d.expira_em, 'bonus_resgatado', d.bonus_resgatado_em is not null);
  end if;
  if exists (select 1 from public.alunos_codigos where code = c and ativo and expira_em > now()) then return jsonb_build_object('tipo', 'aluno', 'estado', 'ativo'); end if;
  return jsonb_build_object('tipo', 'nenhum');
end $$;

-- envelope bônus: as 3 cartas saem UMA vez por conta, só com o Passe ativo. Reabrir ou renovar não repete.
create or replace function public.passe_resgatar_bonus(p_code text) returns jsonb language plpgsql security definer set search_path = public as $$
declare c text := upper(btrim(coalesce(p_code, ''))); n int;
begin
  update public.passe_direitos set bonus_resgatado_em = now() where aluno_code = c and estado = 'ativo' and expira_em > now() and bonus_resgatado_em is null;
  get diagnostics n = row_count;
  if n = 1 then return jsonb_build_object('ok', true, 'novo', true, 'ids', jsonb_build_array('P01', 'P02', 'P03')); end if;
  if exists (select 1 from public.passe_direitos where aluno_code = c and estado = 'ativo' and expira_em > now()) then return jsonb_build_object('ok', true, 'novo', false, 'ids', jsonb_build_array('P01', 'P02', 'P03')); end if;
  return jsonb_build_object('ok', false, 'motivo', 'sem_passe');
end $$;

-- Bea (e-mail em app_allowed_emails): consultar, reemitir código e revogar. Tudo auditado.
create or replace function public.passe_admin_listar() returns table(email text, estado text, expira_em timestamptz, aluno_code text, bonus boolean, compras jsonb, codigos jsonb)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_allowed() then raise exception 'nao autorizado'; end if;
  return query select d.email, d.estado, d.expira_em, d.aluno_code, d.bonus_resgatado_em is not null,
    coalesce((select jsonb_agg(jsonb_build_object('transacao', p.transacao, 'estado', p.estado, 'ambiente', p.ambiente, 'fim', p.fim_em)) from public.passe_compras p where p.direito_id = d.id), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('codigo', k.codigo, 'estado', k.estado, 'expira_em', k.expira_em)) from public.passe_codigos k where k.direito_id = d.id), '[]'::jsonb)
    from public.passe_direitos d order by d.criado_em desc limit 500;
end $$;
create or replace function public.passe_admin_reemitir(p_email text) returns text language plpgsql security definer set search_path = public as $$
declare d public.passe_direitos; c text;
begin
  if not public.is_allowed() then raise exception 'nao autorizado'; end if;
  select * into d from public.passe_direitos where email = lower(btrim(p_email)); if not found or d.estado <> 'ativo' or d.expira_em <= now() then raise exception 'sem Passe ativo para este e-mail'; end if;
  update public.passe_codigos set estado = 'revogado' where direito_id = d.id and estado = 'ativo';
  c := public._passe_emitir_codigo(d.id, d.email);
  insert into public.passe_auditoria(ator, acao, detalhe) values (coalesce(auth.email(), 'bea'), 'reemitir_codigo', jsonb_build_object('email', d.email));
  return c;
end $$;
create or replace function public.passe_admin_revogar(p_email text, p_motivo text default 'revogado pela Bea') returns boolean language plpgsql security definer set search_path = public as $$
declare d public.passe_direitos;
begin
  if not public.is_allowed() then raise exception 'nao autorizado'; end if;
  select * into d from public.passe_direitos where email = lower(btrim(p_email)); if not found then return false; end if;
  update public.passe_direitos set estado = 'revogado', motivo_revogacao = left(coalesce(p_motivo, ''), 200) where id = d.id;
  update public.passe_codigos set estado = 'revogado' where direito_id = d.id and estado = 'ativo';
  perform public._passe_sincronizar(d.id);
  insert into public.passe_auditoria(ator, acao, detalhe) values (coalesce(auth.email(), 'bea'), 'revogar', jsonb_build_object('email', d.email, 'motivo', p_motivo));
  return true;
end $$;

revoke all on function public._passe_cfg(text), public._passe_lista(text), public._passe_rand(int), public._passe_aluno_code(), public._passe_emitir_codigo(uuid, text, int), public._passe_sincronizar(uuid), public._passe_recalcular(uuid, text),
  public.passe_processar_evento(jsonb), public.passe_ativar(text, text), public.passe_status(text), public.passe_resgatar_bonus(text), public.passe_admin_listar(), public.passe_admin_reemitir(text), public.passe_admin_revogar(text, text) from public, anon, authenticated;
grant execute on function public.passe_ativar(text, text), public.passe_status(text), public.passe_resgatar_bonus(text) to anon, authenticated;
grant execute on function public.passe_admin_listar(), public.passe_admin_reemitir(text), public.passe_admin_revogar(text, text) to authenticated;
grant execute on function public.passe_processar_evento(jsonb) to service_role;
