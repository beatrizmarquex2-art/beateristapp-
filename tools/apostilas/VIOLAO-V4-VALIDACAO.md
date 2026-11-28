# Beaterista toca violão · Relatório de validação musical

Afinação usada em todos os cálculos: **E2 A2 D3 G3 B3 E4** (MIDI 40, 45, 50, 55, 59, 64), A4 = 440 Hz.

## 1. Diagramas de acorde
Para cada diagrama, o programa (`validaAcorde`, em `tools/apostilas/violao-lib.mjs`) fez: (1) calculou a nota de cada corda e casa; (2) conferiu se todas pertencem à fórmula da cifra (tríades, sétimas, sus, 5, baixo invertido); (3) conferiu se fundamental, terça e quinta essenciais estão presentes; (4) conferiu o baixo e as inversões; (5) conferiu que há dedo em toda corda apertada e nenhum dedo em corda solta ou abafada; (6) conferiu a abertura máxima de 4 casas; (7) conferiu a posição das pestanas. O texto de posicionamento de cada acorde (“Dedo 2 na 4ª corda…”) é **gerado do mesmo dado do desenho**, então os dois não podem divergir.

Resultado: **53 acordes distintos validados, 0 problemas** na versão final.

**Erro real encontrado pela validação durante a construção:** C/G digitado como 320010 (notas Si e Ré fora do acorde). O correto é **332010**. Corrigido no dado.

| Cifra | Casas (6ª→1ª) | Notas | Baixo | Posição |
|---|---|---|---|---|
| A | x02220 | Lá · Mi · Dó♯ | Lá | fundamental |
| A5 | x022xx | Lá · Mi | Lá | fundamental |
| A7 | x02020 | Lá · Mi · Sol · Dó♯ | Lá | fundamental |
| Am | x02210 | Lá · Mi · Dó | Lá | fundamental |
| Am/E | 002210 | Mi · Lá · Dó | Mi | 2ª inversão |
| Am7 | x02010 | Lá · Mi · Sol · Dó | Lá | fundamental |
| Amaj7 | x02120 | Lá · Mi · Sol♯ · Dó♯ | Lá | fundamental |
| Asus2 | x02200 | Lá · Mi · Si | Lá | fundamental |
| Asus4 | x02230 | Lá · Mi · Ré | Lá | fundamental |
| B | x24442 | Si · Fá♯ · Ré♯ | Si | fundamental |
| B7 | x21202 | Si · Ré♯ · Lá · Fá♯ | Si | fundamental |
| Bb | x13331 | Lá♯ · Fá · Ré | Lá♯ | fundamental |
| Bdim | x2343x | Si · Fá · Ré | Si | fundamental |
| Bm | x24432 | Si · Fá♯ · Ré | Si | fundamental |
| C | x32010 | Dó · Mi · Sol | Dó | fundamental |
| C#m | x46654 | Dó♯ · Sol♯ · Mi | Dó♯ | fundamental |
| C/E | 032010 | Mi · Dó · Sol | Mi | 1ª inversão |
| C/G | 332010 | Sol · Dó · Mi | Sol | 2ª inversão |
| C5 | x355xx | Dó · Sol | Dó | fundamental |
| C7 | x32310 | Dó · Mi · Lá♯ | Dó | fundamental |
| Caug | x32110 | Dó · Mi · Sol♯ | Dó | fundamental |
| Cdim | x3454x | Dó · Fá♯ · Ré♯ | Dó | fundamental |
| Cm | x35543 | Dó · Sol · Ré♯ | Dó | fundamental |
| Cmaj7 | x32000 | Dó · Mi · Sol · Si | Dó | fundamental |
| D | xx0232 | Ré · Lá · Fá♯ | Ré | fundamental |
| D/F# | 200232 | Fá♯ · Lá · Ré | Fá♯ | 1ª inversão |
| D5 | x577xx | Ré · Lá | Ré | fundamental |
| D7 | xx0212 | Ré · Lá · Dó · Fá♯ | Ré | fundamental |
| Dm | xx0231 | Ré · Lá · Fá | Ré | fundamental |
| Dm7 | xx0211 | Ré · Lá · Dó · Fá | Ré | fundamental |
| Dmaj7 | xx0222 | Ré · Lá · Dó♯ · Fá♯ | Ré | fundamental |
| Dsus2 | xx0230 | Ré · Lá · Mi | Ré | fundamental |
| Dsus4 | xx0233 | Ré · Lá · Sol | Ré | fundamental |
| E | 022100 | Mi · Si · Sol♯ | Mi | fundamental |
| E5 | 022xxx | Mi · Si | Mi | fundamental |
| E7 | 020100 | Mi · Si · Ré · Sol♯ | Mi | fundamental |
| Em | 022000 | Mi · Si · Sol | Mi | fundamental |
| Em7 | 020000 | Mi · Si · Ré · Sol | Mi | fundamental |
| Esus4 | 022200 | Mi · Si · Lá | Mi | fundamental |
| F | 133211 | Fá · Dó · Lá | Fá | fundamental |
| F | xx3211 | Fá · Lá · Dó | Fá | fundamental |
| F#m | 244222 | Fá♯ · Dó♯ · Lá | Fá♯ | fundamental |
| F/C | x3321x | Dó · Fá · Lá | Dó | 2ª inversão |
| Fm | 133111 | Fá · Dó · Sol♯ | Fá | fundamental |
| Fmaj7 | xx3210 | Fá · Lá · Dó · Mi | Fá | fundamental |
| G | 320003 | Sol · Si · Ré | Sol | fundamental |
| G#m | 466444 | Sol♯ · Ré♯ · Si | Sol♯ | fundamental |
| G/B | x20003 | Si · Ré · Sol | Si | 1ª inversão |
| G5 | 355xxx | Sol · Ré | Sol | fundamental |
| G7 | 320001 | Sol · Si · Ré · Fá | Sol | fundamental |
| Gaug | 321003 | Sol · Si · Ré♯ | Sol | fundamental |
| Gm | 355333 | Sol · Ré · Lá♯ | Sol | fundamental |
| Gmaj7 | 320002 | Sol · Si · Ré · Fá♯ | Sol | fundamental |

## 2. Partituras e tablaturas
25 trechos escritos. Em cada um: a tablatura é **calculada** a partir da altura da nota (corda e casa produzem exatamente aquela altura; o programa confere `altura(corda, casa) = nota`); a soma de cada compasso é conferida contra a fórmula de compasso (4/4 = 16, 3/4 = 12, 6/8 = 12 semicolcheias); notas que atravessam a barra, compassos incompletos e notas fora do braço (acima da casa 12) geram erro. A partitura é escrita uma oitava acima do som (clave de sol com 8 embaixo).

| Trecho | Compasso | Compassos | Notas |
|---|---|---|---|
| exemplo-pauta | 4/4 | 2 | 8 |
| leit1 | 4/4 | 2 | 7 |
| leit2 | 4/4 | 2 | 6 |
| leit3 | 4/4 | 2 | 10 |
| ded1 | 4/4 | 2 | 16 |
| ded2 | 4/4 | 1 | 8 |
| ded3 | 3/4 | 2 | 12 |
| tec-hp | 4/4 | 2 | 8 |
| tec-sv | 4/4 | 1 | 3 |
| tec-b | 4/4 | 1 | 2 |
| tec-harm | 4/4 | 1 | 4 |
| parabens | 3/4 | 9 | 25 |
| brilha | 4/4 | 12 | 42 |
| frei | 4/4 | 8 | 32 |
| ode | 4/4 | 8 | 30 |
| jingle | 4/4 | 8 | 26 |
| noite | 6/8 | 12 | 46 |
| esc-cro | 4/4 | 2 | 13 |
| esc-dom | 4/4 | 1 | 8 |
| esc-dom2 | 4/4 | 2 | 10 |
| esc-sol | 4/4 | 1 | 8 |
| esc-lam | 4/4 | 1 | 8 |
| pent-am | 4/4 | 1 | 8 |
| pent-c | 4/4 | 1 | 6 |
| blues-a | 4/4 | 1 | 7 |

Resultado: **0 problemas**.

## 3. Melodias: o que foi e o que não foi verificado
- **Verificado por programa:** alturas, correspondência partitura–tablatura, duração de cada compasso, anacruse (Parabéns, 3/4, anacruse de 1 tempo).
- **Verificado por conhecimento da melodia (não por programa):** a sequência de notas e o ritmo de Parabéns, Brilha brilha, Frei João, Ode à Alegria e Jingle Bells (refrão) são os tradicionais.
- **Atenção, Noite Feliz:** as notas são as tradicionais, mas o **ritmo em 6/8 foi reconstruído e simplificado**. Recomendo confrontar com uma edição de referência antes de vender. O livro já a rotula como “versão simplificada”.
- **Direitos:** Gruber (1818), Pierpont (1857), Beethoven (1824) e as melodias de tradição oral são de domínio público. A melodia de “Parabéns pra você” (Hill, 1893) é de domínio público no Brasil e nos EUA; as letras não foram reproduzidas. Não é parecer jurídico: confirme se for usar arranjos de terceiros.

## 4. Escalas e braço
Escalas (cromática, Dó maior, Sol maior, Lá menor natural, pentatônicas, blues) são geradas por altura e conferidas como acima. Os mapas do braço calculam cada casa por `afinação + casa`. A cromática foi corrigida: a da v3 pulsava a nota Lá; a nova é contínua, de Mi a Mi (13 notas).

## 5. Gabaritos
Os gabaritos dos desafios (notas, acorde, fundamental, intervalo, tonalidade, progressão, tablatura) são **calculados pelo programa** a partir das mesmas funções, não digitados.

## 6. O que não foi verificado
- Execução real em um violão (viabilidade de digitação foi checada por regra: abertura ≤ 4 casas, dedos distintos; alguns dedilhados, como D/F♯, são possíveis mas exigem prática).
- Padrões característicos de samba, bossa e forró: **não incluídos** (apenas introdutórios, declarados como tal).
- Ilustrações de postura com pessoa: **retiradas** (ficaram amadoras); aguardam fotos reais.