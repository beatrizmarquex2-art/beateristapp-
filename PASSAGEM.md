# Passagem de bastão (leia antes de começar uma sessão nova)

Resumo do que existe, onde fica e como publicar. A Bea trabalha **uma ferramenta ou aba por sessão**.

## Estilo de resposta da Bea
- Escreve sem pontuação formal; gosta de resposta prática, objetiva e criativa, em português.
- Pede mudanças visuais pequenas e iterativas ("mais perto", "menos colado"). Mostre o resultado (print) antes de publicar quando der.
- Ela **não precisa de explicação técnica**: diga o que mudou e onde ver.

## Dois produtos, dois lugares
| | App da Bea | Área dos alunos |
|---|---|---|
| Endereço | https://beatrizmarquex2-art.github.io/beateristapp-/ | https://jogos.beaterista.com.br (e `beaterista-alunos.netlify.app`) |
| Entrada | `index.html` + `js/app.js` (com login Supabase) | `aluno.html` + `js/aluno.js` (sem login, só nome) |
| Publica como | merge/push na `main` (GitHub Pages, automático) | **manual**: `scripts/build-aluno.sh` + deploy Netlify (abaixo) |

O que se sobe no GitHub **não** chega sozinho à área dos alunos.

### Publicar a área dos alunos
1. `scripts/build-aluno.sh /caminho/de/saida` (copia só o necessário e troca o `index.html` por `aluno.html`).
2. Deploy no site Netlify **`beaterista-alunos`** (siteId `ccdb0392-7dd3-46f0-82ba-3b1e0ad845ed`) com a ferramenta `deploy-site` do MCP do Netlify; ela devolve um comando `npx @netlify/mcp ...` para rodar dentro da pasta de saída.
3. Sempre subir a versão do cache em `sw.js` (`const VERSION = 'beaterista-vNNN'`) a cada mudança, senão o app instalado mostra a versão antiga.
- O site `beaterista-app` (siteId `9a09521b-...`) já existia; **não mexer**.
- O domínio `beaterista.com.br` (GoDaddy) hospeda o site pessoal da Bea e **não pode sair do ar**. Só existe o subdomínio `jogos.` apontando (CNAME) para `beaterista-alunos.netlify.app`.

## Supabase (projeto `beaterista-app`, id `fnxgjxatremjdxaqmswu`)
- App da Bea: tabela `records` (sincronização) com RLS e lista `app_allowed_emails`.
- Área dos alunos (tudo em `supabase/*.sql`, já aplicado):
  - `ranking_scores` + funções `ranking_top` / `ranking_add` (ranking público, tabela fechada).
  - `aluno_visitas` + função `aluno_visit` (registro de acessos; só a Bea lê, tela **menu → aulas → Acessos dos alunos**).
  - coluna `origem` (aluno beaterista, on-line, tik tok live, youtube/instagram, outro: ...).
  - `midis_publicos` + função `midis_publicos_lista()` (005): MIDIs que a Bea marca ✓ pros alunos. Marcar/desmarcar fica em **Jogos de ritmo → músicas importadas** (app da Bea); o app copia o arquivo pra tabela (`js/midis-publicos.js`) e reenvia sozinho se renomear, mover de pasta ou cortar. O aluno vê na aba **"Da professora"** (ritmo). Só vale depois de publicar a área dos alunos de novo.
- O Supabase costuma pedir aprovação no chat e expira em 1 minuto; se falhar, a Bea cola o SQL no SQL Editor.

## Mapa do código
- `js/aluno.js`: entrada (nome + origem), abas Ritmo / Beat Lab / Tocar / Jogos / Ranking, rodapé com redes e parceiros.
- `js/paul-talk.js`: clique no Paul faz barulhinho; nuvens de pensamento (frases e links, incluindo o link do Google).
- `assets/rhythm-games/rhythm-games.js` + `js/views/jogos-ritmo.js`: jogos de ritmo (um jogo unificado Ritmo/Melodia com 3-5 teclas, Piano Tiles, Setinhas, Figuras). Na área dos alunos entram as músicas prontas (`builtin: true`); no app da Bea, só os MIDIs importados.
- `js/jogos/*` + `js/views/jogos.js`: jogos musicais (dominó, última nota, bingo, jogo da velha, quebra-cabeça, cara a cara, stop). **Outra sessão trabalha nestes**; evite sobrescrever.
- `js/kids/*` + `js/views/kids.js`: jogos de perguntas (fases por estrelas). Na área dos alunos o nome visível é "Jogos"; os endereços internos continuam `#/kids`.
- `js/views/ata.js` (ata de reunião em PDF), `js/views/kids-relatorio.js` (relatório editável), `js/mic-access.js` (microfone único), `js/ranking.js`.
- `css/lote3.css`: estilos dos lotes recentes (entrada do aluno, Paul, iPad).

## Paul (identidade visual)
- Expressões: `assets/paul/eNN.webp` (23 já refeitas inteiras; 7 ainda antigas e cortadas: coroa, apontando, café, notebook, livro, ideia, tchau).
- Poses de corpo na área dos alunos: `assets/aluno/paul-*.webp` (paz, apontando, bateria, skate, violão, selfie), sorteadas a cada abertura.
- Rabiscos recortados: `assets/paul/el/*.webp`. O Paul fica **parado**; os rabiscos em volta é que se mexem.
- Folhas originais enviadas pela Bea: `assets/originals/paul/` (não vão para o site dos alunos).
- Cuidado ao recortar imagens: nunca por grade fixa (cortava orelhas e laterais); usar o contorno do desenho.

## Testes
- `node --test tests/*.test.mjs` (lógica dos jogos) e `NODE_PATH=$(npm root -g) node tests/e2e/ritmo.mjs` (e `kids`, `routes`, `layout`) com o Playwright já instalado.
- Para ver a entrada num tamanho de iPhone: servir a pasta com `python3 -m http.server` e abrir `aluno.html` num viewport de 390×664.

## Mudanças recentes (sessão menu/início)
- Cores: **sem rosa e sem amarelo** em lugar nenhum (vinho, creme, azul-marinho, petróleo). Espaço azul (Beaterista) só liga pela aba do topo.
- Início: curiosidade do dia larga e reta (`js/music-facts.js`, `factPicker` não repete), Paul aparece no cantinho de baixo e some (`paulPop` em `js/views/home.js`, no máx. 1x/10 min), "estudar" com barras de progresso e sorteio, aulas de hoje desligada até atualizar os alunos.
- Menu ☰: abas só texto, 2 recentes. Páginas "juntas" (Criar ritmos/Tempo/Anotar) em blocos coloridos.
- Áudio: `js/audio.js` solta o áudio mudo de fundo ao sair do app (a não ser que tenha som tocando de verdade).
- `js/util.js`: `append/prepend/replaceChildren` ignoram null/undefined/false (antes escreviam "null" na tela).
- Pauls cortados (coroa, apontando, café, notebook, livro, ideia, tchau) foram **removidos** (e01, e07, e15, e22, e24, e29, e30). Não usar esses números.

## Decisões da Bea que valem para tudo
- Nunca "Kids" nos textos visíveis (adultos também jogam). Sem faixa de idade.
- Tudo na entrada dos alunos deve caber numa tela só no iPhone.
- Paul sem animação própria; animar só os elementos em volta.
- Pendente: tirar o corte dos 7 Pauls antigos (precisa das imagens novas); jogos novos da outra sessão ligarem na aba Jogos dos alunos.
