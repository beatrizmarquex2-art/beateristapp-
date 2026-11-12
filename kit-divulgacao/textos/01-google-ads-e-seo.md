# Google: anúncios, SEO e Google Meu Negócio

> bê, tudo aqui é rascunho pra você aprovar. coloque o link certo (site/WhatsApp) antes de subir. números e promessas: só use o que o app realmente entrega.

## 0. ordem de prioridade (o que dá retorno mais rápido)
1. **Google Meu Negócio** (grátis, aparece em "aula de bateria perto de mim") — 1 post por semana
2. **Pesquisa (Search)** com poucas palavras certeiras, R$ 15–25/dia pra testar 14 dias
3. **YouTube** (você já tem canal: vídeos + anúncio in-stream curto dos mesmos vídeos)
4. **Display/remarketing** (os banners da pasta `banners/`) só depois, pra quem já visitou o site
5. **SEO** da página de vendas (título, descrição, perguntas frequentes) — trabalho de longo prazo

## 1. Campanha de Pesquisa

### Grupo A — jogos musicais (o diferencial)
Palavras-chave (use **correspondência de frase** `"..."` e **exata** `[...]`):
- "jogos de música para crianças"
- "jogos musicais educativos"
- "jogo para aprender partitura"
- "aprender figuras rítmicas"
- "jogo de ritmo para aprender música"
- "app para aprender bateria"
- "jogos para aprender música online"
- "como aprender a ler partitura"

### Grupo B — bateria
- "aula de bateria online"
- "aula de bateria para crianças"
- "curso de bateria para iniciantes"
- "como aprender bateria"
- "ebook de bateria" / "apostila de bateria pdf" (cuidado: "pdf grátis" atrai quem não compra → negativar "grátis" aqui)

### Grupo C — materiais em PDF
- "apostila de violão para iniciantes"
- "atividades de música para imprimir"
- "jogo da memória musical para imprimir"
- "material de musicalização infantil"

### Palavras negativas (campanha inteira)
`grátis download crack torrent gratuito cifra letra pdf grátis vaga emprego faculdade conservatório instrumento usado comprar bateria loja kit baqueta`

> atenção: "grátis" é negativa nos grupos B/C, mas **a mensagem do anúncio pode dizer "teste grátis"** (aí atrai só quem quer testar o app).

### Anúncio responsivo de pesquisa (RSA) — limites do Google: título ≤ 30, descrição ≤ 90

**Títulos (use 10–15):**
1. Jogos que ensinam música
2. Aprenda bateria jogando
3. Teste grátis no celular
4. Ritmo, partitura e teoria
5. Escola de música Beaterista
6. Jogos musicais p/ crianças
7. Aprenda a ler partitura
8. Criado pela professora Bea
9. Estude música brincando
10. Jogos e estudos com som
11. Sem instalar nada
12. Ebooks de bateria em PDF
13. Bateria Start por R$ 14,90 *(só durante a promoção)*
14. Do pulso à partitura

**Descrições (use 3–4):**
1. Jogos de ritmo, leitura e teoria feitos por uma professora de bateria. Teste grátis.
2. Mais de 15 jogos e estudos com som. Funciona no celular, tablet e computador.
3. Ebooks em PDF pra estudar na tela ou imprimir: bateria, violão e teoria musical.
4. Crianças e adultos aprendem ritmo e partitura brincando. Comece hoje, sem instalar.

**URL final:** a página de vendas (`pagina-de-vendas/index.html` publicada) ou `https://jogos.beaterista.com.br` pra tráfego de teste.
**Caminhos de exibição:** `/jogos-musicais` · `/aula-de-bateria`

### Extensões (ativar todas)
- **Sitelinks:** "Testar grátis" · "Jogos" · "Materiais em PDF" · "Pedir meu código" · "Para pais"
- **Frases de destaque:** `ritmo` · `partitura` · `teoria` · `estrelas e figurinhas` · `sem instalar nada`
- **Snippet estruturado (Tipos):** Beat Hero, Toca Aqui, pauLta, Uno Musical, STOP Musical, Figurix
- **Chamada (WhatsApp):** botão de mensagem

### Orçamento e medição
- 14 dias de teste, lance "maximizar cliques" → depois "maximizar conversões"
- **Conversões a medir:** clique em "testar grátis", clique no WhatsApp, clique em "quero" (Hotmart). Use o Google Tag Manager ou os eventos do GA4.
- Meta realista de aprendizado: observar **CTR acima de 5%** e **custo por clique** antes de aumentar verba.

## 2. Display e remarketing
- Use os arquivos de `banners/` (já nos tamanhos exigidos): 1200×628, 1200×1200, 300×250, 336×280, 728×90, 970×250, 320×100, 320×50, 160×600, 300×600 + logos 1200×1200 e 1200×300.
- Público: **visitantes do site nos últimos 30 dias** (instale a tag do Google Ads) + público de afinidade "pais de crianças em idade escolar / aprendizes de música".
- **Anúncio responsivo de display:** títulos curtos (≤ 30): "Jogos que ensinam música" · "Aprenda bateria jogando"; título longo (≤ 90): "Ritmo, partitura e teoria brincando, criado pela professora Bea. Teste grátis."

## 3. YouTube
- Formatos: **in-stream que pode ser pulado** (os primeiros 5 s têm que prender), **Shorts**.
- Roteiros prontos em `02-redes-youtube-shorts.md`.
- Segmentar por **palavras-chave de pesquisa do YouTube** ("aula de bateria", "como ler partitura", "jogos educativos") e por **canais similares** (outros professores de bateria).

## 4. SEO da página de vendas
- **Title (≤ 60):** `Jogos que ensinam música | Beaterista escola de música`
- **Meta description (≤ 155):** `Jogos de ritmo, leitura de partitura e teoria criados pela professora Bea. Teste grátis no celular, tablet ou computador. Sem instalar nada.`
- **H1 único:** "Jogos que ensinam música" (já está na página).
- Já tem: perguntas frequentes (ajuda a ganhar "resultados em destaque"), imagens com `alt`, carregamento leve.
- **Dados estruturados** (JSON-LD) sugeridos — colar no `<head>` depois de trocar o link:
```html
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"EducationalOrganization","name":"Beaterista escola de música","url":"https://beaterista.com.br","sameAs":["https://www.instagram.com/beaterista_/","https://www.tiktok.com/@beaterista","https://www.youtube.com/@beateristadrummer"]}
</script>
```
- **Backlinks fáceis:** link na bio do Instagram/TikTok/YouTube, descrição de todo vídeo, assinatura de e-mail, grupos de pais.
- **Cuidado:** o `index.html` do app tem `noindex` (de propósito, é área de aluno). A **página de vendas é separada** e deve ficar **indexável** (sem noindex).

## 5. Google Meu Negócio (posts semanais)
Modelos (até 1.500 caracteres, mas curto funciona melhor; use 1 print/post da pasta `posts-feed/`):
1. **Novidade:** "Novo no app da Beaterista: Detetive Note! Você ouve o ritmo e monta com as cartas. Treina escuta e memória rítmica. Teste grátis: jogos.beaterista.com.br"
2. **Oferta:** "Black Friday na escola: ebook Bateria Start de R$ 29,90 por R$ 14,90 (44 páginas pra quem está começando). Link no perfil."
3. **Educativo:** "Dica da Bea: antes de tocar, cante o groove com a boca (tum, tá, tum tum, tá). Se você consegue cantar, a mão aprende mais rápido."
4. **Convite:** "Quer ver como é uma aula na Beaterista? Chama no WhatsApp e agende."
Botões: *Saiba mais* (site), *Ligar/WhatsApp*, *Ver oferta*.
