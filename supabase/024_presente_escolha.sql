-- PRESENTE DO PAUL, parte 2 (nov/2026): a pessoa ESCOLHE 1 presente (planner, wallpaper ou colorir) e isso fica anotado na lista de contatos.
--  · token: código aleatório de cada contato (não é dado pessoal): o app guarda só ele no aparelho e, quando a pessoa escolher, avisa o banco com o token;
--  · presente / presente_em: o que ela escolheu (só a 1ª escolha vale);
--  · a lista da professora passa a mostrar a escolha e se a pessoa JÁ COMPROU o passe (e-mail do contato = e-mail de uma compra aprovada, Pix ou Hotmart).
-- Só ADICIONA colunas/funções; não apaga nada. Seguro rodar de novo.
alter table public.presente_leads add column if not exists token uuid not null default gen_random_uuid();
create unique index if not exists presente_leads_token_uq on public.presente_leads (token);
alter table public.presente_leads add column if not exists presente text;
alter table public.presente_leads add column if not exists presente_em timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'presente_leads_presente_check') then
    alter table public.presente_leads add constraint presente_leads_presente_check check (presente is null or presente in ('planner', 'wallpaper', 'colorir'));
  end if;
end $$;

-- registrar: igual ao de antes, e devolve o token do contato
create or replace function public.presente_registrar(p_nome text, p_email text, p_whatsapp text, p_instrumento text, p_outro text, p_faixa text, p_aceita boolean default false, p_origem text default 'inicio')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_nome text := left(btrim(coalesce(p_nome, '')), 60); v_email text := nullif(lower(btrim(coalesce(p_email, ''))), ''); v_zap text := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');
        v_outro text := nullif(left(btrim(coalesce(p_outro, '')), 40), ''); v_id bigint; v_token uuid;
begin
  if (select count(*) from public.presente_leads where criado_em > now() - interval '1 minute') > 200 then raise exception 'muitas tentativas, espere um minuto'; end if;
  if char_length(v_nome) < 2 or p_instrumento not in ('bateria', 'guitarra', 'teclado', 'violao', 'outro') or p_faixa not in ('4-12', '13-17', '18-29', '30+') then return jsonb_build_object('ok', false, 'motivo', 'dados'); end if;
  if v_zap = '' then v_zap := null;
  else
    if char_length(v_zap) in (10, 11) then v_zap := '55' || v_zap; end if;
    if v_zap !~ '^[0-9]{12,13}$' then v_zap := null; end if;
  end if;
  if v_email is not null and (char_length(v_email) > 160 or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$') then v_email := null; end if;
  if v_email is null and v_zap is null then return jsonb_build_object('ok', false, 'motivo', 'contato'); end if;
  if p_instrumento <> 'outro' then v_outro := null; end if;
  select id, token into v_id, v_token from public.presente_leads where (v_email is not null and lower(email) = v_email) or (v_zap is not null and whatsapp = v_zap) order by id limit 1;
  if v_id is null then
    insert into public.presente_leads(nome, email, whatsapp, instrumento, instrumento_outro, faixa_idade, aceita_novidades, aceita_em, origem)
    values (v_nome, v_email, v_zap, p_instrumento, v_outro, p_faixa, coalesce(p_aceita, false), case when coalesce(p_aceita, false) then now() end, left(coalesce(p_origem, 'inicio'), 20))
    returning id, token into v_id, v_token;
  else
    update public.presente_leads set nome = v_nome, email = coalesce(v_email, email), whatsapp = coalesce(v_zap, whatsapp), instrumento = p_instrumento, instrumento_outro = v_outro, faixa_idade = p_faixa,
      aceita_novidades = coalesce(p_aceita, false), aceita_em = case when coalesce(p_aceita, false) then coalesce(aceita_em, now()) else null end where id = v_id;
  end if;
  return jsonb_build_object('ok', true, 'faixa', p_faixa, 'token', v_token);
end $$;
revoke all on function public.presente_registrar(text, text, text, text, text, text, boolean, text) from public;
grant execute on function public.presente_registrar(text, text, text, text, text, text, boolean, text) to anon, authenticated;

-- escolher: o app avisa qual presente a pessoa escolheu (só a 1ª escolha vale)
create or replace function public.presente_escolher(p_token uuid, p_presente text) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if p_token is null or p_presente not in ('planner', 'wallpaper', 'colorir') then return false; end if;
  update public.presente_leads set presente = p_presente, presente_em = now() where token = p_token and presente is null; get diagnostics n = row_count;
  return n > 0;
end $$;
revoke all on function public.presente_escolher(uuid, text) from public;
grant execute on function public.presente_escolher(uuid, text) to anon, authenticated;

-- lista da professora: agora com a escolha e se já comprou o passe
drop function if exists public.presente_leads_listar();
create or replace function public.presente_leads_listar() returns table(id bigint, criado_em timestamptz, nome text, email text, whatsapp text, instrumento text, instrumento_outro text, faixa_idade text, aceita_novidades boolean, origem text, presente text, assinou boolean)
language plpgsql security definer set search_path = public as $$
begin
  perform public._bea_exige();
  return query select l.id, l.criado_em, l.nome, l.email, l.whatsapp, l.instrumento, l.instrumento_outro, l.faixa_idade, l.aceita_novidades, l.origem, l.presente,
    (l.email is not null and (exists (select 1 from public.mercadopago_passe_vendas v where lower(v.comprador_email) = lower(l.email) and v.status = 'aprovada')
                              or exists (select 1 from public.hotmart_passe_vendas v where lower(v.comprador_email) = lower(l.email) and v.status = 'aprovada')))
    from public.presente_leads l order by l.criado_em desc limit 5000;
end $$;
revoke all on function public.presente_leads_listar() from public, anon;
grant execute on function public.presente_leads_listar() to authenticated;
