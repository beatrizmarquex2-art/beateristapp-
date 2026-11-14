#!/usr/bin/env python3
"""Gera os webp leves do app (assets/paul/colorido) a partir dos Pauls em alta (assets/originals/paul-png/coloridos-hd).
Uso: python3 scripts/paul-colorido-webp.py [nome ...]   (sem nome = todos). Branco sólido, recorte pelo contorno, 560 px."""
import glob, os, sys
from PIL import Image
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
so = set(sys.argv[1:])
for f in sorted(glob.glob(os.path.join(RAIZ, 'assets/originals/paul-png/coloridos-hd/paul-*.png'))):
    nome = os.path.basename(f)[5:-4]
    if so and nome not in so: continue
    r, g, b, a = Image.open(f).convert('RGBA').split()
    a = a.point(lambda v: 0 if v < 10 else (255 if v >= 232 else v))
    im = Image.merge('RGBA', (r, g, b, a)).crop(a.point(lambda v: 255 if v > 40 else 0).getbbox())
    im.thumbnail((560, 560), Image.LANCZOS)
    out = os.path.join(RAIZ, f'assets/paul/colorido/paul-{nome}.webp')
    im.save(out, 'WEBP', quality=84, method=6)
    print(nome, im.size, os.path.getsize(out))
