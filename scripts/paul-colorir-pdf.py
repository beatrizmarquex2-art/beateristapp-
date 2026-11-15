#!/usr/bin/env python3
"""Monta o PDF final do livro "Robôterista Paul para colorir": capa P&B + folhas de 1 Paul + páginas temáticas (na ordem de EXTRAS).
Rodar depois de paul-colorir-montar.py e paul-colorir-extras.mjs. Saída: pra-colorir/robôterista-paul-para-colorir.pdf"""
import glob, os, re
from PIL import Image
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); P = os.path.join(RAIZ, 'assets/originals/paul-png/pra-colorir')
ids = re.findall(r"^  \['([a-z-]+)', '\d-", open(os.path.join(RAIZ, 'scripts/paul-colorir-extras.mjs')).read(), re.M)
fim = [i for i in ids if i in ('turma-toda', 'pintado-por')]; meio = [i for i in ids if i not in fim]
fs = [P + '/capas/capa-pdf-pb.png'] + sorted(glob.glob(P + '/paginas/*.png')) + [f'{P}/extras/colorir-{i}.png' for i in meio + fim]
pg = [Image.open(f).convert('L') for f in fs]
out = P + '/robôterista-paul-para-colorir.pdf'; pg[0].save(out, save_all=True, append_images=pg[1:], resolution=300)
print(len(pg), 'páginas', round(os.path.getsize(out) / 1e6, 1), 'MB')
