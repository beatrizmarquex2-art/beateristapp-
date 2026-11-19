# Banco de conteúdo verificado (folha de conferência)

Gerado por `scripts/gera-banco.mjs` a partir dos PDFs da Bea. **431 itens** em 4 assuntos.

Cada item vem de um trecho dos PDFs por transformação mecânica (definição ↔ termo, lacuna, verdadeiro/falso). Antes de entrar, o trecho é procurado de novo, palavra por palavra (janelas de 5 palavras), no texto da página do PDF; se não achar, é rejeitado. As respostas erradas (distratores) vêm de outros itens do mesmo assunto e não podem aparecer no enunciado, dividir palavra com a resposta nem ter explicação parecida (Jaccard ≥ 0,15).

**O que isso garante e o que não garante:** garante que o texto do item está nos PDFs. Não garante que uma resposta errada nunca possa ser “também certa” em casos raros (por exemplo termos quase sinônimos) — por isso a amostra abaixo é pra você bater o olho.

## Contagem por assunto e nível (f = fácil · m = médio · d = difícil)

| assunto | total | f | m | d | definição | lacuna | v/f |
|---|---|---|---|---|---|---|---|
| ritmo | 125 | 48 | 58 | 19 | 83 | 4 | 38 |
| teoria | 62 | 18 | 31 | 13 | 36 | 3 | 23 |
| cordas | 49 | 14 | 17 | 18 | 27 | 5 | 17 |
| dicionário (banda, estúdio, jeito de falar) | 195 | 152 | 43 | 0 | 128 | 0 | 67 |

## Itens por PDF

| PDF | itens |
|---|---|
| Cards Dicionário Musical (120) | 314 |
| Cards Instrumentos (90) | 97 |
| Robôterista Ensina | 17 |
| Robôterista Melodia e Harmonia | 3 |
| Caderno de Atividades do Paul | 0 |

## Como os jogos usam o banco

- **Quiz, caça-palavras e cruzadinha** (aba Jogos e portas da Fuga): os itens de uma palavra só (4 a 11 letras) entram junto com as dicas do método. No quiz, as 3 respostas erradas são as do próprio banco (nunca sorteadas de outro item).
- **Fuga, trilhas:** a trilha de ritmo, teoria ou cordas filtra o banco pelo assunto; a geral e a infinita usam tudo (inclui o dicionário).
- **Memória, pesca e mira (Fuga):** pares termo ↔ inglês e figura ↔ valor, e perguntas curtas do banco. Os pares de texto escritos antes à mão só entram se o banco tiver pouco da área (cordas, por enquanto). Os desenhos das figuras na memória são arte do app e continuam.
- Sem internet o banco funciona: os arquivos ficam no cache do app (assets/jogos/banco).

## Regra de nível (determinística)

- cartas do dicionário e frases dos livros: pelo tamanho do trecho (até 80 caracteres = fácil, até 110 = médio, mais = difícil; antes era 70/110 e definições simples e compridas viravam “difícil” demais); tradução pro inglês: termo de uma palavra = fácil, mais de uma = médio.
- cartas de instrumentos: pela fase da carta (fases 1–2 fácil, 3–4 médio, 5–6 difícil).
- livros: figuras pela ordem (semibreve, mínima, semínima = fácil; colcheia, semicolcheia = médio; o resto = difícil); frases pelo tamanho, como nas cartas.

## Assunto de cada fonte

- Regra de sobreposição (deterministica): carta da seção BATERIA do dicionário em que NENHUM campo (termo, explicação, inglês; a “dica” não conta) tem palavra de bateria (bateria, caixa, bumbo, chimbal, prato, surdo, baqueta, pedal, esteira, levada, groove, rulo, paradiddle, aro, tambor, pele…) nem de ritmo (tempo, pulso, compasso, ritmo, colcheia, contagem, batida, acento, mãos, pés, membros…) é conceito geral e vai pra **teoria**. Hoje só a **dinâmica** passa; contratempo, síncope, acento etc. ficam em ritmo.
- Dicionário: BATERIA → ritmo · TEORIA e TECLADO → teoria · VIOLÃO → cordas · BANDA E PALCO, ESTÚDIO E EQUIPAMENTO, COMO O MÚSICO FALA → dicionário.
- Instrumentos: bateria → ritmo · teclado → teoria · violão → cordas.
- Livros: figuras → ritmo; frases com lacuna seguem o assunto do termo apagado.

## O que ficou de fora

- 0 itens rejeitados na verificação.
- 42 trechos pulados (distratores inseguros, texto longo demais etc.):

  - dic p3 tempo forte e tempo fraco: poucos distratores seguros
  - dic p7 teclas brancas e pretas: poucos distratores seguros
  - dic p8 batida de violão: poucos distratores seguros
  - ins p3 tom-tom e surdo: o título aparece no texto em pedaços
  - ins p4 o pé no pedal: o título aparece no texto em pedaços
  - ins p4 pulso: 1, 2, 3, 4: poucos distratores seguros
  - ins p4 só o bumbo: o título aparece no texto em pedaços
  - ins p4 caixa no 2 e no 4: poucos distratores seguros
  - ins p4 chimbal em colcheias: o título aparece no texto em pedaços
  - ins p4 a levada de rock: o título aparece no texto em pedaços
  - ins p4 mão direita: chimbal: o título aparece no texto em pedaços
  - ins p4 mão esquerda: caixa: o título aparece no texto em pedaços
  - ins p4 pé direito: bumbo: o título aparece no texto em pedaços
  - ins p5 duas coisas juntas: o título aparece no texto em pedaços
  - ins p5 tudo junto, devagar: o título aparece no texto em pedaços
  - ins p5 um bumbo a mais: o título aparece no texto em pedaços
  - ins p5 chimbal aberto: o título aparece no texto em pedaços
  - ins p6 forte e fraco: o título aparece no texto em pedaços
  - ins p6 final com prato: o título aparece no texto em pedaços
  - ins p6 treine nos jogos: propaganda do app
  - ins p6 brancas e pretas: o título aparece no texto em pedaços
  - ins p6 agudo e grave: o título aparece no texto em pedaços
  - ins p6 grupos de 2 e 3: o título aparece no texto em pedaços
  - ins p6 as 7 notas: poucos distratores seguros
  - ins p7 tocando devagar: o título aparece no texto em pedaços
  - ins p8 passando o polegar: o título aparece no texto em pedaços
  - ins p8 tom e meio tom: o título aparece no texto em pedaços
  - ins p8 o que é acorde: o título aparece no texto em pedaços
  - ins p8 fá maior: o título aparece no texto em pedaços
  - ins p9 lá menor: o título aparece no texto em pedaços
  - ins p9 acorde no pulso: o título aparece no texto em pedaços
  - ins p9 teclas pretas: o título aparece no texto em pedaços
  - ins p9 as 6 cordas: poucos distratores seguros
  - ins p9 grossa é grave: o título aparece no texto em pedaços
  - ins p10 trastes e casas: o título aparece no texto em pedaços
  - ins p10 sentado com o violão: o título aparece no texto em pedaços
  - ins p11 o dó na corda lá: o título aparece no texto em pedaços
  - ins p11 mi maior (e): o título aparece no texto em pedaços
  - ins p12 trocando de acorde: o título aparece no texto em pedaços
  - ins p12 pra baixo, no pulso: o título aparece no texto em pedaços
  - ins p12 uma batida famosa: o título aparece no texto em pedaços
  - caderno de atividades: são folhas de exercício (grades de caça-palavras e cruzadinhas sem gabarito em texto); nenhum item gerado (as pistas não têm resposta única verificável no texto)

## Dicionário: as duas cópias do PDF (conferência)

Os PDFs `b80dcb02-Cards-Dicionario-Musical-Paul.pdf` e `0cab7b2b-Cards-do-Robo-Paul-DICIONARIO-120-completo.pdf` foram comparados carta por carta (título, explicação, inglês). **Eu não escolhi uma cópia como oficial:** não precisou, porque o conteúdo é o mesmo.

| o que comparei | resultado |
|---|---|
| cartas com explicação (cada cópia) | 120 |
| cartas com título diferente | 0 |
| cartas com a mesma capa e explicação diferente | 0 |
| texto extraído das duas cópias | idêntico |
| páginas desenhadas iguais (pdftoppm, 40 dpi) | 17 de 17 |

Nenhuma carta diverge. A diferença entre as cópias é só a data de criação do arquivo (16 e 17/nov).

**De onde veio o “9 títulos diferentes” da folha anterior:** era um erro da contagem do gerador (ele comparava títulos com as cartas que já tinham virado item e contava como “diferentes” as 9 células da contracapa, p.17, que têm só o título “CARDS DO ROBÔTERISTA PAUL” e nenhuma explicação). Não é divergência entre as cópias. Corrigido.

**Itens pendentes (excluídos até você escolher):** nenhum. Se um dia as cópias divergirem, é só pôr o título da carta (em maiúsculas) em `PENDENTES` no começo de `scripts/gera-banco.mjs` e regerar; tirar da lista traz a carta de volta.

## O que mudou na revisão desta geração

- **Unidade de tempo:** toda pergunta de duração diz “com a semínima valendo 1 tempo (compasso 4/4)” (ou “no compasso 4/4” na da própria semínima); a regra é conferida no livro (Robôterista Ensina, p.15 e p.16) por uma 2ª âncora (`c2`).
- **Caça-palavras e cruzadinha:** o comprimento é medido depois de tirar o acento (semínima → SEMINIMA, 8 letras), de 4 a 11 letras; 7 palavras ficam de fora por tamanho e 2 pistas ficam de fora por servir pra mais de uma palavra do banco (continuam no quiz). Entram **87** itens (`cc: 1`).
- **Alternativas:** do mesmo tipo da resposta (mesmo nº de palavras ±1, número/sigla iguais), nunca uma variante aceita. O campo `ac` guarda variantes que o próprio cartão mostra (ex.: “offbeat / upbeat”).
- **Verdadeiro/falso:** afirmação completa (“…” significa: …) com feedback trazendo a correção (a falsa mostra a explicação certa, conferida no PDF). 5 afirmações verdadeiras foram descartadas por se entregarem (a explicação repete o próprio termo).
- **Assunto e nível:** ver as regras acima (conceitos gerais da seção BATERIA vão pra teoria; níveis 80/110 caracteres).
- **Respostas longas:** nenhuma resposta ou alternativa passa de 60 caracteres (as maiores já eram termos curtos).

## 30 perguntas sorteadas pra você conferir

1. **[v/f · dicionario · f]** “bis” significa: tocar sem olhar partitura nem cifra, porque já decorou. → **falso** — feedback: na verdade, “bis” significa: quando a plateia pede mais e a banda volta pra tocar mais uma música. — fonte: Cards Dicionário Musical (120), p. 14 + Cards Dicionário Musical (120), p. 9
2. **[definicao · dicionario · f]** como se diz “acompanhar” em inglês? → **accompany** (erradas: garage band · dressing room · distortion) — fonte: Cards Dicionário Musical (120), p. 14
3. **[definicao · dicionario · f]** inventar música na hora, sem ter combinado antes. → **improvisar** (erradas: vocalista · loop · solo) — fonte: Cards Dicionário Musical (120), p. 14
4. **[definicao · dicionario · m]** como se diz “banda de abertura” em inglês? → **opening act** (erradas: backing · improvise · audio interface) — fonte: Cards Dicionário Musical (120), p. 11
5. **[definicao · dicionario · f]** como se diz “microfone” em inglês? → **mic** (erradas: soundcheck · audio interface · tuner) — fonte: Cards Dicionário Musical (120), p. 11
6. **[definicao · cordas · f]** como se diz “cifra” em inglês? → **chord chart** (erradas: capo · strumming · barre) — fonte: Cards Dicionário Musical (120), p. 8
7. **[v/f · ritmo · m]** “independência” significa: a nota tocada mais forte que as outras (o sinal ">"). acento muda totalmente a cara de um rudimento. → **falso** — feedback: na verdade, “independência” significa: cada membro fazendo uma coisa diferente sem um arrastar o outro. — fonte: Cards Dicionário Musical (120), p. 5 + Cards Dicionário Musical (120), p. 5
8. **[definicao · ritmo · f]** como se diz “convenção” em inglês? → **hits / kicks** (também vale: hits · kicks) (erradas: accent · independence / coordination · double stroke roll) — fonte: Cards Dicionário Musical (120), p. 6
9. **[v/f · dicionario · f]** “loop” significa: terminar a música todos juntos, no mesmo instante. → **falso** — feedback: na verdade, “loop” significa: um trechinho que fica repetindo sem parar. — fonte: Cards Dicionário Musical (120), p. 14 + Cards Dicionário Musical (120), p. 13
10. **[definicao · dicionario · f]** como se diz “vocalista” em inglês? → **lead singer** (erradas: choir · drummer · studio) — fonte: Cards Dicionário Musical (120), p. 9
11. **[definicao · cordas · d]** dedo 2 na casa 3 da corda mi grave, dedo 1 na casa 2 da lá e dedo 3 na casa 3 da mi agudo. → **sol maior (g)** (erradas: treino todo dia · sentado com o violão · trastes e casas) — fonte: Cards Instrumentos (90), p. 12
12. **[definicao · ritmo · f]** são dois pratos que fecham um sobre o outro. com o pé você abre e fecha, e com a baqueta faz o "tchi tchi". → **chimbal** (erradas: caixa · quatro bumbos · a virada) — fonte: Cards Instrumentos (90), p. 3
13. **[v/f · teoria · d]** sobre “uma melodia”: a "Ode à Alegria" começa assim: mi, mi, fá, sol, sol, fá, mi, ré. só usa 5 notas vizinhas! → **verdadeiro** — feedback: certo! é o que o cartão “uma melodia” diz. — fonte: Cards Instrumentos (90), p. 9
14. **[v/f · ritmo · m]** “aro” significa: baqueta acertando a pele e o aro ao mesmo tempo: estalo forte e brilhante na caixa. → **verdadeiro** — feedback: certo! no cartão do Paul, “aro” é isso mesmo. — fonte: Cards Dicionário Musical (120), p. 6
15. **[definicao · dicionario · f]** como se diz “playback” em inglês? → **backing track** (erradas: play from memory · audience · give the cue) — fonte: Cards Dicionário Musical (120), p. 13
16. **[definicao · ritmo · f]** bata no meio da pele da caixa. perto da borda, o som fica fraco e sem corpo. → **o ponto de toque** (erradas: duas coisas juntas · só o bumbo · a levada de rock) — fonte: Cards Instrumentos (90), p. 3
17. **[definicao · dicionario · f]** a facilidade de reconhecer notas, ritmos e melodias. dá pra treinar. → **ouvido musical** (erradas: base · tocar junto · solo) — fonte: Cards Dicionário Musical (120), p. 15
18. **[definicao · dicionario · f]** terminar a música todos juntos, no mesmo instante. → **fechar junto** (erradas: pedestal · autoral · baterista) — fonte: Cards Dicionário Musical (120), p. 14
19. **[definicao · cordas · d]** conte 1, 2, 3, 4 em cada acorde e já pense no dedo do próximo antes de acabar. → **contando a troca** (erradas: dedos numerados · lá menor (am) · apertando bem) — fonte: Cards Instrumentos (90), p. 12
20. **[definicao · cordas · m]** as três cordas mais finas soltas: sol, si e mi. juntas com as outras, formam as 6 do violão. → **sol, si e mi soltos** (erradas: pra baixo e pra cima · o dó na corda lá · pra baixo, no pulso) — fonte: Cards Instrumentos (90), p. 11
21. **[definicao · dicionario · f]** como se diz “show” em inglês? → **gig** (erradas: recording · live · soundcheck) — fonte: Cards Dicionário Musical (120), p. 8
22. **[definicao · dicionario · m]** como se diz “ouvido musical” em inglês? → **musical ear** (erradas: audience · opening act · duet) — fonte: Cards Dicionário Musical (120), p. 15
23. **[definicao · dicionario · m]** como se diz “entrar na hora” em inglês? → **come in on time** (erradas: figure it out · give the cue · play from memory) — fonte: Cards Dicionário Musical (120), p. 14
24. **[definicao · ritmo · f]** como se diz “acento” em inglês? → **accent** (erradas: rimshot · time signature · cross-stick) — fonte: Cards Dicionário Musical (120), p. 5
25. **[definicao · dicionario · f]** aparelho que mostra se a nota está certa. a agulha no meio quer dizer afinado. → **afinador** (erradas: final · amplificador · ponte) — fonte: Cards Dicionário Musical (120), p. 11
26. **[v/f · dicionario · f]** “delay” significa: efeito que repete o som várias vezes, cada vez mais baixinho, como um eco. → **verdadeiro** — feedback: certo! no cartão do Paul, “delay” é isso mesmo. — fonte: Cards Dicionário Musical (120), p. 12
27. **[definicao · dicionario · f]** como se diz “estrofe” em inglês? → **verse** (erradas: feedback · monitor · bridge) — fonte: Cards Dicionário Musical (120), p. 10
28. **[v/f · dicionario · f]** “playback” significa: a facilidade de reconhecer notas, ritmos e melodias. dá pra treinar. → **falso** — feedback: na verdade, “playback” significa: música já gravada, tocando de fundo, pra alguém cantar ou tocar por cima. — fonte: Cards Dicionário Musical (120), p. 15 + Cards Dicionário Musical (120), p. 13
29. **[definicao · dicionario · f]** ouvir uma música várias vezes até descobrir as notas ou os acordes. → **tirar a música** (erradas: entrar na hora · ao vivo · fone de ouvido) — fonte: Cards Dicionário Musical (120), p. 14
30. **[definicao · ritmo · m]** como se diz “toque duplo” em inglês? → **double stroke roll** (erradas: downbeat / weak beat · half time · hits / kicks) — fonte: Cards Dicionário Musical (120), p. 5
