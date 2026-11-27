#!/usr/bin/env python3
"""Gera os prêmios do passe em assets/premios/ a partir da arte oficial do Paul (assets/originals, que não vai pro site):
1 banner e o PDF de colorir (3 folhas); os wallpapers são da Bea. Uso: python3 scripts/premios-gerar.py"""
import os, random, math
from PIL import Image, ImageDraw, ImageFilter

RAIZ = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
HD = os.path.join(RAIZ, "assets/originals/paul-png/coloridos-hd")
PAG = os.path.join(RAIZ, "assets/originals/paul-png/pra-colorir/paginas")
LOGO = os.path.join(RAIZ, "marketing/cards-paul/img/logo-roboterista-paul-branco.png")
SAIDA = os.path.join(RAIZ, "assets/premios")
os.makedirs(SAIDA, exist_ok=True)
NAVY, VINHO, OURO = (13, 21, 48), (122, 20, 40), (246, 201, 59)


def degrade(w, h, topo, base):
    im = Image.new("RGB", (w, h)); px = im.load()
    for y in range(h):
        t = y / (h - 1)
        c = tuple(int(topo[i] + (base[i] - topo[i]) * t) for i in range(3))
        for x in range(w): px[x, y] = c
    return im


def brilho(im, cx, cy, raio, cor, alfa):
    glow = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(glow)
    for r in range(raio, 0, -6):
        a = int(alfa * (1 - r / raio) ** 1.6)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=cor + (a,))
    return Image.alpha_composite(im.convert("RGBA"), glow)


def ponteado(im, passo, alfa=22):
    cam = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(cam)
    for y in range(passo // 2, im.height, passo):
        for x in range(passo // 2 + (passo // 2 if (y // passo) % 2 else 0), im.width, passo):
            d.ellipse((x - 2, y - 2, x + 2, y + 2), fill=(255, 255, 255, alfa))
    return Image.alpha_composite(im, cam)


def estrela(d, cx, cy, r, cor):
    pts = []
    for k in range(10):
        ang = -math.pi / 2 + k * math.pi / 5; rr = r if k % 2 == 0 else r * 0.42
        pts.append((cx + rr * math.cos(ang), cy + rr * math.sin(ang)))
    d.polygon(pts, fill=cor)


def estrelas(im, n, area, seed):
    rnd = random.Random(seed); cam = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(cam)
    for _ in range(n):
        x = rnd.randint(area[0], area[2]); y = rnd.randint(area[1], area[3]); r = rnd.randint(10, 26)
        estrela(d, x, y, r, (OURO if rnd.random() < .6 else (255, 255, 255)) + (rnd.randint(110, 200),))
    return Image.alpha_composite(im, cam)


def paul(nome, altura):
    p = Image.open(os.path.join(HD, f"paul-{nome}.png")).convert("RGBA")
    box = p.getbbox(); p = p.crop(box)
    return p.resize((int(p.width * altura / p.height), altura), Image.LANCZOS)


def sombra(im, cx, y, larg):
    s = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(s)
    d.ellipse((cx - larg // 2, y - 22, cx + larg // 2, y + 22), fill=(0, 0, 0, 120))
    return Image.alpha_composite(im, s.filter(ImageFilter.GaussianBlur(14)))


def logo(largura):
    l = Image.open(LOGO).convert("RGBA"); l = l.crop(l.getbbox())
    return l.resize((largura, int(l.height * largura / l.width)), Image.LANCZOS)


def wallpaper(nome, arquivo, semente, topo, base):
    W, H = 1080, 2340
    im = degrade(W, H, topo, base).convert("RGBA")
    im = ponteado(im, 54)
    im = brilho(im, W // 2, 1450, 640, OURO, 90)
    im = estrelas(im, 26, (40, 520, W - 40, 2100), semente)
    p = paul(nome, 1000)
    if p.width > W - 80: p = p.resize((W - 80, int(p.height * (W - 80) / p.width)), Image.LANCZOS)
    y = 2070 - p.height  # os pés ficam acima do logo e da barra do celular
    im = sombra(im, W // 2, y + p.height - 6, int(p.width * .55))
    im.alpha_composite(p, ((W - p.width) // 2, y))
    l = logo(360); im.alpha_composite(l, ((W - l.width) // 2, 2150))
    im.convert("RGB").save(os.path.join(SAIDA, arquivo), "JPEG", quality=90, optimize=True)


# os 12 wallpapers são os da Bea (assets/premios/wallpaper-NN-*.jpg, copiados do que ela mandou): este script NÃO gera mais wallpaper.

# banners e planners: os que a Bea mandou (assets/premios/banner-*.png e planner-*.jpg), não são gerados aqui.

# colorir: 3 folhas A4 em um PDF
paginas = [Image.open(os.path.join(PAG, f"colorir-paul-{n}.png")).convert("L").resize((1654, 2339), Image.LANCZOS).convert("RGB") for n in ("bateria", "breakdance", "bastidores")]
paginas[0].save(os.path.join(SAIDA, "colorir-paul-3-folhas.pdf"), "PDF", resolution=200, save_all=True, append_images=paginas[1:])
paginas[0].resize((360, 509), Image.LANCZOS).save(os.path.join(SAIDA, "colorir-paul-mini.jpg"), "JPEG", quality=82, optimize=True)
print(sorted(os.listdir(SAIDA)))
