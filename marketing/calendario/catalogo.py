# Catálogo das peças prontas (fonte: marketing/prontos/INDICE.md e PLANO_3_DIAS.md).
# Pra entrar peça nova: acrescentar uma linha aqui e rodar `python3 marketing/calendario/agenda.py`.
#
# campos: id, tipo (reel|carrossel|cartaz|post|story), arq (relativo a marketing/prontos), n (slides),
#   titulo, perfil (paul = @jogos.beaterista · bea = @beaterista_ · ambos), pilar, legenda,
#   tiktok (espelhar no TikTok), fim (última data boa), ok_bea (precisa ouvir/conferir antes), obs, drive (id no Drive)

TAGS = {
    "jogos": "#jogosmusicais #aprendermusica #educacaomusical #bateria #musicalizacaoinfantil",
    "pais": "#musicalizacaoinfantil #educacaomusical #aprendermusica #jogosmusicais #maternidade",
    "profs": "#professordemusica #educacaomusical #aulademusica #jogosmusicais #aprendermusica",
    "loja": "#aulademusica #educacaomusical #bateria #musicalizacaoinfantil #aprendermusica",
    "curso": "#bateria #baterista #aulademusica #aprendermusica #cursodebateria",
    "prova": "#bateria #aulademusica #educacaomusical #aprendermusica #baterista",
    "album": "#musicalizacaoinfantil #jogosmusicais #aprendermusica #educacaomusical #bateria",
    "paul": "#robôteristapaul #beaterista #aprendermusica #musicalizacaoinfantil #bateria",
    "quiz": "#bateria #quizmusical #aprendermusica #baterista #aulademusica",
    "apresentacao": "#beaterista #escoladeMusica #araçatuba #aprendermusica #bateria",
}

CONTATO = "fale com a equipe #BeateristaTeam pelo WhatsApp (18) 99180-4150 ou acesse jogos.beaterista.com.br na aba Lojinha"

PECAS = []


def P(**k):
    k.setdefault("perfil", "paul")
    k.setdefault("tiktok", False)
    k.setdefault("n", 1)
    PECAS.append(k)


# ---------- apresentação (artes no Drive, pasta posts) ----------
P(id="ap1", tipo="post", arq=None, drive="1zvQbRFIzzl1DYOorskg1DFolt7HKMuJ9", pilar="apresentacao", perfil="paul",
  titulo="Oi, eu sou o Paul", ordem=0,
  legenda="oi, eu sou o paul 🥁 o robô baterista da beaterista. aqui a gente joga, aprende música e toca de verdade. começa grátis: jogos.beaterista.com.br")
P(id="ap2", tipo="post", arq=None, drive="1UEmY2iwawDIE51HWszn1UTFGlH4brHVZ", pilar="apresentacao", perfil="paul",
  titulo="O que é a Beaterista", ordem=0,
  legenda="a beaterista é uma escola de música em araçatuba, sp. aqui a música acontece na sala de aula e no palco, e agora também na tela: jogos e materiais pra estudar em casa. jogos.beaterista.com.br")
P(id="ap3", tipo="post", arq=None, drive="1LP8NJ5CDUoHlrjnn8en184jJPU8_y4h_", pilar="apresentacao", perfil="bea",
  titulo="Oi, eu sou a Bea", ordem=0,
  legenda="oi, eu sou a bea, professora de bateria e fundadora da beaterista. quando um aluno trava, eu penso: como transformar isso num desafio que ele queira tentar de novo? foi assim que nasceram os jogos.")

# ---------- reels (ordem = prioridade da ordem sugerida do INDICE) ----------
R = [
 ("21","apostila_bateria_start","Apostila Bateria Start pela metade do preço","ambos","curso","a apostila do meu curso de bateria pela metade do preço: R$ 14,90, só até 30 de novembro. 44 páginas pra começar do zero. link na bio.",False,"2026-11-30","tem prazo: só vale até 30/nov. postar nos dois perfis.",1),
 ("23","o_jogo_foi_pra_bateria","O jogo foi pra bateria","paul","jogos","o jogo saiu do sofá e foi pra bateria 🥁 o tablet mostra, o aluno toca. da tela pro instrumento, link na bio.",True,None,"",2),
 ("12","achar_na_pauta","Achar na pauta","paul","jogos","seu filho lendo partitura. e achando que é jogo 🎼 começa grátis, link na bio.",True,None,"",4),
 ("25","jogando_ou_estudando","Jogando ou estudando?","paul","pais","ele tá jogando ou estudando? os dois 🥁 link na bio.",True,None,"usa o som real da sala: a Bea precisa ouvir antes de postar.",6),
 ("04","pais_parece_so_joguinho","Parece só joguinho","paul","pais","parece só joguinho. mas ele tá treinando ritmo, coordenação e escuta, e depois vai pra baqueta. começa grátis, link na bio.",True,None,"",7),
 ("17","beat_hero","Beat Hero","paul","jogos","parece videogame. é aula de ritmo 🥁 cada cor é uma peça da bateria. joga grátis, link na bio.",True,None,"",9),
 ("24","rudimentix_na_caixa","Rudimentix na caixa","paul","jogos","rudimentix: primeiro na tela, depois na caixa. mão esquerda, mão direita, no tempo. joga grátis, link na bio.",True,None,"",11),
 ("19","nao_e_so_bateria","Não é só bateria","paul","jogos","não é só bateria: acordes de violão, guitarra, baixo e teclado, pra ver, ouvir e tocar na tela. link na bio.",True,None,"",12),
 ("14","combo_4_apostilas","Combo das 4 apostilas","paul","loja","4 apostilas pra aprender música brincando: ritmo, harmonia, 48 atividades e jogo da memória. combo por R$ 79,90, link na bio.",False,None,"",14),
 ("26","aperta_o_play","Aperta o play e toca junto","paul","jogos","aperta o play no tablet e toca junto na caixa de verdade. começa grátis, link na bio.",True,None,"usa o som real da sala: a Bea precisa ouvir antes de postar.",15),
 ("05","prova_ouve_le_toca","Ouve, lê, toca","paul","prova","é assim que meus alunos estudam ritmo: ouvem, leem a partitura e tocam de verdade. da tela pro instrumento. link na bio.",True,None,"",16),
 ("11","tour_5_jogos","Tour dos 5 jogos","paul","jogos","5 jogos que ensinam música de verdade. qual você jogaria primeiro? começa grátis, link na bio.",True,None,"",17),
 ("20","roleta_de_figurinhas","Roleta de figurinhas","paul","album","sua foto vira figurinha 🤘 terminou o jogo, gira a roleta e cola no álbum. link na bio.",True,None,"",18),
 ("06","album_figurinhas","Álbum de figurinhas","paul","album","aqui aluno estuda pra ganhar figurinha. terminou o jogo, gira a roleta, e ainda dá pra criar a própria. link na bio.",True,None,"",19),
 ("10","bateria_kids_impresso","Bateria Kids impresso","paul","loja","seu filho já fala em ritmo: pa-to tem 2 sons, bor-bo-le-ta tem 4 🥁 o bateria kids transforma isso em desenho pra colorir e em batida de verdade. 36 páginas pra imprimir, link na bio.",False,None,"",20),
 ("15","memoria_da_tela_pro_papel","Memória: da tela pro papel","paul","loja","jogo da memória musical: na tela e agora na mesa de casa. 8 temas e 61 pares pra imprimir e recortar. link na bio.",False,None,"",21),
 ("18","toca_na_tela","Toca na tela","paul","jogos","sem instrumento em casa? toca na tela: bateria, cordas, teclas e percussão, e ainda tem aula com o paul. link na bio.",True,None,"",22),
 ("13","explorar_a_bateria","Explorar a bateria","paul","jogos","a primeira bateria cabe no tablet: toca na peça e aprende o nome. começa grátis, link na bio.",True,None,"",23),
 ("07","prof_3_atividades","3 atividades pra aula de amanhã","paul","profs","prof, 3 atividades prontas pra sua aula de amanhã: ritmo no tempo certo, caça-palavras musical e ouvir e tocar. testa grátis, link na bio.",False,None,"",24),
 ("02","professores","Prof, e se sua aula fosse assim?","paul","profs","prof, e se o aluno pedisse pra repetir o exercício? jogos de ritmo e leitura pra usar dentro da aula. testa grátis com sua turma, link na bio.",False,None,"",25),
 ("01","pais","Tempo de tela que vira aula","paul","pais","tempo de tela que vira aula de música 🥁 seu filho joga, aprende ritmo e depois vai pro instrumento. dá pra começar grátis hoje, link na bio.",False,None,"",26),
 ("03","passe_anual","Passe anual","paul","loja","mais de 15 jogos e estudos de música por R$ 49,90 no ano inteiro, pagamento único. começa grátis e libera tudo quando quiser, link na bio.",False,"2026-12-31","tem preço R$ 49,90: confirmar com a Bea se segue valendo depois de 31/12 (a planilha de cupons muda o valor em 01/01).",13),
 ("09","lojinha_imprimir","Da tela pro papel","paul","loja","da tela pro papel: apostilas e jogos pra imprimir e tocar em casa. o combo robôterista tá na lojinha, link na bio.",False,None,"",27),
 ("22","material_pra_cada_fase","Material pra cada fase","paul","loja","tem material pra cada fase: pra criança, pra família, pra começar e pra evoluir. tudo na lojinha, link na bio.",False,None,"",28),
 ("08","loop_tempo_de_tela","O tempo de tela que eu deixo","paul","pais","o tempo de tela que eu deixo 🥁 jogos de música, link na bio.",False,None,"",29),
 ("16","beaterista_mood","Beaterista Mood","bea","curso","os exercícios que eu estudo e levo pro palco, em 55 páginas + 20 de bônus. beaterista mood, link na bio.",False,None,"perfil da Bea.",5),
 ("27","jornal_do_paul_13","Jornal do Paul #13","paul","paul","o paul tocou o bumbo com o pé e respondeu na caixa. os dois sons viraram uma conversa 🥁 faz o desafio da semana e me marca.",True,None,"",10),
]
for n, arq, tit, per, pil, leg, tk, fim, obs, ordem in R:
    P(id="r"+n, tipo="reel", arq="reels/%s_%s.mp4" % (n, arq), titulo=tit, perfil=per, pilar=pil, legenda=leg,
      tiktok=tk, fim=fim, obs=obs, ok_bea=(n in ("25", "26")), ordem=ordem)

# ---------- carrosséis (o gibi foi cancelado em 17/nov: fora) ----------
C = [
 ("jogos_ensinam",7,"Jogos ensinam: o que seu filho treina","paul","pais","seu filho joga. olha o que ele treina: coordenação, frações, escuta, atenção e planejamento. arrasta pro lado. link na bio.",None,"",3),
 ("passe_carrossel",7,"O que tem dentro do passe","paul","loja","o que tem dentro do passe beaterista? arrasta pra ver. R$ 49,90 por 12 meses, link na bio.","2026-12-31","tem preço R$ 49,90: confirmar com a Bea se segue valendo depois de 31/12.",8),
 ("depoimentos",8,"Depoimentos dos alunos","bea","prova","o que diz quem já estuda comigo. 6 mensagens, do jeito que chegaram. link na bio.",None,"mensagens reais dos alunos do Bateria Start, copiadas fielmente.",5),
 ("curso_start",6,"O que tem no Bateria Start","bea","curso","o que tem dentro do bateria start: módulos, aulas curtas, bônus e apostila. do zero à sua primeira música por R$ 79,90. link na bio.",None,"",8),
 ("kids_carrossel",6,"Bateria Kids","paul","loja","seu filho já fala em ritmo, só falta escrever. bateria kids, 36 páginas pra imprimir. link na bio.",None,"",10),
 ("quiz_chimbal",3,"Quiz do chimbal","ambos","quiz","qual equipamento abre e fecha os pratos do chimbal? comenta tua resposta 👇",None,"pergunta pra gerar comentário; responder nos comentários no dia seguinte.",13),
]
for arq, n, tit, per, pil, leg, fim, obs, ordem in C:
    P(id="c_" + arq, tipo="carrossel", arq="carrosseis/%s_{i}.jpg" % arq, n=n, titulo=tit, perfil=per, pilar=pil,
      legenda=leg, fim=fim, obs=obs, ordem=ordem)

# ---------- cartazes do Paul (19) ----------
CZ = [
 ("01_bateria","tum tá tum tum tá!","canta o ritmo antes de tocar: a mão aprende mais rápido. bora treinar no app? link na bio"),
 ("02_professor","hoje tem aula com o Paul.","bateria, teclado e violão, passo a passo, com o Paul. a aulinha tá no app. link na bio"),
 ("03_oculos","estudou? então brilha.","cada jogo dá estrela, e estrela vira cartinha pro álbum. joga hoje? link na bio"),
 ("04_cajon","toda caixa vira banda.","cajón: grave no meio, agudo perto da borda. conhece outro instrumento assim? conta aqui"),
 ("05_microfone","solta a voz, o ritmo vem.","cantar o ritmo também é estudar música. experimenta no próximo treino"),
 ("06_estudando","10 minutinhos todo dia.","valem mais que 1 hora só no sábado. marca quem precisa ler isso"),
 ("07_guitarra","aumenta o som. bora tocar!","devagar e certo hoje, rápido amanhã. qual música você quer aprender?"),
 ("08_agua","pausa também é treino.","bebe uma água, respira e volta: o cérebro guarda o que você tocou enquanto descansa"),
 ("09_teclado","tecla por tecla vira música.","dó ré mi fá sol lá si: começa pelas brancas. tem teclado pra tocar no app. link na bio"),
 ("10_meditando","respira fundo. depois toca.","3 respirações antes de começar: corpo calmo segura melhor o tempo. testa hoje"),
 ("11_selfie","grava o seu treino!","grava, assiste e repara no que já melhorou. marca a Bea no seu vídeo"),
 ("12_pandeiro","o ritmo mora no corpo.","bate o pé, bate palma e deixa o pandeiro falar. qual instrumento você toca?"),
 ("13_maestro","um, dois, três e...","contar em voz alta é o jeito mais rápido de não se perder no tempo"),
 ("14_produtor","sua ideia vira música.","dá pra criar seu próprio ritmo no app e mostrar pra todo mundo. link na bio"),
 ("15_gravando","ouve antes de cantar.","quem escuta bem toca e canta melhor. o ouvido também se treina"),
 ("16_dj","solta o beat! a pista é sua.","cada batida no lugar. bora treinar o tempo nos jogos de ritmo? link na bio"),
 ("17_colorindo","música também se pinta.","colorir a bateria ajuda a decorar o nome de cada peça. quem aí gosta de pintar?"),
 ("18_metronomo","devagar e certo. depois rápido.","liga o metrônomo e começa bem devagar. primeiro certo, depois rápido, nunca ao contrário"),
 ("19_treino","o treino do Paul em 8 passos.","ler, ouvir, tocar, escrever, colorir, no tempo, mostrar e ensinar. qual deles você fez hoje? conta aqui"),
]
for k, (a, frase, leg) in enumerate(CZ):
    P(id="z" + a[:2], tipo="cartaz", arq="cartazes-paul/paul-%s.jpg" % a.replace("_", "-"), titulo=frase, perfil="paul", pilar="paul",
      legenda=leg, ordem=k)

# ---------- stories ----------
P(id="s_apostila", tipo="story", arq="stories/story_apostila_prazo.jpg", titulo="Story: apostila só até 30/nov", perfil="ambos",
  pilar="curso", legenda="", fim="2026-11-30", obs="figurinha de link pra apostila na lojinha.")
P(id="s_enquete1", tipo="story", arq="stories/story_enquete_1.jpg", titulo="Story: enquete", perfil="paul", pilar="jogos",
  legenda="", obs='figurinha de enquete: "sim" / "ainda não".')
P(id="s_enquete2", tipo="story", arq="stories/story_enquete_2.jpg", titulo="Story: caixinha de perguntas", perfil="paul", pilar="jogos",
  legenda="", obs="figurinha de caixinha de perguntas. Conferir o texto da arte antes de postar.", ok_bea=True)
P(id="s_passe", tipo="story", arq="stories/story_passe.jpg", titulo="Story: passe", perfil="paul", pilar="loja",
  legenda="", fim="2026-12-31", obs="figurinha de link pro app.")
P(id="s_semana01", tipo="story", arq="stories-semanas/semana_01.jpg", titulo="Story: apresentação do Paul", perfil="paul",
  pilar="apresentacao", legenda="", obs="story de apresentação do Paul.")

# ---------- fora do calendário (e por quê) ----------
EXCLUIDAS = [
 ("reel 28, carrossel e stories do gibi", "a Bea cancelou o gibi em 17/nov."),
 ("stories-semanas 03, 04 e 07", "têm erro de texto no desenho."),
 ("stories-semanas 02, 05, 06 e 08 a 12", "ainda não foram conferidos; entram quando a Bea der o ok."),
 ("kit do livro de colorir (2 posts e 2 stories)", "só depois que o produto tiver link da Hotmart."),
 ("Cards do Robôterista Paul", "estão 'em breve' na Lojinha; o kit de divulgação é gerado fora do repo e só entra quando tiver link de venda."),
 ("fotos de alunos com criança (pasta do Drive 'posts de alunos e escola')", "não publicar o link; só com autorização dos pais."),
]
