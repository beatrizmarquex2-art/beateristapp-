-- Teste da migração 022, TUDO DENTRO DE UMA TRANSAÇÃO QUE É DESFEITA NO FIM (o bloco termina com raise exception, que traz o resultado e dá rollback).
-- Rodar DEPOIS de aplicar a 022, ou juntos num mesmo comando (a 022 também é desfeita). Usa só códigos ZZTEST*; não toca em alunos reais.

do $t$
declare falhou text; total int; res jsonb := '[]'::jsonb; a jsonb; ok boolean; n int; d0 jsonb; v_ate timestamptz; cnt_antes int; r record;
  d1 text := 'dev1-aaaaaaaa'; d2 text := 'dev2-bbbbbbbb'; d3 text := 'dev3-cccccccc';
begin
  -- professora simulada
  perform set_config('request.jwt.claims', json_build_object('email', (select email from public.app_allowed_emails limit 1))::text, true);
  -- backfill: os 44 alunos de hoje viraram matriculados, o resto não
  res := res || jsonb_build_object('t','backfill: so turma+aluno viram ativa', 'ok', (select count(*) from public.alunos_codigos where matricula='ativa' and tipo='turma' and categoria='aluno') = (select count(*) from public.alunos_codigos where tipo='turma' and categoria='aluno') and (select count(*) from public.alunos_codigos where matricula is not null and not (tipo='turma' and categoria='aluno')) = 0);
  -- fixtures (tudo some no rollback)
  insert into public.alunos_codigos(code, nome, tipo, categoria) values ('ZZTEST01','Aluno Teste Um','turma','aluno'), ('ZZTEST02','Irmao Teste Dois','turma','aluno');
  insert into public.alunos_codigos(code, nome, tipo, categoria, dias, expira_em, ativo) values ('ZZTEST03','Comprador Externo','passe','outro',365, now()+interval '200 days', true), ('ZZTEST04','Aluno Manual','passe','aluno',365, now()+interval '100 days', true), ('ZZTEST05','Amigo','turma','amigo',365,null,true);
  insert into public.aluno_progresso(code, dados) values ('ZZTEST01','{"v":1,"jogos":{"detetive":{"best":9},"velha":{"n":3}},"outros":{"beaterista-teoria-feitas":["a","b"]}}'), ('ZZTEST02','{"v":1,"jogos":{"stop":{"n":1}},"outros":{}}');
  insert into public.fig_aluno(code, aluno, coladas, acessos, estado) values ('ZZTEST01','Aluno Teste Um',7,4,'{"pasted":{"F001":1}}'), ('ZZTEST02','Irmao Teste Dois',2,1,'{"pasted":{"F009":1}}');
  res := res || jsonb_build_object('t','trigger: turma+aluno novo nasce matriculado; turma+amigo nao', 'ok', (select matricula from public.alunos_codigos where code='ZZTEST01')='ativa' and (select matricula from public.alunos_codigos where code='ZZTEST05') is null);
  -- 1) matriculado entra de graca, sem vencimento
  a := public.aluno_acesso('zztest01', d1, 'ua'); res := res || jsonb_build_object('t','1 matriculado acessa gratis', 'ok', (a->>'ok')::boolean and a->>'tipo'='turma' and a->'expira_em'='null'::jsonb and a->>'matricula'='ativa');
  -- 2) dois aparelhos no mesmo codigo; o terceiro nao; o mesmo aparelho volta
  a := public.aluno_acesso('ZZTEST01', d2, 'ua2'); ok := (a->>'ok')::boolean;
  a := public.aluno_acesso('ZZTEST01', d3, 'ua3'); res := res || jsonb_build_object('t','2 dois aparelhos ok, terceiro bloqueado', 'ok', ok and (a->>'ok')::boolean = false and a->>'motivo'='aparelhos');
  a := public.aluno_acesso('ZZTEST01', d1, 'ua'); res := res || jsonb_build_object('t','2b aparelho ja registrado continua entrando', 'ok', (a->>'ok')::boolean);
  a := public.aluno_acesso('ZZTEST01', null, null); res := res || jsonb_build_object('t','2c app antigo (sem id) segue funcionando', 'ok', (a->>'ok')::boolean);
  -- 11) irmaos: codigos e progresso separados
  a := public.aluno_acesso('ZZTEST02', d1, 'ua'); res := res || jsonb_build_object('t','11 irmao tem o proprio codigo e o mesmo aparelho (tablet) conta separado', 'ok', (a->>'ok')::boolean and (select count(*) from public.codigos_aparelhos where code='ZZTEST02')=1 and (select count(*) from public.codigos_aparelhos where code='ZZTEST01')=2);
  res := res || jsonb_build_object('t','11b progresso de cada irmao separado', 'ok', (public.prog_ler('ZZTEST02')->'dados'->'jogos') ? 'stop' and not ((public.prog_ler('ZZTEST02')->'dados'->'jogos') ? 'detetive') and (public.prog_ler('ZZTEST01')->'dados'->'jogos') ? 'detetive');
  -- 10) comprador externo normal (nao entra nas regras de matricula)
  a := public.aluno_acesso('ZZTEST03', d1, 'ua'); res := res || jsonb_build_object('t','10 comprador externo entra normalmente', 'ok', (a->>'ok')::boolean and a->>'tipo'='passe' and a->'matricula'='null'::jsonb);
  begin perform public.matricula_encerrar('ZZTEST03'); res := res || jsonb_build_object('t','10b encerrar nao vale pra comprador externo', 'ok', false); exception when others then res := res || jsonb_build_object('t','10b encerrar nao vale pra comprador externo', 'ok', true, 'msg', sqlerrm); end;
  begin perform public.matricula_marcar('ZZTEST05'); res := res || jsonb_build_object('t','10c marcar nao vale pra amigo/marca', 'ok', false); exception when others then res := res || jsonb_build_object('t','10c marcar nao vale pra amigo/marca', 'ok', true, 'msg', sqlerrm); end;
  -- nao-professora nao consegue
  perform set_config('request.jwt.claims', '{"email":"intruso@exemplo.com"}', true);
  begin perform public.matricula_encerrar('ZZTEST01'); res := res || jsonb_build_object('t','so a professora encerra', 'ok', false); exception when others then res := res || jsonb_build_object('t','so a professora encerra', 'ok', sqlerrm='nao autorizado'); end;
  begin perform public.passe_pago_ativar('ZZTEST01', true, 'pix-1'); res := res || jsonb_build_object('t','so a professora ativa passe', 'ok', false); exception when others then res := res || jsonb_build_object('t','so a professora ativa passe', 'ok', sqlerrm='nao autorizado'); end;
  perform set_config('request.jwt.claims', json_build_object('email', (select email from public.app_allowed_emails limit 1))::text, true);
  -- jeito antigo: desativar um matriculado (ativo=false) vira matricula encerrada e o acesso fica suspenso com o motivo certo
  insert into public.alunos_codigos(code, nome, tipo, categoria) values ('ZZTEST06','Aluno Antigo','turma','aluno');
  update public.alunos_codigos set ativo = false where code='ZZTEST06';
  res := res || jsonb_build_object('t','desativar pelo jeito antigo: vira matricula encerrada', 'ok', (select matricula='encerrada' from public.alunos_codigos where code='ZZTEST06'));
  a := public.aluno_acesso('ZZTEST06', d1, 'ua'); res := res || jsonb_build_object('t','desativado pelo jeito antigo: motivo matricula (oferta de R$ 49,90)', 'ok', (a->>'ok')::boolean = false and a->>'motivo'='matricula');
  update public.alunos_codigos set ativo = true where code='ZZTEST06';
  res := res || jsonb_build_object('t','interruptor antigo nao reativa matricula encerrada', 'ok', (select ativo = false from public.alunos_codigos where code='ZZTEST06'));
  a := public.matricula_reativar('ZZTEST06'); res := res || jsonb_build_object('t','reativar pela funcao funciona', 'ok', a->>'matricula'='ativa' and (a->>'ativo')::boolean);
  -- 3) encerrar matricula
  a := public.matricula_encerrar('ZZTEST01', 'teste'); res := res || jsonb_build_object('t','3 encerrar: matricula encerrada e ativo=false', 'ok', a->>'matricula'='encerrada' and (a->>'ativo')::boolean = false);
  -- 4) bloqueio no servidor
  a := public.aluno_acesso('ZZTEST01', d1, 'ua'); res := res || jsonb_build_object('t','4 acesso gratuito bloqueado no servidor (motivo matricula)', 'ok', (a->>'ok')::boolean = false and a->>'motivo'='matricula');
  a := public.aluno_acesso('ZZTEST01', null, null); res := res || jsonb_build_object('t','4b bloqueado tambem sem id de aparelho', 'ok', (a->>'ok')::boolean = false);
  res := res || jsonb_build_object('t','4c aluno_codigo_ok (app antigo) tambem bloqueia', 'ok', public.aluno_codigo_ok('ZZTEST01') = false);
  res := res || jsonb_build_object('t','4d progresso nao e lido nem sobrescrito por quem esta suspenso', 'ok', (public.prog_ler('ZZTEST01')->>'ok')::boolean = false and public.prog_salvar('ZZTEST01', '{"v":1,"jogos":{"lixo":1}}') = false);
  -- 5) preservacao
  res := res || jsonb_build_object('t','5 progresso e figurinhas preservados ao encerrar', 'ok', (select dados->'jogos'->'detetive'->>'best' from public.aluno_progresso where code='ZZTEST01')='9' and (select coladas from public.fig_aluno where code='ZZTEST01')=7 and (select count(*) from public.codigos_aparelhos where code='ZZTEST01')=2 and exists(select 1 from public.alunos_codigos where code='ZZTEST01'));
  -- importar lista / interruptor antigo nao reativa
  update public.alunos_codigos set ativo = true where code='ZZTEST01';
  insert into public.alunos_codigos(code, nome, ativo) values ('ZZTEST01','Aluno Teste Um', true) on conflict (code) do update set nome = excluded.nome, ativo = excluded.ativo;
  res := res || jsonb_build_object('t','4e importar lista/interruptor antigo NAO reativa matricula encerrada', 'ok', (select ativo from public.alunos_codigos where code='ZZTEST01') = false);
  -- 6) ex-aluno ainda sem pagar nao ativa passe; sem confirmacao/ref nao ativa
  begin perform public.passe_pago_ativar('ZZTEST01', false, 'pix-1'); res := res || jsonb_build_object('t','7 sem confirmacao nao ativa', 'ok', false); exception when others then res := res || jsonb_build_object('t','7 sem confirmacao nao ativa', 'ok', sqlerrm='pagamento nao confirmado'); end;
  begin perform public.passe_pago_ativar('ZZTEST01', true, ''); res := res || jsonb_build_object('t','7b sem referencia nao ativa', 'ok', false); exception when others then res := res || jsonb_build_object('t','7b sem referencia nao ativa', 'ok', sqlerrm like 'informe a referencia%'); end;
  begin perform public.passe_pago_ativar('ZZTEST02', true, 'pix-9'); res := res || jsonb_build_object('t','7c passe pago so para ex-aluno (nao para matriculado ativo)', 'ok', false); exception when others then res := res || jsonb_build_object('t','7c passe pago so para ex-aluno (nao para matriculado ativo)', 'ok', true); end;
  -- 7/8) conversao apos confirmacao: mesmo codigo, 12 meses
  a := public.passe_pago_ativar('ZZTEST01', true, 'pix-MP-123', 'recebido'); v_ate := (a->>'passe_pago_ate')::timestamptz;
  res := res || jsonb_build_object('t','7d conversao: mesmo codigo, tipo passe, ativo', 'ok', a->>'code'='ZZTEST01' and a->>'tipo'='passe' and (a->>'ativo')::boolean and a->>'matricula'='encerrada');
  res := res || jsonb_build_object('t','8 passe pago vale 12 meses', 'ok', v_ate between now() + interval '364 days' and now() + interval '367 days', 'ate', v_ate);
  a := public.aluno_acesso('ZZTEST01', d1, 'ua'); res := res || jsonb_build_object('t','8b ex-aluno com passe pago entra (aparelho exigido, 2 aparelhos)', 'ok', (a->>'ok')::boolean and a->>'tipo'='passe' and (a->>'passe_pago_ate') is not null);
  a := public.aluno_acesso('ZZTEST01', null, null); res := res || jsonb_build_object('t','8c passe pago exige id de aparelho', 'ok', (a->>'ok')::boolean = false and a->>'motivo'='aparelho');
  res := res || jsonb_build_object('t','8d conversao preserva progresso e figurinhas', 'ok', (select dados->'jogos'->'detetive'->>'best' from public.aluno_progresso where code='ZZTEST01')='9' and (select coladas from public.fig_aluno where code='ZZTEST01')=7 and public.prog_salvar('ZZTEST01','{"v":1,"jogos":{"detetive":{"best":10}}}') and (public.prog_ler('ZZTEST01')->>'ok')::boolean);
  begin perform public.passe_pago_ativar('ZZTEST01', true, 'pix-MP-123'); res := res || jsonb_build_object('t','8e clique duplo nao dobra o passe', 'ok', false); exception when others then res := res || jsonb_build_object('t','8e clique duplo nao dobra o passe', 'ok', sqlerrm like 'passe ja ativado%'); end;
  -- 9) reativar matricula
  a := public.matricula_reativar('ZZTEST01'); res := res || jsonb_build_object('t','9 reativar: volta ao acesso gratuito sem vencimento', 'ok', a->>'matricula'='ativa' and a->>'tipo'='turma' and (a->>'ativo')::boolean and a->'expira_em'='null'::jsonb and a->>'passe_pago_ate' is not null);
  a := public.aluno_acesso('ZZTEST01', d1, 'ua'); res := res || jsonb_build_object('t','9b matriculado de novo entra', 'ok', (a->>'ok')::boolean and a->>'tipo'='turma');
  -- encerrar de novo com passe pago ainda valido: continua ate o fim do passe
  a := public.matricula_encerrar('ZZTEST01'); res := res || jsonb_build_object('t','9c encerrar de novo com passe pago valido: segue jogando ate vencer', 'ok', (a->>'ativo')::boolean and a->>'tipo'='passe' and (a->>'expira_em')::timestamptz = v_ate);
  -- passe pago vencido -> oferta volta
  update public.alunos_codigos set passe_pago_ate = now() - interval '1 day', expira_em = now() - interval '1 day' where code='ZZTEST01';
  a := public.aluno_acesso('ZZTEST01', d1, 'ua'); res := res || jsonb_build_object('t','8f passe pago vencido: acesso suspenso e volta a oferta (motivo matricula)', 'ok', (a->>'ok')::boolean = false and a->>'motivo'='matricula');
  a := public.passe_pago_ativar('ZZTEST01', true, 'pix-MP-456'); res := res || jsonb_build_object('t','8g renovar apos vencer: +12 meses a partir de agora', 'ok', (a->>'passe_pago_ate')::timestamptz between now() + interval '364 days' and now() + interval '367 days');
  -- marcar aluno manual como matriculado
  a := public.matricula_marcar('ZZTEST04', 'cadastrada a mao'); res := res || jsonb_build_object('t','3b aluno cadastrado a mao vira matriculado (sem vencimento)', 'ok', a->>'matricula'='ativa' and a->>'tipo'='turma' and a->'expira_em'='null'::jsonb);
  -- aparelhos: consultar, liberar, limite
  res := res || jsonb_build_object('t','aparelhos: consulta devolve os 2 do ZZTEST02+ZZTEST01', 'ok', (select count(*) from public.codigo_aparelhos('ZZTEST01')) = 2);
  ok := public.codigo_aparelho_liberar('ZZTEST01', d2); res := res || jsonb_build_object('t','aparelhos: liberar um', 'ok', ok and (select count(*) from public.codigo_aparelhos('ZZTEST01')) = 1);
  begin perform public.codigo_max_aparelhos('ZZTEST01', 9); res := res || jsonb_build_object('t','aparelhos: limite so de 1 a 5', 'ok', false); exception when others then res := res || jsonb_build_object('t','aparelhos: limite so de 1 a 5', 'ok', true); end;
  a := public.codigo_max_aparelhos('ZZTEST01', 3); res := res || jsonb_build_object('t','aparelhos: ajustar limite', 'ok', (select max_aparelhos from public.alunos_codigos where code='ZZTEST01')=3);
  -- progresso (somente leitura)
  a := public.codigo_progresso('ZZTEST01'); res := res || jsonb_build_object('t','consultar progresso: so leitura, mostra jogos e historico', 'ok', (a->'nuvem'->'jogos') ? 'detetive' and jsonb_array_length(a->'historico') >= 3 and (a->'figurinhas'->>'coladas')::int = 7);
  res := res || jsonb_build_object('t','historico registra as acoes', 'ok', (select count(*) from public.codigos_historico where code='ZZTEST01') >= 6);
  -- codigos reais intactos
  res := res || jsonb_build_object('t','codigos reais: nenhum desativado nem alterado de tipo', 'ok', (select count(*) from public.alunos_codigos where code not like 'ZZTEST%' and ativo) = (select count(*) from public.alunos_codigos where code not like 'ZZTEST%'));
  select string_agg(el->>'t', ' | ') into falhou from jsonb_array_elements(res) el where not (el->>'ok')::boolean;
  select count(*) into total from jsonb_array_elements(res);
  if falhou is null then raise exception 'TODOS OK: % de % testes passaram', total, total; end if;
  raise exception 'FALHOU: %', falhou;
end $t$;
