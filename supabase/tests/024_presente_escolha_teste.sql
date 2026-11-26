-- Teste reversível da 024 (termina com raise exception = rollback). Rodar JUNTO com a 024 no mesmo comando.
do $t$
declare res jsonb := '[]'::jsonb; a jsonb; a2 jsonb; ok boolean; falhou text; total int; r record; t1 uuid;
begin
  perform set_config('request.jwt.claims', json_build_object('email', (select email from public.app_allowed_emails limit 1))::text, true);
  a := public.presente_registrar('Maria Teste','zz.maria@exemplo.com','','bateria',null,'13-17',true);
  res := res || jsonb_build_object('t','registrar devolve ok e um token', 'ok', (a->>'ok')::boolean and (a->>'token') is not null);
  t1 := (a->>'token')::uuid;
  a2 := public.presente_registrar('Maria T.','ZZ.maria@exemplo.com','','teclado',null,'13-17',true);
  res := res || jsonb_build_object('t','mesma pessoa de novo: mesmo token (sem duplicar)', 'ok', (a2->>'token')::uuid = t1 and (select count(*) from public.presente_leads where lower(email)='zz.maria@exemplo.com')=1);
  ok := public.presente_escolher(t1, 'planner');
  res := res || jsonb_build_object('t','escolher: anota o planner', 'ok', ok and (select presente = 'planner' and presente_em is not null from public.presente_leads where token = t1));
  ok := public.presente_escolher(t1, 'wallpaper');
  res := res || jsonb_build_object('t','só a 1ª escolha vale (não troca depois)', 'ok', (not ok) and (select presente = 'planner' from public.presente_leads where token = t1));
  res := res || jsonb_build_object('t','presente inválido ou token desconhecido: recusa', 'ok', not public.presente_escolher(t1, 'bomba') and not public.presente_escolher(gen_random_uuid(), 'planner') and not public.presente_escolher(null, 'planner'));
  res := res || jsonb_build_object('t','anônimo continua sem ler nem escrever a tabela', 'ok', not has_table_privilege('anon','public.presente_leads','select') and not has_table_privilege('anon','public.presente_leads','update'));
  res := res || jsonb_build_object('t','anônimo pode registrar e escolher, mas NÃO listar', 'ok', has_function_privilege('anon','public.presente_registrar(text,text,text,text,text,text,boolean,text)','execute') and has_function_privilege('anon','public.presente_escolher(uuid,text)','execute') and not has_function_privilege('anon','public.presente_leads_listar()','execute'));
  select * into r from public.presente_leads_listar() l where l.email = 'zz.maria@exemplo.com';
  res := res || jsonb_build_object('t','lista mostra a escolha e assinou=falso antes de comprar', 'ok', r.presente = 'planner' and r.assinou = false);
  insert into public.hotmart_passe_vendas(transacao, comprador_email, comprador_nome, codigo, status, expira_em) values ('ZZTESTE0001', 'ZZ.Maria@Exemplo.com', 'Maria Teste', 'PZZTESTE01', 'aprovada', now() + interval '1 year');
  select * into r from public.presente_leads_listar() l where l.email = 'zz.maria@exemplo.com';
  res := res || jsonb_build_object('t','depois de uma compra aprovada com o mesmo e-mail: assinou=verdadeiro', 'ok', r.assinou = true);
  perform set_config('request.jwt.claims', '{"email":"intruso@exemplo.com"}', true);
  begin perform * from public.presente_leads_listar(); res := res || jsonb_build_object('t','intruso não lista', 'ok', false); exception when others then res := res || jsonb_build_object('t','intruso não lista', 'ok', sqlerrm = 'nao autorizado'); end;
  select string_agg(el->>'t', ' | ') into falhou from jsonb_array_elements(res) el where not (el->>'ok')::boolean;
  select count(*) into total from jsonb_array_elements(res);
  if falhou is null then raise exception 'TODOS OK: % de % testes passaram', total, total; end if;
  raise exception 'FALHOU: %', falhou;
end $t$;
