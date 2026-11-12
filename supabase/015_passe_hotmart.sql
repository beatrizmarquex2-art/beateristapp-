-- Passe Beaterista (R$ 49,90, pagamento único, 12 meses) vendido pela Hotmart: liberação automática.
-- Reaproveita o sistema de códigos que já existe: o comprador ganha uma linha em `alunos_codigos` (tipo 'passe',
-- 2 aparelhos, expira_em = aprovação + 12 meses) e entra pelo MESMO campo "CÓDIGO DE ACESSO" do site (aluno_acesso).
-- A venda fica ligada ao código em `passe_compras` (1 linha por transação da Hotmart).
-- Só a Edge Function `hotmart-passe` (service_role) chama estas funções. Nenhuma vira pública (anon/authenticated sem acesso).
-- Reembolso/chargeback desativam SÓ o código ligado àquela transação; códigos de turma e de outros passes ficam intactos.
-- NÃO aplicado ainda: precisa da confirmação da Bea (muda o banco).

create table if not exists public.passe_compras (
  transacao text primary key check (char_length(transacao) between 4 and 80),
  code text references public.alunos_codigos(code) on delete set null, -- null = só o aviso de reembolso chegou antes da aprovação
  produto text not null default '',
  email text not null default '' check (char_length(email) <= 254),
  comprador text not null default '' check (char_length(comprador) <= 120),
  status text not null default 'aprovada' check (status in ('aprovada', 'reembolsada', 'chargeback')),
  aprovado_em timestamptz,
  revogado_em timestamptz,
  email_enviado_em timestamptz,
  email_tentativas int not null default 0,
  email_erro text,
  criado_em timestamptz not null default now()
);
create index if not exists passe_compras_code_idx on public.passe_compras(code);
alter table public.passe_compras enable row level security;
revoke all on public.passe_compras from anon, authenticated;
grant select on public.passe_compras to authenticated;
drop policy if exists passe_bea_ler on public.passe_compras;
create policy passe_bea_ler on public.passe_compras for select to authenticated using (public.is_allowed());

-- código aleatório de 10 caracteres (P + 9), alfabeto de 32 sem I, O, 0, 1; bytes do gen_random_uuid() (aleatório forte, sem viés: 256 % 32 = 0)
create or replace function public.passe_gerar_codigo() returns text language plpgsql volatile as $$
declare alfa constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex'); s text := 'P'; i int;
begin
  foreach i in array array[0, 1, 2, 3, 4, 5, 7, 9, 10] loop -- pula os bytes 6 e 8 (bits fixos do uuid v4)
    s := s || substr(alfa, 1 + (get_byte(b, i) % 32), 1);
  end loop;
  return s;
end $$;

-- Aprovação: cria (ou devolve) o código da transação. Aviso repetido = mesmo código. Se a venda já foi revogada, não reativa.
create or replace function public.passe_registrar_compra(p_transacao text, p_email text, p_nome text, p_produto text, p_aprovado_em timestamptz default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t text := btrim(coalesce(p_transacao, '')); c public.passe_compras%rowtype; cod text; aprov timestamptz; exp timestamptz; n int := 0; nm text;
begin
  if char_length(t) < 4 or char_length(t) > 80 then raise exception 'transacao invalida'; end if;
  perform pg_advisory_xact_lock(hashtext('passe:' || t));
  select * into c from public.passe_compras where transacao = t;
  if found then
    select a.expira_em into exp from public.alunos_codigos a where a.code = c.code;
    return jsonb_build_object('novo', false, 'status', c.status, 'code', c.code, 'expira_em', exp, 'email_enviado', c.email_enviado_em is not null);
  end if;
  aprov := least(coalesce(p_aprovado_em, now()), now()); -- 12 meses contam da aprovação; nunca no futuro
  exp := aprov + interval '12 months';
  nm := left('Passe ' || btrim(coalesce(p_nome, '')), 60);
  loop
    cod := public.passe_gerar_codigo(); n := n + 1;
    begin
      insert into public.alunos_codigos(code, nome, tipo, dias, max_aparelhos, expira_em, ativo) values (cod, nm, 'passe', 365, 2, exp, true);
      exit;
    exception when unique_violation then
      if n >= 8 then raise exception 'sem codigo livre'; end if;
    end;
  end loop;
  insert into public.passe_compras(transacao, code, produto, email, comprador, status, aprovado_em)
    values (t, cod, left(coalesce(p_produto, ''), 80), left(btrim(coalesce(p_email, '')), 254), left(btrim(coalesce(p_nome, '')), 120), 'aprovada', aprov);
  return jsonb_build_object('novo', true, 'status', 'aprovada', 'code', cod, 'expira_em', exp, 'email_enviado', false);
end $$;

-- Reembolso / chargeback: desativa só o código ligado a esta transação (e só se for do tipo passe).
create or replace function public.passe_revogar(p_transacao text, p_motivo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t text := btrim(coalesce(p_transacao, '')); c public.passe_compras%rowtype; n int := 0;
begin
  if char_length(t) < 4 or char_length(t) > 80 then raise exception 'transacao invalida'; end if;
  if p_motivo not in ('reembolsada', 'chargeback') then raise exception 'motivo invalido'; end if;
  perform pg_advisory_xact_lock(hashtext('passe:' || t));
  select * into c from public.passe_compras where transacao = t;
  if not found then -- o aviso de reembolso chegou antes (ou sem) a aprovação: marca a transação, e uma aprovação tardia não libera nada
    insert into public.passe_compras(transacao, status, revogado_em) values (t, p_motivo, now());
    return jsonb_build_object('revogado', false, 'motivo', 'sem_compra');
  end if;
  if c.status <> 'aprovada' then return jsonb_build_object('revogado', false, 'motivo', 'ja_revogada', 'status', c.status); end if;
  update public.passe_compras set status = p_motivo, revogado_em = now() where transacao = t;
  update public.alunos_codigos set ativo = false where code = c.code and tipo = 'passe';
  get diagnostics n = row_count;
  return jsonb_build_object('revogado', n > 0, 'code', c.code);
end $$;

-- Resultado do envio do e-mail (permite tentar de novo com o mesmo código).
create or replace function public.passe_email_resultado(p_transacao text, p_ok boolean, p_erro text default null)
returns void language sql security definer set search_path = public as $$
  update public.passe_compras set email_tentativas = email_tentativas + 1,
    email_enviado_em = case when p_ok then now() else email_enviado_em end,
    email_erro = case when p_ok then null else left(coalesce(p_erro, 'erro'), 300) end
  where transacao = btrim(coalesce(p_transacao, ''));
$$;

-- Dados pro reenvio manual do e-mail.
create or replace function public.passe_dados_envio(p_transacao text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('status', c.status, 'code', c.code, 'email', c.email, 'comprador', c.comprador, 'expira_em', a.expira_em, 'email_enviado', c.email_enviado_em is not null)
    from public.passe_compras c left join public.alunos_codigos a on a.code = c.code where c.transacao = btrim(coalesce(p_transacao, ''))), 'null'::jsonb);
$$;

revoke all on function public.passe_gerar_codigo() from public, anon, authenticated;
revoke all on function public.passe_registrar_compra(text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.passe_revogar(text, text) from public, anon, authenticated;
revoke all on function public.passe_email_resultado(text, boolean, text) from public, anon, authenticated;
revoke all on function public.passe_dados_envio(text) from public, anon, authenticated;
grant execute on function public.passe_registrar_compra(text, text, text, text, timestamptz) to service_role;
grant execute on function public.passe_revogar(text, text) to service_role;
grant execute on function public.passe_email_resultado(text, boolean, text) to service_role;
grant execute on function public.passe_dados_envio(text) to service_role;
