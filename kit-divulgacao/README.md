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
| `pagina-de-vendas/` | `index.html` pronta (abre no navegador) | publicar como página de vendas |
| `textos/` | Google Ads/SEO, redes e YouTube, WhatsApp | copiar e colar |
| `_fontes/gerar.mjs` | gerador das imagens | trocar texto/cores e gerar de novo |

Pra gerar de novo: na raiz do repo, `NODE_PATH=$(npm root -g) node kit-divulgacao/_fontes/gerar.mjs` (aceita filtro: `... 'banners'`).

## ⚠ antes de publicar (leia)
1. **WhatsApp:** na página de vendas procure `SEUNUMERO` e troque pelo seu número (55 + DDD + número).
2. **Links da Hotmart** na página vieram de `js/loja-config.js`: confira se estão ativos e o preço do **Bateria Start (R$ 14,90, Black Friday)**: ponha data de fim na promoção.
3. **Preço do código/passe:** o Passe Beaterista (R$ 49,90) ainda **não tem link de venda** no app; por isso a página manda pedir o código no WhatsApp. Quando tiver checkout, é só trocar o botão.
4. **Fotos de artistas** (Cara a Cara, Álbum, Memória de bandas, Roleta com fotos): o próprio `PASSAGEM.md` avisa que são fotos de terceiros sem direitos checados. **Não usei essas telas nos posts, banners e página.** Evite anunciar com elas (principalmente anúncio pago).
5. **Depoimentos e crianças:** não inventei nenhum e não tem rosto de aluno. Só publique vídeo/foto de aluno com **autorização escrita dos responsáveis**.
6. **Nome "Léo"** aparece no topo dos prints ("oi, Léo!"): é um aluno de teste. Se preferir sem nome, é só mudar em `_fontes` ou recortar.
7. **Números** (15+ jogos, 62 fases do Figurix, 44 termos no dicionário, 16 acordes, 12 categorias do STOP) vêm do `PASSAGEM.md`/app. Se mudar, ajuste texto e imagens.
8. **Ciência da página:** só frases cautelosas, com referência. Não prometa "nota", "inteligência" ou "resultado garantido": o Google e os pais punem.
9. **Letras (caça-palavras, cruzadinha):** na captura, as dicas não carregaram (sem internet no teste), por isso o print é só do menu.
10. **Descrição de "sem instalar"/offline:** confirme no seu celular antes de prometer.

## ordem sugerida pra esta semana (black friday é 27/nov)
1. Publicar a página de vendas (GitHub Pages, Netlify ou no seu site) e trocar `SEUNUMERO`.
2. Postar 1 post por dia dos `posts-feed/` (Beat Hero → Toca Aqui → Uno → pauLta → Estudos) e subir os stories.
3. Mandar `wa-04` e `wa-05` (Black Friday) nos grupos de pais, com `wa-03` pra quem ainda não conhece.
4. Criar a campanha de Pesquisa do Google com os textos de `textos/01-google-ads-e-seo.md`.
5. Gravar 3 Reels dos roteiros de `textos/02-redes-youtube-shorts.md`.
