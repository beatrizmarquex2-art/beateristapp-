# Banco de conteúdo verificado (folha de conferência)

Gerado por `scripts/gera-banco.mjs` a partir dos PDFs da Bea. **447 itens** em 4 assuntos.

Cada item vem de um trecho dos PDFs por transformação mecânica (definição ↔ termo, lacuna, verdadeiro/falso). Antes de entrar, o trecho é procurado de novo, palavra por palavra (janelas de 5 palavras), no texto da página do PDF; se não achar, é rejeitado. As respostas erradas (distratores) vêm de outros itens do mesmo assunto e não podem aparecer no enunciado, dividir palavra com a resposta nem ter explicação parecida (Jaccard ≥ 0,15).

**O que isso garante e o que não garante:** garante que o texto do item está nos PDFs. Não garante que uma resposta errada nunca possa ser “também certa” em casos raros (por exemplo termos quase sinônimos) — por isso a amostra abaixo é pra você bater o olho.

## Contagem por assunto e nível (f = fácil · m = médio · d = difícil)

| assunto | total | f | m | d | definição | lacuna | v/f |
|---|---|---|---|---|---|---|---|
| ritmo | 131 | 45 | 65 | 21 | 87 | 5 | 39 |
| teoria | 66 | 19 | 35 | 12 | 37 | 3 | 26 |
| cordas | 52 | 16 | 17 | 19 | 29 | 5 | 18 |
| dicionário (banda, estúdio, jeito de falar) | 198 | 118 | 80 | 0 | 128 | 0 | 70 |

## Itens por PDF

| PDF | itens |
|---|---|
| Cards Dicionário Musical (120) | 323 |
| Cards Instrumentos (90) | 104 |
| Robôterista Ensina | 17 |
| Robôterista Melodia e Harmonia | 3 |
| Caderno de Atividades do Paul | 0 |

## Como os jogos usam o banco

- **Quiz, caça-palavras e cruzadinha** (aba Jogos e portas da Fuga): os itens de uma palavra só (4 a 11 letras) entram junto com as dicas do método. No quiz, as 3 respostas erradas são as do próprio banco (nunca sorteadas de outro item).
- **Fuga, trilhas:** a trilha de ritmo, teoria ou cordas filtra o banco pelo assunto; a geral e a infinita usam tudo (inclui o dicionário).
- **Memória, pesca e mira (Fuga):** pares termo ↔ inglês e figura ↔ valor, e perguntas curtas do banco. Os pares de texto escritos antes à mão só entram se o banco tiver pouco da área (cordas, por enquanto). Os desenhos das figuras na memória são arte do app e continuam.
- Sem internet o banco funciona: os arquivos ficam no cache do app (assets/jogos/banco).

## Regra de nível (determinística)

- cartas do dicionário: pelo tamanho da explicação (até 70 caracteres = fácil, até 110 = médio, mais = difícil); tradução pro inglês: termo de uma palavra = fácil, mais de uma = médio.
- cartas de instrumentos: pela fase da carta (fases 1–2 fácil, 3–4 médio, 5–6 difícil).
- livros: figuras pela ordem (semibreve, mínima, semínima = fácil; colcheia, semicolcheia = médio; o resto = difícil); frases pelo tamanho, como nas cartas.

## Assunto de cada fonte

- Dicionário: BATERIA → ritmo · TEORIA e TECLADO → teoria · VIOLÃO → cordas · BANDA E PALCO, ESTÚDIO E EQUIPAMENTO, COMO O MÚSICO FALA → dicionário.
- Instrumentos: bateria → ritmo · teclado → teoria · violão → cordas.
- Livros: figuras → ritmo; frases com lacuna seguem o assunto do termo apagado.

## O que ficou de fora

- 0 itens rejeitados na verificação.
- 35 trechos pulados (distratores inseguros, texto longo demais etc.):

  - ins p3 tom-tom e surdo: o título aparece no texto em pedaços
  - ins p4 o pé no pedal: o título aparece no texto em pedaços
  - ins p4 só o bumbo: o título aparece no texto em pedaços
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
  - ins p7 tocando devagar: o título aparece no texto em pedaços
  - ins p8 passando o polegar: o título aparece no texto em pedaços
  - ins p8 tom e meio tom: o título aparece no texto em pedaços
  - ins p8 o que é acorde: o título aparece no texto em pedaços
  - ins p8 fá maior: o título aparece no texto em pedaços
  - ins p9 lá menor: o título aparece no texto em pedaços
  - ins p9 acorde no pulso: o título aparece no texto em pedaços
  - ins p9 teclas pretas: o título aparece no texto em pedaços
  - ins p9 grossa é grave: o título aparece no texto em pedaços
  - ins p10 trastes e casas: o título aparece no texto em pedaços
  - ins p10 sentado com o violão: o título aparece no texto em pedaços
  - ins p11 o dó na corda lá: o título aparece no texto em pedaços
  - ins p11 mi maior (e): o título aparece no texto em pedaços
  - ins p12 trocando de acorde: o título aparece no texto em pedaços
  - ins p12 pra baixo, no pulso: o título aparece no texto em pedaços
  - ins p12 uma batida famosa: o título aparece no texto em pedaços
  - caderno de atividades: são folhas de exercício (grades de caça-palavras e cruzadinhas sem gabarito em texto); nenhum item gerado (as pistas não têm resposta única verificável no texto)

- Atenção: a segunda cópia do dicionário tem 9 cartas com título diferente.

## 30 perguntas sorteadas pra você conferir

1. **[definicao · dicionario · f]** tocando na hora, com público, sem ser gravado. → **ao vivo** (erradas: dueto · autoral · fechar junto) — fonte: Cards Dicionário Musical (120), p. 16
2. **[definicao · dicionario · m]** descobrir como se toca uma música só escutando, sem partitura e sem cifra. → **tirar de ouvido** (erradas: estúdio · palco · distorção) — fonte: Cards Dicionário Musical (120), p. 13
3. **[definicao · teoria · f]** como se diz “melodia” em inglês? → **melody** (erradas: arpeggio · harmony · fingering) — fonte: Cards Dicionário Musical (120), p. 7
4. **[definicao · teoria · m]** o pedal do piano que deixa as notas soando depois que você solta as teclas. deixa o som cheio e emendado. → **pedal de sustentação** (erradas: ritmo · timbre · harmonia) — fonte: Cards Dicionário Musical (120), p. 7
5. **[definicao · dicionario · m]** a caixinha virada pra banda no palco: serve pro músico ouvir a si mesmo e aos colegas. → **retorno** (erradas: plateia · afinador · equalizador) — fonte: Cards Dicionário Musical (120), p. 9
6. **[definicao · dicionario · f]** dizer ou tocar a primeira nota pra todo mundo começar na altura certa. → **dar o tom** (erradas: playback · backline · base) — fonte: Cards Dicionário Musical (120), p. 15
7. **[definicao · dicionario · f]** uma música dentro de um disco, ou cada instrumento gravado separado. → **faixa** (erradas: playback · banda de garagem · retorno) — fonte: Cards Dicionário Musical (120), p. 13
8. **[definicao · dicionario · f]** como se diz “estúdio” em inglês? → **studio** (erradas: mic stand · soundcheck · compose) — fonte: Cards Dicionário Musical (120), p. 12
9. **[definicao · ritmo · f]** o tambor do meio, com um som seco e estalado. é tocado com a baqueta e marca o 2 e o 4 no rock. → **caixa** (erradas: a virada · mão direita: chimbal · pratos) — fonte: Cards Instrumentos (90), p. 3
10. **[v/f · dicionario · f]** “bis: tocar sem olhar partitura nem cifra, porque já decorou.” → **falso** — fonte: Cards Dicionário Musical (120), p. 14
11. **[definicao · dicionario · f]** como se diz “microfonia” em inglês? → **feedback** (erradas: soundcheck · compose · repertoire) — fonte: Cards Dicionário Musical (120), p. 13
12. **[definicao · ritmo · d]** nota bem fraquinha na caixa, entre as fortes. quase não se ouve, mas se sente: deixa o groove "recheado". escreve-se entre parênteses. → **nota fantasma** (erradas: síncope · backbeat · contagem de entrada) — fonte: Cards Dicionário Musical (120), p. 5
13. **[definicao · ritmo · f]** quanto vale a semínima? → **1 tempo** (erradas: 4 tempos · meio tempo · 2 tempos) — fonte: Robôterista Ensina, p. 18
14. **[definicao · teoria · d]** sol, si e ré. de novo o mesmo desenho: pula uma, toca; pula uma, toca. → **sol maior** (erradas: mi · tom e meio tom · mão curvada) — fonte: Cards Instrumentos (90), p. 8
15. **[definicao · dicionario · m]** grupo de amigos que se junta pra tocar por diversão, às vezes na garagem de casa. → **banda de garagem** (erradas: autoral · microfone · cabo) — fonte: Cards Dicionário Musical (120), p. 16
16. **[v/f · dicionario · f]** “arranjo: o jeito de organizar uma música: quem toca o quê e em qual momento.” → **verdadeiro** — fonte: Cards Dicionário Musical (120), p. 15
17. **[definicao · dicionario · f]** tocar ou cantar de leve antes, pra preparar as mãos e a voz. → **aquecer** (erradas: dueto · cover · caixa de som) — fonte: Cards Dicionário Musical (120), p. 16
18. **[definicao · ritmo · m]** aquele trecho em que a banda inteira ataca junto as mesmas notas. o baterista marca com prato e bumbo. → **convenção** (erradas: contagem · condução · nota fantasma) — fonte: Cards Dicionário Musical (120), p. 6
19. **[v/f · ritmo · m]** “meio tempo: a caixa só no 3: a música parece andar na metade da velocidade, mesmo com o mesmo BPM. fica pesado.” → **verdadeiro** — fonte: Cards Dicionário Musical (120), p. 4
20. **[definicao · teoria · m]** as notas tocadas juntas, que formam o fundo da melodia. um acorde é um pedacinho de harmonia. → **harmonia** (erradas: teclas brancas e pretas · dó central · passagem do polegar) — fonte: Cards Dicionário Musical (120), p. 7
21. **[definicao · dicionario · m]** momento em que um instrumento toca sozinho, em destaque, enquanto os outros acompanham. → **solo** (erradas: segunda voz · final · camarim) — fonte: Cards Dicionário Musical (120), p. 10
22. **[definicao · ritmo · f]** costas retas, ombros soltos e pés apoiados. o banco fica numa altura em que as coxas descem um pouquinho. → **sentado certo** (erradas: treine nos jogos · pé direito: bumbo · pratos) — fonte: Cards Instrumentos (90), p. 3
23. **[v/f · ritmo · f]** “caixa: pra quem toca destro, a mão direita cuida do chimbal. treine ela sozinha, firme e sempre igual.” → **falso** — fonte: Cards Instrumentos (90), p. 4
24. **[v/f · dicionario · m]** “setlist: a lista das músicas do show, na ordem em que a banda vai tocar. costuma ficar colada no chão, perto dos pés.” → **verdadeiro** — fonte: Cards Dicionário Musical (120), p. 8
25. **[definicao · dicionario · f]** como se diz “vocalista” em inglês? → **lead singer** (erradas: choir · drummer · studio) — fonte: Cards Dicionário Musical (120), p. 9
26. **[definicao · dicionario · f]** a haste que segura o microfone na altura certa. → **pedestal** (erradas: a cappella · click · afinador) — fonte: Cards Dicionário Musical (120), p. 11
27. **[definicao · ritmo · d]** o volume da música: piano (p) é fraco, forte (f) é forte, mezzo (m) é o meio. crescendo vai aumentando, decrescendo vai diminuindo. → **dinâmica** (erradas: contagem · paradiddle · toque simples) — fonte: Cards Dicionário Musical (120), p. 6
28. **[v/f · ritmo · m]** “ostinato: a nota tocada mais forte que as outras (o sinal ">"). acento muda totalmente a cara de um rudimento.” → **falso** — fonte: Cards Dicionário Musical (120), p. 5
29. **[definicao · teoria · m]** cada um dos 7 nomes que o som pode ter: dó, ré, mi, fá, sol, lá, si. depois do si, volta o dó. → **nota musical** (erradas: melodia · timbre · arpejo) — fonte: Cards Dicionário Musical (120), p. 6
30. **[lacuna · ritmo · f]** toda figura é comparada com uma só: a _____. → **semínima** (erradas: semicolcheia · fusa · mínima) — fonte: Robôterista Ensina, p. 15
