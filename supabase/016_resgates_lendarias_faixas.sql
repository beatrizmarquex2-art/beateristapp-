-- Lendárias por faixas de compra (pedido da Bea): 1 produto da Lojinha libera 1 lendária · 2 produtos liberam 3 (mais 2) · 3 produtos liberam as 5 (mais 2).
-- A Bea confere o print e aprova escolhendo quantos produtos viu (fica em `obs` como "produtos:N"). O aluno pode mandar um print novo quando comprar mais
-- (até aprovarem "produtos:3"); só não pode ter dois esperando ao mesmo tempo. Os outros tipos (Google, YouTube, amigo) seguem com 1 por código.
-- NÃO aplicado ainda: depende de 015_resgates_print.sql e da confirmação da Bea (muda o banco).
drop index if exists public.resgates_unico_por_tipo;
create unique index if not exists resgates_unico_por_tipo on public.resgates_print (code, tipo) where status <> 'recusado' and tipo <> 'lendaria';
create unique index if not exists resgates_lendaria_pendente on public.resgates_print (code) where tipo = 'lendaria' and status = 'pendente';

create or replace function public.resgate_enviar(p_code text, p_nome text, p_tipo text, p_print text)
returns text language plpgsql security definer set search_path = public as $$
declare c text := upper(btrim(coalesce(p_code, ''))); rid uuid;
begin
  if not exists (select 1 from public.alunos_codigos where code = c and ativo) then return 'codigo'; end if;
  if p_tipo not in ('google', 'youtube', 'amigo', 'lendaria') or coalesce(char_length(p_print), 0) < 200 then return 'invalido'; end if;
  if p_tipo = 'lendaria' then
    if exists (select 1 from public.resgates_print where code = c and tipo = 'lendaria' and (status = 'pendente' or (status = 'aprovado' and obs like 'produtos:3%'))) then return 'ja_enviado'; end if;
  elsif exists (select 1 from public.resgates_print where code = c and tipo = p_tipo and status <> 'recusado') then return 'ja_enviado'; end if;
  insert into public.resgates_print (code, nome, tipo, print_b64) values (c, left(coalesce(p_nome, ''), 60), p_tipo, p_print) returning id into rid;
  return 'ok';
end $$;
revoke all on function public.resgate_enviar(text, text, text, text) from public;
grant execute on function public.resgate_enviar(text, text, text, text) to anon, authenticated;
