#!/usr/bin/env python3
"""Gera os webp leves do app (assets/paul/colorido) a partir dos Pauls em alta (assets/originals/paul-png/coloridos-hd) e dos recortes das folhas (coloridos-media).
Uso: python3 scripts/paul-colorido-webp.py [nome ...]   (sem nome = todos). Branco sólido, recorte pelo contorno, 560 px."""
import glob, os, sys
from PIL import Image
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
so = set(sys.argv[1:])
# coloridos-media = recortes das folhas de 8 (uns 450 px); se existir o mesmo nome em alta, vale o em alta
fontes = {os.path.basename(f): f for d in ('coloridos-media', 'coloridos-hd') for f in glob.glob(os.path.join(RAIZ, f'assets/originals/paul-png/{d}/paul-*.png'))}
for f in (fontes[k] for k in sorted(fontes)):
    nome = os.path.basename(f)[5:-4]
    if so and nome not in so: continue
    r, g, b, a = Image.open(f).convert('RGBA').split()
    a = a.point(lambda v: 0 if v < 10 else (255 if v >= 232 else v))
    im = Image.merge('RGBA', (r, g, b, a)).crop(a.point(lambda v: 255 if v > 40 else 0).getbbox())
    im.thumbnail((560, 560), Image.LANCZOS)
    out = os.path.join(RAIZ, f'assets/paul/colorido/paul-{nome}.webp')
    im.save(out, 'WEBP', quality=84, method=6)
    print(nome, im.size, os.path.getsize(out))
