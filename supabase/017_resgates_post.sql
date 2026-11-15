-- Resgate por print de POSTAGEM (pedido da Bea, 15/nov/2026): o aluno posta um jogo, marca a escola e manda o print = 5 estrelas.
-- Vale 1 vez POR JOGO: o tipo vai como 'post:<jogo>' (ex.: 'post:uno', 'post:paulbox'). O índice único (code, tipo) do 016 já garante isso
-- (ele vale pra todo tipo que não seja 'lendaria'). Só muda o que é aceito em `tipo`; a regra das lendárias por faixas (016) fica igual.
-- Aplicado no Supabase em 15/nov/2026.
alter table public.resgates_print drop constraint if exists resgates_print_tipo_check;
alter table public.resgates_print add constraint resgates_print_tipo_check check (tipo in ('google', 'youtube', 'amigo', 'lendaria') or tipo ~ '^post:[a-z0-9-]{1,24}$');

create or replace function public.resgate_enviar(p_code text, p_nome text, p_tipo text, p_print text)
returns text language plpgsql security definer set search_path = public as $$
declare c text := upper(btrim(coalesce(p_code, ''))); rid uuid;
begin
  if not exists (select 1 from public.alunos_codigos where code = c and ativo) then return 'codigo'; end if;
  if not (p_tipo in ('google', 'youtube', 'amigo', 'lendaria') or p_tipo ~ '^post:[a-z0-9-]{1,24}$') or coalesce(char_length(p_print), 0) < 200 then return 'invalido'; end if;
  if p_tipo = 'lendaria' then
    if exists (select 1 from public.resgates_print where code = c and tipo = 'lendaria' and (status = 'pendente' or (status = 'aprovado' and obs like 'produtos:3%'))) then return 'ja_enviado'; end if;
  elsif exists (select 1 from public.resgates_print where code = c and tipo = p_tipo and status <> 'recusado') then return 'ja_enviado'; end if;
  insert into public.resgates_print (code, nome, tipo, print_b64) values (c, left(coalesce(p_nome, ''), 60), p_tipo, p_print) returning id into rid;
  return 'ok';
end $$;
