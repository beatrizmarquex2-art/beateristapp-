-- PRESENTE DO PAUL (nov/2026): quem entra em "experimentar grátis" pode abrir um presente informando contato do RESPONSÁVEL,
-- instrumento favorito e faixa de idade. O presente é liberado na hora no app; a caixinha "quero receber novidades" é separada e opcional.
-- Tabela FECHADA: ninguém lê nem escreve direto (nem o app, nem anônimo). O app só chama presente_registrar(); a professora lê/apaga por funções próprias.
-- Segurança/LGPD: só dados mínimos; consentimento de novidades guardado com data; a professora pode apagar um contato ou tirar da lista de novidades.
-- Seguro rodar de novo.

-- (mesma função da 022: aqui de novo pra esta migração não depender da outra)
create or replace function public._bea_exige() returns void language plpgsql security definer set search_path = public as $$
begin if not public.is_allowed() then raise exception 'nao autorizado'; end if; end $$;
revoke all on function public._bea_exige() from public;

create table if not exists public.presente_leads (
  id bigserial primary key,
  criado_em timestamptz not null default now(),
  nome text not null check (char_length(nome) between 2 and 60),
  email text check (email is null or (char_length(email) <= 160 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9]{10,13}$'),
  instrumento text not null check (instrumento in ('bateria', 'guitarra', 'teclado', 'violao', 'outro')),
  instrumento_outro text check (instrumento_outro is null or char_length(instrumento_outro) <= 40),
  faixa_idade text not null check (faixa_idade in ('4-12', '13-17', '18-29', '30+')),
  aceita_novidades boolean not null default false,
  aceita_em timestamptz,
  origem text not null default 'inicio' check (char_length(origem) <= 20),
  check (email is not null or whatsapp is not null)
);
create unique index if not exists presente_leads_email_uq on public.presente_leads (lower(email)) where email is not null;
create unique index if not exists presente_leads_whatsapp_uq on public.presente_leads (whatsapp) where whatsapp is not null;
alter table public.presente_leads enable row level security;
revoke all on public.presente_leads from anon, authenticated;
revoke all on sequence public.presente_leads_id_seq from anon, authenticated;

-- o app chama esta função (anônimo). Valida tudo no servidor; devolve só { ok, faixa } ou { ok:false, motivo }.
create or replace function public.presente_registrar(p_nome text, p_email text, p_whatsapp text, p_instrumento text, p_outro text, p_faixa text, p_aceita boolean default false, p_origem text default 'inicio')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_nome text := left(btrim(coalesce(p_nome, '')), 60); v_email text := nullif(lower(btrim(coalesce(p_email, ''))), ''); v_zap text := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');
        v_outro text := nullif(left(btrim(coalesce(p_outro, '')), 40), ''); v_id bigint;
begin
  if (select count(*) from public.presente_leads where criado_em > now() - interval '1 minute') > 200 then raise exception 'muitas tentativas, espere um minuto'; end if;
  if char_length(v_nome) < 2 or p_instrumento not in ('bateria', 'guitarra', 'teclado', 'violao', 'outro') or p_faixa not in ('4-12', '13-17', '18-29', '30+') then return jsonb_build_object('ok', false, 'motivo', 'dados'); end if;
  if v_zap = '' then v_zap := null;
  else
    if char_length(v_zap) in (10, 11) then v_zap := '55' || v_zap; end if;           -- DDD + número: assume Brasil
    if v_zap !~ '^[0-9]{12,13}$' then v_zap := null; end if;                          -- número que não parece de verdade não conta como contato
  end if;
  if v_email is not null and (char_length(v_email) > 160 or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$') then v_email := null; end if;
  if v_email is null and v_zap is null then return jsonb_build_object('ok', false, 'motivo', 'contato'); end if;
  if p_instrumento <> 'outro' then v_outro := null; end if;
  select id into v_id from public.presente_leads where (v_email is not null and lower(email) = v_email) or (v_zap is not null and whatsapp = v_zap) order by id limit 1;
  if v_id is null then
    insert into public.presente_leads(nome, email, whatsapp, instrumento, instrumento_outro, faixa_idade, aceita_novidades, aceita_em, origem)
    values (v_nome, v_email, v_zap, p_instrumento, v_outro, p_faixa, coalesce(p_aceita, false), case when coalesce(p_aceita, false) then now() end, left(coalesce(p_origem, 'inicio'), 20));
  else  -- mesma pessoa de novo: atualiza (vale a última escolha, inclusive a da caixinha de novidades)
    update public.presente_leads set nome = v_nome, email = coalesce(v_email, email), whatsapp = coalesce(v_zap, whatsapp), instrumento = p_instrumento, instrumento_outro = v_outro, faixa_idade = p_faixa,
      aceita_novidades = coalesce(p_aceita, false), aceita_em = case when coalesce(p_aceita, false) then coalesce(aceita_em, now()) else null end where id = v_id;
  end if;
  return jsonb_build_object('ok', true, 'faixa', p_faixa);
end $$;
revoke all on function public.presente_registrar(text, text, text, text, text, text, boolean, text) from public;
grant execute on function public.presente_registrar(text, text, text, text, text, text, boolean, text) to anon, authenticated;

-- professora: ver a lista, tirar alguém das novidades, apagar um contato (pedido do responsável)
create or replace function public.presente_leads_listar() returns table(id bigint, criado_em timestamptz, nome text, email text, whatsapp text, instrumento text, instrumento_outro text, faixa_idade text, aceita_novidades boolean, origem text)
language plpgsql security definer set search_path = public as $$
begin
  perform public._bea_exige();
  return query select l.id, l.criado_em, l.nome, l.email, l.whatsapp, l.instrumento, l.instrumento_outro, l.faixa_idade, l.aceita_novidades, l.origem from public.presente_leads l order by l.criado_em desc limit 5000;
end $$;
create or replace function public.presente_lead_novidades(p_id bigint, p_aceita boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  perform public._bea_exige();
  update public.presente_leads set aceita_novidades = coalesce(p_aceita, false), aceita_em = case when coalesce(p_aceita, false) then coalesce(aceita_em, now()) else null end where id = p_id; get diagnostics n = row_count; return n > 0;
end $$;
create or replace function public.presente_lead_apagar(p_id bigint) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  perform public._bea_exige();
  delete from public.presente_leads where id = p_id; get diagnostics n = row_count; return n > 0;
end $$;
do $$ declare f text; begin
  foreach f in array array['presente_leads_listar()', 'presente_lead_novidades(bigint,boolean)', 'presente_lead_apagar(bigint)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
