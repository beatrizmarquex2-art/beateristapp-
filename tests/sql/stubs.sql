-- Stubs mínimos do ambiente Supabase para testar a migration 013 em Postgres local.
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
end $$;
grant usage on schema public to anon, authenticated, service_role;
create schema if not exists extensions;
create schema if not exists auth;
create or replace function auth.email() returns text language sql as $$ select nullif(current_setting('test.email', true), '') $$;
create or replace function public.is_allowed() returns boolean language sql as $$ select current_setting('test.email', true) = 'bea@teste.com' $$;
create table if not exists public.midis_publicos (id text, name text, folder text, corte jsonb, b64 text);
\i supabase/007_codigos.sql
\i supabase/008_codigos_validade.sql
