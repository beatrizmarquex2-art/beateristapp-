# Marketing da Beaterista (reels, copy e catálogo de mídia)

Tudo que a Bea precisa pra continuar a produção de conteúdo de venda sem explicar de novo. Atualizado em 13/nov/2026.

## Onde ficam os vídeos crus
- **Não entram neste repo**: ele é público e os vídeos têm alunos crianças.
- Pasta no Google Drive da Bea: "Beaterista - mídia bruta (vídeos pra reels)" (https://drive.google.com/drive/folders/1LkrR-b3lwRgMv442lotJMtJtYNhGU6Wu). A Bea sobe os arquivos lá pelo celular (o conector do chat só aceita arquivo até uns 3 MB).
- Numa sessão nova, a Bea reenvia os clipes que quiser usar; o catálogo abaixo diz o que é cada um.

## Catálogo dos clipes (nov/2026)
| arquivo | formato | duração | o que mostra | melhor uso |
|---|---|---|---|---|
| IMG_9022 | gravado de lado (girar, `layout: rot`) | 10s | lojinha no tablet: memória, bateria kids, robôterista, violão do zero, mood, bateria start, com preços | vídeo da lojinha / materiais pra imprimir |
| IMG_9023 | vertical | 6s | roleta de figurinhas: The Beatles (comum) e Eloy Casagrande (rara), botão "colar tudo no álbum" | álbum / recompensa |
| IMG_9025 | horizontal, sem som | 10s | quebra-cabeça no tablet (tela de lado) | reserva |
| IMG_9027 | vertical | 2,5s | caça-palavras musical, dedo marcando | corte rápido |
| IMG_9246 | vertical, escuro | 9s | aluno aperta "ouvir" no estudo de ritmo, baquetas e pad (cabeça de costas) | passo "ouve" |
| IMG_9248 | vertical, bem escuro | 22s | mesmo estudo, mais longo; clareia no fim (20s) | reserva |
| IMG_9249 | horizontal | 20s | tablet com ouvir/tocar + baquetas + pad, braço do aluno | pra professores |
| IMG_9255 | vertical | 14s | jogo de ritmo neon, duas mãos, bem iluminado | melhor imagem de "jogo" |
| IMG_9257 | horizontal | 5s | jogo de ritmo neon, duas pessoas tocando na tela | pra professores |
| IMG_9260 | horizontal | 22s | caça-palavras/cruzadinha musical | pra professores |
| IMG_9268 | vertical, som real de baqueta | 23s | aluno lê a partitura no tablet e toca no pad (0-10s e 15-18s são os melhores) | prova: da tela pro instrumento |
| IMG_9269 | vertical | 16s | aluno de camisa amarela jogando; perfil do rosto aparece a partir de 10s | "parece só joguinho" |

Crianças aparecem em 9246, 9248, 9249, 9268 e 9269: **confirmar autorização dos pais antes de postar**.

## Como montar um reel
```
python3 marketing/reels/build.py marketing/reels/specs/NOME.json PASTA_DOS_BRUTOS PASTA_DE_SAIDA
```
- `specs/*.json`: um arquivo por vídeo (trechos, frases, cartão final). Linha que começa com `*` sai em amarelo.
- `overlays.js`: desenha as frases e o cartão final (fontes Anton e Hanken Grotesk do app, cores da marca, Paul no final).
- `beat.py`: batida de bateria original a 120 bpm (sem direito autoral). Durações em múltiplos de 0,5s caem no tempo.
- `audio: "raw"` usa o som da gravação. Como não dá pra ouvir daqui, a Bea precisa escutar antes de postar.
- Precisa de ffmpeg, node com playwright e python com numpy.

## Reels já feitos
| arquivo | público | ideia |
|---|---|---|
| 01_pais_v2, 02_professores_v2, 03_passe_anual_v2 | pais / profs / geral | versões "anúncio" refeitas a partir dos vídeos com moldura |
| 04_pais_parece_so_joguinho | pais | "parece só joguinho… mas ele tá treinando ritmo, coordenação, escuta" |
| 05_prova_ouve_le_toca | geral | "como meus alunos estudam ritmo: ouvem, leem, tocam" (som real) |
| 06_album_figurinhas | crianças e pais | estuda pra ganhar figurinha |
| 07_prof_3_atividades | professores | 3 atividades prontas pra aula de amanhã |
| 08_loop_tempo_de_tela | pais | 7s em loop, "o tempo de tela que eu deixo" |
| 09_lojinha_imprimir | pais e profs | da tela pro papel, combo robôterista R$ 79,90 |

## O que está funcionando no nicho (pesquisa de ago a nov/2026)
- Bateria: aluno toca e professor reage (377 mil a 1,5 mi de views em contas pequenas); "assim não / assim sim"; número ou figura na tela enquanto toca; estudar sem bateria.
- Crianças e professores: atividade de ritmo com material simples; "parece só brincadeira, mas olha o que desenvolve"; material pra imprimir com link na bio.
- Em comum: câmera parada, som real da sala, uma frase só na tela, gravado em menos de uma hora.
- A Bea avisou: o formato "como tocar X em 1 minuto" (Believer, 2022) é da pandemia e **não funciona mais**. Não propor.

## Diagnóstico de venda (resumo)
- TikTok @beaterista ~294 mil seguidores, mas vídeos recentes com 600 a 1,7 mil views (covers com legenda só de hashtag).
- Instagram @beaterista_ ~32 mil. Perfil novo do Paul no Instagram (pegar o @ com a Bea).
- beaterista.com.br (GoDaddy): curso "Aprenda do Zero" R$ 79,90; falta garantia visível, depoimentos, lista de aulas e vídeo; muitos produtos competindo.
- Regra de toda peça: 1 promessa + 1 chamada ("link na bio" ou palavra pra comentar), hashtags só no fim, um produto por peça.
- Preços e fatos pra usar: passe anual R$ 49,90 (pagamento único, 12 meses), mais de 15 jogos e estudos, mais de 100 figurinhas, combo Robôterista R$ 79,90 (4 PDFs), jogar grátis em jogos.beaterista.com.br. Nunca inventar depoimento, número ou escassez.
