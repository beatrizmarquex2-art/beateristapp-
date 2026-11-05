-- Álbum de figurinhas da área do aluno: trancado por um código que a Bea define.
-- O código NUNCA fica no site: só o hash, numa tabela fechada. O site pergunta por duas funções (certo/errado e "versão do código").
-- Trocar o código (re-tranca todo mundo na próxima visita), no SQL Editor:   select public.album_codigo_definir('NOVO CODIGO');
create extension if not exists pgcrypto with schema extensions;
create table if not exists public.album_config (
  id integer primary key default 1 check (id = 1),
  codigo_hash text not null,
  versao integer not null default 1,
  atualizado timestamptz not null default now()
);
alter table public.album_config enable row level security;
revoke all on public.album_config from anon, authenticated;

create or replace function public.album_codigo_ok(p_codigo text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare ok boolean;
begin
  perform pg_sleep(0.4); -- tentar muitos códigos seguidos fica lento
  select encode(digest(lower(btrim(coalesce(p_codigo, ''))) || ':beaterista-album', 'sha256'), 'hex') = codigo_hash into ok from public.album_config where id = 1;
  return coalesce(ok, false);
end $$;

create or replace function public.album_codigo_versao()
returns integer language sql security definer set search_path = public as $$
  select versao from public.album_config where id = 1;
$$;

-- só quem roda no SQL Editor (dono do projeto) pode definir o código; o site (anon) não consegue
create or replace function public.album_codigo_definir(p_codigo text)
returns text language plpgsql security definer set search_path = public, extensions as $$
begin
  if char_length(btrim(coalesce(p_codigo, ''))) < 4 then raise exception 'código curto demais (mínimo 4 caracteres)'; end if;
  insert into public.album_config(id, codigo_hash) values (1, encode(digest(lower(btrim(p_codigo)) || ':beaterista-album', 'sha256'), 'hex'))
  on conflict (id) do update set codigo_hash = excluded.codigo_hash, versao = public.album_config.versao + 1, atualizado = now();
  return 'código definido';
end $$;

revoke all on function public.album_codigo_definir(text) from public, anon, authenticated;
revoke all on function public.album_codigo_ok(text), public.album_codigo_versao() from public;
grant execute on function public.album_codigo_ok(text), public.album_codigo_versao() to anon, authenticated;
