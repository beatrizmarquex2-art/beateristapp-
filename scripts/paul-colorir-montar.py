#!/usr/bin/env python3
"""Monta as folhas de colorir A4 (2480×3508): desenho em linha da Bea + um dos 4 fundos, sorteado (o sorteio fica em sorteio.json e não muda).
Desenhos originais: assets/originals/paul-png/pra-colorir/desenhos-originais/paul-NOME.png (fundo branco, como a Bea mandou).
Uso: python3 scripts/paul-colorir-montar.py   -> pra-colorir/desenhos/ (linha preta, fundo transparente, 2×), pra-colorir/paginas/ e o PDF."""
import glob, os, random
from PIL import Image, ImageDraw, ImageFont
# legenda de cada folha (a Bea liberou pôr texto em todas); sem legenda aqui = folha sem texto
LEG = {'acordeon': 'Paul no acordeon', 'amplificador': 'Paul no amplificador', 'baixo': 'Paul baixista', 'baqueta': 'Paul e a baqueta', 'bastidores': 'Paul nos bastidores',
 'bateria': 'Paul baterista', 'breakdance': 'Paul dançando', 'cajon': 'Paul no cajón', 'cajon-dupla': 'cajón em dupla', 'cajon-palco': 'Paul no palco', 'case': 'Paul indo pra aula',
 'colorindo': 'Paul colorindo', 'congas': 'Paul nas congas', 'ensinando': 'Paul ensinando um amigo', 'estudando': 'Paul estudando', 'guitarra': 'Paul guitarrista',
 'meditando': 'Paul meditando', 'metronomo': 'Paul e o metrônomo', 'microfone': 'Paul cantor', 'oculos': 'Paul de óculos', 'ouvindo-musica': 'Paul ouvindo música',
 'pad-metronomo': 'Paul treinando no pad', 'pad-treino': 'Paul treinando em casa', 'pandeiro': 'Paul no pandeiro', 'professor': 'Paul professor', 'sax': 'Paul saxofonista',
 'selfie': 'Paul na selfie', 'sonhando': 'Paul sonhando com música', 'teclado': 'Paul tecladista', 'teclado-dupla': 'tocando com um amigo', 'trompete': 'Paul trompetista',
 'ukulele': 'Paul no ukulele', 'violino': 'Paul violinista', 'xilofone': 'Paul no xilofone'}
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); P = os.path.join(RAIZ, 'assets/originals/paul-png/pra-colorir')
# área livre de cada fundo (x0, y0, x1, y1), a mesma que scripts/paul-colorir-fundos.mjs imprime
FUNDOS = {'1-limpo': (140, 440, 2340, 3108), '2-rabiscos': (330, 620, 2150, 2990), '3-caderno': (160, 700, 2320, 2828), '4-quadro': (240, 400, 2240, 3108)}
nomes = sorted(os.path.basename(f)[5:-4] for f in glob.glob(os.path.join(P, 'desenhos-originais/paul-*.png')))
# o fundo de cada desenho fica guardado em sorteio.json: quem já tem fundo não muda; desenho novo pega um dos menos usados
import json
ARQ = os.path.join(P, 'sorteio.json'); sorteio = json.load(open(ARQ)) if os.path.exists(ARQ) else {}
rnd = random.Random(7)
for n in nomes:
    if n not in sorteio:
        uso = {f: list(sorteio.values()).count(f) for f in FUNDOS}; sorteio[n] = rnd.choice([f for f in FUNDOS if uso[f] == min(uso.values())])
json.dump(sorteio, open(ARQ, 'w'), indent=1, ensure_ascii=False); ordem = [sorteio[n] for n in nomes]
for d in ('desenhos', 'paginas'): os.makedirs(os.path.join(P, d), exist_ok=True)
pags = []
for nome, fundo in zip(nomes, ordem):
    g = Image.open(os.path.join(P, f'desenhos-originais/paul-{nome}.png')).convert('L')
    g = g.resize((g.width * 2, g.height * 2), Image.LANCZOS)
    alfa = g.point(lambda v: 255 if v < 95 else (0 if v > 175 else int((175 - v) * 255 / 80)))  # só o traço; o branco vira transparente
    des = Image.new('RGBA', g.size, (0, 0, 0, 0)); des.putalpha(alfa); des = des.crop(alfa.getbbox())
    des.save(os.path.join(P, f'desenhos/paul-{nome}.png'))
    pag = Image.open(os.path.join(P, f'fundos/fundo-a4-{fundo}.png')).convert('RGB')
    x0, y0, x1, y1 = FUNDOS[fundo]
    if nome in LEG:  # legenda embaixo do desenho, dentro da área livre
        fz = 130; fonte = ImageFont.truetype(os.path.join(P, 'fontes/PermanentMarker.ttf'), fz); dr = ImageDraw.Draw(pag)
        while dr.textlength(LEG[nome].upper(), font=fonte) > (x1 - x0) * .94: fz -= 6; fonte = ImageFont.truetype(os.path.join(P, 'fontes/PermanentMarker.ttf'), fz)
        dr.text(((x0 + x1) // 2, y1 - 90), LEG[nome].upper(), font=fonte, fill=(17, 17, 17), anchor='mm'); y1 -= 200
    e = min((x1 - x0) / des.width, (y1 - y0) / des.height)
    d2 = des.resize((int(des.width * e), int(des.height * e)), Image.LANCZOS)
    pag.paste(d2, (x0 + (x1 - x0 - d2.width) // 2, y0 + (y1 - y0 - d2.height) // 2), d2)
    pag = pag.convert('L'); pag.save(os.path.join(P, f'paginas/colorir-paul-{nome}.png'), optimize=True); pags.append(pag); print(nome, fundo)
pags[0].save(os.path.join(P, 'robôterista-paul-pra-colorir.pdf'), save_all=True, append_images=pags[1:], resolution=300)
