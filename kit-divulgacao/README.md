# Kit de divulgação Beaterista

Tudo feito a partir do app dos alunos (jogos.beaterista.com.br) e do `PASSAGEM.md`. Prints reais, nada inventado.

| pasta | o que tem | pra que serve |
|---|---|---|
| `prints/` | 36 telas reais (iPhone, 780×1688) | página de vendas, vídeos, posts seus |
| `posts-feed/` | 19 posts 1080×1350, um por jogo/estudo | Instagram, Facebook |
| `stories/` | 19 stories 1080×1920 | Stories, Status do WhatsApp, Reels (capa) |
| `whatsapp-pais/` | 6 imagens 1080×1080 | grupos de pais, lista de transmissão |
| `banners/` | site (1920×600) + 10 tamanhos do Google Display + 2 logos | seu site e Google Ads |
| `youtube/` | 4 miniaturas 1280×720 + banner de canal | YouTube |
| `album/` | 4 temas de figurinhas (Paul + Beaterista, rock, pop, coleção) + "faça a sua figurinha", feed e story | divulgar o álbum |
| `black-friday/` | geral + 1 post e 1 story por material (6) | black friday da lojinha |
| `pagina-de-vendas/` | `index.html` pronta (abre no navegador) | publicar como página de vendas |
| `textos/` | Google Ads/SEO, redes e YouTube, WhatsApp, **calendário de posts (md/csv/ics) e guia de agendamento** | copiar e colar |
| `_fontes/gerar.mjs` | gerador das imagens | trocar texto/cores e gerar de novo |

Pra gerar de novo: na raiz do repo, `NODE_PATH=$(npm root -g) node kit-divulgacao/_fontes/gerar.mjs` (aceita filtro: `... 'banners'`).

## ⚠ antes de publicar (leia)
1. **WhatsApp da escola:** (18) 99180-4150 já está na página, nos textos e nas imagens.
2. **Black Friday:** só o Bateria Start tem preço certo (R$ 29,90 → R$ 14,90). Os outros materiais saem como "preço especial de black friday" até você preencher `_fontes/bf-config.json` (de/por de cada um) e rodar o gerador. **A data "27/11 a 30/11" nas artes é suposição minha**: ajuste em `periodo` no mesmo arquivo. O link usado é `jogos.beaterista.com.br/#/lojinha` (troque em `link` quando tiver o da promoção).
3. **Links da Hotmart** na página vieram de `js/loja-config.js`: confira se estão ativos.
4. **Preço do código/passe:** ainda sem link. A página manda pedir o código no WhatsApp. Quando criar o link, troque o botão "pedir meu código".
5. **Álbum com bandas de rock e pop:** você decidiu anunciar, então as artes usam essas cartas. Lembrando o que o seu `PASSAGEM.md` já diz: as fotos de artistas são de terceiros e os direitos não foram checados. Em **anúncio pago** (Google/Instagram) esse é o ponto mais sensível; no orgânico o risco é menor. Para o risco ser mínimo, comece pelo post "Paul + Beaterista" (cartas 100% suas).
6. **Cara a Cara:** as artes usam a versão de **instrumentos** (sem fotos de artistas). Ela não aparece mais no app publicado (hoje o jogo mostra só artistas); capturei trocando a configuração só na captura. Se quiser anunciar, vale reativar essa versão no app.
7. **Memória:** usei o tema "Instrumentos musicais" (cartas desenhadas, sem fotos).
8. **Depoimentos e crianças:** não inventei nenhum e não tem rosto de aluno. Só publique vídeo/foto de aluno com **autorização escrita dos responsáveis**.
9. **"oi, Aluno!"** é o que aparece no topo dos prints.
10. **Internet:** os jogos precisam de internet (não funcionam offline); "sem instalar" vale, porque é um site.
11. **Parceria:** Pad Gorilla, Spark e Nagano aparecem como "em parceria com", com os logos de `assets/parceiros-preto.png`. Confirme com eles se querem aprovar o uso das marcas nos anúncios.
12. **Números** (15+ jogos, 62 fases do Figurix, 44 termos, 16 acordes, 12 categorias do STOP, 131 figurinhas) vêm do `PASSAGEM.md`/app; se mudar, ajuste.
13. **Ciência da página:** frases cautelosas com referência. Não prometa "nota" nem "resultado garantido".
14. **Letras:** o print é só do menu (as dicas dependem do servidor).

## ordem sugerida pra esta semana (black friday é 27/nov)
1. Publicar a página de vendas (GitHub Pages, Netlify ou no seu site).
2. Postar 1 post por dia dos `posts-feed/` (Beat Hero → Toca Aqui → Uno → pauLta → Estudos) e subir os stories.
3. Mandar `wa-04` e `wa-05` (Black Friday) nos grupos de pais, com `wa-03` pra quem ainda não conhece.
4. Criar a campanha de Pesquisa do Google com os textos de `textos/01-google-ads-e-seo.md`.
5. Gravar 3 Reels dos roteiros de `textos/02-redes-youtube-shorts.md`.
