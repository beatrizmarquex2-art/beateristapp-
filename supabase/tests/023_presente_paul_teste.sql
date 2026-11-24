-- Teste reversível da 023 (termina com raise exception = rollback). Rodar junto com a 023 no mesmo comando.

do $t$
declare res jsonb := '[]'::jsonb; a jsonb; n int;
begin
  perform set_config('request.jwt.claims', json_build_object('email', (select email from public.app_allowed_emails limit 1))::text, true);
  res := res || jsonb_build_object('t','tabela fechada: anon e authenticated nao leem nem escrevem direto', 'ok', not has_table_privilege('anon','public.presente_leads','select') and not has_table_privilege('anon','public.presente_leads','insert') and not has_table_privilege('authenticated','public.presente_leads','select') and not has_table_privilege('authenticated','public.presente_leads','delete'));
  a := public.presente_registrar('Maria Souza','Maria@Exemplo.com','','bateria',null,'4-12',false);
  res := res || jsonb_build_object('t','so e-mail (sem WhatsApp) vale', 'ok', (a->>'ok')::boolean and (select email from public.presente_leads where lower(email)='maria@exemplo.com')='maria@exemplo.com');
  a := public.presente_registrar('Joao','','(18) 99180-4150','guitarra',null,'13-17',true);
  res := res || jsonb_build_object('t','so WhatsApp vale e vira 55+DDD+numero', 'ok', (a->>'ok')::boolean and exists(select 1 from public.presente_leads where whatsapp='5518991804150'));
  res := res || jsonb_build_object('t','caixinha de novidades: desmarcada = false; marcada = true com data', 'ok', (select not aceita_novidades and aceita_em is null from public.presente_leads where lower(email)='maria@exemplo.com') and (select aceita_novidades and aceita_em is not null from public.presente_leads where whatsapp='5518991804150'));
  a := public.presente_registrar('Sem Contato','','','bateria',null,'4-12',false); res := res || jsonb_build_object('t','sem e-mail e sem WhatsApp: recusa (motivo contato)', 'ok', not (a->>'ok')::boolean and a->>'motivo'='contato');
  a := public.presente_registrar('Zap Curto','','123','bateria',null,'4-12',false); res := res || jsonb_build_object('t','WhatsApp que nao parece de verdade nao conta', 'ok', not (a->>'ok')::boolean and a->>'motivo'='contato');
  a := public.presente_registrar('Email Ruim','nao-e-email','','bateria',null,'4-12',false); res := res || jsonb_build_object('t','e-mail invalido nao conta', 'ok', not (a->>'ok')::boolean);
  a := public.presente_registrar('Xx','a@b.co','','bateria',null,'4-12',false); a := public.presente_registrar('Nome Ok','n@b.co','','trombone',null,'4-12',false); res := res || jsonb_build_object('t','instrumento invalido recusa (motivo dados)', 'ok', not (a->>'ok')::boolean and a->>'motivo'='dados');
  a := public.presente_registrar('Nome Ok','i@b.co','','bateria',null,'99',false); res := res || jsonb_build_object('t','faixa de idade invalida recusa', 'ok', not (a->>'ok')::boolean);
  a := public.presente_registrar('Ana','ana@b.co','','outro','Ukulele','4-12',false); res := res || jsonb_build_object('t','instrumento Outro guarda o texto', 'ok', (select instrumento_outro from public.presente_leads where email='ana@b.co')='Ukulele');
  a := public.presente_registrar('Ana','ana@b.co','','violao','Ukulele','4-12',false); res := res || jsonb_build_object('t','Outro so guarda texto quando e Outro', 'ok', (select instrumento_outro is null from public.presente_leads where email='ana@b.co'));
  select count(*) into n from public.presente_leads; a := public.presente_registrar('Maria S.','maria@exemplo.com','','teclado',null,'13-17',true);
  res := res || jsonb_build_object('t','mesma pessoa de novo: atualiza, nao duplica; vale a ultima escolha', 'ok', (select count(*) from public.presente_leads)=n and (select instrumento='teclado' and aceita_novidades from public.presente_leads where lower(email)='maria@exemplo.com'));
  res := res || jsonb_build_object('t','professora lista (so quem esta em app_allowed_emails)', 'ok', (select count(*) from public.presente_leads_listar()) = (select count(*) from public.presente_leads));
  perform set_config('request.jwt.claims', '{"email":"intruso@exemplo.com"}', true);
  begin perform * from public.presente_leads_listar(); res := res || jsonb_build_object('t','intruso nao lista', 'ok', false); exception when others then res := res || jsonb_build_object('t','intruso nao lista', 'ok', sqlerrm='nao autorizado'); end;
  begin perform public.presente_lead_apagar(1); res := res || jsonb_build_object('t','intruso nao apaga', 'ok', false); exception when others then res := res || jsonb_build_object('t','intruso nao apaga', 'ok', sqlerrm='nao autorizado'); end;
  perform set_config('request.jwt.claims', json_build_object('email', (select email from public.app_allowed_emails limit 1))::text, true);
  res := res || jsonb_build_object('t','tirar das novidades', 'ok', public.presente_lead_novidades((select id from public.presente_leads where whatsapp='5518991804150'), false) and (select not aceita_novidades and aceita_em is null from public.presente_leads where whatsapp='5518991804150'));
  res := res || jsonb_build_object('t','apagar um contato (pedido do responsavel)', 'ok', public.presente_lead_apagar((select id from public.presente_leads where whatsapp='5518991804150')) and not exists(select 1 from public.presente_leads where whatsapp='5518991804150'));
  raise exception 'RESULTADO %', jsonb_pretty(res);
end $t$;
