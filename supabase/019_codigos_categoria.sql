-- Categoria do código (aba "Códigos" do app da Bea): aluno · amigo · marca · outro. Só serve pra filtrar e organizar; não muda o acesso.
-- Já aplicada no projeto beaterista-app em 18/nov/2026. Seguro rodar de novo.
alter table public.alunos_codigos add column if not exists categoria text not null default 'aluno';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'alunos_codigos_categoria_check') then
    alter table public.alunos_codigos add constraint alunos_codigos_categoria_check check (categoria in ('aluno', 'amigo', 'marca', 'outro'));
  end if;
end $$;
