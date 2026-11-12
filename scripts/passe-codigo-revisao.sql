-- Código SEPARADO pra análise da Hotmart (área de membros externa). Não é um código de comprador e não passa pelo webhook.
-- Rodar no SQL Editor do Supabase (projeto beaterista-app) só depois que a Bea confirmar. Vale 30 dias; até 10 aparelhos (o revisor testa de vários).
-- Login = qualquer nome (ex.: "Revisor Hotmart"). Senha = o código abaixo. Entra em https://jogos.beaterista.com.br pelo campo "CÓDIGO DE ACESSO".
insert into public.alunos_codigos (code, nome, tipo, dias, max_aparelhos, expira_em, ativo)
values ('HOTMARTREV', 'Revisão Hotmart', 'passe', 30, 10, now() + interval '30 days', true)
on conflict (code) do update set ativo = true, expira_em = now() + interval '30 days', nome = excluded.nome, tipo = 'passe', max_aparelhos = 10;

-- Depois que a Hotmart aprovar, apague o acesso (não afeta nenhum outro código):
-- update public.alunos_codigos set ativo = false where code = 'HOTMARTREV';
