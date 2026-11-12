# -*- coding: utf-8 -*-
from mcommon import *
import draw, random

NOTAS7 = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

def build(L):
    # ================= CAPA =================
    def capa(L):
        kb = keyboard('C4', 'B5', marks={}, W=34, H=110, dot_c=False)
        return f'''<section class="page full" style="padding:0">
<div style="position:absolute;inset:8mm;border:4.5px solid #111"></div><div style="position:absolute;inset:11.5mm;border:1.5px solid #111"></div>
<div style="position:absolute;top:30mm;left:0;right:0;text-align:center;font-family:Gochi;font-size:22px">Beaterista Escola de Música apresenta</div>
<div style="position:absolute;top:40mm;left:0;right:0;text-align:center"><div class="m" style="font-size:36px">ROBÔTERISTA ENSINA</div><div class="m" style="font-size:86px;line-height:1;margin-top:4px">MELODIA</div><div class="m" style="font-size:60px;line-height:1">E HARMONIA</div></div>
<div style="position:absolute;top:100mm;left:50mm;right:50mm;height:3px;background:#111"></div>
<div style="position:absolute;top:106mm;left:0;right:0;text-align:center;font-weight:800;font-size:18px">As notas, a pauta e os acordes no teclado e no violão</div>
<div style="position:absolute;top:113mm;left:0;right:0;text-align:center;font-size:14.5px">aprendendo, desenhando, recortando e tocando</div>
<div style="position:absolute;top:122mm;left:0;right:0;text-align:center"><span class="pill" style="font-size:13px;padding:3px 16px">EDIÇÃO COMPLETA · {len(L.pages)} PÁGINAS · DIAGRAMAS DE ACORDES · JOGOS · MÚSICAS</span></div>
<div style="position:absolute;top:134mm;left:0;right:0;display:flex;justify-content:center;align-items:flex-end;gap:22px">
  <div style="transform:rotate(-12deg);margin-top:10px">{chord_svg([0,2,2,0,0,0],[0,2,3,0,0,0],w=118)}<div class="center cf" style="font-size:20px">Em</div></div>
  <div>{paul('musica', 250)}</div>
  <div style="transform:rotate(12deg);margin-top:10px">{chord_svg([-1,3,2,0,1,0],[0,3,2,0,1,0],w=118)}<div class="center cf" style="font-size:20px">C</div></div>
</div>
<div style="position:absolute;top:196mm;left:0;right:0;display:flex;justify-content:center;gap:40px;align-items:flex-end">
  <div style="width:62mm;margin-top:0">{keyboard('C4','B4',marks={60:'',64:'',67:''},W=30,H=100,dot_c=False)}</div>
  <div class="m" style="font-size:44px;line-height:1">♪ ♫ ♪</div>
  <div style="width:70mm">{staff([('C4','sm'),('E4','sm'),('G4','mi')],width=270,gap=11,clef=True,show_final=False)}</div>
</div>
<div style="position:absolute;bottom:23mm;left:0;right:0;text-align:center;font-weight:800;font-size:12.5px">material para imprimir · para crianças e famílias · atividades, jogos e canções</div>
<div style="position:absolute;bottom:17mm;left:0;right:0;text-align:center;font-size:11.5px">beaterista.com.br &nbsp;·&nbsp; TikTok @beaterista &nbsp;·&nbsp; Instagram @beaterista_ &nbsp;·&nbsp; YouTube @beateristadrummer</div>
</section>'''
    L.add('capa', 'capa', capa, 'raw')

    def oi(L):
        c = titulo('Oi, eu sou o Paul!', 'o robô músico da Beaterista', 420)
        c += fala('bem-vindo(a) ao livro de <b>melodia e harmonia</b>! eu vou te mostrar como as notas viram músicas e como os acordes fazem a música ficar bonita.', 'feliz')
        c += '<p>A bateria marca o <b>ritmo</b>. Mas a música também tem <b>melodia</b> (a parte que a gente canta) e <b>harmonia</b> (as notas tocadas juntas, os acordes). Neste livro você vai conhecer o <b>teclado</b> e o <b>violão</b>, ler <b>notas na pauta</b>, descobrir os <b>acordes</b> (com diagramas de cordas e casas e teclas pintadas), tocar <b>melodias</b> e <b>canções</b>, brincar de caça-palavras, cruzadinha, bingo, memória, dominó e trilha, e ganhar um <b>diploma</b>!</p>'
        c += box('<div class="row" style="gap:10px;margin-bottom:12px"><span class="m" style="font-size:15px;width:190px">MEU NOME É:</span><div class="dots" style="flex:1"></div></div><div class="row" style="gap:10px;margin-bottom:12px"><span class="m" style="font-size:15px;width:190px">COMECEI EM:</span><div class="dots" style="flex:1"></div><span class="m" style="font-size:15px;margin-left:12px">MINHA IDADE:</span><div class="dots" style="width:90px"></div></div><div class="row" style="gap:10px"><span class="m" style="font-size:15px;width:190px">MEU PROFESSOR(A):</span><div class="dots" style="flex:1"></div></div>', style='margin:18px 0 18px;padding:18px 20px;border-radius:22px')
        c += '<div class="g" style="font-size:20px;line-height:1.35;max-width:430px;margin:14px 0 0">“Música se aprende com calma, repetição e diversão. Desafinou? Tudo bem! Tente de novo. Eu também errei muitas notas antes de acertar.”</div>'
        c += '<div class="m" style="font-size:15px;margin-top:18px">QUAL INSTRUMENTO EU VOU TOCAR PRIMEIRO?</div>' + '<div class="row" style="gap:30px;margin-top:6px;font-size:15px"><span><span class="ck big"></span> teclado</span><span><span class="ck big"></span> violão</span><span><span class="ck big"></span> os dois!</span></div>'
        c += '<div class="m" style="font-size:15px;margin-top:16px">DESENHE VOCÊ TOCANDO COM O PAUL:</div><div class="box dash" style="height:190px;margin-top:6px"></div>'
        return c + f'<div class="abs" style="right:0;bottom:0">{paul("oculos", 100)}</div>'
    L.add('paul', 'boas-vindas', oi)

    def mapa(L):
        itens = [('★', 'Conheça os instrumentos', 'ritmo, melodia e harmonia, o teclado e o violão', 'm0-tripe', 'm0-ligue'),
                 ('1', 'As notas e o teclado', 'som grave e agudo, as 7 notas, cifras e oitavas', 'm1-som', 'm1-oit'),
                 ('2', 'Tons, semitons e escalas', 'teclas pretas, ♯ e ♭ e a escala de dó maior', 'm2-semi', 'm2-jogos'),
                 ('3', 'A pauta e a clave de sol', 'ler e escrever notas nas linhas e nos espaços', 'm3-pauta', 'm3-teclado'),
                 ('4', 'Melodia: ritmo + notas', 'tocar melodias com a mão direita e criar a sua', 'm4-melodia', 'm4-contorno'),
                 ('5', 'O violão: cordas, casas e tablatura', 'as 6 cordas, as casas e a leitura de tab', 'm5-cordas', 'm5-postura'),
                 ('6', 'Acordes de violão', 'diagramas de cordas e casas: 14 acordes', 'm6-diagrama', 'm6-troca'),
                 ('7', 'Batidas do violão', 'setas ↓ ↑ ligadas ao ritmo da bateria', 'm7-seta', 'm7-cria'),
                 ('8', 'Acordes de teclado', 'maior e menor com as teclas pintadas', 'm8-acorde', 'm8-mao'),
                 ('9', 'Harmonia: tocando músicas', 'família de acordes, sequências e 3 canções do Paul', 'm9-campo', 'm9-juntos'),
                 ('✦', 'Jogos e prova do Paul', 'caça-palavras, cruzadinhas, palavras musicais e prova', 'j-caca1', 'j-prova2'),
                 ('✂', 'Recortes e jogos de mesa', 'cartas, memória, bingo, dominó, trilha e dados', 'r-notas', 'r-dados'),
                 ('♥', 'App, plano, conquistas e diploma', 'QR codes, plano de 12 dias, desafio de 30 dias e diploma', 'f-app', 'f-diploma'),
                 ('✓', 'Gabarito', 'confira com carinho: o erro também ensina', 'gab1', 'gab4')]
        rows = ''
        for n, t, s, a, b in itens:
            pa, pb = L.pg(a), L.pg(b)
            pgs = f'págs. {pa}-{pb}' if pa != pb else f'pág. {pa}'
            rows += (f'<div class="box" style="display:flex;align-items:center;gap:14px;padding:6px 14px;margin-bottom:7px;border-radius:16px">'
                     f'<div style="flex:none;width:36px;height:36px;border:2.5px solid #111;border-radius:50%;text-align:center;line-height:30px;font-family:Marker;font-size:19px">{n}</div>'
                     f'<div style="flex:1"><div style="display:flex;justify-content:space-between"><b style="font-size:14.5px">{t}</b><b style="font-size:12px">{pgs}</b></div><div style="font-size:11.5px;color:#222">{s}</div></div></div>')
        return titulo('O que vamos aprender', 'seu mapa de aventura', 440) + rows + '<div class="row" style="justify-content:space-between;margin-top:8px;gap:20px"><p style="font-size:12.5px;max-width:480px">No fim você ainda encontra o <b>diploma</b>, o <b>gabarito</b> e os <b>QR codes</b> dos jogos no app.</p>' + paul('pensa', 66) + '</div>'
    L.add('mapa', 'o que vamos aprender', mapa)

    def pais(L):
        def q(t, a):
            return f'<div style="margin-bottom:9px"><div class="m" style="font-size:15px;text-transform:uppercase">{t}</div><div style="padding-left:14px;font-size:13px">{a}</div></div>'
        c = titulo('Para pais e professores', 'como aproveitar este material', 500)
        c += q('Quanto tempo?', 'Sessões de <b>10 a 15 minutos</b>, 3 a 4 vezes por semana. Cada aula cabe em 1 ou 2 sessões. O livro traz um <b>plano de 12 dias</b> e um <b>desafio de 30 dias</b>.')
        c += q('Qual a idade?', 'Pensado para crianças de <b>6 a 12 anos</b>, mas serve para qualquer iniciante. Os pequenos podem colorir, traçar e pintar teclas; os maiores leem a pauta e tocam as canções.')
        c += q('Precisa saber música?', 'Não! Tudo está explicado com palavras simples. Dica: toque junto com a criança e use o <b>app</b> (QR codes) para ouvir cada acorde e cada melodia.')
        c += q('Precisa ter um instrumento?', 'O ideal é ter um <b>teclado</b> e/ou um <b>violão</b>. Sem instrumento, o app tem teclado e violão na tela, e o livro tem teclado de papel para treinar com os dedos.')
        c += q('Faz parte de uma coleção', 'Este livro é o par do <b>Robôterista Ensina</b> (ritmo e figuras): lá a criança aprende <b>quanto dura</b> cada som; aqui aprende <b>qual nota</b> tocar. Juntos formam a música completa: ritmo + melodia + harmonia.')
        c += q('A ordem importa?', 'Sim, nas aulas 1 a 4 (teclado e pauta) e nas aulas 5 a 7 (violão). As aulas 8 e 9 juntam tudo. Jogos, recortes e canções podem ser feitos a qualquer momento depois da aula 2.')
        c += q('Como saber se aprendeu?', 'A criança (1) diz as notas e as cifras, (2) lê notas na pauta, (3) monta um acorde no teclado ou no violão e (4) toca uma canção do Paul do começo ao fim. A <b>prova do Paul</b> (págs. ' + f'{L.pg("j-prova1")}-{L.pg("j-prova2")}' + ') ajuda a conferir.')
        c += box('<div class="m" style="font-size:14px;margin-bottom:4px">POR QUE FUNCIONA?</div><div style="font-size:12.3px">Ver a nota, ouvir o som e <b>mexer os dedos</b> ao mesmo tempo (aprendizado multissensorial) fixa melhor na memória. Sessões <b>curtas e frequentes</b> vencem a maratona. E aprender <b>acordes</b> logo no começo faz a criança tocar <b>músicas de verdade</b> em poucas semanas, o que mantém a motivação alta.</div>', style='margin-top:8px')
        c += '<div class="tiny" style="position:absolute;bottom:0;left:0;right:150px">Material didático da Beaterista Escola de Música. Uso pessoal e familiar; não revender nem redistribuir. Você pode imprimir quantas cópias precisar para o seu aluno/filho.</div>'
        return c + f'<div class="abs" style="right:0;bottom:-6px">{paul("musica", 70)}</div>'
    L.add('pais', 'para pais e professores', pais)

    def pais2(L):
        c = titulo('Guia rápido do professor', 'um roteiro de 10 minutos para cada aula', 520)
        rows = [('1', 'as notas e o teclado', 'achar o dó e nomear as 7 notas', '3 min grave e agudo · 4 min achar dós e fás · 3 min nomear teclas', 'confundir os grupos de 2 e de 3 teclas pretas'),
                ('2', 'tons, semitons, escalas', 'sentir a distância entre as notas', '3 min tom e semitom · 4 min escala de dó · 3 min tom ou semitom?', 'esquecer que mi-fá e si-dó não têm tecla preta'),
                ('3', 'pauta e clave de sol', 'ler as notas nas linhas e espaços', '3 min linhas e espaços · 4 min leia e escreva · 3 min ligue com o teclado', 'contar as linhas de cima para baixo'),
                ('4', 'melodia', 'tocar notas em sequência no ritmo', '2 min posição da mão · 5 min mini melodias · 3 min Ode à Alegria', 'olhar para os dedos e perder o pulso'),
                ('5', 'o violão', 'cordas, casas e tablatura', '3 min nomes das cordas · 4 min notas nas casas · 3 min tab', 'inverter a numeração das cordas (a 1ª é a mais fina)'),
                ('6', 'acordes de violão', 'ler diagramas e trocar de acorde', '2 min ler o diagrama · 5 min um acorde novo · 3 min desafio de trocas', 'apertar com a ponta do dedo? deve ser a ponta, bem perto do traste'),
                ('7', 'batidas', 'alternar ↓ ↑ no ritmo', '3 min só ↓ · 4 min ↓↑ com um acorde · 3 min padrão pop', 'mão direita parar: o movimento tem que continuar'),
                ('8', 'acordes de teclado', 'montar tríades (1-3-5)', '3 min “pule uma tecla” · 4 min maior x menor · 3 min pinte o acorde', 'contar teclas pretas como se fossem brancas'),
                ('9', 'harmonia', 'tocar acordes numa canção', '3 min família de acordes · 4 min sequência · 3 min canção do Paul', 'trocar o acorde atrasado: antecipe com o olhar')]
        c += '<table class="tbl" style="width:100%;font-size:11px;line-height:1.28"><tr style="background:#eee"><th style="width:26px">aula</th><th>objetivo</th><th>roteiro de 10 minutos</th><th>cuidado</th></tr>'
        for n, t, o, r, e in rows:
            c += f'<tr><td class="m" style="font-size:15px;text-align:center">{n}</td><td><b>{t}</b><br>{o}</td><td>{r}</td><td>{e}</td></tr>'
        c += '</table>'
        c += box('<div class="m" style="font-size:14px;margin-bottom:4px">COMO AVALIAR EM 4 PASSOS</div><div style="font-size:12.2px"><b>1.</b> Diz as 7 notas e as cifras. <b>2.</b> Lê 5 notas na pauta sem ajuda. <b>3.</b> Monta C, G, Am e F no teclado ou no violão. <b>4.</b> Toca uma canção do Paul inteira. Aí é hora do diploma!</div>', style='margin-top:8px')
        c += box('<div class="m" style="font-size:14px;margin-bottom:4px">DICAS PARA TURMAS</div><div style="font-size:12.2px">Use o <b>bingo</b> e a <b>memória de acordes</b> como aquecimento · faça duplas: um toca a melodia e o outro os acordes · junte com o livro <b>Robôterista Ensina</b>: um aluno toca a levada de bateria enquanto os outros tocam a canção.</div>', style='margin-top:8px')
        return c + corner('oculos', 56)
    L.add('pais2', 'para pais e professores', pais2)

    def como(L):
        selos = [('DESENHE', 'pegue o lápis e faça os desenhos, as notas e os acordes.'), ('PINTE', 'pinte as teclas do teclado ou as bolinhas do acorde.'), ('CIRCULE', 'faça um círculo na resposta certa.'), ('LIGUE', 'una com uma linha o que combina.'),
                 ('RECORTE', 'use tesoura sem ponta (peça ajuda a um adulto) e cole se precisar.'), ('TOQUE', 'no teclado, no violão, no app ou nas teclas de papel.'), ('QR CODE', 'aponte a câmera do celular para ouvir e jogar no app.')]
        c = titulo('Como usar este livro', 'o que cada selinho quer dizer', 440)
        for a, b in selos:
            c += f'<div class="row" style="gap:18px;margin-bottom:9px"><span class="chip" style="flex:none;width:150px">{a}</span><span style="font-size:13.5px">{b}</span></div>'
        c += '<span class="lab">Como ler as imagens</span><div class="col2" style="gap:12px">'
        c += box('<div class="m" style="font-size:13px;margin-bottom:4px">TECLADO</div>' + keyboard('C4', 'G4', marks={60: '1', 64: '3', 67: '5'}, W=28, H=82, names='syl', dot_c=False) + '<div style="font-size:11.5px;margin-top:3px">tecla <b>cinza</b> = tecla para apertar. O número diz a ordem (ou o dedo).</div>')
        c += box('<div class="m" style="font-size:13px;margin-bottom:4px">ACORDE DE VIOLÃO</div><div class="row" style="gap:10px">' + chord_svg([0, 2, 2, 0, 0, 0], [0, 2, 3, 0, 0, 0], w=92) + '<div style="font-size:11.5px"><b>●</b> aperte aqui<br><b>número</b> = qual dedo<br><b>○</b> corda solta<br><b>✕</b> não toque</div></div>')
        c += '</div>'
        regras = ['<b>comece devagar.</b> velocidade é consequência, não ponto de partida.', '<b>cante o nome das notas</b> enquanto toca: ouvido e dedos aprendem juntos.', '<b>10 minutinhos por dia</b> valem mais que 1 hora no domingo.', '<b>errou? volta e repete</b> mais devagar. é assim que se aprende.', '<b>comemore</b> cada página: pinte uma estrela ao terminar!']
        c += '<span class="lab">As 5 regras de ouro do Paul</span>' + ''.join(f'<div class="row" style="gap:12px;margin-bottom:6px"><span class="num" style="flex:none;width:30px;height:30px;border:2.5px solid #111;border-radius:50%;text-align:center;line-height:25px">{i+1}</span><span style="font-size:13px">{t}</span></div>' for i, t in enumerate(regras))
        return c + corner('vibra', 80)
    L.add('como', 'como usar', como)

    # ================= CONHEÇA OS INSTRUMENTOS =================
    def tripe(L):
        c = titulo('Ritmo, melodia e harmonia', 'as 3 pernas da música', 460)
        c += fala('a música é como uma banquinha de 3 pernas: <b>ritmo</b>, <b>melodia</b> e <b>harmonia</b>. se faltar uma, ela cai!', 'oculos')
        cards = [('RITMO', 'quando os sons acontecem', 'a bateria marca o ritmo. você bate palmas no ritmo da música.', '<div style="height:96px;display:flex;align-items:center;justify-content:center">' + rhythm([(0, 16, 'n'), (16, 8, 'n'), (24, 8, 'n'), (32, 16, 'n'), (48, 16, 'n')], beams=[[1, 2]], width=220, total=64, pad=14) + '</div>'),
                 ('MELODIA', 'a música que a gente canta', 'notas diferentes, uma depois da outra: sobem e descem.', '<div style="height:96px;display:flex;align-items:center;justify-content:center">' + staff([('C4', 'sm'), ('E4', 'sm'), ('G4', 'sm'), ('E4', 'sm')], width=230, gap=9, show_final=False) + '</div>'),
                 ('HARMONIA', 'notas tocadas juntas', 'os acordes, que “vestem” a melodia: violão, teclado, piano.', '<div style="height:96px;display:flex;align-items:center;justify-content:center">' + chord_kb('C', W=18, H=60, lo='C4', hi='G4') + '</div>')]
        c += '<div class="col3" style="gap:10px">' + ''.join(f'<div class="box" style="border-radius:18px;padding:10px 10px;text-align:center"><div class="m" style="font-size:17px">{t}</div><div style="font-size:12px;font-weight:800;margin:2px 0 6px">{s}</div>{g}<div style="font-size:11.8px;margin-top:6px">{d}</div></div>' for t, s, d, g in cards) + '</div>'
        c += lab('o que é o que? ligue')
        pares = [('o ritmo da bateria', 'ritmo'), ('cantar “parabéns”', 'melodia'), ('tocar um acorde no violão', 'harmonia'), ('bater palmas no pulso', 'ritmo')]
        esq = [p[0] for p in pares]; dire = ['melodia', 'ritmo', 'harmonia', 'ritmo']
        random.Random(2).shuffle(dire)
        dd = ['harmonia', 'ritmo', 'melodia', 'ritmo']
        for i, (a, _) in enumerate(pares):
            c += f'<div style="display:flex;align-items:center;margin-bottom:8px"><div class="box" style="flex:0 0 46%;padding:6px 14px;border-radius:30px;font-weight:700;font-size:13px">{a}</div><div style="width:14px;height:14px;border-radius:50%;background:#111;margin-left:10px"></div><div style="flex:1"></div><div style="width:14px;height:14px;border-radius:50%;background:#111;margin-right:10px"></div><div class="box" style="flex:0 0 28%;padding:6px 14px;border-radius:30px;font-weight:800;text-align:right">{dd[i]}</div></div>'
        c += box('<b>Pense:</b> numa banda, quem cuida do <b>ritmo</b>? <span class="dots" style="display:inline-block;width:140px;vertical-align:bottom"></span> E da <b>harmonia</b>? <span class="dots" style="display:inline-block;width:140px;vertical-align:bottom"></span>', style='margin-top:10px;font-size:13px')
        L.gab('m0-tripe', 'ritmo, melodia e harmonia (pág. {pg})', 'o ritmo da bateria → ritmo · cantar → melodia · acorde no violão → harmonia · palmas no pulso → ritmo. banda: o ritmo é da bateria (e do baixo); a harmonia é do violão, do teclado e da guitarra.')
        return c + corner('oculos', 60)
    # a ligação visual acima usa a ordem fixa; os pares foram escritos já embaralhados
    L.add('m0-tripe', 'conheça os instrumentos', tripe)

    def tec(L):
        c = titulo('Conheça o teclado', 'um instrumento com 88 teclas ou menos!', 520)
        c += '<div style="margin:8px 0">' + teclado_partes(640) + '</div>'
        c += '<div class="col2" style="gap:6px 16px">' + ''.join(f'<div class="row" style="gap:10px"><span style="flex:none;width:30px;height:30px;border:2.5px solid #111;border-radius:50%;text-align:center;line-height:25px;font-weight:800">{n}</span><b style="font-size:13px">{t}</b></div>' for n, t in [(1, 'visor (mostra o som e o volume)'), (2, 'botões de volume e sons'), (3, 'teclas brancas'), (4, 'teclas pretas'), (5, 'uma oitava (7 teclas brancas)'), (6, 'botões de ritmos e efeitos')]) + '</div>'
        c += '<div class="row" style="gap:16px;margin-top:10px"><div class="box" style="flex:1;padding:10px 16px;text-align:center">' + pedal_svg(96) + '<div class="m" style="font-size:13px;margin-top:4px">PEDAL DE SUSTENTAÇÃO</div><div style="font-size:11.5px">prende o som depois que você solta a tecla.</div></div>'
        c += '<div class="box" style="flex:1.4;padding:10px 16px"><div class="m" style="font-size:13px;margin-bottom:4px">TECLADO, PIANO OU PIANO ELÉTRICO?</div><div style="font-size:12px">O <b>piano</b> tem cordas e martelos dentro. O <b>teclado</b> é eletrônico e imita vários instrumentos. O <b>piano digital</b> é eletrônico com teclas pesadas. As teclas e as notas são as mesmas nos três!</div></div></div>'
        c += box('<b>Desafio:</b> procure um teclado ou piano de verdade (ou o do app) e aperte <b>só uma tecla branca e uma preta</b>. Qual soa mais grave: a da esquerda ou a da direita? <span class="dots" style="display:inline-block;width:100px;vertical-align:bottom"></span>', style='margin-top:10px;font-size:13px')
        L.gab('m0-teclado', 'conheça o teclado (pág. {pg})', 'quanto mais para a esquerda, mais grave o som; para a direita, mais agudo.')
        return c + corner('feliz', 56)
    L.add('m0-teclado', 'conheça os instrumentos', tec)

    def vio(L):
        c = titulo('Conheça o violão', 'as partes do instrumento mais amigo da música', 560)
        c += '<div class="row" style="gap:24px;align-items:flex-start"><div style="width:250px;flex:none">' + violao_partes(True, 250) + '</div><div style="flex:1">'
        partes = [(1, 'cabeça', 'onde ficam as tarraxas'), (2, 'tarraxas', 'giram para afinar as cordas'), (3, 'braço', 'onde a mão esquerda aperta as cordas'), (4, 'trastes', 'as barrinhas de metal: cada espaço é uma casa'), (5, 'cordas', 'são 6: as de baixo são mais grossas'), (6, 'corpo', 'a “caixa” que faz o som crescer'), (7, 'boca', 'o buraco redondo por onde o som sai'), (8, 'cavalete', 'onde as cordas ficam presas')]
        for n, t, d in partes:
            c += f'<div class="row" style="gap:10px;margin-bottom:9px"><span style="flex:none;width:30px;height:30px;border:2.5px solid #111;border-radius:50%;text-align:center;line-height:25px;font-weight:800">{n}</span><div><b style="font-size:14px">{t}</b><div style="font-size:11.8px;color:#333;line-height:1.25">{d}</div></div></div>'
        c += '</div></div>'
        c += box('<b>Desafio:</b> com a ajuda de um adulto, olhe um violão de verdade e conte: quantas cordas? <span class="dots" style="display:inline-block;width:70px;vertical-align:bottom"></span> Quantos trastes você vê? <span class="dots" style="display:inline-block;width:70px;vertical-align:bottom"></span> <span class="gray">(o violão clássico costuma ter 19; o de aço, 20 a 21)</span>', style='margin-top:12px;font-size:13px')
        c += box('<b>Violão ou guitarra?</b> O violão tem 6 cordas e o som sai da caixa. A guitarra elétrica também tem 6 cordas, mas precisa de amplificador. A <b>cifra</b> e os acordes deste livro servem para os dois!', style='margin-top:8px;font-size:12.8px')
        return c + corner('feliz', 56)
    L.add('m0-violao', 'conheça os instrumentos', vio)

    def ligue(L):
        c = titulo('Quem é quem?', 'ligue cada pista ao instrumento', 400)
        pistas = [('tem 88 teclas brancas e pretas', 'teclado'), ('tem 6 cordas e um buraco redondo', 'violão'), ('usa baquetas e pratos', 'bateria'), ('é preciso soprar para tocar', 'flauta'), ('tem teclas e um pedal de sustentação', 'piano'), ('as cordas são tocadas com um arco', 'violino')]
        dire = ['violão', 'violino', 'teclado', 'bateria', 'flauta', 'piano']
        for i, (p, r) in enumerate(pistas):
            c += (f'<div style="display:flex;align-items:center;margin-bottom:11px"><div class="box" style="flex:0 0 50%;height:70px;display:flex;align-items:center;padding:6px 16px;border-radius:16px;font-weight:700;font-size:13.5px">{p}</div>'
                  f'<div style="width:15px;height:15px;border-radius:50%;background:#111;margin-left:10px"></div><div style="flex:1"></div><div style="width:15px;height:15px;border-radius:50%;background:#111;margin-right:10px"></div>'
                  f'<div class="box" style="flex:0 0 28%;height:70px;display:flex;align-items:center;justify-content:center;border-radius:40px;font-family:Marker;font-size:19px">{dire[i].upper()}</div></div>')
        c += lab('melodia ou harmonia? marque M ou H')
        for inst, r in [('flauta (toca uma nota de cada vez)', 'M'), ('violão tocando um acorde', 'H'), ('voz cantando uma canção', 'M'), ('teclado tocando 3 teclas juntas', 'H')]:
            c += f'<div class="row" style="gap:10px;margin-bottom:5px;font-size:13px"><span class="ck big"></span> M &nbsp; <span class="ck big"></span> H &nbsp; <span>{inst}</span></div>'
        mapa = {'a': 'violão', 'b': 'violino', 'c': 'teclado', 'd': 'bateria', 'e': 'flauta', 'f': 'piano'}
        L.gab('m0-ligue', 'quem é quem? (pág. {pg})', ' · '.join(f'{p} → {r}' for p, r in pistas) + '. melodia ou harmonia: M · H · M · H.')
        return c + corner('timido', 56)
    L.add('m0-ligue', 'conheça os instrumentos', ligue)

    def arte(n, pid):
        def f(L):
            return f'<section class="page full"><img src="img/color{n}.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply"><div class="ft"><span>{FOOT}</span><span>{L.pg(pid)}</span></div></section>'
        return f
    L.add('color1', 'para colorir', arte(1, 'color1'), 'raw')

    # ================= AULA 1 =================
    def som(L):
        c = titulo('Aula 1: o som tem altura', 'sons graves e sons agudos', 480)
        c += fala('alguns sons são <b>graves</b> (baixos, “grossos”) e outros são <b>agudos</b> (altos, “fininhos”). isso se chama <b>altura</b> do som.', 'ouve')
        c += '<div class="col2" style="gap:12px"><div class="box center" style="padding:10px;border-radius:18px"><div class="m" style="font-size:18px">GRAVE</div><div style="font-size:12.5px">trovão, tuba, bumbo, voz de gigante</div><div style="font-size:42px;line-height:1.1">⬇</div></div><div class="box center" style="padding:10px;border-radius:18px"><div class="m" style="font-size:18px">AGUDO</div><div style="font-size:12.5px">apito, passarinho, flauta, voz de bebê</div><div style="font-size:42px;line-height:1.1">⬆</div></div></div>'
        c += lab('no teclado: esquerda = grave · direita = aguda')
        c += '<div class="center">' + keyboard('C3', 'B5', marks={}, W=29, H=96, dot_c=True) + '</div><div class="row" style="justify-content:space-between;font-weight:800;font-size:13px;margin-top:3px"><span>← mais grave</span><span>mais aguda →</span></div>'
        c += lab('1. grave ou agudo? circule')
        itens = [('trovão', 'G'), ('apito de árbitro', 'A'), ('tambor grande', 'G'), ('passarinho', 'A'), ('sino pequenininho', 'A'), ('tuba', 'G')]
        c += '<div class="col2" style="gap:6px 16px">' + ''.join(f'<div class="row" style="gap:10px;font-size:13.5px"><b style="width:140px">{t}</b><span class="pill">grave</span><span class="pill">agudo</span></div>' for t, _ in itens) + '</div>'
        c += lab('2. qual som é mais agudo? o 1 ou o 2?')
        pares = [((52, 67), 2), ((71, 55), 1), ((60, 57), 1)]
        c += '<div class="col3" style="gap:8px">'
        for (a, b), r in pares:
            c += f'<div class="box center" style="padding:6px 6px;border-radius:14px">{keyboard("C3", "B4", marks={a: "1", b: "2"}, W=14, H=58, dot_c=False, label_size=9)}<div class="row" style="justify-content:center;gap:12px;margin-top:4px"><span class="ck r"></span> 1 &nbsp; <span class="ck r"></span> 2</div></div>'
        c += '</div>'
        L.gab('m1-som', 'o som tem altura (pág. {pg})', 'grave: trovão, tambor grande e tuba · agudo: apito, passarinho e sino. mais agudo: 2 (sol) · 1 (si) · 1 (dó).')
        return c + corner('ouve', 56)
    L.add('m1-som', 'aula 1 · as notas', som)

    def sete(L):
        c = titulo('As 7 notas musicais', 'dó · ré · mi · fá · sol · lá · si', 460)
        c += fala('a música usa só <b>7 nomes de notas</b>. depois do <b>si</b>, tudo recomeça no <b>dó</b>, só que mais agudo. é como os dias da semana!', 'musica', 'r')
        c += '<div style="display:flex;gap:7px;justify-content:space-between">' + ''.join(f'<div class="box center" style="flex:1;padding:8px 2px;border-radius:14px"><div class="num" style="font-size:15px">{i+1}</div><div class="m" style="font-size:21px">{SYL[n].upper()}</div></div>' for i, n in enumerate(NOTAS7)) + '</div>'
        c += '<div class="center" style="margin:12px 0 4px">' + keyboard('C4', 'C5', marks={}, W=60, H=112, names='syl') + '</div>'
        c += '<div class="center m" style="font-size:20px">DÓ  RÉ  MI  FÁ  SOL  LÁ  SI  DÓ ↺</div>'
        c += lab('1. complete a sequência')
        c += '<div class="row" style="justify-content:center;gap:8px">' + ''.join(f'<div class="box center" style="width:78px;height:50px;line-height:44px;font-family:Marker;font-size:18px;border-radius:12px">{t}</div>' for t in ['DÓ', 'RÉ', '', 'FÁ', '', 'LÁ', '', 'DÓ']) + '</div>'
        c += lab('2. qual nota vem depois? escreva')
        for a in ['mi', 'lá', 'si', 'sol']:
            c += f'<div class="row" style="gap:10px;margin-bottom:6px;font-size:14px"><span>depois do <b>{a}</b> vem o</span><span class="dots" style="width:120px"></span></div>'
        c += lab('3. qual nota vem antes? escreva')
        for a in ['ré', 'fá', 'dó']:
            c += f'<div class="row" style="gap:10px;margin-bottom:6px;font-size:14px"><span>antes do <b>{a}</b> vem o</span><span class="dots" style="width:120px"></span><span class="gray" style="font-size:11.5px">{"(antes do dó vem o si)" if a=="dó" else ""}</span></div>'
        L.gab('m1-sete', 'as 7 notas (pág. {pg})', 'sequência: dó ré mi fá sol lá si dó. depois: mi→fá · lá→si · si→dó · sol→lá. antes: ré→dó · fá→mi · dó→si.')
        return c + corner('musica', 56)
    L.add('m1-sete', 'aula 1 · as notas', sete)

    def tecl(L):
        c = titulo('O teclado e o dó', 'as teclas pretas ensinam onde cada nota mora', 540)
        c += fala('as teclas pretas aparecem em <b>grupos de 2</b> e <b>grupos de 3</b>. esses grupos são o mapa do teclado: com eles, você acha qualquer nota!', 'pensa')
        c += '<div class="center">' + keyboard('C3', 'B4', marks={}, W=44, H=120, dot_c=False) + '</div>'
        c += '<div class="col2" style="gap:12px;margin-top:8px">' + box('<b>grupo de 2 pretas</b><br>a tecla branca logo <b>à esquerda</b> do grupo de 2 é o <b class="m">DÓ</b>.', style='font-size:13px') + box('<b>grupo de 3 pretas</b><br>a tecla branca logo <b>à esquerda</b> do grupo de 3 é o <b class="m">FÁ</b>.', style='font-size:13px') + '</div>'
        c += lab('1. pinte todos os DÓs', True)
        c += '<div class="center">' + keyboard('C3', 'B5', marks={}, W=29, H=88, dot_c=False) + '</div>'
        c += lab('2. pinte todos os FÁs')
        c += '<div class="center">' + keyboard('C3', 'B5', marks={}, W=29, H=88, dot_c=False) + '</div>'
        c += lab('3. circule só os grupos de 3 pretas') + '<div class="center">' + keyboard('C3', 'B5', marks={}, W=29, H=88, dot_c=False) + '</div>'
        L.gab('m1-tecl', 'o teclado e o dó (pág. {pg})', 'dós: a tecla branca à esquerda de cada grupo de 2 pretas (um dó por oitava: 3 no teclado desenhado). fás: a tecla à esquerda de cada grupo de 3 pretas (também 3).')
        return c + corner('pensa', 56)
    L.add('m1-tecl', 'aula 1 · o teclado', tecl)

    def nomes(L):
        c = titulo('Escreva o nome das notas', 'use o dó como ponto de partida', 460)
        c += '<p>Ache o <b>dó</b> (à esquerda do grupo de 2) e escreva o nome de cada tecla branca nas caixinhas.</p>'
        blank = set(m for m in range(60, 84) if m % 12 in (0, 2, 4, 5, 7, 9, 11)) - {60}
        c += '<div class="center">' + keyboard('C4', 'B5', marks={60: 'dó'}, W=44, H=126, dot_c=False, names=None, blank=blank) + '</div>'
        c += lab('agora é com você: tecla marcada, qual é a nota?')
        sel = [('E4', 'mi'), ('G4', 'sol'), ('B4', 'si'), ('D4', 'ré'), ('A4', 'lá'), ('F4', 'fá')]
        c += '<div class="col3" style="gap:10px">'
        for n, s in sel:
            c += f'<div class="box center" style="padding:8px;border-radius:14px">{keyboard("C4", "B4", marks={midi(n): "?"}, W=24, H=72, dot_c=False)}<div class="row" style="gap:6px;justify-content:center;margin-top:4px"><b>é o</b><div class="dots" style="width:70px"></div></div></div>'
        c += '</div>'
        c += lab('sobe e desce: escreva a nota que fica...')
        for q, a in [('uma tecla branca à DIREITA do mi', 'fá'), ('uma tecla branca à ESQUERDA do sol', 'fá'), ('duas teclas brancas à DIREITA do dó', 'mi'), ('três teclas brancas à ESQUERDA do lá', 'mi')]:
            c += f'<div class="row" style="gap:10px;margin-bottom:5px;font-size:13.5px"><span>{q}:</span><div class="dots" style="width:100px"></div></div>'
        L.gab('m1-nomes', 'escreva o nome das notas (pág. {pg})', 'dó ré mi fá sol lá si dó ré mi fá sol lá si (da esquerda para a direita). teclas marcadas: mi · sol · si · ré · lá · fá. sobe e desce: fá · fá · mi · mi.')
        return c + corner('feliz', 56)
    L.add('m1-nomes', 'aula 1 · escreva as notas', nomes)

    def cifras(L):
        c = titulo('Cifras: as notas em letras', 'o alfabeto da música', 380)
        c += fala('os músicos também escrevem as notas com <b>letras</b>! a gente chama isso de <b>cifra</b>. o <b>lá</b> é a letra <b>A</b>, e daí é só seguir o alfabeto até o <b>G</b>.', 'oculos')
        ordem = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
        c += '<div style="display:flex;gap:7px">' + ''.join(f'<div class="box center" style="flex:1;padding:6px 2px;border-radius:14px"><div class="m" style="font-size:16px">{SYL[n].upper()}</div><div class="cf" style="font-size:30px">{n}</div></div>' for n in ordem) + '</div>'
        c += '<div class="center" style="margin:8px 0 4px">' + keyboard('C4', 'C5', marks={}, W=60, H=100, names='let') + '</div>'
        c += box('<b>Atenção!</b> a cifra começa no <b>A (lá)</b>, não no dó: A B C D E F G. Mas a escala mais usada começa no <b>C (dó)</b>. Dica: <b>C = dó</b> (de “C”onheço o dó!).', style='margin:8px 0;font-size:12.8px')
        c += lab('1. ligue a nota à cifra')
        notas = ['sol', 'dó', 'si', 'ré', 'lá', 'mi', 'fá']
        cif = {'sol': 'G', 'dó': 'C', 'si': 'B', 'ré': 'D', 'lá': 'A', 'mi': 'E', 'fá': 'F'}
        dire = ['A', 'E', 'G', 'F', 'D', 'C', 'B']
        for i, n in enumerate(notas):
            c += f'<div style="display:flex;align-items:center;margin-bottom:4px"><div class="box" style="flex:0 0 28%;padding:3px 14px;border-radius:30px;font-weight:800">{n}</div><div style="width:12px;height:12px;border-radius:50%;background:#111;margin-left:8px"></div><div style="flex:1"></div><div style="width:12px;height:12px;border-radius:50%;background:#111;margin-right:8px"></div><div class="box cf" style="flex:0 0 14%;padding:3px 14px;border-radius:30px;text-align:center;font-size:17px">{dire[i]}</div></div>'
        c += lab('2. escreva as cifras')
        for q, a in [('dó · mi · sol', 'C E G'), ('lá · dó · mi', 'A C E'), ('fá · lá · dó', 'F A C')]:
            c += f'<div class="row" style="gap:10px;margin-bottom:5px;font-size:13.5px"><b style="width:130px">{q}</b><span>→</span><div class="dots" style="width:130px"></div></div>'
        L.gab('m1-cifras', 'cifras (pág. {pg})', 'ligue: ' + ' · '.join(f'{n} → {cif[n]}' for n in notas) + '. cifras: C E G · A C E · F A C.')
        return c + corner('timido', 56)
    L.add('m1-cifras', 'aula 1 · cifras', cifras)

    def achar(L):
        c = titulo('Ache a nota!', 'olhe a tecla pintada e circule o nome certo', 520)
        rnd = random.Random(9)
        alvo = ['C4', 'E4', 'G4', 'B4', 'D4', 'F4', 'A4', 'C5', 'E5', 'D5']
        rnd.shuffle(alvo); alvo = alvo[:8]
        resp = []
        c += '<div class="col2" style="gap:10px">'
        for i, n in enumerate(alvo):
            letters = [n[0]]
            while len(letters) < 3:
                x = rnd.choice(NOTAS7)
                if x not in letters: letters.append(x)
            rnd.shuffle(letters)
            c += f'<div class="box" style="padding:8px 10px;border-radius:14px"><span class="num">{i+1}</span><div class="center">{keyboard("C4", "E5", marks={midi(n): "?"}, W=22, H=70, dot_c=False)}</div><div class="row" style="justify-content:center;gap:12px;margin-top:5px;font-weight:800;font-size:13.5px">' + ''.join(f'<span class="pill">{SYL[l]}</span>' for l in letters) + '</div></div>'
            resp.append(SYL[n[0]])
        c += '</div>'
        c += tip('use o <b>dó</b> (esquerda do grupo de 2 pretas) e o <b>fá</b> (esquerda do grupo de 3) como pontos de referência.')
        L.gab('m1-achar', 'ache a nota! (pág. {pg})', ' · '.join(f'{i+1}: {r}' for i, r in enumerate(resp)) + '.')
        return c + corner('vibra', 56)
    L.add('m1-achar', 'aula 1 · jogo', achar)

    def oit(L):
        c = titulo('Oitavas e dó central', 'a mesma nota, mais grave ou mais aguda', 480)
        c += '<p>Do <b>dó</b> até o próximo <b>dó</b> existem <b>8 notas</b> e esse espaço se chama <b>oitava</b> (octo = oito). O dó mais ou menos no meio do teclado é o <b>dó central</b>: o ponto de partida de quase tudo.</p>'
        c += '<div class="center">' + keyboard('C3', 'C6', marks={48: 'dó 3', 60: 'dó central', 72: 'dó 5', 84: 'dó 6'}, W=27, H=100, dot_c=False, label_size=8) + '</div>'
        c += '<div class="row" style="justify-content:space-between;font-size:12px;font-weight:800;margin-top:4px"><span>graves</span><span>oitava</span><span>agudos</span></div>'
        c += lab('1. quantas teclas brancas tem uma oitava (de um dó até o próximo, sem contar o segundo)?') + '<div class="dots" style="width:100px"></div>'
        c += lab('2. quantas teclas pretas?') + '<div class="dots" style="width:100px"></div>'
        c += lab('3. sobe e desce no teclado')
        qs = [('comece no dó e ande 3 teclas brancas para a direita', 'fá'), ('comece no mi e ande 4 teclas brancas para a direita', 'lá'), ('comece no sol e ande 2 teclas brancas para a direita', 'si'), ('comece no lá e ande 3 teclas brancas para a esquerda', 'mi')]
        for q, a in qs:
            c += f'<div class="row" style="gap:10px;margin-bottom:6px;font-size:13.2px"><span style="flex:1">{q}:</span><div class="dots" style="width:90px"></div></div>'
        c += lab('4. toque e marque')
        c += '<div style="font-size:13px">' + ''.join(f'<div style="margin-bottom:5px"><span class="ck big"></span> toquei o dó {n} e depois o dó {m}: o segundo soa <b>mais agudo</b>!</div>' for n, m in [('central', 'agudo (5)'), ('3', 'central')]) + '</div>'
        L.gab('m1-oit', 'oitavas e dó central (pág. {pg})', 'teclas brancas: 7 · teclas pretas: 5. sobe e desce: fá · lá · si · mi.')
        return c + corner('musica', 56)
    L.add('m1-oit', 'aula 1 · oitavas', oit)
