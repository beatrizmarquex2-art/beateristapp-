-- Salas de 2 celulares (jogos: uno musical, jogo da velha, stop). Quem cria ganha um código de 5 letras/números;
-- o outro entra com o código. Os dois lados guardam/leem o estado inteiro da partida por estas funções (a tabela é fechada).
create table if not exists public.salas (
  code text primary key check (char_length(code) = 5),
  jogo text not null check (char_length(jogo) between 1 and 20),
  estado jsonb not null,
  ver int not null default 1,
  convidado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.salas enable row level security;
revoke all on public.salas from anon, authenticated;

-- cria a sala e devolve o código
create or replace function public.sala_criar(p_jogo text, p_estado jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare
  abc constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  c text; i int;
begin
  if p_jogo is null or char_length(p_jogo) > 20 or p_estado is null or pg_column_size(p_estado) > 200000 then raise exception 'invalido'; end if;
  delete from public.salas where updated_at < now() - interval '1 day';
  loop
    c := '';
    for i in 1..5 loop c := c || substr(abc, 1 + floor(random() * length(abc))::int, 1); end loop;
    begin
      insert into public.salas(code, jogo, estado) values (c, p_jogo, p_estado);
      return c;
    exception when unique_violation then null;
    end;
  end loop;
end $$;

-- o segundo celular entra: marca "convidado" e devolve o estado atual
create or replace function public.sala_entrar(p_code text, p_jogo text)
returns table(ver int, estado jsonb) language plpgsql security definer set search_path = public as $$
begin
  update public.salas s set convidado = true, updated_at = now() where s.code = upper(p_code) and s.jogo = p_jogo;
  return query select s.ver, s.estado from public.salas s where s.code = upper(p_code) and s.jogo = p_jogo;
end $$;

-- lê a sala; se o celular já tem a versão atual (p_ver), não manda o estado de novo
create or replace function public.sala_ler(p_code text, p_ver int)
returns table(ver int, convidado boolean, estado jsonb) language sql security definer set search_path = public as $$
  select s.ver, s.convidado, case when s.ver = p_ver then null else s.estado end
  from public.salas s where s.code = upper(p_code);
$$;

-- grava o novo estado só se ninguém mexeu antes (p_ver = versão que este celular viu). Devolve a nova versão, ou 0 se perdeu a vez.
create or replace function public.sala_enviar(p_code text, p_ver int, p_estado jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if p_estado is null or pg_column_size(p_estado) > 200000 then raise exception 'invalido'; end if;
  update public.salas s set estado = p_estado, ver = s.ver + 1, updated_at = now()
    where s.code = upper(p_code) and s.ver = p_ver returning s.ver into n;
  return coalesce(n, 0);
end $$;

revoke all on function public.sala_criar(text, jsonb), public.sala_entrar(text, text), public.sala_ler(text, int), public.sala_enviar(text, int, jsonb) from public;
grant execute on function public.sala_criar(text, jsonb), public.sala_entrar(text, text), public.sala_ler(text, int), public.sala_enviar(text, int, jsonb) to anon, authenticated;
