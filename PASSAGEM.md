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
- `js/jogos/*` + `js/views/jogos.js`: jogos musicais (Uno Musical [antes última nota], bingo, jogo da velha, quebra-cabeça, cara a cara, stop). **Outra sessão trabalha nestes**; evite sobrescrever.
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

## Jogos em 2 celulares (nov/2026)
- Uno Musical, jogo da velha e stop têm modo **2 celulares (código)**: `js/jogos/online.js` + `supabase/006_salas.sql` (tabela `salas`, funções `sala_criar/entrar/ler/enviar`, sondagem a cada 1,2 s). **O SQL precisa estar aplicado no Supabase** (colar no SQL Editor se a aprovação do chat expirar). Teste: `tests/e2e/salas.mjs` (Supabase simulado).
- Dominó removido. Bingo só linha/coluna/cheia. Memória: 1 ou 2 jogadores, "acerta joga de novo" sim/não.
- Modo leve: `html.lite` (Android/outros, ver `js/theme-boot.js` e fim de `css/jogos.css`): sem barra de rolagem falsa, sem desfoque/animação de fundo.

## Jogos de ritmo (nov/2026)
- Só dois jogos: **Beat Hero** (engine `beat`, sempre modo ritmo: batidas e percussão do MIDI) e **Piano Hero** (engine `tiles`: melodia de qualquer faixa, voz/guitarra/teclado). Setinhas e Figuras rítmicas saíram do menu (o código continua no pacote). Menu compacto: ritmo+andamento, ajustes e cores abrem pela setinha (`rzAcc`), botão JOGAR grande. Escolhas (jogo, andamento, estilo, dificuldade, teclas, duração) ficam salvas.
- Aba da professora agora se chama **Músicas MIDI**. Músicas prontas: 3 por estilo (devagar/médio/rápido, ex.: rock 100/120/140 bpm), em botões grandes; o estilo é uma grade 3×2.
- Nenhuma linha tem semicolcheia seguida (mínimo uma colcheia): melodia tenta a linha vizinha, bateria sai da pista mas segue soando no fundo (`rzNoFast`). Começo: compassos vazios no início da música são pulados (`rzLeadTrim`).
- Duração: só **1 min** ou **2 min**. 2 min (e música com 1:40+) = XP em dobro e ★ que valem pras figurinhas (`ritmo.sticker.stars` no armazenamento do pacote; `OPTS.onStars` pra ligar nas figurinhas quando vier o prompt). Teste: `tests/e2e/ritmo-pista.mjs`.

- Ritmo, mais: pausa → **Continuar** conta 4 tempos no bpm da música (notas paradas na tela) e volta de onde parou; música tocada ganha **barrinha verde** (melhor precisão) nos cartões e na lista; **fade out** nos últimos ~2 s; **modo especial**: de vez em quando cai uma nota-estrela (≥12 s entre elas, `rzStars`), acertou = pontos ×2 por 3 compassos, moldura dourada pulsando no tempo + faíscas (`rzSpecialFx`). Teste: `tests/e2e/ritmo-especial.mjs`.

- Teste em aparelhos: `tests/e2e/aparelhos.mjs` (iPhone 13/SE, iPad, iPad Pro, Galaxy S9+/S8/Tab S4, Pixel 5; emulação do Chromium, não são aparelhos de verdade). O botão JOGAR do ritmo fica colado acima da barra de baixo (sticky).

## STOP musical (nov/2026)
- `js/jogos/stop.js` (tela), `stop-logic.js` (regras), `stop-valid.js` (normalização, artigos, reconhecimento, sugestão de grafia), `stop-bank-teoria.js` e `stop-bank-cultura.js` (banco das 12 categorias, escrito de memória: revisar/expandir; linhas "Nome|apelido|apelido"), `stop-sfx.js` (sons sintetizados), `css/jogos.css` (bloco `st-`).
- Respostas aprovadas na revisão entram num banco local (`beaterista-stop-custom`, só neste aparelho). Histórico/recordes em `beaterista-jogos` → games.stop.
- Modos: individual, dupla (turnos), sala de aula (2 a 12, tempo/rodadas livres), 2 celulares (turnos; ver salas). **Não existe** partida simultânea online, cronômetro sincronizado, painel do professor remoto nem reconexão: precisam de hora do servidor e escrita por jogador (hoje a sala guarda o estado inteiro).
- Pendente = amarelo pedido, mas na área dos alunos o papel já é amarelo, então o pendente usa âmbar queimado com listras. A decisão antiga "sem amarelo" continua valendo pro resto.
- Testes: `node --test tests/*.test.mjs`, e2e `tests/e2e/stop.mjs` e `salas.mjs`.

## Pendências (a Bea leva pra o chat novo)
1. **Publicar a área dos alunos** (ainda não publicada nesta rodada: ela quer entender antes). Isso leva o Paul embaixo, as cores novas, jogos sem amarelo, "Onde mora na pauta?" com desenho e a aba "Músicas MIDI". Passos em "Publicar a área dos alunos" acima. Explicar pra ela em linguagem simples o que muda.
2. **MIDIs pros alunos**: testar com 1 ou 2 músicas marcadas (✓ em Jogos de ritmo → músicas importadas) antes de marcar as 355. Nunca testado com o Supabase de verdade.
3. **Quebra-cabeça**: 5 imagens novas do Paul (tocando outros instrumentos/cenários), 1536×1024. O jogo já aceita várias (`IMAGES` em `js/jogos/quebra.js` + `sw.js`); falta ela mandar as imagens (ou decidir um botão de subir imagem dentro do app: só ficaria no aparelho dela, não chegaria nos alunos).
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

## Álbum de figurinhas (nov/2026)
- Álbum dos Kids (`js/kids/album.js`, `album-data.js`, tela `#/kids/album`): figurinha vem de estrela nova nas fases (`Album.grant`) **e agora também dos jogos de ritmo**: músicas longas (2 min) dão ★ e a cada 5 ★ vem 1 figurinha (`Album.grantByStars`, ligado em `onStars` de `js/views/jogos-ritmo.js`; guarda `ritmoStars`/`ritmoPaid` no progresso do jogador ativo). Aparece folha "figurinha nova!" ou aviso "faltam N ★". Teste: `tests/album-ritmo.test.mjs`. Cache v242.
- Ainda **não** dão figurinha: Toca Aqui (leitura), jogos de cartas/tabuleiro. Ideia: ligar também.
- **Save game do álbum** (`js/kids/savegame-logic.js`, botão "💾 salvar / recuperar meu álbum" em `#/kids/album`): código `BEA1-…` (figurinhas, estrelas por fase, contadores do ritmo; comprimido + checagem) pra copiar/compartilhar/baixar e colar em outro celular. Restaurar **junta** (nunca apaga). Sem servidor. Testes: `tests/savegame.test.mjs`, `tests/e2e/savegame.mjs`. Cache v243. 
- **Código BEA-0000** (`js/kids/album-cloud.js` + `supabase/007_album_codigos.sql`, **o SQL precisa estar aplicado no Supabase**): a criança toca "gerar meu código", o servidor cria um `BEA-NNNN` livre; depois o álbum salva sozinho (4 s depois de ganhar figurinha/estrela, `Cloud.soon` em `Album.grant`). Em outro celular: digita o código, o app mostra "é o álbum de Fulana? N figurinhas" e junta. O servidor **só junta** (união das figurinhas, maior estrela), então errar número não destrói álbum alheio, mas quem acertar um código consegue ver nome e figurinhas (só 10 mil códigos, sem login: aceitável pra crianças, não pra dado sensível). O código longo `BEA1-…` continua como reserva sem internet. Ao gerar, pergunta se usa o nome da entrada ou outro (`nomeAlbum`). Cache v245. SQL 007 aplicado no Supabase (nov/2026); sobrou a linha de teste BEA-1192 (nome "teste-claude") pra apagar. Testado o SQL num Postgres local e a tela com Supabase simulado (`tests/e2e/savegame.mjs`).

## Acesso dos alunos: grátis x liberado (nov/2026)
- `js/acesso.js`: na área dos alunos (`aluno-on`) só entra Jogos, Tocar e Ranking; com código **liberado pela Bea** abre tudo (Beat Lab, Beat Hero/Piano Hero em `#/ritmo`, jogos das dicas, modo aula/professor do STOP e do bingo). O que é travado aparece com 🔒 e abre a folha "tenho um código". Trava só no app (flag no aparelho `beaterista-aluno-liberado`): serve pra organizar, **não é proteção de conteúdo pago** (isso exige checagem no servidor).
- Servidor: `supabase/008_acesso_liberado.sql` (aplicado): coluna `liberado` em `album_codigos`, `acesso_ler` (qualquer um), `acesso_liberar` e `acesso_listar` (só a Bea, `is_allowed()`).
- App da Bea: menu → aulas → **Códigos liberados** (`js/views/liberados.js`, `#/liberados`): digita o BEA-0000 do aluno e libera/tira.
- Entrada dos alunos: botão "já tenho meu código BEA" (`askCode` em `js/aluno.js`) traz nome + álbum e confere a liberação. Quem entra só pelo nome continua grátis.
- "Explorar a bateria" saiu da lista de Jogos (a rota `#/kids/explorar` continua; o equivalente está em Tocar). Quiz, caça-palavras e cruzadinha viraram **um jogo só** ("jogos das dicas", `dicas.embedded`, em `#/jogos/dicas`). **Atenção:** os textos das 30 dicas são registros privados da Bea (`tip`), que não existem na área dos alunos; lá o jogo mostra "as dicas ainda não chegaram" até as dicas serem publicadas pra eles (ex.: tabela pública como `midis_publicos`).
- Testes: `tests/e2e/acesso.mjs`. Cache v246.

## Ícones dos jogos (nov/2026)
- A Bea **gosta do estilo rabisco colorido** dos webp (cartas, bingo, velha, stop, quebra-cabeça, cara a cara) e quer tudo nele. Os que faltavam foram **montados por colagem, SEM o Paul (a Bea não quer o Paul nos ícones)** com peças de `assets/paul/el/*`, `assets/rabiscos/*` e `assets/jogos/instrumentos/*`: `dicas`, `ritmo`, `figuras`, `pauta`, `cara`, `dicas` em `assets/jogos/icones/*.webp` (os .svg antigos ficam no repositório, ainda usados em Kids/relatório da Bea). Se ela gerar ilustrações novas na mesma IA dos originais, é só trocar os arquivos (256×~300 px, fundo transparente). `paul.webp` e `rabiscos.webp` são decoração, não são de jogo. "Fases e estrelas" usa o `rabiscos.webp` (estrelas rabiscadas que a Bea escolheu). Os 6 originais (cartas, bingo, velha, stop, quebra-cabeca, cara-a-cara) NÃO podem ser trocados. Toca Aqui usa o `paul.webp` (Paul com as baquetas, escolha da Bea; ele só vale como ícone desse jogo). Jogo da memória usa o ícone antigo do cara a cara (`cara-a-cara.webp`, escolha da Bea); o cara a cara ganhou ícone novo (`cara.webp`, tabuleiro de instrumentos). Cache v251.
