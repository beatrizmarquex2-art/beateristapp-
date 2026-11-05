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
  - `midis_publicos` + função `midis_publicos_lista()` (005): MIDIs que a Bea marca ✓ pros alunos. Marcar/desmarcar fica em **Jogos de ritmo → músicas importadas** (app da Bea); o app copia o arquivo pra tabela (`js/midis-publicos.js`) e reenvia sozinho se renomear, mover de pasta ou cortar. O aluno vê na aba **"Músicas MIDI"** (ritmo). Só vale depois de publicar a área dos alunos de novo.
- O Supabase costuma pedir aprovação no chat e expira em 1 minuto; se falhar, a Bea cola o SQL no SQL Editor.

## Mapa do código
- `js/aluno.js`: entrada (nome + origem), abas Ritmo / Beat Lab / Tocar / Jogos / Ranking, rodapé com redes e parceiros.
- `js/paul-talk.js`: clique no Paul faz barulhinho; nuvens de pensamento (frases e links, incluindo o link do Google).
- `assets/rhythm-games/rhythm-games.js` + `js/views/jogos-ritmo.js`: jogos de ritmo (um jogo unificado Ritmo/Melodia com 3-5 teclas, Piano Tiles, Setinhas, Figuras). Na área dos alunos entram as músicas prontas (`builtin: true`); no app da Bea, só os MIDIs importados.
- `js/jogos/*` + `js/views/jogos.js`: jogos musicais (Uno Musical [reformulado em nov/2026, ver seção abaixo], bingo, jogo da velha, quebra-cabeça, cara a cara, stop). **Outra sessão trabalha nestes**; evite sobrescrever.
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
- Pendente (antigo): jogos novos da outra sessão ligarem na aba Jogos dos alunos. Os 7 Pauls cortados já foram removidos (se vierem imagens novas inteiras, voltam).

## Uno Musical reformulado (nov/2026)
- Arquivos: `js/jogos/cartas.js` (tela, animações), `cartas-logic.js` (regras puras), `cartas-simbolos.js` (10 figuras + ícones das especiais em SVG), `cartas-sfx.js` (sons), bloco `cx-` no fim de `css/jogos.css`.
- Baralho de 112 cartas: 4 cores (vermelho, amarelo, azul, verde) × (10 figuras × 2 + pular/inverter/+2 × 2) + 4 curingas + 4 curingas +4. As figuras são só **categorias** (cor ou figura): semínima, colcheia, semicolcheia, fusa, as 4 pausas, acento (>), nota fantasma.
- 2 a 4 jogadores com sentido de jogo (inverter com 2 vale como pular). Contra o computador: 1 a 3 adversários (paul, lia, teo). Modos: contra o computador, dois no aparelho, 2 celulares (código, mesmas salas de antes; o estado agora é `v: 2`, partidas salvas do formato antigo são descartadas).
- Regras decididas: +4 só sem a cor da mesa na mão; botão UNO (contra o computador esquecer custa 2 cartas; nos outros modos o botão não tem penalidade); compra só se não tiver carta que sirva; não empilha +2.
- Sons: só ruído filtrado (papel, estalo, baralho, "uóip", UNO, vitória), **nenhuma nota**. Botão de som próprio na mesa (junto do botão global da moldura). `S.stopAll()` ao sair.
- Ajuda de nomes: segurar a carta (ou mouse parado) mostra o nome sem jogar; botão "?" mostra o nome da carta da mesa.
- Animações só com transform/opacity (WAAPI com `translate/scale/rotate`); travadas durante a animação (`busy`) pra não duplicar jogada. Respeita "reduzir movimento".
- Testes: `node --test tests/cartas-logic.test.mjs`, e2e `tests/e2e/cartas.mjs` (partida completa, UNO, +2, +4, jogada inválida), `cartas-aparelhos.mjs` (iPhone/iPad/Android emulados), `salas.mjs`, `jogos-som.mjs`.
- Limite conhecido: sem Safari/iPhone de verdade aqui; conferir som (botão de silencioso) e toque no aparelho. Em celular deitado pequeno a mesa passa um pouco da altura da tela.
- Publicado: `main` (app da Bea) e área dos alunos (Netlify `beaterista-alunos`, https://jogos.beaterista.com.br) em nov/2026, cache v242.

## Jogos em 2 celulares (nov/2026)
- Uno Musical, jogo da velha e stop têm modo **2 celulares (código)**: `js/jogos/online.js` + `supabase/006_salas.sql` (tabela `salas`, funções `sala_criar/entrar/ler/enviar`, sondagem a cada 1,2 s). **O SQL precisa estar aplicado no Supabase** (colar no SQL Editor se a aprovação do chat expirar). Teste: `tests/e2e/salas.mjs` (Supabase simulado).
- Dominó removido. Bingo v2 (3×3, ver a seção "Bingo Musical v2" abaixo). Memória: 1 ou 2 jogadores, "acerta joga de novo" sim/não.
- Modo leve: `html.lite` (Android/outros, ver `js/theme-boot.js` e fim de `css/jogos.css`): sem barra de rolagem falsa, sem desfoque/animação de fundo.

## Jogos de ritmo (nov/2026)
- Só dois jogos: **Beat Hero** (engine `beat`, sempre modo ritmo: batidas e percussão do MIDI) e **Piano Hero** (engine `tiles`: melodia de qualquer faixa, voz/guitarra/teclado). Setinhas e Figuras rítmicas saíram do menu (o código continua no pacote). Menu compacto: ritmo+andamento, ajustes e cores abrem pela setinha (`rzAcc`), botão JOGAR grande. Escolhas (jogo, andamento, estilo, dificuldade, teclas, duração) ficam salvas.
- Aba da professora agora se chama **Músicas MIDI**. Músicas prontas: 3 por estilo (devagar/médio/rápido, ex.: rock 100/120/140 bpm), em botões grandes; o estilo é uma grade 3×2.
- Nenhuma linha tem semicolcheia seguida (mínimo uma colcheia): melodia tenta a linha vizinha, bateria sai da pista mas segue soando no fundo (`rzNoFast`). Começo: compassos vazios no início da música são pulados (`rzLeadTrim`).
- Duração: só **1 min** ou **2 min**. 2 min (e música com 1:40+) = XP em dobro e ★ que valem pras figurinhas (`ritmo.sticker.stars` no armazenamento do pacote; `OPTS.onStars` pra ligar nas figurinhas quando vier o prompt). Teste: `tests/e2e/ritmo-pista.mjs`.

- Ritmo, mais: pausa → **Continuar** conta 4 tempos no bpm da música (notas paradas na tela) e volta de onde parou; música tocada ganha **barrinha verde** (melhor precisão) nos cartões e na lista; **fade out** nos últimos ~2 s; **modo especial**: de vez em quando cai uma nota-estrela (≥12 s entre elas, `rzStars`), acertou = pontos ×2 por 3 compassos, moldura dourada pulsando no tempo + faíscas (`rzSpecialFx`). Teste: `tests/e2e/ritmo-especial.mjs`.

- Teste em aparelhos: `tests/e2e/aparelhos.mjs` (iPhone 13/SE, iPad, iPad Pro, Galaxy S9+/S8/Tab S4, Pixel 5; emulação do Chromium, não são aparelhos de verdade). O botão JOGAR do ritmo fica colado acima da barra de baixo (sticky).

## Código do aluno (nov/2026)
- **Beat Hero e a aba "Músicas MIDI" só com código** (`js/codigo.js`, `supabase/007_codigos.sql`). Sem código: Piano Hero e músicas prontas abrem normal. `midis_publicos_lista(p_code)` só devolve MIDI com código ativo (a lista pública sem código foi removida). A Bea cria/desativa/apaga códigos no app: Jogos de ritmo → "códigos dos alunos". Desativar tranca na próxima vez que o aluno abre (offline vale 14 dias). Alunos não veem renomear/pasta/cortar. Limite: o navegador do aluno precisa receber o arquivo pra tocar, então quem tem código ainda consegue extrair o MIDI; o código só fecha pra quem não é aluno. Teste: `tests/e2e/midi-alunos.mjs` (precisa de `MID_FILE=caminho.mid`).
- Código vale **1 ano** (`expira_em`, SQL 008 aplicado; botão "+1 ano" no painel) e fica salvo 1 ano no aparelho. Primeira tela do aluno: nome + "escolha uma opção" com **CÓDIGO DE ACESSO** (campo aparece ao escolher; confere no servidor; origem registrada como "aluno beaterista (código de acesso)"). Teste: `tests/e2e/entrada-codigo.mjs`. Código da Bea: BEA0404 (hífen é ignorado).
- SQL 007 aplicado (nov/2026). Menu (Bea e Beaterista) → aulas → **Importar código de aluno** (`#/codigos`, `js/views/codigos.js`): cola "nome ; código" (só nome = gera código aleatório), gera códigos, tabela atualizada com copiar. Código de teste `BEA2026`. Testes: `tests/codigo.test.mjs`, `tests/e2e/codigos.mjs`.

## Acesso do aluno: modo livre x código (nov/2026)
- `js/acesso.js` (regras) + `js/codigo.js` (código/pedido). **Sem código**: jogos livres (explorar, memória, monte seu ritmo, uno, velha, stop, bingo, quebra-cabeça, cara a cara, Piano Hero com músicas prontas), aba Tocar e **Jogos Ensinam** (relatório, antes "relatório" só da Bea). **Com código**: tudo, incluindo Beat Hero + Músicas MIDI, fases e estrelas (modo aventura), Álbum, Ranking, Beat Lab, Dicionário da bateria e Aulas do Paul (`#/kids/figuras/aula`).
- **Gerar meu código**: o aluno gera um código local (`beaterista-aluno-codigo-pendente`), vê "informe a professora Bea", ela cadastra em Importar código de aluno, e o app libera sozinho (confere ao abrir, no botão "já liberou?" e a cada 8 s na tela trancada). Nada vai pro servidor até ela cadastrar.
- Ainda NÃO existem na área do aluno: os jogos das 30 dicas (quiz/caça-palavras/cruzadinha usam os registros privados "tip" da Bea). Testes: `tests/e2e/acesso.mjs`, `entrada-codigo.mjs`.

## Quiz e Letras e pauLta livre (nov/2026)
- **Quiz e Letras** = quiz, caça-palavras e cruzadinha das 30 dicas (`#/dicas/...`, `js/views/dicas.js`). As 30 dicas já estão no Supabase (`dicas_publicas`: n, texto); aluno lê por `dicas_lista(p_code)` (SQL 009, só com código ativo e dentro da validade) via `js/dicas-aluno.js`, que grava como registros "tip" locais. **Trancado sem código**; no app da Bea usa os registros dela como antes. A função `dicas_ler` (outra sessão, usa `album_codigos`) continua lá sem uso.
- **pauLta em modo livre** (aluno sem código): abre todas as fases e joga normal, mas **não conta** pontos, estrelas, títulos, ranking, reforço nem figurinhas (`js/paulta/livre.js`). Com código (ou no app da Bea) conta tudo. Testes: `tests/e2e/paulta-livre.mjs`, `acesso.mjs`.

- **Beat Lab não existe na área do aluno** (nem com código): sem aba, `#/beatlab` volta pra Jogos, e o botão "salvar em meus ritmos" do Tocar some pro aluno. Continua no app da Bea.

## STOP musical (nov/2026)
- `js/jogos/stop.js` (tela), `stop-logic.js` (regras), `stop-valid.js` (normalização, artigos, reconhecimento, sugestão de grafia), `stop-bank-teoria.js` e `stop-bank-cultura.js` (banco das 12 categorias, escrito de memória: revisar/expandir; linhas "Nome|apelido|apelido"), `stop-sfx.js` (sons sintetizados), `css/jogos.css` (bloco `st-`).
- Respostas aprovadas na revisão entram num banco local (`beaterista-stop-custom`, só neste aparelho). Histórico/recordes em `beaterista-jogos` → games.stop.
- Modos: individual, dupla (turnos), sala de aula (2 a 12, tempo/rodadas livres), 2 celulares (turnos; ver salas). **Não existe** partida simultânea online, cronômetro sincronizado, painel do professor remoto nem reconexão: precisam de hora do servidor e escrita por jogador (hoje a sala guarda o estado inteiro).
- Pendente = amarelo pedido, mas na área dos alunos o papel já é amarelo, então o pendente usa âmbar queimado com listras. A decisão antiga "sem amarelo" continua valendo pro resto.
- Testes: `node --test tests/*.test.mjs`, e2e `tests/e2e/stop.mjs` e `salas.mjs`.

## Mapas e Modo Aventura (nov/2026)
**Mapa "Turnê do Vinil"** (vinil + pixel art fofo): discos numerados num caminho luminoso, regiões com cenário, Paul de adesivo ao lado da fase atual, estrelas/cadeados/partículas, sons curtos (botão 🔊 próprio, vale também o mudo geral), `prefers-reduced-motion` respeitado. Abre já na fase atual e, ao voltar de uma fase, centraliza a que foi aberta por último.
- Componente: `js/kids/mapa.js` (`mountProgressionMap`; recebe fases, progresso por funções, tema, `onOpen`), `mapa-logic.js` (puro: estados, regiões, posições), `mapa-art.js` (sprites pixel em SVG), `mapa-sfx.js` (sons, sem notas aleatórias), `css/mapa.css` (cores no topo). Kids com fases (Figuras e Eco, 0 a 10; a Pauta virou o pauLta, com mapa próprio em `js/paulta/mapa.js` que usa o mesmo componente) usam o mapa direto em `levelsScreen` (`js/views/kids.js`); progresso é o de sempre (`setting-kids2`, id `jogo:fase`).
- **Cores**: o mapa e a Aventura usam o **tema da escola** (mostarda e azul-acinzentado, botão claro/escuro: `js/campanha/tema.js` + `css/aventura-tema.css`, variáveis `--avp-*`). As cores por jogo de `js/campanha/themes.js` ficam só como cenário (decoração), a paleta vem do tema.
- **Paul no mapa**: só os arquivos oficiais, num adesivo creme (o desenho tem fundo branco e some em fundo escuro).

**Modo Aventura** (9 jogos, cada um com mapa próprio, missões, estrelas e medalhas; o **Modo Livre** continua igual). Rotas: `#/jogos/<jogo>` escolhe o modo; `/livre` = como sempre; `/aventura` = mapa; `/aventura/<n>` = missão. Kids: `#/kids/memoria` e `#/kids/ritmo` (Monte seu ritmo) idem; ritmo: `#/ritmo/aventura` (botão "Modo Aventura" na tela de ritmo).
- **Acesso do aluno**: o Modo Aventura (rotas `/aventura`) só abre com código de aluno (`js/acesso.js` → `trancado`); sem código só o Modo Livre, e a escolha de modo mostra 🔒. Teste: `tests/e2e/aventura-acesso.mjs`. O harness dos testes (`tests/e2e/harness.mjs`) já cria o aluno COM código; use `launch({ codigo: false })` para testar sem código.
- Motor: `js/campanha/` — `engine.js` (puro: spec, `applyResult`, desbloqueio = ≥1★ na missão anterior, medalhas gerais), `store.js` (`setting-aventura`, por jogador e por jogo; jogador = perfil ativo dos jogos, senão "local"), `run.js` (escolha de modo, mapa, briefing, partida, resultado), `themes.js` (um cenário por jogo), `registry.js` (carrega cada jogo sob demanda; se faltar módulo, abre o livre), `pontuacao.js` (textos "como pontuar": estrela/XP/figurinha), `css/aventura.css`.
- Cada jogo: `js/campanha/jogos/<id>.js` com `spec` (missões com `id` ESTÁVEL, `goal`, `stars`, `params`, `evaluate(result)` puro) e `mount(body, opts)`. O módulo do jogo aceita `opts.mission` (monta pelos params, não lê/grava o livre, chama `onResult` UMA vez no fim real). Concluir exige resultado real; abrir/iniciar nunca conclui.
- Missões e cenários: **Uno** `cartas` (cidade arcade de cartas), **Bingo** `bingo` (salão retrô, 10 missões, cartela e sorteio por semente), **STOP** `stop` (biblioteca musical, 11, metas de pontos; pendente não conta), **Velha** `velha` (arena de duelos, 10; o Paul estratégico não perde, então pedem "não perder"), **Quebra-cabeça** `quebra` (galeria de arte, 11; 10 imagens da Bea (peças se arrastam no mouse e no dedo: no celular arrasta pra cima, ou segura e arrasta; pro lado rola a bandeja; teste `tests/e2e/quebra-arrastar.mjs`): `palco`, `guitarra`, `baixo`, `teclado`, `sax`, `praca`, `terraco`, `estudio`, `parque`, `garagem` (Paul tocando; a imagem gira de missão em missão)), **Cara a Cara** `cara` (cidade dos personagens, 10; guitarra e baixo têm respostas iguais), **Memória** `memoria` (museu dos instrumentos, 11), **Monte seu ritmo** `monte` (fábrica de ritmos, 11, validação por estrutura rítmica), **No Ritmo** `noritmo` (estúdio e palco, 11, nenhuma música bloqueada, XP normal; MIDI importado não entra).
- **Pontuação, de forma simples**: estrelas e figurinha só nas fases do Kids (60/80/100% = 1/2/3★; cada ★ nova = 1 figurinha). XP só no ritmo (4 a 20 por música, dobro com 2 min). **Aventura não dá figurinha** (decisão da Bea pendente). O Livre só guarda recorde/placar (exceto ritmo).
- Texto/leitura: cada tela de aventura é checada por `tests/e2e/aventura-leitura.mjs` (sem texto sobreposto ou cortado em 390 e 320 px). Contraste foi conferido só olhando os prints.
- Testes: `node --test tests/*.test.mjs`; e2e por jogo `tests/e2e/aventura-<jogo>.mjs`, `mapa.mjs` (mapa do Kids). Cuidado: testes que abriam `#/jogos/<jogo>` agora precisam de `/livre`.
- Ao criar um jogo novo com aventura: criar `js/campanha/jogos/<id>.js`, registrar em `registry.js`, tema em `themes.js`, texto em `pontuacao.js`, listar no `sw.js` e subir o `VERSION`.

- **Fotos**: só a Bea adiciona/troca fotos. Na área dos alunos (`html.aluno-on`) `pickImages` (`js/views/mural.js`) nunca abre o seletor e as telas de aluno não têm botão de foto; teste `tests/e2e/aluno-sem-fotos.mjs`. As imagens do Quebra-cabeça entram só por arquivo em `assets/jogos/`.

- **Deploy do Modo Aventura (nov/2026)**: app da Bea = push na `main` (GitHub Pages) e área dos alunos publicada no Netlify `beaterista-alunos` com cache **v268** (deploy id `6aecac65ab731f7b15768021`, `jogos.beaterista.com.br`). Não consegui abrir o site ao vivo daqui (sandbox sem acesso à internet externa), então confira no celular: entrar sem código (só Modo Livre, Aventura com 🔒) e com código (mapa abre).

## Pendências (a Bea leva pra o chat novo)
1. **Publicar a área dos alunos** (ainda não publicada nesta rodada: ela quer entender antes). Isso leva o Paul embaixo, as cores novas, jogos sem amarelo, "Onde mora na pauta?" com desenho e a aba "Músicas MIDI". Passos em "Publicar a área dos alunos" acima. Explicar pra ela em linguagem simples o que muda.
2. **MIDIs pros alunos**: testar com 1 ou 2 músicas marcadas (✓ em Jogos de ritmo → músicas importadas) antes de marcar as 355. Nunca testado com o Supabase de verdade.
3. **Quebra-cabeça**: já tem 10 imagens (palco, guitarra, baixo, teclado, sax, praça à noite, terraço, estúdio, parque e garagem; 1536×1024 em `assets/jogos/`; no `sw.js` ficam em EXTRA, baixam em segundo plano). Se vierem mais, é só acrescentar em `IMAGES` (`js/jogos/quebra.js`), em `sw.js` e na lista `ORDEM` de `js/campanha/jogos/quebra.js`.
4. **Aba Beaterista** (a Bea deixou pra depois): revisar visual como fizemos na Bea.
5. **Ferramentas**: metrônomo com vazio no meio; Juiz de Tempo e Estúdio de Ouvido abrem com o aviso do microfone ocupando a tela toda.
6. **Estudos**: conferir no celular o sorteio de tema e as barras de progresso (não deu pra testar sem a biblioteca). Layout do Estudos no iPhone SE (320px) tem 3 elementos vazando (já existia antes).
7. **Sem internet**: não consegui testar o modo offline no computador; ela confere no celular (avião).
8. Telas da Bea que usam paletas próprias (Bateria de Toque, Groovebox, Piano) ficaram como estavam.

## Toca Aqui e Figuras rítmicas (sessão de ritmo)
- **Toca Aqui** (`js/jogos/toca.js`, aba Jogos): "normal (figuras)" = leitura na pauta (`leitura()` em `js/views/treinos.js`, também na aba Partitura em `#/partitura/leitura`); "com imagens" = palavrinhas (`js/kids/ritmo.js`). Leitura tem modo **caminho** (6 exercícios fixos em `PATH` de `js/reading.js`, abre o próximo com 70%) e **livre** (aleatório), tocar na tela ou no **microfone** (eco rítmico entrou aqui), "tocar direto" / "ouvir e depois tocar", precisão no fim. 1 compasso sempre.
- **Figuras rítmicas** (`#/kids/figuras`): **aulinha do Paul** em `#/kids/figuras/aula` (`js/kids/aula-figuras.js`: pulso, escadinha das 7 figuras, montar o desenho, pausas, tercina e sextina) + jogos com fases (inclui **variações da semicolcheia** em 1 tempo: 9 combinações em `VARIACOES` de `figs.js`, ver o desenho ou ouvir): quanto vale, qual vale mais, nome, desenho, montar o desenho, pausas, tercina/sextina. Dados em `js/kids/figs.js` (semibreve a semifusa), perguntas em `js/kids/quiz.js` (`figureQ`), desenhos em `js/kids/art.js`. Testes em `tests/figuras.test.mjs`.
- **Velha**: 68 perguntas aprovadas em `js/jogos/velha-data.js` (3 níveis), 17 fotos de artistas em `assets/jogos/artistas/` (aparecem só depois da resposta).
- **Deploy dos alunos pendente**: a Bea pediu pra juntar tudo numa atualização maior e gastar menos deploy do Netlify. O site dos alunos está no cache v236; o app da Bea (GitHub Pages) já está atualizado.
- **Toque as figuras** (`js/kids/toque.js`, `#/kids/toque`): jogo com fases em que o app mostra a partitura (semínima, colcheias, semicolcheias, pausas e variações; `toquePattern` em `groove.js`) e a Bea/aluno lê e toca na **tela ou no microfone**, com BPM ajustável, "ouvir antes" e média de ms no fim.
- **Modos do Toca Aqui (normal)**: iniciante (8 exercícios), intermediário (6) e avançado (6) em `TIERS`/`PATH` de `js/reading.js`; cada exercício abre com 70% no anterior (o intermediário só abre depois de terminar o iniciante, de propósito: as crianças ficam mais na primeira parte). No modo livre dá pra escolher o nível direto. O jogo `Toque as figuras` das fases mostra o mesmo rótulo (fases 0–3 iniciante, 4–7 intermediário, 8–10 avançado).
- **Sem mapa ainda** (vieram da main depois do mapa): **Toque as figuras** (`#/kids/toque`, tem fases) e **Toca Aqui** (modos iniciante/intermediário/avançado com trava sequencial). Podem ganhar o mesmo mapa se a Bea quiser.
- **Aventura**: decidir se cada ★ nova dá figurinha; mais imagens pro Quebra-cabeça abrem variedade nas missões (`img` nos `params`); testar em iPhone/Android de verdade (só testado no Chromium emulado).

## pauLta (nov/2026): leitura musical (substitui "Onde mora na pauta?" nos menus e na aba Jogos)
- Nome sempre **pauLta** (L maiúsculo). Rota `#/paulta` (app da Bea e área dos alunos). O jogo antigo continua em `#/kids/pauta` (só não aparece mais nas listas), pra não perder o progresso de ninguém.
- Código em `js/paulta/`: `music.js` (notas/claves, puro), `draw.js` (SVG: pauta de bateria, sol/fá, teclado, bateria com selos), `worlds.js` (4 mundos, 54 fases, perguntas, explicações de erro, reforço), `score.js` (pontos, títulos, desbloqueio, dificuldades), `save.js` (grava no perfil), `run.js` (motor das fases), `view.js` (telas), `lessons.js` (aulinhas), `sfx.js` (sons). CSS em `css/paulta.css`.
- **Mundos**: Bateria 18 fases, Clave de Sol 15, Clave de Fá 15 (progresso independente, escolhe por onde começar) + Duelo das Claves (6 fases, abre com sol e fá concluídos, não exige a bateria). Dois formatos em todos: **nomes** e **imagens** (sem nomes nas figuras); estrelas e acertos são guardados por formato. Fase conta como concluída se passar em qualquer formato (padrão 60%; "sem errar" = 100%; fase 18 da bateria = 80%).
- **Convenção da bateria** (uma só, na legenda `#/paulta/legenda`): bumbo 1º espaço, caixa 3º espaço, surdo 2º espaço, tom 1 4º espaço, tom 2 4ª linha, chimbal X acima da pauta, chimbal aberto X com círculo, chimbal com o pé X abaixo da pauta, prato de condução (ride) X na 5ª linha, prato de ataque (crash) X na linha suplementar. Caixa: fantasma = parênteses, acento = >, aro (cross-stick) = X na caixa. Rimshot só aparece na legenda (não é exercício).
- **Clave de fá usa mapa próprio** (1ª linha = sol2); as fases de fá são as de sol deslocadas 12 notas (mesmas posições na pauta). Oitavas sempre com número (mi4, dó5…).
- **Pontos** (recalculados sempre do melhor desempenho, então repetir não acumula): 10 por acerto (melhor tentativa de cada fase/formato), 50 por fase concluída (1×), 30 por rodada perfeita (1× por fase/formato), 100 por mundo (1×), 200 pelo Duelo (1×).
- **Títulos** (por critério, não por pontos): Aprendiz (começar), Explorador (5 fases), Leitor Musical (1 mundo), Especialista (2 mundos), Mestre (3 mundos + fase 6 do Duelo). Aparecem junto do nome no perfil, no mapa, na tela de conclusão, no Kids (barra do jogador e lista de jogadores) e no topo da área dos alunos. O nome cadastrado não muda.
- **Onde fica salvo**: registro `setting-paulta` (por id do jogador do Kids; sincroniza com a conta no app da Bea, só no aparelho na área dos alunos). Migração do jogo antigo: só **abre** as primeiras fases da bateria (até a 4) conforme as fases do antigo que o aluno passou; não dá estrelas, pontos nem título.
- **Ranking**: "neste aparelho" sempre; o público (`paulta|pontos`) só com **opt-in** (apelido + botão no Perfil; sai quando quiser). A coluna `grade` do Supabase aceita 3 caracteres, então vai um código de 2 dígitos (título + mundos) decodificado em `score.js`.
- **Dificuldades/reforço**: cada erro grava tags (`peca:hh`, `combo:hh+bd`, `fig:colcheia`, `nota:mi4`, `clave`, `oitava`, `sequencia`, `art:…`); `#/paulta/reforco` monta um treino com o que mais errou e cada acerto alivia a lista. Aulinha do Paul abre ao concluir cada mundo (`#/paulta/aula/<mundo>`).
- Testes: `node --test tests/paulta.test.mjs` (54 fases × 2 formatos, claves, pontos sem exploração, títulos, desbloqueio) e `node tests/e2e/paulta.mjs`.
- Para publicar nos alunos: `scripts/build-aluno.sh` + deploy como de costume (cache v248).
## Álbum de figurinhas (branch `figurinhas-album`, só no app da Bea)
- Rota `#/figurinhas` (menu → jogos → Álbum de figurinhas). Código: `js/views/figurinhas.js` (tela), `js/figurinhas/card2.js` (estilo NOVO, padrão: os 8 modelos M1–M8 enviados pela Bea em `assets/figurinhas/modelos2/`; a foto entra inteira na janela, nome no rótulo; gerados por `scripts/build-modelos2.py` a partir de `PAINEL_FONTE.png`) e `js/figurinhas/card.js` (estilo clássico em SVG, C01–E04, `estilo: 'classico'`), `js/figurinhas/ornaments.js` (adesivos desenhados à mão em SVG), `js/figurinhas/album-logic.js` (pacotes, sorteio, colar; idempotente), `css/figurinhas.css`.
- Dados: `assets/figurinhas/catalogo.json` (fonte da verdade: nome, coleção, raridade, modelo) e `assets/figurinhas/fotos/F###.jpeg` (125 originais, mesmos bytes/SHA256 do ZIP). **Não mexer nas fotos nem nas raridades.** Fotos de terceiros: manter privado até checar direitos; por isso **não** entra na área dos alunos (`build-aluno.sh` não copia) e não deve ir pra `main`/Pages público sem decisão da Bea.
- Progresso: registro `figurinhas-album` (store → IndexedDB; sincroniza com a conta como o resto quando há login). Pacotes de presente: `welcome:1` e `daily:AAAA-MM-DD`, cada id entrega/abre uma vez só. Não mexe nas recompensas dos outros jogos.
- PNGs: `node scripts/export-figurinhas.mjs` gera `exports/figurinhas/` (125 PNGs 1080x1425; `--classico` gera 1200x1800 do estilo clássico, 8 modelos vazios, folha dos 8, painel de amostra, catálogo final JSON/CSV). `exports/` está no .gitignore.
- Testes: `node --test tests/figurinhas.test.mjs` e `node tests/e2e/figurinhas.mjs`. (`tests/e2e/layout.mjs` já tinha 1 falha antes: iPhone SE #/estudos.)
- Zoom da foto: `scripts/detect-rostos.py` guarda no catálogo `rostos` (caixas, OpenCV Haar) e `foco` (área de ação); `planoFoto` em `card2.js` amplia a foto pra preencher a janela (recortada pela forma dela) e nunca corta rosto nem o topo quando não há rosto confirmado. Não identifica ninguém, só acha onde há rosto.
- **Álbum na área dos alunos** (aba "Álbum" embaixo, `js/views/album-aluno.js`; livro em `js/figurinhas/livro.js`): trancado por código de aluno. Aceita QUALQUER código que já existe: `alunos_codigos` (o da Bea criado no app, mesmo do Beat Hero) ou `album_codigos` com `liberado` (BEA-0000 do álbum de ritmo). Código da Bea: `BEA-0404` (vale nos dois). SQL: `supabase/011_figurinhas_codigos.sql` (aplicado; tabela fechada `fig_aluno` + `fig_entrar`, `fig_salvar`, `fig_alunos`). O progresso (coladas, pacotes) fica salvo por código no Supabase e vale em qualquer aparelho (`album-logic.js: mergeStates`, só soma, nunca apaga). Relatório pra Bea: app da Bea → menu → aulas → **Álbum dos alunos** (`#/album-alunos`): nome que o aluno escolheu, código, de onde veio (`origem`), acessos, último acesso, coladas/125; criar código novo (usa `Codigo.criar`), tirar/ativar acesso. Aviso honesto: é trava de tela; os arquivos das fotos continuam em endereços públicos de quem souber o caminho. **Publicar a área dos alunos é manual (`scripts/build-aluno.sh` + Netlify) e o álbum só chega lá no próximo deploy; antes, juntar a branch `album-ritmo-figurinhas` (Estudos/código liberado), senão o deploy desfaz o trabalho dela.** Sobrou no Supabase, sem uso: tabelas `album_config`, `fig_progresso`, funções `album_codigo_*` e `fig_relatorio`/`fig_codigo_criar` (de tentativas anteriores; apagar quando der).

## Bingo Musical v2 (nov/2026) — substitui o bingo 4×4 antigo
- **Cartela 3×3** (9 ids distintos, sem casa livre). Vitória por 3 em linha: escolha antes de começar entre *Qualquer linha* (padrão), *Somente horizontal/vertical/diagonal*. Sem fases, sem prêmio, sem figurinhas; não mexe em nenhum outro jogo.
- **5 temas**: Instrumentos, Peças da bateria, Figuras rítmicas, Símbolos musicais (16 itens cada) e Artistas & Bandas (18 alvos por rodada, girando entre os 86 canônicos; foto fixa por rodada; nunca o mesmo alvo duas vezes).
- **Perfis** (ajuda, não fases): Kids (marcação automática, padrão) e Clássico (marca à mão; pode ligar "Automática"). O BINGO! só vale se o trio está sorteado E marcado e obedece à condição.
- **Modos**: Sozinho · **Online por código** (2 aparelhos) · **2 jogadores no mesmo aparelho** (uma cartela por vez, o próximo sorteio só depois dos dois) · **Sala de aula** (sorteador + impressão de 24 cartelas, fichas, marcadores e manual em A4, colorido ou P&B; usa a impressão do navegador/“salvar como PDF”).
- **Paul** anuncia cada sorteio ("Saiu: …!"); voz opcional (síntese do navegador, pt-BR). Sorteio manual (SORTEAR AGORA, com intervalo mínimo contra toque duplo) ou automático (8/12/20 s, pausa/continua, só prossegue sem janela aberta e sem desconexão). Histórico com miniaturas, repetir anúncio, imagem ampliada.
- **Código**: `js/jogos/bingo-logic.js` (regras puras), `bingo-data.js` (GERADO de `assets/bingo/*.json`: temas, 24 cartelas oficiais, 86 artistas), `bingo-img.js` + `bingo-art2.js` (desenhos vetoriais novos; os antigos em `bingo-art.js`; fotos em `assets/jogos/instrumentos` e `assets/figurinhas/fotos`), `bingo.js` (tela), `bingo-print.js`, `bingo-online.js` (cliente). CSS no fim de `css/jogos.css` (`bg-*`).
- **Backend online** (autoridade no servidor): `supabase/009_bingo_salas.sql` (tabelas fechadas `bingo_temas/salas/jogadores` + 9 funções `bingo_*`; sorteio, cartelas, marcação, pausa, vitória e empate são decididos no banco; o cliente só pede). **Precisa estar aplicado no Supabase** (SQL Editor). Código de 6 caracteres sem ambíguos, link de convite `#/jogos/bingo?sala=CODE`, reconexão pelo token salvo no aparelho, sondagem a cada 1,2 s, limpeza de salas com mais de 1 dia. Empate = os dois fecham linha no MESMO sorteio (comparado por índice do sorteio, não pela latência); senão vence o primeiro BINGO confirmado.
- **Imagens**: tudo que existe no repo foi usado; peças/figuras/símbolos novos são ilustrações vetoriais próprias (aproximadas: clave de sol, pausa de semínima, piano, pedais, ukulele e compassos). Nada foi trocado por item errado.
- **Testes**: `node --test tests/bingo-logic.test.mjs tests/bingo-art2.test.mjs tests/bingo-sql.test.mjs` (o SQL roda em PGlite: `mkdir -p /tmp/claude-0/pgtest && cd /tmp/claude-0/pgtest && npm i @electric-sql/pglite`; sem ele os testes de SQL são pulados) e `node tests/e2e/bingo.mjs` (dois aparelhos online contra o SQL real em PGlite, mesmo aparelho, impressão, automático/pausa).
- Para regerar `bingo-data.js` depois de editar os JSON de `assets/bingo/`, refaça a conversão (script usado: lê temas.json, cartelas-24.json, artistas.json e escreve `export const THEMES/CARDS24/ARTISTS`).
- Pendências: testar com dois celulares de verdade (iPhone+iPad); revisar licença das fotos de artistas antes de qualquer distribuição pública (as fotos já estavam publicadas como arquivos no site dos alunos pelo build); voz depende do navegador.
## Alterações de hoje (05/11/2026) — jogos e abas
Cache atual: **v248**. Deploy da área dos alunos continua **manual e pendente** (últimos itens abaixo só estão no GitHub).
- **Beat Hero / Piano Hero / Músicas MIDI**: Beat Hero e Músicas MIDI só com código; Piano Hero e músicas prontas abertos; pausa com contagem, fade out, modo especial, 3 músicas por estilo; aba MIDI sempre aparece pros alunos (com aviso quando vazia).
- **Uno Musical**: reformulado (112 cartas, 10 figuras em SVG, 2 a 4 jogadores, UNO, sons sem notas).
- **STOP musical**: 12 categorias, bancos, validação, modos individual/dupla/sala/2 celulares.
- **Jogo da velha**: 68 perguntas em 3 níveis + 17 fotos de artistas.
- **Bingo** (sem diagonal), **Memória** (1 ou 2 jogadores), **Dominó removido**.
- **Toca Aqui**: versão normal (pauta) e com imagens, microfone, modos iniciante/intermediário/avançado.
- **Figuras rítmicas** e **Toque as figuras**: aulinha do Paul, 7 figuras, variações da semicolcheia, jogo de tocar a partitura.
- **Álbum de figurinhas**: 125 figurinhas, livro com capa/sumário/colagem, aba Álbum dos alunos trancada por código, relatório da Bea.
- **Código de aluno**: CÓDIGO DE ACESSO na primeira tela, vale 1 ano, painel e importação de códigos.

### Ajuste (05/11/2026, cache v249)
- **Todo o ritmo só com código de aluno** (Beat Hero, Piano Hero, músicas prontas e Músicas MIDI): sem código a tela já abre pedindo o código.
- **Toque as figuras saiu** da lista de jogos (é o mesmo que o Toca Aqui). Os arquivos `js/kids/toque.js` e `toquePattern` ficaram no código sem uso.
- Seções do álbum (campo `secao` do catálogo): **Beatlemania** (22, coleção Beatles), **Beaterista** (10), **Comum** (80), **Raras** (13: raridade Rara fora Beatles/Beaterista, inclui as duplas). Abas antigas (Geral, Beatles, Especial) viram Comum, Beatlemania, Raras (`SECAO_ANTIGA`). O campo `colecao` do catálogo não mudou (os PNGs já exportados ainda mostram BEATLES/ESPECIAL no selinho do código).
- **Cara a Cara, tema Artistas** (branch `cara-artistas`): `js/jogos/cara.js` virou um embrulho com 2 temas (instrumentos, o de sempre, e artistas); o tema novo mora em `cara-artistas.js` (tela), `cara-artistas-logic.js` (puro) e `cara-artistas-data.js` (86 artistas do catálogo com `attrs`, 15 perguntas e `FALAS` do Paul). As 125 figurinhas viram cartas (uma foto por artista, sorteada); miniaturas em `assets/figurinhas/mini/*.webp` (360 px) e a original aparece no fim. Cada partida usa 16 artistas com atributos diferentes (sempre tem solução). As respostas foram preenchidas pelo NOME do catálogo e a Bea revisa (`attrs` em `cara-artistas-data.js`). Testes: `tests/cara-artistas.test.mjs` e `tests/e2e/cara-artistas.mjs`. **Atenção**: o tema artistas publica fotos de terceiros na área dos alunos (o briefing das figurinhas pede material privado até checar permissões).
- Baixar pra postar: no detalhe da figurinha (`js/figurinhas/postar.js`): **post (feed, 1080x1350)**, **story (1080x1920)** e **só a cartinha (1080x1425)**, com o rodapé `jogos.beaterista.com.br — beaterista escola de música`. Gera o PNG no aparelho (canvas, nada sobe pra servidor); no celular abre a folha de compartilhar (Web Share), senão baixa. Fundo muda por raridade (Comum creme, Rara vinho, Exclusiva preto/dourado, Beatlemania arco-íris). Teste: `tests/e2e/figurinhas.mjs`.
- **Aventura do Toca Aqui** (branch `aventura-toca-aqui`, criada em cima de `claude/mapa-turne-do-vinil`): `js/campanha/jogos/toca-spec.js` (puro; 20 missões = as mesmas partituras do caminho do modo livre: 8 iniciante, 6 intermediário, 6 avançado; 70/85/95% de precisão = 1/2/3★; andamento sobe), `toca.js` (ligação), `js/views/leitura-missao.js` (a tela da missão: tocar na tela ou no microfone, ouvir antes, resultado por `onResult` uma vez). Tema `toca` ("Escola do Ritmo") em `themes.js`, texto em `pontuacao.js`, registro em `registry.js`. Testes: `tests/campanha-toca.test.mjs` e `tests/e2e/aventura-toca.mjs`; o toca também entra em `aventura-leitura.mjs`. 5 testes de cartas (Uno) já falhavam nessa branch antes (aventura do Uno em andamento), não são do Toca. **Falta**: decidir se a Aventura dá figurinha (hoje não, pendência da Bea) e ligar o "Toque as figuras"/figuras do Kids (já usam o mapa do Kids).
- **Regra da Bea (nov/2026)**: nas telas de Aventura e nos mapas o pixel fica **só nos desenhos** (discos, sprites, mapa); a **escrita nunca é pixel** (difícil de ler). `css/aventura.css` e `css/mapa.css` usam Hanken Grotesk (`--pix` e `--mp-pix` apontam pra ela, sem caixa-alta forçada, tamanhos maiores). Não voltar a usar Silkscreen em texto.
- **Cores da Aventura/mapas (Bea, nov/2026)**: **sem roxo**. Fundo em azul-marinho e petróleo (`--mp-night #0b1a30`, `--mp-deep #12284a`, `--mp-purple` agora é petróleo `#1f6f78`), regiões em tons de azul, petróleo e vinho (`js/campanha/themes.js`). Rosa e amarelo continuam só como destaque (pedido da Bea pro mapa). **Paul**: os 23 arquivos `assets/paul/eNN.webp` + `estudando.webp` agora têm o branco SÓLIDO (olhos, capacete, mãos) e transparência só por fora; os originais transparentes ficam em `assets/originals/paul-transparente/` (não vão pro site dos alunos). Sem adesivo creme no mapa nem na Aventura.
- **Tema da Aventura e dos mapas (cores da escola, nov/2026)**: `css/aventura-tema.css` define os tokens `--avp-*` em dois modos, **escuro** (padrão: azul-acinzentado + mostarda/dourado + branco) e **claro** (azul-cinza claro + branco + mostarda). `html[data-av="escuro"|"claro"]`, escolhido pelo botão ☀/🌙 (`js/campanha/tema.js`, salvo em `beaterista-av-tema`) no cabeçalho do mapa, da missão e da escolha de modo. As faixas do mapa não usam mais cores por jogo (ignora `regions[].c` de `themes.js`); os sprites usam a paleta da escola (`PAL` em `mapa-art.js`). Teste de leitura nos dois: `AV_TEMA=claro node tests/e2e/aventura-leitura.mjs`. **Modo Livre não mudou** (continua com o visual do app: papel mostarda/azul-marinho de cada jogo).
- **Paul sólido em todo lugar (Bea, nov/2026)**: além dos `eNN.webp`, as 7 poses de `assets/aluno/paul*.webp` também têm o branco sólido (originais em `assets/originals/paul-transparente/aluno/`), e o `mix-blend-mode: multiply` dos Pauls virou `normal` (multiply escurecia o branco em fundo escuro). **Nota musical gigante** dos mapas removida (`decor` em `themes.js` e `DECOR` em `mapa-art.js` não usam mais o sprite `note`).

## Cara a Cara Musical (branch `cara-musical`)
- Tema novo dentro do jogo "cara a cara" (alternar em "tema"; missões do Aventura seguem com instrumentos). Código em `js/jogos/cara-musical/` (regras puras, elenco, perguntas, falas do Paul, tela) + `css/cara-musical.css`.
- Elenco: 86 entidades do ELENCO (125 fotos); mesma entidade nunca repete na mesa. Atributos `true/false/null`: null nunca vira resposta e a pergunta some se algum card da mesa for null. Os null estão em `revisar` de cada entidade (revisão manual da Bea).
- Não dá figurinha/pacote/recompensa e não mexe em ranking. Dupla: no mesmo aparelho (tela de passe) OU em 2 celulares por código de sala (usa as funções sala_* já existentes, sem SQL novo). Online: segredo fica só no aparelho, a sala guarda só um selo SHA-256; revelação no fim confere selo e honestidade das respostas. Testes: tests/cara-musical-online.test.mjs e tests/e2e/cara-musical-online.mjs.
- Testes: `node --test tests/cara-musical.test.mjs`, `node tests/e2e/cara-musical.mjs`.

- **Cara a Cara Musical nos alunos:** as fotos do álbum já são liberadas pros alunos (álbum com código), então o tema musical vai junto no build normal (`MUSICAL_LIBERADO = true` em `js/jogos/cara.js`; se a Bea quiser esconder, é só trocar por `false`).
- Pacote final: `beaterista-alunos.zip` (saída do build-aluno.sh, vai pro Netlify jogos.beaterista.com.br) e `beaterista-app-bea.zip` (app completo da Bea, com as fotos). 

## Álbum nos alunos: estrelas e pontuação dão pacotes (deploy-final)
- Álbum dos alunos = o do main (aba **Álbum**, só com código, cartinhas novas, baixar pra postar). Não entrou a aba Estudos nem o álbum de 91 da branch `album-ritmo-figurinhas`.
- **Estrelas dos Kids → pacotes**: cada estrela nova numa fase (`Album.grantPacks` em `js/kids/album.js`, chamado por `engine.js` e `detetive.js`) vira 1 pacote do álbum de 125 (id `kids:<perfil>:<tempo>:<n>`). **★ dos jogos de ritmo → pacotes**: a cada 5 ★ (`grantByStars`, `ritmoPaid` guarda quantos já foram entregues; id `ritmo:<perfil>:<n>`). Os pacotes caem no estado local `figurinhas-album` (`js/figurinhas/rewards.js`) e aparecem na aba Pacotes; ao abrir o álbum com o código, sobem pro Supabase junto com o resto. Não entrega em dobro.
- O jogo Cara a Cara **não** dá pacote nem figurinha.
- Testes: `node --test tests/album-ritmo.test.mjs`, `node tests/e2e/album-pacotes.mjs`. `tests/e2e/mapa.mjs` agora usa o jogo `pecas` (o antigo `pauta` dos Kids foi trocado pelo pauLta no main).
- 4 modelos de post (`postar.js`): **Colagem** (muda de cor por raridade: Comum creme, Rara vinho, Exclusiva preto/dourado, Beatlemania arco-íris), **Palco** (neon), **Retrô** (anos 70), **Limpo**. Escolha + prévia em `js/figurinhas/share-ui.js` (detalhe da figurinha e aba Perfil).
- **Aba Perfil** (área do aluno, `js/views/perfil.js`, 6ª aba): nome + foto do aluno (a foto fica só no aparelho, IndexedDB `perfil-foto`) e "minha figurinha": a criança escolhe um dos 8 modelos, arrasta/dá zoom na foto dentro da janela, o nome vai no rótulo; baixa a cartinha ou post/story nos 4 modelos. Teste: `tests/e2e/perfil.mjs`. `scripts/modelos-fundo-verde.py` gera os 8 modelos com a janela verde (#00FF00) pra usar em editores (Canva). Aviso: nome/foto de criança nunca sobem pro servidor; se um dia for sincronizar, precisa de consentimento dos responsáveis.
- **Criar cartinha** (app da Bea: menu → jogos → Criar cartinha, `#/cartinha`, `js/views/cartinha.js`): sobe qualquer foto, escreve o nome, escolhe um dos 8 modelos e baixa cartinha/post/story nos 5 modelos de post (o 5º, **Épico**, é dourado com raios e brilhos; título padrão "CARTA ÉPICA", editável em "frase do post"). O criador (`js/figurinhas/criador.js`) é o mesmo da aba Perfil dos alunos. A foto fica só no aparelho. Teste: `tests/e2e/cartinha.mjs`.
- Épico agora tem paleta: `tema: 'dourado'` (padrão) ou `'rosa'` (rosa e vermelho), escolhida em Criar cartinha ("cor do post Épico"). Camadas: raios duplos, halo, bokeh, brasas, brilhos, moldura de metal com cantos, ornamento sob o título, sombra no chão, grão de filme. M7 teve a plaquinha do nome limpa (fantasma do texto de exemplo).

- **Deploy dos alunos feito (05/11/2026, cache v264)** a partir da `main` 30db8ef: álbum, código de aluno, ritmo só com código, pauLta com mapa novo e plantinhas, Quiz e Letras. Ficaram de fora: `cara-musical`, `claude/mapa-turne-do-vinil`, `aventura-toca-aqui`. O visual novo (meio pixel) do pauLta é só mockup, não foi aplicado.
- Adesivos do Épico rosa (`assets/figurinhas/adesivos/`: carinha apaixonada, coração e estrela enviados pela Bea, fundo branco removido): colados com borda branca em volta da cartinha quando `tema: 'rosa'` (`adesivo()` em `postar.js`).

- **Bingo antigo (4×4) preservado**: `js/jogos/bingo1.js` + `bingo1-logic.js` só alimentam as missões do Modo Aventura (`js/campanha/jogos/bingo.js`). O Bingo novo (`bingo.js`/`bingo-logic.js`) é o modo livre (`#/jogos/bingo/livre`; convite `?sala=` abre direto o livre).
- **Pendente (nov/2026)**: aplicar `supabase/009_bingo_salas.sql` no Supabase (a aprovação do chat expirou); sem isso o Bingo online mostra aviso de serviço indisponível, e os outros modos funcionam. Publicado: `main` e alunos (cache v266).

## Cara a Cara Musical: perguntas novas e contestar (05/11/2026)
- Perguntas novas: **cantor**, **ainda em atividade**, **mais de 3 integrantes**, **carreira entre 1980 e 1999** (derivada) e, da foto, **mais de uma pessoa** e **instrumento aparecendo** (marcadas olhando as 125 fotos; `js/jogos/cara-musical/dados-extra.js`, null = não dá pra afirmar). Total: 23 perguntas.
- **Contestar**: ⚑ em cada resposta do Paul (durante a rodada e no fim). Anota neste aparelho (`js/jogos/cara-musical/contestar.js`), tira a pergunta daquela carta neste aparelho até a Bea revisar e dá pra copiar a lista no menu ("respostas contestadas"). Não vai pro servidor: a Bea recebe a lista copiada. Teste: `tests/cara-musical-extra.test.mjs`.
- Os dados novos foram escritos de memória (artistas) e olhando as fotos: revisar com as contestações.

- **Banco de imagens no Supabase (nov/2026)**: tabelas fechadas `cara_entidades` (86) e `cara_fotos` (125, com preto e branco / mais de uma pessoa / instrumento, sha256 e coleção). Só metadados; as imagens ficam em `assets/figurinhas/fotos`. SQL: `supabase/012_cara_banco_imagens.sql` (aplicado). Ler pelo MCP do Supabase (`select ... from cara_fotos`).
