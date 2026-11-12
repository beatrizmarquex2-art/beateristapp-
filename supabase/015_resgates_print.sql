-- Resgate por print (pedido da Bea): o aluno manda o print de uma missão (avaliou a escola no Google, seguiu no YouTube, mandou pra um amigo)
-- ou da compra dos 3 produtos (lendária); a Bea aprova no app e a recompensa chega no aparelho do aluno. O print fica PRIVADO (só a Bea lê) e é
-- APAGADO assim que a Bea aprova ou recusa (pode ter nome/e-mail). Só quem tem código de aluno ativo consegue enviar.
create table if not exists public.resgates_print (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  nome text not null default '' check (char_length(nome) <= 60),
  tipo text not null check (tipo in ('google', 'youtube', 'amigo', 'lendaria')),
  print_b64 text check (print_b64 is null or char_length(print_b64) <= 900000),
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado')),
  entregue boolean not null default false,
  obs text not null default '' check (char_length(obs) <= 200),
  criado_em timestamptz not null default now(),
  decidido_em timestamptz
);
create unique index if not exists resgates_unico_por_tipo on public.resgates_print (code, tipo) where status <> 'recusado';
alter table public.resgates_print enable row level security;
revoke all on public.resgates_print from anon;
grant select, update on public.resgates_print to authenticated;
create policy resg_bea_ler on public.resgates_print for select to authenticated using (is_allowed());
create policy resg_bea_atualizar on public.resgates_print for update to authenticated using (is_allowed()) with check (is_allowed());
-- ao aprovar/recusar, o print é apagado
create or replace function public.resgate_apaga_print() returns trigger language plpgsql as $$
begin if new.status <> 'pendente' then new.print_b64 := null; new.decidido_em := coalesce(new.decidido_em, now()); end if; return new; end $$;
drop trigger if exists resgate_apaga_print_t on public.resgates_print;
create trigger resgate_apaga_print_t before update on public.resgates_print for each row execute function public.resgate_apaga_print();

create or replace function public.resgate_enviar(p_code text, p_nome text, p_tipo text, p_print text)
returns text language plpgsql security definer set search_path = public as $$
declare c text := upper(btrim(coalesce(p_code, ''))); rid uuid;
begin
  if not exists (select 1 from public.alunos_codigos where code = c and ativo) then return 'codigo'; end if;
  if p_tipo not in ('google', 'youtube', 'amigo', 'lendaria') or coalesce(char_length(p_print), 0) < 200 then return 'invalido'; end if;
  if exists (select 1 from public.resgates_print where code = c and tipo = p_tipo and status <> 'recusado') then return 'ja_enviado'; end if;
  insert into public.resgates_print (code, nome, tipo, print_b64) values (c, left(coalesce(p_nome, ''), 60), p_tipo, p_print) returning id into rid;
  return 'ok';
end $$;
revoke all on function public.resgate_enviar(text, text, text, text) from public;
grant execute on function public.resgate_enviar(text, text, text, text) to anon, authenticated;

create or replace function public.resgate_minhas(p_code text)
returns table(id uuid, tipo text, status text, entregue boolean, obs text, criado_em timestamptz)
language sql security definer set search_path = public as $$
  select r.id, r.tipo, r.status, r.entregue, r.obs, r.criado_em from public.resgates_print r
  where r.code = upper(btrim(coalesce(p_code, ''))) order by r.criado_em desc limit 50;
$$;
revoke all on function public.resgate_minhas(text) from public;
grant execute on function public.resgate_minhas(text) to anon, authenticated;

-- o aparelho confirma que entregou a recompensa (só 1 vez, mesmo com 2 aparelhos): devolve true só na 1ª
create or replace function public.resgate_entregar(p_code text, p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  update public.resgates_print set entregue = true where id = p_id and code = upper(btrim(coalesce(p_code, ''))) and status = 'aprovado' and not entregue returning true into ok;
  return coalesce(ok, false);
end $$;
revoke all on function public.resgate_entregar(text, uuid) from public;
grant execute on function public.resgate_entregar(text, uuid) to anon, authenticated;
