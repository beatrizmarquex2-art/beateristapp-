-- RESERVA da mudança de endereço (jogos → play). NÃO aplicado. Só use se, depois da mudança, alunos com passe virem "esse código já está em 2 aparelhos".
-- (Com a ponte js/migrar-dominio.js o id do aparelho viaja junto e isso normalmente nem acontece.)
-- Libera as vagas de aparelho SÓ dos códigos de passe; cada pessoa ocupa de novo até 2 vagas ao entrar. Turma e professora ficam intactos.
-- Conferir antes (SQL Editor):  select count(*) from codigos_aparelhos where code in (select code from alunos_codigos where tipo = 'passe');
begin;
delete from public.codigos_aparelhos where code in (select code from public.alunos_codigos where tipo = 'passe');
commit;
