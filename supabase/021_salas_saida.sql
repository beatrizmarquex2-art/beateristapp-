-- Saída de jogador nas salas de 2 a 4 celulares: sinal de vida (a cada ~5 s), aviso quando alguém some e votação "continuar sem".
-- ACRESCENTA colunas e 2 funções novas; nada do que já existe muda.
alter table public.salas add column if not exists presenca jsonb not null default '{}'::jsonb;  -- { "lugar": instante do último sinal (segundos) }
alter table public.salas add column if not exists saiu jsonb not null default '[]'::jsonb;      -- lugares que a maioria decidiu tirar da partida
alter table public.salas add column if not exists votos jsonb not null default '{}'::jsonb;     -- { "lugar alvo": [lugares que votaram em tirar] }

-- sinal de vida de `p_lugar` (use -1 só pra ler). Devolve { ha: { lugar: segundos desde o último sinal }, saiu: [...], votos: {...}, n: quantos lugares }.
-- Quem dá sinal de novo volta a valer: o pedido de tirar essa pessoa some.
create or replace function public.sala_presenca(p_code text, p_lugar int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.salas%rowtype; agora numeric := extract(epoch from now()); ha jsonb := '{}'::jsonb; k text; v numeric;
begin
  select * into s from public.salas where code = upper(p_code) for update;
  if not found then return null; end if;
  if p_lugar is not null and p_lugar >= 0 and p_lugar < s.max_jogadores and not (s.saiu @> to_jsonb(p_lugar)) then
    s.presenca := jsonb_set(s.presenca, array[p_lugar::text], to_jsonb(agora), true);
    s.votos := s.votos - p_lugar::text;
    update public.salas set presenca = s.presenca, votos = s.votos where code = s.code;
  end if;
  for k, v in select key, value::numeric from jsonb_each_text(s.presenca) loop ha := ha || jsonb_build_object(k, round(agora - v)); end loop;
  return jsonb_build_object('ha', ha, 'saiu', s.saiu, 'votos', s.votos, 'n', s.max_jogadores);
end $$;

-- voto de `p_lugar` pra continuar a partida sem `p_alvo`. Com a maioria dos que ficaram, o alvo entra em `saiu`.
create or replace function public.sala_votar(p_code text, p_lugar int, p_alvo int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.salas%rowtype; vs jsonb; restam int; precisa int;
begin
  select * into s from public.salas where code = upper(p_code) for update;
  if not found then return null; end if;
  if p_lugar is null or p_alvo is null or p_lugar = p_alvo or p_lugar < 0 or p_alvo < 0 or p_lugar >= s.max_jogadores or p_alvo >= s.max_jogadores then raise exception 'invalido'; end if;
  if s.saiu @> to_jsonb(p_lugar) then raise exception 'fora'; end if;
  if s.saiu @> to_jsonb(p_alvo) then return jsonb_build_object('saiu', s.saiu, 'votos', s.votos); end if;
  vs := coalesce(s.votos -> p_alvo::text, '[]'::jsonb);
  if not (vs @> to_jsonb(p_lugar)) then vs := vs || to_jsonb(p_lugar); end if;
  restam := s.max_jogadores - jsonb_array_length(s.saiu) - 1;      -- quem sobra sem contar o alvo
  precisa := restam / 2 + 1;                                         -- maioria deles
  if jsonb_array_length(vs) >= precisa then
    s.saiu := s.saiu || to_jsonb(p_alvo); s.votos := s.votos - p_alvo::text;
  else
    s.votos := jsonb_set(s.votos, array[p_alvo::text], vs, true);
  end if;
  update public.salas set saiu = s.saiu, votos = s.votos where code = s.code;
  return jsonb_build_object('saiu', s.saiu, 'votos', s.votos);
end $$;

revoke all on function public.sala_presenca(text, int) from public;
revoke all on function public.sala_votar(text, int, int) from public;
grant execute on function public.sala_presenca(text, int) to anon, authenticated;
grant execute on function public.sala_votar(text, int, int) to anon, authenticated;
