-- O código BEA-0000 agora também guarda o álbum de 125 figurinhas (campo "f" do save):
-- f = { p: [coladas], i: {código: repetidas na mão}, g: [pacotes entregues], o: [pacotes abertos] }.
-- Juntar nunca tira nada: união das coladas/pacotes e o maior número de repetidas.
create or replace function public.album_juntar(a jsonb, b jsonb)
returns jsonb language plpgsql immutable set search_path = public as $$
declare
  alb jsonb; lv jsonb := '{}'::jsonb; k text; x jsonb; y jsonb; ra jsonb; rb jsonb; res jsonb;
  fp jsonb; fg jsonb; fo jsonb; fi jsonb := '{}'::jsonb;
begin
  select coalesce(jsonb_agg(distinct v), '[]'::jsonb) into alb
    from jsonb_array_elements_text(coalesce(a->'a','[]'::jsonb) || coalesce(b->'a','[]'::jsonb)) v;
  for k in select jsonb_object_keys(coalesce(a->'l','{}'::jsonb) || coalesce(b->'l','{}'::jsonb)) loop
    x := coalesce(a->'l'->k, '[0,0,0]'::jsonb); y := coalesce(b->'l'->k, '[0,0,0]'::jsonb);
    lv := lv || jsonb_build_object(k, jsonb_build_array(
      greatest((x->>0)::int, (y->>0)::int), greatest((x->>1)::int, (y->>1)::int), greatest((x->>2)::int, (y->>2)::int)));
  end loop;
  ra := coalesce(a->'r', '[0,0]'::jsonb); rb := coalesce(b->'r', '[0,0]'::jsonb);
  res := jsonb_build_object('n', coalesce(nullif(b->>'n',''), a->>'n', ''), 'a', alb, 'l', lv,
    'r', jsonb_build_array(greatest((ra->>0)::int, (rb->>0)::int), greatest((ra->>1)::int, (rb->>1)::int)));
  if a ? 'f' or b ? 'f' then
    select coalesce(jsonb_agg(distinct v), '[]'::jsonb) into fp from jsonb_array_elements_text(coalesce(a#>'{f,p}','[]'::jsonb) || coalesce(b#>'{f,p}','[]'::jsonb)) v;
    select coalesce(jsonb_agg(distinct v), '[]'::jsonb) into fg from jsonb_array_elements_text(coalesce(a#>'{f,g}','[]'::jsonb) || coalesce(b#>'{f,g}','[]'::jsonb)) v;
    select coalesce(jsonb_agg(distinct v), '[]'::jsonb) into fo from jsonb_array_elements_text(coalesce(a#>'{f,o}','[]'::jsonb) || coalesce(b#>'{f,o}','[]'::jsonb)) v;
    for k in select jsonb_object_keys(coalesce(a#>'{f,i}','{}'::jsonb) || coalesce(b#>'{f,i}','{}'::jsonb)) loop
      fi := fi || jsonb_build_object(k, greatest(coalesce((a#>>array['f','i',k])::int, 0), coalesce((b#>>array['f','i',k])::int, 0)));
    end loop;
    res := res || jsonb_build_object('f', jsonb_build_object('p', fp, 'i', fi, 'g', fg, 'o', fo));
  end if;
  return res;
end $$;

-- o save agora é maior: sobe o limite de 30 KB pra 60 KB
create or replace function public.album_guardar(p_code text, p_dados jsonb)
returns table(code text, dados jsonb) language plpgsql security definer set search_path = public as $$
declare c text; old jsonb; merged jsonb; tries int := 0;
begin
  if p_dados is null or jsonb_typeof(p_dados) <> 'object' or pg_column_size(p_dados) > 60000 then raise exception 'invalido'; end if;
  if p_code is null or p_code = '' then
    loop
      c := 'BEA-' || lpad(floor(random() * 10000)::int::text, 4, '0');
      begin
        insert into public.album_codigos(code, dados) values (c, p_dados);
        return query select c, p_dados; return;
      exception when unique_violation then
        tries := tries + 1; if tries > 400 then raise exception 'cheio'; end if;
      end;
    end loop;
  end if;
  c := upper(p_code);
  if c !~ '^BEA-[0-9]{4}$' then raise exception 'codigo'; end if;
  select a.dados into old from public.album_codigos a where a.code = c for update;
  if not found then
    insert into public.album_codigos(code, dados) values (c, p_dados);
    return query select c, p_dados; return;
  end if;
  merged := public.album_juntar(old, p_dados);
  update public.album_codigos a set dados = merged, updated_at = now() where a.code = c;
  return query select c, merged;
end $$;
