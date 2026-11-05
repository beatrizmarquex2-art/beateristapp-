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
- A Bea **gosta do estilo rabisco colorido** dos webp (cartas, bingo, velha, stop, quebra-cabeça, cara a cara) e quer tudo nele. Os que faltavam foram **montados por colagem, SEM o Paul (a Bea não quer o Paul nos ícones)** com peças de `assets/paul/el/*`, `assets/rabiscos/*` e `assets/jogos/instrumentos/*`: `dicas`, `ritmo`, `figuras`, `pauta`, `cara`, `dicas` em `assets/jogos/icones/*.webp` (os .svg antigos ficam no repositório, ainda usados em Kids/relatório da Bea). Se ela gerar ilustrações novas na mesma IA dos originais, é só trocar os arquivos (256×~300 px, fundo transparente). `paul.webp` e `rabiscos.webp` são decoração, não são de jogo. "Fases e estrelas" usa o `rabiscos.webp` (estrelas rabiscadas que a Bea escolheu). Os 6 originais (cartas, bingo, velha, stop, quebra-cabeca, cara-a-cara) NÃO podem ser trocados. Toca Aqui usa o `paul.webp` (Paul com as baquetas, escolha da Bea; ele só vale como ícone desse jogo). Jogo da memória usa o ícone antigo do cara a cara (`cara-a-cara.webp`, escolha da Bea); o cara a cara ganhou ícone novo (`cara.webp`, tabuleiro de instrumentos). Lâmpada e lupa "bonitinhas" (traço de marcador, hachura) estão nos ícones `dicas` e `cara`. Quiz (`dicas.webp`) = só a lâmpada; cara a cara (`cara.webp`) = só a lupa (escolha da Bea). Cache v253.
- (v254) Jogos dos alunos: "jogos das dicas" virou **"quiz e letras"**; **"fases e estrelas" saiu da lista dos alunos** (continua na lista da Bea) e agora o álbum/fases/estrelas moram na **aba Ranking** (cartão no topo → `#/kids`; a aba Ranking acende em `#/kids` e `#/kids/album`). Entrou o cartão **"toque as figuras"** (`#/kids/toque`, ícone `toque.webp`), que só era alcançável por "fases e estrelas". Ícones novos desenhados de `figuras`, `pauta` (casinha) e `toque`. Auditoria: o resto dos jogos do app da Bea está na lista (Monte seu ritmo e Eco rítmico vivem dentro do Toca Aqui; Explorar a bateria está em Tocar; Relatório é só da Bea).

## Aba Estudos dos alunos (nov/2026, cache v256)
- Barra de baixo: **Jogos · Estudos · (Beat Lab só liberado) · Tocar · Ranking**. `estudosView` em `js/aluno.js`: **Jogos Ensinam** (o relatório, ÚNICO aberto sem código, pros pais), **Aulinha do Paul** (🔒, só o cartão da Estudos; o botão dentro do jogo "figuras rítmicas" continua livre), **Dicionário musical** (🔒, `#/dicionario`), **As 30 dicas** (🔒, `#/estudos/dicas`, `js/views/dicas-lista.js`), **Relatório dos jogos** (aberto, pros pais; `#/jogos/relatorio` agora abre na área dos alunos). Chaves de trava em `js/acesso.js` (`TRAVA`): `dicionario` e `dicas` (a mesma de "quiz e letras").
- As 30 dicas: `supabase/009_dicas_publicas.sql` (**aplicado**): tabela fechada `dicas_publicas` (cópia das 30 do Plano de Estudo da Bea) + `dicas_ler(código)`, que só devolve com código **liberado** (trava no servidor; `Acesso.carregarDicas` guarda no aparelho como registros `tip`, e o quiz/letras passam a funcionar). **Se editar as dicas no app da Bea, rodar de novo o `insert ... on conflict` do 009** (ainda não sincroniza sozinho).
- O dicionário é dado estático do app: a trava dele é só do app (como as outras). Testes: `tests/e2e/acesso.mjs` (22 verificações).
- (v260) **Ordem dos Jogos pedida pela Bea** (3 por fileira nos alunos): Beat Hero 🔒 | Toca Aqui | Figuras Rítmicas / Memória Musical | Uno Musical | Jogo da Velha / Quebra Cabeça | Cara a Cara | Quiz e Letras 🔒. Depois, os que ficaram fora dessa grade (a Bea ainda decide se ficam): Bingo, STOP, Onde Mora na Pauta?, Toque as Figuras. A ordem mora em `SECTIONS` de `js/views/jogos.js` (a ordem que a Bea muda no botão "editar" vale só no aparelho dela). "Toque as Figuras" é parecido com o modo de leitura do Toca Aqui: provável candidato a sair.

## Álbum de figurinhas (branch `figurinhas-album`, só no app da Bea)
- Rota `#/figurinhas` (menu → jogos → Álbum de figurinhas). Código: `js/views/figurinhas.js` (tela), `js/figurinhas/card2.js` (estilo NOVO, padrão: os 8 modelos M1–M8 enviados pela Bea em `assets/figurinhas/modelos2/`; a foto entra inteira na janela, nome no rótulo; gerados por `scripts/build-modelos2.py` a partir de `PAINEL_FONTE.png`) e `js/figurinhas/card.js` (estilo clássico em SVG, C01–E04, `estilo: 'classico'`), `js/figurinhas/ornaments.js` (adesivos desenhados à mão em SVG), `js/figurinhas/album-logic.js` (pacotes, sorteio, colar; idempotente), `css/figurinhas.css`.
- Dados: `assets/figurinhas/catalogo.json` (fonte da verdade: nome, coleção, raridade, modelo) e `assets/figurinhas/fotos/F###.jpeg` (125 originais, mesmos bytes/SHA256 do ZIP). **Não mexer nas fotos nem nas raridades.** Fotos de terceiros: manter privado até checar direitos; por isso **não** entra na área dos alunos (`build-aluno.sh` não copia) e não deve ir pra `main`/Pages público sem decisão da Bea.
- Progresso: registro `figurinhas-album` (store → IndexedDB; sincroniza com a conta como o resto quando há login). Pacotes de presente: `welcome:1` e `daily:AAAA-MM-DD`, cada id entrega/abre uma vez só. Não mexe nas recompensas dos outros jogos.
- PNGs: `node scripts/export-figurinhas.mjs` gera `exports/figurinhas/` (125 PNGs 1080x1425; `--classico` gera 1200x1800 do estilo clássico, 8 modelos vazios, folha dos 8, painel de amostra, catálogo final JSON/CSV). `exports/` está no .gitignore.
- Testes: `node --test tests/figurinhas.test.mjs` e `node tests/e2e/figurinhas.mjs`. (`tests/e2e/layout.mjs` já tinha 1 falha antes: iPhone SE #/estudos.)
- Zoom da foto: `scripts/detect-rostos.py` guarda no catálogo `rostos` (caixas, OpenCV Haar) e `foco` (área de ação); `planoFoto` em `card2.js` amplia a foto pra preencher a janela (recortada pela forma dela) e nunca corta rosto nem o topo quando não há rosto confirmado. Não identifica ninguém, só acha onde há rosto.
- (v261–262) 4ª fileira dos Jogos: **Onde Mora na Pauta? | Bingo | STOP**; "Toque as Figuras" saiu da lista dos alunos (a Bea ainda vê no app dela; a rota `#/kids/toque` continua). A `main` foi mergeada na branch (cache v262).
- **ATENÇÃO — dois álbuns:** (1) o álbum dos Kids (`js/kids/album.js`, ~30 cartas de bateristas/guitarristas/vocalistas, ganha por estrelas e por ★ do ritmo, código BEA-0000 e save game) e (2) o **novo álbum de 125 figurinhas** da outra sessão (`#/figurinhas`, `js/figurinhas/*`, só no app da Bea, progresso no registro `figurinhas-album`). Eles **não conversam**: o código BEA e o ritmo → figurinha só valem pro (1). A Bea precisa decidir qual álbum os alunos usam (provável: o novo de 125).
- `tests/e2e/midi-alunos.mjs` precisa da variável `MID_FILE` (caminho de um .mid); sem ela dá erro de path, não é falha do app.

## Publicação dos alunos (nov/2026, cache v262)
- **Publicado** no Netlify `beaterista-alunos` (https://jogos.beaterista.com.br), deploy `6aec961d174030c700b1dfd8`, a partir da branch `album-ritmo-figurinhas` (com a `main` mergeada). **Ainda NÃO está na `main`** (o app da Bea no GitHub Pages continua sem essas mudanças até o merge).
- `scripts/build-aluno.sh` agora **remove `assets/figurinhas/fotos`** (125 fotos de terceiros, 27 MB; a Bea ainda não decidiu liberar). Os modelos (`modelos2`) e o `catalogo.json` vão, porque o `sw.js` os pré-carrega (sem eles o service worker falha). O álbum novo de 125 **não está na área dos alunos** (só o dos Kids).
- Como publicar: `scripts/build-aluno.sh <pasta>` → ferramenta `deploy-site` do MCP do Netlify devolve um comando `npx @netlify/mcp ... --site-id ccdb0392-...` → rodar dentro da pasta. Não dá pra abrir o site publicado a partir da sessão (rede bloqueada): conferir pelo `get-project` do Netlify.

## Álbum de 125 figurinhas nos alunos (nov/2026, cache v263)
- A Bea decidiu: **os alunos usam o álbum de 125** e **as fotos podem ser públicas** (artistas famosos). `scripts/build-aluno.sh` agora **leva** `assets/figurinhas/fotos` (27 MB, carregam sob demanda, não entram no pré-cache). `aluno.html` ganhou `css/figurinhas.css` (sem ele o álbum aparecia sem estilo).
- Rota `#/figurinhas` na área dos alunos (aba Ranking; cartão "meu álbum de figurinhas" no topo do Ranking). O álbum antigo dos Kids (`#/kids/album`, ~30 cartas) **redireciona** pro novo; o código antigo (`album-data.js`, `albumScreen`) ficou sem uso.
- **Recompensas viraram pacotes** (`js/figurinhas/rewards.js`, ids únicos, nunca em dobro): cada estrela nova nas fases dos Kids = 1 pacote (`Album.grantPacks`); a cada 5 ★ do ritmo = 1 pacote (`Album.grantByStars`, id `ritmo:<jogador>:<n>`). Mais o pacote de boas-vindas e o do dia (já existiam).
- **Código BEA-0000 guarda o álbum de 125** (campo `f` do save: coladas, repetidas, pacotes entregues e abertos; `figSnap`/`mergeFig` em `savegame-logic.js`). `supabase/010_album_juntar_figurinhas.sql` (**aplicado**): `album_juntar` também junta o `f` (união; maior nº de repetidas) e o limite do save subiu pra 60 KB. A tela de salvar/recuperar saiu de `kids.js` pra `js/kids/save-ui.js` e também aparece dentro do álbum (botão "guardar meu álbum com o código BEA").
- As abas do álbum quebram linha na área dos alunos (a aba "pacotes" ficava escondida pela rolagem lateral).
- Testes: `tests/e2e/album-alunos.mjs` (12), `savegame.mjs`, `acesso.mjs`; unitários em `tests/savegame.test.mjs`.
- **Publicado** (nov/2026): deploy `6aec9834c647f1f37f848487` em jogos.beaterista.com.br (cache v263, com as 125 fotos). Ainda não está na `main` (app da Bea no GitHub Pages).
