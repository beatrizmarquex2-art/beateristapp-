-- Salas de 2 a 4 celulares (jogo da memória, uno, stop, cara a cara): cada pessoa entra com o código da sala e o seu nome.
-- ACRESCENTA colunas e funções novas; as salas de 2 celulares de antes (sala_criar / sala_entrar / sala_ler / sala_enviar) continuam iguais.
alter table public.salas add column if not exists max_jogadores int not null default 2;
alter table public.salas add column if not exists nomes jsonb not null default '[]'::jsonb;

-- cria a sala de N jogadores (2 a 4) com o nome de quem criou (lugar 0); devolve o código de 5 letras/números
create or replace function public.sala_criar_n(p_jogo text, p_estado jsonb, p_max int, p_nome text)
returns text language plpgsql security definer set search_path = public as $$
declare
  abc constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  c text; i int;
begin
  if p_jogo is null or char_length(p_jogo) > 20 or p_estado is null or pg_column_size(p_estado) > 200000 or p_max is null or p_max not between 2 and 4 then raise exception 'invalido'; end if;
  delete from public.salas where updated_at < now() - interval '1 day';
  loop
    c := '';
    for i in 1..5 loop c := c || substr(abc, 1 + floor(random() * length(abc))::int, 1); end loop;
    begin
      insert into public.salas(code, jogo, estado, max_jogadores, nomes) values (c, p_jogo, p_estado, p_max, jsonb_build_array(left(btrim(coalesce(p_nome, 'jogador')), 20)));
      return c;
    exception when unique_violation then null;
    end;
  end loop;
end $$;

-- entra na sala: ganha o próximo lugar (1, 2, 3) ou erro 'cheia'. Devolve o lugar, quantos jogadores a sala tem, os nomes até agora e o estado.
create or replace function public.sala_entrar_n(p_code text, p_jogo text, p_nome text)
returns table(lugar int, ver int, estado jsonb, max_jogadores int, nomes jsonb) language plpgsql security definer set search_path = public as $$
declare s public.salas%rowtype; n int; nome text;
begin
  select * into s from public.salas where code = upper(p_code) and jogo = p_jogo for update;
  if not found then return; end if;
  n := jsonb_array_length(s.nomes);
  if n >= s.max_jogadores then raise exception 'cheia'; end if;
  nome := left(btrim(coalesce(nullif(btrim(p_nome), ''), 'jogador')), 20);
  update public.salas t set nomes = s.nomes || to_jsonb(nome), convidado = true, updated_at = now() where t.code = s.code;
  return query select n, s.ver, s.estado, s.max_jogadores, s.nomes || to_jsonb(nome);
end $$;

-- lê a sala (versão, quantos cabem, nomes e, se mudou, o estado)
create or replace function public.sala_ler_n(p_code text, p_ver int)
returns table(ver int, max_jogadores int, nomes jsonb, estado jsonb) language sql security definer set search_path = public as $$
  select s.ver, s.max_jogadores, s.nomes, case when s.ver = p_ver then null else s.estado end from public.salas s where s.code = upper(p_code);
$$;

revoke all on function public.sala_criar_n(text, jsonb, int, text) from public;
revoke all on function public.sala_entrar_n(text, text, text) from public;
revoke all on function public.sala_ler_n(text, int) from public;
grant execute on function public.sala_criar_n(text, jsonb, int, text) to anon, authenticated;
grant execute on function public.sala_entrar_n(text, text, text) to anon, authenticated;
grant execute on function public.sala_ler_n(text, int) to anon, authenticated;
