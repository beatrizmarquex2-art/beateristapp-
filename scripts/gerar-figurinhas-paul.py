"""Gera as figurinhas do Paul (fotos P01..P13 em assets/figurinhas/fotos, miniaturas em mini e catalogo-paul.json).
Uso: python3 scripts/gerar-figurinhas-paul.py PASTA_COM_AS_6_ARTES_PNG_TRANSPARENTES   (os PNGs na ordem: amp, andando, breakdance, baqueta, agachado, skate)
O fundo (papel creme, retícula, bloco de cor, raios e rabiscos) é desenhado aqui; o Paul entra por cima com contorno creme e sombra."""
import sys, os, json, glob, hashlib, math, random
from PIL import Image, ImageDraw, ImageFilter, ImageChops
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1]
W, H = 1152, 1536
NAVY, VINHO, CREME, MOSTARDA = (20, 40, 75), (154, 18, 38), (251, 243, 224), (246, 213, 106)
NOMES = ['amp', 'andando', 'breakdance', 'baqueta', 'agachado', 'skate', 'maestro', 'dj', 'gravando', 'professor', 'selfie', 'oculos', 'metronomo']
FRASES = ['encostado no amp', 'indo pro ensaio', 'passo de breakdance', 'a baqueta no dedo', 'no groove', 'virando o skate', 'regendo a banda', 'no toca-discos', 'gravando a voz', 'dando aula', 'selfie com o case', 'de óculos escuros', 'no tempo do metrônomo']
TEMAS = [(NAVY, VINHO), (VINHO, NAVY), (NAVY, MOSTARDA), (VINHO, CREME), (NAVY, VINHO), (VINHO, MOSTARDA), (MOSTARDA, VINHO), (NAVY, MOSTARDA), (VINHO, MOSTARDA), (NAVY, CREME), (MOSTARDA, NAVY), (VINHO, NAVY), (NAVY, VINHO)]
MODELOS = [('E01', 'M7'), ('E02', 'M8'), ('E03', 'M7'), ('E04', 'M8'), ('E01', 'M7'), ('E02', 'M8'), ('E03', 'M7'), ('E04', 'M8'), ('E01', 'M7'), ('E02', 'M8'), ('E03', 'M7'), ('E04', 'M8'), ('E01', 'M7')]
# 2º argumento (opcional): a partir de qual figurinha gerar (0 = P01). Com 6, gera só P07 em diante e junta no catálogo sem refazer as antigas.
INI = int(sys.argv[2]) if len(sys.argv) > 2 else 0

def fundo(i, bloco, acento):
    rnd = random.Random(300 + i)
    im = Image.new('RGB', (W, H), CREME); d = ImageDraw.Draw(im)
    for y in range(0, H, 22):  # retícula
        for x in range(0, W, 22): d.ellipse((x, y, x + 5, y + 5), fill=(228, 218, 196))
    cx, cy = W // 2, int(H * .52)
    for k in range(18):  # raios
        a0 = k * 20 + 5; a1 = a0 + 10
        d.polygon([(cx, cy)] + [(cx + 1500 * math.cos(math.radians(a)), cy + 1500 * math.sin(math.radians(a))) for a in (a0, a1)], fill=(244, 234, 208))
    blob = Image.new('RGBA', (W, H), (0, 0, 0, 0)); b = ImageDraw.Draw(blob)  # bloco de cor torto
    b.rounded_rectangle((90, 250, W - 90, H - 230), 90, fill=bloco + (255,))
    blob = blob.rotate(-4 + i % 3 * 3, resample=Image.BICUBIC, center=(cx, cy)); im.paste(blob, (0, 0), blob)
    d = ImageDraw.Draw(im)
    for k in range(7):  # listras de acento
        y = 300 + k * 26; d.line((60, y, 260, y - 12), fill=acento, width=9); d.line((W - 260, H - y, W - 60, H - y + 12), fill=acento, width=9)
    for _ in range(14):  # estrelinhas e riscos
        x, y = rnd.randint(40, W - 40), rnd.choice([rnd.randint(40, 230), rnd.randint(H - 230, H - 40)]); r = rnd.randint(14, 30)
        d.polygon([(x + r * math.cos(math.radians(a * 36 - 90)) * (1 if a % 2 == 0 else .42), y + r * math.sin(math.radians(a * 36 - 90)) * (1 if a % 2 == 0 else .42)) for a in range(10)], fill=rnd.choice([acento, NAVY, VINHO]))
    return im

def contorno(img, raio, cor):
    a = img.getchannel('A').filter(ImageFilter.MaxFilter(raio * 2 + 1))
    base = Image.new('RGBA', img.size, cor + (0,)); base.putalpha(a); return base

arquivos = sorted(glob.glob(os.path.join(SRC, '*.png')))
assert len(arquivos) == len(NOMES) - INI, f'esperava {len(NOMES) - INI} PNGs em {SRC}, achei {len(arquivos)}'
CAT = os.path.join(ROOT, 'assets/figurinhas/catalogo-paul.json')
cat = json.load(open(CAT))[:INI] if INI else []
for i, f in enumerate(arquivos, INI):
    bloco, acento = TEMAS[i]; im = fundo(i, bloco, acento)
    p = Image.open(f).convert('RGBA'); p = p.crop(p.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox())
    s = min(980 / p.width, 1020 / p.height); p = p.resize((round(p.width * s), round(p.height * s)), Image.LANCZOS)
    pad = 16; tela = Image.new('RGBA', (p.width + pad * 2, p.height + pad * 2), (0, 0, 0, 0)); tela.paste(p, (pad, pad), p)
    borda = contorno(tela, 9, CREME)
    sombra = Image.new('RGBA', tela.size, (0, 0, 0, 0)); sombra.putalpha(borda.getchannel('A').point(lambda a: int(a * .45))); sombra = sombra.filter(ImageFilter.GaussianBlur(12))
    x = (W - tela.width) // 2; y = int(H * .52 - tela.height / 2) + 30
    im.paste(sombra, (x + 8, y + 18), sombra); im.paste(borda, (x, y), borda); im.paste(tela, (x, y), tela)
    cod = f'P{i + 1:02d}'; foto = os.path.join(ROOT, 'assets/figurinhas/fotos', cod + '.jpeg'); im.save(foto, quality=86, optimize=True)
    im.resize((270, 360), Image.LANCZOS).save(os.path.join(ROOT, 'assets/figurinhas/mini', cod + '.webp'), quality=80)
    fx0, fy0 = x / W, y / H; fx1, fy1 = (x + tela.width) / W, (y + tela.height) / H
    mod, mod2 = MODELOS[i]
    cat.append({'codigo': cod, 'artista_banda': 'Robôterista Paul', 'colecao': 'Beaterista', 'raridade': 'Exclusiva', 'modelo': mod,
        'sha256': hashlib.sha256(open(foto, 'rb').read()).hexdigest(), 'largura_px': W, 'altura_px': H, 'status': 'identificado', 'nota': FRASES[i],
        'criterio_raridade': 'Paul, o robozinho da Beaterista: exclusivas junto com as fotos da Bea (pedido da Bea)', 'foto': f'assets/figurinhas/fotos/{cod}.jpeg',
        'modelo2': mod2, 'rostos': [], 'foco': [round(fx0, 3), round(fy0, 3), round(fx1, 3), round(fy1, 3)], 'secao': 'Beaterista'})
    print(cod, FRASES[i], os.path.getsize(foto) // 1024, 'KB')
json.dump(cat, open(CAT, 'w'), ensure_ascii=False, indent=1)
